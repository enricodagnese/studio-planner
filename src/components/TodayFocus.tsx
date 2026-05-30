import React, { useState, useEffect, useRef } from 'react';
import type { WeekPlan, Subject, CalendarItem, TaskQuantityType } from '../types/planner';
import SoundUtility from '../utils/audio';
import { 
  PlusIcon, 
  TrashIcon, 
  SunIcon, 
  MoonIcon,
  PenIcon,
  XIcon,
  SettingsIcon
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
  const activeDay = allDays[initialIndex];

  // 2. --- Pomodoro Timer Widget (Redesigned & Customizable) ---
  const [timerMode, setTimerMode] = useState<'study' | 'short' | 'long'>(() => {
    const saved = localStorage.getItem('antigravity-studio-planner-timer-mode');
    return (saved as 'study' | 'short' | 'long') || 'study';
  });

  const [customDurations, setCustomDurations] = useState<{ study: number; short: number; long: number }>(() => {
    const saved = localStorage.getItem('antigravity-studio-planner-pomodoro-durations');
    return saved ? JSON.parse(saved) : { study: 25, short: 5, long: 15 };
  });

  const [showTimerSettings, setShowTimerSettings] = useState(false);

  const timerSettings = {
    study: { label: 'Pomodoro', duration: customDurations.study * 60, color: '#bf5555' },
    short: { label: 'Short Break', duration: customDurations.short * 60, color: '#4a8f8f' },
    long: { label: 'Long Break', duration: customDurations.long * 60, color: '#3d7a7a' }
  };

  const currentSettings = timerSettings[timerMode];
  const [timeLeft, setTimeLeft] = useState(currentSettings.duration);
  const [timerRunning, setTimerRunning] = useState(false);
  const timerIntervalRef = useRef<any>(null);

  // Save mode and durations
  useEffect(() => {
    localStorage.setItem('antigravity-studio-planner-timer-mode', timerMode);
  }, [timerMode]);

  useEffect(() => {
    localStorage.setItem('antigravity-studio-planner-pomodoro-durations', JSON.stringify(customDurations));
  }, [customDurations]);

  // When mode or durations change, reset duration if timer not running
  useEffect(() => {
    if (!timerRunning) {
      setTimeLeft(timerSettings[timerMode].duration);
    }
  }, [timerMode, customDurations, timerRunning]);

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
    setTimeLeft(timerSettings[timerMode].duration);
    SoundUtility.playTimerPause();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Sound Synthesizer via Web Audio API (Triple C5-E5-G5 Major Chime)
  const playCompletionSound = () => {
    SoundUtility.playTimerComplete();
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
    let played = false;
    setQuickTodos(quickTodos.map(todo => {
      if (todo.id === id) {
        const nextVal = !todo.completed;
        if (nextVal && !played) {
          SoundUtility.playTaskCompleted();
          played = true;
        }
        return { ...todo, completed: nextVal };
      }
      return todo;
    }));
  };

  const handleDeleteQuickTodo = (id: string) => {
    SoundUtility.playTaskDeleted();
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

    if (newCompleted) {
      SoundUtility.playTaskCompleted();
    }

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

    if (foundItem) {
      SoundUtility.playTaskDeleted();
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
    return "Bentornato Enrico, oggi è:";
  };

  const getFullMonthName = (dateLabel?: string): string => {
    if (!dateLabel) return '';
    const month = dateLabel.split(' ')[1]?.toLowerCase() || '';
    if (month.includes('mag')) return 'Maggio';
    if (month.includes('giu')) return 'Giugno';
    if (month.includes('lug')) return 'Luglio';
    if (month.includes('ago')) return 'Agosto';
    if (month.includes('set')) return 'Settembre';
    if (month.includes('ott')) return 'Ottobre';
    if (month.includes('nov')) return 'Novembre';
    if (month.includes('dic')) return 'Dicembre';
    if (month.includes('gen')) return 'Gennaio';
    if (month.includes('feb')) return 'Febbraio';
    if (month.includes('mar')) return 'Marzo';
    if (month.includes('apr')) return 'Aprile';
    return month;
  };

  const getMonthColor = (dateLabel?: string) => {
    if (!dateLabel) return 'rgba(255, 255, 255, 0.7)';
    const month = dateLabel.split(' ')[1]?.toLowerCase() || '';
    if (month.includes('mag')) return '#34d399'; // Maggio
    if (month.includes('giu')) return '#fbbf24'; // Giugno
    if (month.includes('lug') || month.includes('ago')) return '#f87171'; // Luglio/Agosto
    return 'rgba(255, 255, 255, 0.7)';
  };

  return (
    <div className="today-focus-dashboard animate-fade-in" style={{ display: 'grid', gridTemplateColumns: '1fr 440px', gap: '50px', padding: '10px 0px 40px 0px' }}>
      
      {/* LEFT COLUMN: Agenda del Giorno */}
      <div className="today-agenda-col" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* Clean Left-Aligned Header */}
        <header style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', padding: '15px 0px 5px 0px', background: 'transparent', border: 'none', borderRadius: '0px', boxShadow: 'none' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 800, letterSpacing: '-0.02em', color: '#ffffff', margin: 0 }}>
            {getGreeting()}
          </h1>
          <span className="selected-day-label" style={{ fontSize: '18px', fontWeight: 700, color: getMonthColor(activeDay?.dateLabel), marginTop: '4px', textTransform: 'capitalize' }}>
            {activeDay?.name} {getFullMonthName(activeDay?.dateLabel)}
          </span>
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
            pomeriggio: <SunIcon size={18} style={{ color: '#f97316' }} />,
            sera: <MoonIcon size={18} style={{ color: '#a855f7' }} />
          };
          const slotLabels = { 
            mattina: 'Mattina', 
            pomeriggio: 'Pomeriggio', 
            sera: 'Sera' 
          };

          return (
            <div key={slotKey} className="today-slot-card-borderless animate-slide-down" style={{ background: 'transparent', border: 'none', borderBottom: slotKey === 'sera' ? 'none' : '1px solid rgba(255,255,255,0.06)', paddingBottom: slotKey === 'sera' ? '0' : '26px', marginBottom: '16px' }}>
              <div className="today-slot-header" style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '16px 0', background: 'transparent', borderBottom: 'none' }}>
                {slotIcons[slotKey]}
                <h3 style={{ fontSize: '18px', fontWeight: 850, color: '#f4f4f5', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
                  {slotLabels[slotKey]}
                </h3>
                <span className="slot-items-count" style={{ marginLeft: 'auto', background: 'rgba(255,255,255,0.06)', padding: '3px 10px', borderRadius: '10px', fontSize: '11px', color: '#a1a1aa', fontWeight: 600 }}>
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
                          style={{
                            padding: '16px 20px',
                            borderRadius: '12px',
                            gap: '12px'
                          }}
                        >
                          {/* Top row: checkbox + name + [event badge] + delete */}
                          <div className="item-header-row">
                            <label className="checkbox-container-lg">
                              <input 
                                type="checkbox" 
                                checked={item.completed} 
                                onChange={() => handleToggleItem(activeDay.id, slotKey, item.id)}
                              />
                              <span 
                                className="checkmark-lg"
                                style={{ 
                                  '--accent-color': isEvent ? getEventColor(item.eventType) : undefined 
                                } as React.CSSProperties}
                              ></span>
                            </label>
                            <span className="item-name" style={{ fontSize: '28px', fontWeight: 850 }} title={item.name}>
                              {item.name}
                            </span>
                            {isEvent && (
                              <span className={`event-type-badge event-badge-${item.eventType}`} style={{ fontSize: '10px', padding: '3px 8px' }}>
                                {item.eventType === 'esame' ? 'ESAME' : item.eventType === 'svago' ? 'SVAGO' : item.eventType === 'lezione' ? 'LEZIONE' : 'ALTRO'}
                              </span>
                            )}
                            <button
                              type="button"
                              className="btn-delete-item"
                              onClick={() => handleDeleteItem(activeDay.id, slotKey, item.id)}
                              title="Rimuovi"
                            >
                              <XIcon size={12} />
                            </button>
                          </div>

                          {/* Bottom row: subject tag + quantity tag (only for task items) */}
                          {!isEvent && (subjLabel || qtyLabel) && (
                            <div className="item-tags-row" style={{ marginTop: '12px', alignSelf: 'flex-start', justifyContent: 'flex-start', gap: '10px' }}>
                              {subjLabel && (
                                <span 
                                  className="item-subject-tag"
                                  style={{
                                    backgroundColor: subject ? `${subject.color}22` : undefined,
                                    color: subject?.color,
                                    borderColor: subject ? `${subject.color}44` : undefined,
                                    fontSize: '11px',
                                    padding: '3px 10px',
                                    borderRadius: '5px'
                                  }}
                                >
                                  {subjLabel}
                                </span>
                              )}
                              {qtyLabel && <span className="item-qty-tag" style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '5px' }}>{qtyLabel}</span>}
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
        <div className="pomodoro-widget-card" style={{ 
          background: currentSettings.color, 
          padding: '40px', 
          borderRadius: '16px', 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center',
          transition: 'background-color 0.5s ease',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.25)'
        }}>
          
          {/* Header Row: Title and Settings Toggle Button */}
          <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h4 style={{ fontSize: '15px', fontWeight: 850, color: 'rgba(255, 255, 255, 0.7)', letterSpacing: '0.06em', textTransform: 'uppercase', margin: 0 }}>
              Pomodoro Timer
            </h4>
            <button 
              type="button" 
              onClick={() => setShowTimerSettings(!showTimerSettings)} 
              style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', display: 'flex', padding: '4px', borderRadius: '4px', transition: 'all 0.2s' }}
              title="Impostazioni Durata"
            >
              <SettingsIcon size={18} />
            </button>
          </div>

          {/* Inline Settings Panel */}
          {showTimerSettings && (
            <div className="timer-settings-panel" style={{ width: '100%', background: 'rgba(0,0,0,0.25)', padding: '12px', borderRadius: '8px', marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <span style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Definisci Durata (Minuti)
              </span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '9px', color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>Studio</label>
                  <input 
                    type="number" 
                    min="1" 
                    max="180"
                    value={customDurations.study} 
                    onChange={(e) => setCustomDurations({ ...customDurations, study: Math.max(1, parseInt(e.target.value) || 1) })}
                    style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', color: '#fff', fontSize: '11px', padding: '4px 6px', outline: 'none' }}
                  />
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '9px', color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>Pausa B.</label>
                  <input 
                    type="number" 
                    min="1" 
                    max="60"
                    value={customDurations.short} 
                    onChange={(e) => setCustomDurations({ ...customDurations, short: Math.max(1, parseInt(e.target.value) || 1) })}
                    style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', color: '#fff', fontSize: '11px', padding: '4px 6px', outline: 'none' }}
                  />
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '9px', color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>Pausa L.</label>
                  <input 
                    type="number" 
                    min="1" 
                    max="120"
                    value={customDurations.long} 
                    onChange={(e) => setCustomDurations({ ...customDurations, long: Math.max(1, parseInt(e.target.value) || 1) })}
                    style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', color: '#fff', fontSize: '11px', padding: '4px 6px', outline: 'none' }}
                  />
                </div>
              </div>
            </div>
          )}
          
          {/* Modes pill selector */}
          <div className="timer-mode-pills" style={{ 
            display: 'flex', 
            background: 'rgba(0, 0, 0, 0.2)', 
            padding: '6px', 
            borderRadius: '12px', 
            width: '100%', 
            marginBottom: '32px' 
          }}>
            {(['study', 'short', 'long'] as const).map((m) => {
              const isActive = timerMode === m;
               const label = timerSettings[m].label;
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => setTimerMode(m)}
                  style={{
                    flex: 1,
                    border: 'none',
                    background: isActive ? 'rgba(0, 0, 0, 0.18)' : 'transparent',
                    color: isActive ? '#ffffff' : 'rgba(255, 255, 255, 0.8)',
                    fontSize: '14px',
                    fontWeight: 800,
                    padding: '12px 6px',
                    borderRadius: '10px',
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
            fontSize: '96px', 
            fontWeight: 850, 
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif', 
            letterSpacing: '-0.02em', 
            color: '#ffffff', 
            marginBottom: '32px', 
            lineHeight: 1 
          }}>
            {formatTime(timeLeft)}
          </div>

          {/* Control Buttons */}
          <div style={{ display: 'flex', gap: '16px', width: '100%' }}>
            <button 
              type="button" 
              onClick={toggleTimer}
              style={{ 
                flex: 2, 
                background: '#ffffff', 
                color: currentSettings.color, 
                border: 'none', 
                borderRadius: '10px', 
                padding: '16px 32px', 
                fontSize: '18px', 
                fontWeight: 800, 
                textTransform: 'uppercase', 
                letterSpacing: '0.05em', 
                cursor: 'pointer', 
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                gap: '8px',
                transition: 'all 0.2s ease'
              }}
            >
              <span>{timerRunning ? 'PAUSA' : 'START'}</span>
            </button>
            
            <button 
              type="button" 
              onClick={resetTimer}
              style={{ 
                flex: 1, 
                background: 'rgba(255, 255, 255, 0.15)', 
                color: '#ffffff', 
                border: '1px solid rgba(255, 255, 255, 0.25)', 
                borderRadius: '10px', 
                padding: '16px 24px', 
                fontSize: '16px', 
                fontWeight: 800, 
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
        </div>



        {/* Widget 3: TO DO LIST ("To Do aggiuntivi:") */}
        <div className="widget-card glass-container animate-fade-in" style={{ padding: '18px 20px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '12px', background: '#181822', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#ffffff', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              To Do aggiuntivi:
            </span>
            <PenIcon size={12} className="text-gold" style={{ color: '#fbbf24' }} />
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
                background: '#0d0d12', 
                border: '1px solid rgba(255,255,255,0.15)', 
                borderRadius: '6px', 
                color: '#ffffff', 
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
              <div style={{ fontSize: '11px', color: '#71717a', fontStyle: 'italic', padding: '4px 0' }}>
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
                    background: 'rgba(0, 0, 0, 0.25)', 
                    border: '1px solid rgba(255, 255, 255, 0.08)', 
                    padding: '8px 10px', 
                    borderRadius: '6px',
                    opacity: todo.completed ? 0.6 : 1,
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
                  <span style={{ fontSize: '12px', color: todo.completed ? 'rgba(255, 255, 255, 0.4)' : '#ffffff', textDecoration: todo.completed ? 'line-through' : 'none', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={todo.name}>
                    {todo.name}
                  </span>
                  <button 
                    type="button" 
                    onClick={() => handleDeleteQuickTodo(todo.id)}
                    style={{ background: 'transparent', border: 'none', color: '#a1a1aa', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
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
