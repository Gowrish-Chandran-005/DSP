/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { BurnoutMetrics, ViewMode } from '../types';
import { ASSETS } from '../data/mockData';

interface DashboardViewProps {
  metrics: BurnoutMetrics;
  onNavigate: (view: ViewMode) => void;
  onOpenSanctuary: () => void;
  onOpenPrivacy: () => void;
  onSyncCalendar?: () => void;
  onOpenHelp?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  metrics,
  onNavigate,
  onOpenSanctuary,
  onOpenPrivacy,
  onOpenHelp,
}) => {
  // Breathing reset tool state
  const [isBreathing, setIsBreathing] = useState(false);
  const [breathPhase, setBreathPhase] = useState<'INHALE' | 'HOLD' | 'EXHALE' | 'REST'>('INHALE');
  const [breathCountdown, setBreathCountdown] = useState(4);

  // Small steps completion state
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);

  const toggleStep = (id: string) => {
    setCompletedSteps((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  useEffect(() => {
    if (!isBreathing) return;

    const interval = setInterval(() => {
      setBreathCountdown((prev) => {
        if (prev > 1) return prev - 1;

        setBreathPhase((current) => {
          if (current === 'INHALE') return 'HOLD';
          if (current === 'HOLD') return 'EXHALE';
          if (current === 'EXHALE') return 'REST';
          return 'INHALE';
        });
        return 4;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isBreathing]);

  const getOrbScales = () => {
    if (!isBreathing) return { outer: 'scale-100', mid: 'scale-100' };
    if (breathPhase === 'INHALE' || breathPhase === 'HOLD') return { outer: 'scale-125', mid: 'scale-115' };
    if (breathPhase === 'EXHALE') return { outer: 'scale-90', mid: 'scale-90' };
    return { outer: 'scale-100', mid: 'scale-100' };
  };

  const orbScale = getOrbScales();

  // Score interpretation
  const score = metrics.burnoutScore;
  const isLowerRisk = score < 4.0;
  const isModerateRisk = score >= 4.0 && score < 7.0;
  const isElevatedRisk = score >= 7.0;

  const riskBadgeColor = isLowerRisk
    ? 'bg-[#ddf3e6] text-[#003b1b] border-[#b1f2be]'
    : isModerateRisk
    ? 'bg-[#fef3c7] text-[#92400e] border-[#fde68a]'
    : 'bg-[#fee2e2] text-[#991b1b] border-[#fca5a5]';

  return (
    <div className="flex flex-col w-full space-y-8">
      {/* 1. WELCOME & LATEST ASSESSMENT OVERVIEW */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#ddf3e6] text-[#14532d] text-xs font-semibold shadow-sm border border-[#cde9db]">
            <span className="w-2 h-2 rounded-full bg-[#14532d]"></span>
            <span>Your Well-Being Overview • Last updated {metrics.lastAssessmentDate}</span>
          </div>
          <h1 className="font-headline-lg text-headline-lg text-[#003b1b] tracking-tight">
            How are you doing right now?
          </h1>
          <p className="text-xs sm:text-sm text-[#404941] max-w-xl leading-relaxed">
            Here is a clear summary of your latest assessment, the study habits you reported, and practical steps you can take today.
          </p>
        </div>
        <div className="flex items-center gap-3 self-start md:self-auto shrink-0">
          <button
            onClick={() => onNavigate('history')}
            className="px-4 py-2 rounded-full bg-white/80 hover:bg-white text-[#14532d] text-xs font-semibold shadow-sm transition-all flex items-center gap-2 cursor-pointer border border-white"
          >
            <span className="material-symbols-outlined text-[17px]">history</span>
            View Previous Results
          </button>
          <button
            onClick={() => onNavigate('assessment')}
            className="px-5 py-2.5 rounded-full bg-[#14532d] hover:bg-[#003b1b] text-white text-xs font-semibold shadow-sm hover:shadow-md transition-all flex items-center gap-2 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[17px]">add_circle</span>
            Start New Assessment
          </button>
        </div>
      </section>

      {/* Optional Study Session Completed Summary Card */}
      {metrics.latestStudySession && (
        <div className="p-5 rounded-3xl bg-white/80 backdrop-blur-[24px] border border-white/90 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in duration-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#ddf3e6] text-[#14532d] flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[20px]">timer</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#0c1f18]">Study Session Completed</span>
                <span className="text-[10px] text-[#404941]/60">• Logged at {metrics.latestStudySession.completedAt}</span>
              </div>
              <p className="text-xs text-[#404941] mt-0.5">
                Your session lasted {Math.floor(metrics.latestStudySession.elapsedSeconds / 60)} minutes. You recorded {metrics.latestStudySession.breaksCount} {metrics.latestStudySession.breaksCount === 1 ? 'break' : 'breaks'}
                {metrics.latestStudySession.selfCheckIns.length > 0 &&
                  ` and completed ${metrics.latestStudySession.selfCheckIns.length} self-check-in${metrics.latestStudySession.selfCheckIns.length > 1 ? 's' : ''}`}.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('focus-monitor')}
            className="px-4 py-2 rounded-full bg-[#e3f9ec] hover:bg-[#ddf3e6] text-[#14532d] text-xs font-semibold transition-colors cursor-pointer shrink-0"
          >
            Start Another Session →
          </button>
        </div>
      )}

      {/* 2. HOW AM I DOING? (SCORE CARD + 3 MBI-SS CONCEPTUAL DIMENSIONS) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Burnout Score Hero Card */}
        <div className="lg:col-span-5 p-7 rounded-3xl bg-white/75 backdrop-blur-[24px] border border-white/90 shadow-sm flex flex-col justify-between space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#4b6459]">
                Estimated Burnout Risk Score
              </span>
              <span className={`px-3 py-1 rounded-full text-xs font-bold border ${riskBadgeColor}`}>
                {metrics.riskLevel}
              </span>
            </div>

            <div className="flex items-baseline gap-2 pt-1">
              <span className="text-5xl font-extrabold text-[#0c1f18] tracking-tight">
                {score.toFixed(1)}
              </span>
              <span className="text-sm font-semibold text-[#404941]">/ 10 scale</span>
            </div>

            {/* Simple Progress Bar */}
            <div className="w-full h-3 bg-[#e3f9ec] rounded-full overflow-hidden p-0.5">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  isLowerRisk
                    ? 'bg-[#14532d]'
                    : isModerateRisk
                    ? 'bg-[#d97706]'
                    : 'bg-[#dc2626]'
                }`}
                style={{ width: `${Math.min(100, Math.max(5, (score / 10) * 100))}%` }}
              ></div>
            </div>

            <div className="flex justify-between text-[10px] text-[#404941] font-semibold pt-0.5">
              <span>0 (Lower Risk)</span>
              <span>4.0 (Moderate)</span>
              <span>7.0 (Elevated)</span>
              <span>10</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#e3f9ec]/60 border border-white text-xs text-[#404941] space-y-1.5 leading-relaxed">
            <p className="font-semibold text-[#0c1f18]">What this score means:</p>
            <p>
              {isLowerRisk &&
                'Your reported study habits, rest, and support indicate manageable stress levels. Continuing your current pacing will help sustain your energy.'}
              {isModerateRisk &&
                'Some aspects of your study schedule or sleep are creating noticeable fatigue. Taking regular study pauses and guarding sleep can help prevent further strain.'}
              {isElevatedRisk &&
                'You reported elevated stress, heavy exam pressure, or limited rest. Consider lightening your daily study load, speaking with a friend or advisor, and prioritizing sleep.'}
            </p>
          </div>

          <div className="flex items-center justify-between pt-1 text-[11px] text-[#404941]">
            <span className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[15px] text-[#14532d]">memory</span>
              Estimated via HistGradientBoosting (Model B)
            </span>
            <button
              onClick={onOpenPrivacy}
              className="text-[#14532d] font-semibold hover:underline cursor-pointer"
            >
              Non-clinical disclaimer
            </button>
          </div>
        </div>

        {/* 3 Conceptual Dimensions Explained */}
        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Dimension 1: Emotional Exhaustion */}
          <div className="p-5 rounded-3xl bg-white/70 backdrop-blur-xl border border-white/80 shadow-sm flex flex-col justify-between space-y-3">
            <div className="space-y-2">
              <div className="w-8 h-8 rounded-full bg-[#ddf3e6] flex items-center justify-center text-[#14532d]">
                <span className="material-symbols-outlined text-[18px]">battery_alert</span>
              </div>
              <div>
                <h3 className="font-bold text-xs sm:text-sm text-[#0c1f18]">Emotional Exhaustion</h3>
                <span className="text-[10px] text-[#4b6459] font-medium block">
                  How drained you feel by studies
                </span>
              </div>
              <div className="flex items-baseline gap-1.5 pt-1">
                <span className="text-2xl font-bold text-[#0c1f18]">
                  {metrics.emotionalExhaustionScore.toFixed(1)}
                </span>
                <span className="text-xs text-[#404941]">/ 10</span>
              </div>
            </div>
            <p className="text-[11px] text-[#404941] leading-relaxed pt-2 border-t border-[#ddf3e6]">
              Reflects physical and mental tiredness from sustained coursework and exams.
            </p>
          </div>

          {/* Dimension 2: Cynicism / Disconnection */}
          <div className="p-5 rounded-3xl bg-white/70 backdrop-blur-xl border border-white/80 shadow-sm flex flex-col justify-between space-y-3">
            <div className="space-y-2">
              <div className="w-8 h-8 rounded-full bg-[#ddf3e6] flex items-center justify-center text-[#14532d]">
                <span className="material-symbols-outlined text-[18px]">link_off</span>
              </div>
              <div>
                <h3 className="font-bold text-xs sm:text-sm text-[#0c1f18]">Study Disconnection</h3>
                <span className="text-[10px] text-[#4b6459] font-medium block">
                  Feeling detached from courses
                </span>
              </div>
              <div className="flex items-baseline gap-1.5 pt-1">
                <span className="text-2xl font-bold text-[#0c1f18]">
                  {metrics.academicDisconnectionScore.toFixed(1)}
                </span>
                <span className="text-xs text-[#404941]">/ 10</span>
              </div>
            </div>
            <p className="text-[11px] text-[#404941] leading-relaxed pt-2 border-t border-[#ddf3e6]">
              Reflects feelings of detachment or questioning the purpose of assignments.
            </p>
          </div>

          {/* Dimension 3: Academic Efficacy / Confidence */}
          <div className="p-5 rounded-3xl bg-white/70 backdrop-blur-xl border border-white/80 shadow-sm flex flex-col justify-between space-y-3">
            <div className="space-y-2">
              <div className="w-8 h-8 rounded-full bg-[#ddf3e6] flex items-center justify-center text-[#14532d]">
                <span className="material-symbols-outlined text-[18px]">verified</span>
              </div>
              <div>
                <h3 className="font-bold text-xs sm:text-sm text-[#0c1f18]">Academic Confidence</h3>
                <span className="text-[10px] text-[#4b6459] font-medium block">
                  Belief in your study capability
                </span>
              </div>
              <div className="flex items-baseline gap-1.5 pt-1">
                <span className="text-2xl font-bold text-[#14532d]">
                  {metrics.academicConfidenceScore.toFixed(1)}
                </span>
                <span className="text-xs text-[#404941]">/ 10</span>
              </div>
            </div>
            <p className="text-[11px] text-[#404941] leading-relaxed pt-2 border-t border-[#ddf3e6]">
              Higher values show healthy confidence in mastering complex subjects.
            </p>
          </div>
        </div>
      </div>

      {/* 3. WHAT MAY BE AFFECTING YOUR RESULT? & 4. WHAT CAN I DO NEXT? */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: What May Be Contributing (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          <div className="p-6 sm:p-8 rounded-3xl bg-white/75 backdrop-blur-[24px] border border-white/90 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#4b6459] block mb-0.5">
                  Factors Influencing Your Result
                </span>
                <h2 className="font-title-lg text-title-lg text-[#0c1f18]">
                  What may be contributing to your score?
                </h2>
              </div>
              <button
                onClick={() => onNavigate('insights')}
                className="text-xs text-[#14532d] font-semibold hover:underline flex items-center gap-1 cursor-pointer self-start sm:self-auto"
              >
                <span>View factor details</span>
                <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
              </button>
            </div>

            <p className="text-xs text-[#404941] leading-relaxed">
              Based on the habits you entered in your latest check-in, here is how key areas compare with healthy student benchmarks. <em>Note: These reflect statistical associations in student data, not proven medical causes.</em>
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Factor 1: Sleep */}
              <div className="p-4 rounded-2xl bg-[#e3f9ec]/60 border border-white space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#0c1f18] flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[#14532d] text-[17px]">bedtime</span>
                    Nightly Sleep
                  </span>
                  <span className="text-xs font-bold text-[#0c1f18]">
                    {metrics.reportedSleep} hrs/night
                  </span>
                </div>
                <p className="text-[11px] text-[#404941] leading-relaxed">
                  {metrics.reportedSleep >= 7
                    ? 'You reported 7+ hours of sleep, which strongly helps buffer against fatigue.'
                    : 'You reported under 7 hours of sleep. Chronic sleep restriction is one of the highest contributors to study exhaustion.'}
                </p>
              </div>

              {/* Factor 2: Study Hours */}
              <div className="p-4 rounded-2xl bg-[#e3f9ec]/60 border border-white space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#0c1f18] flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[#14532d] text-[17px]">menu_book</span>
                    Daily Study Time
                  </span>
                  <span className="text-xs font-bold text-[#0c1f18]">
                    {metrics.reportedStudyHours} hrs/day
                  </span>
                </div>
                <p className="text-[11px] text-[#404941] leading-relaxed">
                  {metrics.reportedStudyHours > 7
                    ? 'Long continuous daily study blocks can lead to diminishing retention without structured breaks.'
                    : 'Your daily study duration is in a balanced range. Ensuring regular breaks keeps focus high.'}
                </p>
              </div>

              {/* Factor 3: Exam Pressure */}
              <div className="p-4 rounded-2xl bg-[#e3f9ec]/60 border border-white space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#0c1f18] flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[#14532d] text-[17px]">assignment_late</span>
                    Exam &amp; Deadline Pressure
                  </span>
                  <span className="text-xs font-bold text-[#0c1f18]">
                    {metrics.reportedExamPressure}/10
                  </span>
                </div>
                <p className="text-[11px] text-[#404941] leading-relaxed">
                  {metrics.reportedExamPressure >= 7
                    ? 'You reported high exam pressure. Breaking large projects into manageable steps reduces deadline panic.'
                    : 'Exam pressure is currently at a moderate or low level, allowing for steady pace.'}
                </p>
              </div>

              {/* Factor 4: Social Support */}
              <div className="p-4 rounded-2xl bg-[#e3f9ec]/60 border border-white space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#0c1f18] flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[#14532d] text-[17px]">groups</span>
                    Sources of Support
                  </span>
                  <span className="text-xs font-bold text-[#0c1f18]">
                    {metrics.reportedSocialSupport}/10
                  </span>
                </div>
                <p className="text-[11px] text-[#404941] leading-relaxed">
                  {metrics.reportedSocialSupport >= 6
                    ? 'Strong social connection with peers or family provides an important emotional buffer.'
                    : 'Consider reaching out to a classmate or campus peer group; shared study sessions ease feelings of isolation.'}
                </p>
              </div>
            </div>
          </div>

          {/* Quick Progress Over Time Preview */}
          <div className="p-6 sm:p-7 rounded-3xl bg-white/75 backdrop-blur-[24px] border border-white/90 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#4b6459] block mb-0.5">
                  Your Progress Over Time
                </span>
                <h3 className="font-title-md text-title-md text-[#0c1f18]">
                  Tracking Changes Across Assessments
                </h3>
              </div>
              <button
                onClick={() => onNavigate('trends')}
                className="text-xs text-[#14532d] font-semibold hover:underline cursor-pointer"
              >
                Full progress chart →
              </button>
            </div>
            <p className="text-xs text-[#404941] leading-relaxed">
              {metrics.isInitialBaseline
                ? 'You have completed your first assessment. Complete another assessment in a few days or next week to begin tracking trends over time.'
                : 'Your current score is logged in your local history. Continue logging weekly to observe whether habit adjustments help lower strain.'}
            </p>
          </div>
        </div>

        {/* Right Column: Small Steps & Breathing Reset (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Small Steps You Can Try */}
          <div className="p-6 rounded-3xl bg-white/80 backdrop-blur-[24px] border border-white/90 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-xs sm:text-sm text-[#0c1f18] flex items-center gap-2">
                <span className="material-symbols-outlined text-[#14532d] text-[19px]">task_alt</span>
                Small Steps You Can Try
              </h3>
              <span className="text-[10px] text-[#4b6459] font-semibold">
                {completedSteps.length}/3 Done
              </span>
            </div>

            <p className="text-xs text-[#404941] leading-relaxed">
              Practical, gentle adjustments you can experiment with today:
            </p>

            <div className="space-y-2.5">
              {[
                {
                  id: 'step-1',
                  text: 'Take a 10-minute screen-free break after your next 50-minute study block.',
                },
                {
                  id: 'step-2',
                  text: 'Set a consistent wind-down time tonight 30 minutes before sleep.',
                },
                {
                  id: 'step-3',
                  text: 'Break your biggest upcoming assignment into 3 smaller, bite-sized tasks.',
                },
              ].map((st) => {
                const isDone = completedSteps.includes(st.id);
                return (
                  <label
                    key={st.id}
                    onClick={() => toggleStep(st.id)}
                    className={`flex items-start gap-2.5 p-3 rounded-2xl border text-xs cursor-pointer transition-colors ${
                      isDone
                        ? 'bg-[#ddf3e6]/60 border-[#cde9db] text-[#14532d] line-through'
                        : 'bg-[#e3f9ec]/40 border-white text-[#0c1f18] hover:bg-[#ddf3e6]/40'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isDone}
                      onChange={() => {}}
                      className="mt-0.5 rounded text-[#14532d] border-[#c0c9be] focus:ring-[#14532d] cursor-pointer"
                    />
                    <span className="leading-snug select-none">{st.text}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* 2-Minute Box Breathing Reset Tool */}
          <div className="p-6 rounded-3xl bg-white/75 backdrop-blur-[24px] border border-white/90 shadow-sm flex flex-col items-center text-center space-y-3">
            <div className="w-full flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#4b6459]">
                Mindful Reset
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-[#ddf3e6] text-[#14532d] text-[10px] font-bold">
                2-Minute Pause
              </span>
            </div>

            {/* Breathing Animation Orb */}
            <div className="relative w-36 h-36 flex items-center justify-center my-2">
              <div
                className={`absolute w-32 h-32 rounded-full bg-[#d7ede1]/60 transition-transform duration-[3500ms] ease-in-out ${orbScale.outer}`}
              ></div>
              <div
                className={`absolute w-24 h-24 rounded-full bg-[#cde9db]/80 transition-transform duration-[3500ms] ease-in-out ${orbScale.mid}`}
              ></div>
              <div className="relative z-10 w-16 h-16 rounded-full bg-[#14532d] text-white flex flex-col items-center justify-center shadow-md">
                <span className="material-symbols-outlined text-[18px]">air</span>
                <span className="text-[9px] font-bold tracking-widest mt-0.5">
                  {isBreathing ? breathPhase : 'INHALE'}
                </span>
                {isBreathing && (
                  <span className="text-[9px] font-mono opacity-80">{breathCountdown}s</span>
                )}
              </div>
            </div>

            <p className="text-xs text-[#404941] leading-relaxed max-w-xs">
              4-second slow rhythmic breathing helps quiet physical tension during intense study days.
            </p>

            <button
              onClick={() => setIsBreathing(!isBreathing)}
              className={`w-full py-2.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                isBreathing
                  ? 'bg-[#cde9db] text-[#14532d]'
                  : 'bg-[#ddf3e6] hover:bg-[#d7ede1] text-[#003b1b]'
              }`}
            >
              {isBreathing ? 'Pause Breathing' : 'Begin 2-Minute Breathing'}
            </button>
          </div>

          {/* Campus Quiet Spot Card */}
          <div className="rounded-3xl overflow-hidden bg-white/75 backdrop-blur-[24px] border border-white/90 shadow-sm flex flex-col">
            <div className="relative h-32 w-full overflow-hidden">
              <img
                className="w-full h-full object-cover"
                src={ASSETS.greenhouse}
                alt="Campus Quiet Space"
                referrerPolicy="no-referrer"
              />
              <span className="absolute top-3 left-3 px-2.5 py-0.5 rounded-full bg-white/90 backdrop-blur-md text-[#14532d] text-[10px] font-bold">
                Campus Quiet Spot
              </span>
            </div>
            <div className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-xs sm:text-sm text-[#0c1f18]">Biology Greenhouse Atrium</h4>
                <button
                  onClick={onOpenSanctuary}
                  className="p-1 rounded-full text-[#14532d] hover:bg-[#ddf3e6] transition-colors cursor-pointer"
                  title="View Details"
                >
                  <span className="material-symbols-outlined text-[18px]">near_me</span>
                </button>
              </div>
              <p className="text-[11px] text-[#404941] leading-relaxed">
                A quiet natural space with natural light and plants for reading away from noisy library zones.
              </p>
              <div className="pt-2 border-t border-[#ddf3e6] flex items-center justify-between text-xs text-[#14532d]">
                <span className="text-[10px] text-[#404941]">4 min walk from Central Hall</span>
                <button
                  onClick={onOpenSanctuary}
                  className="font-semibold hover:underline cursor-pointer"
                >
                  Location info →
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Persistent Non-Diagnostic Reassurance Banner */}
      <div className="p-5 rounded-3xl bg-[#e3f9ec]/50 backdrop-blur-md border border-white/70 flex flex-col sm:flex-row items-center justify-between gap-4 text-[#404941]">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-[#14532d] text-[20px] shrink-0">
            verified_user
          </span>
          <p className="text-xs leading-relaxed">
            <strong className="text-[#0c1f18]">Awareness &amp; Reflection Prototype:</strong> Calma is designed for student self-awareness and habit reflection. It is not a clinical diagnosis. If you are experiencing distressing mental strain, consider speaking with campus counseling.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0 text-xs">
          {onOpenHelp && (
            <button
              onClick={onOpenHelp}
              className="text-[#14532d] font-semibold hover:underline cursor-pointer"
            >
              Support Directory
            </button>
          )}
          <button
            onClick={onOpenPrivacy}
            className="text-[#0c1f18] hover:underline cursor-pointer font-medium"
          >
            Privacy Details
          </button>
        </div>
      </div>
    </div>
  );
};
