const nodemailer = require("nodemailer");
const nodemailerSendgrid = require("nodemailer-sendgrid");
const transport = nodemailer.createTransport(
  nodemailerSendgrid({
    apiKey: process.env.SENDGRID_API_KEY,
  })
);

exports.sendConfirmationEmail = async (user) => {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  const msg = {
    to: email, // Change to your recipient
    from: "berrytree@gmail.com", // Change to your verified sender
    subject: "Account Activation Link",
    html: `
            <h2>Activate your account</h2>
            <p>Click this link to confirm your email address and complete setup for your account</p>
            <p>${process.env.CLIENT_URL}/authentication/activate/${token}</p>
            <p>This link will expire in 15 minutes</p>
            <h6>Team Collab</h6>
          `,
  };
  sgMail
    .send(msg)
    .then(() => {
      return res.status(200).json({
        message: "Verification Link Sent Successfully",
      });
    })
    .catch((error) => {
      return res.status(400).json({
        error: error,
      });
    });
};

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
