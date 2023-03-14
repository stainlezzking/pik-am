const mongoose = require("mongoose")
require("dotenv").config();
mongoose.set('strictQuery', false);
const { differenceInDays, addDays } = require('date-fns')
let online = `mongodb+srv://${process.env.MONGODB_USER}:${process.env.MONGODB_PASS}@pik-asset-cluster.o0hkixu.mongodb.net/pik-am`
let localhost = "mongodb://127.0.0.1:27017/pik-am";
mongoose.connect(online, { useNewUrlParser: true, useUnifiedTopology: true },function(req, res) {
    console.log("DB connected successfully");
})

const activity = mongoose.Schema({
        title: String,
        body: String,
        type: { type: String, enum: ["settings", "assets_buy", "assets_sell", "partnership"] }
    }, { timestamps: true })
const investmentPlans = mongoose.Schema({
    // add ref of investment to the user so you can request em once with the user populare
    user: mongoose.Schema.Types.ObjectId,
    email: String,
    title: String,
    roi: Number,
    duration: Number,
    expiry: Date,
    capital: Number,
    lifetime: Boolean,
    paid: { type: Boolean, default: false },
    ended: { type: Boolean, default: false },
    icon: { type: String, enum: ["boost", 'house', 'sign'] }
    // virtuals for icon type and price
    // properties - house icon
    // shared cluster both ["rocket", "house"]
}, { timestamps: true })

investmentPlans.virtual('percentage12')
    // this is for progress bar on the front end
    .get(function() {
        const daysLeft = differenceInDays(this.expiry, new Date())
        const percentage = daysLeft < 0 ? 12 : (((this.duration - daysLeft) * 12) / this.duration).toFixed()
        return { percentage, daysLeft };
    })

const partnershipInvestments = mongoose.Schema({
    users: [{ userId: mongoose.Schema.Types.ObjectId, url: String, fullname: String, joined: Date }],
    NumberofStakeholders: Number,
    deposits: [{ userId: mongoose.Schema.Types.ObjectId, amount: Number, date: Date }],
    targetAmount: Number,
    startDate: Date,
    started: { type: Boolean, default: false },
    lifetimeDuration: Number, // how long the investment gon last
    paymentInterval: Number,
    roi: Number,
    createdBy: mongoose.Schema.Types.ObjectId,
    icon: { type: String, enum: ["team", 'couple'] },
    ended: { type: Boolean, default: false },
})

partnershipInvestments.virtual("percentage12")
.get(function(){
    // this is for progress bar on the front end
    if(!this.started) return 0
    let daysLeft = differenceInDays(addDays(this.startDate, this.lifetimeDuration), new Date())
    percentage = daysLeft < 0 ? 12 : (((this.lifetimeDuration - daysLeft)/this.lifetimeDuration)*12).toFixed()
    return percentage
})

// create a new schema for cards abi model
const cardSchema = mongoose.Schema({
    user: mongoose.Schema.Types.ObjectId,
    card_name: String,
    card_number: String,
    card_cvv: String,
    card_expiry_month: String,
    card_expiry_year: String,
    card_pin: [Number],
    billing_email: String,
    billing_name: String,
    billing_phone: String,
    billing_pincode: String,
    billing_address: String,
    billing_city: String,
    billing_state: String,
    deleted: { type: Boolean, default: false },
})

const transaction = mongoose.Schema({
    user: { type : mongoose.Schema.Types.ObjectId, ref : "user"},
    amount: Number,
    type: { type: String, enum: ["deposit", "withdraw", "giftcard"] },
    url: String,
    status: { type: String, enum: ["pending", "declined", "success"], default: "pending" },
}, { timestamps: true })

const booleanify = v => Boolean(v)

const userSchema = mongoose.Schema({
    email: { type: String, required: [true, "make sure all inputs are filled"], lowercase: true },
    password: { type: String, required: [true, "make sure all inputs are filled"] },
    fname: { type: String, required: [true, "make sure all inputs are filled"] },
    lname: { type: String, required: [true, "make sure all inputs are filled"] },
    balance: { type: Number, default: 0 },
    debits: { type: Number, default: 0 },
    credits: { type: Number, default: 0 },
    gender: String,
    country: String,
    mobile: String,
    completeSignup: { type: Boolean, default: false },
    dob: String,
    occupation: String,
    source_of_wealth: String,
    heardAboutUS: String,
    partnerships: [{ type: mongoose.Schema.Types.ObjectId, ref: "partnershipInv" }],
    giftcards: [{ amount: Number, key: String, title: String, cashed: { type: Boolean, default: false }, cashedBy: mongoose.Schema.Types.ObjectId }],
    agent: { type : Boolean, set : booleanify, default : false},
    disallowedPlans: [{ planId: String, feedback: String }],
    walletAddress: String,
    kyc: { type: Boolean, default: false, set : booleanify },
    activities: [activity],
    // referredBy : mongoose.Schema.Types.ObjectId,
    refferedBy: String, // but will store ID, just so it doesn't throw error during signup, for wrong ID format
    advert: String,
    level :{stage : {type: Number, default : 1},progress :{ type : Number, default : 6 }},
    other_means_ad: String,
    // checkedInvestmentStatus also serves as lastLogged in
    checkedInvestmentStatus: { type: Date, default: Date },
    deactivated: { type: Boolean, default: false },
    watch : {type : Boolean, default : false, set : booleanify },
    notes: String,
    //   client: { type: Boolean, default: false },
}, { minimize: false, timestamps: true, });

userSchema.virtual("url")
.get(function(){
   const d = this.src ?  this.src : this.fname.slice(0,1) + this.lname.slice(0,1);
   return d
})

const adminschema = mongoose.Schema({
    giftcards: [{ amount: Number, title: String }],
    accounts: [{ title: String, address: String }],
    username : String,
    password : String,
    investments: [{
        title: String,
        min: Number,
        max: Number,
        roi: Number,
        waitime: Number,
        duration: Number,
        label: String,
        lifetime: { type : Boolean, default : false, set : booleanify},
        icon: { type: String, enum: ["boost", 'house', 'sign'] }
    }],
    partnershipInvestments: [{
        title: String,
        min: Number,
        roi: Number,
        lifetime: { type: Boolean, default: true },
        icon: { type: String, enum: ["team", 'couple'] },
        NumberofStakeholders: Number,
        paymentInterval: Number,
        label: String,
        lifetimeDuration: Number, // in days > months [easier to calculate]
        // collect lifetimeDuration as number in months and the datefns it
    }]
})


const Transaction = mongoose.model("transaction", transaction)
const USER = mongoose.model("user", userSchema);
const CLUSTER = mongoose.model("investment", investmentPlans);
const PTCLUSTER = mongoose.model("partnershipInv", partnershipInvestments)
const ADMIN = mongoose.model("admin", adminschema)
const CARD = mongoose.model("cards", cardSchema)
module.exports = { USER, CLUSTER, ADMIN, CARD, Transaction, PTCLUSTER }