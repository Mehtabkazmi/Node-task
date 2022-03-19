const nodemailer = require('nodemailer');

exports.sendEmail = async (options) => {
    const transporter = nodemailer.createTransport({
        host: "smtp.mailtrap.io",
        post: 2525,
        auth: {
            user: "211d4679e3d79c",
            pass: "9e2b7d43009e26",
        },
    });
    const mailOptions = {
    from: process.env.SMPT_MAIL,
    to: options.email,
    subject: options.subject,
    text: options.message,
    };
    await transporter.sendMail(mailOptions);
}