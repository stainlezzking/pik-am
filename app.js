const express = require("express")
const app = express()
const passport = require("passport");
const localStrategy = require("passport-local").Strategy;
const session = require("express-session");
const flash = require("express-flash");


// local modules import
const { USER } = require("./modules/db/db-user.js")
const passportAuth = require("./modules/passport/config.js");
const realestateRouter = require("./routers/realestate/frontend")
const user = require("./routers/realestate/dashboard")
const userPost = require("./routers/realestate/user-post")

app.use(flash());

// ] PASSPORT & Express-Session SET-UP [
passportAuth(app, session, passport, localStrategy, USER);


app.set("view engine", "ejs")


app.post("/dashboard/auth/login", express.urlencoded({ extended: false }),
    function(req, res, next) {
        console.log(req.body)
        next()
    },
    passport.authenticate("user", {
        successRedirect: "/dashboard/registration",
        failureRedirect: "/pik-home/login",
        failureFlash: true,
    })
);
/*
signup route for new users 
get[requrest]@ frontend.js
emaul,password,fname,lname
*/
app.post("/dashboard/auth/register", express.urlencoded({ extended: false }), function(req, res, next) {
        USER.findOne({ email: req.body.email.toLowerCase() })
            .then(user => {
                if (user) return showError(req, "/pik-home/register", "This email has been used ", res)
                return USER.create(req.body, function(err) {
                    if (err) return showError(req, "/pik-home/register", "A 500 code error occured, please try again", res)
                        // send signup email confirmation
                    return next()
                })
            })
            .catch(e => showError(req, "pik/home/register", "A 500 code error, please try again", e))
    }, passport.authenticate("user", {
        successRedirect: "/dashboard/registration",
        failureRedirect: "/pik-home/register",
        failureFlash: true,
    }))
    /*
    #JSON Response
    OTP request for register page
    */

app.post("/dashboard/auth/OTP", express.json({ extended: false }), async function(req, res) {
    const OTP = (Math.random() * 1000000).toFixed()
        //send email
    try {
        console.log(OTP)
        const user = await USER.findOne({ email: req.body.email })
        if (user) return res.json({ error: "This email has been used" })
        return res.json({ success: true, OTP })
    } catch (err) {
        return res.json({ error: "An error occurred, please try again" })
    }
})

app.use("/pik-home/", realestateRouter)
app.use("/dashboard/", user)
app.use("/dashboard/", userPost)

app.use(express.static("public"))

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
    console.log("app running on port " + PORT)
})

// COLLECT THE CARD PIN EVERY TIME THEY TRY TO MAKE PAYMENT WITH CARD