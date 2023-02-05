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

Router.get("/registration", function(req,res){
    res.render("realestate/user/completeinfo.ejs")
})

Router.get("/auth", function(req,res){
    res.render("realestate/home/auth.ejs")
})

Router.post("/OTP-email", express.json({ extended: false }), function(req,res){
    // do your check making sure its valid emails and input
    // check if user exists on db
    // send OTP to the email
    // send OTP back to the browser
    // end request
    console.log(req.body)
    res.json({error : "error sending OTP"})
    res.end()
})


module.exports = Router