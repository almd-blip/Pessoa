/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';

interface FeedbackLog {
  id: string;
  timestamp: string;
  category: 'Bug' | 'Accessibility' | 'Missing feature' | 'Wording' | 'Emotional friction' | 'Delight' | 'Idea';
  priority: 'Low' | 'Medium' | 'High';
  whatHappened: string;
  whatExpected: string;
}

export default function FeedbackView() {
  const [category, setCategory] = useState<FeedbackLog['category']>('Idea');
  const [priority, setPriority] = useState<FeedbackLog['priority']>('Medium');
  const [whatHappened, setWhatHappened] = useState('');
  const [whatExpected, setWhatExpected] = useState('');
  const [feedbackList, setFeedbackList] = useState<FeedbackLog[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Load saved feedback on mount
  useEffect(() => {
    const logs = JSON.parse(localStorage.getItem('scholar_feedback_logs') || '[]');
    setFeedbackList(logs);
  }, []);

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
    <div className="w-full space-y-6 text-left font-sans pb-16" id="feedback-module-view">
      
      {/* Header */}
      <div className="border-b border-stone-200 dark:border-stone-800 pb-5">
        <h1 className="font-sans font-medium tracking-tight text-3xl text-stone-900 dark:text-stone-100 flex items-center gap-2">
          Share feedback
        </h1>
        <p className="font-sans text-stone-500 text-sm mt-1.5 leading-relaxed">
          Help us shape the companion. We capture your physical and emotional friction, wording changes, accessibility blocks, or delightful moments. All feedback is saved offline locally.
        </p>
      </div>

      {toastMessage && (
        <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 p-3.5 rounded-lg flex items-center gap-2 text-xs text-emerald-800 dark:text-emerald-300 animate-fadeIn">
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        
        {/* Form Column */}
        <div className="md:col-span-5 space-y-4">
          <h2 className="text-base font-semibold text-stone-900 dark:text-stone-100">Log new feedback</h2>
          
          <form onSubmit={handleSaveFeedback} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {/* Category */}
              <div className="space-y-1">
                <label htmlFor="feedback-cat-select" className="text-[10px] text-stone-400 dark:text-stone-500 font-bold">Category</label>
                <select
                  id="feedback-cat-select"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as FeedbackLog['category'])}
                  className="w-full text-xs p-2.5 border border-stone-200 dark:border-stone-850 rounded-lg bg-white dark:bg-stone-950 text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
                >
                  <option value="Idea">Idea</option>
                  <option value="Bug">Bug</option>
                  <option value="Accessibility">Accessibility</option>
                  <option value="Missing feature">Missing feature</option>
                  <option value="Wording">Wording</option>
                  <option value="Emotional friction">Emotional friction</option>
                  <option value="Delight">Delight</option>
                </select>
              </div>

              {/* Priority */}
              <div className="space-y-1">
                <label htmlFor="feedback-priority-select" className="text-[10px] text-stone-400 dark:text-stone-500 font-bold">Priority</label>
                <select
                  id="feedback-priority-select"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as FeedbackLog['priority'])}
                  className="w-full text-xs p-2.5 border border-stone-200 dark:border-stone-850 rounded-lg bg-white dark:bg-stone-950 text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>
            </div>

            {/* What happened? */}
            <div className="space-y-1">
              <label htmlFor="feedback-happened-input" className="text-[10px] text-stone-400 dark:text-stone-500 font-bold">What is your feedback or observation?</label>
              <textarea
                id="feedback-happened-input"
                rows={4}
                value={whatHappened}
                onChange={(e) => setWhatHappened(e.target.value)}
                placeholder="Detail what happened, the friction you felt, or the suggestion you have..."
                className="w-full text-xs p-3 border border-stone-200 dark:border-stone-850 rounded-lg bg-white dark:bg-stone-950 text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
                required
              />
            </div>

            {/* Expected behavior */}
            <div className="space-y-1">
              <label htmlFor="feedback-expected-input" className="text-[10px] text-stone-400 dark:text-stone-500 font-bold">What would make this feel better or work better? (optional)</label>
              <textarea
                id="feedback-expected-input"
                rows={3}
                value={whatExpected}
                onChange={(e) => setWhatExpected(e.target.value)}
                placeholder="Describe any ideas you have for refinement..."
                className="w-full text-xs p-3 border border-stone-200 dark:border-stone-850 rounded-lg bg-white dark:bg-stone-950 text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

            <button
              type="submit"
              className="w-full text-xs font-semibold p-3 rounded-lg bg-stone-900 text-stone-100 hover:bg-stone-800 dark:bg-stone-800 dark:hover:bg-stone-700 transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm"
            >
              Save feedback log
            </button>
          </form>
        </div>

        {/* List Column */}
        <div className="md:col-span-7 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-base font-semibold text-stone-900 dark:text-stone-100">Saved logs ({feedbackList.length})</h2>
            {feedbackList.length > 0 && (
              <button
                onClick={handleDownloadLogs}
                className="text-[10px] font-mono border border-stone-200 dark:border-stone-850 px-2 py-1 rounded bg-stone-50 dark:bg-stone-900 text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 flex items-center gap-1.5 cursor-pointer"
              >
                Export JSON
              </button>
            )}
          </div>

          {feedbackList.length === 0 ? (
            <div className="border border-dashed border-stone-200 dark:border-stone-800 rounded-xl p-8 text-center text-stone-400 dark:text-stone-600">
              <p className="text-xs">No feedback has been logged yet.</p>
              <p className="text-[10px] mt-1 text-stone-400">Your entries will be displayed here in historical reverse order.</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
              {feedbackList.map((log) => (
                <div key={log.id} className="p-4 border border-stone-200 dark:border-stone-850 rounded-xl bg-white dark:bg-stone-950 hover:shadow-xs transition-shadow">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded-full uppercase font-bold tracking-wider ${
                        log.category === 'Bug' ? 'bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400' :
                        log.category === 'Accessibility' ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/20 dark:text-indigo-400' :
                        log.category === 'Emotional friction' ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400' :
                        log.category === 'Delight' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400' :
                        'bg-stone-100 text-stone-600 dark:bg-stone-900 dark:text-stone-400'
                      }`}>
                        {log.category}
                      </span>
                      <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded-full ${
                        log.priority === 'High' ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/20' :
                        log.priority === 'Medium' ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/20' :
                        'bg-stone-100 text-stone-500'
                      }`}>
                        {log.priority} priority
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs">
                      <button
                        onClick={() => handleCopyAsMarkdown(log)}
                        className="text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 px-2 py-0.5 rounded hover:bg-stone-100 dark:hover:bg-stone-900 cursor-pointer font-mono text-[10px]"
                        title="Copy as Markdown"
                      >
                        {copiedId === log.id ? 'Copied' : 'Copy'}
                      </button>
                      <button
                        onClick={() => handleDeleteFeedback(log.id)}
                        className="text-stone-400 hover:text-red-600 dark:hover:text-red-400 px-2 py-0.5 rounded hover:bg-stone-100 dark:hover:bg-stone-900 cursor-pointer font-mono text-[10px]"
                        title="Delete log"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  <div className="mt-3 space-y-2 text-xs">
                    <div>
                      <span className="text-[10px] text-stone-400 block font-semibold">Feedback:</span>
                      <p className="text-stone-700 dark:text-stone-300 whitespace-pre-line leading-relaxed mt-0.5 font-sans font-light">
                        {log.whatHappened}
                      </p>
                    </div>

                    {log.whatExpected && (
                      <div className="pt-2 border-t border-stone-100 dark:border-stone-900">
                        <span className="text-[10px] text-stone-400 block font-semibold">Ideal behavior:</span>
                        <p className="text-stone-600 dark:text-stone-400 whitespace-pre-line leading-relaxed mt-0.5 font-sans font-light">
                          {log.whatExpected}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="mt-3.5 pt-2 border-t border-stone-100 dark:border-stone-900 flex justify-between items-center text-[9px] font-mono text-stone-400">
                    <span>ID: #{log.id}</span>
                    <span>{new Date(log.timestamp).toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
