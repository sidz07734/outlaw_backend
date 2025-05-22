const Survey = require('../models/Survey');

// Mock OpenAI integration (replace with actual OpenAI API call if you have a key)
const generateSurveyQuestions = async (productIdea) => {
  // Mock response - in reality, this would call OpenAI API
  return [
    `What problem does ${productIdea.split(' ').slice(0, 3).join(' ')} solve for you?`,
    `How would you rate the importance of this solution on a scale of 1-10?`,
    `What features would you expect from this product?`,
    `How much would you be willing to pay for this solution?`,
    `Would you recommend this product to others if it existed today?`
  ];
};

// Generate survey questions
exports.generateSurvey = async (req, res) => {
  try {
    const { productIdea } = req.body;
    
    if (!productIdea) {
      return res.status(400).json({ success: false, error: 'Please provide a product idea' });
    }
    
    const questions = await generateSurveyQuestions(productIdea);
    
    const survey = await Survey.create({
      productIdea,
      questions
    });
    
    res.status(201).json({
      success: true,
      data: survey
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// Get all surveys
exports.getSurveys = async (req, res) => {
  try {
    const surveys = await Survey.find();
    
    res.status(200).json({
      success: true,
      count: surveys.length,
      data: surveys
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};