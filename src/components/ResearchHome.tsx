/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ResearchJourney, Paper, MoodCheckIn } from '../types';

interface ResearchHomeProps {
  journeys: ResearchJourney[];
  papers: Paper[];
  onSelectJourney: (id: string) => void;
  onSetTab: (tab: string) => void;
  onAddMoodCheckIn: (mood: MoodCheckIn) => void;
  moodCheckIns: MoodCheckIn[];
}

export default function ResearchHome({
  journeys,
  papers,
  onSelectJourney,
  onSetTab,
  onAddMoodCheckIn,
  moodCheckIns,
}: ResearchHomeProps) {
  // Read and write active project type
  const [projectType, setProjectType] = useState<string>(() => {
    return localStorage.getItem('scholar_project_type') || '';
  });

  const [savedFocus, setSavedFocus] = useState(() => {
    return localStorage.getItem('daily_focus') || '';
  });
  const [customFocus, setCustomFocus] = useState('');
  const [advisorMessage, setAdvisorMessage] = useState<any>(null);
  const [loadingAdvisor, setLoadingAdvisor] = useState(false);

  // States for adding custom project types
  const [isAddingCustom, setIsAddingCustom] = useState(false);
  const [newEmoji, setNewEmoji] = useState('🎓');
  const [newLabel, setNewLabel] = useState('');
  const [newTip, setNewTip] = useState('');

  // Sync project type selection
  const handleSelectProjectType = (type: string) => {
    setProjectType(type);
    localStorage.setItem('scholar_project_type', type);
  };

  const defaultProjectTypes = [
    { label: 'Essay', emoji: '📄', id: 'essay', tip: 'An essay is a single elegant argument. Focus on refining your thesis statement and linking core paragraphs.' },
    { label: 'Dissertation', emoji: '🎓', id: 'dissertation', tip: 'Dissertations are milestones of endurance. Focus on structuring clean chapters and organising key citation clusters.' },
    { label: 'Literature review', emoji: '📚', id: 'literature_review', tip: 'A literature review synthesises connections. Focus on building the theme matrix and mapping paper connections.' },
    { label: 'PhD thesis', emoji: '📖', id: 'phd_thesis', tip: 'A doctoral journey is an original conversation. Anchor yourself in small milestones, and communicate regularly with your support networks.' },
    { label: 'Journal article', emoji: '📝', id: 'journal_article', tip: 'Journal entries require succinct precision. Focus on clarifying your methodology and summarising core evidence matrices.' },
    { label: 'Funding application', emoji: '💷', id: 'funding_application', tip: 'Funding applications require aligning with criteria. Keep your outcomes specific and outline direct social value.' },
    { label: 'Policy research', emoji: '🏛', id: 'policy_research', tip: 'Policy research bridges theory and action. Frame evidence blocks clearly so key stakeholders can interpret them easily.' },
    { label: 'Research project', emoji: '📊', id: 'research_project', tip: 'A research project is a rich, organic exploration. Rely on your local database logs to trace emerging notes and concepts.' },
    { label: 'Something else', emoji: '➕', id: 'something_else', tip: 'Every research inquiry is valid. Trust your curiosity and take it one small, structured step at a time.' }
  ];

  const [projectTypes, setProjectTypes] = useState<typeof defaultProjectTypes>(() => {
    const saved = localStorage.getItem('scholar_custom_project_types');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Put custom ones right before "something_else" or at the end
          const somethingElse = defaultProjectTypes.find(p => p.id === 'something_else');
          const defaultsWithoutSomethingElse = defaultProjectTypes.filter(p => p.id !== 'something_else');
          return [...defaultsWithoutSomethingElse, ...parsed, somethingElse].filter(Boolean) as typeof defaultProjectTypes;
        }
      } catch (e) {
        console.error(e);
      }
    }
    return defaultProjectTypes;
  });

  const handleAddCustomProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabel.trim()) return;

    const id = 'custom_' + Date.now();
    const newProject = {
      label: newLabel.trim(),
      emoji: newEmoji.trim() || '📝',
      id,
      tip: newTip.trim() || `Your custom ${newLabel.trim()} journey. Trust your curiosity and take it one small, structured step at a time.`
    };

    const saved = localStorage.getItem('scholar_custom_project_types');
    let customList = [];
    if (saved) {
      try {
        customList = JSON.parse(saved);
        if (!Array.isArray(customList)) customList = [];
      } catch (e) {
        customList = [];
      }
    }
    customList.push(newProject);
    localStorage.setItem('scholar_custom_project_types', JSON.stringify(customList));

    const somethingElse = defaultProjectTypes.find(p => p.id === 'something_else');
    const defaultsWithoutSomethingElse = defaultProjectTypes.filter(p => p.id !== 'something_else');
    setProjectTypes([...defaultsWithoutSomethingElse, ...customList, somethingElse].filter(Boolean) as typeof defaultProjectTypes);

    // Auto-select newly created project type
    handleSelectProjectType(id);

    // Reset form
    setNewLabel('');
    setNewTip('');
    setNewEmoji('🎓');
    setIsAddingCustom(false);
  };

  const focusPresets = [
    'Read one paper',
    'Summarise one paragraph',
    'Write 150 words',
    'Organise five references',
    'Revise one section'
  ];

  const arrivalMoods: { label: string; value: MoodCheckIn['state']; desc: string; emoji: string }[] = [
    { label: 'Focused', value: 'focused', desc: 'Ready for deep, uninterrupted thinking', emoji: '✨' },
    { label: 'Curious', value: 'curious', desc: 'Exploring alternative links and pathways', emoji: '🔍' },
    { label: 'Overwhelmed', value: 'overwhelmed', desc: 'Drowning in literature and expectations', emoji: '🌊' },
    { label: 'Stuck', value: 'stuck', desc: 'Facing a cognitive wall or blocker', emoji: '🧱' },
    { label: 'Doubting myself', value: 'doubting', desc: 'Feeling like an impostor or fraud', emoji: '💭' },
    { label: 'Tired', value: 'tired', desc: 'Low energy, physical or mental fatigue', emoji: '💤' },
    { label: 'Avoiding writing', value: 'avoiding_writing', desc: 'Dreading the blank page or editing', emoji: '🫣' },
    { label: 'Anxious', value: 'anxious', desc: 'Nervous system feels alert or heavy', emoji: '🌪️' }
  ];

  // Map emotions to gentle supportive guidance
  const handleMoodSelect = async (state: MoodCheckIn['state']) => {
    const newCheckIn: MoodCheckIn = {
      id: Math.random().toString(),
      timestamp: new Date().toISOString(),
      state,
    };
    onAddMoodCheckIn(newCheckIn);
    setLoadingAdvisor(true);

    try {
      // Consult Gemini on the server for mood-based academic advice
      const res = await fetch('/api/gemini/advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          moodState: state,
          projectDetails: journeys[0] ? `${journeys[0].title}: ${journeys[0].description}` : 'Academic inquiry',
          question: `I am feeling ${state} today. Please guide me.`,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setAdvisorMessage(data);
      } else {
        setAdvisorMessage(getFallbackAdvice(state));
      }
    } catch (err) {
      console.error(err);
      setAdvisorMessage(getFallbackAdvice(state));
    } finally {
      setLoadingAdvisor(false);
    }
  };

  const getFallbackAdvice = (state: MoodCheckIn['state']) => {
    const fallbackMap: Record<string, any> = {
      focused: {
        mentoringResponse: "Outstanding. You are in a high-focus zone. Protect this boundary. Turn off communications and dive into drafting or complex structuring.",
        actionSteps: ["Write down your single focus goal", "Close all browser tabs except reference papers", "Engage in 25 minutes of deep work"],
        reflectionPrompt: "What is the single most valuable paragraph you want to complete in this session?"
      },
      curious: {
        mentoringResponse: "Curiosity is the engine of original scholarship. Follow the rabbit hole today, but keep a tracing log to avoid getting lost.",
        actionSteps: ["Browse index pages of your favorite collection", "Sketch a quick conceptual link in the knowledge graph", "Jot down three speculative questions"],
        reflectionPrompt: "What hidden connections might exist between your primary question and your secondary field?"
      },
      overwhelmed: {
        mentoringResponse: "A common and valid response to high-density creative and research spaces. Overwhelm is simply cognitive capacity reaching its temporary limit. There is no need to make massive progress today.",
        actionSteps: ["Choose just one paper", "Read just one page", "Make just one note"],
        reflectionPrompt: "If you could only do one 5-minute task today to release pressure, what would it be?"
      },
      stuck: {
        mentoringResponse: "Being stuck is a critical stage of learning, not a defect. It indicates your brain is integrating conflicting concepts. It is an intellectual milestone.",
        actionSteps: ["Write a paragraph explaining exactly WHY you are stuck, in plain language", "Look up the methodology section of an opposing paper", "Disconnect from screens and sketch a visual flow chart"],
        reflectionPrompt: "How would you explain your current blockage to a 10-year-old?"
      },
      doubting: {
        mentoringResponse: "Imposter phenomenon is the psychological tax of working alongside dedicated minds. It is a predictable base-rate error, not a reflection of your intelligence.",
        actionSteps: ["Read the Impostor Support Guide in the Wellbeing Centre", "Record one small win in your daily focus tracker", "List three active decisions you made that led to your progress"],
        reflectionPrompt: "What evidence supports your capability today rather than your fears?"
      },
      tired: {
        mentoringResponse: "Scholarly research is a marathon, not a dash. Fatigue degrades cognitive synthesis. Rest is not a reward for completing work; it is a metabolic necessity.",
        actionSteps: ["Test the 'End of session sound' chime in Focus space", "Read an abstract in calm reading mode without taking notes", "Do a metadata-only review of 3 references in the Library"],
        reflectionPrompt: "How can you adapt your desk setup or schedule to prioritize physical decompression today?"
      },
      avoiding_writing: {
        mentoringResponse: "Avoidance is almost always about the fear of falling short of our own standards. Give yourself permission to write terribly today. Polish later.",
        actionSteps: ["Set a timer for 10 minutes", "Write absolute nonsense or messy notes without correcting typos", "Celebrate completing the draft paragraph"],
        reflectionPrompt: "What would this paragraph look like if it didn't have to be perfect?"
      },
      anxious: {
        mentoringResponse: "Anxiety is your nervous system trying to protect you. Acknowledge its presence. You are safe here, and your value is completely separate from your research.",
        actionSteps: ["Inhale for 4 seconds, exhale for 6", "Select an incredibly simple task, like organizing two author names", "Check the self-care reflection list in the Wellbeing Centre"],
        reflectionPrompt: "Can you release your shoulders, relax your jaw, and give yourself grace for the next hour?"
      }
    };
    return fallbackMap[state] || fallbackMap['overwhelmed'];
  };

  const handleSaveFocus = (text: string) => {
    localStorage.setItem('daily_focus', text);
    setSavedFocus(text);
  };

  const handleClearFocus = () => {
    // Save to local small wins first for delight!
    const win = `Accomplished: ${savedFocus}`;
    const cachedWins = JSON.parse(localStorage.getItem('wellbeing_small_wins') || '[]');
    const updated = [win, ...cachedWins];
    localStorage.setItem('wellbeing_small_wins', JSON.stringify(updated));

    localStorage.removeItem('daily_focus');
    setSavedFocus('');
    
    // Dispatch custom event to update other components if listening
    window.dispatchEvent(new Event('small_wins_updated'));
  };

  const latestMood = moodCheckIns && moodCheckIns.length > 0 ? moodCheckIns[moodCheckIns.length - 1] : undefined;

  // Find active project type tip
  const activeProjectInfo = projectTypes.find(p => p.id === projectType);

  return (
    <div className="space-y-10 w-full font-sans text-left" id="research-home-module">
      
      {/* 1. Gentle supportive welcome */}
      <div className="border-b border-stone-200 dark:border-stone-800 pb-5">
        <h1 className="font-sans font-medium tracking-tight text-3xl text-stone-900 dark:text-stone-100">
          Hello, fellow researcher.
        </h1>
        <p className="font-sans text-stone-500 text-sm mt-1.5 leading-relaxed">
          Take a slow breath. You are here, and that is enough. This is your quiet space to explore, structure, and nurture your ideas without pressure.
        </p>
      </div>

      {/* 2. ARRIVING STATE: How are you arriving today? */}
      <section className="space-y-4">
        <h2 className="font-sans font-medium text-stone-950 dark:text-stone-100 text-lg flex items-center gap-2 border-b border-stone-100 dark:border-stone-850 pb-2.5">
          How are you arriving today?
        </h2>
        <p className="font-sans text-xs text-stone-500 leading-relaxed">
          Select your current physical or emotional state. We offer gentle, non-shaming strategies to fit your level of energy.
        </p>

        <div className="flex gap-3 overflow-x-auto pb-3 pt-1 scroll-smooth select-none snap-x snap-mandatory" style={{ scrollbarWidth: 'thin' }}>
          {arrivalMoods.map((m) => (
            <button
              key={m.value}
              onClick={() => handleMoodSelect(m.value)}
              className={`p-3 rounded-lg text-left border font-sans transition-all flex items-center justify-between gap-3 cursor-pointer shrink-0 snap-start focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#912A4A] h-12 min-w-[150px] md:min-w-[170px] ${
                latestMood?.state === m.value
                  ? 'bg-[#912A4A]/10 border-[#912A4A]/35 dark:border-rose-800/80 text-[#912A4A] dark:text-rose-300 shadow-xs'
                  : 'bg-white dark:bg-stone-950 border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-750'
              }`}
            >
              <span className="text-xs font-semibold text-stone-800 dark:text-stone-200 truncate">{m.label}</span>
              <span className="text-base shrink-0">{m.emoji}</span>
            </button>
          ))}
        </div>

        {latestMood && (
          <div className="text-[10px] font-sans text-stone-400 flex items-center gap-1.5 justify-end">
            <span>Arrived as:</span>
            <span className="font-semibold text-stone-600 dark:text-stone-300 capitalize">{latestMood.state.replace('_', ' ')}</span>
            <span>({new Date(latestMood.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})</span>
          </div>
        )}

        {/* Companion reflection dialogue nested immediately after check-in - Unboxed */}
        {(loadingAdvisor || advisorMessage) && (
          <div className="pl-4 border-l-2 border-[#912A4A]/50 py-2 relative animate-fadeIn mt-4 text-left space-y-4">
            {loadingAdvisor ? (
              <div className="flex items-center gap-3 py-3 text-stone-500">
                <div className="w-4 h-4 border-2 border-[#912A4A] border-t-transparent dark:border-rose-400 dark:border-t-transparent rounded-full animate-spin"></div>
                <p className="font-sans text-xs italic">Thinking softly, organizing compassionate check-in steps...</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-sans font-semibold text-xs text-[#912A4A] dark:text-rose-400 uppercase tracking-wider">
                    Companion reflection
                  </h3>
                </div>

                <p className="font-sans text-stone-800 dark:text-stone-200 text-sm leading-relaxed whitespace-pre-line italic font-light max-w-4xl">
                  "{advisorMessage.mentoringResponse}"
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-3 border-t border-stone-200/60 dark:border-stone-800/60">
                  <div>
                    <h4 className="font-sans font-semibold text-xs text-stone-900 dark:text-stone-100 mb-2">
                      Suggested micro-steps:
                    </h4>
                    <ul className="space-y-1.5">
                      {advisorMessage.actionSteps?.map((step: string, index: number) => (
                        <li key={index} className="font-sans text-xs text-stone-600 dark:text-stone-400 flex items-start gap-2 font-light">
                          <span className="font-mono text-[10px] text-[#912A4A] dark:text-rose-400 font-bold">•</span>
                          <span className="leading-relaxed">{step}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-sans font-semibold text-xs text-stone-900 dark:text-stone-100 mb-2">
                      Reflective prompt to sit with:
                    </h4>
                    <p className="font-sans text-xs text-stone-600 dark:text-stone-400 leading-relaxed italic font-light pl-3 border-l border-stone-200 dark:border-stone-800">
                      {advisorMessage.reflectionPrompt}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      {/* 3. QUESTION: What are you working on today? */}
      <section className="space-y-5">
        <h2 className="text-lg font-medium text-stone-950 dark:text-stone-100 flex items-center gap-2 border-b border-stone-100 dark:border-stone-850 pb-2.5">
          What are you working on?
        </h2>
        
        <p className="text-stone-500 text-xs leading-normal">
          Selecting your current project type helps the companion craft tailored recommendations and set a supportive tone.
        </p>
        
        <div className="flex gap-3 overflow-x-auto pb-3 pt-1 scroll-smooth select-none snap-x snap-mandatory" style={{ scrollbarWidth: 'thin' }}>
          {projectTypes.map((p) => (
            <button
              key={p.id}
              onClick={() => handleSelectProjectType(p.id)}
              className={`p-3 rounded-lg border text-left font-sans transition-all flex flex-col justify-between items-start cursor-pointer group shrink-0 snap-start h-20 min-w-[130px] md:min-w-[150px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#912A4A] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-stone-950 ${
                projectType === p.id
                  ? 'bg-[#912A4A]/10 dark:bg-[#912A4A]/20 border-[#912A4A]/40 dark:border-rose-400/50 shadow-xs'
                  : 'bg-white dark:bg-stone-950 border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700'
              }`}
            >
              <span className="text-xl mb-1 group-hover:scale-110 transition-transform">{p.emoji}</span>
              <span className="text-[10px] font-medium text-stone-700 dark:text-stone-300 break-words leading-tight w-full truncate">
                {p.label}
              </span>
            </button>
          ))}

          {/* "+ Add Custom" button in the scroll row */}
          <button
            onClick={() => setIsAddingCustom(!isAddingCustom)}
            className={`p-3 rounded-lg border border-dashed text-left font-sans transition-all flex flex-col justify-between items-start cursor-pointer group shrink-0 snap-start h-20 min-w-[130px] md:min-w-[150px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#912A4A] ${
              isAddingCustom
                ? 'bg-[#912A4A]/10 border-[#912A4A]/40 text-[#912A4A] dark:text-rose-400'
                : 'border-stone-300 dark:border-stone-850 bg-white dark:bg-stone-950 text-stone-500 hover:border-stone-400 hover:text-stone-700 dark:hover:text-stone-300'
            }`}
          >
            <span className="text-xl mb-1 group-hover:scale-110 transition-transform">➕</span>
            <span className="text-[10px] font-medium leading-tight w-full truncate">
              Add custom
            </span>
          </button>
        </div>

        {/* Custom Project Creation Form */}
        {isAddingCustom && (
          <div className="p-4 bg-transparent border-l-2 border-[#912A4A]/40 pl-4 animate-fadeIn text-left max-w-md space-y-3">
            <h4 className="text-xs font-semibold text-stone-800 dark:text-stone-200">Create custom project type</h4>
            <form onSubmit={handleAddCustomProject} className="space-y-3">
              <div className="grid grid-cols-4 gap-2">
                <div className="col-span-1">
                  <label className="block text-[10px] text-stone-400 mb-1 font-medium">Emoji</label>
                  <input
                    type="text"
                    placeholder="🎓"
                    value={newEmoji}
                    onChange={(e) => setNewEmoji(e.target.value)}
                    className="w-full text-center p-1.5 text-xs bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded focus:outline-none focus:ring-1 focus:ring-[#912A4A] text-stone-800 dark:text-stone-100"
                    maxLength={4}
                  />
                </div>
                <div className="col-span-3">
                  <label className="block text-[10px] text-stone-400 mb-1 font-medium">Project Name</label>
                  <input
                    type="text"
                    placeholder="e.g., Book Chapter, Lab Report"
                    value={newLabel}
                    onChange={(e) => setNewLabel(e.target.value)}
                    className="w-full p-1.5 text-xs bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded focus:outline-none focus:ring-1 focus:ring-[#912A4A] text-stone-800 dark:text-stone-100"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] text-stone-400 mb-1 font-medium">Supportive Tip / Goal for Yourself</label>
                <textarea
                  placeholder="e.g., A chapter requires patient drafting. Focus on one subsection at a time."
                  value={newTip}
                  onChange={(e) => setNewTip(e.target.value)}
                  className="w-full p-1.5 text-xs bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded focus:outline-none focus:ring-1 focus:ring-[#912A4A] h-16 resize-none text-stone-800 dark:text-stone-100"
                />
              </div>
              <div className="flex justify-end gap-2 text-[11px]">
                <button
                  type="button"
                  onClick={() => setIsAddingCustom(false)}
                  className="px-2.5 py-1 text-stone-500 hover:text-stone-700 dark:hover:text-stone-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1 bg-[#912A4A] text-white rounded hover:bg-[#78223d] font-medium"
                >
                  Add Project
                </button>
              </div>
            </form>
          </div>
        )}

        {activeProjectInfo && (
          <div className="pl-3.5 border-l-2 border-[#912A4A]/40 text-xs animate-fadeIn text-left">
            <p className="font-medium text-stone-800 dark:text-stone-200">
              Supporting your {activeProjectInfo.label} journey:
            </p>
            <p className="text-stone-500 dark:text-stone-400 mt-1 leading-relaxed font-light">
              {activeProjectInfo.tip}
            </p>
          </div>
        )}

        {/* Projects List Sub-Section nested logically inside "what are you working on" - Unboxed */}
        <div className="space-y-4 pt-4 border-t border-stone-100 dark:border-stone-850">
          <h3 className="font-sans font-semibold text-stone-900 dark:text-stone-100 text-xs">Active research projects ({journeys.length})</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {journeys.map((j) => (
              <div
                key={j.id}
                className="pl-4 border-l-2 border-stone-200 dark:border-stone-800 hover:border-[#912A4A] dark:hover:border-rose-400 py-1 flex flex-col justify-between transition-all text-left"
              >
                <div>
                  <div className="flex justify-between items-start gap-2 mb-1.5">
                    <h4 className="font-sans font-semibold text-stone-950 dark:text-stone-100 text-sm truncate">{j.title}</h4>
                    <span className="font-mono text-[9px] bg-stone-100 dark:bg-stone-900 px-2 py-0.5 rounded text-stone-500 font-semibold">
                      {j.type}
                    </span>
                  </div>
                  <p className="font-sans text-xs text-stone-500 dark:text-stone-400 line-clamp-2 leading-relaxed mb-3 font-light">
                    {j.description}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-stone-100 dark:border-stone-900 text-[11px] text-stone-400 font-mono">
                  <span>{j.chapters.length} chapters · {j.tasks.filter(t => t.completed).length}/{j.tasks.length} tasks completed</span>
                  <button
                    onClick={() => {
                      onSelectJourney(j.id);
                      onSetTab('research');
                    }}
                    className="font-sans text-xs text-[#912A4A] dark:text-rose-400 hover:underline flex items-center cursor-pointer font-semibold"
                  >
                    Enter Project →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. TODAY'S FOCUS: One small achievable task - Unboxed */}
      <section className="space-y-4 pt-4 border-t border-stone-100 dark:border-stone-850">
        <h2 className="font-sans font-medium text-stone-950 dark:text-stone-100 text-lg flex items-center gap-2 pb-1">
          Choose today's focus
        </h2>
        
        <div className="pl-4 border-l-2 border-[#912A4A]/40 space-y-4 text-left">
          <p className="font-sans text-xs text-stone-500 leading-relaxed">
            Writing and research projects are giant. Safeguard your emotional energy by choosing just **one small achievable task** today. No pressure for more.
          </p>

          {savedFocus ? (
            <div className="p-3.5 bg-emerald-50/20 dark:bg-emerald-950/20 border-l-2 border-emerald-500 rounded-r-lg flex justify-between items-start animate-fadeIn">
              <div>
                <span className="text-[9px] font-mono text-emerald-800 dark:text-emerald-400 font-bold uppercase">Active focus</span>
                <p className="font-sans font-medium text-stone-800 dark:text-stone-200 text-sm mt-1">{savedFocus}</p>
              </div>
              <button
                onClick={handleClearFocus}
                className="font-sans text-xs bg-emerald-800 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg transition-colors cursor-pointer text-[11px] shadow-xs font-semibold"
              >
                Clear & Save Win!
              </button>
            </div>
          ) : (
            <div className="space-y-3.5 animate-fadeIn">
              {/* Micro focus preset buttons */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-stone-400 block uppercase font-mono">Anxiety-free presets</span>
                <div className="flex flex-wrap gap-2">
                  {focusPresets.map((preset) => (
                    <button
                      key={preset}
                      onClick={() => handleSaveFocus(preset)}
                      className="font-sans text-xs border border-stone-200 dark:border-stone-800 bg-transparent hover:bg-[#912A4A]/10 hover:border-[#912A4A]/30 text-stone-600 dark:text-stone-300 px-3 py-1.5 rounded-full transition-all cursor-pointer text-left"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom input */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (customFocus.trim()) {
                    handleSaveFocus(customFocus.trim());
                    setCustomFocus('');
                  }
                }}
                className="flex gap-2 max-w-xl pt-1"
              >
                <label htmlFor="custom-focus-input" className="sr-only">Custom Focus Goal</label>
                <input
                  id="custom-focus-input"
                  type="text"
                  placeholder="Or write a custom micro-win (e.g. Draft 3 sentences)..."
                  value={customFocus}
                  onChange={(e) => setCustomFocus(e.target.value)}
                  className="flex-1 font-sans text-xs p-2.5 border border-stone-200 dark:border-stone-800 rounded-lg bg-transparent text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-1 focus:ring-[#912A4A]"
                  required
                />
                <button
                  type="submit"
                  className="font-sans text-xs bg-stone-900 dark:bg-stone-800 text-white px-4 py-2 rounded-lg shrink-0 hover:bg-stone-800 transition-colors font-semibold"
                >
                  Anchor
                </button>
              </form>
            </div>
          )}

          <div className="pt-3 flex justify-between items-center text-[10px] text-stone-400 font-mono">
            <span>📚 {papers.length} references saved</span>
            <span>📂 {journeys.length} active projects</span>
          </div>
        </div>
      </section>

    </div>
  );
}
