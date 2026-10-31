/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { UserSession, StudentProfileData, ViewMode } from '../types';
import {
  fetchStudentProfile,
  updateStudentProfile,
  testVtopConnection,
  testScreenTimeConnection,
  importManualData,
} from '../services/api';

interface ProfileViewProps {
  user: UserSession | null;
  onUpdateSession: (partial: Partial<UserSession>) => void;
  onNavigate: (view: ViewMode) => void;
  onShowToast: (msg: string) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  user,
  onUpdateSession,
  onNavigate,
  onShowToast,
}) => {
  const [activeTab, setActiveTab] = useState<'basic' | 'academic' | 'preferences' | 'integrations'>('basic');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showStudentId, setShowStudentId] = useState(false);

  // Profile Form State
  const [profile, setProfile] = useState<StudentProfileData>({
    basic: {
      fullName: user?.name || 'Maya Lin',
      preferredName: user?.name ? user.name.split(' ')[0] : 'Maya',
      email: user?.email || 'maya.lin@campus.edu',
      studentId: user?.studentId || '21BCE1024',
      institution: 'VIT Vellore',
      campus: 'Vellore Main Campus',
      degree: 'B.Tech',
      specialization: 'Computer Science and Engineering',
      academicYear: 3,
      semester: 6,
      expectedGraduation: 2027,
    },
    academic: {
      institution: 'VIT Vellore',
      degree: 'B.Tech Computer Science and Engineering',
      specialization: 'Artificial Intelligence & Machine Learning',
      currentSemester: 6,
      academicYear: 3,
      cgpa: null,
      recentGpa: null,
      courses: [
        { code: 'CSE3002', name: 'Internet and Web Programming', credits: 4, faculty: 'School of Computing Science' },
        { code: 'CSE3006', name: 'Computer Networks', credits: 4, faculty: 'School of Computing Science' },
        { code: 'CSE4001', name: 'Machine Learning', credits: 4, faculty: 'School of Computing Science' },
        { code: 'MAT3004', name: 'Applied Statistics & Probability', credits: 3, faculty: 'Department of Mathematics' },
      ],
      upcomingExams: [],
      upcomingDeadlines: [
        { title: 'Machine Learning Lab Exercise 4', dueDate: 'In 5 days', course: 'CSE4001', status: 'In Progress' },
      ],
      weeklyStudyHours: 28,
      workloadRating: 'Moderate to Heavy',
      academicGoals: 'Maintain balanced study sprints without late-night cramming.',
    },
    preferences: {
      typicalSleepHours: 7.0,
      preferredStudyDuration: 45,
      preferredBreakInterval: 10,
      reminderStyle: 'Gentle',
      notificationPreferences: {
        studyReminders: true,
        sleepPrompts: true,
        weeklyDigest: true,
      },
      accessibilityPreferences: {
        reducedMotion: false,
        highContrast: false,
        screenReaderOptimized: false,
      },
    },
    integrations: {
      vtop: {
        status: 'Integration not configured',
        connected: false,
        apiEndpoint: '',
        lastSync: null,
        supportedData: ['Course details', 'Semester attendance', 'Exam schedules', 'Internal marks'],
        requiresAuth: true,
        notes: 'Browser-based systems cannot access VTOP credentials directly. Official VIT institution API integration required.',
      },
      screenTime: {
        status: 'Integration not configured',
        connected: false,
        apiEndpoint: '',
        lastSync: null,
        supportedData: ['Daily screen hours', 'App category usage', 'Screen time during study sessions'],
        requiresAuth: true,
        notes: 'Browsers cannot read OS-level device screen time directly. Requires manual JSON/CSV export or authorized mobile companion app.',
      },
      manualImports: [],
    },
  });

  // VTOP test connection state
  const [vtopEndpoint, setVtopEndpoint] = useState('');
  const [vtopTesting, setVtopTesting] = useState(false);
  const [vtopFeedback, setVtopFeedback] = useState<string | null>(null);

  // Screen time test state
  const [screenTimeTesting, setScreenTimeTesting] = useState(false);
  const [screenTimeFeedback, setScreenTimeFeedback] = useState<string | null>(null);

  // Manual Import state
  const [importJsonText, setImportJsonText] = useState('');
  const [importType, setImportType] = useState<'Screen Time Export' | 'Coursework Log'>('Screen Time Export');

  // Load profile from API / cache
  useEffect(() => {
    let isMounted = true;
    async function load() {
      setIsLoading(true);
      const studentEmail = user?.email || 'maya.lin@campus.edu';
      const data = await fetchStudentProfile(studentEmail);
      if (isMounted && data) {
        setProfile(data);
        if (data.integrations?.vtop?.apiEndpoint) {
          setVtopEndpoint(data.integrations.vtop.apiEndpoint);
        }
      }
      setIsLoading(false);
    }
    load();
    return () => {
      isMounted = false;
    };
  }, [user]);

  // Save profile updates
  const handleSaveProfile = async () => {
    setIsSaving(true);
    const updatedData = {
      ...profile,
      integrations: {
        ...profile.integrations,
        vtop: {
          ...profile.integrations.vtop,
          apiEndpoint: vtopEndpoint,
        },
      },
    };

    const res = await updateStudentProfile(updatedData);
    setIsSaving(false);

    if (res.success) {
      setProfile(updatedData);
      onUpdateSession({
        name: updatedData.basic.fullName,
        studentId: updatedData.basic.studentId,
        term: `${updatedData.basic.institution} • Sem ${updatedData.basic.semester}`,
      });
      onShowToast('Profile details updated and saved successfully.');
    } else {
      onShowToast('Could not save profile changes.');
    }
  };

  // Test VTOP
  const handleTestVtop = async () => {
    setVtopTesting(true);
    setVtopFeedback(null);
    const result = await testVtopConnection(vtopEndpoint);
    setVtopTesting(false);
    setVtopFeedback(result.message);
    onShowToast('VTOP Connection Test: ' + result.status);
  };

  // Test Screen Time
  const handleTestScreenTime = async () => {
    setScreenTimeTesting(true);
    setScreenTimeFeedback(null);
    const result = await testScreenTimeConnection();
    setScreenTimeTesting(false);
    setScreenTimeFeedback(result.message);
    onShowToast('Screen Time Connection Test: ' + result.status);
  };

  // Handle Manual Data Import
  const handleImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importJsonText.trim()) {
      onShowToast('Please paste valid JSON or CSV data to import.');
      return;
    }

    try {
      let parsed: any;
      try {
        parsed = JSON.parse(importJsonText);
      } catch {
        // Plain text / CSV lines
        parsed = importJsonText.split('\n').filter((l) => l.trim().length > 0);
      }

      const res = await importManualData(profile.basic.email, importType, parsed);
      if (res.success && res.record) {
        setProfile((prev) => ({
          ...prev,
          integrations: {
            ...prev.integrations,
            manualImports: [res.record, ...prev.integrations.manualImports],
          },
        }));
        setImportJsonText('');
        onShowToast(`Import successful: ${res.message}`);
      }
    } catch {
      onShowToast('Could not process import. Please check data format.');
    }
  };

  const maskedId = profile.basic.studentId
    ? profile.basic.studentId.slice(0, 3) + '••••' + profile.basic.studentId.slice(-2)
    : 'Not provided';

  return (
    <div className="flex flex-col w-full space-y-8">
      {/* Top Banner */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#ddf3e6] text-[#14532d] text-xs font-semibold shadow-sm border border-[#cde9db]">
            <span className="w-2 h-2 rounded-full bg-[#14532d]"></span>
            <span>Authenticated Student Profile • {profile.basic.institution}</span>
          </div>
          <h1 className="font-headline-lg text-headline-lg text-[#003b1b] tracking-tight">
            Student Profile &amp; Integrations
          </h1>
          <p className="text-xs sm:text-sm text-[#404941] max-w-xl leading-relaxed">
            Manage your academic degree details, coursework context, personal study preferences, and connected campus integrations.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start md:self-auto shrink-0">
          <button
            onClick={handleSaveProfile}
            disabled={isSaving}
            className="px-6 py-2.5 rounded-full bg-[#14532d] hover:bg-[#003b1b] text-white text-xs font-semibold shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer disabled:opacity-70"
          >
            {isSaving ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white/60 border-t-white rounded-full animate-spin"></span>
                <span>Saving...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[17px]">save</span>
                <span>Save Profile Changes</span>
              </>
            )}
          </button>
        </div>
      </section>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[#ddf3e6] pb-2">
        {[
          { id: 'basic', label: 'Basic Information', icon: 'person' },
          { id: 'academic', label: 'Academic Details', icon: 'school' },
          { id: 'preferences', label: 'Well-being & Study Preferences', icon: 'tune' },
          { id: 'integrations', label: 'Connected Data Sources', icon: 'sync' },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-2xl text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer border ${
                isActive
                  ? 'bg-[#14532d] text-white border-[#14532d] shadow-sm'
                  : 'bg-white/70 text-[#404941] border-white/80 hover:bg-[#e3f9ec]/60'
              }`}
            >
              <span className="material-symbols-outlined text-[17px]">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: BASIC INFORMATION */}
      {activeTab === 'basic' && (
        <div className="p-6 sm:p-8 rounded-3xl bg-white/75 backdrop-blur-[24px] border border-white/90 shadow-sm space-y-6 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#ddf3e6]">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-[#14532d] text-white text-xl font-bold flex items-center justify-center shadow-md">
                {profile.basic.preferredName
                  ? profile.basic.preferredName.slice(0, 2).toUpperCase()
                  : 'ST'}
              </div>
              <div>
                <h2 className="font-title-lg text-title-lg text-[#0c1f18]">{profile.basic.fullName}</h2>
                <span className="text-xs text-[#404941] block">{profile.basic.email}</span>
                <span className="text-[11px] text-[#14532d] font-semibold">
                  {profile.basic.institution} • {profile.basic.degree} {profile.basic.specialization}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#0c1f18] block">Full Name</label>
              <input
                type="text"
                value={profile.basic.fullName}
                onChange={(e) =>
                  setProfile((prev) => ({
                    ...prev,
                    basic: { ...prev.basic, fullName: e.target.value },
                  }))
                }
                className="w-full h-11 px-4 rounded-xl bg-[#e3f9ec]/40 border border-[#cde9db] text-xs sm:text-sm text-[#0c1f18] focus:outline-none focus:border-[#14532d]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#0c1f18] block">Preferred First Name</label>
              <input
                type="text"
                value={profile.basic.preferredName}
                onChange={(e) =>
                  setProfile((prev) => ({
                    ...prev,
                    basic: { ...prev.basic, preferredName: e.target.value },
                  }))
                }
                className="w-full h-11 px-4 rounded-xl bg-[#e3f9ec]/40 border border-[#cde9db] text-xs sm:text-sm text-[#0c1f18] focus:outline-none focus:border-[#14532d]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#0c1f18] block">Student Email (Locked)</label>
              <input
                type="email"
                disabled
                value={profile.basic.email}
                className="w-full h-11 px-4 rounded-xl bg-gray-100/70 border border-gray-200 text-xs sm:text-sm text-[#717970] cursor-not-allowed"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-[#0c1f18] block">Registration No. / Student ID</label>
                <button
                  type="button"
                  onClick={() => setShowStudentId(!showStudentId)}
                  className="text-[11px] text-[#14532d] font-semibold hover:underline cursor-pointer"
                >
                  {showStudentId ? 'Mask' : 'Reveal'}
                </button>
              </div>
              <input
                type="text"
                value={showStudentId ? profile.basic.studentId : maskedId}
                onChange={(e) =>
                  setProfile((prev) => ({
                    ...prev,
                    basic: { ...prev.basic, studentId: e.target.value },
                  }))
                }
                className="w-full h-11 px-4 rounded-xl bg-[#e3f9ec]/40 border border-[#cde9db] text-xs sm:text-sm text-[#0c1f18] focus:outline-none focus:border-[#14532d] font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#0c1f18] block">University / Institution</label>
              <input
                type="text"
                value={profile.basic.institution}
                onChange={(e) =>
                  setProfile((prev) => ({
                    ...prev,
                    basic: { ...prev.basic, institution: e.target.value },
                  }))
                }
                placeholder="VIT Vellore"
                className="w-full h-11 px-4 rounded-xl bg-[#e3f9ec]/40 border border-[#cde9db] text-xs sm:text-sm text-[#0c1f18] focus:outline-none focus:border-[#14532d]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#0c1f18] block">Campus</label>
              <input
                type="text"
                value={profile.basic.campus}
                onChange={(e) =>
                  setProfile((prev) => ({
                    ...prev,
                    basic: { ...prev.basic, campus: e.target.value },
                  }))
                }
                placeholder="Vellore Main Campus"
                className="w-full h-11 px-4 rounded-xl bg-[#e3f9ec]/40 border border-[#cde9db] text-xs sm:text-sm text-[#0c1f18] focus:outline-none focus:border-[#14532d]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#0c1f18] block">Degree &amp; Program</label>
              <input
                type="text"
                value={profile.basic.degree}
                onChange={(e) =>
                  setProfile((prev) => ({
                    ...prev,
                    basic: { ...prev.basic, degree: e.target.value },
                  }))
                }
                placeholder="B.Tech"
                className="w-full h-11 px-4 rounded-xl bg-[#e3f9ec]/40 border border-[#cde9db] text-xs sm:text-sm text-[#0c1f18] focus:outline-none focus:border-[#14532d]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#0c1f18] block">Branch / Specialization</label>
              <input
                type="text"
                value={profile.basic.specialization}
                onChange={(e) =>
                  setProfile((prev) => ({
                    ...prev,
                    basic: { ...prev.basic, specialization: e.target.value },
                  }))
                }
                placeholder="Computer Science and Engineering"
                className="w-full h-11 px-4 rounded-xl bg-[#e3f9ec]/40 border border-[#cde9db] text-xs sm:text-sm text-[#0c1f18] focus:outline-none focus:border-[#14532d]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#0c1f18] block">Academic Year</label>
              <select
                value={profile.basic.academicYear}
                onChange={(e) =>
                  setProfile((prev) => ({
                    ...prev,
                    basic: { ...prev.basic, academicYear: Number(e.target.value) },
                  }))
                }
                className="w-full h-11 px-4 rounded-xl bg-[#e3f9ec]/40 border border-[#cde9db] text-xs sm:text-sm text-[#0c1f18] focus:outline-none focus:border-[#14532d]"
              >
                <option value={1}>1st Year</option>
                <option value={2}>2nd Year</option>
                <option value={3}>3rd Year</option>
                <option value={4}>4th Year</option>
                <option value={5}>Postgraduate / Ph.D.</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#0c1f18] block">Current Semester</label>
              <input
                type="number"
                min={1}
                max={10}
                value={profile.basic.semester}
                onChange={(e) =>
                  setProfile((prev) => ({
                    ...prev,
                    basic: { ...prev.basic, semester: Number(e.target.value) },
                  }))
                }
                className="w-full h-11 px-4 rounded-xl bg-[#e3f9ec]/40 border border-[#cde9db] text-xs sm:text-sm text-[#0c1f18] focus:outline-none focus:border-[#14532d]"
              />
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: ACADEMIC DETAILS */}
      {activeTab === 'academic' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Card 1: Workload & Study Goals */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white/75 backdrop-blur-[24px] border border-white/90 shadow-sm space-y-6">
            <div>
              <h2 className="font-title-lg text-title-lg text-[#0c1f18]">Academic Study Context</h2>
              <p className="text-xs text-[#404941] mt-0.5">
                Self-reported academic load to contextualize study pacing and deadline expectations.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="p-4 rounded-2xl bg-[#e3f9ec]/50 border border-white space-y-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#4b6459] block">
                  Typical Weekly Study
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-[#0c1f18]">
                    {profile.academic.weeklyStudyHours}
                  </span>
                  <span className="text-xs text-[#404941]">hours/week</span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={60}
                  value={profile.academic.weeklyStudyHours}
                  onChange={(e) =>
                    setProfile((prev) => ({
                      ...prev,
                      academic: { ...prev.academic, weeklyStudyHours: Number(e.target.value) },
                    }))
                  }
                  className="w-full accent-[#14532d] cursor-pointer mt-2"
                />
              </div>

              <div className="p-4 rounded-2xl bg-[#e3f9ec]/50 border border-white space-y-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#4b6459] block">
                  Perceived Workload
                </span>
                <select
                  value={profile.academic.workloadRating}
                  onChange={(e) =>
                    setProfile((prev) => ({
                      ...prev,
                      academic: { ...prev.academic, workloadRating: e.target.value },
                    }))
                  }
                  className="w-full h-10 px-3 rounded-xl bg-white border border-[#cde9db] text-xs font-semibold text-[#0c1f18] focus:outline-none"
                >
                  <option value="Light">Light &amp; Manageable</option>
                  <option value="Moderate">Moderate &amp; Balanced</option>
                  <option value="Moderate to Heavy">Moderate to Heavy</option>
                  <option value="Very Heavy">Very Heavy (Near Capacity)</option>
                </select>
                <span className="text-[11px] text-[#404941] block pt-1">
                  Adjusts pace recommendations
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-[#e3f9ec]/50 border border-white space-y-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#4b6459] block">
                  Official Grades (CGPA)
                </span>
                <span className="text-sm font-semibold text-[#404941] block pt-1">
                  {profile.academic.cgpa ? `${profile.academic.cgpa} / 10.0` : 'Not provided'}
                </span>
                <span className="text-[10px] text-[#717970] block">
                  Calma does not infer burnout directly from GPA grades.
                </span>
              </div>
            </div>

            {/* Academic Goals */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#0c1f18] block">Personal Academic Goals</label>
              <textarea
                rows={2}
                value={profile.academic.academicGoals}
                onChange={(e) =>
                  setProfile((prev) => ({
                    ...prev,
                    academic: { ...prev.academic, academicGoals: e.target.value },
                  }))
                }
                placeholder="E.g. Maintain consistent 45m study sprints and avoid late-night cramming."
                className="w-full p-3 rounded-xl bg-[#e3f9ec]/40 border border-[#cde9db] text-xs sm:text-sm text-[#0c1f18] focus:outline-none focus:border-[#14532d]"
              ></textarea>
            </div>
          </div>

          {/* Card 2: Registered Courses Table */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white/75 backdrop-blur-[24px] border border-white/90 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-title-md text-title-md text-[#0c1f18]">Enrolled Courses ({profile.academic.courses.length})</h3>
                <span className="text-xs text-[#404941]">Semester {profile.basic.semester} Course Registrations</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#ddf3e6] text-[#4b6459]">
                    <th className="py-2.5 font-bold">Course Code</th>
                    <th className="py-2.5 font-bold">Course Title</th>
                    <th className="py-2.5 font-bold">Credits</th>
                    <th className="py-2.5 font-bold">School / Faculty</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#ddf3e6]/60 text-[#0c1f18]">
                  {profile.academic.courses.map((c, i) => (
                    <tr key={i} className="hover:bg-[#e3f9ec]/30 transition-colors">
                      <td className="py-2.5 font-mono font-bold text-[#14532d]">{c.code}</td>
                      <td className="py-2.5 font-medium">{c.name}</td>
                      <td className="py-2.5 font-semibold">{c.credits}</td>
                      <td className="py-2.5 text-[#404941]">{c.faculty || 'VIT Vellore'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Card 3: Upcoming Exams & Deadlines */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 rounded-3xl bg-white/75 backdrop-blur-[24px] border border-white/90 shadow-sm space-y-3">
              <h3 className="font-title-md text-title-md text-[#0c1f18] flex items-center gap-2">
                <span className="material-symbols-outlined text-[#14532d] text-[19px]">event_note</span>
                Upcoming Examinations
              </h3>
              {profile.academic.upcomingExams.length > 0 ? (
                <div className="space-y-2">
                  {profile.academic.upcomingExams.map((ex, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-[#e3f9ec]/60 border border-white flex justify-between text-xs">
                      <span className="font-bold text-[#0c1f18]">{ex.course}</span>
                      <span className="text-[#14532d] font-semibold">{ex.date}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-5 rounded-2xl bg-[#f8faf8] border border-[#ddf3e6] text-center text-xs text-[#404941] space-y-1">
                  <span className="material-symbols-outlined text-[24px] text-[#717970] block">schedule</span>
                  <p className="font-semibold text-[#0c1f18]">No upcoming exams scheduled</p>
                  <p className="text-[11px] text-[#717970]">
                    VTOP examination timetable is not connected. Connect VTOP or enter milestones manually.
                  </p>
                </div>
              )}
            </div>

            <div className="p-6 rounded-3xl bg-white/75 backdrop-blur-[24px] border border-white/90 shadow-sm space-y-3">
              <h3 className="font-title-md text-title-md text-[#0c1f18] flex items-center gap-2">
                <span className="material-symbols-outlined text-[#14532d] text-[19px]">assignment_turned_in</span>
                Assignment &amp; Project Deadlines
              </h3>
              <div className="space-y-2">
                {profile.academic.upcomingDeadlines.map((dl, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-[#e3f9ec]/60 border border-white flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-[#0c1f18]">{dl.title}</p>
                      <span className="text-[11px] text-[#4b6459]">{dl.course}</span>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-[#fef3c7] text-[#92400e] text-[10px] font-bold">
                      {dl.dueDate}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: WELL-BEING & STUDY PREFERENCES */}
      {activeTab === 'preferences' && (
        <div className="p-6 sm:p-8 rounded-3xl bg-white/75 backdrop-blur-[24px] border border-white/90 shadow-sm space-y-6 animate-in fade-in duration-200">
          <div>
            <h2 className="font-title-lg text-title-lg text-[#0c1f18]">Study &amp; Pacing Preferences</h2>
            <p className="text-xs text-[#404941] mt-0.5">
              Personalize your study timer durations, break intervals, and gentle reminders.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Preferred Study Duration */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#0c1f18] block">Preferred Focus Session Duration</label>
              <select
                value={profile.preferences.preferredStudyDuration}
                onChange={(e) =>
                  setProfile((prev) => ({
                    ...prev,
                    preferences: { ...prev.preferences, preferredStudyDuration: Number(e.target.value) },
                  }))
                }
                className="w-full h-11 px-4 rounded-xl bg-[#e3f9ec]/40 border border-[#cde9db] text-xs sm:text-sm text-[#0c1f18] focus:outline-none focus:border-[#14532d]"
              >
                <option value={25}>25 minutes (Pomodoro Sprint)</option>
                <option value={45}>45 minutes (Standard Balanced)</option>
                <option value={60}>60 minutes (Deep Work)</option>
                <option value={90}>90 minutes (Extended Sprint)</option>
              </select>
            </div>

            {/* Preferred Break Interval */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#0c1f18] block">Preferred Rest Break Duration</label>
              <select
                value={profile.preferences.preferredBreakInterval}
                onChange={(e) =>
                  setProfile((prev) => ({
                    ...prev,
                    preferences: { ...prev.preferences, preferredBreakInterval: Number(e.target.value) },
                  }))
                }
                className="w-full h-11 px-4 rounded-xl bg-[#e3f9ec]/40 border border-[#cde9db] text-xs sm:text-sm text-[#0c1f18] focus:outline-none focus:border-[#14532d]"
              >
                <option value={5}>5 minutes (Quick stretch)</option>
                <option value={10}>10 minutes (Recommended mindful pause)</option>
                <option value={15}>15 minutes (Complete screen-free reset)</option>
              </select>
            </div>

            {/* Typical Sleep Duration */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-[#0c1f18] block">Typical Nightly Sleep Target</label>
                <span className="text-xs font-extrabold text-[#14532d]">{profile.preferences.typicalSleepHours} hrs</span>
              </div>
              <input
                type="range"
                min={4}
                max={10}
                step={0.5}
                value={profile.preferences.typicalSleepHours}
                onChange={(e) =>
                  setProfile((prev) => ({
                    ...prev,
                    preferences: { ...prev.preferences, typicalSleepHours: Number(e.target.value) },
                  }))
                }
                className="w-full accent-[#14532d] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-[#404941]">
                <span>4 hrs</span>
                <span>7-9 hrs (Healthy standard)</span>
                <span>10 hrs</span>
              </div>
            </div>

            {/* Reminder Style */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#0c1f18] block">Reminder Tone</label>
              <select
                value={profile.preferences.reminderStyle}
                onChange={(e) =>
                  setProfile((prev) => ({
                    ...prev,
                    preferences: { ...prev.preferences, reminderStyle: e.target.value },
                  }))
                }
                className="w-full h-11 px-4 rounded-xl bg-[#e3f9ec]/40 border border-[#cde9db] text-xs sm:text-sm text-[#0c1f18] focus:outline-none focus:border-[#14532d]"
              >
                <option value="Gentle">Gentle &amp; Non-intrusive (Recommended)</option>
                <option value="Standard">Standard Notifications</option>
                <option value="Subtle">Subtle in-app badge only</option>
              </select>
            </div>
          </div>

          {/* Accessibility Settings */}
          <div className="pt-4 border-t border-[#ddf3e6] space-y-3">
            <h3 className="font-bold text-xs sm:text-sm text-[#0c1f18]">Accessibility &amp; Visual Comfort</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="flex items-center gap-3 p-3.5 rounded-2xl bg-[#e3f9ec]/40 border border-white cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={profile.preferences.accessibilityPreferences.reducedMotion}
                  onChange={(e) =>
                    setProfile((prev) => ({
                      ...prev,
                      preferences: {
                        ...prev.preferences,
                        accessibilityPreferences: {
                          ...prev.preferences.accessibilityPreferences,
                          reducedMotion: e.target.checked,
                        },
                      },
                    }))
                  }
                  className="rounded text-[#14532d] focus:ring-[#14532d]"
                />
                <span>Reduce animations and floating motion effects</span>
              </label>

              <label className="flex items-center gap-3 p-3.5 rounded-2xl bg-[#e3f9ec]/40 border border-white cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={profile.preferences.accessibilityPreferences.highContrast}
                  onChange={(e) =>
                    setProfile((prev) => ({
                      ...prev,
                      preferences: {
                        ...prev.preferences,
                        accessibilityPreferences: {
                          ...prev.preferences.accessibilityPreferences,
                          highContrast: e.target.checked,
                        },
                      },
                    }))
                  }
                  className="rounded text-[#14532d] focus:ring-[#14532d]"
                />
                <span>Enhanced high-contrast card borders</span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: CONNECTED DATA SOURCES */}
      {activeTab === 'integrations' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="p-4 rounded-2xl bg-[#fef3c7]/60 border border-[#fde68a] text-xs text-[#92400e] flex items-start gap-3">
            <span className="material-symbols-outlined text-[20px] text-[#d97706] shrink-0">
              lock
            </span>
            <div className="space-y-0.5">
              <p className="font-bold">Privacy &amp; Security Guarantee:</p>
              <p>
                Calma does not ask for or store your student passwords. Institutional records require authorized campus API keys. Where direct APIs are not supported, you can import data via manual JSON/CSV exports.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Integration 1: VTOP Academic Data */}
            <div className="p-6 sm:p-7 rounded-3xl bg-white/75 backdrop-blur-[24px] border border-white/90 shadow-sm flex flex-col justify-between space-y-5">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-2xl bg-[#ddf3e6] text-[#14532d] flex items-center justify-center font-bold text-sm">
                      VTOP
                    </div>
                    <div>
                      <h3 className="font-bold text-xs sm:text-sm text-[#0c1f18]">VTOP Academic Integration</h3>
                      <span className="text-[10px] text-[#4b6459] font-medium">VIT Student Portal Data</span>
                    </div>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#fee2e2] text-[#991b1b] text-[10px] font-bold">
                    {profile.integrations.vtop.status}
                  </span>
                </div>

                <p className="text-xs text-[#404941] leading-relaxed">
                  Allows optional synchronization of registered semester courses, attendance markers, and internal exam schedules.
                </p>

                <div className="space-y-1.5 pt-1">
                  <label className="text-[11px] font-bold text-[#0c1f18] block">Authorized VTOP API Endpoint URL</label>
                  <input
                    type="url"
                    placeholder="https://vtop.vit.ac.in/api/v1 (or institutional gateway)"
                    value={vtopEndpoint}
                    onChange={(e) => setVtopEndpoint(e.target.value)}
                    className="w-full h-10 px-3.5 rounded-xl bg-[#e3f9ec]/40 border border-[#cde9db] text-xs text-[#0c1f18] focus:outline-none"
                  />
                  <span className="text-[10px] text-[#717970] block">
                    Institutional API endpoint must be provided by campus administrators.
                  </span>
                </div>

                {/* Feedback */}
                {vtopFeedback && (
                  <div className="p-3 rounded-xl bg-[#f8faf8] border border-[#ddf3e6] text-xs text-[#404941]">
                    {vtopFeedback}
                  </div>
                )}

                <div className="text-xs text-[#404941] space-y-1 pt-1">
                  <span className="font-bold text-[#0c1f18] block text-[11px]">Supported Data Permissions:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {profile.integrations.vtop.supportedData.map((d, i) => (
                      <span key={i} className="px-2 py-0.5 rounded-lg bg-[#ddf3e6]/80 text-[#14532d] text-[10px] font-medium">
                        {d}
                      </span>
                    ))}
                  </div>
                  <span className="text-[10px] text-[#717970] block pt-1">
                    Last Sync: {profile.integrations.vtop.lastSync || 'Never synchronized'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-3 border-t border-[#ddf3e6]">
                <button
                  type="button"
                  onClick={handleTestVtop}
                  disabled={vtopTesting}
                  className="px-4 py-2 rounded-full bg-[#14532d] text-white text-xs font-semibold hover:bg-[#003b1b] transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[15px]">electrical_services</span>
                  <span>{vtopTesting ? 'Testing...' : 'Test Connection'}</span>
                </button>
                <button
                  type="button"
                  disabled
                  className="px-4 py-2 rounded-full bg-gray-100 text-gray-400 text-xs font-semibold cursor-not-allowed"
                >
                  Sync Now
                </button>
              </div>
            </div>

            {/* Integration 2: Phone Screen-Time Data */}
            <div className="p-6 sm:p-7 rounded-3xl bg-white/75 backdrop-blur-[24px] border border-white/90 shadow-sm flex flex-col justify-between space-y-5">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-2xl bg-[#ddf3e6] text-[#14532d] flex items-center justify-center">
                      <span className="material-symbols-outlined text-[20px]">devices</span>
                    </div>
                    <div>
                      <h3 className="font-bold text-xs sm:text-sm text-[#0c1f18]">Phone Screen-Time Integration</h3>
                      <span className="text-[10px] text-[#4b6459] font-medium">Android Wellbeing / iOS Screen Time</span>
                    </div>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#fee2e2] text-[#991b1b] text-[10px] font-bold">
                    {profile.integrations.screenTime.status}
                  </span>
                </div>

                <p className="text-xs text-[#404941] leading-relaxed">
                  Web browsers cannot inspect phone apps directly due to operating system sandboxing. Connect an authorized mobile integration or import statistics manually.
                </p>

                <div className="p-3.5 rounded-2xl bg-[#e3f9ec]/50 border border-white text-xs text-[#404941] space-y-1">
                  <strong className="text-[#0c1f18] block text-[11px]">How to export screen time:</strong>
                  <p className="text-[11px] leading-relaxed">
                    <strong>Android:</strong> Settings → Digital Wellbeing → Export data.<br />
                    <strong>iPhone:</strong> Settings → Screen Time → Share Across Devices.
                  </p>
                </div>

                {screenTimeFeedback && (
                  <div className="p-3 rounded-xl bg-[#f8faf8] border border-[#ddf3e6] text-xs text-[#404941]">
                    {screenTimeFeedback}
                  </div>
                )}

                <div className="text-xs text-[#404941] space-y-1 pt-1">
                  <span className="font-bold text-[#0c1f18] block text-[11px]">Supported Data:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {profile.integrations.screenTime.supportedData.map((d, i) => (
                      <span key={i} className="px-2 py-0.5 rounded-lg bg-[#ddf3e6]/80 text-[#14532d] text-[10px] font-medium">
                        {d}
                      </span>
                    ))}
                  </div>
                  <span className="text-[10px] text-[#717970] block pt-1">
                    Last Sync: {profile.integrations.screenTime.lastSync || 'Never synchronized'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-3 border-t border-[#ddf3e6]">
                <button
                  type="button"
                  onClick={handleTestScreenTime}
                  disabled={screenTimeTesting}
                  className="px-4 py-2 rounded-full bg-[#14532d] text-white text-xs font-semibold hover:bg-[#003b1b] transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[15px]">electrical_services</span>
                  <span>{screenTimeTesting ? 'Testing...' : 'Test Connection'}</span>
                </button>
                <button
                  type="button"
                  disabled
                  className="px-4 py-2 rounded-full bg-gray-100 text-gray-400 text-xs font-semibold cursor-not-allowed"
                >
                  Sync Now
                </button>
              </div>
            </div>
          </div>

          {/* Integration 3: Manual Data Import */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white/75 backdrop-blur-[24px] border border-white/90 shadow-sm space-y-5">
            <div>
              <h3 className="font-title-md text-title-md text-[#0c1f18]">Manual Data Import</h3>
              <p className="text-xs text-[#404941] mt-0.5">
                Paste JSON or CSV data from your student portal or mobile wellness export.
              </p>
            </div>

            <form onSubmit={handleImportSubmit} className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <label className="text-xs font-bold text-[#0c1f18]">Data Type:</label>
                {(['Screen Time Export', 'Coursework Log'] as const).map((t) => (
                  <label
                    key={t}
                    className={`px-3 py-1.5 rounded-xl border text-xs cursor-pointer font-medium ${
                      importType === t
                        ? 'bg-[#14532d] text-white border-[#14532d]'
                        : 'bg-white text-[#404941] border-[#cde9db]'
                    }`}
                  >
                    <input
                      type="radio"
                      name="importType"
                      checked={importType === t}
                      onChange={() => setImportType(t)}
                      className="hidden"
                    />
                    <span>{t}</span>
                  </label>
                ))}
              </div>

              <textarea
                rows={4}
                value={importJsonText}
                onChange={(e) => setImportJsonText(e.target.value)}
                placeholder='Paste exported JSON (e.g. {"daily_screen_hours": 5.2, "study_hours": 6.5}) or CSV records...'
                className="w-full p-3.5 rounded-xl bg-[#e3f9ec]/40 border border-[#cde9db] text-xs font-mono text-[#0c1f18] focus:outline-none"
              ></textarea>

              <div className="flex items-center justify-between">
                <span className="text-[11px] text-[#717970]">
                  Imported records are stored securely in your profile and validated before use.
                </span>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full bg-[#14532d] hover:bg-[#003b1b] text-white text-xs font-semibold shadow-sm transition-all cursor-pointer"
                >
                  Import &amp; Validate Data
                </button>
              </div>
            </form>

            {/* Imported history table */}
            {profile.integrations.manualImports.length > 0 && (
              <div className="pt-4 border-t border-[#ddf3e6] space-y-2">
                <h4 className="text-xs font-bold text-[#0c1f18]">Import History</h4>
                <div className="space-y-1.5">
                  {profile.integrations.manualImports.map((rec) => (
                    <div
                      key={rec.id}
                      className="p-3 rounded-xl bg-[#e3f9ec]/50 border border-white flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-bold text-[#0c1f18]">{rec.type}</span>
                        <span className="text-[11px] text-[#4b6459] ml-2">({rec.itemCount} records)</span>
                        <p className="text-[10px] text-[#717970] truncate max-w-md">{rec.summary}</p>
                      </div>
                      <span className="text-[10px] text-[#404941]">
                        {new Date(rec.importedAt).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
