const nodemailer = require(`nodemailer`);

//to get the nodemailer password, you need to check your gmail account
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "gozalidonny@gmail.com",
    pass: "ktzvnotycqygzmph",
  },
});

module.exports = transporter;
