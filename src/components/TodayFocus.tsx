import React, { useState, useEffect, useRef } from 'react';
import type { WeekPlan, Subject, CalendarItem } from '../types/planner';
import { 
  FlameIcon, 
  XIcon, 
  PlusIcon, 
  TrashIcon, 
  ChevronLeftIcon, 
  ChevronRightIcon, 
  ClockIcon, 
  SunIcon, 
  MoonIcon,
  LandscapeIcon,
  CheckIcon,
  PenIcon
} from './Icons';

interface TodayFocusProps {
  weeks: WeekPlan[];
  subjects: Subject[];
  onUpdateAllWeeks: (updatedWeeks: WeekPlan[]) => void;
  onUpdateSubjects: (updatedSubjects: Subject[]) => void;
}

interface QuickTodo {
  id: string;
  name: string;
  completed: boolean;
}

export const TodayFocus: React.FC<TodayFocusProps> = ({
  weeks,
  subjects,
  onUpdateAllWeeks,
  onUpdateSubjects
}) => {
  // 1. --- Navigation & Date Logic ---
  // Create a flat array of all scheduled days for easier navigation
  const allDays = weeks.flatMap(w => 
    w.days.map(d => ({ 
      ...d, 
      weekId: w.id,
      weekName: w.name 
    }))
  );

  const todayDate = new Date();
  const monthsShort = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'];
  const todayDateLabel = `${todayDate.getDate()} ${monthsShort[todayDate.getMonth()]}`;

  // Find index of today
  const todayIndex = allDays.findIndex(d => d.dateLabel === todayDateLabel);
  const initialIndex = todayIndex !== -1 ? todayIndex : 0;

  const [selectedDayIndex, setSelectedDayIndex] = useState(initialIndex);
  const activeDay = allDays[selectedDayIndex];

  // Helper to check if a day is today
  const isActualToday = activeDay?.dateLabel === todayDateLabel;

  const handlePrevDay = () => {
    if (selectedDayIndex > 0) setSelectedDayIndex(selectedDayIndex - 1);
  };

  const handleNextDay = () => {
    if (selectedDayIndex < allDays.length - 1) setSelectedDayIndex(selectedDayIndex + 1);
  };

  // 2. --- Pomodoro Timer Widget ---
  const [timerMode, setTimerMode] = useState<'classic' | 'hard'>('classic');
  const [timeLeft, setTimeLeft] = useState(25 * 60); // default 25 min
  const [timerRunning, setTimerRunning] = useState(false);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // When mode changes, reset duration
  useEffect(() => {
    setTimerRunning(false);
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    setTimeLeft(timerMode === 'classic' ? 25 * 60 : 50 * 60);
  }, [timerMode]);

  // Handle countdown loop
  useEffect(() => {
    if (timerRunning) {
      timerIntervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setTimerRunning(false);
            if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
            playCompletionSound();
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
    setTimerRunning(!timerRunning);
  };

  const resetTimer = () => {
    setTimerRunning(false);
    setTimeLeft(timerMode === 'classic' ? 25 * 60 : 50 * 60);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Sound Synthesizer via Web Audio API (Triple C5-E5-G5 Major Chime)
  const playCompletionSound = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      
      const playTone = (time: number, freq: number, duration: number) => {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, time);
        gainNode.gain.setValueAtTime(0.15, time);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, time + duration);
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        osc.start(time);
        osc.stop(time + duration);
      };
      
      const now = ctx.currentTime;
      playTone(now, 523.25, 0.4);       // C5
      playTone(now + 0.15, 659.25, 0.4);  // E5
      playTone(now + 0.3, 783.99, 0.5);   // G5
    } catch (e) {
      console.warn("Sintesi audio bloccata o non supportata dal browser: ", e);
    }
  };

  // 3. --- Streak Widget ---
  const [streakDays, setStreakDays] = useState<number>(() => {
    const saved = localStorage.getItem('antigravity-studio-planner-streak');
    return saved ? parseInt(saved) : 5; // default 5 as in sketch
  });

  useEffect(() => {
    localStorage.setItem('antigravity-studio-planner-streak', streakDays.toString());
  }, [streakDays]);

  // Compute completed tasks today
  const getTodayTasksProgress = () => {
    if (!activeDay) return { completed: 0, total: 0 };
    const slots = ['mattina', 'pomeriggio', 'sera'] as const;
    let completed = 0;
    let total = 0;
    for (const slot of slots) {
      const items = activeDay[slot] || [];
      total += items.length;
      completed += items.filter(i => i.completed).length;
    }
    return { completed, total };
  };

  const progress = getTodayTasksProgress();

  // 4. --- Quick Todo Widget ("TO DO: aggiungere") ---
  const [quickTodos, setQuickTodos] = useState<QuickTodo[]>(() => {
    const saved = localStorage.getItem('antigravity-studio-planner-quick-todos');
    return saved ? JSON.parse(saved) : [
      { id: 'q-1', name: 'Stampare slide Cloud Security', completed: false },
      { id: 'q-2', name: 'Inviare email prof per tutorato', completed: false }
    ];
  });

  const [newTodoText, setNewTodoText] = useState('');

  useEffect(() => {
    localStorage.setItem('antigravity-studio-planner-quick-todos', JSON.stringify(quickTodos));
  }, [quickTodos]);

  const handleAddQuickTodo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodoText.trim()) return;
    const newTodo: QuickTodo = {
      id: `quick-todo-${Date.now()}`,
      name: newTodoText.trim(),
      completed: false
    };
    setQuickTodos([...quickTodos, newTodo]);
    setNewTodoText('');
  };

  const handleToggleQuickTodo = (id: string) => {
    setQuickTodos(quickTodos.map(todo => 
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ));
  };

  const handleDeleteQuickTodo = (id: string) => {
    setQuickTodos(quickTodos.filter(todo => todo.id !== id));
  };

  // 5. --- Agenda Item Actions ---
  const handleToggleItem = (dayId: string, slotKey: 'mattina' | 'pomeriggio' | 'sera', itemId: string) => {
    let foundItem: CalendarItem | null = null;
    for (const w of weeks) {
      const day = w.days.find(d => d.id === dayId);
      if (day) {
        foundItem = day[slotKey].find(i => i.id === itemId) || null;
        if (foundItem) break;
      }
    }
    if (!foundItem) return;
    const newCompleted = !foundItem.completed;

    // Update calendar weeks immutably
    const updatedWeeks = weeks.map(w => ({
      ...w,
      days: w.days.map(d => d.id !== dayId ? d : {
        ...d,
        [slotKey]: d[slotKey].map(i => i.id === itemId ? { ...i, completed: newCompleted } : i),
      }),
    }));
    onUpdateAllWeeks(updatedWeeks);

    // Sync completion to subjects (only for task items linked to a subject)
    if (foundItem.subjectId) {
      const item = foundItem;
      onUpdateSubjects(subjects.map(s => {
        if (s.id !== item.subjectId) return s;
        const updatedTasks = s.tasks.map(t => {
          const isMatch = item.taskId ? t.id === item.taskId : t.name === item.name;
          return isMatch ? { ...t, completed: newCompleted } : t;
        });
        return {
          ...s,
          tasks: updatedTasks,
          completed: updatedTasks.length > 0 && updatedTasks.every(t => t.completed),
        };
      }));
    }
  };

  const getSubjectColor = (subjectId?: string) => {
    if (!subjectId) return undefined;
    const sub = subjects.find(s => s.id === subjectId);
    return sub ? sub.color : undefined;
  };

  const getSubjectName = (subjectId?: string) => {
    if (!subjectId) return '';
    const sub = subjects.find(s => s.id === subjectId);
    return sub ? sub.name : '';
  };

  return (
    <div className="today-focus-dashboard animate-fade-in" style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '30px', padding: '10px 10px 40px 10px' }}>
      
      {/* LEFT COLUMN: Agenda del Giorno */}
      <div className="today-agenda-col" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* Navigation Date Header */}
        <header className="today-nav-header glass-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderRadius: '12px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 800, letterSpacing: '-0.02em', color: '#ffffff', margin: 0 }}>
              BUONGIORNO ENRICO!
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span className="selected-day-label" style={{ fontSize: '13px', fontWeight: 600, color: '#f8fafc' }}>
                {activeDay?.name} {activeDay?.dateLabel.split(' ')[1]}
              </span>
              <span style={{ fontSize: '11px', color: '#71717a' }}>•</span>
              <span style={{ fontSize: '11px', color: '#71717a', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>
                {activeDay?.weekName}
              </span>
              {isActualToday && (
                <span className="today-nav-badge" style={{ background: 'rgba(234,88,12,0.15)', color: '#ea580c', border: '1px solid rgba(234,88,12,0.3)', padding: '1px 5px', fontSize: '9px', fontWeight: 800, borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '0.04em', marginLeft: '4px' }}>
                  Oggi
                </span>
              )}
            </div>
          </div>

          <div className="day-nav-buttons" style={{ display: 'flex', gap: '8px' }}>
            <button 
              type="button" 
              className="btn btn-secondary btn-icon-only" 
              onClick={handlePrevDay} 
              disabled={selectedDayIndex === 0}
              title="Giorno Precedente"
            >
              <ChevronLeftIcon size={16} />
            </button>
            <button 
              type="button" 
              className="btn btn-secondary btn-icon-only" 
              onClick={handleNextDay} 
              disabled={selectedDayIndex === allDays.length - 1}
              title="Giorno Successivo"
            >
              <ChevronRightIcon size={16} />
            </button>
          </div>
        </header>

        {/* 3 Time Slots Blocks (Mattina, Pomeriggio, Sera) */}
        {(['mattina', 'pomeriggio', 'sera'] as const).map((slotKey) => {
          const items = activeDay ? activeDay[slotKey] || [] : [];
          const slotIcons = {
            mattina: <LandscapeIcon size={16} className="text-gold" />,
            pomeriggio: <SunIcon size={16} className="text-orange" />,
            sera: <MoonIcon size={16} className="text-purple" />
          };
          const slotLabels = { mattina: 'Mattina', pomeriggio: 'Pomeriggio', sera: 'Sera' };

          return (
            <div key={slotKey} className="today-slot-card glass-container animate-slide-down" style={{ borderRadius: '12px', overflow: 'hidden' }}>
              <div className="today-slot-header" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 20px', background: 'rgba(255,255,255,0.01)', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                {slotIcons[slotKey]}
                <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#f4f4f5', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
                  {slotLabels[slotKey]}
                </h3>
                <span className="slot-items-count" style={{ marginLeft: 'auto', background: 'rgba(255,255,255,0.06)', padding: '2px 8px', borderRadius: '10px', fontSize: '10px', color: '#a1a1aa', fontWeight: 600 }}>
                  {items.length} {items.length === 1 ? 'attività' : 'attività'}
                </span>
              </div>

              <div className="today-slot-body" style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {items.length === 0 ? (
                  <div className="today-slot-empty" style={{ fontSize: '12px', color: '#52525b', fontStyle: 'italic', padding: '8px 0' }}>
                    Nessun compito o evento programmato.
                  </div>
                ) : (
                  items.map((item) => {
                    const isEvent = !!item.eventType;
                    const subColor = getSubjectColor(item.subjectId);
                    const subName = getSubjectName(item.subjectId);

                    return (
                      <div 
                        key={item.id} 
                        className={`today-task-row scheduled-item-pill ${isEvent ? `event-pill event-${item.eventType}` : ''} ${item.completed ? 'completed' : ''}`}
                        style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          padding: '10px 14px', 
                          borderRadius: '8px',
                          borderLeftWidth: '4px',
                          borderLeftStyle: 'solid',
                          borderLeftColor: isEvent ? `var(--event-${item.eventType}-color)` : (subColor || '#d97706'),
                          background: isEvent ? `var(--event-${item.eventType}-bg)` : 'rgba(255,255,255,0.015)',
                          borderTop: '1px solid rgba(255,255,255,0.03)',
                          borderRight: '1px solid rgba(255,255,255,0.03)',
                          borderBottom: '1px solid rgba(255,255,255,0.03)'
                        }}
                      >
                        {/* Checkbox */}
                        <label className="checkbox-container-sm" style={{ marginRight: '12px' }}>
                          <input 
                            type="checkbox" 
                            checked={item.completed} 
                            onChange={() => handleToggleItem(activeDay.id, slotKey, item.id)}
                          />
                          <span 
                            className="checkmark-sm"
                            style={{ 
                              '--accent-color': isEvent ? `var(--event-${item.eventType}-color)` : subColor 
                            } as React.CSSProperties}
                          ></span>
                        </label>

                        {/* Info details */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', flex: 1 }}>
                          <span className="item-name" style={{ fontSize: '13.5px', fontWeight: 600, color: '#ffffff' }}>
                            {item.name}
                          </span>
                          {!isEvent && (subName || item.pages) && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              {subName && (
                                <span style={{ fontSize: '10px', fontWeight: 700, color: subColor, background: `${subColor}15`, padding: '1px 5px', borderRadius: '4px' }}>
                                  {subName}
                                </span>
                              )}
                              {item.pages && (
                                <span style={{ fontSize: '10px', color: '#71717a' }}>
                                  {item.pages} pagine
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Event Category Badge */}
                        {isEvent && (
                          <span className={`event-type-badge event-badge-${item.eventType}`} style={{ fontSize: '8px', fontWeight: 800, padding: '2px 6px', borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                            {item.eventType}
                          </span>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* RIGHT COLUMN: Interactive Widgets */}
      <div className="today-widgets-col" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* Widget 1: POMODORO TIMER */}
        <div className="widget-card glass-container" style={{ padding: '20px', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <h4 style={{ fontSize: '11px', fontWeight: 800, color: '#a1a1aa', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '14px', width: '100%', textAlign: 'center' }}>
            Pomodoro Timer
          </h4>
          
          {/* Modes pill selector */}
          <div className="timer-mode-pills" style={{ display: 'flex', background: '#18181b', padding: '4px', borderRadius: '8px', width: '100%', marginBottom: '20px', border: '1px solid rgba(255,255,255,0.03)' }}>
            <button 
              type="button" 
              onClick={() => setTimerMode('classic')}
              style={{ 
                flex: 1, 
                border: 'none', 
                background: timerMode === 'classic' ? 'rgba(255,255,255,0.06)' : 'transparent', 
                color: timerMode === 'classic' ? '#ffffff' : '#71717a', 
                fontSize: '11px', 
                fontWeight: 700, 
                padding: '6px 0', 
                borderRadius: '6px', 
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              Classic
            </button>
            <button 
              type="button" 
              onClick={() => setTimerMode('hard')}
              style={{ 
                flex: 1, 
                border: 'none', 
                background: timerMode === 'hard' ? 'rgba(255,255,255,0.06)' : 'transparent', 
                color: timerMode === 'hard' ? '#ffffff' : '#71717a', 
                fontSize: '11px', 
                fontWeight: 700, 
                padding: '6px 0', 
                borderRadius: '6px', 
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              Hard
            </button>
          </div>

          {/* Time Display */}
          <div className="timer-time-display" style={{ fontSize: '48px', fontWeight: 900, fontFamily: 'monospace', letterSpacing: '0.02em', color: timerRunning ? '#f43f5e' : '#ffffff', marginBottom: '20px', textShadow: timerRunning ? '0 0 10px rgba(244,63,94,0.15)' : 'none' }}>
            {formatTime(timeLeft)}
          </div>

          {/* Control Buttons */}
          <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
            <button 
              type="button" 
              className={`btn ${timerRunning ? 'btn-secondary' : 'btn-primary'}`} 
              onClick={toggleTimer}
              style={{ flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
            >
              <ClockIcon size={14} />
              <span>{timerRunning ? 'Pausa' : 'Start'}</span>
            </button>
            
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={resetTimer}
              style={{ flex: 1, justifyContent: 'center' }}
            >
              Reset
            </button>
          </div>
        </div>

        {/* Widget 2: STREAK */}
        <div className="widget-card glass-container animate-fade-in" style={{ padding: '18px 20px', borderRadius: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#a1a1aa', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              Streak
            </span>
            <div style={{ display: 'flex', gap: '4px' }}>
              <button 
                type="button" 
                onClick={() => setStreakDays(Math.max(0, streakDays - 1))}
                style={{ width: '18px', height: '18px', background: 'rgba(255,255,255,0.04)', border: 'none', borderRadius: '4px', color: '#a1a1aa', fontSize: '11px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                -
              </button>
              <button 
                type="button" 
                onClick={() => setStreakDays(streakDays + 1)}
                style={{ width: '18px', height: '18px', background: 'rgba(255,255,255,0.04)', border: 'none', borderRadius: '4px', color: '#a1a1aa', fontSize: '11px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                +
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', background: 'rgba(234, 88, 12, 0.03)', border: '1px solid rgba(234, 88, 12, 0.08)', padding: '10px 14px', borderRadius: '8px', marginBottom: '12px' }}>
            <div className="streak-fire-container" style={{ background: 'rgba(234, 88, 12, 0.1)', padding: '8px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 15px rgba(234, 88, 12, 0.25)' }}>
              <FlameIcon size={24} style={{ color: '#ea580c' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '18px', fontWeight: 900, color: '#ffffff', letterSpacing: '-0.01em', lineHeight: '1.2' }}>
                {streakDays} GIORNI
              </span>
              <span style={{ fontSize: '10px', color: '#71717a', fontWeight: 600 }}>
                {progress.total > 0 && progress.completed === progress.total 
                  ? 'Tutti i compiti finiti oggi!' 
                  : `${progress.completed} di ${progress.total} completati`}
              </span>
            </div>
          </div>

          {/* 7-day progress visualizer dots */}
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 4px' }}>
            {[...Array(7)].map((_, i) => {
              const isActive = i < 5; // default 5 active days visual
              return (
                <div 
                  key={i} 
                  style={{ 
                    width: '10px', 
                    height: '10px', 
                    borderRadius: '50%', 
                    background: isActive ? '#ea580c' : 'rgba(255, 255, 255, 0.06)',
                    boxShadow: isActive ? '0 0 8px rgba(234, 88, 12, 0.6)' : 'none',
                    transition: 'all 0.3s ease'
                  }} 
                  title={`Giorno ${i + 1}`}
                />
              );
            })}
          </div>
        </div>

        {/* Widget 3: TO DO LIST ("TO DO: aggiungere") */}
        <div className="widget-card glass-container animate-fade-in" style={{ padding: '18px 20px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#a1a1aa', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              To Do: aggiungere
            </span>
            <PenIcon size={12} className="text-gold" />
          </div>

          {/* Quick Todo Form */}
          <form onSubmit={handleAddQuickTodo} style={{ display: 'flex', gap: '8px' }}>
            <input 
              type="text" 
              placeholder="Aggiungi compito rapido..." 
              value={newTodoText}
              onChange={(e) => setNewTodoText(e.target.value)}
              style={{ 
                flex: 1, 
                background: '#18181b', 
                border: '1px solid rgba(255,255,255,0.06)', 
                borderRadius: '6px', 
                color: '#e4e4e7', 
                fontSize: '11px', 
                padding: '6px 10px',
                outline: 'none'
              }}
            />
            <button 
              type="submit" 
              style={{ 
                width: '26px', 
                height: '26px', 
                background: '#ea580c', 
                border: 'none', 
                borderRadius: '6px', 
                color: '#ffffff', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                cursor: 'pointer' 
              }}
              title="Aggiungi"
            >
              <PlusIcon size={14} />
            </button>
          </form>

          {/* Quick Todos List */}
          <div className="quick-todos-list" style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '160px', overflowY: 'auto', paddingRight: '2px' }}>
            {quickTodos.length === 0 ? (
              <div style={{ fontSize: '11px', color: '#52525b', fontStyle: 'italic', padding: '4px 0' }}>
                Nessun compito extra inserito.
              </div>
            ) : (
              quickTodos.map(todo => (
                <div 
                  key={todo.id} 
                  className={`quick-todo-item ${todo.completed ? 'completed' : ''}`}
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    background: 'rgba(255,255,255,0.01)', 
                    border: '1px solid rgba(255,255,255,0.03)', 
                    padding: '8px 10px', 
                    borderRadius: '6px',
                    opacity: todo.completed ? 0.5 : 1,
                    transition: 'all 0.2s ease'
                  }}
                >
                  <label className="checkbox-container-sm" style={{ marginRight: '10px' }}>
                    <input 
                      type="checkbox" 
                      checked={todo.completed} 
                      onChange={() => handleToggleQuickTodo(todo.id)}
                    />
                    <span className="checkmark-sm" style={{ '--accent-color': '#ea580c' } as React.CSSProperties}></span>
                  </label>
                  <span style={{ fontSize: '12px', color: '#e4e4e7', textDecoration: todo.completed ? 'line-through' : 'none', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={todo.name}>
                    {todo.name}
                  </span>
                  <button 
                    type="button" 
                    onClick={() => handleDeleteQuickTodo(todo.id)}
                    style={{ background: 'transparent', border: 'none', color: '#71717a', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    title="Elimina"
                  >
                    <TrashIcon size={12} />
                  </button>
                </div>
              ))
            )}
          </div>

        </div>

      </div>

    </div>
  );
};
