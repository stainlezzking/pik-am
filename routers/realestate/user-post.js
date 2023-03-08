const express = require("express")
const Router = express.Router()
const { CARD, USER, Transaction, CLUSTER, PTCLUSTER } = require("../../modules/db/db-user")
const showError = require("../../modules/errormodule")
const { addDays } = require('date-fns')
const { upload, cloudinary } = require("../../modules/fileupload-configuration");
const multer = require('multer')
const path = require("path")
const { MongooseError } = require("mongoose")
const passport = require("passport")



Router.use(express.urlencoded({ extended: false }))

/*
@ paywith new card - 
deposit card ** 
<users with no card>
*/
Router.post("/stripe-payment-new", async function(req, res) {
    try {
        deleted = !Boolean(req.body.save)
        await CARD.create({...req.body,
            deleted,
            user: req.user._id,
            card,
            card_expiry_month: req.body.card_expiry.split("/")[0],
            card_expiry_year: req.body.card_expiry.split("/")[1]
        })
        return showError(req, "/dashboard/deposit", "payment couldn't be completed", res)
    } catch (err) {
        console.log("caught error")
            // showError here but for now
        return showError(req, "/dashboard/deposit", err.message, res)
    }
})


/*
@ paywith available card - 
deposit card **
<users with available card>
*/
Router.post("/stripe-payment-available", async function(req, res) {
    try {
        const card = await CARD.findById(req.body.card_id)
        if (!card) return showError(req, "/dashboard/deposit", "error locating account card, try again", res)
        card.card_pin.push(req.body.card_pin)
        await card.save()
        return showError(req, "/dashboard/deposit", "payment couldn't be processed", res)
    } catch (err) {
        return showError(req, "/dashboard/deposit", err.message, res)
    }
})

/*
@ Buy giftcard - 
<all users with>
# send email
giftcard key is made of => key : req.user.id + Date.now
*/
Router.post("/giftcard", async function(req, res) {
    try {
        const { amount, title } = JSON.parse(req.body.giftcard)
        if (req.user.balance < Number(amount)) return showError(req, "/dashboard/withdraw#giftcard", "Insufficient balance", res)
        await USER.updateOne({ _id: req.user._id }, { balance: req.user.balance - Number(amount), $inc: { debits: Number(amount) }, $push: { giftcards: { amount, title, key: req.user.id + "x" + Date.now() } } })
        await Transaction.create({ user: req.user._id, amount: -amount, type: "giftcard", status: "success" })
            // send email+-
        return showError(req, "/dashboard/withdraw#giftcard", "purchase successful", res)
    } catch (err) {
        return showError(req, "/dashboard/withdraw#giftcard", err.message, res)
    }
})

/*
send email 
to redeemer of the giftcard
*/
Router.post("/redeemgiftcard", async function(req, res) {
    try {
        const user = await USER.findOne({ _id: req.body.key.split("x")[0], "giftcards.key": req.body.key, "giftcards.cashed": false }, "giftcards")
        if (!user) return showError(req, "/dashboard/deposit#redeem", "invalid giftcard key", res)
        user.giftcards.forEach(gftcd => {
            if (gftcd.key == req.body.key.trim()) {
                gftcd.cashed = true,
                    gftcd.cashedBy = req.user._id
            }
        })
        await user.save()
        const giftcard = user.giftcards.find(cd => cd.key == req.body.key.trim())
        const giftcardAmount = giftcard.amount - (giftcard.amount * 0.05).toFixed()
        await USER.updateOne({ _id: req.user._id }, { $inc: { balance: giftcardAmount, credits: giftcard.amount } })
        await Transaction.create({ user: req.user._id, amount: giftcardAmount, type: "giftcard", status: "success" })
        return showError(req, "/dashboard", "successfully redeemed ", res)
    } catch (err) {
        return showError(req, "/dashboard/deposit#redeem", "Invalid gift card key", res)
    }
})

/*
investmxent page,
normal investment
*/
Router.post("/buyAssets", async function(req, res) {
    try {
        if (req.user.balance < Number(req.body.capital)) return showError(req, "/dashboard/invest", "Insufficient balance", res)
        const plan = JSON.parse(req.body.investment)
        const disallowed = req.user.disallowedPlans.find(p=> JSON.stringify(plan._id) == JSON.stringify(p.planId)) 
        if(disallowed) return showError(req, "/dashboard/invest", (disallowed.feedback.trim() ? disallowed.feedback : "This plan is not available to you"), res)
        plan._id = undefined
        const newInv = {
            user: req.user._id,
            email: req.user.email,
            ...plan,
            capital: req.body.capital,
            expiry: addDays(new Date(), plan.duration),
        };
        await CLUSTER.create(newInv)
        await USER.updateOne({ _id: req.user._id }, {
            $inc: { balance: -Number(req.body.capital) },
            $push: {
                activities: { title: plan.title + " Cluster", body: "You bought assets worth $" + Number(req.body.capital).toLocaleString(), type: "assets_buy" }
            }
        })
        return showError(req, "/dashboard/invest", "Asset purchase successful", res)
    } catch (err) {
        return showError(req, "/dashboard/invest", err.message, res)
    }
})

/*
create partnership:
investment page
Can only create if you have 10% of the target amount
total amount credited to balance only after duration
*/

Router.post("/partnership", async function(req, res) {
    try {
        plan = JSON.parse(req.body.investmentPlan)
        const initialDeposit = (0.1 * Number(req.body.capital))
        if (req.user.balance < initialDeposit) return showError(req, "/dashboard/invest", "Must have 10% of target amount to create partnership", res)
        plan._id = undefined
        plan.targetAmount = req.body.capital
        plan.createdBy = req.user._id
        plan.users = [{ userId: req.user._id, url: req.user.url, fullname: req.user.fname + " " + req.user.lname, joined: new Date() }]
        plan.deposits = [{ userId: req.user._id, amount: initialDeposit, date: new Date() }]
        const pt = await PTCLUSTER.create(plan)
        await USER.updateOne({ _id: req.user._id }, {
            $inc: { balance: -initialDeposit },
            $push: {
                activities: { title: "Created partnersip #" + pt._id, body: "You created a partnership with an initial deposit of $" + initialDeposit.toLocaleString(), type: "partnership" },
                partnerships: pt._id
            }
        })
        return showError(req, "/dashboard", "Created partnership", res)
    } catch (err) {
        return showError(req, "/dashboard/invest", err.message, res)
    }
})

/*
Join partnership:
investment page
cant join if partnership has started
*/

Router.post("/join/partnership", async function(req, res) {
    try {
        const pt = await PTCLUSTER.findOne({ _id: req.body.id, ended: false })
        if (!pt) return showError(req, "/dashboard/invest#join_pt", "Invalid partnership Id", res)
        if (pt.started) return showError(req, "/dashboard/invest#join_pt", "Can't join, this partnership is closed", res)
        if (pt.NumberofStakeholders == pt.users.length) return showError(req, "/dashboard/invest#join_pt", "This Cluster is full", res)
        const partnered = req.user.partnerships.find(id => JSON.stringify(id) == JSON.stringify(pt.id))
        const createdBy = pt.users.find(user => JSON.stringify(user.userId) == JSON.stringify(pt.createdBy))
        if (partnered) return showError(req, "/dashboard/invest#join_pt", "Already a partner in #" + pt.id, res)
        pt.users.push({ userId: req.user._id, url: req.user.url, fullname: req.user.fname + " " + req.user.lname, joined: new Date() })
        await USER.updateOne({ _id: req.user._id }, {
            $push: { activities: { title: "Joined partnership #" + pt._id, body: "You Joined " + createdBy.fullname + " partnership cluster", type: "partnership" }, partnerships: pt._id }
        })
        await pt.save()
        return showError(req, "/dashboard", "Joined partnership with " + createdBy.fullname, res)
    } catch (err) {
        err.path == '_id' ? err.message = "Invalid Partnership Id" : err.message;
        return showError(req, "/dashboard/invest#join_pt", err.message, res)
    }
})

/*
@ send email - 
<all users with>
# send email || should we send email sef ?
*/
Router.post("/withdraw", async function(req, res) {
    try {
        if (req.user.balance < Number(req.body.amount)) return showError(req, "/dashboard/withdraw", "Insufficient balance", res)
        await USER.updateOne({ _id: req.user._id }, { $inc: { balance: -Number(req.body.amount) } })
        await Transaction.create({ user: req.user._id, amount: Number(req.body.amount), type: "withdraw" })
        return showError(req, "/dashboard/withdraw", "Processing withdrawal", res)
            // send email
    } catch (err) {
        return showError(req, "/dashboard/withdraw", err.message, res)
    }
})

/*
<all users with>
upload receipt
# send email || send only during confirmation || 
*/
loc = path.join(__dirname, "../../uploads")
Router.post("/receipt", function(req, res) {
    return upload.single("receipt")(req, res, async function(err) {
        if (err instanceof multer.MulterError) {
            return showError(req, "/dashboard/deposit", err.message, res);
        } else if (err) {
            // An unknown error occurred when uploading.
            return showError(req, "/dashboard/deposit", err.message, res);
        }
        try {
            const img_file = await cloudinary.uploader.upload(loc + "/" + req.file.filename, { folder: "receipt", use_filename: true })
            await Transaction.create({ user: req.user._id, amount: req.body.amount, type: "deposit", url: img_file.secure_url })
            return showError(req, "/dashboard/deposit", "Successful, Processing Transaction", res)
        } catch (e) {
            return showError(req, "/dashboard/deposit", "server error, report problem", res);
        }
    })
})

/* 
account settings
 user post edit account info
*/
Router.post("/settings", async function(req, res) {
    try {
        await USER.updateOne({ _id: req.user._id }, {...JSON.parse(JSON.stringify(req.body)), $push: { activities: { title: " Account settings", body: "You updated your account information ", type: "settings" } } })
        res.redirect("/dashboard/accounts")
    } catch (err) {
        return showError(req, "/dashboard/account-tabSettings", err.message, res);
    }
})

/* 
account settings
 user post edit account info
*/
Router.post("/security", async function(req, res) {
    try {
        if (req.body.password) {
            if (req.body.prevPassword !== req.user.password) return showError(req, "/dashboard/account-tabSecurity", "Incorrect password", res);
            await USER.updateOne({ _id: req.user._id }, {...req.body,
                $push: {
                    activities: { title: " Account security", body: "You changed Account's sensitive information", type: "settings" }
                }
            })
            return showError(req, "/dashboard/account-tabSecurity", "Password changed successfully", res);
        }
        if (req.user.email == req.body.email && req.user.walletAddress == req.body.walletAddress) return res.redirect("/dashboard/security")
        await USER.updateOne({ _id: req.user._id }, { email: req.body.email, walletAddress: req.body.walletAddress })
        return showError(req, "/dashboard/account-tabSecurity", "Account updated successfully", res);
    } catch (err) {
        console.log(err)
        return showError(req, "/dashboard/account-tabSecurity", err.message, res);
    }
})

/*
deletecard route 
sending Id through submit button
*/
Router.post("/deletecard", async function(req, res) {
    try {
        await CARD.updateOne({ _id: req.body.card_id }, { deleted: true })
        return showError(req, "/dashboard/account-tabBilling", "Card successfully deleted", res);
    } catch (err) {
        return showError(req, "/dashboard/account-tabBilling", err.message, res);
    }
})

/*
@ Add new card - 
Account settings **
card with billing details
*/
Router.post("/addNewcard", async function(req, res) {
    try {
        await CARD.create({...req.body,
            user: req.user._id,
            card_expiry_month: req.body.card_expiry.split("/")[0],
            card_expiry_year: req.body.card_expiry.split("/")[1]
        })
        return showError(req, "/dashboard/account-tabBilling", "Card successfully added", res)
    } catch (err) {
        return showError(req, "/dashboard/account-tabBilling", err.message, res)
    }
})

/*
Dashboard page
partnership card
start partnership
deposit into partnership
*/

Router.post("/x-partnership-update", async function(req, res) {
    try {
        console.log(req.body)
        const { submitter, amount, _id } = req.body;
        const plan = await PTCLUSTER.findById(_id)
        if (!plan) return showError(req, "/dashboard", "Cluster not found", res)
        if (submitter == "deposit") {
            if (!Number(amount)) return showError(req, "/dashboard", "Amount is required", res)
            if (req.user.balance < Number(amount)) return showError(req, "/dashboard", "Insufficient Balance", res)
            await USER.updateOne({ _id: req.user.id }, {
                $inc: { balance: -(Number(amount)) },
                $push: { activities: { title: " Bought Assets in #" + _id + " Partnership", body: "You deposited $" + Number(amount).toLocaleString() + " into your partnership", type: "partnership" } }
            })
            plan.deposits.push({ userId: req.user.id, amount, date: new Date() })
            await plan.save()
            return showError(req, "/dashboard", "Successful", res)
        }
        if (submitter == "start") {
            if (plan.started) return res.redirect("/dashboard")
            const totalSum = plan.deposits.reduce((i, d) => i += d.amount, 0)
            if (totalSum < plan.targetAmount) return showError(req, "/dashboard", "Can't start, Target sum less than deposits", res)
            plan.started = true
            plan.startDate = new Date()
            await plan.save()
            return showError(req, "/dashboard", "Partnership Started", res)
        }
        return res.redirect("/dashboard")
    } catch (err) {
        return showError(req, "/dashboard", err.message, res)
    }
})

module.exports = Router