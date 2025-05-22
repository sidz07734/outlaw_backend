const Booking = require('../models/Booking');
const User = require('../models/User');
const emailService = require('../services/emailService');
const nodemailer = require('nodemailer');

// Create available time slots
exports.createTimeSlot = async (req, res) => {
  try {
    const { creatorId, date, startTime, endTime, questions, email } = req.body;
    
    if (!creatorId || !date || !startTime || !endTime) {
      return res.status(400).json({ 
        success: false, 
        error: 'Please provide all required fields' 
      });
    }
    
    const booking = await Booking.create({
      creatorId,
      date,
      startTime,
      endTime,
      questions: questions || []
    });
    
    // Send confirmation email if email is provided
    let emailResult = { sent: false };
    if (email) {
      try {
        console.log('Attempting to send confirmation email to:', email);
        const info = await emailService.sendBookingConfirmation(email, {
          date: date,
          startTime: startTime,
          endTime: endTime,
          questions: questions || []
        });
        console.log(`Confirmation email sent to ${email}:`, info.messageId);
        emailResult = { sent: true, messageId: info.messageId };
      } catch (emailError) {
        console.error('Failed to send confirmation email:', emailError);
        emailResult = { sent: false, error: emailError.message };
        // Continue with the response even if email fails
      }
    }
    
    res.status(201).json({
      success: true,
      data: booking,
      email: emailResult
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// Get all available time slots
exports.getAvailableSlots = async (req, res) => {
  try {
    const availableSlots = await Booking.find({ isBooked: false });
    
    res.status(200).json({
      success: true,
      count: availableSlots.length,
      data: availableSlots
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// Book a time slot
exports.bookTimeSlot = async (req, res) => {
  try {
    const { id, smeId, email, questions } = req.body;
    
    console.log('Booking request received:', { id, smeId, email, hasQuestions: !!questions });
    
    if (!id || !smeId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Please provide slot ID and SME ID' 
      });
    }
    
    const booking = await Booking.findById(id);
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Time slot not found'
      });
    }
    
    if (booking.isBooked) {
      return res.status(400).json({
        success: false,
        error: 'This time slot is already booked'
      });
    }
    
    booking.smeId = smeId;
    booking.isBooked = true;
    
    // Add questions to the booking if provided
    if (questions && questions.length > 0) {
      booking.questions = questions;
    }
    
    await booking.save();
    
    // Send confirmation email to the SME if email is provided
    let smeEmailResult = { sent: false };
    if (email) {
      try {
        console.log('Attempting to send booking confirmation email to SME:', email);
        const info = await emailService.sendBookingConfirmation(email, {
          date: booking.date,
          startTime: booking.startTime,
          endTime: booking.endTime,
          questions: booking.questions || []
        });
        console.log(`Booking confirmation email sent to SME: ${email}:`, info.messageId);
        smeEmailResult = { sent: true, messageId: info.messageId };
      } catch (emailError) {
        console.error('Failed to send SME confirmation email:', emailError);
        smeEmailResult = { sent: false, error: emailError.message };
        // Continue with the response even if email fails
      }
    } else {
      console.log('No email provided for SME, skipping confirmation email');
    }
    
    // If creator has an email, notify them that their slot was booked
    let creatorEmailResult = { sent: false };
    try {
      const creator = await User.findById(booking.creatorId);
      if (creator && creator.email) {
        console.log('Attempting to send notification email to creator:', creator.email);
        const info = await emailService.sendBookingConfirmation(creator.email, {
          date: booking.date,
          startTime: booking.startTime,
          endTime: booking.endTime,
          questions: booking.questions || [],
          isCreator: true // This flag can be used in the email template to customize the message
        });
        console.log(`Notification email sent to slot creator: ${creator.email}:`, info.messageId);
        creatorEmailResult = { sent: true, messageId: info.messageId };
      } else {
        console.log('Creator email not found or not available, skipping notification');
      }
    } catch (creatorEmailError) {
      console.error('Failed to send creator notification email:', creatorEmailError);
      creatorEmailResult = { sent: false, error: creatorEmailError.message };
      // Continue with the response even if this email fails
    }
    
    res.status(200).json({
      success: true,
      data: booking,
      emails: {
        sme: smeEmailResult,
        creator: creatorEmailResult
      }
    });
  } catch (error) {
    console.error('Error in bookTimeSlot:', error);
    res.status(500).json({
      success: false,
      error: 'Server Error',
      details: error.message
    });
  }
};

// Get all bookings
exports.getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find();
    
    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// Get bookings by creator
exports.getBookingsByCreator = async (req, res) => {
  try {
    const { creatorId } = req.params;
    
    if (!creatorId) {
      return res.status(400).json({
        success: false,
        error: 'Please provide creator ID'
      });
    }
    
    const bookings = await Booking.find({ creatorId });
    
    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// Get bookings by SME
exports.getBookingsBySME = async (req, res) => {
  try {
    const { smeId } = req.params;
    
    if (!smeId) {
      return res.status(400).json({
        success: false,
        error: 'Please provide SME ID'
      });
    }
    
    const bookings = await Booking.find({ smeId, isBooked: true });
    
    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// Resend booking confirmation email
exports.resendConfirmationEmail = async (req, res) => {
  try {
    const { bookingId, email } = req.body;
    
    if (!bookingId || !email) {
      return res.status(400).json({
        success: false,
        error: 'Please provide booking ID and email address'
      });
    }
    
    const booking = await Booking.findById(bookingId);
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found'
      });
    }
    
    console.log(`Resending confirmation email for booking ${bookingId} to ${email}`);
    const info = await emailService.sendBookingConfirmation(email, {
      date: booking.date,
      startTime: booking.startTime,
      endTime: booking.endTime,
      questions: booking.questions || []
    });
    
    res.status(200).json({
      success: true,
      message: 'Confirmation email resent successfully',
      messageId: info.messageId
    });
  } catch (error) {
    console.error('Error resending confirmation email:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Server Error'
    });
  }
};

// Add a test email endpoint to debug email issues
exports.testEmail = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Please provide an email address'
      });
    }
    
    console.log('Email environment variables:', {
      EMAIL_USER_EXISTS: !!process.env.EMAIL_USER,
      EMAIL_APP_PASSWORD_EXISTS: !!process.env.EMAIL_APP_PASSWORD,
      EMAIL_USER_PREFIX: process.env.EMAIL_USER ? process.env.EMAIL_USER.substring(0, 5) + '...' : 'undefined',
      NODE_ENV: process.env.NODE_ENV || 'development'
    });
    
    // Create a direct transporter for testing
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_APP_PASSWORD
      }
    });
    
    // Verify connection configuration
    transporter.verify(function(error, success) {
      if (error) {
        console.error('SMTP connection verification error:', error);
      } else {
        console.log('SMTP server is ready to take our messages');
      }
    });
    
    const mailOptions = {
      from: `"Outlaw Surveys" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Test Email from Outlaw',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 5px;">
          <h1 style="color: #3f51b5;">Test Email</h1>
          <p>This is a test email from Outlaw Survey App to verify that email sending is working correctly.</p>
          <p>If you've received this, your email configuration is working properly!</p>
          <p>Current time: ${new Date().toLocaleString()}</p>
        </div>
      `
    };
    
    console.log('Attempting to send direct test email to:', email);
    const info = await transporter.sendMail(mailOptions);
    console.log('Direct test email sent successfully:', info.messageId);
    
    // Now try using the email service
    console.log('Testing email service...');
    const serviceInfo = await emailService.sendTestEmail(email);
    console.log('Email service test successful:', serviceInfo.messageId);
    
    res.status(200).json({
      success: true,
      message: `Test emails sent to ${email}`,
      directTest: { messageId: info.messageId },
      serviceTest: { messageId: serviceInfo.messageId },
      config: {
        emailUserExists: !!process.env.EMAIL_USER,
        emailPasswordExists: !!process.env.EMAIL_APP_PASSWORD
      }
    });
  } catch (error) {
    console.error('Error in test email endpoint:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
};

// Simple test email function (NEW)
exports.simpleTestEmail = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Please provide an email address'
      });
    }
    
    // Log environment variables (without exposing full password)
    console.log('Email configuration check:', {
      EMAIL_USER: process.env.EMAIL_USER ? `${process.env.EMAIL_USER.substring(0, 3)}...` : 'not set',
      EMAIL_APP_PASSWORD: process.env.EMAIL_APP_PASSWORD ? 'set (masked)' : 'not set',
      NODE_ENV: process.env.NODE_ENV || 'development'
    });
    
    // Create a direct transporter for maximum simplicity
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_APP_PASSWORD
      },
      tls: {
        rejectUnauthorized: false
      }
    });
    
    // Simplest possible email to minimize issues
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Simple Test Email from Outlaw',
      text: 'This is a simple test email. If you can read this, email is working correctly.'
    };
    
    console.log(`Attempting to send simple test email to: ${email}`);
    const info = await transporter.sendMail(mailOptions);
    console.log('Simple test email sent successfully:', info.messageId);
    
    res.status(200).json({
      success: true,
      message: `Simple test email sent to ${email}`,
      messageId: info.messageId,
      env: {
        EMAIL_USER_SET: !!process.env.EMAIL_USER,
        EMAIL_APP_PASSWORD_SET: !!process.env.EMAIL_APP_PASSWORD
      }
    });
  } catch (error) {
    console.error('Error sending simple test email:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
};

// For the survey feature - notification after survey generation
exports.notifySurveyCreation = async (req, res) => {
  try {
    const { email, title, questions } = req.body;
    
    if (!email || !questions || !Array.isArray(questions)) {
      return res.status(400).json({
        success: false,
        error: 'Please provide email and questions array'
      });
    }
    
    console.log('Sending survey creation notification to:', email);
    const info = await emailService.sendSurveyCreationConfirmation(email, {
      title: title || 'AI-Generated Survey',
      questions: questions,
      createdAt: new Date()
    });
    
    res.status(200).json({
      success: true,
      message: 'Survey creation notification sent successfully',
      messageId: info.messageId
    });
  } catch (error) {
    console.error('Error sending survey creation notification:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Server Error'
    });
  }
};

// Cancel a booking
exports.cancelBooking = async (req, res) => {
  try {
    const { bookingId, notifyParticipants = true } = req.body;
    
    if (!bookingId) {
      return res.status(400).json({
        success: false,
        error: 'Please provide booking ID'
      });
    }
    
    const booking = await Booking.findById(bookingId);
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found'
      });
    }
    
    if (!booking.isBooked) {
      return res.status(400).json({
        success: false,
        error: 'This slot is not currently booked'
      });
    }
    
    // Store values before updating
    const oldSmeId = booking.smeId;
    const oldQuestions = booking.questions;
    
    // Update booking
    booking.isBooked = false;
    booking.smeId = null;
    booking.questions = []; // Optional: clear questions on cancellation
    await booking.save();
    
    // Notify participants if requested
    const notifications = { sent: false, creator: { sent: false }, sme: { sent: false } };
    
    if (notifyParticipants) {
      // Notify creator
      try {
        const creator = await User.findById(booking.creatorId);
        if (creator && creator.email) {
          // You can create a new template for cancellation emails in emailService
          // For now, reusing existing function with a flag
          await emailService.sendBookingConfirmation(creator.email, {
            date: booking.date,
            startTime: booking.startTime,
            endTime: booking.endTime,
            questions: oldQuestions || [],
            isCancellation: true,
            isCreator: true
          });
          notifications.creator = { sent: true, email: creator.email };
        }
      } catch (creatorError) {
        console.error('Failed to notify creator of cancellation:', creatorError);
        notifications.creator = { sent: false, error: creatorError.message };
      }
      
      // Notify SME
      try {
        if (oldSmeId) {
          const sme = await User.findById(oldSmeId);
          if (sme && sme.email) {
            await emailService.sendBookingConfirmation(sme.email, {
              date: booking.date,
              startTime: booking.startTime,
              endTime: booking.endTime,
              questions: oldQuestions || [],
              isCancellation: true,
              isSME: true
            });
            notifications.sme = { sent: true, email: sme.email };
          }
        }
      } catch (smeError) {
        console.error('Failed to notify SME of cancellation:', smeError);
        notifications.sme = { sent: false, error: smeError.message };
      }
      
      notifications.sent = notifications.creator.sent || notifications.sme.sent;
    }
    
    res.status(200).json({
      success: true,
      message: 'Booking successfully cancelled',
      data: booking,
      notifications
    });
  } catch (error) {
    console.error('Error cancelling booking:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Server Error'
    });
  }
};

// Debug email setup - detailed diagnostics for email configuration
exports.debugEmailSetup = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Please provide an email address'
      });
    }
    
    // Check environment variables
    const envCheck = {
      EMAIL_USER: process.env.EMAIL_USER,
      EMAIL_APP_PASSWORD_MASKED: process.env.EMAIL_APP_PASSWORD ? '****' + process.env.EMAIL_APP_PASSWORD.slice(-4) : 'not set',
      NODE_ENV: process.env.NODE_ENV || 'development'
    };
    
    console.log('Environment variables check:', envCheck);
    
    // Test direct nodemailer setup
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_APP_PASSWORD
      },
      debug: true, // Enable debug mode
      tls: {
        rejectUnauthorized: false // Helps in development environments
      }
    });
    
    // Verify connection
    let verifyResult;
    try {
      verifyResult = await new Promise((resolve, reject) => {
        transporter.verify(function(error, success) {
          if (error) {
            reject(error);
          } else {
            resolve(success);
          }
        });
      });
      console.log('SMTP verification result:', verifyResult);
    } catch (verifyError) {
      console.error('SMTP verification error:', verifyError);
      verifyResult = { error: verifyError.message };
    }
    
    // Send a simple plain text email (most reliable for testing)
    let sendResult;
    try {
      sendResult = await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Debug Test Email',
        text: 'This is a simple plain text debug email.'
      });
      console.log('Debug email sent:', sendResult.messageId);
    } catch (sendError) {
      console.error('Debug email send error:', sendError);
      sendResult = { error: sendError.message };
    }
    
    res.status(200).json({
      success: true,
      environment: envCheck,
      verifyResult,
      sendResult
    });
  } catch (error) {
    console.error('Error in debug endpoint:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
};