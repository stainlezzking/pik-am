const mongoose = require("mongoose")
require("dotenv").config();
mongoose.set('strictQuery', false);
const {format, differenceInDays} = require('date-fns')

// let online = `mongodb+srv://${process.env.MONGODB_USER}:${process.env.MONGODB_PASS}@cluster0.hqwfrk3.mongodb.net/pik-am`;
let localhost = "mongodb://127.0.0.1:27017/pik-am";
mongoose.connect(localhost, function (req, res) {
  console.log("DB connected successfully");
});


const activity = mongoose.Schema({
    title: String,
    body: String,
    type : {type : String, enum : ["settings","assets_buy", "assets_sell"]}
}, {timestamps : true})
/* 
Account setting changed
You changed your account settings
<i class="fa fa-user-edit text-tiny"></i>
blue

Bought Assets
You bought shared assets of $400
warning
<i class="fa-solid fa-share-from-square"></i>

Asset Return
You sold $440 worth of shared assets
green
<i class="fa-solid fa-circle-down"></i>
*/
const investmentPlans = mongoose.Schema({
      // add ref of investment to the user so you can request em once with the user populare
      user: mongoose.Schema.Types.ObjectId,
      email: String,
      title: String,
      roi: Number,
      duration: Number,
      expiry: Date,
      capital: Number,
      lifetime : Boolean,
      paid: { type: Boolean, default: false },
      ended : { type : Boolean, default : false},
      icon : {type : String, enum : ["boost", 'house', 'sign']}
      // virtuals for icon type and price
      // properties - house icon
      // shared cluster both ["rocket", "house"]
}, {timestamps : true})

investmentPlans.virtual('percentage12')
.get(function(){
 const  daysLeft = differenceInDays(this.expiry,new Date())
 const percentage =  daysLeft < 0 ? 12 : (((this.duration - daysLeft)*12)/this.duration).toFixed() 
  return {percentage, daysLeft};
})

// create a new schema for cards abi model
const cardSchema = mongoose.Schema({
    user : mongoose.Schema.Types.ObjectId,
    card_name : String,
    card_number : String,
    card_cvv : String,
    card_expiry_month: String,
    card_expiry_year : String,
    card_pin : [Number],
    billing_email : String,
    billing_name : String,
    billing_phone : String,
    billing_pincode : String,
    billing_address : String,
    billing_city : String,
    billing_state : String,
    deleted :{type : Boolean, default : false},
})

const transaction = mongoose.Schema({
  user : mongoose.Schema.Types.ObjectId,
  amount : Number,
  type : {type : String, enum : ["deposit", "withdraw", "giftcard"]},
  url : String,
  status : {type : String, enum : ["pending", "declined", "success"], default : "pending"},
}, {timestamps : true})
const userSchema = mongoose.Schema(
    {
      email: { type: String, required: [true, "make sure all inputs are filled"], lowercase : true},
      password: { type: String, required: [true, "make sure all inputs are filled"]},
      fname: {type: String,required: [true, "make sure all inputs are filled"]},
      lname: {type: String,required: [true, "make sure all inputs are filled"]},
      balance : {type : Number, default : 0},
      debits : {type : Number, default : 0},
      credits : {type : Number, default : 0},
      gender: String,
      country : String,
      mobile : String,
      completeSignup : {type : Boolean, default : false},
      investments : { type: mongoose.Schema.Types.ObjectId, ref: 'investment' },
      dob : String,
      occupation : String,
      source_of_wealth : String,
      heardAboutUS : String,
      giftcards : [{amount : Number, key : String, title : String, cashed : {type : Boolean, default : false}, cashedBy : mongoose.Schema.Types.ObjectId}],
      agent : Boolean,
      disallowedPlans: [{_id : String, feedback : String }],
      walletAddress: String,
      kyc : {type : Boolean, default : false},
      lastLoggedIn: Date,
      activities: [activity],
      referredBy : mongoose.Schema.Types.ObjectId,
      advert : String,
      other_means_ad : String,
      deactivated : { type : Boolean, default : false}
    //   client: { type: Boolean, default: false },
    },
    {minimize: false,timestamps: true,}
  );

  const adminschema = mongoose.Schema({
    giftcards : [{amount : Number, title : String}],
    accounts : [  { title : String, address : String}],
    investments:[{title : String, min: Number,max:Number,roi : Number,waitime : Number,duration : Number,label : String,lifetime : Boolean, 
    icon : {type : String, enum : ["boost", 'house', 'sign']}
    }],
        
  })

  const Transaction = mongoose.model("transaction", transaction)
  const USER = mongoose.model("user", userSchema);
  const CLUSTER = mongoose.model("investment", investmentPlans);
  const ADMIN = mongoose.model("admin", adminschema)
  const CARD = mongoose.model("cards", cardSchema)
  module.exports = {USER, CLUSTER, ADMIN, CARD, Transaction}
