/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { BurnoutMetrics } from '../types';
import { getStoredAssessments, StoredAssessment } from '../services/api';

interface TrendsViewProps {
  metrics: BurnoutMetrics;
}

export const TrendsView: React.FC<TrendsViewProps> = ({ metrics }) => {
  const [assessments, setAssessments] = useState<StoredAssessment[]>([]);
  const [hoveredPoint, setHoveredPoint] = useState<StoredAssessment | null>(null);

  useEffect(() => {
    const list = getStoredAssessments();
    // If user has local assessments, sort them chronologically (oldest first for chart)
    if (list.length > 0) {
      const sorted = [...list].sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
      setAssessments(sorted);
    } else {
      // If none in storage yet, create a single baseline record representing current metrics
      setAssessments([
        {
          id: 'baseline-current',
          timestamp: new Date().toISOString(),
          dateFormatted: metrics.lastAssessmentDate || 'Today',
          burnout_score: metrics.burnoutScore,
          risk_level: metrics.riskLevel,
          source: 'local_fallback',
          features: {
            age: 21,
            academic_year: 2,
            study_hours_per_day: metrics.reportedStudyHours,
            exam_pressure: metrics.reportedExamPressure,
            academic_performance: 7,
            sleep_hours: metrics.reportedSleep,
            physical_activity: 1,
            social_support: metrics.reportedSocialSupport,
            screen_time: 5,
            internet_usage: 4,
            financial_stress: 5,
            family_expectation: 6,
            gender: 'Female',
            stress_level: 6.5,
            anxiety_score: 5.5,
            depression_score: 4.5,
          },
        },
      ]);
    }
  }, [metrics]);

  const hasMultipleAssessments = assessments.length > 1;

  // Compute trend comparison if >= 2 points
  const latestScore = assessments[assessments.length - 1]?.burnout_score ?? metrics.burnoutScore;
  const previousScore = hasMultipleAssessments
    ? assessments[assessments.length - 2]?.burnout_score
    : null;
  const scoreDiff = previousScore !== null ? Math.round((latestScore - previousScore) * 10) / 10 : null;

  return (
    <div className="flex flex-col w-full space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col max-w-2xl space-y-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#14532d]"></span>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#4b6459]">
            Progress Over Time
          </span>
          <span className="text-[11px] text-[#404941]/60">• Real Recorded Check-Ins</span>
        </div>
        <h1 className="font-headline-lg text-headline-lg text-[#003b1b] tracking-tight">
          Your Well-Being Progress Over Time
        </h1>
        <p className="text-xs sm:text-sm text-[#404941] leading-relaxed">
          Track how your burnout risk score changes across consecutive assessments as you adjust your study and sleep habits.
        </p>
      </div>

      {/* Main Chart Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white/75 backdrop-blur-[24px] border border-white/90 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#4b6459] block mb-0.5">
              Score History (0–10 Scale)
            </span>
            <h2 className="font-title-lg text-title-lg text-[#0c1f18]">
              Recorded Burnout Risk Scores
            </h2>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#e3f9ec] text-[#14532d] text-xs font-semibold self-start sm:self-auto">
            <span className="w-2 h-2 rounded-full bg-[#14532d]"></span>
            <span>Latest: {latestScore.toFixed(1)} / 10 ({metrics.riskLevel})</span>
          </div>
        </div>

        {/* Condition 1: Multiple Assessments Recorded */}
        {hasMultipleAssessments ? (
          <div className="space-y-4">
            {/* SVG Line / Dot Plot */}
            <div className="relative w-full h-64 bg-[#f8faf8] rounded-2xl border border-[#ddf3e6] p-4 flex flex-col justify-between">
              {/* Score scale gridlines */}
              <div className="absolute inset-x-8 top-6 border-b border-[#e2e8e0] border-dashed">
                <span className="text-[10px] text-[#404941] -mt-4 block font-mono">10 (Elevated)</span>
              </div>
              <div className="absolute inset-x-8 top-1/2 border-b border-[#e2e8e0] border-dashed">
                <span className="text-[10px] text-[#404941] -mt-4 block font-mono">5 (Moderate)</span>
              </div>
              <div className="absolute inset-x-8 bottom-12 border-b border-[#e2e8e0] border-dashed">
                <span className="text-[10px] text-[#404941] -mt-4 block font-mono">1 (Lower)</span>
              </div>

              {/* Data points row */}
              <div className="relative z-10 w-full h-full flex items-end justify-around pb-6 pt-6 px-8">
                {assessments.map((a, idx) => {
                  const heightPct = Math.min(90, Math.max(10, (a.burnout_score / 10) * 85));
                  const isHovered = hoveredPoint?.id === a.id;
                  return (
                    <div
                      key={a.id || idx}
                      className="flex flex-col items-center gap-2 relative group cursor-pointer"
                      onMouseEnter={() => setHoveredPoint(a)}
                      onMouseLeave={() => setHoveredPoint(null)}
                    >
                      {/* Tooltip on hover */}
                      {isHovered && (
                        <div className="absolute -top-12 bg-white px-3 py-1.5 rounded-xl border border-white shadow-lg text-xs font-bold text-[#14532d] whitespace-nowrap z-20 pointer-events-none">
                          {a.dateFormatted}: {a.burnout_score.toFixed(1)} / 10 ({a.risk_level})
                        </div>
                      )}

                      {/* Bar indicator */}
                      <div
                        className="w-10 rounded-t-xl transition-all duration-300 flex items-center justify-center text-[10px] font-bold text-white shadow-sm"
                        style={{
                          height: `${heightPct * 1.8}px`,
                          backgroundColor:
                            a.burnout_score < 4.0
                              ? '#14532d'
                              : a.burnout_score < 7.0
                              ? '#d97706'
                              : '#dc2626',
                        }}
                      >
                        {a.burnout_score.toFixed(1)}
                      </div>

                      {/* Date label */}
                      <span className="text-[11px] font-medium text-[#404941] whitespace-nowrap">
                        {a.dateFormatted}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Plain-Language Interpretation */}
            <div className="p-4 rounded-2xl bg-[#e3f9ec]/60 border border-white text-xs text-[#404941] space-y-1 leading-relaxed">
              <strong className="text-[#0c1f18]">Comparison with previous check-in:</strong>
              {scoreDiff !== null && (
                <p>
                  {scoreDiff < 0
                    ? `Your latest score is ${Math.abs(scoreDiff)} points lower than your previous recorded assessment, indicating positive recovery.`
                    : scoreDiff > 0
                    ? `Your latest score is ${scoreDiff} points higher than your previous recorded assessment, indicating that study load or fatigue has increased.`
                    : 'Your score has remained stable compared to your previous assessment.'}
                </p>
              )}
            </div>
          </div>
        ) : (
          /* Condition 2: Single Assessment or First Baseline */
          <div className="p-8 rounded-2xl bg-[#f8faf8] border border-[#ddf3e6] text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-[#ddf3e6] text-[#14532d] flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-[24px]">query_stats</span>
            </div>
            <h3 className="font-bold text-sm text-[#0c1f18]">
              Baseline Assessment Recorded ({latestScore.toFixed(1)} / 10)
            </h3>
            <p className="text-xs text-[#404941] max-w-md mx-auto leading-relaxed">
              You have completed your first assessment. Complete another assessment later (e.g. next week or after an exam period) to start tracking changes in your well-being over time.
            </p>
          </div>
        )}
      </div>

      {/* Advice Card */}
      <div className="p-5 rounded-3xl bg-[#e3f9ec]/60 border border-white flex items-center justify-between gap-4 text-xs text-[#404941]">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-[#14532d] text-[20px] shrink-0">
            calendar_month
          </span>
          <span>
            <strong>Weekly cadence recommendation:</strong> Logging once a week takes under 2 minutes and helps you identify which weeks need extra rest before finals.
          </span>
        </div>
      </div>
    </div>
  );
};
