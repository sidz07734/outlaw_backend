const express = require('express');
const { generateSurvey, getSurveys } = require('../controllers/surveyController');

const router = express.Router();

router.route('/').get(getSurveys);
router.route('/generate').post(generateSurvey);

module.exports = router;