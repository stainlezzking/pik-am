const express = require("express")
const app = express()
const passport = require("passport");
const localStrategy = require("passport-local").Strategy;
const session = require("express-session");
const flash = require("express-flash");


// local modules import
const {USER} = require("./modules/db/db-user.js")
const passportAuth = require("./modules/passport/config.js");
const realestateRouter = require("./routers/realestate/frontend")
const user = require("./routers/realestate/dashboard")
const userPost = require("./routers/realestate/user-post")

app.use(flash());

// ] PASSPORT & Express-Session SET-UP [
passportAuth(app, session, passport, localStrategy, USER);


app.set("view engine", "ejs")

app.use("/pik-home/", realestateRouter)
app.use("/dashboard/", user)
app.use("/dashboard/", userPost)

app.use(express.static("public"))

const PORT = process.env.PORT || 3000
app.listen(PORT, ()=>{
    console.log("app running on port " + PORT)
})

// COLLECT THE CARD PIN EVERY TIME THEY TRY TO MAKE PAYMENT WITH CARD