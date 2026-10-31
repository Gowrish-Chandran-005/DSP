/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface PrivacyProtocolModalProps {
  onClose: () => void;
}

export const PrivacyProtocolModal: React.FC<PrivacyProtocolModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl rounded-3xl bg-white/95 backdrop-blur-[32px] border border-white p-6 sm:p-7 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between pb-4 border-b border-[#ddf3e6]">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-full bg-[#ddf3e6] flex items-center justify-center text-[#14532d]">
              <span className="material-symbols-outlined text-[22px]">verified_user</span>
            </div>
            <div>
              <span className="font-label-md text-label-md uppercase tracking-wider text-[#4b6459]">
                Privacy Standard
              </span>
              <h3 className="font-title-lg text-title-lg text-[#0c1f18]">
                Student Data Protection &amp; Ethics
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
          <div className="p-4 rounded-2xl bg-[#e3f9ec]/60 border border-white space-y-2">
            <h4 className="font-semibold text-[#0c1f18] flex items-center gap-2">
              <span className="material-symbols-outlined text-[#14532d] text-[18px]">lock</span>
              1. Local Session Storage
            </h4>
            <p className="text-xs leading-relaxed">
              Your questionnaire answers and burnout estimations are kept locally in your current browser session. We do not transmit or sell student personal data to third-party advertisers or external cloud data brokers.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#e3f9ec]/60 border border-white space-y-2">
            <h4 className="font-semibold text-[#0c1f18] flex items-center gap-2">
              <span className="material-symbols-outlined text-[#14532d] text-[18px]">visibility_off</span>
              2. Complete Academic Independence
            </h4>
            <p className="text-xs leading-relaxed">
              Zero university administration, professors, academic advisors, or university grading bodies have access to your Calma entries. Your scores cannot impact your GPA, scholarship standing, or academic standing.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#e3f9ec]/60 border border-white space-y-2">
            <h4 className="font-semibold text-[#0c1f18] flex items-center gap-2">
              <span className="material-symbols-outlined text-[#14532d] text-[18px]">volunteer_activism</span>
              3. Transparent Model Limitations
            </h4>
            <p className="text-xs leading-relaxed">
              Calma uses scikit-learn regression models trained on student well-being benchmarks. Predictions reflect statistical patterns in student habits, not clinical truth. They are designed for self-reflection and proactive habit adjustments.
            </p>
          </div>
        </div>

        <div className="pt-3 border-t border-[#ddf3e6] flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-full text-xs font-semibold text-white bg-[#14532d] hover:bg-[#003b1b] transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
