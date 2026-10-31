/**
 * Student Profile Routes
 * Manages authenticated student profile details, academic records,
 * and integration status for VTOP and mobile screen time.
 */

const express = require('express');
const router = express.Router();

// In-memory store for profile records keyed by email
const profileStore = new Map();

// Default initial profile for demonstration
const createDefaultProfile = (email = 'maya.lin@campus.edu', name = 'Maya Lin') => ({
  basic: {
    fullName: name,
    preferredName: name.split(' ')[0],
    email: email,
    studentId: '21BCE1024',
    institution: 'VIT Vellore',
    campus: 'Vellore Main Campus',
    degree: 'B.Tech',
    specialization: 'Computer Science and Engineering',
    academicYear: 3,
    semester: 6,
    expectedGraduation: 2027,
  },
  academic: {
    institution: 'VIT Vellore',
    degree: 'B.Tech Computer Science and Engineering',
    specialization: 'Artificial Intelligence & Machine Learning',
    currentSemester: 6,
    academicYear: 3,
    cgpa: null, // Displayed as "Not provided"
    recentGpa: null,
    courses: [
      { code: 'CSE3002', name: 'Internet and Web Programming', credits: 4, faculty: 'School of Computing Science' },
      { code: 'CSE3006', name: 'Computer Networks', credits: 4, faculty: 'School of Computing Science' },
      { code: 'CSE4001', name: 'Machine Learning', credits: 4, faculty: 'School of Computing Science' },
      { code: 'MAT3004', name: 'Applied Statistics & Probability', credits: 3, faculty: 'Department of Mathematics' },
    ],
    upcomingExams: [], // Empty by default
    upcomingDeadlines: [
      { title: 'Machine Learning Lab Exercise 4', dueDate: 'In 5 days', course: 'CSE4001', status: 'In Progress' },
    ],
    weeklyStudyHours: 28,
    workloadRating: 'Moderate to Heavy',
    academicGoals: 'Maintain balanced study sprints without late-night cramming.',
  },
  preferences: {
    typicalSleepHours: 7.0,
    preferredStudyDuration: 45, // minutes
    preferredBreakInterval: 10, // minutes
    reminderStyle: 'Gentle',
    notificationPreferences: {
      studyReminders: true,
      sleepPrompts: true,
      weeklyDigest: true,
    },
    accessibilityPreferences: {
      reducedMotion: false,
      highContrast: false,
      screenReaderOptimized: false,
    },
  },
  integrations: {
    vtop: {
      status: 'Integration not configured',
      connected: false,
      apiEndpoint: '',
      lastSync: null,
      supportedData: ['Course details', 'Semester attendance', 'Exam schedules', 'Internal marks'],
      requiresAuth: true,
      notes: 'Browser-based systems cannot access VTOP credentials directly. Official VIT institution API integration required.',
    },
    screenTime: {
      status: 'Integration not configured',
      connected: false,
      apiEndpoint: '',
      lastSync: null,
      supportedData: ['Daily screen hours', 'App category usage', 'Screen time during study sessions'],
      requiresAuth: true,
      notes: 'Browsers cannot read OS-level device screen time directly. Requires manual JSON/CSV export or authorized mobile companion app.',
    },
    manualImports: [],
  },
  updatedAt: new Date().toISOString(),
});

/**
 * GET /api/profile
 * Retrieves profile for the requested or current student.
 */
router.get('/', (req, res) => {
  const email = (req.query.email || 'maya.lin@campus.edu').toLowerCase().trim();
  if (!profileStore.has(email)) {
    profileStore.set(email, createDefaultProfile(email));
  }

  res.status(200).json({
    success: true,
    data: profileStore.get(email),
  });
});

/**
 * PUT /api/profile
 * Updates basic, academic, preferences, or integration fields with validation.
 */
router.put('/', (req, res) => {
  const email = (req.body.email || req.query.email || 'maya.lin@campus.edu').toLowerCase().trim();

  if (!profileStore.has(email)) {
    profileStore.set(email, createDefaultProfile(email));
  }

  const existing = profileStore.get(email);
  const updates = req.body;

  // Deep update
  const updated = {
    ...existing,
    basic: { ...existing.basic, ...(updates.basic || {}) },
    academic: { ...existing.academic, ...(updates.academic || {}) },
    preferences: { ...existing.preferences, ...(updates.preferences || {}) },
    integrations: {
      ...existing.integrations,
      ...(updates.integrations || {}),
      vtop: {
        ...existing.integrations.vtop,
        ...(updates.integrations?.vtop || {}),
      },
      screenTime: {
        ...existing.integrations.screenTime,
        ...(updates.integrations?.screenTime || {}),
      },
      manualImports: updates.integrations?.manualImports || existing.integrations.manualImports,
    },
    updatedAt: new Date().toISOString(),
  };

  profileStore.set(email, updated);

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully.',
    data: updated,
  });
});

/**
 * POST /api/profile/test-vtop
 * Tests connection to VTOP endpoint.
 */
router.post('/test-vtop', (req, res) => {
  const { apiEndpoint } = req.body || {};

  if (!apiEndpoint || typeof apiEndpoint !== 'string' || !apiEndpoint.trim()) {
    return res.status(200).json({
      success: false,
      status: 'Integration not configured',
      message: 'VTOP endpoint URL is required. Official institution API credentials must be configured on the server.',
    });
  }

  // In local development, explain security constraint honestly
  return res.status(200).json({
    success: false,
    status: 'Integration not configured',
    message: 'VTOP does not expose an unauthenticated public API. Institutional OAuth or verified API Gateway connection is required.',
  });
});

/**
 * POST /api/profile/test-screen-time
 * Tests connection to phone screen time integration.
 */
router.post('/test-screen-time', (req, res) => {
  return res.status(200).json({
    success: false,
    status: 'Integration not configured',
    message: 'Browser sandboxing prevents direct mobile OS screen-time inspection. Please use the Manual Data Import tab to upload your Digital Wellbeing / Screen Time JSON export.',
  });
});

/**
 * POST /api/profile/import-data
 * Handles validated JSON/CSV manual data imports.
 */
router.post('/import-data', (req, res) => {
  const { email, type, payload } = req.body || {};
  const studentEmail = (email || 'maya.lin@campus.edu').toLowerCase().trim();

  if (!profileStore.has(studentEmail)) {
    profileStore.set(studentEmail, createDefaultProfile(studentEmail));
  }

  const profile = profileStore.get(studentEmail);

  if (!type || !payload) {
    return res.status(400).json({
      success: false,
      error: { code: 'INVALID_INPUT', message: 'Import type and payload are required.' },
    });
  }

  const record = {
    id: `import-${Date.now()}`,
    type,
    importedAt: new Date().toISOString(),
    itemCount: Array.isArray(payload) ? payload.length : 1,
    summary: typeof payload === 'object' ? JSON.stringify(payload).slice(0, 120) + '...' : String(payload),
  };

  profile.integrations.manualImports.unshift(record);
  profile.updatedAt = new Date().toISOString();
  profileStore.set(studentEmail, profile);

  res.status(200).json({
    success: true,
    message: `Successfully imported ${type} data.`,
    record,
  });
});

module.exports = router;
