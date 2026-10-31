/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BurnoutMetrics, AssessmentStep, LikertOption, MicroCheckpoint, ShapFactor } from '../types';

export const ASSETS = {
  logo: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAlnlyZ1aiMEmo7OqzIRMy0bBuYE4TY8_ESn-dX7dLDLmIsGNQtlUHXuzrRKT2KTT2T4nlvCr83dZX6PIQnAmqhV8I8mSWvEiCZ9ecZ0bic6HBMnUFscDVVe3TUI3hm9SxGXIBTHCINNJr58Q3aMmE4eDPpUKn9U8Z2J88bsDwEkvnBtgDmDfVfhwGUTuKrfHHy1g8Ez2Li5H_93PjyYNUwIZ_Tz_YWMSItjnxLG-0',
  profile: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDLO3jocApMrJBoGmUuNi1EN4TQTOhF56V_R_YEUQCtPjp7EDV7dCrSOwqKTeAETPQqNEBWkm4lKe9TUAAOTobkzcoBWZrWJsnA-7t8D5KvSrEV6bPZOlJTWSXFpJrhUvZMioRmDUxYmvztNlFq_oPqkWVrkwyiFIB3O7_gQzAu1H6M6b2Yf8IthGtzFdiWpm5g3kqFHyclDgJnyle5vrtOVL-gNVJomQ13M2prEYg',
  greenhouse: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAMI48LUCJu_rNaDCfd_PxcmccQZeWWib9KXtQS7v-GYHDM1AL5jh7dnsxv1MOuLRlByhg1MeubxH0SFxA1kotoSlpGBF7qr-PQlBRMvl_2AYgiJYSNwdNYjANDfUjHUDrHcTk91220-durO0vl9UeRHpx237twg4qetwGc_R7jHgunUIWF5B_vBAjUb8WWkeU5bRG1OavfVjNvzQ8FF74lGmzQe97oTvLocSnO-k6EGnuK0xwgF4pK',
  archetypeStudyDesk: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCjClWvL5aPNVF5y_n_vBj3ssX0Dx5OirxLsoJ3cjvWX7n0JT8w31Xl9Nlpx_DUPFWEoDqRZOB023b4jKpWP6_r1fLZPbnFYkEYZYa6d_x1z0ucYLx-GjbCkFilX1ULQDdzwpkvVO8sksa_-3ZTKjzHRlhTtjvzrXSg9-xoGKY9GVgbvY_RERNrtP2juJ2YlLNy8jD6K1XKhUamtrGIhjV_pHDgIwMGjA-AU4OBHq2ZBskVrkIH0q2g',
};

export const INITIAL_METRICS: BurnoutMetrics = {
  burnoutScore: 4.8,
  riskLevel: 'Moderate Risk',
  lastAssessmentDate: 'Today',
  isInitialBaseline: true,
  emotionalExhaustionScore: 5.2,
  academicDisconnectionScore: 3.4,
  academicConfidenceScore: 6.8,
  reportedSleep: 6.5,
  reportedStudyHours: 6.0,
  reportedExamPressure: 7.0,
  reportedSocialSupport: 6.5,
};

export const ASSESSMENT_STEPS: AssessmentStep[] = [
  { id: 1, title: 'Academic Life', subtitle: 'Step 1: Studies & Workload' },
  { id: 2, title: 'Daily Habits', subtitle: 'Step 2: Sleep & Activity' },
  { id: 3, title: 'Stress & Well-being', subtitle: 'Step 3: Stress & Support' },
  { id: 4, title: 'Review & Estimate', subtitle: 'Step 4: Check Answers' },
];

export const SHAP_FACTORS: ShapFactor[] = [
  {
    id: 'factor-1',
    name: 'Adequate Sleep (7+ hours)',
    icon: 'bedtime',
    deltaPts: -1.4,
    impactLevel: 'Protective Factor',
    percentage: 75,
    isStrain: false,
    explanation: 'Consistent sleep of 7+ hours is strongly associated with lower exhaustion levels.',
  },
  {
    id: 'factor-2',
    name: 'High Exam Pressure',
    icon: 'assignment_late',
    deltaPts: 1.8,
    impactLevel: 'Strain Factor',
    percentage: 82,
    isStrain: true,
    explanation: 'Approaching exam deadlines and perceived workload are key contributors to elevated risk.',
  },
  {
    id: 'factor-3',
    name: 'Social Support from Friends & Family',
    icon: 'groups',
    deltaPts: -1.1,
    impactLevel: 'Protective Factor',
    percentage: 68,
    isStrain: false,
    explanation: 'Having trusted peers or family to talk to helps buffer against feelings of academic isolation.',
  },
  {
    id: 'factor-4',
    name: 'High Daily Screen Time (7+ hours)',
    icon: 'devices',
    deltaPts: 0.9,
    impactLevel: 'Strain Factor',
    percentage: 60,
    isStrain: true,
    explanation: 'Extended recreational screen time can interfere with restorative wind-down before sleep.',
  },
];

export const MICRO_CHECKPOINTS: MicroCheckpoint[] = [
  {
    id: 'check-1',
    dayTime: 'Tuesday • 9:45 PM',
    icon: 'bedtime',
    title: 'Evening Study Wind-Down',
    description: 'Closed laptop at 9:30 PM after finishing chemistry notes. Read for 20 minutes before sleep.',
    tags: ['Sleep Boundary', 'Wind Down'],
  },
  {
    id: 'check-2',
    dayTime: 'Thursday • 2:15 PM',
    icon: 'wb_sunny',
    title: 'Campus Walk & Fresh Air',
    description: '15-minute walk across campus lawn between lecture blocks. Stepped away from screens.',
    tags: ['Physical Break', 'Fresh Air'],
  },
  {
    id: 'check-3',
    dayTime: 'Sunday • 10:00 AM',
    icon: 'checklist',
    title: 'Weekly Task Organization',
    description: 'Broke week 7 assignment into 3 smaller study sessions instead of a single weekend cram.',
    tags: ['Pacing', 'Task Management'],
  },
];
