/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ViewMode } from '../types';
import { ASSETS } from '../data/mockData';

interface NavigationProps {
  currentView: ViewMode;
  onNavigate: (view: ViewMode) => void;
  onOpenHelp: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentView,
  onNavigate,
  onOpenHelp,
}) => {
  const navItems: { id: ViewMode; label: string; icon: string }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: 'cottage' },
    { id: 'assessment', label: 'Check-In Assessment', icon: 'assignment_turned_in' },
    { id: 'focus-monitor', label: 'Study Focus Monitor', icon: 'videocam' },
    { id: 'insights', label: 'Influencing Factors', icon: 'lightbulb' },
    { id: 'trends', label: 'Your Progress Over Time', icon: 'query_stats' },
    { id: 'emotion-lab', label: 'Face Emotion Study (Lab)', icon: 'visibility' },
    { id: 'history', label: 'Assessment History', icon: 'schedule' },
    { id: 'profile', label: 'Student Profile', icon: 'person' },
    { id: 'settings', label: 'Settings & Privacy', icon: 'tune' },
  ];

  return (
    <aside className="fixed left-6 top-6 bottom-6 w-14 z-50 flex flex-col items-center justify-between pointer-events-auto">
      <div className="flex flex-col items-center gap-3">
        {/* Brand Logo */}
        <button
          onClick={() => onNavigate('dashboard')}
          title="Calma Home"
          className="w-14 h-14 rounded-full bg-white/65 backdrop-blur-[20px] border border-white/75 flex items-center justify-center shadow-[0_12px_32px_-8px_rgba(20,83,45,0.06)] hover:shadow-[0_20px_40px_-12px_rgba(20,83,45,0.1)] transition-all duration-300 mb-1 cursor-pointer"
        >
          <img
            alt="Calma Logo"
            className="h-8 w-auto object-contain"
            src={ASSETS.logo}
            referrerPolicy="no-referrer"
            onError={(e) => {
              const target = e.currentTarget;
              target.style.display = 'none';
              const parent = target.parentElement;
              if (parent && !parent.querySelector('.logo-fallback')) {
                const icon = document.createElement('span');
                icon.className = 'material-symbols-outlined text-[#14532D] text-[24px] logo-fallback';
                icon.textContent = 'spa';
                parent.appendChild(icon);
              }
            }}
          />
        </button>

        {/* Primary Navigation Rail */}
        <nav className="flex flex-col items-center gap-2.5">
          {navItems.map((item) => {
            const isActive = currentView === item.id;
            return (
              <div key={item.id} className="relative group">
                <button
                  onClick={() => onNavigate(item.id)}
                  className={`w-12 h-12 md:w-14 md:h-14 rounded-full backdrop-blur-[20px] border transition-all duration-300 flex items-center justify-center cursor-pointer ${
                    isActive
                      ? 'bg-[#14532D] text-white border-[#14532D] shadow-[0_12px_32px_-8px_rgba(20,83,45,0.28)]'
                      : 'bg-white/65 border-white/75 text-[#404941] hover:bg-white/85 hover:text-[#0c1f18] shadow-[0_4px_12px_-2px_rgba(20,83,45,0.03)]'
                  }`}
                  aria-label={item.label}
                >
                  <span className="material-symbols-outlined text-[21px] md:text-[22px]">{item.icon}</span>
                </button>
                <span className="absolute left-full ml-3 px-3 py-1.5 rounded-full bg-white/90 backdrop-blur-[20px] border border-white/75 text-[#0c1f18] text-[11px] font-semibold opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap shadow-[0_12px_32px_-8px_rgba(20,83,45,0.08)] top-1/2 -translate-y-1/2 z-50">
                  {item.label}
                </span>
              </div>
            );
          })}
        </nav>
      </div>

      {/* Help / Safeguard */}
      <div className="flex flex-col items-center gap-3">
        <div className="relative group">
          <button
            onClick={onOpenHelp}
            className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-white/65 backdrop-blur-[20px] border border-white/75 text-[#404941] flex items-center justify-center hover:bg-white/85 hover:text-[#0c1f18] transition-all duration-300 shadow-[0_4px_12px_-2px_rgba(20,83,45,0.03)] cursor-pointer"
            aria-label="Campus Care & Support Directory"
          >
            <span className="material-symbols-outlined text-[20px]">help_outline</span>
          </button>
          <span className="absolute left-full ml-3 px-3 py-1.5 rounded-full bg-white/90 backdrop-blur-[20px] border border-white/75 text-[#0c1f18] text-[11px] font-semibold opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap shadow-[0_12px_32px_-8px_rgba(20,83,45,0.08)] top-1/2 -translate-y-1/2 z-50">
            Campus Care &amp; Support Directory
          </span>
        </div>
      </div>
    </aside>
  );
};
