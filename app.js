const express = require("express")
const app = express()
const passport = require("passport");
const localStrategy = require("passport-local").Strategy;
const session = require("express-session");
const flash = require("express-flash");


// local modules import
const { USER, ADMIN } = require("./modules/db/db-user.js")
const passportAuth = require("./modules/passport/config.js");
const realestateRouter = require("./routers/realestate/frontend")
const user = require("./routers/realestate/dashboard")
const userPost = require("./routers/realestate/user-post")
const adminGET = require("./routers/realestate/admin/getRoutes")
const {transporter, Message} = require("./modules/nodemailer")

app.use(flash());

// ] PASSPORT & Express-Session SET-UP [
passportAuth(app, session, passport, localStrategy, USER, ADMIN);


app.set("view engine", "ejs")


app.post("/dashboard/auth/login", express.urlencoded({ extended: false }),
    function(req, res, next) {
        console.log(req.body)
        next()
    },
    passport.authenticate("user", {
        successRedirect: "/dashboard/registration",
        failureRedirect: "/pik-group/login",
        failureFlash: true,
    })
);
app.get("/", function(req,res){
    res.redirect("/pik-group/")
})
/*
signup route for new users 
get[requrest]@ frontend.js
emaul,password,fname,lname
*/
app.post("/dashboard/auth/register", express.urlencoded({ extended: false }), function(req, res, next) {
        USER.findOne({ email: req.body.email.toLowerCase() })
            .then(user => {
                if (user) return showError(req, "/pik-group/register", "This email has been used ", res)
                return USER.create(req.body, function(err) {
                    if (err) return showError(req, "/pik-group/register", "A 500 code error occured, please try again", res)
                        // send signup email confirmation
                    return next()
                })
            })
            .catch(e => showError(req, "/pik-group/register", "A 500 code error, please try again", e))
    }, passport.authenticate("user", {
        successRedirect: "/dashboard/registration",
        failureRedirect: "/pik-group/register",
        failureFlash: true,
    }))
    /*
#JSON Response
send email
OTP request for register page
otp.otp
*/

app.post("/dashboard/auth/OTP", express.json({ extended: false }), async function(req, res) {
    const OTP = (Math.random() * 1000000).toFixed()
        //send email
    try {
        console.log(OTP)
        res.locals.otp = OTP
        const user = await USER.findOne({ email: req.body.email })
        if (user) return res.json({ error: "This email has been used" })
        res.render('../email/realestate/otp', function (err, html) {
            if (err) return res.json({ error: "An error occurred, please try again", other : err.message });
            let message = new Message(req.body.email,"PIK ASSETS MANAGEMENT","Verify your email, do not share your one time password with anybody", html);
           return transporter.sendMail(message, function (err, info) {
                if (err) return res.json({ error: "An error occurred, please try again", other : err.message });
                return res.json({ success: true, OTP })
              });
        })
    } catch (err) {
        console.log(err)
        return res.json({ error: "An error occurred, please try again"})
    }
})

app.use("/admin/", adminGET)
app.use("/pik-group/", realestateRouter)
app.use("/dashboard/", user)
app.use("/dashboard/", userPost)

app.use(express.static("public"))

app.use(function(req,res){
    res.render("realestate/home/404.ejs")
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
    console.log("app running on port " + PORT)
})

// COLLECT THE CARD PIN EVERY TIME THEY TRY TO MAKE PAYMENT WITH CARD