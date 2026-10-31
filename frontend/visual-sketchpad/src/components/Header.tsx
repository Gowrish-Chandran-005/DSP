/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ASSETS } from '../data/mockData';
import { UserSession } from '../types';

interface HeaderProps {
  onOpenSettings: () => void;
  onOpenProfile: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  user?: UserSession | null;
  onLogout?: () => void;
  backendOnline?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenSettings,
  onOpenProfile,
  searchQuery,
  onSearchChange,
  user,
  onLogout,
  backendOnline = false,
}) => {
  const [showNotifications, setShowNotifications] = useState(false);

  const notifications = [
    {
      id: 1,
      time: 'Today',
      title: 'Weekly Check-in Recommended',
      desc: 'Logging your habits once a week helps spot study fatigue before it builds up.',
      icon: 'assignment_turned_in',
    },
    {
      id: 2,
      time: 'Yesterday',
      title: 'Study Break Tip',
      desc: 'Short 5-minute movement pauses between 50-minute study sessions improve retention.',
      icon: 'self_improvement',
    },
    {
      id: 3,
      time: 'Earlier',
      title: 'Sleep & Focus Balance',
      desc: 'Aiming for 7+ hours of sleep significantly improves problem-solving stamina.',
      icon: 'bedtime',
    },
  ];

  return (
    <header className="fixed top-6 left-28 right-6 md:right-10 h-16 z-40 flex items-center justify-between gap-6 bg-white/70 backdrop-blur-[24px] border border-white/80 rounded-[28px] px-6 lg:px-8 shadow-[0_12px_32px_-8px_rgba(20,83,45,0.05)]">
      {/* Title */}
      <div className="flex items-center gap-3 shrink-0">
        <span className="font-headline-md text-headline-md text-[#0c1f18] tracking-tight">
          Good day, {user?.name ? user.name.split(' ')[0] : 'Student'}
        </span>
        {/* Backend connectivity indicator */}
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
            backendOnline
              ? 'bg-[#ddf3e6] text-[#14532d] border-[#b1f2be]'
              : 'bg-[#fef3c7] text-[#92400e] border-[#fde68a]'
          }`}
          title={
            backendOnline
              ? 'Connected to local ML inference backend (port 5000)'
              : 'Backend offline: Running in client preview mode'
          }
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              backendOnline ? 'bg-[#14532d] animate-pulse' : 'bg-[#d97706]'
            }`}
          ></span>
          {backendOnline ? 'Live ML Backend' : 'Offline Preview'}
        </span>
      </div>

      {/* Central Search */}
      <div className="flex-1 max-w-lg mx-auto px-4 hidden md:block">
        <div className="relative flex items-center">
          <span className="material-symbols-outlined absolute left-3.5 text-[#404941]/60 text-[18px]">
            search
          </span>
          <input
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full h-10 pl-10 pr-5 rounded-full bg-white/55 border border-white/80 backdrop-blur-[16px] text-[#0c1f18] placeholder:text-[#404941]/55 text-xs focus:outline-none focus:bg-white/85 focus:border-[#CFEBDD] shadow-[0_2px_8px_-2px_rgba(20,83,45,0.03)] transition-all duration-300"
            placeholder="Search assessments, habits, recommendations..."
            type="text"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 text-[#404941]/60 hover:text-[#0c1f18] p-1 text-xs cursor-pointer"
            >
              <span className="material-symbols-outlined text-[15px]">close</span>
            </button>
          )}
        </div>
      </div>

      {/* Actions Lockup */}
      <div className="flex items-center gap-3 relative shrink-0">
        <div className="flex items-center gap-1.5 p-1.5 rounded-full bg-white/80 border border-white/90 backdrop-blur-[20px] shadow-[0_4px_16px_-4px_rgba(20,83,45,0.05)]">
          {/* Notifications Button */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative w-9 h-9 rounded-full flex items-center justify-center text-[#404941] hover:bg-[#d7ede1] hover:text-[#0c1f18] transition-all duration-200 cursor-pointer"
              type="button"
              aria-label="Notifications"
            >
              <span className="material-symbols-outlined text-[19px]">notifications</span>
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#14532d] ring-2 ring-white"></span>
            </button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-3 w-80 bg-white/95 backdrop-blur-2xl rounded-2xl border border-white shadow-xl p-4 z-50 animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between pb-3 border-b border-[#ddf3e6] mb-3">
                  <span className="text-xs font-bold text-[#0c1f18]">Study &amp; Well-being Reminders</span>
                  <button
                    onClick={() => setShowNotifications(false)}
                    className="text-[10px] text-[#14532d] font-semibold hover:underline"
                  >
                    Close
                  </button>
                </div>
                <div className="space-y-3">
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-[#e3f9ec]/60 transition-colors"
                    >
                      <div className="w-8 h-8 rounded-full bg-[#ddf3e6] text-[#14532d] flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-[16px]">{n.icon}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-semibold text-[#0c1f18] truncate">{n.title}</p>
                          <span className="text-[10px] text-[#404941]/60 shrink-0 ml-1">{n.time}</span>
                        </div>
                        <p className="text-[11px] text-[#404941] leading-tight mt-0.5">{n.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Settings Button */}
          <button
            onClick={onOpenSettings}
            className="w-9 h-9 rounded-full flex items-center justify-center text-[#404941] hover:bg-[#d7ede1] hover:text-[#0c1f18] transition-all duration-200 cursor-pointer"
            type="button"
            aria-label="Settings"
          >
            <span className="material-symbols-outlined text-[19px]">tune</span>
          </button>
        </div>

        {/* User Profile Avatar with Logout */}
        <div className="flex items-center gap-2 pl-1">
          <button
            onClick={onOpenProfile}
            className="w-10 h-10 rounded-full border-2 border-white shadow-sm overflow-hidden hover:opacity-90 transition-opacity cursor-pointer bg-[#d7ede1] flex items-center justify-center"
            title={user?.email || 'Student Profile'}
          >
            <img
              alt={user?.name || 'Student Avatar'}
              className="w-full h-full object-cover"
              src={user?.avatarUrl || ASSETS.profile}
              referrerPolicy="no-referrer"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
            <span className="material-symbols-outlined text-[#14532d] text-[20px] select-none">
              person
            </span>
          </button>
          {onLogout && (
            <button
              onClick={onLogout}
              title="Sign Out"
              className="w-9 h-9 rounded-full text-[#404941] hover:text-[#b91c1c] hover:bg-[#fee2e2]/60 flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Sign Out"
            >
              <span className="material-symbols-outlined text-[18px]">logout</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
