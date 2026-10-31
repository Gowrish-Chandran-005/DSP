/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { getStoredAssessments, StoredAssessment } from '../services/api';

interface HistoryViewProps {
  onShowToast: (msg: string) => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({ onShowToast }) => {
  const [assessments, setAssessments] = useState<StoredAssessment[]>([]);
  const [quickNote, setQuickNote] = useState('');
  const [showNoteForm, setShowNoteForm] = useState(false);

  const loadData = () => {
    const list = getStoredAssessments();
    setAssessments(list);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDelete = (id: string) => {
    try {
      const updated = assessments.filter((a) => a.id !== id);
      setAssessments(updated);
      localStorage.setItem('calma_assessment_records', JSON.stringify(updated));
      onShowToast('Assessment record deleted from local history.');
    } catch {
      onShowToast('Could not delete record.');
    }
  };

  const handleExportData = () => {
    if (assessments.length === 0) {
      onShowToast('No assessment records to export.');
      return;
    }
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(assessments, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `calma_assessments_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    onShowToast('Assessment history exported as JSON.');
  };

  return (
    <div className="flex flex-col w-full space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-1">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#14532d]"></span>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#4b6459]">
              Assessment Records &amp; Logs
            </span>
          </div>
          <h1 className="font-headline-lg text-headline-lg text-[#003b1b] tracking-tight">
            Assessment History
          </h1>
          <p className="text-xs sm:text-sm text-[#404941] leading-relaxed">
            Review past well-being assessments, reported study hours, and model estimates.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportData}
            className="px-4 py-2 rounded-full bg-white hover:bg-white/90 text-[#14532d] text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5 border border-[#ddf3e6] cursor-pointer"
          >
            <span className="material-symbols-outlined text-[17px]">download</span>
            Export History
          </button>
        </div>
      </div>

      {/* Main Records List */}
      <div className="space-y-4">
        {assessments.length > 0 ? (
          assessments.map((a) => {
            const isLower = a.burnout_score < 4.0;
            const isModerate = a.burnout_score >= 4.0 && a.burnout_score < 7.0;

            const badgeColor = isLower
              ? 'bg-[#ddf3e6] text-[#003b1b]'
              : isModerate
              ? 'bg-[#fef3c7] text-[#92400e]'
              : 'bg-[#fee2e2] text-[#991b1b]';

            return (
              <div
                key={a.id}
                className="p-5 sm:p-6 rounded-3xl bg-white/75 backdrop-blur-xl border border-white/90 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 hover:shadow-md transition-shadow"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-[#0c1f18]">{a.dateFormatted}</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${badgeColor}`}>
                      {a.risk_level}
                    </span>
                    <span className="text-[10px] text-[#404941]/60">
                      {a.source === 'backend' ? '• Model B Live' : '• Local Estimation'}
                    </span>
                  </div>

                  {/* Features snapshot */}
                  {a.features && (
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#404941] pt-1">
                      <span>Sleep: <strong className="text-[#0c1f18]">{a.features.sleep_hours}h</strong></span>
                      <span>Study: <strong className="text-[#0c1f18]">{a.features.study_hours_per_day}h</strong></span>
                      <span>Exam Pressure: <strong className="text-[#0c1f18]">{a.features.exam_pressure}/10</strong></span>
                      <span>Stress: <strong className="text-[#0c1f18]">{a.features.stress_level}/10</strong></span>
                      <span>Support: <strong className="text-[#0c1f18]">{a.features.social_support}/10</strong></span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-4 self-end md:self-auto shrink-0">
                  <div className="text-right">
                    <div className="text-2xl font-extrabold text-[#0c1f18]">
                      {a.burnout_score.toFixed(1)}
                    </div>
                    <span className="text-[10px] text-[#404941]">/ 10 score</span>
                  </div>

                  <button
                    onClick={() => handleDelete(a.id)}
                    className="w-8 h-8 rounded-full text-[#404941] hover:text-[#b91c1c] hover:bg-[#fee2e2]/60 flex items-center justify-center transition-colors cursor-pointer"
                    title="Delete Record"
                    aria-label="Delete Record"
                  >
                    <span className="material-symbols-outlined text-[17px]">delete</span>
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-10 rounded-3xl bg-white/75 backdrop-blur-xl border border-white/90 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-[#ddf3e6] text-[#14532d] flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-[24px]">history_edu</span>
            </div>
            <h3 className="font-bold text-sm text-[#0c1f18]">No Assessment Records Saved Yet</h3>
            <p className="text-xs text-[#404941] max-w-sm mx-auto leading-relaxed">
              Complete your first well-being assessment from the Check-In tab to begin building your personal history.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
