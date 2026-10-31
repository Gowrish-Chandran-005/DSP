/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ASSETS } from '../data/mockData';
import { UserSession } from '../types';

interface LoginViewProps {
  onLogin: (session: UserSession) => void;
  onExploreDemo?: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLogin, onExploreDemo }) => {
  const [email, setEmail] = useState('maya.lin@campus.edu');
  const [password, setPassword] = useState('StudentCalm2026!');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Field touch tracking for clean validation
  const [touchedEmail, setTouchedEmail] = useState(false);
  const [touchedPassword, setTouchedPassword] = useState(false);

  const isValidEmail = (val: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());
  };

  const isEmailValid = !touchedEmail || isValidEmail(email);
  const isPasswordValid = !touchedPassword || password.length >= 6;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouchedEmail(true);
    setTouchedPassword(true);

    if (!email.trim()) {
      setErrorMsg('Please enter your student or campus email address.');
      return;
    }

    if (!isValidEmail(email)) {
      setErrorMsg('Please enter a valid email format (e.g., student@university.edu).');
      return;
    }

    if (!password || password.length < 6) {
      setErrorMsg('Password must contain at least 6 characters.');
      return;
    }

    setErrorMsg(null);
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      const studentName = email.includes('maya')
        ? 'Maya Lin'
        : email.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

      const session: UserSession = {
        name: studentName,
        email: email.trim(),
        studentId: 'STU-78429',
        term: 'Spring Semester',
        avatarUrl: ASSETS.profile,
      };

      if (rememberMe) {
        try {
          localStorage.setItem('calma_session', JSON.stringify(session));
        } catch {
          // Ignore
        }
      }

      onLogin(session);
    }, 600);
  };

  const handleDemoFill = () => {
    setEmail('maya.lin@campus.edu');
    setPassword('StudentCalm2026!');
    setErrorMsg(null);
    setTouchedEmail(false);
    setTouchedPassword(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-10 px-4 sm:px-6 lg:px-8 relative z-10 selection:bg-[#cde9db] selection:text-[#003b1b]">
      {/* Central Glassmorphic Auth Modal Container */}
      <div className="w-full max-w-4xl bg-white/75 backdrop-blur-[28px] border border-white/90 rounded-[32px] sm:rounded-[40px] shadow-[0_24px_64px_-16px_rgba(20,83,45,0.09)] overflow-hidden transition-all duration-300">
        <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[580px]">
          {/* Left Column: Brand Identity & Values */}
          <div className="lg:col-span-5 p-8 sm:p-10 bg-gradient-to-br from-[#e8fff2]/90 via-[#ddf3e6]/70 to-[#d8f3f0]/80 border-b lg:border-b-0 lg:border-r border-white/70 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-[#b1f2be]/40 blur-3xl pointer-events-none -mr-10 -mt-10"></div>
            <div className="absolute bottom-0 left-0 w-44 h-44 rounded-full bg-[#cde8e5]/50 blur-3xl pointer-events-none -ml-8 -mb-8"></div>

            <div className="relative z-10 space-y-4">
              {/* Brand Logo & Pill */}
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-white/90 backdrop-blur-md border border-white/95 flex items-center justify-center shadow-sm">
                  <img
                    alt="Calma Brand"
                    className="h-6 w-auto object-contain"
                    src={ASSETS.logo}
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      const target = e.currentTarget;
                      target.style.display = 'none';
                      const parent = target.parentElement;
                      if (parent && !parent.querySelector('.logo-fallback')) {
                        const icon = document.createElement('span');
                        icon.className = 'material-symbols-outlined text-[#14532d] text-[22px] logo-fallback';
                        icon.textContent = 'spa';
                        parent.appendChild(icon);
                      }
                    }}
                  />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-base tracking-tight text-[#003b1b]">Calma</span>
                    <span className="w-1 h-1 rounded-full bg-[#14532d]"></span>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-[#4b6459]">Sanctuary</span>
                  </div>
                  <span className="text-[11px] text-[#404941]/80 block font-medium">
                    Student Well-Being &amp; Burnout Early Warning
                  </span>
                </div>
              </div>

              {/* Greenhouse Visual */}
              <div className="pt-2">
                <div className="relative rounded-2xl overflow-hidden border border-white/80 shadow-sm aspect-[16/10] group">
                  <img
                    src={ASSETS.greenhouse}
                    alt="Sanctuary Greenhouse"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#003b1b]/80 via-[#003b1b]/20 to-transparent flex flex-col justify-end p-4 text-white">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#96d5a3]"></span>
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-[#b1f2be]">
                        Self-Awareness First
                      </span>
                    </div>
                    <p className="text-xs text-white/95 mt-0.5 leading-snug font-medium">
                      Notice study exhaustion early and take proactive, gentle steps.
                    </p>
                  </div>
                </div>
              </div>

              {/* Core Principles */}
              <div className="space-y-2.5 pt-2">
                <div className="flex items-center gap-2.5 text-xs text-[#0c1f18] font-medium">
                  <span className="material-symbols-outlined text-[17px] text-[#14532d]">lock_clock</span>
                  <span>100% Private: Never shared with professors or administration</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-[#0c1f18] font-medium">
                  <span className="material-symbols-outlined text-[17px] text-[#14532d]">psychology</span>
                  <span>Trained machine learning models for early risk estimation</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-[#0c1f18] font-medium">
                  <span className="material-symbols-outlined text-[17px] text-[#14532d]">health_and_safety</span>
                  <span>Non-diagnostic tool paired with confidential campus care</span>
                </div>
              </div>
            </div>

            {/* Privacy Footer */}
            <div className="relative z-10 pt-6 mt-6 border-t border-white/70 flex items-center gap-2 text-[#4b6459] text-[11px]">
              <span className="material-symbols-outlined text-[16px] text-[#14532d]">verified_user</span>
              <span>Encrypted local session • Student agency protected</span>
            </div>
          </div>

          {/* Right Column: Authentication Form */}
          <div className="lg:col-span-7 p-8 sm:p-10 flex flex-col justify-between space-y-6">
            <div>
              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#cde9db]/80 text-[#334c42] font-label-md text-[11px] uppercase tracking-wider font-semibold shadow-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#14532d]"></span>
                  Student Portal
                </div>
                <h1 className="font-headline-md text-headline-md text-[#003b1b] tracking-tight">
                  Sign in to Calma
                </h1>
                <p className="text-xs sm:text-sm text-[#404941] leading-relaxed">
                  Enter your student credentials to check your well-being status and review your study habits.
                </p>
              </div>

              {/* Error banner */}
              {errorMsg && (
                <div className="mt-4 p-3 rounded-2xl bg-[#fee2e2] border border-[#fca5a5] text-[#991b1b] text-xs flex items-center gap-2.5 animate-in fade-in duration-200">
                  <span className="material-symbols-outlined text-[18px]">error</span>
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                {/* Email */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-[#0c1f18] uppercase tracking-wider">
                    Student Email Address
                  </label>
                  <div className="relative flex items-center">
                    <span className="material-symbols-outlined absolute left-3.5 text-[#404941]/60 text-[18px] pointer-events-none">
                      mail
                    </span>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (errorMsg) setErrorMsg(null);
                      }}
                      onBlur={() => setTouchedEmail(true)}
                      placeholder="student@university.edu"
                      required
                      className={`w-full h-11 pl-10 pr-4 rounded-2xl bg-[#e3f9ec]/30 border text-xs sm:text-sm text-[#0c1f18] placeholder:text-[#404941]/50 focus:outline-none focus:bg-white transition-all duration-200 ${
                        !isEmailValid
                          ? 'border-[#ba1a1a] focus:border-[#ba1a1a]'
                          : 'border-[#cde9db] focus:border-[#14532d]'
                      }`}
                    />
                  </div>
                  {!isEmailValid && (
                    <span className="text-[11px] text-[#ba1a1a] block pl-1">
                      Please enter a valid email address.
                    </span>
                  )}
                </div>

                {/* Password with Show/Hide */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-[#0c1f18] uppercase tracking-wider">
                      Password
                    </label>
                  </div>
                  <div className="relative flex items-center">
                    <span className="material-symbols-outlined absolute left-3.5 text-[#404941]/60 text-[18px] pointer-events-none">
                      lock
                    </span>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (errorMsg) setErrorMsg(null);
                      }}
                      onBlur={() => setTouchedPassword(true)}
                      placeholder="••••••••••••"
                      required
                      className={`w-full h-11 pl-10 pr-11 rounded-2xl bg-[#e3f9ec]/30 border text-xs sm:text-sm text-[#0c1f18] placeholder:text-[#404941]/50 focus:outline-none focus:bg-white transition-all duration-200 ${
                        !isPasswordValid
                          ? 'border-[#ba1a1a] focus:border-[#ba1a1a]'
                          : 'border-[#cde9db] focus:border-[#14532d]'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 text-[#404941]/60 hover:text-[#0c1f18] p-1 cursor-pointer"
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        {showPassword ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Remember & Demo Fill */}
                <div className="flex items-center justify-between pt-1 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer text-[#404941]">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded border-[#c0c9be] text-[#14532d] focus:ring-[#14532d]"
                    />
                    <span>Remember on this device</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleDemoFill}
                    className="text-[#14532d] font-semibold hover:underline cursor-pointer"
                  >
                    Fill sample student credentials
                  </button>
                </div>

                {/* Submit button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-12 rounded-full bg-[#14532d] hover:bg-[#003b1b] text-white font-semibold text-xs sm:text-sm shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
                  >
                    {isLoading ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white/60 border-t-white rounded-full animate-spin"></span>
                        <span>Verifying Student Session...</span>
                      </>
                    ) : (
                      <>
                        <span>Sign In</span>
                        <span className="material-symbols-outlined text-[17px]">arrow_forward</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Quick Demo Exploration Pill */}
            <div className="pt-6 border-t border-[#ddf3e6] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#404941]">
              <span>Testing without an account?</span>
              <button
                type="button"
                onClick={onExploreDemo}
                className="px-4 py-1.5 rounded-full bg-[#ddf3e6] hover:bg-[#cde9db] text-[#14532d] font-semibold transition-colors cursor-pointer"
              >
                Explore Demo Dashboard →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
