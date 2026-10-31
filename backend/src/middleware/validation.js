/**
 * Input Validation & Security Middleware
 */

const path = require('path');
const fs = require('fs');

const PROHIBITED_LEAKAGE = ['mental_health_index', 'risk_level', 'dropout_risk'];

const MODEL_A_NUMERICS = [
  'age',
  'academic_year',
  'study_hours_per_day',
  'exam_pressure',
  'academic_performance',
  'sleep_hours',
  'physical_activity',
  'social_support',
  'screen_time',
  'internet_usage',
  'financial_stress',
  'family_expectation',
];

const MODEL_B_EXTRA_NUMERICS = [
  'stress_level',
  'anxiety_score',
  'depression_score',
];

const MODEL_B_NUMERICS = [...MODEL_A_NUMERICS, ...MODEL_B_EXTRA_NUMERICS];

const VALID_GENDERS = new Set(['Female', 'Male', 'Other']);

/**
 * Validates request body for burnout prediction endpoints.
 * @param {'model_a'|'model_b'} modelName
 */
function validateBurnoutRequest(modelName) {
  return (req, res, next) => {
    if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'Request body must be a JSON object.',
        },
      });
    }

    const { features } = req.body;
    if (!features || typeof features !== 'object' || Array.isArray(features)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: "The 'features' property is required and must be an object.",
        },
      });
    }

    // Check for target leakage in root or features
    for (const leak of PROHIBITED_LEAKAGE) {
      if (leak in req.body || leak in features) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: `Prohibited target-leakage feature '${leak}' is not allowed.`,
          },
        });
      }
    }

    const requiredNumerics = modelName === 'model_a' ? MODEL_A_NUMERICS : MODEL_B_NUMERICS;
    const allowedKeys = new Set([...requiredNumerics, 'gender']);
    const providedKeys = Object.keys(features);

    // Check for unexpected extra keys
    const unexpected = providedKeys.filter((k) => !allowedKeys.has(k));
    if (unexpected.length > 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: `Unexpected feature fields provided: ${unexpected.join(', ')}.`,
        },
      });
    }

    // Check for missing keys
    const missing = Array.from(allowedKeys).filter((k) => !(k in features));
    if (missing.length > 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: `Missing required feature fields: ${missing.join(', ')}.`,
        },
      });
    }

    // Validate numeric fields (reject boolean, string, NaN, inf)
    for (const col of requiredNumerics) {
      const val = features[col];
      if (typeof val !== 'number' || !Number.isFinite(val) || typeof val === 'boolean') {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: `Field '${col}' must be a finite numeric value.`,
          },
        });
      }
    }

    // Validate gender
    const gender = features.gender;
    if (typeof gender !== 'string' || !VALID_GENDERS.has(gender)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: "Field 'gender' must be one of 'Female', 'Male', or 'Other'.",
        },
      });
    }

    next();
  };
}

/**
 * Validates video path for emotion prediction, enforcing canonical resolution
 * and directory allowlist checks.
 */
function validateEmotionRequest(req, res, next) {
  if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_INPUT',
        message: 'Request body must be a JSON object.',
      },
    });
  }

  const { video_path } = req.body;
  if (!video_path || typeof video_path !== 'string' || !video_path.trim()) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_INPUT',
        message: "The 'video_path' property is required and must be a non-empty string.",
      },
    });
  }

  // Determine allowed directories
  const projectRoot = path.resolve(__dirname, '../../../');
  const defaultVideoDir = path.join(projectRoot, 'video');

  const configuredDirs = process.env.ALLOWED_VIDEO_DIRS
    ? process.env.ALLOWED_VIDEO_DIRS.split(',').map((d) => path.resolve(d.trim()))
    : [defaultVideoDir];

  // Resolve target path canonically
  const resolvedPath = path.resolve(video_path);

  // Check existence
  if (!fs.existsSync(resolvedPath)) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_VIDEO_PATH',
        message: 'Specified video file does not exist.',
      },
    });
  }

  // Canonicalize via realpath to prevent symlink traversal
  let canonicalPath;
  try {
    canonicalPath = fs.realpathSync(resolvedPath);
  } catch (err) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_VIDEO_PATH',
        message: 'Unable to resolve video path canonically.',
      },
    });
  }

  // Verify against allowlisted directories
  const isAllowed = configuredDirs.some((allowedDir) => {
    let canonicalAllowed;
    try {
      canonicalAllowed = fs.realpathSync(allowedDir);
    } catch {
      canonicalAllowed = allowedDir;
    }
    return canonicalPath === canonicalAllowed || canonicalPath.startsWith(canonicalAllowed + path.sep);
  });

  if (!isAllowed) {
    return res.status(403).json({
      success: false,
      error: {
        code: 'PATH_NOT_ALLOWED',
        message: 'Video path is not in an authorized directory.',
      },
    });
  }

  // Attach sanitized canonical path for downstream use
  req.canonicalVideoPath = canonicalPath;
  next();
}

module.exports = {
  validateBurnoutRequest,
  validateEmotionRequest,
};
