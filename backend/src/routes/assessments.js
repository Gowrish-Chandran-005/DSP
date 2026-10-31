/**
 * Assessment History Routes
 * In-memory assessment retrieval and deletion.
 */

const express = require('express');
const { defaultStore } = require('../services/assessmentStore');

const router = express.Router();

/**
 * GET /api/assessments
 * Retrieves all stored assessment records (newest first).
 */
router.get('/', (req, res) => {
  const records = defaultStore.getAll();
  res.status(200).json({
    success: true,
    count: records.length,
    data: records,
  });
});

/**
 * GET /api/assessments/:id
 * Retrieves a single assessment record.
 */
router.get('/:id', (req, res) => {
  const record = defaultStore.getById(req.params.id);
  if (!record) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: `Assessment with ID '${req.params.id}' was not found.`,
      },
    });
  }

  res.status(200).json({
    success: true,
    data: record,
  });
});

/**
 * DELETE /api/assessments/:id
 * Deletes a single assessment record from memory.
 */
router.delete('/:id', (req, res) => {
  const deleted = defaultStore.deleteById(req.params.id);
  if (!deleted) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: `Assessment with ID '${req.params.id}' was not found.`,
      },
    });
  }

  res.status(200).json({
    success: true,
    message: `Assessment '${req.params.id}' successfully deleted.`,
  });
});

module.exports = router;
