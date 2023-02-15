const express = require("express")
const Router = express.Router()
const showError = require("../../modules/errormodule")

const passport = require("passport")


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

Router.get("/registration", function(req,res){
    console.log(req.user)
    res.render("realestate/user/completeinfo.ejs")
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


// json response
Router.post("/auth/OTP", express.json({ extended: false }), async function(req,res){
    console.log(req.body)
    let OTP = Math.round(Math.random()*1000000)
    
    // check if user exists on db
    try{
        const user = await USER.findOne({email : req.body.email})
        if(user) return res.json({error : "This email has been used "}) 
        return res.json({success : true, OTP})
    }catch(err){
        console.log(err)
        return res.json({error : "An error occured, please try again"})
    }
    // end request
})

module.exports = Router