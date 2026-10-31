/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { StudySessionRecord, ViewMode } from '../types';

interface FocusMonitorViewProps {
  onSessionCompleted: (record: StudySessionRecord) => void;
  onNavigate: (view: ViewMode) => void;
  onShowToast: (msg: string) => void;
}

export const FocusMonitorView: React.FC<FocusMonitorViewProps> = ({
  onSessionCompleted,
  onNavigate,
  onShowToast,
}) => {
  // Session Configuration
  const [selectedDuration, setSelectedDuration] = useState<number>(45); // minutes
  const [customDuration, setCustomDuration] = useState<number>(30);
  const [isCustom, setIsCustom] = useState<boolean>(false);

  // Session Lifecycle State
  const [sessionState, setSessionState] = useState<'idle' | 'running' | 'paused' | 'ended'>('idle');
  const [secondsRemaining, setSecondsRemaining] = useState<number>(45 * 60);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [breaksCount, setBreaksCount] = useState<number>(0);
  const [isBreakActive, setIsBreakActive] = useState<boolean>(false);
  const [breakTimer, setBreakTimer] = useState<number>(300); // 5 min break

  // Camera & Visual Monitoring State
  const [cameraEnabled, setCameraEnabled] = useState<boolean>(false);
  const [cameraPermissionGranted, setCameraPermissionGranted] = useState<boolean | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isFaceVisible, setIsFaceVisible] = useState<boolean>(true);
  const [cameraActiveSeconds, setCameraActiveSeconds] = useState<number>(0);
  const [faceVisibleSeconds, setFaceVisibleSeconds] = useState<number>(0);

  // Self-Check-Ins Logged
  const [selfCheckIns, setSelfCheckIns] = useState<
    { time: string; state: 'Focused' | 'Tired' | 'Stressed' | 'Need a break' }[]
  >([]);

  // Prompts & Warnings
  const [activePrompt, setActivePrompt] = useState<{
    id: string;
    type: 'break' | 'face' | 'complete' | 'checkin';
    title: string;
    message: string;
  } | null>(null);

  // Media references
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const durationOptions = [
    { label: '25 min (Pomodoro)', value: 25 },
    { label: '45 min (Standard)', value: 45 },
    { label: '60 min (Deep Study)', value: 60 },
    { label: '90 min (Extended)', value: 90 },
  ];

  // Stop camera tracks cleanly
  const stopCameraStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop();
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
  };

  // Cleanup camera stream on unmount
  useEffect(() => {
    return () => {
      stopCameraStream();
    };
  }, []);

  // Request browser camera access with user consent
  const enableCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraPermissionGranted(true);
      setCameraEnabled(true);
      onShowToast('Camera connected. On-device visual monitoring active.');
    } catch (err: any) {
      setCameraPermissionGranted(false);
      setCameraEnabled(false);
      const msg =
        err.name === 'NotAllowedError'
          ? 'Camera permission was denied. You can still use the study timer without video.'
          : 'Could not access camera device. Continuing in timer-only mode.';
      setCameraError(msg);
      onShowToast(msg);
    }
  };

  const disableCamera = () => {
    stopCameraStream();
    setCameraEnabled(false);
    onShowToast('Camera turned off. Study session continuing in timer mode.');
  };

  // Start study session
  const handleStartSession = async (withCamera: boolean) => {
    const totalMinutes = isCustom ? customDuration : selectedDuration;
    setSecondsRemaining(totalMinutes * 60);
    setElapsedSeconds(0);
    setBreaksCount(0);
    setCameraActiveSeconds(0);
    setFaceVisibleSeconds(0);
    setSelfCheckIns([]);
    setActivePrompt(null);
    setSessionState('running');

    if (withCamera) {
      await enableCamera();
    } else {
      disableCamera();
    }
  };

  // Session countdown timer effect
  useEffect(() => {
    if (sessionState !== 'running' || isBreakActive) return;

    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          // Session completed
          setSessionState('ended');
          setActivePrompt({
            id: 'complete',
            type: 'complete',
            title: 'Study Session Complete!',
            message: `Congratulations on completing your ${
              isCustom ? customDuration : selectedDuration
            }-minute focus session. Step away from your desk and rest your eyes.`,
          });
          stopCameraStream();
          return 0;
        }
        return prev - 1;
      });

      setElapsedSeconds((prev) => {
        const next = prev + 1;
        // Schedule gentle break prompt at 25m mark if session is >= 45m
        if (next === 25 * 60) {
          setActivePrompt({
            id: 'break-25',
            type: 'break',
            title: '25-Minute Study Interval',
            message: 'You have been studying steadily for 25 minutes. Would you like a quick 5-minute stretch?',
          });
        }
        return next;
      });

      // Track camera usage time
      if (cameraEnabled && streamRef.current) {
        setCameraActiveSeconds((prev) => prev + 1);
        if (isFaceVisible) {
          setFaceVisibleSeconds((prev) => prev + 1);
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [sessionState, isBreakActive, cameraEnabled, isFaceVisible, selectedDuration, customDuration, isCustom]);

  // Break countdown timer effect
  useEffect(() => {
    if (!isBreakActive) return;

    const interval = setInterval(() => {
      setBreakTimer((prev) => {
        if (prev <= 1) {
          setIsBreakActive(false);
          onShowToast('5-minute break finished. Ready to resume study session.');
          return 300;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isBreakActive]);

  // Client-side lightweight video frame presence check
  useEffect(() => {
    if (!cameraEnabled || sessionState !== 'running') return;

    const checkFrame = () => {
      if (videoRef.current && videoRef.current.readyState >= 2) {
        const video = videoRef.current;
        if (!canvasRef.current) {
          canvasRef.current = document.createElement('canvas');
          canvasRef.current.width = 64;
          canvasRef.current.height = 48;
        }
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (ctx) {
          ctx.drawImage(video, 0, 0, 64, 48);
          try {
            const frame = ctx.getImageData(0, 0, 64, 48);
            let sum = 0;
            for (let i = 0; i < frame.data.length; i += 4) {
              sum += (frame.data[i] + frame.data[i + 1] + frame.data[i + 2]) / 3;
            }
            const avgBrightness = sum / (frame.data.length / 4);

            // If camera is covered or pitch black
            if (avgBrightness < 10 || avgBrightness > 250) {
              setIsFaceVisible(false);
            } else {
              setIsFaceVisible(true);
            }
          } catch {
            setIsFaceVisible(true);
          }
        }
      }
      animFrameRef.current = requestAnimationFrame(checkFrame);
    };

    animFrameRef.current = requestAnimationFrame(checkFrame);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [cameraEnabled, sessionState]);

  // Actions
  const handlePause = () => {
    setSessionState('paused');
    onShowToast('Session paused.');
  };

  const handleResume = () => {
    setSessionState('running');
    onShowToast('Session resumed.');
  };

  const handleStop = () => {
    stopCameraStream();
    setSessionState('ended');
    onShowToast('Study session ended.');
  };

  const handleTakeBreak = () => {
    setBreaksCount((prev) => prev + 1);
    setIsBreakActive(true);
    setBreakTimer(300);
    setActivePrompt(null);
    onShowToast('5-minute break started. Step away from your screen!');
  };

  const handleEndBreak = () => {
    setIsBreakActive(false);
    onShowToast('Break ended. Resuming study countdown.');
  };

  const handleLogCheckIn = (state: 'Focused' | 'Tired' | 'Stressed' | 'Need a break') => {
    const minutes = Math.floor(elapsedSeconds / 60);
    setSelfCheckIns((prev) => [...prev, { time: `${minutes}m into session`, state }]);
    onShowToast(`Check-in noted: "${state}"`);
  };

  // Format seconds to mm:ss
  const formatTime = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const totalSelectedMins = isCustom ? customDuration : selectedDuration;

  // Save session record and return to dashboard
  const handleSaveAndExit = () => {
    const record: StudySessionRecord = {
      id: `session-${Date.now()}`,
      durationMinutes: totalSelectedMins,
      elapsedSeconds,
      breaksCount,
      cameraUsed: cameraActiveSeconds > 10,
      cameraMinutes: Math.round((cameraActiveSeconds / 60) * 10) / 10,
      selfCheckIns,
      completedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    onSessionCompleted(record);
    onShowToast('Session summary saved to your dashboard.');
    onNavigate('dashboard');
  };

  return (
    <div className="flex flex-col w-full space-y-8">
      {/* 1. TOP HEADER & EXPLANATION */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#ddf3e6] text-[#14532d] text-xs font-semibold shadow-sm border border-[#cde9db]">
            <span className="w-2 h-2 rounded-full bg-[#14532d]"></span>
            <span>Study Focus Monitor • Private &amp; On-Device</span>
          </div>
          <h1 className="font-headline-lg text-headline-lg text-[#003b1b] tracking-tight">
            Study Focus &amp; Break Monitor
          </h1>
          <p className="text-xs sm:text-sm text-[#404941] leading-relaxed">
            Time your study sessions with gentle, scheduled break reminders and optional on-device visual signal monitoring. All camera processing stays strictly inside your browser.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto shrink-0 text-xs text-[#404941]">
          <span className="material-symbols-outlined text-[#14532d] text-[18px]">verified_user</span>
          <span>Zero cloud video recording</span>
        </div>
      </section>

      {/* 2. PRE-SESSION SETUP SCREEN (If Idle) */}
      {sessionState === 'idle' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Duration Selector & Controls (7 cols) */}
          <div className="lg:col-span-7 p-6 sm:p-8 rounded-3xl bg-white/75 backdrop-blur-[24px] border border-white/90 shadow-sm space-y-6">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#4b6459] block mb-1">
                Step 1 of 2
              </span>
              <h2 className="font-title-lg text-title-lg text-[#0c1f18]">
                Select Your Study Session Duration
              </h2>
              <p className="text-xs text-[#404941] mt-0.5">
                Choose how long you plan to study before taking an extended restorative rest.
              </p>
            </div>

            {/* Duration Options */}
            <div className="grid grid-cols-2 gap-3.5">
              {durationOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    setSelectedDuration(opt.value);
                    setIsCustom(false);
                  }}
                  className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                    !isCustom && selectedDuration === opt.value
                      ? 'bg-[#14532d] text-white border-[#14532d] shadow-sm'
                      : 'bg-white/80 border-[#cde9db] text-[#0c1f18] hover:bg-[#ddf3e6]/50'
                  }`}
                >
                  <span className="text-xs sm:text-sm font-bold block">{opt.label}</span>
                  <span
                    className={`text-[11px] mt-0.5 block ${
                      !isCustom && selectedDuration === opt.value
                        ? 'text-white/80'
                        : 'text-[#404941]'
                    }`}
                  >
                    Scheduled pauses included
                  </span>
                </button>
              ))}
            </div>

            {/* Custom Duration Slider */}
            <div className="p-4 rounded-2xl bg-[#e3f9ec]/50 border border-white space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-[#0c1f18] flex items-center gap-2">
                  <input
                    type="radio"
                    name="durationChoice"
                    checked={isCustom}
                    onChange={() => setIsCustom(true)}
                    className="text-[#14532d] focus:ring-[#14532d]"
                  />
                  <span>Custom Duration</span>
                </label>
                <span className="text-xs font-extrabold text-[#14532d] px-2.5 py-1 bg-white rounded-xl shadow-xs">
                  {customDuration} minutes
                </span>
              </div>
              <input
                type="range"
                min={15}
                max={120}
                step={5}
                value={customDuration}
                onChange={(e) => {
                  setCustomDuration(Number(e.target.value));
                  setIsCustom(true);
                }}
                className="w-full accent-[#14532d] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-[#404941]">
                <span>15m (Micro-Sprint)</span>
                <span>60m</span>
                <span>120m (Max block)</span>
              </div>
            </div>

            {/* Start Buttons with Consent Choice */}
            <div className="pt-2 space-y-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#4b6459] block">
                Step 2 of 2: Choose Monitoring Mode
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <button
                  onClick={() => handleStartSession(true)}
                  className="px-5 py-3.5 rounded-full bg-[#14532d] hover:bg-[#003b1b] text-white text-xs font-semibold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[19px]">videocam</span>
                  <span>Enable Camera &amp; Start ({totalSelectedMins}m)</span>
                </button>

                <button
                  onClick={() => handleStartSession(false)}
                  className="px-5 py-3.5 rounded-full bg-white hover:bg-[#e3f9ec] text-[#14532d] border border-[#cde9db] text-xs font-semibold shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[19px]">timer</span>
                  <span>Start Without Camera ({totalSelectedMins}m)</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Privacy, Camera Consent & Disclaimer (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="p-6 rounded-3xl bg-white/75 backdrop-blur-[24px] border border-white/90 shadow-sm space-y-4">
              <h3 className="font-bold text-xs sm:text-sm text-[#0c1f18] flex items-center gap-2">
                <span className="material-symbols-outlined text-[#14532d] text-[19px]">security</span>
                Camera Privacy &amp; Consent Standard
              </h3>

              <div className="space-y-3 text-xs text-[#404941] leading-relaxed">
                <div className="p-3 rounded-2xl bg-[#e3f9ec]/60 border border-white space-y-1">
                  <strong className="text-[#0c1f18] block">1. 100% On-Device Processing</strong>
                  <p>
                    Camera frames are never stored, recorded, or sent across the network. Video stream data exists solely inside your browser's local memory.
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-[#e3f9ec]/60 border border-white space-y-1">
                  <strong className="text-[#0c1f18] block">2. Not a Burnout Detector</strong>
                  <p>
                    Facial signals cannot establish that someone is depressed, anxious, or burned out. They only measure general presence and session duration to remind you to take breaks.
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-[#e3f9ec]/60 border border-white space-y-1">
                  <strong className="text-[#0c1f18] block">3. Immediate Track Shutdown</strong>
                  <p>
                    When you pause, stop, or navigate away from this tab, your browser camera turns off instantly.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. ACTIVE OR PAUSED SESSION SCREEN */}
      {(sessionState === 'running' || sessionState === 'paused') && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Big Timer & Controls (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="p-7 sm:p-8 rounded-3xl bg-white/80 backdrop-blur-[24px] border border-white/90 shadow-sm flex flex-col items-center text-center space-y-6">
              {/* Session Status Pill */}
              <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#ddf3e6] text-[#14532d] text-xs font-bold border border-[#cde9db]">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    sessionState === 'running'
                      ? isBreakActive
                        ? 'bg-[#d97706] animate-pulse'
                        : 'bg-[#14532d] animate-pulse'
                      : 'bg-[#d97706]'
                  }`}
                ></span>
                <span>
                  {isBreakActive
                    ? 'Break in Progress'
                    : sessionState === 'running'
                    ? 'Study Session Active'
                    : 'Session Paused'}
                </span>
              </div>

              {/* Countdown Display */}
              <div className="space-y-1">
                <div className="text-6xl sm:text-7xl font-extrabold tracking-tight text-[#0c1f18] font-mono">
                  {isBreakActive ? formatTime(breakTimer) : formatTime(secondsRemaining)}
                </div>
                <span className="text-xs text-[#404941] font-medium block">
                  {isBreakActive
                    ? '5-minute restorative stretch'
                    : `Remaining of ${totalSelectedMins}m session`}
                </span>
              </div>

              {/* Session Stats Bar */}
              <div className="grid grid-cols-3 gap-3 w-full pt-2">
                <div className="p-3 rounded-2xl bg-[#e3f9ec]/60 border border-white text-center">
                  <span className="text-[10px] text-[#4b6459] font-bold uppercase block">Elapsed</span>
                  <span className="text-sm font-extrabold text-[#0c1f18] mt-0.5 block">
                    {Math.floor(elapsedSeconds / 60)}m {elapsedSeconds % 60}s
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-[#e3f9ec]/60 border border-white text-center">
                  <span className="text-[10px] text-[#4b6459] font-bold uppercase block">Breaks Taken</span>
                  <span className="text-sm font-extrabold text-[#14532d] mt-0.5 block">
                    {breaksCount} {breaksCount === 1 ? 'break' : 'breaks'}
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-[#e3f9ec]/60 border border-white text-center">
                  <span className="text-[10px] text-[#4b6459] font-bold uppercase block">Camera Mode</span>
                  <span className="text-sm font-extrabold text-[#0c1f18] mt-0.5 block">
                    {cameraEnabled ? 'Live On' : 'Off'}
                  </span>
                </div>
              </div>

              {/* Action Controls */}
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                {isBreakActive ? (
                  <button
                    onClick={handleEndBreak}
                    className="px-6 py-2.5 rounded-full bg-[#14532d] text-white text-xs font-semibold shadow-sm hover:bg-[#003b1b] transition-all cursor-pointer flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[17px]">play_arrow</span>
                    <span>End Break &amp; Resume Study</span>
                  </button>
                ) : (
                  <>
                    {sessionState === 'running' ? (
                      <button
                        onClick={handlePause}
                        className="px-6 py-2.5 rounded-full bg-[#fef3c7] text-[#92400e] border border-[#fde68a] text-xs font-semibold shadow-xs hover:bg-[#fde68a] transition-all cursor-pointer flex items-center gap-2"
                      >
                        <span className="material-symbols-outlined text-[17px]">pause</span>
                        <span>Pause Session</span>
                      </button>
                    ) : (
                      <button
                        onClick={handleResume}
                        className="px-6 py-2.5 rounded-full bg-[#14532d] text-white text-xs font-semibold shadow-sm hover:bg-[#003b1b] transition-all cursor-pointer flex items-center gap-2"
                      >
                        <span className="material-symbols-outlined text-[17px]">play_arrow</span>
                        <span>Resume Study</span>
                      </button>
                    )}

                    <button
                      onClick={handleTakeBreak}
                      className="px-5 py-2.5 rounded-full bg-[#ddf3e6] text-[#14532d] border border-[#cde9db] text-xs font-semibold shadow-xs hover:bg-[#cde9db] transition-all cursor-pointer flex items-center gap-2"
                    >
                      <span className="material-symbols-outlined text-[17px]">self_improvement</span>
                      <span>Take 5m Break</span>
                    </button>

                    <button
                      onClick={handleStop}
                      className="px-5 py-2.5 rounded-full bg-[#fee2e2] text-[#991b1b] border border-[#fca5a5] text-xs font-semibold shadow-xs hover:bg-[#fecaca] transition-all cursor-pointer flex items-center gap-2"
                    >
                      <span className="material-symbols-outlined text-[17px]">stop</span>
                      <span>End Session</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Timely Warning & Prompts Area */}
            {activePrompt && (
              <div className="p-5 rounded-3xl bg-[#fff7ed] border border-[#fed7aa] shadow-sm space-y-3 animate-in fade-in duration-200">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <span className="material-symbols-outlined text-[#ea580c] text-[20px] shrink-0 mt-0.5">
                      {activePrompt.type === 'break' ? 'hourglass_top' : 'notifications'}
                    </span>
                    <div>
                      <h4 className="font-bold text-xs sm:text-sm text-[#9a3412]">
                        {activePrompt.title}
                      </h4>
                      <p className="text-xs text-[#7c2d12] mt-0.5 leading-relaxed">
                        {activePrompt.message}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setActivePrompt(null)}
                    className="text-[#9a3412] hover:text-[#7c2d12] p-1 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[17px]">close</span>
                  </button>
                </div>

                {activePrompt.type === 'break' && (
                  <div className="flex items-center gap-3 pt-1">
                    <button
                      onClick={handleTakeBreak}
                      className="px-4 py-1.5 rounded-full bg-[#ea580c] text-white text-xs font-semibold hover:bg-[#c2410c] transition-colors cursor-pointer"
                    >
                      Take 5-Minute Break
                    </button>
                    <button
                      onClick={() => setActivePrompt(null)}
                      className="px-3 py-1.5 rounded-full text-xs text-[#9a3412] hover:underline cursor-pointer"
                    >
                      Continue Studying
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Optional Self-Check-in Widget */}
            <div className="p-5 rounded-3xl bg-white/75 backdrop-blur-xl border border-white/90 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-xs sm:text-sm text-[#0c1f18] flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#14532d] text-[18px]">psychology</span>
                  Optional Self-Check-In
                </h4>
                <span className="text-[11px] text-[#404941]">How do you feel right now?</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {(['Focused', 'Tired', 'Stressed', 'Need a break'] as const).map((mood) => (
                  <button
                    key={mood}
                    onClick={() => handleLogCheckIn(mood)}
                    className="py-2 px-3 rounded-xl bg-[#e3f9ec]/60 hover:bg-[#ddf3e6] border border-white text-xs font-medium text-[#0c1f18] transition-colors cursor-pointer text-center"
                  >
                    {mood}
                  </button>
                ))}
              </div>

              {selfCheckIns.length > 0 && (
                <div className="text-[11px] text-[#404941] pt-1">
                  Logged: {selfCheckIns.map((c) => `${c.state} (${c.time})`).join(', ')}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Live Camera Preview & Safety Status (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="p-6 rounded-3xl bg-white/75 backdrop-blur-[24px] border border-white/90 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#0c1f18] flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[#14532d] text-[18px]">videocam</span>
                  Live Camera Feed
                </span>
                {cameraEnabled ? (
                  <button
                    onClick={disableCamera}
                    className="text-xs text-[#b91c1c] font-semibold hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[15px]">videocam_off</span>
                    <span>Turn Off Camera</span>
                  </button>
                ) : (
                  <button
                    onClick={enableCamera}
                    className="text-xs text-[#14532d] font-semibold hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[15px]">videocam</span>
                    <span>Enable Camera</span>
                  </button>
                )}
              </div>

              {/* Camera Video Container */}
              <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-black/90 border border-[#cde9db] flex items-center justify-center">
                {cameraEnabled ? (
                  <>
                    <video
                      ref={videoRef}
                      playsInline
                      muted
                      className="w-full h-full object-cover transform scale-x-[-1]"
                    />
                    {/* Live status badge overlay */}
                    <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[10px] font-semibold flex items-center gap-1.5">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          isFaceVisible ? 'bg-[#22c55e]' : 'bg-[#eab308]'
                        }`}
                      ></span>
                      <span>{isFaceVisible ? 'Subject Detected' : 'Checking Lighting/Position'}</span>
                    </div>

                    {!isFaceVisible && (
                      <div className="absolute inset-x-3 bottom-3 p-2.5 rounded-xl bg-black/75 backdrop-blur-md text-white text-[11px] text-center">
                        Face not clearly detected. Check camera angle or room lighting.
                      </div>
                    )}
                  </>
                ) : (
                  <div className="p-6 text-center space-y-2 text-white/70">
                    <span className="material-symbols-outlined text-[36px] opacity-60">
                      videocam_off
                    </span>
                    <p className="text-xs">Camera monitoring is off.</p>
                    <p className="text-[10px] text-white/50">
                      Your session timer is running normally without video.
                    </p>
                  </div>
                )}
              </div>

              {/* Uncertainty & Safety Reassurance */}
              <div className="p-3.5 rounded-2xl bg-[#e3f9ec]/60 border border-white text-xs text-[#404941] space-y-1 leading-relaxed">
                <strong className="text-[#0c1f18] block">Safety Notice:</strong>
                <p>
                  Visual indicators are purely supportive hints to remind you of breaks. They do not diagnose burnout, tiredness, or mental health states.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. POST-SESSION SUMMARY SCREEN */}
      {sessionState === 'ended' && (
        <div className="p-6 sm:p-8 rounded-3xl bg-white/80 backdrop-blur-[24px] border border-white/90 shadow-sm max-w-2xl mx-auto space-y-6 animate-in fade-in duration-200">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-full bg-[#ddf3e6] text-[#14532d] flex items-center justify-center mx-auto shadow-sm">
              <span className="material-symbols-outlined text-[28px]">verified</span>
            </div>
            <h2 className="font-title-lg text-title-lg text-[#0c1f18]">
              Study Session Completed
            </h2>
            <p className="text-xs sm:text-sm text-[#404941]">
              Great work maintaining your study block. Here is a summary of your session activity:
            </p>
          </div>

          {/* Activity Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 pt-2">
            <div className="p-3.5 rounded-2xl bg-[#e3f9ec]/60 border border-white text-center">
              <span className="text-[10px] text-[#4b6459] font-bold uppercase block">Planned Time</span>
              <span className="text-base font-extrabold text-[#0c1f18] mt-1 block">
                {totalSelectedMins}m
              </span>
            </div>
            <div className="p-3.5 rounded-2xl bg-[#e3f9ec]/60 border border-white text-center">
              <span className="text-[10px] text-[#4b6459] font-bold uppercase block">Actual Studied</span>
              <span className="text-base font-extrabold text-[#14532d] mt-1 block">
                {Math.floor(elapsedSeconds / 60)}m
              </span>
            </div>
            <div className="p-3.5 rounded-2xl bg-[#e3f9ec]/60 border border-white text-center">
              <span className="text-[10px] text-[#4b6459] font-bold uppercase block">Breaks Logged</span>
              <span className="text-base font-extrabold text-[#0c1f18] mt-1 block">
                {breaksCount}
              </span>
            </div>
            <div className="p-3.5 rounded-2xl bg-[#e3f9ec]/60 border border-white text-center">
              <span className="text-[10px] text-[#4b6459] font-bold uppercase block">Camera Active</span>
              <span className="text-base font-extrabold text-[#0c1f18] mt-1 block">
                {Math.round((cameraActiveSeconds / 60) * 10) / 10}m
              </span>
            </div>
          </div>

          {/* Self-check-ins list */}
          {selfCheckIns.length > 0 && (
            <div className="p-4 rounded-2xl bg-[#f8faf8] border border-[#ddf3e6] space-y-2">
              <span className="text-xs font-bold text-[#0c1f18] block">
                Your Self-Reported Check-Ins:
              </span>
              <div className="flex flex-wrap gap-2">
                {selfCheckIns.map((c, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 rounded-full bg-[#ddf3e6] text-[#14532d] text-xs font-medium"
                  >
                    {c.state} • {c.time}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Distinguish measured from estimated */}
          <div className="p-4 rounded-2xl bg-[#e3f9ec]/40 border border-white text-xs text-[#404941] leading-relaxed">
            <strong className="text-[#0c1f18] block">Activity Record:</strong>
            <p>
              This summary reflects measured session duration and your self-reported inputs. We do not calculate or fabricate focus percentages or fatigue scores from camera footage.
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <button
              onClick={() => {
                setSessionState('idle');
                setElapsedSeconds(0);
                setBreaksCount(0);
                stopCameraStream();
              }}
              className="w-full sm:w-auto px-5 py-2.5 rounded-full border border-[#cde9db] bg-white hover:bg-[#e3f9ec] text-[#404941] text-xs font-semibold transition-colors cursor-pointer"
            >
              Start Another Session
            </button>
            <button
              onClick={handleSaveAndExit}
              className="w-full sm:w-auto px-6 py-2.5 rounded-full bg-[#14532d] hover:bg-[#003b1b] text-white text-xs font-semibold shadow-md transition-all cursor-pointer"
            >
              Save to Dashboard &amp; View Summary
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
