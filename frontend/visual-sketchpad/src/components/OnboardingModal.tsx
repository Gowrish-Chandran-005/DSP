/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';

interface OnboardingModalProps {
  onClose: () => void;
  onConsentGiven: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ onClose, onConsentGiven }) => {
  const [hasConsented, setHasConsented] = useState(false);

  const handleConfirm = () => {
    if (!hasConsented) return;
    try {
      localStorage.setItem('calma_informed_consent', 'true');
    } catch {
      // Ignore
    }
    onConsentGiven();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl rounded-3xl bg-white/95 backdrop-blur-[32px] border border-white p-6 sm:p-8 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#ddf3e6]">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#ddf3e6] flex items-center justify-center text-[#14532d] shadow-sm">
              <span className="material-symbols-outlined text-[24px]">verified_user</span>
            </div>
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#4b6459] block">
                Welcome to Calma
              </span>
              <h2 className="font-title-lg text-title-lg text-[#0c1f18]">
                How We Protect &amp; Use Your Information
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-[#e3f9ec] hover:bg-[#ddf3e6] text-[#404941] hover:text-[#0c1f18] flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Informational Scroll Body */}
        <div className="overflow-y-auto space-y-4 py-5 pr-1 text-sm text-[#404941] leading-relaxed">
          {/* Card 1: What is burnout */}
          <div className="p-4 rounded-2xl bg-[#e3f9ec]/60 border border-white space-y-1.5">
            <h3 className="font-semibold text-xs sm:text-sm text-[#0c1f18] flex items-center gap-2">
              <span className="material-symbols-outlined text-[#14532d] text-[18px]">psychology</span>
              1. What is academic burnout?
            </h3>
            <p className="text-xs text-[#404941]">
              Burnout is a state of chronic physical and mental exhaustion caused by prolonged, unmanaged academic stress. Students often experience feeling drained, emotionally detached from coursework, or less confident in their academic abilities.
            </p>
          </div>

          {/* Card 2: What we ask for */}
          <div className="p-4 rounded-2xl bg-[#e3f9ec]/60 border border-white space-y-1.5">
            <h3 className="font-semibold text-xs sm:text-sm text-[#0c1f18] flex items-center gap-2">
              <span className="material-symbols-outlined text-[#14532d] text-[18px]">fact_check</span>
              2. What information does Calma ask for?
            </h3>
            <p className="text-xs text-[#404941]">
              Our assessment gathers your reported daily habits: study hours, sleep duration, physical activity, screen time, upcoming exam pressure, and personal stress levels.
            </p>
          </div>

          {/* Card 3: How it is processed */}
          <div className="p-4 rounded-2xl bg-[#e3f9ec]/60 border border-white space-y-1.5">
            <h3 className="font-semibold text-xs sm:text-sm text-[#0c1f18] flex items-center gap-2">
              <span className="material-symbols-outlined text-[#14532d] text-[18px]">memory</span>
              3. How is your information processed?
            </h3>
            <p className="text-xs text-[#404941]">
              Responses are evaluated by our trained machine learning model running on your local device. The model estimates an overall burnout risk score (on a 0–10 scale) to highlight which lifestyle factors might be contributing to strain.
            </p>
          </div>

          {/* Card 4: What predictions can and cannot tell you */}
          <div className="p-4 rounded-2xl bg-[#fff7ed] border border-[#fed7aa] space-y-1.5">
            <h3 className="font-semibold text-xs sm:text-sm text-[#9a3412] flex items-center gap-2">
              <span className="material-symbols-outlined text-[#ea580c] text-[18px]">medical_services</span>
              4. Non-diagnostic awareness, not medical care
            </h3>
            <p className="text-xs text-[#7c2d12]">
              Calma provides early-warning estimates for personal awareness only. <strong>It cannot diagnose clinical anxiety, depression, or mental health conditions.</strong> If you ever feel severely overwhelmed, we provide direct links to confidential campus counseling and support services.
            </p>
          </div>

          {/* Card 5: Privacy & storage */}
          <div className="p-4 rounded-2xl bg-[#e3f9ec]/60 border border-white space-y-1.5">
            <h3 className="font-semibold text-xs sm:text-sm text-[#0c1f18] flex items-center gap-2">
              <span className="material-symbols-outlined text-[#14532d] text-[18px]">lock</span>
              5. Private &amp; confidential
            </h3>
            <p className="text-xs text-[#404941]">
              Your responses are strictly stored in your private local session. University professors, academic advisors, and campus administrators have zero access to your scores or answers.
            </p>
          </div>
        </div>

        {/* Informed Consent Confirmation */}
        <div className="pt-4 border-t border-[#ddf3e6] space-y-3">
          <label className="flex items-start gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={hasConsented}
              onChange={(e) => setHasConsented(e.target.checked)}
              className="mt-1 w-4 h-4 rounded text-[#14532d] border-[#c0c9be] focus:ring-[#14532d] cursor-pointer"
            />
            <span className="text-xs text-[#0c1f18] font-medium leading-normal select-none">
              I understand that Calma is an educational self-reflection tool, not a medical diagnostic test, and I consent to entering my self-reported study habits and well-being answers.
            </span>
          </label>

          <div className="flex items-center justify-end gap-3 pt-1">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-full text-xs font-semibold text-[#404941] hover:bg-[#e3f9ec] transition-colors cursor-pointer"
            >
              Skip for Now
            </button>
            <button
              onClick={handleConfirm}
              disabled={!hasConsented}
              className={`px-5 py-2.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                hasConsented
                  ? 'bg-[#14532d] hover:bg-[#003b1b] text-white shadow-md'
                  : 'bg-[#d2e8db] text-[#717970] cursor-not-allowed'
              }`}
            >
              I Understand &amp; Agree
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
