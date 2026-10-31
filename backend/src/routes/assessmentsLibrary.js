/**
 * Assessment Library Read-Only Routes
 * Serves verified static questionnaire definitions for faculty demonstration
 * and client-side rendering.
 */

const express = require('express');
const path = require('path');
const fs = require('fs');

const router = express.Router();
const ASSESSMENTS_DIR = path.resolve(__dirname, '../../assessments');

/**
 * Validates that an assessment ID is a simple alphanumeric/kebab-case identifier.
 */
function isValidId(id) {
  return typeof id === 'string' && /^[a-z0-9-]+$/.test(id);
}

/**
 * GET /api/assessments-library
 * Returns the manifest of all registered assessments.
 */
router.get('/', (req, res, next) => {
  try {
    const indexPath = path.join(ASSESSMENTS_DIR, 'assessment-index.json');
    if (!fs.existsSync(indexPath)) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Assessment index not found.' },
      });
    }

    const data = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
    res.status(200).json({
      success: true,
      data,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/assessments-library/:id
 * Retrieves a single assessment definition by ID with strict traversal guards.
 */
router.get('/:id', (req, res, next) => {
  try {
    const assessmentId = req.params.id;

    if (!isValidId(assessmentId)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_ID',
          message: 'Invalid assessment identifier format. Only lowercase letters, numbers, and hyphens are allowed.',
        },
      });
    }

    const targetFile = path.join(ASSESSMENTS_DIR, `${assessmentId}.json`);

    // Verify file stays within assessments directory
    const resolvedPath = path.resolve(targetFile);
    if (!resolvedPath.startsWith(ASSESSMENTS_DIR)) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Access denied.' },
      });
    }

    if (!fs.existsSync(resolvedPath)) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: `Assessment '${assessmentId}' was not found.`,
        },
      });
    }

    const content = JSON.parse(fs.readFileSync(resolvedPath, 'utf8'));
    res.status(200).json({
      success: true,
      data: content,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
