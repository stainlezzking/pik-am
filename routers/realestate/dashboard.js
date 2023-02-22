const express = require("express")
const Router = express.Router()
const showError = require("../../modules/errormodule")
const {USER, ADMIN, CARD} = require("../../modules/db/db-user")
const passport = require("passport")

Router.use(async function(req,res,next){
    try{
        if(req.isAuthenticated()){
            const admin = await ADMIN.findOne({}, "accounts giftcards").lean()
            req.user.cards = await CARD.find({user : req.user._id, deleted : false})
            res.locals.accounts = admin.accounts
            res.locals.giftcards = admin.giftcards
            res.locals.user = req.user
            return next()
        }
        // res redirect to login page
        console.log("not authenticated")
        const user = await USER.findOne({email : "somtrcu@sidin.cniy"})
        return req.login(user, function(err){
            if(err) return console.log(err.message)
            return next()
        })
    }catch(err){
        console.log(err.message)
        res.send("an error occured internally, please report")
    }
})

Router.get("/", function(req, res) {
    res.render("realestate/user/dashboard.ejs")
})

Router.get("/deposit", function(req, res) {
    res.render("realestate/user/deposit.ejs")
})

Router.get("/transaction", function(req, res) {
    res.render("realestate/user/transaction.ejs")
})

Router.get("/withdraw", function(req, res) {
    res.render("realestate/user/withdraw.ejs")
})

Router.get("/invest", function(req, res) {
    res.render("realestate/user/invest.ejs")
})

Router.get("/account", function(req, res) {
    res.render("realestate/user/account.ejs")
})

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
module.exports = Router