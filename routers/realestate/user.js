const express = require("express")
const Router = express.Router()



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
module.exports = Router