const express = require("express")
const app = express()

const realestateRouter = require("./routers/realestate/dashboard")

app.set("view engine", "ejs")

app.use("/pik-home/", realestateRouter)
app.use(express.static("public"))

const PORT = process.env.PORT || 3000
app.listen(PORT, ()=>{
    console.log("app running on port " + PORT)
})