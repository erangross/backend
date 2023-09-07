const nodemailer = require('nodemailer');

async function emailVerification(fromEmail, toEmail, hashedPassword) {
  try {
    // Create a transporter object with the custom transport plugin
    const transporter = nodemailer.createTransport({
      host: 'localhost',
      port: 25,
      secure: false,
    });

    // Create the email message
    const message = {
      from: fromEmail,
      to: toEmail,
      subject: 'Email Verification',
      text: `Please click on the following link to verify your email address: https://example.com/verify-email?hashedPassword=${hashedPassword}`,
    };

    // Send the email
    const info = await transporter.sendMail(message);
    console.log(`Email sent: ${info.messageId}`);
  } catch (err) {
    console.error(err);
  }
}

module.exports = emailVerification;