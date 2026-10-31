/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { BurnoutMetrics } from '../types';
import { SHAP_FACTORS } from '../data/mockData';

interface InsightsViewProps {
  metrics: BurnoutMetrics;
  onOpenCampusCare: () => void;
  onOpenModelDocs: () => void;
  onShowToast: (msg: string) => void;
}

export const InsightsView: React.FC<InsightsViewProps> = ({
  metrics,
  onOpenCampusCare,
  onOpenModelDocs,
  onShowToast,
}) => {
  const [sleepHours, setSleepHours] = useState<number>(metrics.reportedSleep || 7.0);
  const [breakPacing, setBreakPacing] = useState<number>(2);

  const breakOptions: Record<number, { title: string; desc: string }> = {
    1: { title: 'No scheduled breaks', desc: 'Long continuous sessions without stepping away' },
    2: { title: '50m study + 10m break', desc: 'Balanced sprint with a short mental reset' },
    3: { title: '25m study + 5m break (Pomodoro)', desc: 'Frequent resets for high focus maintenance' },
    4: { title: '90m deep study + 20m break', desc: 'Long focus block followed by active downtime' },
  };

  // Educational routine simulation delta
  const calculateSimulatedChange = () => {
    let delta = 0;
    delta += (sleepHours - 7.0) * -0.6;
    if (breakPacing === 1) delta += 0.8;
    else if (breakPacing === 2) delta -= 0.5;
    else if (breakPacing === 3) delta -= 0.6;
    else if (breakPacing === 4) delta -= 0.4;
    return Math.round(delta * 10) / 10;
  };

  const simDelta = calculateSimulatedChange();
  const simulatedScore = Math.max(1.0, Math.min(10.0, Math.round((metrics.burnoutScore + simDelta) * 10) / 10));

  const handleApplySchedule = () => {
    onShowToast(`Pacing goal updated: ${sleepHours}h nightly sleep and ${breakOptions[breakPacing].title}.`);
  };

  return (
    <div className="flex flex-col w-full space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col space-y-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#14532d]"></span>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#4b6459]">
            Factors Influencing Your Result
          </span>
          <span className="text-[11px] text-[#404941]/60">• Feature Importance Insights</span>
        </div>
        <h1 className="font-headline-lg text-headline-lg text-[#003b1b] tracking-tight">
          Understanding What May Influence Your Well-Being
        </h1>
        <p className="text-xs sm:text-sm text-[#404941] leading-relaxed max-w-2xl">
          Here we examine how your reported study habits, rest, and workload pressures compare with patterns observed in student well-being data. <em>These represent statistical correlations, not direct causal guarantees.</em>
        </p>
      </div>

      {/* Main Factor Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Model Feature Influence Cards (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          <div className="p-6 sm:p-8 rounded-3xl bg-white/75 backdrop-blur-[24px] border border-white/90 shadow-sm space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-title-lg text-title-lg text-[#0c1f18]">
                  Key Factors Identified by the Model
                </h2>
                <p className="text-xs text-[#404941] mt-0.5">
                  How individual habits and pressures shift the estimated risk score up or down.
                </p>
              </div>
              <button
                onClick={onOpenModelDocs}
                className="text-xs text-[#14532d] font-semibold hover:underline cursor-pointer flex items-center gap-1"
              >
                <span>How this is calculated</span>
                <span className="material-symbols-outlined text-[15px]">info</span>
              </button>
            </div>

            <div className="space-y-3.5">
              {SHAP_FACTORS.map((f) => {
                const isStrain = f.isStrain;
                return (
                  <div
                    key={f.id}
                    className="p-4 sm:p-5 rounded-2xl bg-[#e3f9ec]/60 border border-white flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-3.5">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                          isStrain ? 'bg-[#fee2e2] text-[#b91c1c]' : 'bg-[#ddf3e6] text-[#14532d]'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[20px]">{f.icon}</span>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-xs sm:text-sm text-[#0c1f18]">{f.name}</h3>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              isStrain
                                ? 'bg-[#fee2e2] text-[#991b1b]'
                                : 'bg-[#ddf3e6] text-[#003b1b]'
                            }`}
                          >
                            {isStrain ? 'Possible Strain Factor' : 'Protective Factor'}
                          </span>
                        </div>
                        <p className="text-xs text-[#404941] leading-relaxed">{f.explanation}</p>
                      </div>
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end justify-between shrink-0 pl-12 sm:pl-0">
                      <span
                        className={`text-sm font-extrabold ${
                          isStrain ? 'text-[#b91c1c]' : 'text-[#14532d]'
                        }`}
                      >
                        {f.deltaPts > 0 ? `+${f.deltaPts}` : `${f.deltaPts}`} pts
                      </span>
                      <span className="text-[10px] text-[#404941]">Relative weight</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Explanation box */}
            <div className="p-4 rounded-2xl bg-[#f8faf8] border border-[#ddf3e6] text-xs text-[#404941] space-y-1 leading-relaxed">
              <strong className="text-[#0c1f18]">Reading these factors:</strong>
              <p>
                Factors marked with negative points (e.g. <em>Adequate Sleep</em>) are associated with lower burnout risk in student studies. Factors with positive points (e.g. <em>High Exam Pressure</em>) are associated with increased fatigue.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Educational Routine Exploration Simulator (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="p-6 sm:p-7 rounded-3xl bg-white/75 backdrop-blur-[24px] border border-white/90 shadow-sm space-y-5">
            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#4b6459] block">
                Educational Tool
              </span>
              <h3 className="font-title-md text-title-md text-[#0c1f18]">
                Explore Routine Adjustments
              </h3>
              <p className="text-xs text-[#404941] leading-relaxed">
                See how small changes in sleep and study break habits might influence your estimated well-being.
              </p>
            </div>

            {/* Simulator Inputs */}
            <div className="space-y-4 pt-1">
              {/* Sleep slider */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold text-[#0c1f18]">
                  <span>Target Sleep</span>
                  <span className="text-[#14532d]">{sleepHours} hrs/night</span>
                </div>
                <input
                  type="range"
                  min={4}
                  max={10}
                  step={0.5}
                  value={sleepHours}
                  onChange={(e) => setSleepHours(Number(e.target.value))}
                  className="w-full accent-[#14532d] cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-[#404941]">
                  <span>4 hrs</span>
                  <span>7–9 hrs (Ideal)</span>
                  <span>10 hrs</span>
                </div>
              </div>

              {/* Study Break Selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#0c1f18] block">
                  Study Break Strategy
                </label>
                <div className="space-y-2">
                  {[1, 2, 3, 4].map((idx) => {
                    const opt = breakOptions[idx];
                    const isSelected = breakPacing === idx;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setBreakPacing(idx)}
                        className={`w-full text-left p-3 rounded-xl border text-xs transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-[#ddf3e6] border-[#14532d] text-[#003b1b] font-semibold'
                            : 'bg-white/80 border-white text-[#404941] hover:bg-[#e3f9ec]/50'
                        }`}
                      >
                        <div className="font-bold">{opt.title}</div>
                        <div className="text-[11px] font-normal text-[#404941] mt-0.5">{opt.desc}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Simulated Score Outcome */}
            <div className="p-4 rounded-2xl bg-[#ddf3e6]/70 border border-white text-center space-y-1">
              <span className="text-[10px] uppercase tracking-wider font-bold text-[#4b6459] block">
                Estimated Score with These Habits
              </span>
              <div className="text-3xl font-extrabold text-[#003b1b]">
                {simulatedScore.toFixed(1)}{' '}
                <span className="text-xs font-normal text-[#404941]">
                  ({simDelta < 0 ? `${simDelta}` : `+${simDelta}`} pts)
                </span>
              </div>
              <p className="text-[11px] text-[#404941]">
                {simDelta < 0
                  ? 'Adding consistent sleep and structured breaks shows potential to lower strain.'
                  : 'Insufficient sleep or continuous study blocks can elevate fatigue.'}
              </p>
            </div>

            <button
              onClick={handleApplySchedule}
              className="w-full py-2.5 rounded-full bg-[#14532d] hover:bg-[#003b1b] text-white text-xs font-semibold shadow-sm transition-all cursor-pointer"
            >
              Save as Personal Study Goal
            </button>
          </div>

          {/* Need help banner */}
          <div className="p-5 rounded-3xl bg-white/70 backdrop-blur-xl border border-white/80 shadow-sm space-y-2">
            <h4 className="font-bold text-xs sm:text-sm text-[#0c1f18] flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[#14532d] text-[18px]">support_agent</span>
              Talk with a Counselor
            </h4>
            <p className="text-xs text-[#404941] leading-relaxed">
              If academic pressure or stress feels too heavy to manage on your own, campus counseling is free and confidential.
            </p>
            <button
              onClick={onOpenCampusCare}
              className="text-xs font-semibold text-[#14532d] hover:underline cursor-pointer pt-1 block"
            >
              Open Campus Support Directory →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
