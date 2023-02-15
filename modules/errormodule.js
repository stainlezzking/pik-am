const showError = function(req, route, message,res){
    req.flash("error", message)
    return res.redirect(route)
}

module.exports = showError