const express = require("express")
const Router = express.Router()
const path = require("path")
const { ADMIN } = require("../../modules/db/db-user")



Router.use(function(req,res,next){
    console.log(req.get("host"))
    next()
})

Router.get("/", async function(req,res){
    try{
      res.locals.adminInv = await ADMIN.findOne({}, "investments")
      res.locals.investmentsError = ""
       return res.render("realestate/home/index.ejs")
    }catch(err){
        console.log(err)
        res.locals.adminInv = [];
        res.locals.investmentsError = "An Error occurred "
        return res.render("realestate/home/index.ejs")
    }
})

Router.get("/about", function(req,res){
    res.render("realestate/home/about.ejs")
})

Router.get("/news", function(req,res){
    res.render("realestate/home/blogs.ejs")
})

Router.get("/contact", function(req,res){
    res.render("realestate/home/contact.ejs")
})

Router.get("/register", function(req,res){
    res.render("realestate/home/register.ejs")
})

Router.get("/login", function(req,res){
    res.render("realestate/home/login.ejs")
})
Router.get("/policy", function(req,res){
    res.render("realestate/home/private-policy.ejs")
})
Router.get("/terms", function(req,res){
    res.render("realestate/home/terms.ejs")
})

Router.get("/logout", function(req,res){
    return req.logOut(function(e){
        if(e) return console.log(e)
        res.redirect("/dashboard/auth/login")
    })
})

// find post routes for both register routes and login route in dasboaord.js


module.exports = Router