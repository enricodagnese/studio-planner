import React, { useState, useEffect, useRef } from 'react';
import type { WeekPlan, Subject, CalendarItem, TaskQuantityType } from '../types/planner';
import { 
  PlusIcon, 
  TrashIcon, 
  ChevronLeftIcon, 
  ChevronRightIcon, 
  ClockIcon, 
  SunIcon, 
  MoonIcon,
  PenIcon,
  XIcon
} from './Icons';

interface TodayFocusProps {
  weeks: WeekPlan[];
  subjects: Subject[];
  onUpdateAllWeeks: (updatedWeeks: WeekPlan[]) => void;
  onUpdateSubjects: (updatedSubjects: Subject[]) => void;
  eventColors?: {
    esame: string;
    svago: string;
    lezione: string;
    altro: string;
  };
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
  onUpdateSubjects,
  eventColors = { esame: '#ef4444', svago: '#3b82f6', lezione: '#10b981', altro: '#a78bfa' }
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



  const handlePrevDay = () => {
    if (selectedDayIndex > 0) setSelectedDayIndex(selectedDayIndex - 1);
  };

  const handleNextDay = () => {
    if (selectedDayIndex < allDays.length - 1) setSelectedDayIndex(selectedDayIndex + 1);
  };

  // 2. --- Pomodoro Timer Widget ---
  const [timerVersion, setTimerVersion] = useState<'classic' | 'potter'>(() => {
    const saved = localStorage.getItem('antigravity-studio-planner-timer-version');
    return (saved as 'classic' | 'potter') || 'classic';
  });
  const [timerMode, setTimerMode] = useState<'study' | 'short' | 'long'>(() => {
    const saved = localStorage.getItem('antigravity-studio-planner-timer-mode');
    return (saved as 'study' | 'short' | 'long') || 'study';
  });

  const timerSettings = {
    classic: {
      study: { label: 'Pomodoro', duration: 25 * 60, color: '#ba4f4f' },
      short: { label: 'Short Break', duration: 5 * 60, color: '#38858a' },
      long: { label: 'Long Break', duration: 15 * 60, color: '#397097' }
    },
    potter: {
      study: { label: 'Hogwarts Study', duration: 50 * 60, color: '#740001' },
      short: { label: 'Common Room', duration: 10 * 60, color: '#1a472a' },
      long: { label: 'Great Hall Feast', duration: 20 * 60, color: '#0e1a40' }
    }
  };

  const currentSettings = timerSettings[timerVersion][timerMode];
  const [timeLeft, setTimeLeft] = useState(currentSettings.duration);
  const [timerRunning, setTimerRunning] = useState(false);
  const timerIntervalRef = useRef<any>(null);

  // Save timer selections
  useEffect(() => {
    localStorage.setItem('antigravity-studio-planner-timer-version', timerVersion);
    localStorage.setItem('antigravity-studio-planner-timer-mode', timerMode);
  }, [timerVersion, timerMode]);

  // When version or mode changes, reset duration and stop timer
  useEffect(() => {
    setTimerRunning(false);
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    setTimeLeft(timerSettings[timerVersion][timerMode].duration);
  }, [timerVersion, timerMode]);

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
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    setTimeLeft(timerSettings[timerVersion][timerMode].duration);
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

  // Streak Widget removed per user request

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

  const handleDeleteItem = (dayId: string, slotKey: 'mattina' | 'pomeriggio' | 'sera', itemId: string) => {
    let foundItem: CalendarItem | null = null;
    for (const w of weeks) {
      const day = w.days.find(d => d.id === dayId);
      if (day) {
        foundItem = day[slotKey].find(i => i.id === itemId) || null;
        if (foundItem) break;
      }
    }

    onUpdateAllWeeks(weeks.map(w => ({
      ...w,
      days: w.days.map(d => d.id !== dayId ? d : {
        ...d,
        [slotKey]: d[slotKey].filter(i => i.id !== itemId),
      }),
    })));

    if (foundItem && foundItem.subjectId && foundItem.taskId) {
      const item = foundItem;
      onUpdateSubjects(subjects.map(s => {
        if (s.id !== item.subjectId) return s;
        const updatedTasks = s.tasks.map(t => t.id === item.taskId ? { ...t, completed: false } : t);
        return {
          ...s,
          tasks: updatedTasks,
          completed: false,
        };
      }));
    }
  };

  const getQtyLabel = (pages?: number, quantityType?: TaskQuantityType): string => {
    if (!pages) return '';
    switch (quantityType) {
      case 'ore-video': return `${pages}h video`;
      case 'esercizi':  return `${pages} esercizi`;
      case 'quiz':      return `${pages} quiz`;
      default:          return `${pages} pag`;
    }
  };

  const getSubjectColorClass = (subjectId?: string) => {
    if (!subjectId) return 'item-custom';
    const sub = subjects.find(s => s.id === subjectId);
    if (!sub) return 'item-custom';
    const colorsMap: Record<string, string> = {
      '#fbbf24': 'color-gold',   '#60a5fa': 'color-blue',
      '#34d399': 'color-emerald','#a78bfa': 'color-purple',
      '#f87171': 'color-red',    '#f472b6': 'color-pink',
    };
    return colorsMap[sub.color] || 'color-gold';
  };

  const getEventColor = (eventType?: string) => {
    if (!eventType) return undefined;
    return eventColors[eventType as keyof typeof eventColors];
  };

  const getSubjectInfo = (subjectId?: string) => {
    if (!subjectId) return null;
    return subjects.find(s => s.id === subjectId) || null;
  };

  const getGreeting = () => {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const timeVal = hours * 60 + minutes; // minutes since midnight
    const sixThirty = 6 * 60 + 30; // 06:30
    const fourteen = 14 * 60; // 14:00
    
    if (timeVal >= sixThirty && timeVal < fourteen) {
      return "Buongiorno Enrico!";
    } else {
      return "Buonasera Enrico";
    }
  };

  return (
    <div className="today-focus-dashboard animate-fade-in" style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '30px', padding: '10px 0px 40px 0px' }}>
      
      {/* LEFT COLUMN: Agenda del Giorno */}
      <div className="today-agenda-col" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* Navigation Date Header */}
        <header className="today-nav-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0px', background: 'transparent', border: 'none', borderRadius: '0px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', flexWrap: 'wrap' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 800, letterSpacing: '-0.02em', color: '#ffffff', margin: 0, textTransform: 'uppercase' }}>
              {getGreeting()}
            </h1>
            <span className="selected-day-label" style={{ fontSize: '15px', fontWeight: 600, color: 'rgba(255, 255, 255, 0.7)' }}>
              {activeDay?.name} {activeDay?.dateLabel.split(' ')[0]} {activeDay?.dateLabel.split(' ')[1]}
            </span>
          </div>

          <div className="day-nav-buttons" style={{ display: 'flex', gap: '8px' }}>
            <button 
              type="button" 
              className="btn btn-secondary btn-icon-only" 
              onClick={handlePrevDay} 
              disabled={selectedDayIndex === 0}
              title="Giorno Precedente"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <ChevronLeftIcon size={16} />
            </button>
            <button 
              type="button" 
              className="btn btn-secondary btn-icon-only" 
              onClick={handleNextDay} 
              disabled={selectedDayIndex === allDays.length - 1}
              title="Giorno Successivo"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <ChevronRightIcon size={16} />
            </button>
          </div>
        </header>

        {/* 3 Time Slots Blocks (Mattina, Pomeriggio, Sera) */}
        {(['mattina', 'pomeriggio', 'sera'] as const).map((slotKey) => {
          const items = activeDay ? activeDay[slotKey] || [] : [];
          const slotIcons = {
            mattina: (
              <svg xmlns="http://www.w3.org/2000/svg" width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#fbbf24' }}>
                <path d="M12 2v4" />
                <path d="m4.93 4.93 2.83 2.83" />
                <path d="M2 12h4" />
                <path d="M18 12h4" />
                <path d="m16.24 7.76 2.83-2.83" />
                <path d="M2 20h20" />
                <path d="M19 17a7 7 0 0 0-14 0" />
              </svg>
            ),
            pomeriggio: <SunIcon size={18} className="text-orange" style={{ color: '#f97316' }} />,
            sera: <MoonIcon size={18} className="text-purple" style={{ color: '#a855f7' }} />
          };
          const slotLabels = { 
            mattina: 'Mattina (8:30 - 13:30)', 
            pomeriggio: 'Pomeriggio (14:30 - 19:30)', 
            sera: 'Sera (21:30 - 23:00)' 
          };

          return (
            <div key={slotKey} className="today-slot-card-borderless animate-slide-down" style={{ background: 'transparent', border: 'none', borderBottom: slotKey === 'sera' ? 'none' : '1px solid rgba(255,255,255,0.06)', paddingBottom: slotKey === 'sera' ? '0' : '20px', marginBottom: '10px' }}>
              <div className="today-slot-header" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 0', background: 'transparent', borderBottom: 'none' }}>
                {slotIcons[slotKey]}
                <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#f4f4f5', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
                  {slotLabels[slotKey]}
                </h3>
                <span className="slot-items-count" style={{ marginLeft: 'auto', background: 'rgba(255,255,255,0.06)', padding: '2px 8px', borderRadius: '10px', fontSize: '10px', color: '#a1a1aa', fontWeight: 600 }}>
                  {items.length} {items.length === 1 ? 'attività' : 'attività'}
                </span>
              </div>

              <div className="today-slot-body" style={{ padding: '8px 0', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {items.length === 0 ? (
                  <div className="today-slot-empty" style={{ fontSize: '12px', color: '#52525b', fontStyle: 'italic', padding: '8px 0' }}>
                    Nessun compito o evento programmato.
                  </div>
                ) : (
                  <div className="slot-items-list">
                    {items.map((item) => {
                      const isEvent = !!item.eventType;
                      const colorClass = isEvent ? '' : getSubjectColorClass(item.subjectId);
                      const subject = isEvent ? null : getSubjectInfo(item.subjectId);
                      const qtyLabel = getQtyLabel(item.pages, item.quantityType);
                      const subjLabel = subject
                        ? (subject.name.length > 14 ? subject.name.slice(0, 13) + '…' : subject.name)
                        : null;

                      return (
                        <div 
                          key={item.id} 
                          className={`scheduled-item-pill ${colorClass} ${isEvent ? `event-pill event-${item.eventType}` : ''} ${item.completed ? 'completed' : ''}`}
                        >
                          {/* Top row: checkbox + name + [event badge] + delete */}
                          <div className="item-header-row">
                            <label className="checkbox-container-sm">
                              <input 
                                type="checkbox" 
                                checked={item.completed} 
                                onChange={() => handleToggleItem(activeDay.id, slotKey, item.id)}
                              />
                              <span 
                                className="checkmark-sm"
                                style={{ 
                                  '--accent-color': isEvent ? getEventColor(item.eventType) : undefined 
                                } as React.CSSProperties}
                              ></span>
                            </label>
                            <span className="item-name" title={item.name}>
                              {item.name}
                            </span>
                            {isEvent && (
                              <span className={`event-type-badge event-badge-${item.eventType}`}>
                                {item.eventType === 'esame' ? 'ESAME' : item.eventType === 'svago' ? 'SVAGO' : item.eventType === 'lezione' ? 'LEZIONE' : 'ALTRO'}
                              </span>
                            )}
                            <button
                              type="button"
                              className="btn-delete-item"
                              onClick={() => handleDeleteItem(activeDay.id, slotKey, item.id)}
                              title="Rimuovi"
                            >
                              <XIcon size={9} />
                            </button>
                          </div>

                          {/* Bottom row: subject tag + quantity tag (only for task items) */}
                          {!isEvent && (subjLabel || qtyLabel) && (
                            <div className="item-tags-row">
                              {subjLabel && (
                                <span 
                                  className="item-subject-tag"
                                  style={{
                                    backgroundColor: subject ? `${subject.color}22` : undefined,
                                    color: subject?.color,
                                    borderColor: subject ? `${subject.color}44` : undefined,
                                  }}
                                >
                                  {subjLabel}
                                </span>
                              )}
                              {qtyLabel && <span className="item-qty-tag">{qtyLabel}</span>}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* RIGHT COLUMN: Interactive Widgets */}
      <div className="today-widgets-col" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* Widget 1: POMODORO TIMER */}
        <div className="widget-card pomodoro-widget-card" style={{ 
          background: currentSettings.color, 
          padding: '24px', 
          borderRadius: '16px', 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center',
          transition: 'background-color 0.5s ease',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.25)'
        }}>
          
          {/* Version Selector: Classic vs Harry Potter */}
          <div className="version-selector-container" style={{ display: 'flex', background: 'rgba(0,0,0,0.2)', padding: '4px', borderRadius: '8px', width: '100%', marginBottom: '16px' }}>
            <button 
              type="button" 
              onClick={() => setTimerVersion('classic')}
              style={{ 
                flex: 1, 
                border: 'none', 
                background: timerVersion === 'classic' ? 'rgba(255,255,255,0.1)' : 'transparent', 
                color: '#ffffff', 
                fontSize: '12px', 
                fontWeight: 700, 
                padding: '8px 0', 
                borderRadius: '6px', 
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                transition: 'all 0.2s ease'
              }}
            >
              Classic
            </button>
            <button 
              type="button" 
              onClick={() => setTimerVersion('potter')}
              style={{ 
                flex: 1, 
                border: 'none', 
                background: timerVersion === 'potter' ? 'rgba(255,255,255,0.1)' : 'transparent', 
                color: '#ffd700', 
                fontSize: '12px', 
                fontWeight: 700, 
                padding: '8px 0', 
                borderRadius: '6px', 
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                transition: 'all 0.2s ease'
              }}
            >
              <span>🧙‍♂️ Harry Potter</span>
            </button>
          </div>

          <h4 style={{ fontSize: '11px', fontWeight: 800, color: 'rgba(255, 255, 255, 0.7)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '14px', width: '100%', textAlign: 'center' }}>
            {timerVersion === 'potter' ? 'Hogwarts Focus Timer' : 'Classic Pomodoro'}
          </h4>
          
          {/* Modes pill selector */}
          <div className="timer-mode-pills" style={{ 
            display: 'flex', 
            background: 'rgba(0, 0, 0, 0.2)', 
            padding: '4px', 
            borderRadius: '10px', 
            width: '100%', 
            marginBottom: '24px' 
          }}>
            {(['study', 'short', 'long'] as const).map((m) => {
              const isActive = timerMode === m;
              const label = timerSettings[timerVersion][m].label;
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => setTimerMode(m)}
                  style={{
                    flex: 1,
                    border: 'none',
                    background: isActive ? 'rgba(0, 0, 0, 0.45)' : 'transparent',
                    color: isActive ? '#ffffff' : 'rgba(255, 255, 255, 0.6)',
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '8px 4px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    textAlign: 'center',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {/* Time Display */}
          <div className="timer-time-display" style={{ 
            fontSize: '64px', 
            fontWeight: 800, 
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif', 
            letterSpacing: '-0.02em', 
            color: '#ffffff', 
            marginBottom: '24px', 
            lineHeight: 1 
          }}>
            {formatTime(timeLeft)}
          </div>

          {/* Control Buttons */}
          <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
            <button 
              type="button" 
              onClick={toggleTimer}
              style={{ 
                flex: 2, 
                background: '#ffffff', 
                color: currentSettings.color, 
                border: 'none', 
                borderRadius: '8px', 
                padding: '12px 20px', 
                fontSize: '14px', 
                fontWeight: 700, 
                textTransform: 'uppercase', 
                letterSpacing: '0.05em', 
                cursor: 'pointer', 
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                gap: '6px',
                transition: 'all 0.2s ease'
              }}
            >
              <ClockIcon size={14} style={{ color: currentSettings.color }} />
              <span>{timerRunning ? 'Pausa' : 'Start'}</span>
            </button>
            
            <button 
              type="button" 
              onClick={resetTimer}
              style={{ 
                flex: 1, 
                background: 'rgba(255, 255, 255, 0.15)', 
                color: '#ffffff', 
                border: '1px solid rgba(255, 255, 255, 0.25)', 
                borderRadius: '8px', 
                padding: '12px 14px', 
                fontSize: '12px', 
                fontWeight: 700, 
                textTransform: 'uppercase', 
                letterSpacing: '0.05em', 
                cursor: 'pointer',
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                transition: 'all 0.2s ease'
              }}
            >
              Reset
            </button>
          </div>

          {/* Hogwarts Ambient ASMR Player */}
          {timerVersion === 'potter' && (
            <div className="hogwarts-player-wrapper" style={{ width: '100%', marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}>
                <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.7)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  🏰 Hogwarts Ambience ASMR
                </span>
              </div>
              <iframe
                width="100%"
                height="160"
                src="https://www.youtube.com/embed/TZrt8Ktl8hk?autoplay=0&mute=0"
                title="Hogwarts Library Ambience"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                style={{ borderRadius: '10px', border: '1px solid rgba(255,255,255,0.15)', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}
              ></iframe>
            </div>
          )}
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
