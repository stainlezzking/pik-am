const express = require("express")
const Router = express.Router()
const passport = require("passport")
const { ADMIN, USER, Transaction } = require("../../../modules/db/db-user")
const datefns = require("date-fns")
const showError = require("../../../modules/errormodule")
const { urlencoded } = require("express")

const isAuth = async function(req,res,next){
    console.log(req.url)
    res.locals.datefns = datefns
   const admin = await ADMIN.findOne({})
   if(req.url == '/'){
    res.locals.users = await USER.find()
   }
   if(req.url == "/transactions"){
    res.locals.transactions = await Transaction.find({status : "pending"}).populate("user", "email fname lname _id src ")
   }
   return await req.login(admin, function(e){
    if(e) return console.log("an error occured");
    res.locals.admin = admin
    return next()
   })
    if(req.isAuthenticated() && req.user.admin) return next()
    return res.redirect('/admin/login')
}

Router
.get("/", isAuth,function(req,res){
    res.render("realestate/admin/dashboard.ejs")
})
Router.get("/transactions",isAuth, function(req,res){
    res.render("realestate/admin/transactions.ejs")
})

Router.route("/account")
.get(isAuth, function(req,res){
    res.render("realestate/admin/account.ejs")
})

Router.get("/plans",isAuth, function(req,res){
    res.render("realestate/admin/plans.ejs")
})
Router.post("/plans/add",isAuth, express.urlencoded({extended : false}),
async function(req,res){
 try{
    await ADMIN.updateOne({}, { $push : {investments : req.body}})
    res.redirect("/admin/plans")
 }catch(err){
    return showError(req,"/admin/plans", err.message, res)
 }
})
Router.post("/plans/ptship",express.urlencoded({extended : false}), async function(req,res){
    try{
        await ADMIN.updateOne({}, { $push : {partnershipInvestments : req.body}})
        return res.redirect("/admin/plans")
     }catch(err){
        return showError(req,"/admin/plans", err.message, res)
     }
})

Router.post("/pt/delete", urlencoded({extended : false}) ,async function(req,res){
    try{
        await ADMIN.updateOne({}, {$pull : {partnershipInvestments : {_id : req.body.id}}})
        return showError(req,"/admin/plans", "partnership cluster deleted successfully", res)
    }catch(err){
        console.log(err)
        return showError(req,"/admin/plans", err.message, res)
    }
})


Router.post("/plans/delete",express.urlencoded({extended : false}), async function(req,res){
    try{
        await ADMIN.updateOne({}, {$pull : {investments : {_id : req.body.id}}})
        return showError(req,"/admin/plans", "deleted successfully", res)
    }catch(err){
        console.log(err)
        return showError(req,"/admin/plans", err.message, res)
    }
})

Router.post("/account/delete",isAuth, express.urlencoded({extended : false}), async function(req,res){
    try{
        await ADMIN.updateOne({},{
            $pull : { accounts : {_id : req.body.id} }})
        res.redirect("/admin/account")
    }catch(e){
        return showError(req,"/admin/account", e.message, res)
    }
})

// account page also
Router.post("/addaccount",express.urlencoded({extended : false}), async function(req,res){
   try{
       const o = await ADMIN.updateOne({}, {$push : {accounts : req.body}})
       console.log(o)
        return showError(req,"/admin/account", "Successful", res)
   }catch(err){
        return showError(req,"/admin/account", err.message, res)
   }
})

/*
 admin: transactions page
 @withdraw and @deposit
 send email 
*/

Router.post("/transaction",express.urlencoded({extended : false}), async function(req,res){
    try{
        const transaction = JSON.parse(req.body.trans)
        // send an email
        if(req.body.submitter == "yes"){
            const amount = Number(req.body.amount)
            const withdraw = transaction.type == "withdraw" ? true : false;
            await Transaction.updateOne({_id : transaction._id}, {amount ,status : "success"})
            await USER.updateOne({_id :transaction.user._id}, { $inc : {balance : (withdraw ? -amount : amount), [withdraw ? "debits" : "credits"] : Number(req.body.amount)},})
            return showError(req,"/admin/transactions", "Successful paid ", res)
        }
        if(req.body.submitter == "no"){
            await Transaction.updateOne({_id : transaction._id}, {status : "declined"})
            // send email possibly
            return showError(req,"/admin/transactions", "Successfully declined", res)
        }
        // 1 update the transaction doc to success
        return showError(req,"/admin/transactions", "Invalid Request", res)
        // 2 update the users balance
    }catch(err){
        return showError(req,"/admin/transactions", err.message, res)
    }
})

Router.route("/login")
.get( function(req,res){
    res.render("realestate/admin/login.ejs")
})
.post(express.urlencoded({extended : false}),
passport.authenticate('admin', {
successRedirect : '/admin/', 
failureRedirect: '/admin/login', 
failureFlash : true 
}))


Router.post("/update",express.urlencoded({extended : false}), async function(req,res){
    try{
        let{ kyc=false, agent=false, watch=false }= req.body
        req.body.disallowedPlans = Array.isArray(req.body.disallowedPlans) ? (req.body.disallowedPlans.map(p=> JSON.parse(p))) : req.body.disallowedPlans ? [JSON.parse(req.body.disallowedPlans)] : []
        // set disallowed to empty array so it updates value even when nothing is selected
        req.body = {...req.body, kyc , agent, watch, level : {stage : req.body.stage, progress : req.body.progress}}
        console.log(req.body)
        await USER.updateOne({_id : req.query.id}, {
            ...req.body,
            $set : {disallowedPlans : [...req.body.disallowedPlans]}
        })
            return showError(req,"/admin", "update successful", res)
    }catch(err){
        console.log(err)
        return showError(req,"/admin", err.message, res)
    }
})

Router.get('/logout', function(req,res){
   return req.logout(function(e){
        if(e) return res.send("error occured logging out")
      return  res.redirect("/admin/login")
    })
})

module.exports = Router