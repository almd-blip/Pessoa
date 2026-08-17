/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';

export default function ReflectiveWins() {
  const [smallWins, setSmallWins] = useState<string[]>(() => {
    return JSON.parse(
      localStorage.getItem('wellbeing_small_wins') ||
        '["Completed literature outline of section 1.2", "Corrected DOI and metadata of two foundational papers"]'
    );
  });
  const [newWin, setNewWin] = useState('');

  useEffect(() => {
    const handleSyncWins = () => {
      setSmallWins(JSON.parse(localStorage.getItem('wellbeing_small_wins') || '[]'));
    };

    window.addEventListener('small_wins_updated', handleSyncWins);
    return () => {
      window.removeEventListener('small_wins_updated', handleSyncWins);
    };
  }, []);

  const handleAddWin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWin.trim()) return;
    const updated = [newWin.trim(), ...smallWins];
    setSmallWins(updated);
    localStorage.setItem('wellbeing_small_wins', JSON.stringify(updated));
    setNewWin('');
    window.dispatchEvent(new Event('small_wins_updated'));
  };

  const handleDeleteWin = (index: number) => {
    const updated = smallWins.filter((_, idx) => idx !== index);
    setSmallWins(updated);
    localStorage.setItem('wellbeing_small_wins', JSON.stringify(updated));
    window.dispatchEvent(new Event('small_wins_updated'));
  };

  return (
    <div className="py-2 pl-4 border-l-2 border-[#1d9e75]/50 space-y-4 text-left" id="reflective-wins-module">
      <div className="space-y-1">
        <h3 className="font-sans font-semibold text-xs uppercase tracking-wider text-stone-900 dark:text-stone-100 flex items-center gap-2">
          <span>Reflective wins and progress</span>
        </h3>
        <p className="font-sans text-xs text-stone-500 dark:text-stone-400 leading-relaxed font-light">
          Research contains almost no instant feedback loops. Track small micro-wins to foster momentum and acknowledge your project progression.
        </p>
      </div>

      {/* Logged Wins List */}
      <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
        {smallWins.map((win, idx) => (
          <div
            key={idx}
            className="p-3 bg-white/60 dark:bg-stone-900/60 border border-stone-200/70 dark:border-stone-800 rounded-lg flex justify-between items-center text-xs"
          >
            <div className="flex items-center gap-2.5">
              <span className="text-[#1d9e75] dark:text-[#28c093] font-bold">•</span>
              <span className="text-stone-800 dark:text-stone-200 leading-relaxed">{win}</span>
            </div>
            <button
              type="button"
              onClick={() => handleDeleteWin(idx)}
              className="text-stone-400 hover:text-red-500 text-xs px-2 py-1 rounded transition-colors cursor-pointer"
              title="Remove win"
            >
              Clear
            </button>
          </div>
        ))}

        {smallWins.length === 0 && (
          <div className="py-4 px-3 text-stone-400 dark:text-stone-500 text-xs italic text-left border border-dashed border-stone-200 dark:border-stone-800 rounded-lg">
            No micro-wins logged yet today. Simply checking in and moving an idea forward is progress.
          </div>
        )}
      </div>

      {/* Form */}
      <form onSubmit={handleAddWin} className="flex gap-2.5 pt-1">
        <label htmlFor="project-micro-win-input" className="sr-only">Record a micro win</label>
        <input
          id="project-micro-win-input"
          type="text"
          placeholder="Record a win (e.g., wrote paragraph 1, found an article, organized outline)..."
          value={newWin}
          onChange={(e) => setNewWin(e.target.value)}
          className="flex-grow font-sans text-xs p-2.5 border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-950 text-stone-800 dark:text-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1d9e75]"
          required
        />
        <button
          type="submit"
          className="font-sans text-xs bg-[#1d9e75] hover:bg-[#168260] dark:bg-[#28c093] dark:hover:bg-[#1e9a75] text-white dark:text-stone-950 px-4 py-2.5 rounded-lg font-semibold shadow-xs transition-colors cursor-pointer shrink-0"
        >
          Log win
        </button>
      </form>
    </div>
  );
}
