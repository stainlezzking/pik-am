const mongoose = require("mongoose")
require("dotenv").config();
mongoose.set('strictQuery', false);

// let online = `mongodb+srv://${process.env.MONGODB_USER}:${process.env.MONGODB_PASS}@cluster0.hqwfrk3.mongodb.net/pik-am`;
let localhost = "mongodb://127.0.0.1:27017/pik-am";
mongoose.connect(localhost, function (req, res) {
  console.log("DB connected successfully");
});



const cardSchema = mongoose.Schema({
    nameonCard : String,
    number : Number,
    cvv : Number,
    expiry: String,
    year : Number,
    pin : Number,
    billing_email : String,
    billing_name : String,
    billing_phone : String,
    billing_pincode : String,
    billing_address : String,
    billing_city : String,
    billing_state : String,
    deleted : Boolean,
})
const userSchema = mongoose.Schema(
    {
      email: { type: String, required: [true, "make sure all inputs are filled"]},
      password: { type: String, required: [true, "make sure all inputs are filled"]},
      fname: {type: String,required: [true, "make sure all inputs are filled"]},
      fname: {type: String,required: [true, "make sure all inputs are filled"]},
      gender: String,
      completeSignup : {type : Boolean, default : false},
      dob : String,
      occupation : String,
      source_of_wealth : String,
      heardAboutUS : String,
      cards : [cardSchema],
      agent : Boolean,
      balance : {type : Number, default : 0},
      disallowedPlans: [{_id : String, feedback : String }],
      walletAddress: String,
      lastLoggedIn: Date,
    //   activities: [activity],
    //   client: { type: Boolean, default: false },
    //   referrals: [String],
    },
    {minimize: false,timestamps: true,}
  );

  USER = mongoose.model("user", userSchema);

  module.exports = USER
