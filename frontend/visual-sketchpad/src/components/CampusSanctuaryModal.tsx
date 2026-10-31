/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ASSETS } from '../data/mockData';

interface CampusSanctuaryModalProps {
  onClose: () => void;
}

export const CampusSanctuaryModal: React.FC<CampusSanctuaryModalProps> = ({ onClose }) => {
  const [ambientAudioActive, setAmbientAudioActive] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl rounded-3xl bg-white/95 backdrop-blur-[32px] border border-white p-6 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#ddf3e6]">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-full bg-[#ddf3e6] flex items-center justify-center text-[#14532d]">
              <span className="material-symbols-outlined text-[22px]">forest</span>
            </div>
            <div>
              <span className="font-label-md text-label-md uppercase tracking-wider text-[#4b6459]">
                Campus Quiet Space
              </span>
              <h3 className="font-title-lg text-title-lg text-[#0c1f18]">
                Biology Greenhouse Atrium
              </h3>
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

        {/* Content Body */}
        <div className="overflow-y-auto space-y-4 py-4 pr-1">
          {/* Photo Showcase */}
          <div className="relative h-48 w-full rounded-2xl overflow-hidden shadow-sm">
            <img
              src={ASSETS.greenhouse}
              alt="Biology Greenhouse Atrium"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end justify-between p-4 text-white">
              <div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-white/30 backdrop-blur-md">
                  Quiet Sensory Zone
                </span>
                <p className="text-sm font-medium mt-1">Building B, West Wing Pavilion</p>
              </div>
              <span className="text-xs font-mono bg-[#14532d]/80 px-2.5 py-1 rounded-full">
                4 min walk
              </span>
            </div>
          </div>

          {/* Environmental Conditions */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-[#e3f9ec]/60 border border-white">
              <span className="text-[11px] text-[#4b6459] block">Environment</span>
              <span className="text-sm font-bold text-[#0c1f18] mt-0.5 block">Warm &amp; Natural Light</span>
            </div>
            <div className="p-3 rounded-xl bg-[#e3f9ec]/60 border border-white">
              <span className="text-[11px] text-[#4b6459] block">Typical Atmosphere</span>
              <span className="text-sm font-bold text-[#14532d] mt-0.5 block">Low Footfall</span>
            </div>
            <div className="p-3 rounded-xl bg-[#e3f9ec]/60 border border-white">
              <span className="text-[11px] text-[#4b6459] block">Sound Level</span>
              <span className="text-sm font-bold text-[#0c1f18] mt-0.5 block">Quiet Whisper Zone</span>
            </div>
          </div>

          {/* Step-by-Step Walking Directions */}
          <div className="p-4 rounded-2xl bg-[#ddf3e6]/40 border border-white space-y-2.5">
            <span className="text-xs font-bold text-[#003b1b] uppercase tracking-wider block">
              Walking Directions from Main Quad
            </span>
            <div className="space-y-2 text-xs text-[#404941]">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#14532d] text-white flex items-center justify-center text-[10px] shrink-0 font-semibold">
                  1
                </span>
                <span>Exit Science Quad through the North Birch Courtyard.</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#14532d] text-white flex items-center justify-center text-[10px] shrink-0 font-semibold">
                  2
                </span>
                <span>Follow the shaded cedar pathway past the botanical herbarium.</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#14532d] text-white flex items-center justify-center text-[10px] shrink-0 font-semibold">
                  3
                </span>
                <span>Enter via the West glass atrium doors. Benches and study carrels are on level 2.</span>
              </div>
            </div>
          </div>

          {/* Ambient Sound Stream Toggle */}
          <div className="p-3.5 rounded-2xl bg-[#e3f9ec]/60 border border-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#ddf3e6] flex items-center justify-center text-[#14532d]">
                <span className="material-symbols-outlined text-[18px]">water_drop</span>
              </div>
              <div>
                <span className="text-xs font-bold text-[#0c1f18] block">Fountain &amp; Rain Audio</span>
                <span className="text-[11px] text-[#404941]">Gentle background white noise for reading</span>
              </div>
            </div>
            <button
              onClick={() => setAmbientAudioActive(!ambientAudioActive)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                ambientAudioActive
                  ? 'bg-[#14532d] text-white'
                  : 'bg-white text-[#14532d] border border-[#cde9db]'
              }`}
            >
              {ambientAudioActive ? 'Playing (Gentle)' : 'Test Audio'}
            </button>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="pt-3 border-t border-[#ddf3e6] flex items-center justify-between text-xs text-[#404941]">
          <span>Open daily: 7:00 AM – 9:00 PM</span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-full text-xs font-semibold text-white bg-[#14532d] hover:bg-[#003b1b] transition-colors cursor-pointer"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};
