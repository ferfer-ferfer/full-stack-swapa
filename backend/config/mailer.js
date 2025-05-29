const nodemailer = require("nodemailer");
require("dotenv").config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
  secure: true,
  port: 465,
  debug: true,
  logger: true,
});

const contactMail= (from, text) => {
  return transporter.sendMail({
    from,
    to: process.env.MAIL_USER,
    subject:"Contact Form Submission",
    text,
  });
};

const sendMail = (to, subject, text) => {
  return transporter.sendMail({
    from: process.env.MAIL_USER,
    to,
    subject,
    text,
  });
};

module.exports = {
  contactMail,
  sendMail,
};
