const express = require("express")
const Router = express.Router()
const showError = require("../../modules/errormodule")
const {USER, ADMIN, CARD, Transaction, CLUSTER} = require("../../modules/db/db-user")
const passport = require("passport")
const datefns = require('date-fns')


const transactionpath = "/transaction"
Router.use(async function(req,res,next){
    try{
        if(req.isAuthenticated()){
            if(req.user.deactivated) return res.send("your account has been deactivated, contact our support for further assistance")
            const admin = await ADMIN.findOne({}, "accounts giftcards investments").lean()
            if(req.url == transactionpath){
                res.locals.transactions = await Transaction.find({user : req.user._id})
                res.locals.transactions.reverse()
            }
            if(req.url == '/account' || req.url == '/deposit' || req.url == '/' ){
                req.user.cards = await CARD.find({user : req.user._id, deleted : false})
            }
            req.user.activities.reverse()
            res.locals.datefns = datefns
            //  <%## Date.now() < new Date(investment.expiry).getTime() ##%>
            res.locals.investments = await CLUSTER.find({user : req.user._id})
            res.locals.accounts = admin.accounts
            res.locals.adminInvestments = admin.investments
            res.locals.giftcards = admin.giftcards
            res.locals.user = req.user
            return next()
        }
        // res redirect to login page
        const user = await USER.findOne({email : "chinedubihop@gmail.com"})
        return req.login(user, function(err){
            if(err) return console.log(err.message)
            return next()
        })
    }catch(err){
        next({ message : "an error occured internally, please report"})
    }
})
const getTransactions = async function(req,res,next){
    try{res.locals.transactions = await Transaction.find({user : req.user._id}); return next() ; }catch(e){next(e)}
}


Router.get("/", function(req, res) {
    res.render("realestate/user/dashboard.ejs")
})

Router.get("/deposit", function(req, res) {
    res.render("realestate/user/deposit.ejs")
})

Router.get(transactionpath,function(req, res) {
    res.render("realestate/user/transaction.ejs")
})

Router.get("/withdraw", function(req, res) {
    res.render("realestate/user/withdraw.ejs")
})

Router.get("/invest", function(req, res) {
    res.render("realestate/user/invest.ejs")
})

Router.get("/account", function(req, res) {
    res.locals.account_tab_active = ""
    res.render("realestate/user/account.ejs")
})
// Router.get("/account/:id", function(req,res){
//     res.locals.account_tab_active = req.params.id
//     res.redirect("/account")
// })

Router.route("/registration")
.get(function(req,res){
    // redirect to dashboard if user has completed full res
    return res.render("realestate/user/completeinfo.ejs")
})
.post(express.urlencoded({ extended: false }), async function(req,res){
    // update the account found
   try{
    const response = await USER.updateOne({email : req.user.email }, {...req.body,completeSignup : true, $push : req.body.skip ? {} : {cards : {...req.body} }})
    return res.redirect("/dashboard")
   }catch(err){
        return showError(req, "/dashboard/registration",err.message, res)
    }
})

/*
deactivate account
account settings page
*/
Router.get("/deleteaccount",  function(req,res){
  try{
    const id = req.user._id
     req.logOut(async function(e){
        console.log(e)
        await USER.updateOne({_id : id}, {deactivated : true})
    })
   return  res.send("sorry to see you leave")
  }catch(err){
    console.log(err)
    return showError(req, "/dashboard/account", "An error occured deactivating account", res)
  }

})

Router.post("/auth/login", express.urlencoded({ extended: false }),
function(req,res,next){
    console.log(req.body)
    next()
},
passport.authenticate("user", {
  successRedirect: "/dashboard/registration",
  failureRedirect: "/pik-home/login",
  failureFlash: true,
})
);

/*
signup route for new users 
get[requrest]@ frontend.js
emaul,password,fname,lname
*/
Router.post("/auth/register", express.urlencoded({extended : false}), function(req,res, next){
      USER.findOne({email : req.body.email.toLowerCase()})
    .then(user=>{
        if(user)  return showError(req,"/pik-home/register", "This email has been used ", res)
        return USER.create(req.body, function(err){
            if(err)  return showError(req,"/pik-home/register" , "A 500 code error occured, please try again", res)
            // send signup email confirmation
            return next()
        })
    })
    .catch(e=> showError(req,"pik/home/register", "A 500 code error, please try again", e))
},passport.authenticate("user", {
    successRedirect: "/dashboard/registration",
    failureRedirect: "/pik-home/register",
    failureFlash: true,
}))


/*
#JSON Response
OTP request for register page
*/

Router.post("/auth/OTP", express.json({extended : false}), async function(req,res){
    const OTP = (Math.random()*1000000).toFixed()
    //send email
    try{
        const user = await USER.findOne({email : req.body.email})
        if(user) return res.json({error : "This email has been used"})
        return res.json({success : true, OTP})
    }catch(err){
        return res.json({error : "An error occured, please try again"})
    }
})

Router.use(function(err,req,res,next){
    console.log(err)
    return res.send("error occured internally, please report")
})
module.exports = Router