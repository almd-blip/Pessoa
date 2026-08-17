/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Calendar, 
  Flag, 
  FileText, 
  Users, 
  Clock, 
  Plus, 
  X, 
  Filter, 
  Target 
} from 'lucide-react';
import { ResearchJourney, TimelineEvent } from '../types';

interface ResearchTimelineProps {
  journeys: ResearchJourney[];
  activeJourneyId?: string;
  onSetActiveJourneyId?: (id: string) => void;
  onUpdateJourney?: (updated: ResearchJourney) => void;
  onAddMilestone?: (journeyId: string, event: Omit<TimelineEvent, 'id'>) => void;
}

export default function ResearchTimeline({
  journeys,
  activeJourneyId,
  onSetActiveJourneyId,
  onUpdateJourney,
  onAddMilestone,
}: ResearchTimelineProps) {
  const [selectedJourneyId, setSelectedJourneyId] = useState<string>(
    activeJourneyId || journeys[0]?.id || ''
  );
  const [filterType, setFilterType] = useState<string>('all');
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(null);
  const [isAddingEvent, setIsAddingEvent] = useState(false);

  // New Event Form State
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newType, setNewType] = useState<TimelineEvent['type']>('milestone');
  const [newDescription, setNewDescription] = useState('');

  const currentJourney =
    journeys.find((j) => j.id === (selectedJourneyId || activeJourneyId)) ||
    journeys[0];

  if (!currentJourney) {
    return (
      <div className="p-8 text-center text-stone-500 font-sans">
        <p className="text-xs">No active research project found to display timeline milestones.</p>
      </div>
    );
  }

  // Combine timeline events and tasks with due dates into unified timeline entries
  const eventsList: (TimelineEvent & { isTask?: boolean; completed?: boolean })[] = [
    ...(currentJourney.timeline || []),
    ...(currentJourney.tasks || [])
      .filter((t) => t.dueDate)
      .map((t) => ({
        id: `task_${t.id}`,
        title: t.text,
        date: t.dueDate || '',
        description: t.completed ? 'Completed project deliverable task' : 'Project deliverable task',
        type: 'draft' as const,
        isTask: true,
        completed: t.completed,
      })),
  ];

  // Sort events chronologically
  const sortedEvents = [...eventsList].sort((a, b) => {
    return new Date(a.date).getTime() - new Date(b.date).getTime();
  });

  // Filter events
  const filteredEvents = sortedEvents.filter((ev) => {
    if (filterType === 'all') return true;
    return ev.type === filterType;
  });

  // Calculate upcoming deadlines (future dates or dates in next 60 days)
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const getDaysRemaining = (dateStr: string) => {
    const target = new Date(dateStr);
    if (isNaN(target.getTime())) return null;
    const diffTime = target.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const upcomingDeadlines = sortedEvents
    .map((ev) => ({
      ...ev,
      daysRemaining: getDaysRemaining(ev.date),
    }))
    .filter((ev) => ev.daysRemaining !== null && ev.daysRemaining >= 0 && !ev.completed)
    .sort((a, b) => (a.daysRemaining || 0) - (b.daysRemaining || 0));

  const handleCreateEventSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDate) return;

    const newEv: TimelineEvent = {
      id: `ev_${Date.now()}`,
      title: newTitle.trim(),
      date: newDate,
      type: newType,
      description: newDescription.trim(),
    };

    if (onAddMilestone) {
      onAddMilestone(currentJourney.id, {
        title: newEv.title,
        date: newEv.date,
        type: newEv.type,
        description: newEv.description,
      });
    } else if (onUpdateJourney) {
      onUpdateJourney({
        ...currentJourney,
        timeline: [...currentJourney.timeline, newEv],
      });
    }

    setNewTitle('');
    setNewDate('');
    setNewType('milestone');
    setNewDescription('');
    setIsAddingEvent(false);
  };

  const getTypeIcon = (type: TimelineEvent['type']) => {
    switch (type) {
      case 'submission':
        return <Flag className="w-4 h-4" />;
      case 'milestone':
        return <Target className="w-4 h-4" />;
      case 'draft':
        return <FileText className="w-4 h-4" />;
      case 'meeting':
        return <Users className="w-4 h-4" />;
      default:
        return <Calendar className="w-4 h-4" />;
    }
  };

  const getTypeLabel = (type: TimelineEvent['type']) => {
    switch (type) {
      case 'milestone':
        return 'Milestone';
      case 'submission':
        return 'Submission';
      case 'draft':
        return 'Draft';
      case 'meeting':
        return 'Meeting';
      default:
        return 'Milestone';
    }
  };

  const getTypeColorClasses = (type: TimelineEvent['type']) => {
    switch (type) {
      case 'submission':
        return 'bg-[#912A4A]/10 text-[#912A4A] border-[#912A4A]/30';
      case 'milestone':
        return 'bg-[#1D9E75]/10 text-[#1D9E75] border-[#1D9E75]/30';
      case 'draft':
        return 'bg-[#912A4A]/10 text-[#912A4A] border-[#912A4A]/30';
      case 'meeting':
        return 'bg-[#1B0A3B]/10 text-[#1B0A3B] border-[#1B0A3B]/30 dark:text-indigo-300';
      default:
        return 'bg-stone-100 text-stone-700 border-stone-200';
    }
  };

  return (
    <div className="space-y-6 font-sans text-left animate-fadeIn">
      {/* UNBOXED HEADER & PROJECT SELECTOR - MATCHING REFLECTIVE WINS & PROJECT PLAN FORMATTING */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-stone-200/80 dark:border-stone-800/80 pb-4">
        <div>
          <h2 className="font-sans font-bold text-lg sm:text-xl text-[#1B0A3B] dark:text-stone-100">
            Research project milestones & timeline
          </h2>
          <p className="text-xs text-stone-600 dark:text-stone-400 mt-0.5">
            Key deliverables, supervisor checkpoints, and submission deadlines for <strong className="text-[#1B0A3B] dark:text-stone-200 font-semibold">{currentJourney.title}</strong>.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
          {journeys.length > 1 && (
            <select
              value={currentJourney.id}
              onChange={(e) => {
                setSelectedJourneyId(e.target.value);
                if (onSetActiveJourneyId) onSetActiveJourneyId(e.target.value);
              }}
              className="font-sans text-xs px-3 py-1.5 rounded-lg bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-[#1B0A3B] dark:text-stone-200 font-medium cursor-pointer"
              aria-label="Select research project"
            >
              {journeys.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.title}
                </option>
              ))}
            </select>
          )}

          <button
            type="button"
            onClick={() => setIsAddingEvent(!isAddingEvent)}
            className="px-3.5 py-1.5 bg-[#1D9E75] text-white hover:bg-[#168562] rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            id="add-milestone-btn"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{isAddingEvent ? 'Close form' : 'Add milestone'}</span>
          </button>
        </div>
      </div>

      {/* Target Deadline Banner if exists */}
      {currentJourney.targetDeadline && (
        <div className="p-3.5 rounded-lg bg-stone-50/50 dark:bg-stone-900/30 border-l-2 border-[#912A4A] flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-[#1B0A3B] dark:text-stone-200 font-medium">
            <Target className="w-4 h-4 text-[#912A4A]" />
            <span>Target submission deadline:</span>
            <span className="font-semibold text-[#912A4A]">{currentJourney.targetDeadline}</span>
          </div>
          {(() => {
            const days = getDaysRemaining(currentJourney.targetDeadline);
            if (days !== null) {
              return (
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-md font-medium ${
                    days <= 14
                      ? 'bg-[#912A4A] text-white'
                      : days <= 45
                      ? 'bg-[#1B0A3B] text-white'
                      : 'bg-[#1D9E75] text-white'
                  }`}
                >
                  {days === 0 ? 'Due today' : days > 0 ? `${days} days left` : 'Passed'}
                </span>
              );
            }
            return null;
          })()}
        </div>
      )}

      {/* ADD MILESTONE FORM DRAWER */}
      {isAddingEvent && (
        <form
          onSubmit={handleCreateEventSubmit}
          className="pl-4 border-l-2 border-[#1D9E75] py-2 space-y-4 animate-fadeIn"
        >
          <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-2">
            <h3 className="font-sans font-semibold text-xs text-[#1B0A3B] dark:text-stone-100 flex items-center gap-2">
              <Plus className="w-4 h-4 text-[#1D9E75]" />
              Add research milestone or deadline
            </h3>
            <button
              type="button"
              onClick={() => setIsAddingEvent(false)}
              className="text-stone-400 hover:text-stone-600 p-1 cursor-pointer"
              aria-label="Close form"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
            <div>
              <label className="block font-sans text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Milestone title *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Chapter 2 Methodology Draft"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full font-sans text-xs p-2.5 border border-stone-300 dark:border-stone-700 rounded-lg bg-white dark:bg-stone-950 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-[#1D9E75]"
              />
            </div>

            <div>
              <label className="block font-sans text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Target date *
              </label>
              <input
                type="date"
                required
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                className="w-full font-sans text-xs p-2.5 border border-stone-300 dark:border-stone-700 rounded-lg bg-white dark:bg-stone-950 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-[#1D9E75]"
              />
            </div>

            <div>
              <label className="block font-sans text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Category
              </label>
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value as TimelineEvent['type'])}
                className="w-full font-sans text-xs p-2.5 border border-stone-300 dark:border-stone-700 rounded-lg bg-white dark:bg-stone-950 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-[#1D9E75]"
              >
                <option value="milestone">Milestone</option>
                <option value="submission">Submission / Gate</option>
                <option value="draft">Draft completion</option>
                <option value="meeting">Supervisor meeting</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block font-sans text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Description / Notes
              </label>
              <input
                type="text"
                placeholder="Key deliverables, required documents, or agenda..."
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                className="w-full font-sans text-xs p-2.5 border border-stone-300 dark:border-stone-700 rounded-lg bg-white dark:bg-stone-950 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-[#1D9E75]"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-stone-100 dark:border-stone-800">
            <button
              type="button"
              onClick={() => setIsAddingEvent(false)}
              className="px-3 py-1.5 text-xs text-stone-600 hover:text-stone-900 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-[#1D9E75] text-white rounded-lg text-xs font-medium cursor-pointer hover:bg-[#168562]"
            >
              Save milestone
            </button>
          </div>
        </form>
      )}

      {/* UPCOMING DEADLINES HIGHLIGHT BAR - Unboxed */}
      {upcomingDeadlines.length > 0 && (
        <div className="pl-4 border-l-2 border-[#912A4A]/40 space-y-3 text-left">
          <div className="flex items-center justify-between">
            <h3 className="font-sans font-semibold text-xs text-[#912A4A] dark:text-rose-400 flex items-center gap-1.5 uppercase tracking-wider">
              <Calendar className="w-3.5 h-3.5" />
              Upcoming deadlines
            </h3>
            <span className="text-xs text-stone-500">
              {upcomingDeadlines.length} pending milestone{upcomingDeadlines.length > 1 ? 's' : ''}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {upcomingDeadlines.slice(0, 3).map((item) => (
              <div
                key={item.id}
                onClick={() => setSelectedEvent(item)}
                className="p-3 bg-white/60 dark:bg-stone-900/60 rounded-lg border border-stone-200/80 dark:border-stone-750 hover:border-[#1D9E75] transition-colors cursor-pointer space-y-1.5 group"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded border ${getTypeColorClasses(item.type)}`}>
                    {getTypeLabel(item.type)}
                  </span>
                  <span className="text-xs font-semibold text-[#912A4A]">
                    {item.daysRemaining === 0 ? 'Due today' : `In ${item.daysRemaining} days`}
                  </span>
                </div>
                <h4 className="font-sans font-semibold text-xs text-[#1B0A3B] dark:text-stone-100 group-hover:text-[#1D9E75] transition-colors line-clamp-1">
                  {item.title}
                </h4>
                <div className="flex items-center gap-1 text-xs text-stone-500">
                  <Clock className="w-3 h-3" />
                  <span>{item.date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* HORIZONTAL TIMELINE VISUALIZER - Unboxed */}
      <div className="pl-4 border-l-2 border-stone-200 dark:border-stone-800 space-y-4 text-left">
        {/* Visualizer Filters & Controls with sentence case */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-150 dark:border-stone-850 pb-3">
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-stone-500" />
            <span className="font-sans text-xs font-semibold text-[#1B0A3B] dark:text-stone-200">
              Timeline filter:
            </span>
            <div className="flex items-center gap-1 font-sans text-xs">
              {[
                { id: 'all', label: 'All' },
                { id: 'milestone', label: 'Milestone' },
                { id: 'submission', label: 'Submission' },
                { id: 'draft', label: 'Draft' },
                { id: 'meeting', label: 'Meeting' }
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setFilterType(item.id as any)}
                  className={`px-2.5 py-1 rounded-md transition-colors text-xs cursor-pointer ${
                    filterType === item.id
                      ? 'bg-[#1B0A3B] text-white dark:bg-stone-800 font-medium'
                      : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="text-xs text-stone-500">
            Scroll horizontally to navigate roadmap &rarr;
          </div>
        </div>

        {/* Scrollable Horizontal Track */}
        {filteredEvents.length === 0 ? (
          <div className="py-12 text-center text-xs text-stone-500 font-sans">
            No milestones or tasks matching filter "{filterType}". Click "+ Add milestone" to log one.
          </div>
        ) : (
          <div className="relative overflow-x-auto pb-6 pt-4 px-2 scrollbar-thin">
            {/* Background Horizontal Line */}
            <div className="absolute top-12 left-0 right-0 h-0.5 bg-stone-200 dark:bg-stone-800 -z-0" />

            {/* Event Nodes Row */}
            <div className="flex items-start gap-8 min-w-max relative z-10 px-4">
              {filteredEvents.map((ev, index) => {
                const days = getDaysRemaining(ev.date);
                const isUpcoming = days !== null && days >= 0 && days <= 60 && !ev.completed;
                const isPast = days !== null && days < 0;
                const isSelected = selectedEvent?.id === ev.id;

                return (
                  <div
                    key={ev.id || index}
                    onClick={() => setSelectedEvent(ev)}
                    className="flex flex-col items-center w-52 shrink-0 group cursor-pointer"
                  >
                    {/* Date Pill above Node */}
                    <span className="text-xs text-stone-600 dark:text-stone-300 bg-stone-100 dark:bg-stone-800 px-2 py-0.5 rounded-md border border-stone-200/60 dark:border-stone-700 mb-2 group-hover:border-[#1D9E75] transition-colors">
                      {ev.date}
                    </span>

                    {/* Timeline Node Symbol */}
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 ${
                        isUpcoming
                          ? 'ring-4 ring-[#912A4A]/20 bg-[#912A4A] text-white scale-110 shadow-md'
                          : ev.completed
                          ? 'bg-[#1D9E75] text-white'
                          : isPast
                          ? 'bg-stone-200 dark:bg-stone-800 text-stone-500 border border-stone-300'
                          : 'bg-white dark:bg-stone-850 text-[#1B0A3B] dark:text-stone-200 border-2 border-[#912A4A] dark:border-rose-400'
                      } ${isSelected ? 'ring-4 ring-[#1D9E75]/40 scale-115' : 'group-hover:scale-110'}`}
                    >
                      {getTypeIcon(ev.type)}
                    </div>

                    {/* Connecting Vertical Line Segment */}
                    <div className="w-0.5 h-3 bg-stone-200 dark:bg-stone-800 my-1" />

                    {/* Event Card */}
                    <div
                      className={`w-full p-3 rounded-lg border text-left transition-all ${
                        isSelected
                          ? 'bg-stone-50 dark:bg-stone-850 border-[#1D9E75] shadow-xs'
                          : 'bg-white dark:bg-stone-950 border-stone-200/80 dark:border-stone-800 group-hover:border-[#912A4A] dark:group-hover:border-rose-400'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className={`text-xs px-1.5 py-0.5 rounded border font-medium ${getTypeColorClasses(ev.type)}`}>
                          {getTypeLabel(ev.type)}
                        </span>
                        {isUpcoming && (
                          <span className="text-xs font-semibold text-[#912A4A] bg-[#912A4A]/10 px-1 rounded">
                            {days === 0 ? 'Today' : `${days}d`}
                          </span>
                        )}
                      </div>

                      <h4 className="font-sans font-semibold text-xs text-[#1B0A3B] dark:text-stone-100 line-clamp-2">
                        {ev.title}
                      </h4>

                      {ev.description && (
                        <p className="font-sans text-xs text-stone-500 dark:text-stone-400 line-clamp-2 mt-1">
                          {ev.description}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* SELECTED EVENT DETAIL DRAWER CARD */}
      {selectedEvent && (
        <div className="p-5 bg-stone-50 dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 space-y-3 shadow-xs animate-fadeIn">
          <div className="flex items-start justify-between gap-3 border-b border-stone-200/70 dark:border-stone-800 pb-2">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-0.5 rounded border font-semibold ${getTypeColorClasses(selectedEvent.type)}`}>
                  {getTypeLabel(selectedEvent.type)}
                </span>
                <span className="text-xs text-[#912A4A] font-semibold">
                  Date: {selectedEvent.date}
                </span>
              </div>
              <h3 className="font-sans font-bold text-base text-[#1B0A3B] dark:text-stone-100">
                {selectedEvent.title}
              </h3>
            </div>

            <button
              type="button"
              onClick={() => setSelectedEvent(null)}
              className="text-stone-400 hover:text-stone-600 p-1 cursor-pointer"
              aria-label="Close details"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="font-sans text-xs text-stone-700 dark:text-stone-300 leading-relaxed">
            {selectedEvent.description || 'No detailed description logged for this milestone.'}
          </p>

          <div className="flex justify-end gap-2 pt-2 border-t border-stone-200/60 dark:border-stone-800">
            <button
              type="button"
              onClick={() => setSelectedEvent(null)}
              className="px-3 py-1.5 bg-stone-900 text-white rounded-lg text-xs font-medium cursor-pointer"
            >
              Done viewing
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
