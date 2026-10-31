const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

// Load environment variables from backend directory .env if present
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const predictionsRouter = require('./routes/predictions');
const assessmentsRouter = require('./routes/assessments');
const assessmentsLibraryRouter = require('./routes/assessmentsLibrary');
const profileRouter = require('./routes/profile');

const app = express();
const PORT = process.env.PORT || 5000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// CORS configuration for frontend origin
app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true,
  })
);

// JSON request body parser with reasonable size limit
app.use(express.json({ limit: '10mb' }));

/**
 * Checks physical presence of required ML artifacts.
 */
function checkModelReadiness() {
  const modelsDir = path.resolve(__dirname, '../models');
  const requiredArtifacts = [
    'burnout_model_a.joblib',
    'burnout_model_b.joblib',
    'burnout_feature_columns.json',
    'emotion_model.joblib',
    'emotion_feature_columns.json',
    'face_landmarker.task',
  ];

  return requiredArtifacts.every((file) => fs.existsSync(path.join(modelsDir, file)));
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  const modelsReady = checkModelReadiness();

  res.status(200).json({
    status: 'ok',
    service: 'student-burnout-backend',
    modelsReady,
    timestamp: new Date().toISOString(),
  });
});

// Mount domain routes
app.use('/api/predictions', predictionsRouter);
app.use('/api/assessments', assessmentsRouter);
app.use('/api/assessments-library', assessmentsLibraryRouter);
app.use('/api/profile', profileRouter);

// Unknown route handler (returns JSON 404)
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Cannot ${req.method} ${req.originalUrl}`,
    },
  });
});

// Central error handling middleware (returns JSON without leaking paths/traces)
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || (err.status && Number.isInteger(err.status) ? err.status : 500);
  const errorCode = err.code || (statusCode === 400 ? 'INVALID_INPUT' : 'INTERNAL_SERVER_ERROR');
  const message = err.message || 'An unexpected error occurred.';

  // Log internal diagnostic error to server console
  if (statusCode >= 500) {
    console.error(`[Server Error] ${errorCode}:`, err);
  }

  res.status(statusCode).json({
    success: false,
    error: {
      code: errorCode,
      message,
    },
  });
});

// Start the HTTP server only if executed directly
let server = null;
if (require.main === module) {
  server = app.listen(PORT, () => {
    console.log(`Backend server running on http://localhost:${PORT}`);
  });
}

module.exports = { app, server, checkModelReadiness };
