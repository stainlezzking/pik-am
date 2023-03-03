const express = require("express")
const Router = express.Router()
const path = require("path")



Router.use(function(req,res,next){
    console.log(req.get("host"))
    next()
})

Router.get("/", function(req,res){
    res.render("realestate/home/index.ejs")
})

Router.get("/about", function(req,res){
    res.render("realestate/home/about.ejs")
})

Router.get("/blogs", function(req,res){
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

Router.get("/logout", function(req,res){
    return req.logOut(function(e){
        if(e) return console.log(e)
        res.redirect("/dashboard/auth/login")
    })
})

// find post routes for both register routes and login route in dasboaord.js


module.exports = Router