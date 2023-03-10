const md5 = require('md5')
module.exports = passportAuth = function(app, session, passport, localStrategy, USER, ADMIN) {
    // session
    app.use(session({
        secret: process.env.SESSION_KEY,
        resave: false,
        saveUninitialized: false,
        cookie: {
            maxAge: 1000 * 60 * 60 * 24
        }
    }))

    app.use(passport.initialize())

    app.use(passport.session())

    passport.use("user", new localStrategy({
            usernameField: "email",
            passReqToCallback: true,
        },
        (req, user, password, done) => {
            USER.findOne({ email: user.toLowerCase() },
                function(err, data) {
                    if (err) return done(err)
                    if (!data) return done(null, false, { message: "wrong email or passwrord" })
                    if (data) {
                        try {
                            if (data.password === password) {
                                USER.updateOne({ email: data.email }, { lastLoggedIn: new Date() },
                                    function(err) { if (err) return console.log("error trying to update user logins", err) })
                                return done(null, data)
                            } else {
                                return done(null, false, { message: "wrong email or password" })
                            }
                        } catch (err) {
                            console.log(err.message)
                            req.flash("error", "couldn't sign you in, please report this problem")
                            return done(err)
                        }
                    }
                })
        }))

    passport.use("admin",new localStrategy(
        (user,password,done)=>{
            ADMIN.findOne({username: user.toLowerCase()},
             function(err,data){
                if(err) return done(err)
                if(!data) return done(null, false, {message : "wrong username or password"})
                if(data){
                        if(data.password == md5(password)) return done(null,data)
                            return done(null, false, {message : "wrong username or password"})
                }
            })
        })
    )

    passport.serializeUser(function(user, done) {
        done(null, { id: user.id, admin: user.admin });
    });

    passport.deserializeUser(function(user, done) {
        if (user.admin) {
            return ADMIN.findById(user.id, function(err, user) {
                done(err, user)
            })
        }
        return USER.findById(user.id, function(err, user) {
            done(err, user);
        }).populate({path : "partnerships", match : {ended : false}});
    });
}