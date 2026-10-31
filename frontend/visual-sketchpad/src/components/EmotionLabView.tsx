/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';

export const EmotionLabView: React.FC = () => {
  const [selectedState, setSelectedState] = useState<string>('Focused Calm');
  const [arousalValence, setArousalValence] = useState<{ x: number; y: number }>({ x: 65, y: 70 });

  const affectiveStates = [
    {
      name: 'Focused Calm',
      x: 65,
      y: 70,
      desc: 'Moderate focus, steady breathing, comfortable engagement with coursework.',
      color: '#14532d',
    },
    {
      name: 'Quiet Rest',
      x: 25,
      y: 80,
      desc: 'Low cognitive demand, relaxed body, recovering energy between study blocks.',
      color: '#2e6a41',
    },
    {
      name: 'Study Fatigue',
      x: 25,
      y: 35,
      desc: 'Low energy, heavy eyelids, needing a break or sleep rather than more cramming.',
      color: '#1e3635',
    },
    {
      name: 'Exam Stress',
      x: 80,
      y: 35,
      desc: 'High mental tension, fast pacing, elevated urgency near deadlines.',
      color: '#b91c1c',
    },
  ];

  const handleSelectState = (state: (typeof affectiveStates)[0]) => {
    setSelectedState(state.name);
    setArousalValence({ x: state.x, y: state.y });
  };

  return (
    <div className="flex flex-col w-full space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col max-w-2xl space-y-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#14532d]"></span>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#4b6459]">
            Experimental Research Lab
          </span>
          <span className="text-[11px] text-[#404941]/60">• MediaPipe &amp; Facial Affect</span>
        </div>
        <h1 className="font-headline-lg text-headline-lg text-[#003b1b] tracking-tight">
          Visual Emotion Study
        </h1>
        <p className="text-xs sm:text-sm text-[#404941] leading-relaxed">
          Explore the relationship between study focus, energy levels, and facial expression states.
        </p>
      </div>

      {/* Experimental Disclaimer Notice */}
      <div className="p-4 rounded-2xl bg-[#fef3c7]/60 border border-[#fde68a] text-xs text-[#92400e] flex items-start gap-3">
        <span className="material-symbols-outlined text-[19px] shrink-0 text-[#d97706]">
          science
        </span>
        <div className="space-y-0.5">
          <p className="font-bold">Important Research Note:</p>
          <p>
            Facial emotion recognition classifies momentary affective expressions (such as Surprise, Neutral, or Focus) and is <strong>not a direct measure of burnout</strong>. Burnout is evaluated from your multi-week study habits and lifestyle assessment.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Interactive Coordinate Plane (8 cols) */}
        <div className="lg:col-span-8 p-6 sm:p-8 rounded-3xl bg-white/75 backdrop-blur-xl border border-white/90 shadow-sm flex flex-col justify-between space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-title-md text-title-md text-[#0c1f18]">
                Interactive Focus &amp; Energy Plane
              </h2>
              <span className="text-[11px] text-[#404941]">
                Horizontal axis: Energy/Alertness • Vertical axis: Mood Positivity
              </span>
            </div>
            <span className="text-xs font-mono text-[#14532d] bg-[#ddf3e6] px-3 py-1 rounded-full font-bold">
              Energy: {arousalValence.x}% • Mood: {arousalValence.y}%
            </span>
          </div>

          <div
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const x = Math.max(5, Math.min(95, Math.round(((e.clientX - rect.left) / rect.width) * 100)));
              const y = Math.max(5, Math.min(95, Math.round((1 - (e.clientY - rect.top) / rect.height) * 100)));
              setArousalValence({ x, y });
              setSelectedState('Custom Check-in');
            }}
            className="relative w-full h-80 rounded-2xl bg-gradient-to-tr from-[#ddf3e6]/60 via-white to-[#cde8e5]/60 border border-[#cde9db] cursor-crosshair overflow-hidden shadow-inner flex items-center justify-center select-none"
          >
            {/* Center crosshairs */}
            <div className="absolute inset-x-0 top-1/2 h-px bg-[#717970]/30 pointer-events-none"></div>
            <div className="absolute inset-y-0 left-1/2 w-px bg-[#717970]/30 pointer-events-none"></div>

            {/* Quadrant labels */}
            <span className="absolute top-3 left-4 text-[10px] font-bold text-[#4b6459] uppercase pointer-events-none">
              High Mood / Low Energy (Quiet Rest)
            </span>
            <span className="absolute top-3 right-4 text-[10px] font-bold text-[#14532d] uppercase pointer-events-none">
              High Mood / High Alertness (Flow)
            </span>
            <span className="absolute bottom-3 left-4 text-[10px] font-bold text-[#1e3635] uppercase pointer-events-none">
              Low Mood / Low Energy (Fatigue)
            </span>
            <span className="absolute bottom-3 right-4 text-[10px] font-bold text-[#b91c1c] uppercase pointer-events-none">
              Low Mood / High Stress (Tension)
            </span>

            {/* Target Coordinate Dot */}
            <div
              className="absolute w-7 h-7 rounded-full bg-[#14532d]/20 border-2 border-[#14532d] flex items-center justify-center -translate-x-1/2 -translate-y-1/2 transition-all duration-300 pointer-events-none shadow-lg"
              style={{ left: `${arousalValence.x}%`, top: `${100 - arousalValence.y}%` }}
            >
              <div className="w-2.5 h-2.5 rounded-full bg-[#14532d]"></div>
            </div>
          </div>

          <p className="text-xs text-[#404941] text-center leading-relaxed">
            Click anywhere on the coordinate plane to reflect your current study state and view suggested pacing adjustments.
          </p>
        </div>

        {/* State Presets (4 cols) */}
        <div className="lg:col-span-4 space-y-3.5">
          <span className="text-xs font-bold text-[#4b6459] uppercase tracking-wider block">
            Common Student Study States
          </span>
          <div className="space-y-3">
            {affectiveStates.map((st) => {
              const isSelected = selectedState === st.name;
              return (
                <div
                  key={st.name}
                  onClick={() => handleSelectState(st)}
                  className={`p-4 rounded-2xl transition-all cursor-pointer border ${
                    isSelected
                      ? 'bg-white shadow-md border-[#14532d]'
                      : 'bg-white/60 hover:bg-white border-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs sm:text-sm font-bold text-[#0c1f18]">{st.name}</span>
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: st.color }}
                    ></span>
                  </div>
                  <p className="text-xs text-[#404941] mt-1 leading-relaxed">{st.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
