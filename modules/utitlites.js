const { USER, Transaction, PTCLUSTER, CLUSTER, ADMIN, CARD } = require("./db/db-user")
const datefns = require("date-fns")

const res_locals = async function(res, req, transactionpath) {
    const admin = await ADMIN.findOne({}, "accounts giftcards investments partnershipInvestments").lean()
    if (req.url == transactionpath) {
        res.locals.transactions = await Transaction.find({ user: req.user._id })
        res.locals.transactions.reverse()
    }
    if (req.url == '/account' || req.url == '/deposit' || req.url == '/') {
        req.user.cards = await CARD.find({ user: req.user._id, deleted: false })
    }
    req.user.activities.reverse()
    res.locals.datefns = datefns
        //  <%## Date.now() < new Date(investment.expiry).getTime() ##%>
    res.locals.investments = await CLUSTER.find({ user: req.user._id })
    res.locals.accounts = admin.accounts
    res.locals.adminInvestments = admin.investments
    res.locals.adminPartnershipInvs = admin.partnershipInvestments
    res.locals.giftcards = admin.giftcards
    res.locals.user = req.user
}
const payInvestmentFunc = async function(investments = []) {
    const capitalPlusProfit = (curr) => ((curr.roi / 100) * curr.capital) + curr.capital
    investments.forEach(investment => {
        investment.paid = true
        investment.ended = true
    })
    for (i = 0; i < investments.length; i++) {
        await investments[i].save()
    }
    const totalInc = investments.reduce((acc, curr) => {
        acc += capitalPlusProfit(curr)
        return acc;
    }, 0)
    const activities = investments.map(inv => {
        return { title: "Assets Return", body: "You sold $" + capitalPlusProfit(inv).toLocaleString() + " of " + inv.title + " assets", type: "assets_sell", createdAt: new Date() }
    })
    return { totalInc, activities }
}

const payPTinvestments = async function(plans) {
    for (i = 0; i < plans.length; i++) {
        const amount = ((plans[i].targetAmount * (plans[i].roi/100) * Math.floor(plans[i].lifetimeDuration / plans[i].paymentInterval)) + plans[i].deposits.reduce((o, c) => o += c.amount, 0)) / plans[i].users.length 
        const expiry = datefns.addDays(plans[i].startDate, plans[i].lifetimeDuration)
        if (datefns.isToday(expiry) || datefns.isPast(expiry)) {
            await PTCLUSTER.updateOne({ _id: plans[i]._id }, { ended: true })
            await USER.updateMany({ _id: { $in: plans[i].users.map(u => u.userId) } }, {
                $inc: { balance: amount },
                $push: { activities: { title: " Partnership Payout #" + plans[i].id, body: "You earned $" + amount.toLocaleString() + " in your partnership Cluster ", type: "assets_sell" } }
            })
        }
    }
}

module.exports = {
    payInvestmentFunc,
    payPTinvestments,
    res_locals
}