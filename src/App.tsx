import { useState, useEffect, useRef } from 'react';
import type { PlannerState, Subject, WeekPlan } from './types/planner';
import { MaterialsList } from './components/MaterialsList';
import { WeeklyGrid } from './components/WeeklyGrid';
import { SubjectsManager } from './components/SubjectsManager';
import { AddEventModal } from './components/AddEventModal';
import { SettingsModal } from './components/SettingsModal';
import { TodayFocus } from './components/TodayFocus';
import { PlusIcon, CalendarIcon, BookIcon, ChevronLeftIcon, ChevronRightIcon, FlameIcon, SettingsIcon } from './components/Icons';
import SoundUtility from './utils/audio';
import { supabase, updateSupabaseClient, clearSupabaseClient } from './utils/supabase';
import './App.css';


// Version key for forced migration when data structure changes
const PLANNER_VERSION = '5';
const VERSION_KEY = 'antigravity-studio-planner-version';

const INITIAL_SUBJECTS: Subject[] = [
  { 
    id: 'subj-1', name: 'Cloud - LAN e VLAN', pages: 14, completed: false,
    color: '#fbbf24', logo: 'globe',
    description: 'Syllabus generale e configurazione di LAN, VLAN e protocollo 802.1Q.',
    tasks: [
      { id: 'task-1-1', name: 'Capitolo 1: Standard LAN', pages: 8, completed: false, category: 'teoria', quantityType: 'pagine' },
      { id: 'task-1-2', name: 'Quiz VLAN & Trunking', pages: 6, completed: false, category: 'esercizi', quantityType: 'quiz' }
    ]
  },
  { 
    id: 'subj-2', name: 'Cloud - Multi QoS', pages: 18, completed: false,
    color: '#60a5fa', logo: 'cpu',
    description: 'Meccanismi di coda, prioritizzazione e policy di Quality of Service.',
    tasks: [
      { id: 'task-2-1', name: 'Lettura QoS Overview', pages: 10, completed: false, category: 'teoria', quantityType: 'pagine' },
      { id: 'task-2-2', name: 'Esercizi code prioritizzazione', pages: 8, completed: false, category: 'esercizi', quantityType: 'esercizi' }
    ]
  },
  { 
    id: 'subj-3', name: 'Cloud - CC Concept', pages: 22, completed: false,
    color: '#34d399', logo: 'shield',
    description: 'Definizioni e modelli del Cloud (IaaS, PaaS, SaaS).',
    tasks: [
      { id: 'task-3-1', name: 'Architettura Cloud Computing', pages: 12, completed: false, category: 'teoria', quantityType: 'pagine' },
      { id: 'task-3-2', name: 'Quiz di ricapitolazione', pages: 10, completed: false, category: 'esercizi', quantityType: 'quiz' }
    ]
  },
  { id: 'subj-4', name: 'Cloud - CC Virtualization', pages: 16, completed: false, color: '#a78bfa', logo: 'terminal', description: 'Hypervisor, macchine virtuali e architetture di virtualizzazione.', tasks: [] },
  { id: 'subj-5', name: 'Cloud - CC Container', pages: 23, completed: false, color: '#f87171', logo: 'database', description: 'Docker, containerizzazione e orchestrazione base.', tasks: [] },
  { id: 'subj-6', name: 'Cloud - Network soft.', pages: 17, completed: false, color: '#f472b6', logo: 'server', description: 'Reti software-defined (SDN) e piani di controllo/dati.', tasks: [] }
];

// Calendar: August 24 2026 (Monday) → September 27 2026 (Sunday)
const INITIAL_WEEKS: WeekPlan[] = [
  {
    id: 'week-1', name: 'Settimana 1: 24 Ago - 30 Ago',
    days: [
      { id: 'w1d1', name: 'Lunedì 24',   dateLabel: '24 Ago', mattina: [], pomeriggio: [], sera: [] },
      { id: 'w1d2', name: 'Martedì 25',  dateLabel: '25 Ago', mattina: [], pomeriggio: [], sera: [] },
      { id: 'w1d3', name: 'Mercoledì 26',dateLabel: '26 Ago', mattina: [], pomeriggio: [], sera: [] },
      { id: 'w1d4', name: 'Giovedì 27',  dateLabel: '27 Ago', mattina: [], pomeriggio: [], sera: [] },
      { id: 'w1d5', name: 'Venerdì 28',  dateLabel: '28 Ago', mattina: [], pomeriggio: [], sera: [] },
      { id: 'w1d6', name: 'Sabato 29',   dateLabel: '29 Ago', mattina: [], pomeriggio: [], sera: [] },
      { id: 'w1d7', name: 'Domenica 30', dateLabel: '30 Ago', mattina: [], pomeriggio: [], sera: [] },
    ]
  },
  {
    id: 'week-2', name: 'Settimana 2: 31 Ago - 6 Set',
    days: [
      { id: 'w2d1', name: 'Lunedì 31',   dateLabel: '31 Ago', mattina: [], pomeriggio: [], sera: [] },
      { id: 'w2d2', name: 'Martedì 1',   dateLabel: '1 Set',  mattina: [], pomeriggio: [], sera: [] },
      { id: 'w2d3', name: 'Mercoledì 2', dateLabel: '2 Set',  mattina: [], pomeriggio: [], sera: [] },
      { id: 'w2d4', name: 'Giovedì 3',   dateLabel: '3 Set',  mattina: [], pomeriggio: [], sera: [] },
      { id: 'w2d5', name: 'Venerdì 4',   dateLabel: '4 Set',  mattina: [], pomeriggio: [], sera: [] },
      { id: 'w2d6', name: 'Sabato 5',    dateLabel: '5 Set',  mattina: [], pomeriggio: [], sera: [] },
      { id: 'w2d7', name: 'Domenica 6',  dateLabel: '6 Set',  mattina: [], pomeriggio: [], sera: [] },
    ]
  },
  {
    id: 'week-3', name: 'Settimana 3: 7 Set - 13 Set',
    days: [
      { id: 'w3d1', name: 'Lunedì 7',    dateLabel: '7 Set',  mattina: [], pomeriggio: [], sera: [] },
      { id: 'w3d2', name: 'Martedì 8',   dateLabel: '8 Set',  mattina: [], pomeriggio: [], sera: [] },
      { id: 'w3d3', name: 'Mercoledì 9', dateLabel: '9 Set',  mattina: [], pomeriggio: [], sera: [] },
      { id: 'w3d4', name: 'Giovedì 10',  dateLabel: '10 Set', mattina: [], pomeriggio: [], sera: [] },
      { id: 'w3d5', name: 'Venerdì 11',  dateLabel: '11 Set', mattina: [], pomeriggio: [], sera: [] },
      { id: 'w3d6', name: 'Sabato 12',   dateLabel: '12 Set', mattina: [], pomeriggio: [], sera: [] },
      { id: 'w3d7', name: 'Domenica 13', dateLabel: '13 Set', mattina: [], pomeriggio: [], sera: [] },
    ]
  },
  {
    id: 'week-4', name: 'Settimana 4: 14 Set - 20 Set',
    days: [
      { id: 'w4d1', name: 'Lunedì 14',   dateLabel: '14 Set', mattina: [], pomeriggio: [], sera: [] },
      { id: 'w4d2', name: 'Martedì 15',  dateLabel: '15 Set', mattina: [], pomeriggio: [], sera: [] },
      { id: 'w4d3', name: 'Mercoledì 16',dateLabel: '16 Set', mattina: [], pomeriggio: [], sera: [] },
      { id: 'w4d4', name: 'Giovedì 17',  dateLabel: '17 Set', mattina: [], pomeriggio: [], sera: [] },
      { id: 'w4d5', name: 'Venerdì 18',  dateLabel: '18 Set', mattina: [], pomeriggio: [], sera: [] },
      { id: 'w4d6', name: 'Sabato 19',   dateLabel: '19 Set', mattina: [], pomeriggio: [], sera: [] },
      { id: 'w4d7', name: 'Domenica 20', dateLabel: '20 Set', mattina: [], pomeriggio: [], sera: [] },
    ]
  },
  {
    id: 'week-5', name: 'Settimana 5: 21 Set - 27 Set',
    days: [
      { id: 'w5d1', name: 'Lunedì 21',   dateLabel: '21 Set', mattina: [], pomeriggio: [], sera: [] },
      { id: 'w5d2', name: 'Martedì 22',  dateLabel: '22 Set', mattina: [], pomeriggio: [], sera: [] },
      { id: 'w5d3', name: 'Mercoledì 23',dateLabel: '23 Set', mattina: [], pomeriggio: [], sera: [] },
      { id: 'w5d4', name: 'Giovedì 24',  dateLabel: '24 Set', mattina: [], pomeriggio: [], sera: [] },
      { id: 'w5d5', name: 'Venerdì 25',  dateLabel: '25 Set', mattina: [], pomeriggio: [], sera: [] },
      { id: 'w5d6', name: 'Sabato 26',   dateLabel: '26 Set', mattina: [], pomeriggio: [], sera: [] },
      { id: 'w5d7', name: 'Domenica 27', dateLabel: '27 Set', mattina: [], pomeriggio: [], sera: [] },
    ]
  },
];

// Helper function to check if a week is completely in the past
const isWeekInPast = (week: WeekPlan): boolean => {
  const todayDate = new Date();
  const todayPure = new Date(todayDate.getFullYear(), todayDate.getMonth(), todayDate.getDate());
  
  const monthsMap: Record<string, number> = {
    'Gen': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'Mag': 4, 'Giu': 5, 'Lug': 6, 'Ago': 7, 'Set': 8, 'Ott': 9, 'Nov': 10, 'Dic': 11,
    'gen': 0, 'feb': 1, 'mar': 2, 'apr': 3, 'mag': 4, 'giu': 5, 'lug': 6, 'ago': 7, 'set': 8, 'ott': 9, 'nov': 10, 'dic': 11
  };

  return week.days.every(day => {
    const monthsShort = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'];
    const isToday = day.dateLabel === `${todayDate.getDate()} ${monthsShort[todayDate.getMonth()]}`;
    if (isToday) return false;

    const dateParts = day.dateLabel.split(' ');
    const dNum = parseInt(dateParts[0]);
    const mStr = dateParts[1];
    if (!dNum || !mStr) return false;
    const mNum = monthsMap[mStr];
    if (mNum === undefined) return false;

    const currentYear = todayDate.getFullYear();
    const dayPure = new Date(currentYear, mNum, dNum);
    return dayPure < todayPure;
  });
};

const LOCAL_STORAGE_KEY = 'antigravity-studio-planner-state';
const TITLE_STORAGE_KEY = 'antigravity-studio-planner-title';

function App() {
  const [subjects, setSubjects] = useState<Subject[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}-subjects`);
    const colorMigrationMap: Record<string, string> = {
      '#d97706': '#fbbf24', '#2563eb': '#60a5fa', '#059669': '#34d399',
      '#7c3aed': '#a78bfa', '#dc2626': '#f87171', '#db2777': '#f472b6',
    };
    const logoMigrationMap: Record<string, string> = {
      '☁️': 'globe', '⚙️': 'cpu', '🌐': 'shield',
      '💻': 'terminal', '📦': 'database', '📡': 'server', '📚': 'shield'
    };
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as Subject[];
        return parsed.map((s) => ({
          ...s,
          color: colorMigrationMap[s.color] || s.color,
          logo: logoMigrationMap[s.logo] || s.logo || 'shield',
          description: s.description || '',
          tasks: (s.tasks || []).map((t) => ({
            ...t,
            category: t.category || 'teoria',
            quantityType: t.quantityType || 'pagine',
          })),
        }));
      } catch (e) {
        console.error("Failed to parse saved subjects", e);
      }
    }
    return INITIAL_SUBJECTS;
  });

  const [weeks, setWeeks] = useState<WeekPlan[]>(() => {
    const savedVersion = localStorage.getItem(VERSION_KEY);
    if (savedVersion !== PLANNER_VERSION) {
      return INITIAL_WEEKS;
    }
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}-weeks`);
    if (saved) {
      try {
        return JSON.parse(saved) as WeekPlan[];
      } catch (e) {
        console.error("Failed to parse saved weeks", e);
      }
    }
    return INITIAL_WEEKS;
  });

  const [activeWeekId, setActiveWeekId] = useState<string>(() => {
    const savedVersion = localStorage.getItem(VERSION_KEY);
    if (savedVersion !== PLANNER_VERSION) {
      return INITIAL_WEEKS[0]?.id || 'week-1';
    }
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}-activeWeekId`);
    if (saved) {
      const activeExists = weeks.some(w => w.id === saved);
      if (activeExists) return saved;
    }
    return weeks[0]?.id || INITIAL_WEEKS[0]?.id || '';
  });

  const [sessionTitle, setSessionTitle] = useState<string>(() => {
    return localStorage.getItem(TITLE_STORAGE_KEY) || 'SESSIONE ESTIVA';
  });

  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<'oggi' | 'planner' | 'subjects'>('oggi');
  const [theme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('antigravity-studio-planner-theme') as 'dark' | 'light') || 'dark';
  });

  const [eventColors, setEventColors] = useState<{
    esame: string;
    svago: string;
    lezione: string;
    altro: string;
  }>(() => {
    const saved = localStorage.getItem('antigravity-studio-planner-event-colors');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.esame && parsed.svago && parsed.lezione && parsed.altro) return parsed;
      } catch (e) {}
    }
    return {
      esame: '#ef4444',
      svago: '#3b82f6',
      lezione: '#10b981',
      altro: '#a78bfa'
    };
  });

  const [taskFontSize, setTaskFontSize] = useState<number>(() => {
    return parseInt(localStorage.getItem('antigravity-studio-planner-task-font-size') || '26');
  });
  const [dayFontSize, setDayFontSize] = useState<number>(() => {
    return parseInt(localStorage.getItem('antigravity-studio-planner-day-font-size') || '30');
  });

  // --- Supabase Cloud Sync States ---
  const [user, setUser] = useState<any>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string>('');
  const [lastSynced, setLastSynced] = useState<string>('');
  const [supabaseConfig, setSupabaseConfig] = useState<{ url: string; anonKey: string }>(() => {
    const envUrl = import.meta.env.VITE_SUPABASE_URL || '';
    const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

    if (envUrl && envKey) {
      return { url: envUrl, anonKey: envKey };
    }

    return {
      url: localStorage.getItem('antigravity-studio-planner-supabase-url') || '',
      anonKey: localStorage.getItem('antigravity-studio-planner-supabase-key') || ''
    };
  });

  const lastKnownStateStrRef = useRef<string>('');

  // --- Lifted Pomodoro Timer States ---
  const [timerMode, setTimerMode] = useState<'study' | 'short' | 'long'>(() => {
    const saved = localStorage.getItem('antigravity-studio-planner-timer-mode');
    return (saved as 'study' | 'short' | 'long') || 'study';
  });

  const [customDurations, setCustomDurations] = useState<{ study: number; short: number; long: number }>(() => {
    const saved = localStorage.getItem('antigravity-studio-planner-pomodoro-durations');
    return saved ? JSON.parse(saved) : { study: 25, short: 5, long: 15 };
  });

  const [timeLeft, setTimeLeft] = useState(() => {
    const timerSettings = {
      study: customDurations.study * 60,
      short: customDurations.short * 60,
      long: customDurations.long * 60
    };
    return timerSettings[timerMode];
  });
  const [timerRunning, setTimerRunning] = useState(false);
  const timerIntervalRef = useRef<any>(null);

  // Sync mode and durations to localStorage
  useEffect(() => {
    localStorage.setItem('antigravity-studio-planner-timer-mode', timerMode);
  }, [timerMode]);

  useEffect(() => {
    localStorage.setItem('antigravity-studio-planner-pomodoro-durations', JSON.stringify(customDurations));
  }, [customDurations]);

  // When mode or durations change, reset duration if timer not running
  // NOTE: We DO NOT put timerRunning here to avoid resetting the remaining time when pausing!
  useEffect(() => {
    if (!timerRunning) {
      const timerSettings = {
        study: customDurations.study * 60,
        short: customDurations.short * 60,
        long: customDurations.long * 60
      };
      setTimeLeft(timerSettings[timerMode]);
    }
  }, [timerMode, customDurations]);

  // Timer countdown loop
  useEffect(() => {
    if (timerRunning) {
      timerIntervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setTimerRunning(false);
            if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
            SoundUtility.playTimerComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [timerRunning]);

  const toggleTimer = () => {
    const nextRunning = !timerRunning;
    setTimerRunning(nextRunning);
    if (nextRunning) {
      SoundUtility.playTimerStart();
    } else {
      SoundUtility.playTimerPause();
    }
  };

  const resetTimer = () => {
    setTimerRunning(false);
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    const timerSettings = {
      study: customDurations.study * 60,
      short: customDurations.short * 60,
      long: customDurations.long * 60
    };
    setTimeLeft(timerSettings[timerMode]);
    SoundUtility.playTimerPause();
  };


  // Sync version on mount (after state is set)
  useEffect(() => {
    localStorage.setItem(VERSION_KEY, PLANNER_VERSION);
  }, []);

  useEffect(() => { localStorage.setItem(`${LOCAL_STORAGE_KEY}-subjects`, JSON.stringify(subjects)); }, [subjects]);
  useEffect(() => { localStorage.setItem('antigravity-studio-planner-theme', theme); }, [theme]);
  useEffect(() => { localStorage.setItem(`${LOCAL_STORAGE_KEY}-weeks`, JSON.stringify(weeks)); }, [weeks]);
  useEffect(() => { localStorage.setItem(`${LOCAL_STORAGE_KEY}-activeWeekId`, activeWeekId); }, [activeWeekId]);
  useEffect(() => { localStorage.setItem(TITLE_STORAGE_KEY, sessionTitle); }, [sessionTitle]);
  useEffect(() => { localStorage.setItem('antigravity-studio-planner-event-colors', JSON.stringify(eventColors)); }, [eventColors]);
  useEffect(() => { localStorage.setItem('antigravity-studio-planner-task-font-size', taskFontSize.toString()); }, [taskFontSize]);
  useEffect(() => { localStorage.setItem('antigravity-studio-planner-day-font-size', dayFontSize.toString()); }, [dayFontSize]);

  // Check current Supabase Auth session on mount and listen to changes
  useEffect(() => {
    if (supabase) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        setUser(session?.user ?? null);
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user ?? null);
      });

      return () => subscription.unsubscribe();
    }
  }, [supabaseConfig]);

  // Fetch remote planner state from Supabase when user logs in
  useEffect(() => {
    const client = supabase;
    const fetchRemoteState = async () => {
      if (!client || !user) return;
      setIsSyncing(true);
      setSyncError('');
      try {
        const { data, error } = await client
          .from('user_planner_state')
          .select('*')
          .single();

        if (error) {
          if (error.code === 'PGRST116') {
            // No remote state found yet: initial push of current local state
            const { error: insertErr } = await client
              .from('user_planner_state')
              .upsert({
                user_id: user.id,
                weeks,
                subjects,
                session_title: sessionTitle,
                event_colors: eventColors,
                task_font_size: taskFontSize,
                day_font_size: dayFontSize,
                updated_at: new Date().toISOString()
              });
            if (insertErr) {
              console.error('Initial state upload failed:', insertErr);
              setSyncError(insertErr.message);
            } else {
              const currentStateStr = JSON.stringify({
                weeks,
                subjects,
                session_title: sessionTitle,
                event_colors: eventColors,
                task_font_size: taskFontSize,
                day_font_size: dayFontSize
              });
              lastKnownStateStrRef.current = currentStateStr;
              setLastSynced(new Date().toLocaleTimeString());
            }
          } else {
            console.error('Error fetching remote state:', error);
            setSyncError(error.message);
          }
        } else if (data) {
          const remoteStateStr = JSON.stringify({
            weeks: data.weeks,
            subjects: data.subjects,
            session_title: data.session_title,
            event_colors: data.event_colors,
            task_font_size: data.task_font_size,
            day_font_size: data.day_font_size
          });
          lastKnownStateStrRef.current = remoteStateStr;

          if (data.weeks && Array.isArray(data.weeks) && data.weeks.length > 0) setWeeks(data.weeks);
          if (data.subjects && Array.isArray(data.subjects)) setSubjects(data.subjects);
          if (data.session_title) setSessionTitle(data.session_title);
          if (data.event_colors) setEventColors(data.event_colors);
          if (data.task_font_size) setTaskFontSize(data.task_font_size);
          if (data.day_font_size) setDayFontSize(data.day_font_size);
          setLastSynced(new Date(data.updated_at).toLocaleTimeString());
        }
      } catch (err: any) {
        console.error('Failed to sync remote data:', err);
        setSyncError(err?.message || 'Errore di connessione a Supabase');
      } finally {
        setIsSyncing(false);
      }
    };

    fetchRemoteState();
  }, [user, supabaseConfig]);

  // Debounced Cloud Sync: push state changes to Supabase 1 second after user stops typing/clicking
  useEffect(() => {
    const client = supabase;
    if (!client || !user) return;

    const currentStateStr = JSON.stringify({
      weeks,
      subjects,
      session_title: sessionTitle,
      event_colors: eventColors,
      task_font_size: taskFontSize,
      day_font_size: dayFontSize
    });

    // If local state matches the last known remote state, skip pushing
    if (currentStateStr === lastKnownStateStrRef.current) return;

    const handler = setTimeout(async () => {
      setIsSyncing(true);
      try {
        const { error } = await client
          .from('user_planner_state')
          .upsert({
            user_id: user.id,
            weeks,
            subjects,
            session_title: sessionTitle,
            event_colors: eventColors,
            task_font_size: taskFontSize,
            day_font_size: dayFontSize,
            updated_at: new Date().toISOString()
          });

        if (error) {
          console.error('Error auto-syncing with cloud database:', error);
          setSyncError(error.message);
        } else {
          setSyncError('');
          lastKnownStateStrRef.current = currentStateStr;
          setLastSynced(new Date().toLocaleTimeString());
        }
      } catch (err: any) {
        console.error('Failed auto-sync push:', err);
        setSyncError(err?.message || 'Errore durante il salvataggio su Supabase');
      } finally {
        setIsSyncing(false);
      }
    }, 1000);

    return () => clearTimeout(handler);
  }, [weeks, subjects, sessionTitle, eventColors, taskFontSize, dayFontSize, user]);

  // Periodic background pull: fetch remote state every 5 minutes to sync changes from other devices
  useEffect(() => {
    const client = supabase;
    if (!client || !user) return;

    const pullInterval = setInterval(async () => {
      if (isSyncing) return; // Skip if we are pushing to avoid overwrite

      try {
        const { data, error } = await client
          .from('user_planner_state')
          .select('*')
          .single();

        if (error) {
          if (error.code !== 'PGRST116') {
            console.error('Error in periodic background pull:', error);
          }
          return;
        }

        if (data) {
          const remoteStateStr = JSON.stringify({
            weeks: data.weeks,
            subjects: data.subjects,
            session_title: data.session_title,
            event_colors: data.event_colors,
            task_font_size: data.task_font_size,
            day_font_size: data.day_font_size
          });

          const localStateStr = JSON.stringify({
            weeks,
            subjects,
            session_title: sessionTitle,
            event_colors: eventColors,
            task_font_size: taskFontSize,
            day_font_size: dayFontSize
          });

          // Update only if remote changes have occurred
          if (remoteStateStr !== localStateStr) {
            lastKnownStateStrRef.current = remoteStateStr;
            setWeeks(data.weeks);
            setSubjects(data.subjects);
            setSessionTitle(data.session_title);
            if (data.event_colors) setEventColors(data.event_colors);
            if (data.task_font_size) setTaskFontSize(data.task_font_size);
            if (data.day_font_size) setDayFontSize(data.day_font_size);
            setLastSynced(new Date(data.updated_at).toLocaleTimeString());
          }
        }
      } catch (err) {
        console.error('Failed background pull:', err);
      }
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(pullInterval);
  }, [user, weeks, subjects, sessionTitle, eventColors, taskFontSize, dayFontSize, isSyncing, supabaseConfig]);

  // Manual Sync Trigger
  const handleForceSync = async () => {
    const client = supabase;
    if (!client || !user) return;
    setIsSyncing(true);
    try {
      const { error } = await client
        .from('user_planner_state')
        .upsert({
          user_id: user.id,
          weeks,
          subjects,
          session_title: sessionTitle,
          event_colors: eventColors,
          task_font_size: taskFontSize,
          day_font_size: dayFontSize,
          updated_at: new Date().toISOString()
        });

      if (error) {
        setSyncError(error.message);
        alert("Errore durante la sincronizzazione: " + error.message);
      } else {
        setSyncError('');
        const currentStateStr = JSON.stringify({
          weeks,
          subjects,
          session_title: sessionTitle,
          event_colors: eventColors,
          task_font_size: taskFontSize,
          day_font_size: dayFontSize
        });
        lastKnownStateStrRef.current = currentStateStr;
        setLastSynced(new Date().toLocaleTimeString());
        alert("Sincronizzazione completata con successo!");
      }
    } catch (err: any) {
      setSyncError(err?.message || 'Errore di rete');
      alert("Errore di rete: " + err.message);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleConnectSupabase = (url: string, key: string) => {
    const success = updateSupabaseClient(url, key);
    if (success) {
      setSupabaseConfig({ url, anonKey: key });
      setSyncError('');
      return true;
    }
    return false;
  };

  const handleDisconnectSupabase = () => {
    clearSupabaseClient();
    setSupabaseConfig({ url: '', anonKey: '' });
    setUser(null);
    setLastSynced('');
    setSyncError('');
  };

  // Sync task completed state from subjects to calendar items
  useEffect(() => {
    setWeeks((prevWeeks) => {
      let changed = false;
      const nextWeeks = prevWeeks.map((w) => {
        const nextDays = w.days.map((d) => {
          let dayChanged = false;
          const slotsToSync = (['mattina', 'pomeriggio', 'sera'] as const).map((slotKey) => {
            let slotChanged = false;
            const nextSlot = d[slotKey].map((item) => {
              if (item.subjectId) {
                const subject = subjects.find((s) => s.id === item.subjectId);
                const task = subject?.tasks.find((t) => item.taskId ? t.id === item.taskId : t.name === item.name);
                if (task && item.completed !== task.completed) {
                  slotChanged = true;
                  return { ...item, completed: task.completed };
                }
              }
              return item;
            });
            if (slotChanged) slotChanged = true; // flag slot as updated
            const isSlotUpdated = nextSlot.some((ni, idx) => ni !== d[slotKey][idx]);
            if (isSlotUpdated) {
              dayChanged = true;
            }
            return nextSlot;
          });
          if (dayChanged) {
            return {
              ...d,
              mattina: slotsToSync[0],
              pomeriggio: slotsToSync[1],
              sera: slotsToSync[2],
            };
          }
          return d;
        });
        const isWeekUpdated = nextDays.some((nd, idx) => nd !== w.days[idx]);
        if (isWeekUpdated) {
          changed = true;
          return { ...w, days: nextDays };
        }
        return w;
      });
      return changed ? nextWeeks : prevWeeks;
    });
  }, [subjects]);


  const handleAddSubject = (name: string, pages: number, color: string) => {
    setSubjects([...subjects, {
      id: `subj-${Date.now()}`, name, pages, completed: false,
      color, logo: 'shield', description: '', tasks: [],
    }]);
  };

  const handleToggleSubject = (id: string) => {
    setSubjects(subjects.map((s) => (s.id === id ? { ...s, completed: !s.completed } : s)));
  };

  const handleDeleteSubject = (id: string) => {
    if (window.confirm("Sei sicuro di voler eliminare questa materia dalla libreria?")) {
      setSubjects(subjects.filter((s) => s.id !== id));
    }
  };


  const handleAddEvent = (
    title: string,
    eventType: 'esame' | 'svago' | 'lezione' | 'altro',
    slots: Array<{ dayId: string; slotKey: 'mattina' | 'pomeriggio' | 'sera' }>
  ) => {
    const updatedWeeks = JSON.parse(JSON.stringify(weeks)) as WeekPlan[];
    for (const slot of slots) {
      for (const w of updatedWeeks) {
        const day = w.days.find(d => d.id === slot.dayId);
        if (day) {
          day[slot.slotKey].push({
            id: `cal-event-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
            name: title,
            eventType,
            completed: false,
          });
          break;
        }
      }
    }
    setWeeks(updatedWeeks);
    setShowAddEventModal(false);
  };

  const handleImportState = (importedState: PlannerState) => {
    setWeeks(importedState.weeks);
    setSubjects(importedState.subjects);
    if (importedState.weeks.length > 0) {
      setActiveWeekId(importedState.activeWeekId || importedState.weeks[0].id);
    }
  };


  const handleResetAll = () => {
    if (window.confirm("⚠️ ATTENZIONE: Questo cancellerà PERMANENTEMENTE tutti i tuoi dati di studio. Vuoi procedere?")) {
      localStorage.removeItem(`${LOCAL_STORAGE_KEY}-subjects`);
      localStorage.removeItem(`${LOCAL_STORAGE_KEY}-weeks`);
      localStorage.removeItem(`${LOCAL_STORAGE_KEY}-activeWeekId`);
      localStorage.removeItem(TITLE_STORAGE_KEY);
      localStorage.removeItem(VERSION_KEY);
      setSubjects(INITIAL_SUBJECTS);
      setWeeks(INITIAL_WEEKS);
      setActiveWeekId(INITIAL_WEEKS[0].id);
      setSessionTitle('SESSIONE ESTIVA');
    }
  };

  return (
    <div className={`app-container ${theme === 'light' ? 'light-theme' : ''}`}>
      <style>{`
        :root {
          --event-esame-color: ${eventColors.esame};
          --event-svago-color: ${eventColors.svago};
          --event-lezione-color: ${eventColors.lezione};
          --event-altro-color: ${eventColors.altro};
          
          --event-esame-bg: ${eventColors.esame}1f;
          --event-esame-border: ${eventColors.esame}66;
          
          --event-svago-bg: ${eventColors.svago}1f;
          --event-svago-border: ${eventColors.svago}66;
          
          --event-lezione-bg: ${eventColors.lezione}1f;
          --event-lezione-border: ${eventColors.lezione}66;
          
          --event-altro-bg: ${eventColors.altro}1f;
          --event-altro-border: ${eventColors.altro}66;
        }
      `}</style>
      <header className="app-header">
        <div className="header-title-container">
          <div className="session-badge">
            <BookIcon size={14} />
            Studio Workspace
          </div>
          <input
            type="text"
            value={sessionTitle}
            onChange={(e) => setSessionTitle(e.target.value)}
            className="app-title-editable"
            title="Clicca per rinominare la sessione"
          />
        </div>

        <div className="header-navigation-tabs">
          <button
            className={`nav-tab-btn ${activeTab === 'oggi' ? 'active' : ''}`}
            onClick={() => { setActiveTab('oggi'); SoundUtility.playNavClick(); }}
            title="Visualizza il focus della giornata odierna"
          >
            <FlameIcon size={15} />
            Oggi
          </button>
          <button
            className={`nav-tab-btn ${activeTab === 'planner' ? 'active' : ''}`}
            onClick={() => { setActiveTab('planner'); SoundUtility.playNavClick(); }}
            title="Mostra la programmazione del calendario"
          >
            <CalendarIcon size={15} />
            Planner
          </button>
          <button
            className={`nav-tab-btn ${activeTab === 'subjects' ? 'active' : ''}`}
            onClick={() => { setActiveTab('subjects'); SoundUtility.playNavClick(); }}
            title="Gestisci le materie e i sotto-task in dettaglio"
          >
            <BookIcon size={15} />
            Le tue materie
          </button>
        </div>

        <div className="header-controls">
          {(activeTab === 'planner' || activeTab === 'oggi') && (
            <button
              className="btn btn-primary btn-sm"
              onClick={() => setShowAddEventModal(true)}
              title="Aggiungi un evento speciale (esame, svago) al calendario"
            >
              <PlusIcon size={15} />
              <span>Aggiungi Evento</span>
            </button>
          )}
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => { setShowSettingsModal(true); SoundUtility.playNavClick(); }}
            title="Apri le impostazioni del workspace"
          >
            <SettingsIcon size={15} />
            <span>Impostazioni</span>
          </button>
        </div>
      </header>


      {activeTab === 'subjects' && (
        <div className="tab-pane-container">
          <SubjectsManager subjects={subjects} onUpdateSubjects={setSubjects} onResetAll={handleResetAll} weeks={weeks} />
        </div>
      )}

      {activeTab === 'oggi' && (
        <div className="tab-pane-container">
          <TodayFocus
            weeks={weeks}
            subjects={subjects}
            onUpdateAllWeeks={setWeeks}
            onUpdateSubjects={setSubjects}
            eventColors={eventColors}
            taskFontSize={taskFontSize}
            dayFontSize={dayFontSize}
            timerMode={timerMode}
            setTimerMode={setTimerMode}
            customDurations={customDurations}
            setCustomDurations={setCustomDurations}
            timeLeft={timeLeft}
            timerRunning={timerRunning}
            toggleTimer={toggleTimer}
            resetTimer={resetTimer}
          />
        </div>
      )}

      {activeTab === 'planner' && (
        <div className="tab-pane-container main-dashboard-layout">
          {/* Sidebar — always in DOM, animated via CSS */}
          <aside className={`layout-left-column ${isSidebarOpen ? '' : 'sidebar-panel-closed'}`}>
            <MaterialsList
              subjects={subjects}
              weeks={weeks}
              onAddSubject={handleAddSubject}
              onToggleSubject={handleToggleSubject}
              onDeleteSubject={handleDeleteSubject}
              onUpdateSubjects={setSubjects}
            />
          </aside>

          {/* Sidebar toggle strip — always visible at boundary */}
          <div className="sidebar-handle-col">
            <button
              className={`sidebar-strip-toggle ${isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              title={isSidebarOpen ? 'Chiudi libreria' : 'Apri libreria'}
            >
              {isSidebarOpen ? <ChevronLeftIcon size={13} /> : <ChevronRightIcon size={13} />}
            </button>
          </div>

          <main className="layout-right-column">
            {weeks
              .filter((week) => !isWeekInPast(week))
              .map((week) => (
                <div key={week.id} className="week-wrapper">
                  <WeeklyGrid
                    activeWeek={week}
                    weeks={weeks}
                    subjects={subjects}
                    onUpdateAllWeeks={setWeeks}
                    onUpdateSubjects={setSubjects}
                  />
                </div>
              ))}
          </main>
        </div>
      )}

      {showAddEventModal && (
        <AddEventModal
          weeks={weeks}
          onClose={() => setShowAddEventModal(false)}
          onConfirm={handleAddEvent}
        />
      )}

      {showSettingsModal && (
        <SettingsModal
          weeks={weeks}
          subjects={subjects}
          activeWeekId={activeWeekId}
          onImportState={handleImportState}
          onResetAll={handleResetAll}
          eventColors={eventColors}
          onChangeEventColors={setEventColors}
          onClose={() => setShowSettingsModal(false)}
          taskFontSize={taskFontSize}
          onChangeTaskFontSize={setTaskFontSize}
          dayFontSize={dayFontSize}
          onChangeDayFontSize={setDayFontSize}
          user={user}
          onUserChange={setUser}
          isSyncing={isSyncing}
          syncError={syncError}
          lastSynced={lastSynced}
          supabaseConfig={supabaseConfig}
          onConnectSupabase={handleConnectSupabase}
          onDisconnectSupabase={handleDisconnectSupabase}
          onForceSync={handleForceSync}
        />
      )}
    </div>
  );
}

export default App;

