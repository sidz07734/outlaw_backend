require('dotenv').config();
const nodemailer = require('nodemailer');

// Create test function
async function testEmail() {
  console.log('Environment variables:', {
    EMAIL_USER: process.env.EMAIL_USER,
    PASSWORD_SET: !!process.env.EMAIL_APP_PASSWORD
  });

  // Create a transporter with verbose debugging
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_APP_PASSWORD
    },
    debug: true,
    logger: true
  });

  try {
    // Test connection
    await transporter.verify();
    console.log('Connection to SMTP server successful!');

    // Send test email
    const info = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: 'siddharth07734@gmail.com', // Change this
      subject: 'Direct Test Email',
      text: 'If you can see this, email is working!'
    });

    console.log('Message sent: %s', info.messageId);
    console.log('Test completed successfully');
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the test
testEmail();