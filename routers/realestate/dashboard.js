const express = require("express")
const Router = express.Router()
const showError = require("../../modules/errormodule")
const { USER, CARD, CLUSTER, } = require("../../modules/db/db-user")
const passport = require("passport")
const isToday = require('date-fns/isToday')
const { payInvestmentFunc, payPTinvestments, res_locals } = require("../../modules/utitlites")

const transactionpath = "/transaction"

Router.use(async function(req, res, next) {
    // partnership is being populated on the user in deserialize
    try {
        if (req.isAuthenticated()) {
            if (req.user.deactivated) return res.send("your account has been deactivated, contact our support for further assistance")
            if (!isToday(req.user.checkedInvestmentStatus)) {
                // pay investors whose investments is due
                const investments = await CLUSTER.find({ user: req.user._id, expiry: { $lt: new Date().getTime() }, paid: false })
                let totalInc = 0;
                let activities;
                if (investments.length) {
                    totalInc = await (await payInvestmentFunc(investments)).totalInc
                    activities = await (await payInvestmentFunc(investments)).activities
                }
                await USER.updateOne({ _id: req.user._id }, { checkedInvestmentStatus: new Date(), $inc: { balance: totalInc }, $push: { activities: activities } })
                if (req.user.partnerships.length) {
                    await payPTinvestments(req.user.partnerships)
                }
            }
            await res_locals(res, req, transactionpath)
            return next()
        }
        return res.redirect("/pik-home/login")
    } catch (err) {
        console.log(err)
        next({ message: "an error occured internally, please report" })
    }
})


Router.get("/", function(req, res) {
    res.render("realestate/user/dashboard.ejs")
})

Router.get("/deposit", function(req, res) {
    res.render("realestate/user/deposit.ejs")
})

Router.get(transactionpath, function(req, res) {
    res.render("realestate/user/transaction.ejs")
})

Router.get("/withdraw", function(req, res) {
    res.render("realestate/user/withdraw.ejs")
})

Router.get("/invest", function(req, res) {
    res.render("realestate/user/invest.ejs")
})

Router.get("/account", function(_, res) {
    res.locals.activeTab = ""
    return res.render("realestate/user/account.ejs")
})
Router.get("/account:active_tab", function(req, res) {
    res.locals.activeTab = req.params.active_tab.slice(1)
    res.render("realestate/user/account.ejs")
})

/*
Complete signup
*/
Router.route("/registration")
    .get(function(req, res) {
        // redirect to dashboard if user has completed full res
        if (req.user.completeSignup) {
            return res.redirect("/dashboard")
        }
        return res.render("realestate/user/completeinfo.ejs")
    })
    .post(express.urlencoded({ extended: false }), async function(req, res) {
        // update the account found
        try {
            const response = await USER.updateOne({ email: req.user.email }, {...req.body, completeSignup: true })
            if (!req.body.skip) {
                await CARD.create(req.body)
            }
            return res.redirect("/dashboard")
        } catch (err) {
            return showError(req, "/dashboard/registration", err.message, res)
        }
    })

/*
deactivate account
account settings page
*/
Router.get("/deleteaccount", function(req, res) {
    try {
        const id = req.user._id
        req.logOut(async function(e) {
            console.log(e)
            await USER.updateOne({ _id: id }, { deactivated: true })
        })
        return res.send("sorry to see you leave")
    } catch (err) {
        console.log(err)
        return showError(req, "/dashboard/account", "An error occured deactivating account", res)
    }

})


Router.use(function(err, req, res, next) {
    console.log(err)
    return res.send("error occured internally, please report")
})
module.exports = Router