/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * API Service Client for Calma Student Burnout Estimation System
 * Connects to the local Express backend on http://localhost:5000.
 * Includes graceful offline and local-storage fallback for standalone browser usage.
 */

export interface ModelBInputFeatures {
  age: number;
  academic_year: number;
  study_hours_per_day: number;
  exam_pressure: number;
  academic_performance: number;
  sleep_hours: number;
  physical_activity: number;
  social_support: number;
  screen_time: number;
  internet_usage: number;
  financial_stress: number;
  family_expectation: number;
  gender: 'Female' | 'Male' | 'Other';
  stress_level: number;
  anxiety_score: number;
  depression_score: number;
}

export interface PredictionResult {
  burnout_score: number;
  risk_level: 'Lower Risk' | 'Moderate Risk' | 'Elevated Risk';
  source: 'backend' | 'local_fallback';
  timestamp: string;
  assessmentId?: string;
  features: ModelBInputFeatures;
}

export interface StoredAssessment {
  id: string;
  timestamp: string;
  dateFormatted: string;
  burnout_score: number;
  risk_level: 'Lower Risk' | 'Moderate Risk' | 'Elevated Risk';
  features: ModelBInputFeatures;
  source: 'backend' | 'local_fallback';
}

const API_BASE_URL = 'http://localhost:5000';
const LOCAL_STORAGE_KEY = 'calma_assessment_records';

/**
 * Categorizes a continuous 0-10 burnout score into responsible risk tiers.
 */
export function getRiskLevel(score: number): 'Lower Risk' | 'Moderate Risk' | 'Elevated Risk' {
  if (score < 4.0) return 'Lower Risk';
  if (score < 7.0) return 'Moderate Risk';
  return 'Elevated Risk';
}

/**
 * Fallback local scoring heuristic based on feature weights when backend is not running.
 * Matches the 0-10 scale and direction of the trained HistGradientBoosting model.
 */
export function computeLocalBurnoutScore(features: ModelBInputFeatures): number {
  let score = 2.0;

  // Strain contributors (positive effect on burnout risk)
  score += (features.exam_pressure / 10) * 1.8;
  score += (features.stress_level / 10) * 2.2;
  score += (features.anxiety_score / 10) * 1.5;
  score += (features.depression_score / 10) * 1.6;
  score += (features.financial_stress / 10) * 1.0;
  score += (features.family_expectation / 10) * 0.7;

  // High study hours beyond 8 adds strain
  if (features.study_hours_per_day > 8) {
    score += (features.study_hours_per_day - 8) * 0.35;
  }

  // High screen time adds fatigue
  if (features.screen_time > 6) {
    score += (features.screen_time - 6) * 0.2;
  }

  // Protective contributors (negative effect on burnout risk)
  // Optimal sleep (7-9 hours) reduces risk
  if (features.sleep_hours >= 7) {
    score -= Math.min(2.0, (features.sleep_hours - 5) * 0.45);
  } else {
    score += (7 - features.sleep_hours) * 0.4;
  }

  // Social support reduces risk
  score -= (features.social_support / 10) * 1.4;

  // Physical activity reduces risk
  score -= (features.physical_activity / 3) * 0.9;

  // Clamp strictly to [0.5, 9.8]
  return Math.round(Math.max(0.5, Math.min(9.8, score)) * 10) / 10;
}

/**
 * Checks if the local Express backend is running and healthy.
 */
export async function checkBackendHealth(): Promise<{ online: boolean; modelsReady?: boolean }> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);

    const res = await fetch(`${API_BASE_URL}/api/health`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      return { online: true, modelsReady: data.modelsReady };
    }
    return { online: false };
  } catch {
    return { online: false };
  }
}

/**
 * Submits an assessment to Model B on the backend.
 * Falls back to local estimation if the backend server is unreachable.
 */
export async function submitBurnoutAssessment(
  features: ModelBInputFeatures
): Promise<PredictionResult> {
  const timestamp = new Date().toISOString();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    const res = await fetch(`${API_BASE_URL}/api/predictions/burnout/model-b`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ features }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      const rawScore = Number(data.prediction);
      const score = Math.round(rawScore * 10) / 10;
      const riskLevel = getRiskLevel(score);

      const result: PredictionResult = {
        burnout_score: score,
        risk_level: riskLevel,
        source: 'backend',
        timestamp,
        assessmentId: data.assessmentId,
        features,
      };

      saveToLocalHistory(result);
      return result;
    }
  } catch {
    // Backend offline or connection failed; smoothly use client fallback
  }

  // Graceful fallback
  const fallbackScore = computeLocalBurnoutScore(features);
  const fallbackResult: PredictionResult = {
    burnout_score: fallbackScore,
    risk_level: getRiskLevel(fallbackScore),
    source: 'local_fallback',
    timestamp,
    assessmentId: `local-${Date.now()}`,
    features,
  };

  saveToLocalHistory(fallbackResult);
  return fallbackResult;
}

/**
 * Saves assessment record to localStorage history.
 */
function saveToLocalHistory(pred: PredictionResult) {
  try {
    const existing = getStoredAssessments();
    const dateFormatted = new Date(pred.timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    const newRecord: StoredAssessment = {
      id: pred.assessmentId || `record-${Date.now()}`,
      timestamp: pred.timestamp,
      dateFormatted,
      burnout_score: pred.burnout_score,
      risk_level: pred.risk_level,
      features: pred.features,
      source: pred.source,
    };

    const updated = [newRecord, ...existing.filter((r) => r.id !== newRecord.id)].slice(0, 25);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // Ignore storage quota or access issues
  }
}

/**
 * Retrieves all stored assessment records (newest first).
 */
export function getStoredAssessments(): StoredAssessment[] {
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // Ignore read errors
  }
  return [];
}

/**
 * Clears stored assessments from localStorage.
 */
export function clearStoredAssessments(): void {
  try {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  } catch {
    // Ignore
  }
}

const PROFILE_STORAGE_KEY = 'calma_student_profile';

/**
 * Fetches the student profile from the backend or local cache.
 */
export async function fetchStudentProfile(email: string): Promise<any> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/profile?email=${encodeURIComponent(email)}`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.data) {
        localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(data.data));
        return data.data;
      }
    }
  } catch {
    // Backend offline; use local storage fallback
  }

  // Local fallback
  try {
    const cached = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (cached) return JSON.parse(cached);
  } catch {}

  return null;
}

/**
 * Updates student profile on the backend and synchronizes with local storage.
 */
export async function updateStudentProfile(profileData: any): Promise<{ success: boolean; data?: any }> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(profileData),
    });
    if (res.ok) {
      const result = await res.json();
      if (result.success) {
        localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(result.data));
        return { success: true, data: result.data };
      }
    }
  } catch {
    // Backend offline; persist locally
  }

  try {
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profileData));
    return { success: true, data: profileData };
  } catch {
    return { success: false };
  }
}

/**
 * Tests connection to VTOP endpoint.
 */
export async function testVtopConnection(apiEndpoint: string): Promise<{ success: boolean; status: string; message: string }> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/profile/test-vtop`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiEndpoint }),
    });
    if (res.ok) return await res.json();
  } catch {}
  return {
    success: false,
    status: 'Integration not configured',
    message: 'VTOP endpoint is not connected. Requires authorized VIT institutional API credentials.',
  };
}

/**
 * Tests connection to mobile screen time integration.
 */
export async function testScreenTimeConnection(): Promise<{ success: boolean; status: string; message: string }> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/profile/test-screen-time`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    if (res.ok) return await res.json();
  } catch {}
  return {
    success: false,
    status: 'Integration not configured',
    message: 'Mobile screen-time integration not configured. Please use manual JSON/CSV export.',
  };
}

/**
 * Sends manual data import to backend.
 */
export async function importManualData(email: string, type: string, payload: any): Promise<{ success: boolean; message: string; record?: any }> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/profile/import-data`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, type, payload }),
    });
    if (res.ok) return await res.json();
  } catch {}

  const localRecord = {
    id: `import-local-${Date.now()}`,
    type,
    importedAt: new Date().toISOString(),
    itemCount: Array.isArray(payload) ? payload.length : 1,
    summary: typeof payload === 'object' ? JSON.stringify(payload).slice(0, 100) + '...' : String(payload),
  };
  return {
    success: true,
    message: `Locally imported ${type} data.`,
    record: localRecord,
  };
}

/**
 * Fetches assessment manifest from backend assessment library.
 */
export async function fetchAssessmentLibraryIndex(): Promise<any> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/assessments-library`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
    if (res.ok) {
      const data = await res.json();
      return data.data;
    }
  } catch {}
  return null;
}

