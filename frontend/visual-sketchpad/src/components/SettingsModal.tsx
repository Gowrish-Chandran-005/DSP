/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { clearStoredAssessments } from '../services/api';

interface SettingsModalProps {
  onClose: () => void;
  onClearData: () => void;
  onShowToast: (msg: string) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  onClose,
  onClearData,
  onShowToast,
}) => {
  const [sessionOnly, setSessionOnly] = useState(false);
  const [studyReminders, setStudyReminders] = useState(true);
  const [breathingDuration, setBreathingDuration] = useState('4s');

  const handleSave = () => {
    onShowToast('Your preferences have been saved.');
    onClose();
  };

  const handleClear = () => {
    if (window.confirm('Are you sure you want to clear your saved assessments and reset to default?')) {
      clearStoredAssessments();
      onClearData();
      onShowToast('All local assessment history has been cleared.');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl rounded-3xl bg-white/95 backdrop-blur-[32px] border border-white p-6 sm:p-7 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between pb-4 border-b border-[#ddf3e6]">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-full bg-[#ddf3e6] flex items-center justify-center text-[#14532d]">
              <span className="material-symbols-outlined text-[22px]">tune</span>
            </div>
            <div>
              <span className="font-label-md text-label-md uppercase tracking-wider text-[#4b6459]">
                Preferences
              </span>
              <h3 className="font-title-lg text-title-lg text-[#0c1f18]">
                Settings &amp; Privacy
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-[#e3f9ec] hover:bg-[#ddf3e6] text-[#404941] hover:text-[#0c1f18] flex items-center justify-center transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div className="overflow-y-auto space-y-4 py-4 pr-1 text-sm text-[#404941]">
          {/* Privacy Toggle */}
          <div className="p-3.5 rounded-2xl bg-[#e3f9ec]/60 border border-white flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-[#0c1f18] block">Private Browser Storage</span>
              <span className="text-[11px] text-[#404941]">Keeps assessment history strictly inside your browser cache</span>
            </div>
            <button
              onClick={() => setSessionOnly(!sessionOnly)}
              className={`w-12 h-6 rounded-full p-1 transition-colors cursor-pointer ${
                sessionOnly ? 'bg-[#14532d]' : 'bg-[#c0c9be]'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform ${
                  sessionOnly ? 'translate-x-6' : 'translate-x-0'
                }`}
              ></div>
            </button>
          </div>

          {/* Study Break Reminders */}
          <div className="p-3.5 rounded-2xl bg-[#e3f9ec]/60 border border-white flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-[#0c1f18] block">Study Break Reminders</span>
              <span className="text-[11px] text-[#404941]">Friendly notifications encouraging pauses during long study sessions</span>
            </div>
            <button
              onClick={() => setStudyReminders(!studyReminders)}
              className={`w-12 h-6 rounded-full p-1 transition-colors cursor-pointer ${
                studyReminders ? 'bg-[#14532d]' : 'bg-[#c0c9be]'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform ${
                  studyReminders ? 'translate-x-6' : 'translate-x-0'
                }`}
              ></div>
            </button>
          </div>

          {/* Breathing Cadence Selection */}
          <div className="p-3.5 rounded-2xl bg-[#e3f9ec]/60 border border-white space-y-2">
            <span className="text-xs font-bold text-[#0c1f18] block">Mindful Breathing Pace</span>
            <div className="flex gap-2">
              {['3s (Faster)', '4s (Standard Box)', '5s (Deep Rest)'].map((rate) => (
                <button
                  key={rate}
                  onClick={() => setBreathingDuration(rate.split(' ')[0])}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-colors ${
                    breathingDuration === rate.split(' ')[0]
                      ? 'bg-[#14532d] text-white'
                      : 'bg-white text-[#404941] hover:bg-[#ddf3e6]'
                  }`}
                >
                  {rate}
                </button>
              ))}
            </div>
          </div>

          {/* Clear Local Cache */}
          <div className="pt-2">
            <button
              onClick={handleClear}
              className="text-xs text-[#ba1a1a] hover:underline flex items-center gap-1.5 cursor-pointer font-medium"
            >
              <span className="material-symbols-outlined text-[16px]">delete</span>
              Clear all saved assessments and restore default baseline
            </button>
          </div>
        </div>

        <div className="pt-3 border-t border-[#ddf3e6] flex items-center justify-end gap-2.5">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-full text-xs font-semibold text-[#404941] hover:bg-[#e3f9ec] transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 rounded-full text-xs font-semibold text-white bg-[#14532d] hover:bg-[#003b1b] transition-colors cursor-pointer"
          >
            Save Preferences
          </button>
        </div>
      </div>
    </div>
  );
};
