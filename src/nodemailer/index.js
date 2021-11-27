const nodemailer = require("nodemailer");
const nodemailerSendgrid = require("nodemailer-sendgrid");
const transport = nodemailer.createTransport(
  nodemailerSendgrid({
    apiKey: process.env.SENDGRID_API_KEY,
  })
);

exports.sendConfirmationEmail = async (user) => {};

/*
let testAccount = await nodemailer.createTestAccount();

          let transporter = nodemailer.createTransport({
            service: "Gmail",
            auth: {
              user: "shivamgupta3467@gmail.com", // generated ethereal user
              pass: "Chairmike@12",
            },
          });

          const url = `http://localhost:3000/confirmation/${emailToken}`;

          let info = await transporter.sendMail({
            from: '"Community 👻" <shivamgupta3467@gmail.com>', // sender address
            to: `${args.email}, shivamgupta`,
            subject: "Confirm Email",
            html: `Please click this email to confirm your email: <a href="${url}">${url}</a>`,
          });
          console.log("Message sent: %s", info.messageId);
          // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>

          // Preview only available when sending through an Ethereal account
          console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));

*/
