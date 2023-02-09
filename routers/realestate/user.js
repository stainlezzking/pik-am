const express = require("express")
const Router = express.Router()



Router.get("/", function(req,res){
    res.render("realestate/user/dashboard.ejs")
})

Router.get("/deposit", function(req,res){
    res.render("realestate/user/deposit.ejs")
})


module.exports = Router