/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { BurnoutMetrics, ViewMode } from '../types';
import {
  ModelBInputFeatures,
  submitBurnoutAssessment,
  checkBackendHealth,
} from '../services/api';

interface AssessmentViewProps {
  metrics: BurnoutMetrics;
  onUpdateMetrics: (metrics: Partial<BurnoutMetrics>) => void;
  onNavigate: (view: ViewMode) => void;
  onShowToast: (message: string) => void;
}

export const AssessmentView: React.FC<AssessmentViewProps> = ({
  metrics,
  onUpdateMetrics,
  onNavigate,
  onShowToast,
}) => {
  const [activeStep, setActiveStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form input state matching the exact 18 Model B schema
  const [formData, setFormData] = useState<ModelBInputFeatures>({
    age: 21,
    academic_year: 2,
    study_hours_per_day: metrics.reportedStudyHours || 6.0,
    exam_pressure: metrics.reportedExamPressure || 7.0,
    academic_performance: 7.0,
    sleep_hours: metrics.reportedSleep || 6.5,
    physical_activity: 1,
    social_support: metrics.reportedSocialSupport || 7.0,
    screen_time: 5.0,
    internet_usage: 4.0,
    financial_stress: 5.0,
    family_expectation: 6.0,
    gender: 'Female',
    stress_level: 6.5,
    anxiety_score: 5.5,
    depression_score: 4.5,
  });

  const updateField = <K extends keyof ModelBInputFeatures>(
    field: K,
    val: ModelBInputFeatures[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: val }));
  };

  const steps = [
    { id: 1, title: 'Academic Life', desc: 'Studies, workload & expectations' },
    { id: 2, title: 'Daily Habits', desc: 'Sleep, screen time & movement' },
    { id: 3, title: 'Stress & Well-being', desc: 'Stress, mood & social support' },
    { id: 4, title: 'Review & Submit', desc: 'Confirm answers & estimate risk' },
  ];

  const handleNext = () => {
    if (activeStep < 4) {
      setActiveStep((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrev = () => {
    if (activeStep > 1) {
      setActiveStep((prev) => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      onNavigate('dashboard');
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    onShowToast('Evaluating your responses with the trained burnout model...');

    try {
      const result = await submitBurnoutAssessment(formData);

      // Compute conceptual dimension breakdowns based on actual answers
      const exhaustion = Math.round(
        Math.min(10, Math.max(1, (formData.stress_level * 0.4 + formData.exam_pressure * 0.3 + (10 - formData.sleep_hours) * 0.3))) * 10
      ) / 10;

      const detachment = Math.round(
        Math.min(10, Math.max(1, (formData.depression_score * 0.5 + (10 - formData.academic_performance) * 0.3 + (10 - formData.social_support) * 0.2))) * 10
      ) / 10;

      const confidence = Math.round(
        Math.min(10, Math.max(1, (formData.academic_performance * 0.6 + formData.social_support * 0.4 - formData.anxiety_score * 0.2))) * 10
      ) / 10;

      onUpdateMetrics({
        burnoutScore: result.burnout_score,
        riskLevel: result.risk_level,
        lastAssessmentDate: 'Today',
        isInitialBaseline: false,
        emotionalExhaustionScore: exhaustion,
        academicDisconnectionScore: detachment,
        academicConfidenceScore: confidence,
        reportedSleep: formData.sleep_hours,
        reportedStudyHours: formData.study_hours_per_day,
        reportedExamPressure: formData.exam_pressure,
        reportedSocialSupport: formData.social_support,
      });

      onShowToast(
        result.source === 'backend'
          ? `Assessment processed by local Model B! Score: ${result.burnout_score} / 10 (${result.risk_level})`
          : `Assessment saved in offline mode! Estimated Score: ${result.burnout_score} / 10 (${result.risk_level})`
      );

      setIsSubmitting(false);
      onNavigate('dashboard');
    } catch {
      setIsSubmitting(false);
      onShowToast('Could not complete submission. Please verify inputs.');
    }
  };

  return (
    <div className="flex flex-col w-full space-y-8">
      {/* Top Banner */}
      <section className="relative rounded-3xl p-5 bg-white/70 backdrop-blur-[24px] border border-white/80 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#ddf3e6] flex items-center justify-center text-[#14532d]">
            <span className="material-symbols-outlined text-[20px]">assignment</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#4b6459]">
                Student Well-Being Check-In
              </span>
              <span className="text-[11px] text-[#404941]/60">• 18 Measured Factors</span>
            </div>
            <h1 className="font-title-md text-title-md text-[#0c1f18]">
              {steps[activeStep - 1].title}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#e3f9ec]/80 text-[#14532d] text-xs font-medium self-stretch sm:self-auto justify-center">
          <span className="material-symbols-outlined text-[16px]">lock</span>
          <span>Confidential • Never shared with faculty</span>
        </div>
      </section>

      {/* Step Indicators */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {steps.map((s) => {
          const isDone = s.id < activeStep;
          const isCurrent = s.id === activeStep;
          return (
            <button
              key={s.id}
              onClick={() => setActiveStep(s.id)}
              className={`p-3.5 rounded-2xl flex items-center gap-3 text-left transition-all cursor-pointer border ${
                isCurrent
                  ? 'bg-white shadow-sm border-[#14532d]'
                  : isDone
                  ? 'bg-[#d7ede1]/70 border-white'
                  : 'bg-white/50 border-white/60 opacity-70 hover:opacity-100'
              }`}
            >
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                  isCurrent || isDone ? 'bg-[#14532d] text-white' : 'bg-[#cde9db] text-[#14532d]'
                }`}
              >
                {isDone ? (
                  <span className="material-symbols-outlined text-[16px]">check</span>
                ) : (
                  s.id
                )}
              </div>
              <div className="min-w-0">
                <span className="text-[11px] font-bold text-[#0c1f18] block truncate">
                  {s.title}
                </span>
                <span className="text-[10px] text-[#404941] block truncate">{s.desc}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Main Questionnaire Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white/75 backdrop-blur-xl border border-white/90 shadow-sm space-y-8">
        {/* STEP 1: Academic Life */}
        {activeStep === 1 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div>
              <h2 className="font-title-lg text-title-lg text-[#0c1f18]">Academic Life &amp; Workload</h2>
              <p className="text-xs text-[#404941] mt-1">
                Tell us about your studies, daily time investment, and upcoming coursework expectations.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Age */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#0c1f18] block">
                  Your Age (Years)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={17}
                    max={40}
                    value={formData.age}
                    onChange={(e) => updateField('age', Number(e.target.value))}
                    className="flex-1 accent-[#14532d] cursor-pointer"
                  />
                  <span className="w-12 text-center px-2 py-1 bg-[#ddf3e6] rounded-xl text-xs font-bold text-[#14532d]">
                    {formData.age}
                  </span>
                </div>
                <span className="text-[11px] text-[#404941]">Range: 17 to 40 years old</span>
              </div>

              {/* Academic Year */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#0c1f18] block">
                  Year of Study
                </label>
                <select
                  value={formData.academic_year}
                  onChange={(e) => updateField('academic_year', Number(e.target.value))}
                  className="w-full h-10 px-3 rounded-xl bg-[#e3f9ec]/60 border border-[#cde9db] text-xs text-[#0c1f18] focus:outline-none focus:border-[#14532d] cursor-pointer font-medium"
                >
                  <option value={1}>1st Year (Freshman)</option>
                  <option value={2}>2nd Year (Sophomore)</option>
                  <option value={3}>3rd Year (Junior)</option>
                  <option value={4}>4th Year (Senior)</option>
                  <option value={5}>Graduate / Postgraduate</option>
                </select>
                <span className="text-[11px] text-[#404941]">Current program standing</span>
              </div>

              {/* Study Hours Per Day */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#0c1f18] block">
                  Daily Study Hours (Excluding class lectures)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={0.5}
                    max={14}
                    step={0.5}
                    value={formData.study_hours_per_day}
                    onChange={(e) => updateField('study_hours_per_day', Number(e.target.value))}
                    className="flex-1 accent-[#14532d] cursor-pointer"
                  />
                  <span className="w-16 text-center px-2 py-1 bg-[#ddf3e6] rounded-xl text-xs font-bold text-[#14532d]">
                    {formData.study_hours_per_day} hrs
                  </span>
                </div>
                <span className="text-[11px] text-[#404941]">Average hours per day spent on assignments &amp; study</span>
              </div>

              {/* Exam Pressure */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#0c1f18] block">
                  Exam &amp; Deadline Pressure (1–10)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={1}
                    max={10}
                    value={formData.exam_pressure}
                    onChange={(e) => updateField('exam_pressure', Number(e.target.value))}
                    className="flex-1 accent-[#14532d] cursor-pointer"
                  />
                  <span className="w-14 text-center px-2 py-1 bg-[#ddf3e6] rounded-xl text-xs font-bold text-[#14532d]">
                    {formData.exam_pressure}/10
                  </span>
                </div>
                <span className="text-[11px] text-[#404941]">
                  1 = Very light pressure, 10 = Approaching major stressful exams
                </span>
              </div>

              {/* Academic Performance Satisfaction */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#0c1f18] block">
                  Satisfaction with Academic Performance (1–10)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={1}
                    max={10}
                    value={formData.academic_performance}
                    onChange={(e) => updateField('academic_performance', Number(e.target.value))}
                    className="flex-1 accent-[#14532d] cursor-pointer"
                  />
                  <span className="w-14 text-center px-2 py-1 bg-[#ddf3e6] rounded-xl text-xs font-bold text-[#14532d]">
                    {formData.academic_performance}/10
                  </span>
                </div>
                <span className="text-[11px] text-[#404941]">
                  1 = Dissatisfied with grades, 10 = Fully satisfied
                </span>
              </div>

              {/* Family Expectation */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#0c1f18] block">
                  Family Academic Expectations (1–10)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={1}
                    max={10}
                    value={formData.family_expectation}
                    onChange={(e) => updateField('family_expectation', Number(e.target.value))}
                    className="flex-1 accent-[#14532d] cursor-pointer"
                  />
                  <span className="w-14 text-center px-2 py-1 bg-[#ddf3e6] rounded-xl text-xs font-bold text-[#14532d]">
                    {formData.family_expectation}/10
                  </span>
                </div>
                <span className="text-[11px] text-[#404941]">
                  1 = Minimal external pressure, 10 = Intense parental expectations
                </span>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Daily Habits */}
        {activeStep === 2 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div>
              <h2 className="font-title-lg text-title-lg text-[#0c1f18]">Daily Habits &amp; Recovery</h2>
              <p className="text-xs text-[#404941] mt-1">
                Your sleep, physical movement, and digital screen habits play a vital role in nervous system recovery.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Sleep Hours */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#0c1f18] block">
                  Average Sleep per Night (Hours)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={3}
                    max={12}
                    step={0.5}
                    value={formData.sleep_hours}
                    onChange={(e) => updateField('sleep_hours', Number(e.target.value))}
                    className="flex-1 accent-[#14532d] cursor-pointer"
                  />
                  <span className="w-16 text-center px-2 py-1 bg-[#ddf3e6] rounded-xl text-xs font-bold text-[#14532d]">
                    {formData.sleep_hours} hrs
                  </span>
                </div>
                <span className="text-[11px] text-[#404941]">
                  Health experts recommend 7–9 hours for young adults &amp; students.
                </span>
              </div>

              {/* Physical Activity */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#0c1f18] block">
                  Physical Activity / Exercise Frequency
                </label>
                <select
                  value={formData.physical_activity}
                  onChange={(e) => updateField('physical_activity', Number(e.target.value))}
                  className="w-full h-10 px-3 rounded-xl bg-[#e3f9ec]/60 border border-[#cde9db] text-xs text-[#0c1f18] focus:outline-none focus:border-[#14532d] cursor-pointer font-medium"
                >
                  <option value={0}>Rare / None (Sedentary)</option>
                  <option value={1}>1 to 2 days per week (Light walks or gym)</option>
                  <option value={2}>3 to 4 days per week (Moderate active exercise)</option>
                  <option value={3}>5+ days per week (High athletic activity)</option>
                </select>
                <span className="text-[11px] text-[#404941]">
                  Movement helps relieve cortisol and physical tension.
                </span>
              </div>

              {/* Screen Time */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#0c1f18] block">
                  Recreational Screen Time (Hours/day)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={1}
                    max={12}
                    step={0.5}
                    value={formData.screen_time}
                    onChange={(e) => updateField('screen_time', Number(e.target.value))}
                    className="flex-1 accent-[#14532d] cursor-pointer"
                  />
                  <span className="w-16 text-center px-2 py-1 bg-[#ddf3e6] rounded-xl text-xs font-bold text-[#14532d]">
                    {formData.screen_time} hrs
                  </span>
                </div>
                <span className="text-[11px] text-[#404941]">
                  Phone, streaming, or gaming outside academic study hours.
                </span>
              </div>

              {/* Internet Usage */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#0c1f18] block">
                  General Internet Usage (Hours/day)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={1}
                    max={14}
                    step={0.5}
                    value={formData.internet_usage}
                    onChange={(e) => updateField('internet_usage', Number(e.target.value))}
                    className="flex-1 accent-[#14532d] cursor-pointer"
                  />
                  <span className="w-16 text-center px-2 py-1 bg-[#ddf3e6] rounded-xl text-xs font-bold text-[#14532d]">
                    {formData.internet_usage} hrs
                  </span>
                </div>
                <span className="text-[11px] text-[#404941]">
                  Social media browsing, messaging, and web browsing.
                </span>
              </div>

              {/* Financial Stress */}
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-bold text-[#0c1f18] block">
                  Financial Pressure &amp; Living Expense Stress (1–10)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={1}
                    max={10}
                    value={formData.financial_stress}
                    onChange={(e) => updateField('financial_stress', Number(e.target.value))}
                    className="flex-1 accent-[#14532d] cursor-pointer"
                  />
                  <span className="w-14 text-center px-2 py-1 bg-[#ddf3e6] rounded-xl text-xs font-bold text-[#14532d]">
                    {formData.financial_stress}/10
                  </span>
                </div>
                <span className="text-[11px] text-[#404941]">
                  1 = Living expenses comfortably supported, 10 = High financial strain or job pressure
                </span>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Stress & Well-being */}
        {activeStep === 3 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div>
              <h2 className="font-title-lg text-title-lg text-[#0c1f18]">Stress &amp; Well-Being Profile</h2>
              <p className="text-xs text-[#404941] mt-1">
                Reflect on your emotional experience over the past two weeks. Remember: this is for self-reflection and is non-diagnostic.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Overall Stress Level */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#0c1f18] block">
                  Overall Academic Stress Level (1–10)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={1}
                    max={10}
                    value={formData.stress_level}
                    onChange={(e) => updateField('stress_level', Number(e.target.value))}
                    className="flex-1 accent-[#14532d] cursor-pointer"
                  />
                  <span className="w-14 text-center px-2 py-1 bg-[#ddf3e6] rounded-xl text-xs font-bold text-[#14532d]">
                    {formData.stress_level}/10
                  </span>
                </div>
                <span className="text-[11px] text-[#404941]">
                  1 = Completely relaxed, 10 = Constant overwhelming pressure
                </span>
              </div>

              {/* Anxiety Level */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#0c1f18] block">
                  Perceived Anxiety / Worry Level (1–10)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={1}
                    max={10}
                    value={formData.anxiety_score}
                    onChange={(e) => updateField('anxiety_score', Number(e.target.value))}
                    className="flex-1 accent-[#14532d] cursor-pointer"
                  />
                  <span className="w-14 text-center px-2 py-1 bg-[#ddf3e6] rounded-xl text-xs font-bold text-[#14532d]">
                    {formData.anxiety_score}/10
                  </span>
                </div>
                <span className="text-[11px] text-[#404941]">
                  1 = Minimal worry, 10 = Restless thoughts about deadlines or tests
                </span>
              </div>

              {/* Low Mood / Depressive Symptoms */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#0c1f18] block">
                  Low Mood or Feeling Down (1–10)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={1}
                    max={10}
                    value={formData.depression_score}
                    onChange={(e) => updateField('depression_score', Number(e.target.value))}
                    className="flex-1 accent-[#14532d] cursor-pointer"
                  />
                  <span className="w-14 text-center px-2 py-1 bg-[#ddf3e6] rounded-xl text-xs font-bold text-[#14532d]">
                    {formData.depression_score}/10
                  </span>
                </div>
                <span className="text-[11px] text-[#404941]">
                  1 = Upbeat and energized, 10 = Frequent low motivation or sadness
                </span>
              </div>

              {/* Social Support */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#0c1f18] block">
                  Social Support from Friends &amp; Family (1–10)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={1}
                    max={10}
                    value={formData.social_support}
                    onChange={(e) => updateField('social_support', Number(e.target.value))}
                    className="flex-1 accent-[#14532d] cursor-pointer"
                  />
                  <span className="w-14 text-center px-2 py-1 bg-[#ddf3e6] rounded-xl text-xs font-bold text-[#14532d]">
                    {formData.social_support}/10
                  </span>
                </div>
                <span className="text-[11px] text-[#404941]">
                  1 = Feeling isolated, 10 = Strong, caring network to confide in
                </span>
              </div>

              {/* Gender */}
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-bold text-[#0c1f18] block">Gender</label>
                <div className="flex items-center gap-4">
                  {(['Female', 'Male', 'Other'] as const).map((g) => (
                    <label
                      key={g}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-xs font-medium cursor-pointer transition-colors ${
                        formData.gender === g
                          ? 'bg-[#14532d] text-white border-[#14532d]'
                          : 'bg-[#e3f9ec]/60 border-[#cde9db] text-[#0c1f18] hover:bg-[#ddf3e6]'
                      }`}
                    >
                      <input
                        type="radio"
                        name="gender"
                        value={g}
                        checked={formData.gender === g}
                        onChange={() => updateField('gender', g)}
                        className="hidden"
                      />
                      <span>{g}</span>
                    </label>
                  ))}
                </div>
                <span className="text-[11px] text-[#404941]">
                  Required by the multi-variable model encoding.
                </span>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: Review & Submit */}
        {activeStep === 4 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div>
              <h2 className="font-title-lg text-title-lg text-[#0c1f18]">Review Your Answers</h2>
              <p className="text-xs text-[#404941] mt-1">
                Please verify that the information below reflects your typical habits before submitting.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Summary Block 1 */}
              <div className="p-4 rounded-2xl bg-[#e3f9ec]/60 border border-white space-y-2">
                <div className="flex items-center justify-between pb-1 border-b border-[#cde9db]">
                  <span className="text-xs font-bold text-[#0c1f18]">Academic Life</span>
                  <button
                    onClick={() => setActiveStep(1)}
                    className="text-[11px] font-semibold text-[#14532d] hover:underline cursor-pointer"
                  >
                    Edit
                  </button>
                </div>
                <div className="text-xs space-y-1 text-[#404941]">
                  <div>Age: <strong className="text-[#0c1f18]">{formData.age} yrs</strong></div>
                  <div>Study Year: <strong className="text-[#0c1f18]">Year {formData.academic_year}</strong></div>
                  <div>Study Time: <strong className="text-[#0c1f18]">{formData.study_hours_per_day} hrs/day</strong></div>
                  <div>Exam Pressure: <strong className="text-[#0c1f18]">{formData.exam_pressure}/10</strong></div>
                  <div>Performance: <strong className="text-[#0c1f18]">{formData.academic_performance}/10</strong></div>
                </div>
              </div>

              {/* Summary Block 2 */}
              <div className="p-4 rounded-2xl bg-[#e3f9ec]/60 border border-white space-y-2">
                <div className="flex items-center justify-between pb-1 border-b border-[#cde9db]">
                  <span className="text-xs font-bold text-[#0c1f18]">Daily Habits</span>
                  <button
                    onClick={() => setActiveStep(2)}
                    className="text-[11px] font-semibold text-[#14532d] hover:underline cursor-pointer"
                  >
                    Edit
                  </button>
                </div>
                <div className="text-xs space-y-1 text-[#404941]">
                  <div>Sleep: <strong className="text-[#0c1f18]">{formData.sleep_hours} hrs/night</strong></div>
                  <div>Activity Level: <strong className="text-[#0c1f18]">{formData.physical_activity}/3</strong></div>
                  <div>Screen Time: <strong className="text-[#0c1f18]">{formData.screen_time} hrs/day</strong></div>
                  <div>Internet Usage: <strong className="text-[#0c1f18]">{formData.internet_usage} hrs/day</strong></div>
                  <div>Financial Stress: <strong className="text-[#0c1f18]">{formData.financial_stress}/10</strong></div>
                </div>
              </div>

              {/* Summary Block 3 */}
              <div className="p-4 rounded-2xl bg-[#e3f9ec]/60 border border-white space-y-2">
                <div className="flex items-center justify-between pb-1 border-b border-[#cde9db]">
                  <span className="text-xs font-bold text-[#0c1f18]">Stress &amp; Support</span>
                  <button
                    onClick={() => setActiveStep(3)}
                    className="text-[11px] font-semibold text-[#14532d] hover:underline cursor-pointer"
                  >
                    Edit
                  </button>
                </div>
                <div className="text-xs space-y-1 text-[#404941]">
                  <div>Stress Level: <strong className="text-[#0c1f18]">{formData.stress_level}/10</strong></div>
                  <div>Anxiety Score: <strong className="text-[#0c1f18]">{formData.anxiety_score}/10</strong></div>
                  <div>Low Mood Score: <strong className="text-[#0c1f18]">{formData.depression_score}/10</strong></div>
                  <div>Social Support: <strong className="text-[#0c1f18]">{formData.social_support}/10</strong></div>
                  <div>Gender: <strong className="text-[#0c1f18]">{formData.gender}</strong></div>
                </div>
              </div>
            </div>

            {/* Ethical note */}
            <div className="p-4 rounded-2xl bg-[#fef3c7]/60 border border-[#fde68a] text-xs text-[#92400e] flex items-start gap-2.5">
              <span className="material-symbols-outlined text-[18px] shrink-0 text-[#d97706]">
                info
              </span>
              <span>
                When you click <strong>Estimate Burnout Risk</strong>, your 18 answers will be fed to our trained HistGradientBoosting regression model (Model B). The result provides self-awareness and practical next steps, not medical diagnosis.
              </span>
            </div>
          </div>
        )}

        {/* Form Navigation Action Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-[#ddf3e6]">
          <button
            onClick={handlePrev}
            className="px-5 py-2.5 rounded-full border border-[#cde9db] bg-white hover:bg-[#e3f9ec] text-[#404941] text-xs font-semibold transition-colors cursor-pointer flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            <span>{activeStep === 1 ? 'Cancel to Dashboard' : 'Previous Step'}</span>
          </button>

          {activeStep < 4 ? (
            <button
              onClick={handleNext}
              className="px-6 py-2.5 rounded-full bg-[#14532d] hover:bg-[#003b1b] text-white text-xs font-semibold shadow-sm transition-all flex items-center gap-2 cursor-pointer"
            >
              <span>Continue to Step {activeStep + 1}</span>
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className={`px-7 py-3 rounded-full text-xs font-semibold shadow-md transition-all flex items-center gap-2 cursor-pointer ${
                isSubmitting
                  ? 'bg-[#d2e8db] text-[#717970] cursor-not-allowed'
                  : 'bg-[#14532d] hover:bg-[#003b1b] text-white'
              }`}
            >
              {isSubmitting ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/60 border-t-white rounded-full animate-spin"></span>
                  <span>Running Model Inference...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">psychology</span>
                  <span>Estimate Burnout Risk</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
