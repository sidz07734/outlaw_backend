// src/services/emailService.js
const nodemailer = require('nodemailer');

// Create email transporter with better error handling
let transporter;
try {
  transporter = nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com', // Add explicit host
    port: 465, // Use SSL port
    secure: true, // Use SSL
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_APP_PASSWORD
    },
    tls: {
      rejectUnauthorized: false // Helps with development environments
    },
    debug: true // Enable debug mode for troubleshooting
  });
  
  // Verify connection configuration
  transporter.verify(function(error, success) {
    if (error) {
      console.error('SMTP connection error:', error);
    } else {
      console.log('SMTP server is ready to send messages');
    }
  });
  
} catch (error) {
  console.error('Failed to create email transporter:', error);
}

// Utility function to validate email address format
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Send booking confirmation email
exports.sendBookingConfirmation = async (recipient, bookingDetails) => {
  if (!transporter) {
    throw new Error('Email transporter not initialized properly');
  }
  
  if (!recipient || !isValidEmail(recipient)) {
    throw new Error('Invalid recipient email address');
  }
  
  try {
    const { date, startTime, endTime, questions } = bookingDetails;
    
    // Validate required booking details
    if (!date || !startTime || !endTime) {
      throw new Error('Missing required booking details (date, startTime, or endTime)');
    }
    
    // Format the date
    const formattedDate = new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    // Build HTML for questions
    const questionsList = questions && questions.length > 0 
      ? questions.map((q, index) => `<li style="margin-bottom: 10px;">${q}</li>`).join('')
      : '<li style="margin-bottom: 10px;">No questions provided</li>';
    
    // Email content
    const mailOptions = {
      from: `"Outlaw Surveys" <${process.env.EMAIL_USER}>`,
      to: recipient,
      subject: 'Your SME Interview is Confirmed',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 5px;">
          <div style="background: linear-gradient(135deg, #3f51b5 0%, #1a237e 100%); padding: 30px 20px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Your Interview is Confirmed!</h1>
          </div>
          
          <div style="padding: 30px;">
            <p style="font-size: 16px; color: #333333; margin-top: 0;">Dear Client,</p>
            
            <p style="font-size: 16px; color: #333333;">Your SME interview has been successfully scheduled. Here are the details:</p>
            
            <div style="background-color: #f5f7ff; border-left: 4px solid #3f51b5; padding: 15px; margin: 25px 0; border-radius: 4px;">
              <p style="margin: 5px 0; font-size: 16px;"><strong>Date:</strong> ${formattedDate}</p>
              <p style="margin: 5px 0; font-size: 16px;"><strong>Time:</strong> ${startTime} - ${endTime}</p>
            </div>
            
            <h3 style="color: #3f51b5; margin-top: 30px; font-size: 18px;">Your Survey Questions:</h3>
            <ol style="padding-left: 20px; color: #333333;">
              ${questionsList}
            </ol>
            
            <p style="font-size: 16px; color: #333333; margin-top: 25px;">Please prepare your responses to these questions before the interview. If you need to reschedule or cancel, please contact us at least 24 hours in advance.</p>
            
            <p style="font-size: 16px; color: #333333; margin-top: 35px;">Best regards,<br>The Outlaw Team</p>
          </div>
          
          <div style="border-top: 1px solid #eeeeee; padding: 20px; text-align: center; background-color: #fafafa;">
            <p style="color: #666666; font-size: 14px; margin: 0;">Thank you for using Outlaw Survey Generator!</p>
            <p style="color: #999999; font-size: 12px; margin-top: 10px;">© 2025 Outlaw. All rights reserved.</p>
          </div>
        </div>
      `,
      // Adding a plain text alternative for better deliverability
      text: `
Your Interview is Confirmed!

Dear Client,

Your SME interview has been successfully scheduled. Here are the details:

Date: ${formattedDate}
Time: ${startTime} - ${endTime}

Your Survey Questions:
${questions && questions.length > 0 
  ? questions.map((q, index) => `${index + 1}. ${q}`).join('\n')
  : 'No questions provided'}

Please prepare your responses to these questions before the interview. If you need to reschedule or cancel, please contact us at least 24 hours in advance.

Best regards,
The Outlaw Team

Thank you for using Outlaw Survey Generator!
      `
    };
    
    // Send the email with detailed logging
    console.log(`Sending confirmation email to: ${recipient}`);
    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent successfully! Message ID: ${info.messageId}`);
    return info;
    
  } catch (error) {
    console.error(`Failed to send confirmation email to ${recipient}:`, error);
    throw new Error(`Failed to send confirmation email: ${error.message}`);
  }
};

// Add a simple test email function
exports.sendSimpleTestEmail = async (recipient) => {
  if (!transporter) {
    throw new Error('Email transporter not initialized properly');
  }
  
  if (!recipient || !isValidEmail(recipient)) {
    throw new Error('Invalid recipient email address');
  }
  
  try {
    // Simple plain text email for maximum compatibility
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: recipient,
      subject: 'Simple Test Email from Outlaw',
      text: 'This is a simple test email. If you can read this, email functionality is working correctly.'
    };
    
    console.log(`Sending simple test email to: ${recipient}`);
    console.log('Using credentials:', {
      EMAIL_USER: process.env.EMAIL_USER,
      EMAIL_APP_PASSWORD_EXISTS: !!process.env.EMAIL_APP_PASSWORD
    });
    
    const info = await transporter.sendMail(mailOptions);
    console.log(`Simple test email sent successfully! Message ID: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error(`Failed to send simple test email to ${recipient}:`, error);
    throw error;
  }
};

// The rest of your original code for sendTestEmail, generateICalendarEvent, and sendSurveyCreationConfirmation...
exports.sendTestEmail = async (recipient) => {
  if (!transporter) {
    throw new Error('Email transporter not initialized properly');
  }
  
  if (!recipient || !isValidEmail(recipient)) {
    throw new Error('Invalid recipient email address');
  }
  
  try {
    // Log environment variables (without exposing full password)
    console.log('Email configuration:', {
      EMAIL_USER: process.env.EMAIL_USER,
      EMAIL_APP_PASSWORD_EXISTS: !!process.env.EMAIL_APP_PASSWORD
    });
    
    const mailOptions = {
      from: `"Outlaw Surveys" <${process.env.EMAIL_USER}>`,
      to: recipient,
      subject: 'Test Email from Outlaw Survey App',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 5px;">
          <div style="background: linear-gradient(135deg, #3f51b5 0%, #1a237e 100%); padding: 30px 20px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Email System Test</h1>
          </div>
          
          <div style="padding: 30px;">
            <p style="font-size: 16px; color: #333333;">This is a test email from the Outlaw Survey App.</p>
            <p style="font-size: 16px; color: #333333;">If you're receiving this email, it means your email configuration is working correctly!</p>
            <p style="font-size: 16px; color: #333333;">Test conducted at: ${new Date().toLocaleString()}</p>
            
            <div style="background-color: #f5f7ff; border-left: 4px solid #3f51b5; padding: 15px; margin: 25px 0; border-radius: 4px;">
              <p style="margin: 5px 0; font-size: 16px;"><strong>Environment:</strong> ${process.env.NODE_ENV || 'development'}</p>
              <p style="margin: 5px 0; font-size: 16px;"><strong>Server:</strong> ${process.env.SERVER_URL || 'localhost'}</p>
            </div>
          </div>
          
          <div style="border-top: 1px solid #eeeeee; padding: 20px; text-align: center; background-color: #fafafa;">
            <p style="color: #666666; font-size: 14px; margin: 0;">Thank you for using Outlaw Survey Generator!</p>
          </div>
        </div>
      `,
      text: `
Email System Test

This is a test email from the Outlaw Survey App.
If you're receiving this email, it means your email configuration is working correctly!
Test conducted at: ${new Date().toLocaleString()}

Environment: ${process.env.NODE_ENV || 'development'}
Server: ${process.env.SERVER_URL || 'localhost'}

Thank you for using Outlaw Survey Generator!
      `
    };
    
    console.log(`Attempting to send test email to: ${recipient}`);
    const info = await transporter.sendMail(mailOptions);
    console.log(`Test email sent successfully! Message ID: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error(`Failed to send test email to ${recipient}:`, error);
    throw error;
  }
};

// Utility function to generate a simple iCalendar event
function generateICalendarEvent({ startDate, endDate, summary, description }) {
  if (!startDate || !endDate) return null;
  
  // Format dates to iCalendar format
  const formatToICSDate = (date) => {
    return date.toISOString().replace(/-|:|\.\d+/g, '');
  };
  
  const now = new Date();
  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Outlaw Surveys//Survey App//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:REQUEST',
    'BEGIN:VEVENT',
    `DTSTART:${formatToICSDate(startDate)}`,
    `DTEND:${formatToICSDate(endDate)}`,
    `DTSTAMP:${formatToICSDate(now)}`,
    `UID:${Date.now()}@outlaw-surveys.com`,
    `CREATED:${formatToICSDate(now)}`,
    `DESCRIPTION:${description || 'SME Interview'}`,
    `LAST-MODIFIED:${formatToICSDate(now)}`,
    'LOCATION:Online',
    'SEQUENCE:0',
    'STATUS:CONFIRMED',
    `SUMMARY:${summary || 'SME Interview'}`,
    'TRANSP:OPAQUE',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');
  
  return icsContent;
}

// Send survey creation confirmation
exports.sendSurveyCreationConfirmation = async (recipient, surveyDetails) => {
  if (!transporter) {
    throw new Error('Email transporter not initialized properly');
  }
  
  if (!recipient || !isValidEmail(recipient)) {
    throw new Error('Invalid recipient email address');
  }
  
  try {
    const { title, questions, createdAt } = surveyDetails;
    
    // Format date
    const formattedDate = new Date(createdAt || Date.now()).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    // Build HTML for questions
    const questionsList = questions && questions.length > 0 
      ? questions.map((q, index) => `<li style="margin-bottom: 10px;">${q}</li>`).join('')
      : '<li style="margin-bottom: 10px;">No questions generated</li>';
    
    // Email content
    const mailOptions = {
      from: `"Outlaw Surveys" <${process.env.EMAIL_USER}>`,
      to: recipient,
      subject: 'Your AI-Generated Survey is Ready',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 5px;">
          <div style="background: linear-gradient(135deg, #3f51b5 0%, #1a237e 100%); padding: 30px 20px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Your Survey is Ready!</h1>
          </div>
          
          <div style="padding: 30px;">
            <p style="font-size: 16px; color: #333333; margin-top: 0;">Dear Creator,</p>
            
            <p style="font-size: 16px; color: #333333;">Your AI-generated survey has been successfully created. Here are the details:</p>
            
            <div style="background-color: #f5f7ff; border-left: 4px solid #3f51b5; padding: 15px; margin: 25px 0; border-radius: 4px;">
              <p style="margin: 5px 0; font-size: 16px;"><strong>Title:</strong> ${title || 'Custom Survey'}</p>
              <p style="margin: 5px 0; font-size: 16px;"><strong>Created on:</strong> ${formattedDate}</p>
            </div>
            
            <h3 style="color: #3f51b5; margin-top: 30px; font-size: 18px;">Your Generated Questions:</h3>
            <ol style="padding-left: 20px; color: #333333;">
              ${questionsList}
            </ol>
            
            <p style="font-size: 16px; color: #333333; margin-top: 25px;">You can now use these questions for your SME interviews. Log in to your Outlaw account to manage your survey or schedule interviews.</p>
            
            <p style="font-size: 16px; color: #333333; margin-top: 35px;">Best regards,<br>The Outlaw Team</p>
          </div>
          
          <div style="border-top: 1px solid #eeeeee; padding: 20px; text-align: center; background-color: #fafafa;">
            <p style="color: #666666; font-size: 14px; margin: 0;">Thank you for using Outlaw Survey Generator!</p>
            <p style="color: #999999; font-size: 12px; margin-top: 10px;">© 2025 Outlaw. All rights reserved.</p>
          </div>
        </div>
      `,
      text: `
Your Survey is Ready!

Dear Creator,

Your AI-generated survey has been successfully created. Here are the details:

Title: ${title || 'Custom Survey'}
Created on: ${formattedDate}

Your Generated Questions:
${questions && questions.length > 0 
  ? questions.map((q, index) => `${index + 1}. ${q}`).join('\n') 
  : 'No questions generated'}

You can now use these questions for your SME interviews. Log in to your Outlaw account to manage your survey or schedule interviews.

Best regards,
The Outlaw Team

Thank you for using Outlaw Survey Generator!
      `
    };
    
    // Send the email
    console.log(`Sending survey creation confirmation to: ${recipient}`);
    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent successfully! Message ID: ${info.messageId}`);
    return info;
    
  } catch (error) {
    console.error(`Failed to send survey creation email to ${recipient}:`, error);
    throw new Error(`Failed to send survey creation email: ${error.message}`);
  }
};