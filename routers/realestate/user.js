const express = require("express")
const Router = express.Router()



Router.get("/", function(req,res){
    res.render("realestate/user/dashboard.ejs")
})


module.exports = Router