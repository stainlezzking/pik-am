const nodemailer = require('nodemailer')
 require('dotenv').config()

const transporter = nodemailer.createTransport({
    pool: true,
    host: "smtp.zoho.com",
    port: 465,
    secure: true, // use TLS
    auth: {
      user: process.env.NODEMAILER_USER ,
      pass: process.env.NODEMAILER_PASS,
    },
    // tls : {
    //     rejectUnauthorized : true,
    //     minVersion : "TLSv1.2"
    // }
  });


class Message {
    constructor(to,subject,text,html){
        this.from = { name : "PIK ASSETS MANAGEMENT ", address :  process.env.NODEMAILER_USER}
        this.to = to
        this.subject = subject
        this.text = text
        this.html = html
    }
}

module.exports = {Message, transporter}