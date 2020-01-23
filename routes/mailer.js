const nodeMailer = require('nodemailer');
const creds = require('./creds');

const transport = {
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: creds.username,
    pass: creds.password,
  },
};

const transporter = nodeMailer.createTransport(transport);

transporter.verify((error) => {
  if (error) {
    console.log(error);
  }
});

module.exports = transporter;
