/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface FeedbackLog {
  id: string;
  timestamp: string;
  category: 'Bug' | 'Accessibility' | 'Missing feature' | 'Wording' | 'Emotional friction' | 'Delight' | 'Idea';
  priority: 'Low' | 'Medium' | 'High';
  whatHappened: string;
  whatExpected: string;
}

interface FeedbackPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function FeedbackPanel({ isOpen, onClose }: FeedbackPanelProps) {
  const [category, setCategory] = useState<FeedbackLog['category']>('Idea');
  const [priority, setPriority] = useState<FeedbackLog['priority']>('Medium');
  const [whatHappened, setWhatHappened] = useState('');
  const [whatExpected, setWhatExpected] = useState('');
  const [feedbackList, setFeedbackList] = useState<FeedbackLog[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Load saved feedback on mount
  useEffect(() => {
    if (isOpen) {
      const logs = JSON.parse(localStorage.getItem('scholar_feedback_logs') || '[]');
      setFeedbackList(logs);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    if (!whatHappened) return;

    const newLog: FeedbackLog = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toISOString(),
      category,
      priority,
      whatHappened,
      whatExpected
    };

    const updated = [newLog, ...feedbackList];
    setFeedbackList(updated);
    localStorage.setItem('scholar_feedback_logs', JSON.stringify(updated));

    // Clear form
    setWhatHappened('');
    setWhatExpected('');
    
    setToastMessage('Feedback saved locally in offline cache.');
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleDownloadLogs = () => {
    const blob = new Blob([JSON.stringify(feedbackList, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `research_companion_feedback_${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyAsMarkdown = (log: FeedbackLog) => {
    const markdown = `## Research Companion Feedback Report (#${log.id})

**Category**: ${log.category}
**Priority**: ${log.priority}
**Date**: ${new Date(log.timestamp).toLocaleString()}

### What happened?
${log.whatHappened}

### What was expected?
${log.whatExpected || 'N/A'}

---
_Generated locally via Research Companion feedback engine._`;

    navigator.clipboard.writeText(markdown).then(() => {
      setCopiedId(log.id);
      setTimeout(() => setCopiedId(null), 2500);
    });
  };

  const handleDeleteFeedback = (id: string) => {
    const updated = feedbackList.filter(f => f.id !== id);
    setFeedbackList(updated);
    localStorage.setItem('scholar_feedback_logs', JSON.stringify(updated));
  };

  return (
    <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs z-50 flex justify-end font-sans animate-fadeIn" id="feedback-overlay-container">
      <div className="w-full max-w-lg bg-white dark:bg-stone-950 h-full shadow-2xl flex flex-col justify-between border-l border-stone-200 dark:border-stone-850 animate-slideLeft">
        
        {/* Header */}
        <div className="p-4 border-b border-stone-200 dark:border-stone-850 flex justify-between items-center bg-stone-50 dark:bg-stone-900/40">
          <div className="flex items-center gap-2 text-stone-900 dark:text-stone-100">
            <h2 className="text-xs font-bold">Feedback companion workspace</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close feedback panel"
            className="px-2.5 py-1 text-xs font-semibold text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white bg-white dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 border border-stone-200 dark:border-stone-700 rounded-lg cursor-pointer flex items-center gap-1 transition-colors shadow-2xs"
          >
            <X className="w-3.5 h-3.5" />
            <span>Close</span>
          </button>
        </div>

        {/* Content body scrollable */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {toastMessage && (
            <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 p-3 rounded-lg flex items-center gap-2 text-xs text-emerald-800 dark:text-emerald-300 animate-fadeIn">
              <span>{toastMessage}</span>
            </div>
          )}

          <div>
            <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100">Help Us Shape the Companion</h3>
            <p className="text-stone-500 text-xs mt-1 leading-relaxed">
              We capture your physical and emotional friction, wording changes, accessibility blocks, or delightful moments. All feedback saves locally and can be exported as GitHub issue templates.
            </p>
          </div>

          <form onSubmit={handleSaveFeedback} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {/* Category selector */}
              <div className="space-y-1">
                <label className="text-[10px] text-stone-400 dark:text-stone-500 font-bold">Feedback category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as FeedbackLog['category'])}
                  className="w-full text-xs p-2.5 border border-stone-200 dark:border-stone-800 rounded bg-white dark:bg-stone-950 text-stone-800 dark:text-stone-200 focus:outline-none"
                >
                  <option value="Idea">Idea</option>
                  <option value="Bug">Bug</option>
                  <option value="Accessibility">Accessibility</option>
                  <option value="Wording">Wording</option>
                  <option value="Emotional friction">Emotional friction</option>
                  <option value="Delight">Delight</option>
                  <option value="Missing feature">Missing feature</option>
                </select>
              </div>

              {/* Priority Selector */}
              <div className="space-y-1">
                <label className="text-[10px] text-stone-400 dark:text-stone-500 font-bold">Priority level</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as FeedbackLog['priority'])}
                  className="w-full text-xs p-2.5 border border-stone-200 dark:border-stone-800 rounded bg-white dark:bg-stone-950 text-stone-800 dark:text-stone-200 focus:outline-none"
                >
                  <option value="Low">Low Priority</option>
                  <option value="Medium">Medium Priority</option>
                  <option value="High">High Priority</option>
                </select>
              </div>
            </div>

            {/* What happened? */}
            <div className="space-y-1">
              <label htmlFor="happened-input" className="text-[10px] text-stone-400 dark:text-stone-500 font-bold">What happened?</label>
              <textarea
                id="happened-input"
                placeholder="e.g., Felt a bit anxious when formatting citation. Wording could be softer..."
                value={whatHappened}
                onChange={(e) => setWhatHappened(e.target.value)}
                rows={3}
                className="w-full text-xs p-2.5 border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 text-stone-800 dark:text-stone-200 rounded focus:outline-none focus:ring-1 focus:ring-[#912A4A]"
                required
              />
            </div>

            {/* What did you expect? */}
            <div className="space-y-1">
              <label htmlFor="expected-input" className="text-[10px] text-stone-400 dark:text-stone-500 font-bold">What did you expect instead?</label>
              <textarea
                id="expected-input"
                placeholder="e.g., Provide a reassurance notice or an offline backup prompt..."
                value={whatExpected}
                onChange={(e) => setWhatExpected(e.target.value)}
                rows={2}
                className="w-full text-xs p-2.5 border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 text-stone-800 dark:text-stone-200 rounded focus:outline-none focus:ring-1 focus:ring-[#912A4A]"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-[#912A4A] hover:bg-[#78223d] text-white py-2.5 rounded font-sans text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
            >
              Save Feedback Locally
            </button>
          </form>

          {/* List of saved feedbacks */}
          <div className="space-y-3 pt-6 border-t border-stone-100 dark:border-stone-850">
            <div className="flex justify-between items-center">
              <h4 className="text-xs font-bold text-stone-400">Local feedback log ({feedbackList.length})</h4>
              {feedbackList.length > 0 && (
                <button
                  onClick={handleDownloadLogs}
                  className="text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 text-[10px] flex items-center gap-1 cursor-pointer font-semibold"
                >
                  Download JSON
                </button>
              )}
            </div>

            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
              {feedbackList.map((log) => (
                <div key={log.id} className="p-3 bg-stone-50 dark:bg-stone-900/30 border border-stone-200 dark:border-stone-800 rounded-lg space-y-2 text-xs relative animate-fadeIn">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-stone-800 dark:text-stone-200 capitalize text-[11px]">{log.category}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono ${
                        log.priority === 'High' ? 'bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400' : log.priority === 'Medium' ? 'bg-[#912A4A]/10 text-[#912A4A] dark:bg-[#912A4A]/20 dark:text-rose-300' : 'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400'
                      }`}>
                        {log.priority}
                      </span>
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleCopyAsMarkdown(log)}
                        title="Copy as GitHub Issue template"
                        className="text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 text-[10px] cursor-pointer font-mono"
                      >
                        {copiedId === log.id ? 'Copied' : 'Copy'}
                      </button>
                      <button
                        onClick={() => handleDeleteFeedback(log.id)}
                        className="text-stone-400 hover:text-red-500 text-[10px] cursor-pointer font-mono"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  <p className="text-stone-600 dark:text-stone-400 text-xs whitespace-pre-line leading-relaxed">
                    <strong>Happened</strong>: {log.whatHappened}
                  </p>
                  {log.whatExpected && (
                    <p className="text-stone-500 dark:text-stone-400 text-[11px] italic whitespace-pre-line leading-relaxed">
                      <strong>Expected</strong>: {log.whatExpected}
                    </p>
                  )}
                  <span className="text-[9px] text-stone-400 block text-right">
                    {new Date(log.timestamp).toLocaleString()}
                  </span>
                </div>
              ))}

              {feedbackList.length === 0 && (
                <p className="text-stone-400 text-xs italic text-left py-6">No feedback logs entered locally yet. Tell us your thoughts!</p>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-stone-50 dark:bg-stone-900/40 border-t border-stone-250 dark:border-stone-850 flex items-center justify-between text-[11px] text-stone-400">
          <span>Export Logs Later to GitHub Issues</span>
          <span className="font-mono text-[9px]">ID: {Math.round(JSON.stringify(feedbackList).length / 1024)} KB</span>
        </div>

      </div>
    </div>
  );
}
