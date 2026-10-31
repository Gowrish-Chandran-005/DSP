/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ModelBInputFeatures } from './services/api';

export type ViewMode =
  | 'dashboard'
  | 'assessment'
  | 'focus-monitor'
  | 'profile'
  | 'insights'
  | 'trends'
  | 'emotion-lab'
  | 'history'
  | 'settings'
  | 'login';

export interface UserSession {
  name: string;
  email: string;
  studentId?: string;
  term?: string;
  avatarUrl?: string;
}

export interface StudentProfileData {
  basic: {
    fullName: string;
    preferredName: string;
    email: string;
    studentId: string;
    institution: string;
    campus: string;
    degree: string;
    specialization: string;
    academicYear: number;
    semester: number;
    expectedGraduation: number;
  };
  academic: {
    institution: string;
    degree: string;
    specialization: string;
    currentSemester: number;
    academicYear: number;
    cgpa?: number | null;
    recentGpa?: number | null;
    courses: { code: string; name: string; credits: number; faculty?: string }[];
    upcomingExams: { course: string; date: string; format: string }[];
    upcomingDeadlines: { title: string; dueDate: string; course: string; status: string }[];
    weeklyStudyHours: number;
    workloadRating: string;
    academicGoals: string;
  };
  preferences: {
    typicalSleepHours: number;
    preferredStudyDuration: number;
    preferredBreakInterval: number;
    reminderStyle: string;
    notificationPreferences: {
      studyReminders: boolean;
      sleepPrompts: boolean;
      weeklyDigest: boolean;
    };
    accessibilityPreferences: {
      reducedMotion: boolean;
      highContrast: boolean;
      screenReaderOptimized: boolean;
    };
  };
  integrations: {
    vtop: {
      status: string;
      connected: boolean;
      apiEndpoint: string;
      lastSync: string | null;
      supportedData: string[];
      requiresAuth: boolean;
      notes: string;
    };
    screenTime: {
      status: string;
      connected: boolean;
      apiEndpoint: string;
      lastSync: string | null;
      supportedData: string[];
      requiresAuth: boolean;
      notes: string;
    };
    manualImports: { id: string; type: string; importedAt: string; itemCount: number; summary: string }[];
  };
  updatedAt?: string;
}

/**
 * Validated student well-being metrics derived from Model B inference
 * and reported study habits.
 */
export interface BurnoutMetrics {
  burnoutScore: number; // 0-10 continuous scale from Model B
  riskLevel: 'Lower Risk' | 'Moderate Risk' | 'Elevated Risk';
  lastAssessmentDate: string;
  isInitialBaseline: boolean;

  // Conceptual dimension representations (grounded in actual survey answers)
  emotionalExhaustionScore: number; // Estimated exhaustion scale 0-10
  academicDisconnectionScore: number; // Estimated study detachment scale 0-10
  academicConfidenceScore: number; // Confidence and self-efficacy scale 0-10

  // Key reported lifestyle factors
  reportedSleep: number; // Hours per night
  reportedStudyHours: number; // Hours per day
  reportedExamPressure: number; // Scale 1-10
  reportedSocialSupport: number; // Scale 1-10

  // Latest completed study session (if any)
  latestStudySession?: StudySessionRecord | null;
}

export interface StudySessionRecord {
  id: string;
  durationMinutes: number;
  elapsedSeconds: number;
  breaksCount: number;
  cameraUsed: boolean;
  cameraMinutes: number;
  selfCheckIns: { time: string; state: 'Focused' | 'Tired' | 'Stressed' | 'Need a break' }[];
  completedAt: string;
}

export interface LikertOption {
  value: number;
  label: string;
  badge?: string;
  description: string;
}

export interface AssessmentStep {
  id: number;
  title: string;
  subtitle: string;
}

export interface MicroCheckpoint {
  id: string;
  dayTime: string;
  icon: string;
  title: string;
  description: string;
  tags: string[];
}

export interface ShapFactor {
  id: string;
  name: string;
  icon: string;
  deltaPts: number;
  impactLevel: string;
  percentage: number;
  isStrain: boolean;
  explanation: string;
}

export interface SimulationParams {
  sleepHours: number;
  pacingIndex: number;
}
