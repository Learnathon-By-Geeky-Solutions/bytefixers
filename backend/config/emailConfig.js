require("dotenv").config();
const nodemailer = require("nodemailer");

// Create a transporter for sending emails
const transporter = nodemailer.createTransport({
  service: "gmail",
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER, // Your Gmail
    pass: process.env.EMAIL_PASS, // Your App Password (Enable 2FA & Use App Password)
  },
});
const emailConfig = async (to, projectId, inviteLink) => {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject: `You Have Been Invited to Join Project ${projectId}`,
      html: `<p>You have been invited to join the project with ID: ${projectId}.</p>
             <p>Click <a href="${inviteLink}">here</a> to accept the invitation.</p>`,
    });

    console.log(`Invitation email sent to ${to}`);
  } catch (error) {
    console.error("Error sending email:", error);
  }
};

module.exports = emailConfig;
