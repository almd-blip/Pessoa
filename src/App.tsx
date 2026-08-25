/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Paper, ResearchJourney, Collection, MoodCheckIn, AccessibilitySettings, DEFAULT_ACCESSIBILITY_SETTINGS } from './types';
import { INITIAL_PAPERS, INITIAL_JOURNEYS, INITIAL_COLLECTIONS } from './data';
import { postWithAiRouting } from './lib/localAiService';

// Import sub-modules
import ResearchHome from './components/ResearchHome';
import LiteratureLibrary from './components/LiteratureLibrary';
import KnowledgeGraph from './components/KnowledgeGraph';
import LiteratureIntelligence from './components/LiteratureIntelligence';
import ResearchIntelligenceLayer from './components/ResearchIntelligenceLayer';
import ResearchWorkspace from './components/ResearchWorkspace';
import WritingCompanion from './components/WritingCompanion';
import CitationEngine from './components/CitationEngine';
import ResearchWellbeing from './components/ResearchWellbeing';
import FundingWorkspace from './components/FundingWorkspace';
import CreativePublishingWorkspace from './components/CreativePublishingWorkspace';
import Settings from './components/Settings';
import About from './components/About';
import FeedbackPanel from './components/FeedbackPanel';
import AIAssistant from './components/AIAssistant';
import FeedbackView from './components/FeedbackView';
import LandingPage from './components/LandingPage';

import {
  Compass,
  BookOpen,
  Heart,
  Wind,
  Settings as SettingsIcon,
  MessageSquare,
  Sparkles,
  Library,
  Network,
  CheckSquare,
  FileText,
  Award,
  Eye,
  Clock,
  ChevronDown,
  ChevronUp,
  Search,
  Menu,
  X
} from 'lucide-react';

export default function App() {
  const [showLanding, setShowLanding] = useState<boolean>(true);
  const [sidebarSearch, setSidebarSearch] = useState<string>('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [researchSubTab, setResearchSubTab] = useState<string>('projects');
  const [referenceSubMode, setReferenceSubMode] = useState<'library' | 'verifier'>('library');

  // Sidebar parent section collapse/expand state
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    pause: true,
    explore: true,
    ready: true,
  });

  const toggleSection = (section: string) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const [navKey, setNavKey] = useState<number>(0);
  const handleNavigate = (tab: string, subTab?: string) => {
    setActiveTab(tab);
    if (subTab) {
      setResearchSubTab(subTab);
    }
    setNavKey(Date.now());
    setMobileMenuOpen(false);
  };

  // Accessibility parameters driven dynamically
  const [accessibilitySettings, setAccessibilitySettings] = useState<AccessibilitySettings>(() => {
    const cached = localStorage.getItem('scholar_accessibility_settings');
    if (cached) {
      try { return JSON.parse(cached); } catch {}
    }
    return DEFAULT_ACCESSIBILITY_SETTINGS;
  });

  const handleAccessibilityChange = (newSettings: AccessibilitySettings) => {
    setAccessibilitySettings(newSettings);
    localStorage.setItem('scholar_accessibility_settings', JSON.stringify(newSettings));
    window.dispatchEvent(new Event('accessibility_settings_updated'));
  };

  const [fontScale, setFontScale] = useState(() => localStorage.getItem('scholar_font_scale') || 'm');
  const [fontStyle, setFontStyle] = useState(() => localStorage.getItem('scholar_font_style') || 'sans');
  const [highContrast, setHighContrast] = useState(() => localStorage.getItem('scholar_high_contrast') === 'true');
  const [theme, setTheme] = useState(() => localStorage.getItem('scholar_theme') || 'light');

  // Feedback Panel Overlay
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);

  // Load persisted state defensively. Local storage is user-controlled and can be stale
  // or malformed after an app update, so never trust it without validation.
  const [papers, setPapers] = useState<Paper[]>(() => {
    try {
      const cached = localStorage.getItem('scholar_papers');
      if (cached) {
        const parsed: unknown = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.every((paper) => paper && typeof paper.id === 'string')) {
          return parsed as Paper[];
        }
      }
    } catch (error) {
      console.warn('Failed to parse cached papers:', error);
    }
    return INITIAL_PAPERS;
  });

  const [journeys, setJourneys] = useState<ResearchJourney[]>(() => {
    try {
      const cached = localStorage.getItem('scholar_journeys');
      if (cached) {
        const parsed: unknown = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.every((journey) => journey && typeof journey.id === 'string')) {
          return parsed.map((journey) => {
            const saved = journey as Partial<ResearchJourney>;
            const initialMatch = INITIAL_JOURNEYS.find((initial) => initial.id === saved.id);
            return {
              ...saved,
              questions: Array.isArray(saved.questions) ? saved.questions : (initialMatch?.questions || []),
              chapters: Array.isArray(saved.chapters) ? saved.chapters : (initialMatch?.chapters || []),
              tasks: Array.isArray(saved.tasks) ? saved.tasks : (initialMatch?.tasks || []),
              timeline: Array.isArray(saved.timeline) ? saved.timeline : (initialMatch?.timeline || []),
              linkedPaperIds: Array.isArray(saved.linkedPaperIds) ? saved.linkedPaperIds : (initialMatch?.linkedPaperIds || []),
            } as ResearchJourney;
          });
        }
      }
    } catch (error) {
      console.warn('Failed to parse cached journeys:', error);
    }
    return INITIAL_JOURNEYS;
  });

  const [collections] = useState<Collection[]>(INITIAL_COLLECTIONS);
  const [activeJourneyId, setActiveJourneyId] = useState<string>(() => journeys[0]?.id || '');
  const [moodCheckIns, setMoodCheckIns] = useState<MoodCheckIn[]>(() => {
    const cached = localStorage.getItem('scholar_moods');
    return cached ? JSON.parse(cached) : [];
  });

  // GLOBAL FOCUS TIMER STATE (persists & ticks across all tabs including Projects screen)
  const [preferredFocusMinutes, setPreferredFocusMinutes] = useState<number>(() => {
    const saved = localStorage.getItem('scholar_preferred_focus_minutes');
    return saved ? Math.max(1, parseInt(saved, 10)) : 25;
  });

  const [preferredBreakMinutes, setPreferredBreakMinutes] = useState<number>(() => {
    const saved = localStorage.getItem('scholar_preferred_break_minutes');
    return saved ? Math.max(1, parseInt(saved, 10)) : 5;
  });

  const [focusTimeLeft, setFocusTimeLeft] = useState<number>(() => preferredFocusMinutes * 60);
  const [focusTimerRunning, setFocusTimerRunning] = useState<boolean>(false);
  const [focusIsBreak, setFocusIsBreak] = useState<boolean>(false);
  const [focusCompletedSessions, setFocusCompletedSessions] = useState<number>(() => {
    const cached = localStorage.getItem('scholar_focus_completed_sessions');
    return cached ? parseInt(cached, 10) : 0;
  });

  // Focus Alert state shown on Projects screen & across all workspace tabs
  const [focusAlert, setFocusAlert] = useState<{
    title: string;
    message: string;
    type: 'focus_ended' | 'break_ended';
    timestamp: number;
  } | null>(null);

  // Focus timer duration changers
  const changeFocusDuration = (mins: number) => {
    const validMins = Math.max(1, Math.min(180, mins));
    setPreferredFocusMinutes(validMins);
    localStorage.setItem('scholar_preferred_focus_minutes', validMins.toString());
    if (!focusTimerRunning && !focusIsBreak) {
      setFocusTimeLeft(validMins * 60);
    }
  };

  const changeBreakDuration = (mins: number) => {
    const validMins = Math.max(1, Math.min(60, mins));
    setPreferredBreakMinutes(validMins);
    localStorage.setItem('scholar_preferred_break_minutes', validMins.toString());
    if (!focusTimerRunning && focusIsBreak) {
      setFocusTimeLeft(validMins * 60);
    }
  };

  const handlePomodoroReset = () => {
    setFocusTimerRunning(false);
    setFocusIsBreak(false);
    setFocusTimeLeft(preferredFocusMinutes * 60);
  };

  // Play gentle Web Audio chime when timer finishes
  const playTimerChime = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const now = audioCtx.currentTime;
      [440, 554.37, 659.25].forEach((freq, i) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.12);
        gain.gain.setValueAtTime(0.001, now + i * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.15, now + i * 0.12 + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.12 + 1.2);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now + i * 0.12);
        osc.stop(now + i * 0.12 + 1.2);
      });
    } catch (e) {
      console.warn('Timer chime suppressed', e);
    }
  };

  // Main global timer countdown effect
  useEffect(() => {
    let interval: any = null;
    if (focusTimerRunning && focusTimeLeft > 0) {
      interval = setInterval(() => {
        setFocusTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (focusTimerRunning && focusTimeLeft === 0) {
      setFocusTimerRunning(false);
      playTimerChime();

      if (!focusIsBreak) {
        const nextSessions = focusCompletedSessions + 1;
        setFocusCompletedSessions(nextSessions);
        localStorage.setItem('scholar_focus_completed_sessions', nextSessions.toString());

        setFocusAlert({
          title: 'Focus interval complete',
          message: `Your ${preferredFocusMinutes}-minute quiet focus session has ended. Take a moment to stretch, breathe, or begin a gentle break when you are ready.`,
          type: 'focus_ended',
          timestamp: Date.now(),
        });

        setFocusIsBreak(true);
        setFocusTimeLeft(preferredBreakMinutes * 60);
      } else {
        setFocusAlert({
          title: 'Break interval complete',
          message: `Your ${preferredBreakMinutes}-minute break has concluded. Return to your research workspace whenever you feel prepared.`,
          type: 'break_ended',
          timestamp: Date.now(),
        });

        setFocusIsBreak(false);
        setFocusTimeLeft(preferredFocusMinutes * 60);
      }
    }
    return () => clearInterval(interval);
  }, [focusTimerRunning, focusTimeLeft, focusIsBreak, focusCompletedSessions, preferredFocusMinutes, preferredBreakMinutes]);

  // Format seconds to mm:ss helper
  const formatTimerTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem('scholar_papers', JSON.stringify(papers));
  }, [papers]);

  useEffect(() => {
    localStorage.setItem('scholar_journeys', JSON.stringify(journeys));
  }, [journeys]);

  useEffect(() => {
    localStorage.setItem('scholar_moods', JSON.stringify(moodCheckIns));
  }, [moodCheckIns]);

  // Sync accessibility classes on load and listen to changes
  useEffect(() => {
    const handleSyncAccessibility = () => {
      setFontScale(localStorage.getItem('scholar_font_scale') || 'm');
      setFontStyle(localStorage.getItem('scholar_font_style') || 'sans');
      setHighContrast(localStorage.getItem('scholar_high_contrast') === 'true');
      setTheme(localStorage.getItem('scholar_theme') || 'light');
    };

    handleSyncAccessibility();
    window.addEventListener('accessibility_settings_updated', handleSyncAccessibility);
    return () => {
      window.removeEventListener('accessibility_settings_updated', handleSyncAccessibility);
    };
  }, []);

  useEffect(() => {
    triggerRootThemeSync(theme, highContrast);
  }, [theme, highContrast]);

  useEffect(() => {
    const isDyslexic = Boolean(accessibilitySettings?.dyslexiaFont || fontStyle === 'dyslexic');
    if (isDyslexic) {
      document.body.classList.add('font-dyslexic');
    } else {
      document.body.classList.remove('font-dyslexic');
    }
  }, [accessibilitySettings?.dyslexiaFont, fontStyle]);

  const handleUpdatePaper = (updated: Paper) => {
    setPapers((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  };

  const handleAddPaper = (added: Paper) => {
    setPapers((prev) => [...prev, added]);
  };

  const handleDeletePaper = (id: string) => {
    setPapers((prev) => prev.filter((p) => p.id !== id));
  };

  const handleUpdateJourney = (updated: ResearchJourney) => {
    setJourneys((prev) => prev.map((j) => (j.id === updated.id ? updated : j)));
  };

  const handleAddJourney = (added: ResearchJourney) => {
    setJourneys((prev) => [...prev, added]);
  };

  const handleDeleteJourney = (id: string) => {
    setJourneys((prev) => {
      const next = prev.filter((j) => j.id !== id);
      if (activeJourneyId === id) {
        setActiveJourneyId(next[0]?.id || '');
      }
      return next;
    });
  };

  const handleResetAllData = () => {
    localStorage.clear();
    setPapers(INITIAL_PAPERS);
    setJourneys(INITIAL_JOURNEYS);
    setMoodCheckIns([]);
    setActiveJourneyId(INITIAL_JOURNEYS[0]?.id || '');
    setActiveTab('dashboard');
    setResearchSubTab('references');
    setReferenceSubMode('library');
    triggerRootThemeSync('light', false);
  };

  const handleRestoreDemoData = () => {
    setPapers(INITIAL_PAPERS);
    setJourneys(INITIAL_JOURNEYS);
    setActiveJourneyId(INITIAL_JOURNEYS[0]?.id || '');
    localStorage.setItem('scholar_papers', JSON.stringify(INITIAL_PAPERS));
    localStorage.setItem('scholar_journeys', JSON.stringify(INITIAL_JOURNEYS));
    setActiveTab('dashboard');
    setResearchSubTab('projects');
  };

  const triggerRootThemeSync = (targetTheme: string, contrast: boolean) => {
    const root = document.getElementById('scholar-companion-root');
    if (root) {
      if (targetTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      document.documentElement.classList.remove('light-black');

      if (contrast) {
        document.documentElement.classList.add('high-contrast');
        root.classList.add('high-contrast');
      } else {
        document.documentElement.classList.remove('high-contrast');
        root.classList.remove('high-contrast');
      }
    }
  };

  const handleAddMoodCheckIn = (added: MoodCheckIn) => {
    setMoodCheckIns((prev) => [...prev, added]);
  };

  const handleSelectJourneyFromHome = (id: string) => {
    setActiveJourneyId(id);
    setResearchSubTab('projects');
  };

  const handleVerifyMetadataBridge = async (paper: Paper) => {
    try {
      const res = await postWithAiRouting('/api/gemini/metadata-verify', {
        title: paper.title,
        authors: paper.authors,
        doi: paper.doi,
      });

      if (res.ok) {
        const data = await res.json();
        const updated: Paper = {
          ...paper,
          title: data.correctedTitle || paper.title,
          authors: data.correctedAuthors || paper.authors,
          journal: data.correctedJournal || paper.journal,
          year: data.correctedYear || paper.year,
          doi: data.correctedDoi || paper.doi,
          missingFields: data.missingFields || [],
          verificationStatus: data.verificationStatus || 'verified',
        };
        handleUpdatePaper(updated);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getFontSizeClass = () => {
    switch (fontScale) {
      case 's': return 'text-xs md:text-sm';
      case 'l': return 'text-base md:text-lg';
      case 'xl': return 'text-lg md:text-xl';
      default: return 'text-sm md:text-base';
    }
  };

  const getFontStyleClass = () => {
    if (fontStyle === 'serif') return 'font-serif';
    if (fontStyle === 'dyslexic') return 'font-dyslexic tracking-wide leading-relaxed';
    return 'font-sans';
  };

  const getHighContrastClass = () => {
    return highContrast ? 'border-stone-400 dark:border-stone-500 text-[#1B0A3B] dark:text-white' : '';
  };

  return (
    <div
      className={`min-h-screen bg-[#FAF8F5] dark:bg-stone-950 text-[#1B0A3B] dark:text-stone-100 flex flex-col md:flex-row ${getFontStyleClass()} ${getFontSizeClass()} ${getHighContrastClass()}`}
      id="scholar-companion-root"
    >
      {showLanding && (
        <LandingPage
          onNavigate={(tab) => {
            setActiveTab(tab);
            setShowLanding(false);
          }}
        />
      )}

      {/* Mobile Top Header */}
      <header className="md:hidden sticky top-0 z-30 bg-[#FAF8F5] dark:bg-[#1B0A3B] border-b border-stone-200 dark:border-[#2c135a] px-4 py-2.5 flex items-center justify-between shadow-xs shrink-0">
        <button
          type="button"
          onClick={() => {
            setShowLanding(true);
            setMobileMenuOpen(false);
          }}
          className="cursor-pointer focus:outline-none flex items-center gap-2"
        >
          <img 
            src={theme === 'light' ? '/assets/logo_cream.png' : '/assets/logo_transparent.png'} 
            alt="Pessoa Logo" 
            className="h-8 w-auto object-contain max-w-[140px]"
            referrerPolicy="no-referrer"
          />
        </button>

        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-lg bg-stone-100 dark:bg-[#25114a] border border-stone-200 dark:border-[#351a67] text-stone-700 dark:text-stone-200 hover:text-stone-900 dark:hover:text-white transition-colors cursor-pointer"
          aria-label="Toggle Navigation Menu"
          id="mobile-menu-toggle-btn"
        >
          {mobileMenuOpen ? <X className="w-5 h-5 text-[#912A4A] dark:text-rose-400" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* Sidebar - Structured by 3 Parent Choices and Submenus (Desktop sidebar, Mobile drawer overlay) */}
      <aside className={`bg-[#FAF8F5] dark:bg-[#1B0A3B] text-[#1B0A3B] dark:text-stone-200 border-r border-stone-200 dark:border-[#2c135a] flex flex-col justify-between p-4 shrink-0 z-40 transition-all ${
        mobileMenuOpen
          ? 'fixed inset-x-0 top-[53px] bottom-0 w-full overflow-y-auto block shadow-2xl animate-fadeIn'
          : 'hidden md:flex md:w-64 md:static md:max-h-screen md:overflow-y-auto md:shadow-md'
      }`}>
        <div>
          {/* Logo / Header */}
          <div className="pb-1 px-1">
            <button
              type="button"
              onClick={() => setShowLanding(true)}
              className="cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#912A4A] rounded p-1 transition-opacity hover:opacity-80 text-left block"
              title="Return to Arrival Screen"
            >
              <img 
                src={theme === 'light' ? '/assets/logo_cream.png' : '/assets/logo_transparent.png'} 
                alt="Pessoa Logo" 
                className="h-10 md:h-11 w-auto object-contain max-w-[170px]"
                referrerPolicy="no-referrer"
              />
            </button>
          </div>

          {/* Simple Search Input Field (18pts below logo, 18pts above Accessibility) */}
          <div className="mt-[18pt] mb-0 px-1" id="sidebar-search-container">
            <div className="relative flex items-center">
              <Search className="w-3.5 h-3.5 absolute left-2.5 text-[#1B0A3B]/60 dark:text-stone-500 pointer-events-none" />
              <input
                type="text"
                value={sidebarSearch}
                onChange={(e) => setSidebarSearch(e.target.value)}
                placeholder="Search..."
                className="w-full pl-8 pr-7 py-1.5 text-xs rounded-md bg-stone-100/90 dark:bg-[#25114a] border border-stone-200/90 dark:border-[#351a67] text-[#1B0A3B] dark:text-stone-200 placeholder-[#1B0A3B]/60 dark:placeholder-stone-500 focus:outline-none focus:ring-1 focus:ring-[#1D9E75] dark:focus:ring-[#28c093] transition-colors"
                id="sidebar-search-input"
                aria-label="Search workspace"
              />
              {sidebarSearch && (
                <button
                  type="button"
                  onClick={() => setSidebarSearch('')}
                  className="absolute right-2 text-[#1B0A3B]/60 hover:text-[#1B0A3B] dark:hover:text-stone-200 text-xs cursor-pointer focus:outline-none"
                  title="Clear search"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Accessibility Navigation: 18pts under search bar and 18pts above Pause & Breathe */}
          <div className="mt-[18pt] mb-[18pt] px-1" id="sidebar-accessibility-container">
            <button
              role="tab"
              aria-selected={activeTab === 'accessibility'}
              onClick={() => handleNavigate('accessibility')}
              className={`w-full text-left px-2.5 py-1.5 rounded-md text-xs font-sans font-bold flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'accessibility'
                  ? 'bg-stone-100/90 text-[#1B0A3B] font-semibold border-r-2 border-r-[#1D9E75] dark:bg-stone-800/60 dark:text-white dark:border-r-[#28c093]'
                  : 'text-[#1B0A3B] hover:text-[#1B0A3B] hover:bg-stone-200/60 dark:text-stone-300 dark:hover:text-white dark:hover:bg-[#25114a]'
              }`}
              id="sidebar-accessibility-nav-btn"
            >
              <Eye
                className={`w-3.5 h-3.5 shrink-0 transition-colors ${
                  activeTab === 'accessibility'
                    ? 'text-[#1D9E75] dark:text-[#28c093]'
                    : 'text-[#1B0A3B] dark:text-indigo-300'
                }`}
              />
              <span>Accessibility</span>
            </button>
          </div>

          {/* Structured Parent Navigation Menu */}
          <nav className="space-y-4" role="tablist" aria-label="Calm Companion Menu">
            
            {/* 1. PAUSE & BREATHE (Parent 1) */}
            <div className="space-y-1">
              <div className="flex items-center justify-between group">
                <button
                  type="button"
                  onClick={() => {
                    handleNavigate('wellbeing');
                    setOpenSections((prev) => ({ ...prev, pause: true }));
                  }}
                  className={`flex-grow text-left px-2.5 py-1.5 rounded-md text-xs font-sans font-extrabold tracking-wide flex items-center gap-2 transition-colors cursor-pointer ${
                    activeTab === 'wellbeing' || activeTab === 'focus'
                      ? 'text-[#1B0A3B] dark:text-white'
                      : 'text-[#1B0A3B] hover:text-[#1B0A3B] hover:bg-stone-200/60 dark:text-stone-300 dark:hover:text-white dark:hover:bg-[#25114a]'
                  }`}
                >
                  <Wind className={`w-3.5 h-3.5 shrink-0 transition-colors ${
                    activeTab === 'wellbeing' || activeTab === 'focus'
                      ? 'text-[#1D9E75] dark:text-[#28c093]'
                      : 'text-[#1B0A3B] dark:text-indigo-300'
                  }`} />
                  <span>Pause & Breathe</span>
                </button>
                <button
                  type="button"
                  onClick={() => toggleSection('pause')}
                  className="p-1 text-[#1B0A3B] hover:text-[#1B0A3B] dark:text-stone-400 dark:hover:text-stone-200 rounded cursor-pointer"
                  title="Toggle submenu"
                >
                  {openSections.pause ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
              </div>

              {openSections.pause && (
                <div className="space-y-0.5">
                  <button
                    role="tab"
                    aria-selected={activeTab === 'wellbeing'}
                    onClick={() => handleNavigate('wellbeing')}
                    className={`w-full text-left px-2.5 py-1.5 rounded-l-md rounded-r-none text-xs font-sans flex items-center transition-all cursor-pointer border-l-0 border-t-0 border-b-0 border-r-2 ${
                      activeTab === 'wellbeing'
                        ? 'bg-stone-100/90 text-[#1B0A3B] font-semibold border-r-[#1D9E75] dark:bg-stone-800/60 dark:text-white dark:border-r-[#28c093]'
                        : 'text-[#1B0A3B]/80 hover:bg-stone-200/50 hover:text-[#1B0A3B] dark:text-stone-300 dark:hover:bg-[#25114a] dark:hover:text-white border-r-transparent'
                    }`}
                  >
                    <span className="pl-5.5">Wellbeing centre</span>
                  </button>
                  <button
                    role="tab"
                    aria-selected={activeTab === 'focus'}
                    onClick={() => handleNavigate('focus')}
                    className={`w-full text-left px-2.5 py-1.5 rounded-l-md rounded-r-none text-xs font-sans flex items-center justify-between transition-all cursor-pointer border-l-0 border-t-0 border-b-0 border-r-2 ${
                      activeTab === 'focus'
                        ? 'bg-stone-100/90 text-[#1B0A3B] font-semibold border-r-[#1D9E75] dark:bg-stone-800/60 dark:text-white dark:border-r-[#28c093]'
                        : 'text-[#1B0A3B]/80 hover:bg-stone-200/50 hover:text-[#1B0A3B] dark:text-stone-300 dark:hover:bg-[#25114a] dark:hover:text-white border-r-transparent'
                    }`}
                  >
                    <span className="pl-5.5">Focus space</span>
                    {focusTimerRunning && (
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#1d9e75]/20 text-[#1d9e75] dark:text-[#28c093] font-semibold flex items-center gap-1 shrink-0">
                        <Clock className="w-3 h-3" />
                        {formatTimerTime(focusTimeLeft)}
                      </span>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* 2. EXPLORE (Parent 2) */}
            <div className="space-y-1">
              <div className="flex items-center justify-between group">
                <button
                  type="button"
                  onClick={() => {
                    handleNavigate('about');
                    setOpenSections((prev) => ({ ...prev, explore: true }));
                  }}
                  className={`flex-grow text-left px-2.5 py-1.5 rounded-md text-xs font-sans font-extrabold tracking-wide flex items-center gap-2 transition-colors cursor-pointer ${
                    activeTab === 'about'
                      ? 'text-[#1B0A3B] dark:text-white'
                      : 'text-[#1B0A3B] hover:text-[#1B0A3B] hover:bg-stone-200/60 dark:text-stone-300 dark:hover:text-white dark:hover:bg-[#25114a]'
                  }`}
                >
                  <Compass className={`w-3.5 h-3.5 shrink-0 transition-colors ${
                    activeTab === 'about'
                      ? 'text-[#1D9E75] dark:text-[#28c093]'
                      : 'text-[#1B0A3B] dark:text-indigo-300'
                  }`} />
                  <span>Explore</span>
                </button>
                <button
                  type="button"
                  onClick={() => toggleSection('explore')}
                  className="p-1 text-[#1B0A3B] hover:text-[#1B0A3B] dark:text-stone-400 dark:hover:text-stone-200 rounded cursor-pointer"
                  title="Toggle submenu"
                >
                  {openSections.explore ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
              </div>

              {openSections.explore && (
                <div className="space-y-0.5">
                  <button
                    role="tab"
                    aria-selected={activeTab === 'about'}
                    onClick={() => handleNavigate('about')}
                    className={`w-full text-left px-2.5 py-1.5 rounded-l-md rounded-r-none text-xs font-sans flex items-center transition-all cursor-pointer border-l-0 border-t-0 border-b-0 border-r-2 ${
                      activeTab === 'about'
                        ? 'bg-stone-100/90 text-[#1B0A3B] font-semibold border-r-[#1D9E75] dark:bg-stone-800/60 dark:text-white dark:border-r-[#28c093]'
                        : 'text-[#1B0A3B]/80 hover:bg-stone-200/50 hover:text-[#1B0A3B] dark:text-stone-300 dark:hover:bg-[#25114a] dark:hover:text-white border-r-transparent'
                    }`}
                  >
                    <span className="pl-5.5">About</span>
                  </button>
                </div>
              )}
            </div>

            {/* 3. I'M READY (Parent 3) */}
            <div className="space-y-1">
              <div className="flex items-center justify-between group">
                <button
                  type="button"
                  onClick={() => {
                    handleNavigate('dashboard');
                    setOpenSections((prev) => ({ ...prev, ready: true }));
                  }}
                  className={`flex-grow text-left px-2.5 py-1.5 rounded-md text-xs font-sans font-extrabold tracking-wide flex items-center gap-2 transition-colors cursor-pointer ${
                    activeTab === 'dashboard' || activeTab === 'research' || activeTab === 'ai_assistant'
                      ? 'text-[#1B0A3B] dark:text-white'
                      : 'text-[#1B0A3B] hover:text-[#1B0A3B] hover:bg-stone-200/60 dark:text-stone-300 dark:hover:text-white dark:hover:bg-[#25114a]'
                  }`}
                >
                  <Sparkles className={`w-3.5 h-3.5 shrink-0 transition-colors ${
                    activeTab === 'dashboard' || activeTab === 'research' || activeTab === 'ai_assistant'
                      ? 'text-[#1D9E75] dark:text-[#28c093]'
                      : 'text-[#1B0A3B] dark:text-indigo-300'
                  }`} />
                  <span>I'm ready</span>
                </button>
                <button
                  type="button"
                  onClick={() => toggleSection('ready')}
                  className="p-1 text-[#1B0A3B] hover:text-[#1B0A3B] dark:text-stone-400 dark:hover:text-stone-200 rounded cursor-pointer"
                  title="Toggle submenu"
                >
                  {openSections.ready ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
              </div>

              {openSections.ready && (
                <div className="space-y-0.5">
                  
                  {/* Primary Landing View: Projects */}
                  <button
                    role="tab"
                    aria-selected={activeTab === 'dashboard'}
                    onClick={() => handleNavigate('dashboard')}
                    className={`w-full text-left px-2.5 py-1.5 rounded-l-md rounded-r-none text-xs font-sans flex items-center transition-all cursor-pointer border-l-0 border-t-0 border-b-0 border-r-2 ${
                      activeTab === 'dashboard'
                        ? 'bg-stone-100/90 text-[#1B0A3B] font-semibold border-r-[#1D9E75] dark:bg-stone-800/60 dark:text-white dark:border-r-[#28c093]'
                        : 'text-[#1B0A3B]/80 hover:bg-stone-200/50 hover:text-[#1B0A3B] dark:text-stone-300 dark:hover:bg-[#25114a] dark:hover:text-white border-r-transparent'
                    }`}
                  >
                    <span className="pl-5.5">Projects</span>
                  </button>

                  {/* Document Analytical, Referencing & Data Tools Submenu */}
                  <div className="pt-2.5 pb-1">
                    <span className="text-xs font-sans font-semibold text-[#1B0A3B] dark:text-stone-200 block px-2.5 pl-8">
                      Research & writing tools
                    </span>
                  </div>

                  <div className="space-y-0.5">
                    <button
                      role="tab"
                      aria-selected={activeTab === 'research' && researchSubTab === 'plan'}
                      onClick={() => handleNavigate('research', 'plan')}
                      className={`w-full text-left px-2.5 py-1.5 rounded-l-md rounded-r-none text-xs font-sans flex items-center transition-all cursor-pointer border-l-0 border-t-0 border-b-0 border-r-2 ${
                        activeTab === 'research' && researchSubTab === 'plan'
                          ? 'bg-stone-100/90 text-[#1B0A3B] font-semibold border-r-[#1D9E75] dark:bg-stone-800/60 dark:text-white dark:border-r-[#28c093]'
                          : 'text-[#1B0A3B]/80 hover:bg-stone-200/50 hover:text-[#1B0A3B] dark:text-stone-300 dark:hover:bg-[#25114a] dark:hover:text-white border-r-transparent'
                      }`}
                    >
                      <span className="pl-7">Roadmap and Plan</span>
                    </button>

                    <button
                      role="tab"
                      aria-selected={activeTab === 'research' && researchSubTab === 'references'}
                      onClick={() => handleNavigate('research', 'references')}
                      className={`w-full text-left px-2.5 py-1.5 rounded-l-md rounded-r-none text-xs font-sans flex items-center transition-all cursor-pointer border-l-0 border-t-0 border-b-0 border-r-2 ${
                        activeTab === 'research' && researchSubTab === 'references'
                          ? 'bg-stone-100/90 text-[#1B0A3B] font-semibold border-r-[#1D9E75] dark:bg-stone-800/60 dark:text-white dark:border-r-[#28c093]'
                          : 'text-[#1B0A3B]/80 hover:bg-stone-200/50 hover:text-[#1B0A3B] dark:text-stone-300 dark:hover:bg-[#25114a] dark:hover:text-white border-r-transparent'
                      }`}
                    >
                      <span className="pl-7">References</span>
                    </button>

                    <button
                      role="tab"
                      aria-selected={activeTab === 'research' && researchSubTab === 'literature'}
                      onClick={() => handleNavigate('research', 'literature')}
                      className={`w-full text-left px-2.5 py-1.5 rounded-l-md rounded-r-none text-xs font-sans flex items-center transition-all cursor-pointer border-l-0 border-t-0 border-b-0 border-r-2 ${
                        activeTab === 'research' && researchSubTab === 'literature'
                          ? 'bg-stone-100/90 text-[#1B0A3B] font-semibold border-r-[#1D9E75] dark:bg-stone-800/60 dark:text-white dark:border-r-[#28c093]'
                          : 'text-[#1B0A3B]/80 hover:bg-stone-200/50 hover:text-[#1B0A3B] dark:text-stone-300 dark:hover:bg-[#25114a] dark:hover:text-white border-r-transparent'
                      }`}
                    >
                      <span className="pl-7">Paper Summaries</span>
                    </button>

                    <button
                      role="tab"
                      aria-selected={activeTab === 'research' && researchSubTab === 'analysis'}
                      onClick={() => handleNavigate('research', 'analysis')}
                      className={`w-full text-left px-2.5 py-1.5 rounded-l-md rounded-r-none text-xs font-sans flex items-center transition-all cursor-pointer border-l-0 border-t-0 border-b-0 border-r-2 ${
                        activeTab === 'research' && researchSubTab === 'analysis'
                          ? 'bg-stone-100/90 text-[#1B0A3B] font-semibold border-r-[#1D9E75] dark:bg-stone-800/60 dark:text-white dark:border-r-[#28c093]'
                          : 'text-[#1B0A3B]/80 hover:bg-stone-200/50 hover:text-[#1B0A3B] dark:text-stone-300 dark:hover:bg-[#25114a] dark:hover:text-white border-r-transparent'
                      }`}
                    >
                      <span className="pl-7">Concept Map</span>
                    </button>

                    <button
                      role="tab"
                      aria-selected={activeTab === 'research' && researchSubTab === 'writing'}
                      onClick={() => handleNavigate('research', 'writing')}
                      className={`w-full text-left px-2.5 py-1.5 rounded-l-md rounded-r-none text-xs font-sans flex items-center transition-all cursor-pointer border-l-0 border-t-0 border-b-0 border-r-2 ${
                        activeTab === 'research' && researchSubTab === 'writing'
                          ? 'bg-stone-100/90 text-[#1B0A3B] font-semibold border-r-[#1D9E75] dark:bg-stone-800/60 dark:text-white dark:border-r-[#28c093]'
                          : 'text-[#1B0A3B]/80 hover:bg-stone-200/50 hover:text-[#1B0A3B] dark:text-stone-300 dark:hover:bg-[#25114a] dark:hover:text-white border-r-transparent'
                      }`}
                    >
                      <span className="pl-7">Writing Assistant</span>
                    </button>

                    <button
                      role="tab"
                      aria-selected={activeTab === 'research' && researchSubTab === 'publishing'}
                      onClick={() => handleNavigate('research', 'publishing')}
                      className={`w-full text-left px-2.5 py-1.5 rounded-l-md rounded-r-none text-xs font-sans flex items-center transition-all cursor-pointer border-l-0 border-t-0 border-b-0 border-r-2 ${
                        activeTab === 'research' && researchSubTab === 'publishing'
                          ? 'bg-stone-100/90 text-[#1B0A3B] font-semibold border-r-[#1D9E75] dark:bg-stone-800/60 dark:text-white dark:border-r-[#28c093]'
                          : 'text-[#1B0A3B]/80 hover:bg-stone-200/50 hover:text-[#1B0A3B] dark:text-stone-300 dark:hover:bg-[#25114a] dark:hover:text-white border-r-transparent'
                      }`}
                    >
                      <span className="pl-7">Publishing & Export</span>
                    </button>

                    <button
                      role="tab"
                      aria-selected={activeTab === 'research' && researchSubTab === 'funding'}
                      onClick={() => handleNavigate('research', 'funding')}
                      className={`w-full text-left px-2.5 py-1.5 rounded-l-md rounded-r-none text-xs font-sans flex items-center transition-all cursor-pointer border-l-0 border-t-0 border-b-0 border-r-2 ${
                        activeTab === 'research' && researchSubTab === 'funding'
                          ? 'bg-stone-100/90 text-[#1B0A3B] font-semibold border-r-[#1D9E75] dark:bg-stone-800/60 dark:text-white dark:border-r-[#28c093]'
                          : 'text-[#1B0A3B]/80 hover:bg-stone-200/50 hover:text-[#1B0A3B] dark:text-stone-300 dark:hover:bg-[#25114a] dark:hover:text-white border-r-transparent'
                      }`}
                    >
                      <span className="pl-7">Grants & Proposals</span>
                    </button>

                    <button
                      role="tab"
                      aria-selected={activeTab === 'research' && researchSubTab === 'perspective_check'}
                      onClick={() => handleNavigate('research', 'perspective_check')}
                      className={`w-full text-left px-2.5 py-1.5 rounded-l-md rounded-r-none text-xs font-sans flex items-center transition-all cursor-pointer border-l-0 border-t-0 border-b-0 border-r-2 ${
                        activeTab === 'research' && researchSubTab === 'perspective_check'
                          ? 'bg-stone-100/90 text-[#1B0A3B] font-semibold border-r-[#1D9E75] dark:bg-stone-800/60 dark:text-white dark:border-r-[#28c093]'
                          : 'text-[#1B0A3B]/80 hover:bg-stone-200/50 hover:text-[#1B0A3B] dark:text-stone-300 dark:hover:bg-[#25114a] dark:hover:text-white border-r-transparent'
                      }`}
                    >
                      <span className="pl-7">Perspective Check</span>
                    </button>

                    <button
                      role="tab"
                      aria-selected={activeTab === 'ai_assistant'}
                      onClick={() => handleNavigate('ai_assistant')}
                      className={`w-full text-left px-2.5 py-1.5 rounded-l-md rounded-r-none text-xs font-sans flex items-center transition-all cursor-pointer border-l-0 border-t-0 border-b-0 border-r-2 ${
                        activeTab === 'ai_assistant'
                          ? 'bg-stone-100/90 text-[#1B0A3B] font-semibold border-r-[#1D9E75] dark:bg-stone-800/60 dark:text-white dark:border-r-[#28c093]'
                          : 'text-[#1B0A3B]/80 hover:bg-stone-200/50 hover:text-[#1B0A3B] dark:text-stone-300 dark:hover:bg-[#25114a] dark:hover:text-white border-r-transparent'
                      }`}
                    >
                      <span className="pl-7">Ask AI</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

          </nav>
        </div>

        {/* Footer Utilities */}
        <div className="pt-3 border-t border-stone-200 dark:border-[#351a67] mt-3 space-y-1 text-left">
          <button
            role="tab"
            aria-selected={activeTab === 'feedback'}
            onClick={() => handleNavigate('feedback')}
            className={`w-full text-left px-2.5 py-1.5 rounded-l-md rounded-r-none text-xs font-sans flex items-center transition-all cursor-pointer border-l-0 border-t-0 border-b-0 border-r-2 ${
              activeTab === 'feedback'
                ? 'bg-stone-100/90 text-[#1B0A3B] font-semibold border-r-[#1D9E75] dark:bg-stone-800/60 dark:text-white dark:border-r-[#28c093]'
                : 'text-[#1B0A3B] hover:bg-stone-200/50 hover:text-[#1B0A3B] dark:text-stone-300 dark:hover:bg-[#25114a] border-r-transparent'
            }`}
          >
            Feedback
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'settings'}
            onClick={() => handleNavigate('settings')}
            className={`w-full text-left px-2.5 py-1.5 rounded-l-md rounded-r-none text-xs font-sans flex items-center transition-all cursor-pointer border-l-0 border-t-0 border-b-0 border-r-2 ${
              activeTab === 'settings'
                ? 'bg-stone-100/90 text-[#1B0A3B] font-semibold border-r-[#1D9E75] dark:bg-stone-800/60 dark:text-white dark:border-r-[#28c093]'
                : 'text-[#1B0A3B] hover:bg-stone-200/50 hover:text-[#1B0A3B] dark:text-stone-300 dark:hover:bg-[#25114a] border-r-transparent'
            }`}
          >
            Settings
          </button>
        </div>
      </aside>

      {/* Main viewport */}
      <main className="flex-grow p-3 sm:p-6 md:p-8 overflow-y-auto w-full max-w-full md:max-h-screen">
        <div className="max-w-7xl mx-auto h-full">

          {/* GLOBAL FOCUS TIMER ALERT BANNER (Shows on Projects screen and all workspace views when timer ends) */}
          {focusAlert && (
            <div
              className="mb-6 p-3.5 sm:p-4 rounded-lg bg-stone-50/90 dark:bg-stone-900/90 border border-stone-200/90 dark:border-stone-800 text-left flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5 z-50 relative"
              role="alert"
              id="focus-timer-ended-alert"
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-[#1d9e75]/10 dark:bg-[#28c093]/15 text-[#1d9e75] dark:text-[#28c093] flex items-center justify-center shrink-0 text-sm">
                  {focusAlert.type === 'focus_ended' ? '🌿' : '☕'}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-xs font-semibold text-stone-900 dark:text-stone-100 font-sans">
                      {focusAlert.title}
                    </h4>
                    <span className="text-[10px] font-sans px-2 py-0.5 rounded bg-stone-200/60 dark:bg-stone-800 text-stone-600 dark:text-stone-400 font-medium">
                      {activeTab === 'research' || activeTab === 'dashboard' ? 'Projects Screen' : 'Timer'}
                    </span>
                  </div>
                  <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed font-sans">
                    {focusAlert.message}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                {focusAlert.type === 'focus_ended' ? (
                  <button
                    type="button"
                    onClick={() => {
                      setFocusAlert(null);
                      setFocusIsBreak(true);
                      setFocusTimeLeft(preferredBreakMinutes * 60);
                      setFocusTimerRunning(true);
                    }}
                    className="px-3 py-1.5 rounded-md bg-[#1d9e75] hover:bg-[#168260] dark:bg-[#28c093] dark:hover:bg-[#1f9b76] text-white dark:text-stone-950 text-xs font-medium font-sans transition-colors cursor-pointer"
                  >
                    Start Break ({preferredBreakMinutes}m)
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setFocusAlert(null);
                      setFocusIsBreak(false);
                      setFocusTimeLeft(preferredFocusMinutes * 60);
                      setFocusTimerRunning(true);
                    }}
                    className="px-3 py-1.5 rounded-md bg-[#1d9e75] hover:bg-[#168260] dark:bg-[#28c093] dark:hover:bg-[#1f9b76] text-white dark:text-stone-950 text-xs font-medium font-sans transition-colors cursor-pointer"
                  >
                    Start Focus ({preferredFocusMinutes}m)
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    handleNavigate('focus');
                    setFocusAlert(null);
                  }}
                  className="px-3 py-1.5 rounded-md border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 text-stone-700 dark:text-stone-300 text-xs font-medium font-sans hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
                >
                  Go to Focus Space
                </button>

                <button
                  type="button"
                  onClick={() => setFocusAlert(null)}
                  className="p-1.5 text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 text-xs cursor-pointer rounded hover:bg-stone-200/50 dark:hover:bg-stone-800 transition-colors ml-0.5"
                  title="Dismiss Alert"
                  aria-label="Dismiss timer alert"
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          {/* RESEARCH WORKSPACE & HOME */}
          {(activeTab === 'dashboard' || activeTab === 'research') && (
            <div className="animate-fadeIn">
              <ResearchWorkspace
                journeys={journeys}
                papers={papers}
                collections={collections}
                onUpdateJourney={handleUpdateJourney}
                onAddJourney={handleAddJourney}
                onDeleteJourney={handleDeleteJourney}
                activeJourneyId={activeJourneyId}
                onSetActiveJourneyId={setActiveJourneyId}
                onUpdatePaper={handleUpdatePaper}
                onAddPaper={handleAddPaper}
                onDeletePaper={handleDeletePaper}
                navKey={navKey}
                initialActiveTool={
                  researchSubTab === 'plan'
                    ? 'plan'
                    : researchSubTab === 'references'
                    ? 'references'
                    : researchSubTab === 'literature'
                    ? 'lit_intelligence'
                    : researchSubTab === 'analysis'
                    ? 'knowledge_graph'
                    : researchSubTab === 'writing'
                    ? 'writing_companion'
                    : researchSubTab === 'publishing'
                    ? 'publishing_export'
                    : researchSubTab === 'funding'
                    ? 'grants_proposals'
                    : researchSubTab === 'perspective_check'
                    ? 'perspective_check'
                    : undefined
                }
              />
            </div>
          )}

          {/* WELLBEING PANEL */}
          {activeTab === 'wellbeing' && (
            <ResearchWellbeing mode="wellbeing" />
          )}

          {/* FOCUS PANEL */}
          {activeTab === 'focus' && (
            <ResearchWellbeing
              mode="focus"
              onExitFocus={() => setActiveTab('dashboard')}
              timerProps={{
                preferredFocusMinutes,
                preferredBreakMinutes,
                timeLeft: focusTimeLeft,
                timerRunning: focusTimerRunning,
                isBreak: focusIsBreak,
                completedSessions: focusCompletedSessions,
                changeFocusDuration,
                changeBreakDuration,
                toggleTimerRunning: () => setFocusTimerRunning(!focusTimerRunning),
                resetTimer: handlePomodoroReset,
              }}
            />
          )}

          {/* ABOUT COMPANION PANEL */}
          {activeTab === 'about' && (
            <About />
          )}

          {/* ACCESSIBILITY PANEL */}
          {activeTab === 'accessibility' && (
            <Settings
              onResetAllData={handleResetAllData}
              onRestoreDemoData={handleRestoreDemoData}
              defaultTab="appearance"
              accessibilitySettings={accessibilitySettings}
              onAccessibilitySettingsChange={handleAccessibilityChange}
            />
          )}

          {/* AI ASSISTANT PANEL */}
          {activeTab === 'ai_assistant' && (
            <AIAssistant />
          )}

          {/* FEEDBACK PANEL */}
          {activeTab === 'feedback' && (
            <FeedbackView />
          )}

          {/* SETTINGS PANEL */}
          {activeTab === 'settings' && (
            <Settings
              onResetAllData={handleResetAllData}
              onRestoreDemoData={handleRestoreDemoData}
              accessibilitySettings={accessibilitySettings}
              onAccessibilitySettingsChange={handleAccessibilityChange}
            />
          )}

        </div>
      </main>

      {/* Global Visible Feedback Trigger Button - floating in the bottom-right for instant accessibility */}
      <button
        onClick={() => setIsFeedbackOpen(true)}
        className="fixed bottom-4 right-4 z-40 bg-[#912A4A] hover:bg-[#78223d] text-white px-3.5 py-2.5 rounded-full shadow-lg flex items-center gap-2 text-xs transition-all hover:scale-105 cursor-pointer border border-[#912A4A]/20"
        title="Share your emotional friction, bugs, or ideas"
      >
        <span className="font-semibold font-sans">Feedback</span>
      </button>

      {/* Unified Feedback Panel workspace overlay */}
      <FeedbackPanel
        isOpen={isFeedbackOpen}
        onClose={() => setIsFeedbackOpen(false)}
      />

    </div>
  );
}
