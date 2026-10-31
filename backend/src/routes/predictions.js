/**
 * Prediction Routes
 * Handles Model A, Model B, and Visual Emotion inference requests.
 */

const express = require('express');
const { validateBurnoutRequest, validateEmotionRequest } = require('../middleware/validation');
const { runPythonScript } = require('../services/pythonRunner');
const { defaultStore } = require('../services/assessmentStore');

const router = express.Router();

/**
 * POST /api/predictions/burnout/model-a
 */
router.post('/burnout/model-a', validateBurnoutRequest('model_a'), async (req, res, next) => {
  try {
    const payload = {
      model: 'model_a',
      features: req.body.features,
    };

    const result = await runPythonScript('predict_burnout.py', {
      stdinData: payload,
      timeout: 15000,
    });

    const record = defaultStore.add({
      type: 'burnout_model_a',
      model: 'model_a',
      prediction: result.prediction,
    });

    res.status(200).json({
      success: true,
      assessmentId: record.id,
      model: 'model_a',
      prediction: result.prediction,
      createdAt: record.createdAt,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/predictions/burnout/model-b
 */
router.post('/burnout/model-b', validateBurnoutRequest('model_b'), async (req, res, next) => {
  try {
    const payload = {
      model: 'model_b',
      features: req.body.features,
    };

    const result = await runPythonScript('predict_burnout.py', {
      stdinData: payload,
      timeout: 15000,
    });

    const record = defaultStore.add({
      type: 'burnout_model_b',
      model: 'model_b',
      prediction: result.prediction,
    });

    res.status(200).json({
      success: true,
      assessmentId: record.id,
      model: 'model_b',
      prediction: result.prediction,
      createdAt: record.createdAt,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/predictions/emotion
 */
router.post('/emotion', validateEmotionRequest, async (req, res, next) => {
  try {
    const videoPath = req.canonicalVideoPath;

    const result = await runPythonScript('predict_emotion.py', {
      args: [videoPath],
      timeout: 35000, // Processing 5 frames with MediaPipe FaceLandmarker
    });

    const record = defaultStore.add({
      type: 'emotion',
      model: 'emotion_svm',
      prediction: result.prediction,
    });

    res.status(200).json({
      success: true,
      assessmentId: record.id,
      model: 'emotion_svm',
      prediction: result.prediction,
      createdAt: record.createdAt,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
