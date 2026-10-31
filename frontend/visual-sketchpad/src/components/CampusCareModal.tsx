/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface CampusCareModalProps {
  onClose: () => void;
}

export const CampusCareModal: React.FC<CampusCareModalProps> = ({ onClose }) => {
  const careResources = [
    {
      title: '24/7 Student Crisis & Support Line',
      desc: 'Free, confidential support with licensed student counselors anytime.',
      contact: '(800) 273-8255 / Campus Ext. 4400',
      icon: 'call',
      badge: 'Immediate 24/7',
    },
    {
      title: 'Counseling & Psychological Services (CAPS)',
      desc: 'Individual counseling, stress reduction workshops, and academic burnout support.',
      contact: 'Student Wellness Pavilion, Room 310',
      icon: 'local_hospital',
      badge: 'Drop-In & Scheduled',
    },
    {
      title: 'Peer Support & Listening Circle',
      desc: 'Trained student mentors for confidential academic pressure decompression.',
      contact: 'Memorial Union, Daily 4:00 PM – 9:00 PM',
      icon: 'groups',
      badge: 'Peer Led',
    },
    {
      title: 'Mindfulness & Biophilic Rest Clinic',
      desc: 'Guided meditation pods, light therapy lamps, and quiet sensory sanctuaries.',
      contact: 'Greenhouse Wing Room 12',
      icon: 'self_improvement',
      badge: 'Walk-In Welcome',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl rounded-3xl bg-white/95 backdrop-blur-[32px] border border-white p-6 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between pb-4 border-b border-[#ddf3e6]">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-full bg-[#ddf3e6] flex items-center justify-center text-[#14532d]">
              <span className="material-symbols-outlined text-[22px]">health_and_safety</span>
            </div>
            <div>
              <span className="font-label-md text-label-md uppercase tracking-wider text-[#4b6459]">
                Campus Wellbeing Directory
              </span>
              <h3 className="font-title-lg text-title-lg text-[#0c1f18]">
                Confidential Support Services
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

        <div className="overflow-y-auto space-y-3 py-4 pr-1">
          <p className="text-xs text-[#404941] leading-relaxed">
            Calma is a self-reflection tool, not clinical psychiatric treatment. If you feel overwhelmed by academic expectations or emotional exhaustion, the campus provides caring, confidential human advocates.
          </p>

          <div className="space-y-2.5">
            {careResources.map((res) => (
              <div
                key={res.title}
                className="p-3.5 rounded-2xl bg-[#e3f9ec]/60 border border-white hover:bg-[#ddf3e6]/60 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#14532d] text-[20px]">
                      {res.icon}
                    </span>
                    <h4 className="text-xs font-bold text-[#0c1f18]">{res.title}</h4>
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#cde9db] text-[#14532d]">
                    {res.badge}
                  </span>
                </div>
                <p className="text-[11px] text-[#404941] mt-1.5">{res.desc}</p>
                <div className="mt-2 text-[11px] font-mono text-[#003b1b] font-semibold">
                  {res.contact}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-3 border-t border-[#ddf3e6] flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-full text-xs font-semibold text-[#14532d] bg-[#ddf3e6] hover:bg-[#cde9db] transition-colors cursor-pointer"
          >
            Close Directory
          </button>
        </div>
      </div>
    </div>
  );
};
