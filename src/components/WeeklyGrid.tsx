import React, { useState } from 'react';
import type { Subject, WeekPlan, CalendarItem, TaskQuantityType } from '../types/planner';
import { PlusIcon, XIcon } from './Icons';

interface WeeklyGridProps {
  activeWeek: WeekPlan;
  weeks: WeekPlan[];
  subjects: Subject[];
  onUpdateAllWeeks: (updatedWeeks: WeekPlan[]) => void;
  onUpdateSubjects: (updatedSubjects: Subject[]) => void;
}

const getQtyLabel = (pages?: number, quantityType?: TaskQuantityType): string => {
  if (!pages) return '';
  switch (quantityType) {
    case 'ore-video': return `${pages}h video`;
    case 'esercizi':  return `${pages} esercizi`;
    case 'quiz':      return `${pages} quiz`;
    default:          return `${pages} pag`;
  }
};

export const WeeklyGrid: React.FC<WeeklyGridProps> = ({
  activeWeek,
  weeks,
  subjects,
  onUpdateAllWeeks,
  onUpdateSubjects,
}) => {
  const [addingTaskForSlot, setAddingTaskForSlot] = useState<{ dayId: string; slotKey: string } | null>(null);
  const [newTaskName, setNewTaskName] = useState('');
  const [quickTaskCategory, setQuickTaskCategory] = useState<string>('studio');
  const [dragOverSlot, setDragOverSlot] = useState<{ dayId: string; slotKey: string } | null>(null);

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
    switch (eventType) {
      case 'esame': return '#ef4444';
      case 'svago': return '#3b82f6';
      case 'lezione': return '#10b981';
      case 'altro': return '#a78bfa';
      default: return undefined;
    }
  };

  const getSubjectInfo = (subjectId?: string) => {
    if (!subjectId) return null;
    return subjects.find(s => s.id === subjectId) || null;
  };

  const getMonthClass = (dateLabel: string) => {
    const month = (dateLabel.split(' ')[1] || '').toLowerCase();
    if (month.includes('mag')) return 'month-mag';
    if (month.includes('giu')) return 'month-giu';
    if (month.includes('lug') || month.includes('ago')) return 'month-lug';
    return '';
  };

  // --- Drag & Drop ---
  const handleDragOver = (e: React.DragEvent, dayId: string, slotKey: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    if (dragOverSlot?.dayId !== dayId || dragOverSlot?.slotKey !== slotKey) {
      setDragOverSlot({ dayId, slotKey });
    }
  };

  const handleDragLeave = () => setDragOverSlot(null);

  const handleDrop = (e: React.DragEvent, dayId: string, slotKey: 'mattina' | 'pomeriggio' | 'sera') => {
    e.preventDefault();
    setDragOverSlot(null);
    const dragged = (window as any).reactPlannerDraggedItem;
    if (!dragged) return;

    const updatedWeeks = JSON.parse(JSON.stringify(weeks)) as WeekPlan[];

    if (dragged.type === 'subject') {
      const originSubject = subjects.find(s => s.id === dragged.id);
      if (!originSubject) return;
      const newItem: CalendarItem = {
        id: `cal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        subjectId: originSubject.id,
        name: originSubject.name,
        completed: false,
      };
      const targetDay = updatedWeeks.find(w => w.id === activeWeek.id)?.days.find(d => d.id === dayId);
      if (!targetDay) return;
      targetDay[slotKey].push(newItem);
      onUpdateAllWeeks(updatedWeeks);

    } else if (dragged.type === 'task') {
      const originSubject = subjects.find(s => s.id === dragged.subjectId);
      if (!originSubject) return;
      const newItem: CalendarItem = {
        id: `cal-task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        subjectId: dragged.subjectId,
        taskId: dragged.taskId,      // store for sync
        name: dragged.name,
        pages: dragged.pages,
        quantityType: dragged.quantityType as TaskQuantityType,
        completed: false,
      };
      const targetDay = updatedWeeks.find(w => w.id === activeWeek.id)?.days.find(d => d.id === dayId);
      if (!targetDay) return;
      targetDay[slotKey].push(newItem);
      onUpdateAllWeeks(updatedWeeks);



    } else if (dragged.type === 'calendar-item') {
      const calendarItemId = dragged.id;
      const sourceSlotKey = dragged.sourceSlotKey as 'mattina' | 'pomeriggio' | 'sera';
      let movedItem: CalendarItem | null = null;

      for (const w of updatedWeeks) {
        const sourceDay = w.days.find(d => d.id === dragged.sourceDayId);
        if (sourceDay) {
          const idx = sourceDay[sourceSlotKey].findIndex((i: CalendarItem) => i.id === calendarItemId);
          if (idx !== -1) { [movedItem] = sourceDay[sourceSlotKey].splice(idx, 1); break; }
        }
      }
      if (!movedItem) return;
      const targetDay = updatedWeeks.find(w => w.id === activeWeek.id)?.days.find(d => d.id === dayId);
      if (!targetDay) return;
      targetDay[slotKey].push(movedItem);
      onUpdateAllWeeks(updatedWeeks);
    }

    (window as any).reactPlannerDraggedItem = null;
  };

  const handleCalendarItemDragStart = (e: React.DragEvent, itemId: string, dayId: string, slotKey: 'mattina' | 'pomeriggio' | 'sera') => {
    e.dataTransfer.setData('text/plain', itemId);
    e.dataTransfer.effectAllowed = 'copyMove';
    (window as any).reactPlannerDraggedItem = { type: 'calendar-item', id: itemId, sourceDayId: dayId, sourceSlotKey: slotKey };
    (e.currentTarget as HTMLElement).classList.add('dragging');
  };

  const handleCalendarItemDragEnd = (e: React.DragEvent) => {
    (e.currentTarget as HTMLElement).classList.remove('dragging');
  };

  // --- Task Actions ---
  const handleToggleItem = (dayId: string, slotKey: 'mattina' | 'pomeriggio' | 'sera', itemId: string) => {
    // Find the item first to get its current state before toggling
    let foundItem: CalendarItem | null = null;
    for (const w of weeks) {
      const day = w.days.find(d => d.id === dayId);
      if (day) { foundItem = day[slotKey].find(i => i.id === itemId) || null; break; }
    }
    if (!foundItem) return;
    const newCompleted = !foundItem.completed;

    // Update calendar weeks immutably
    onUpdateAllWeeks(weeks.map(w => ({
      ...w,
      days: w.days.map(d => d.id !== dayId ? d : {
        ...d,
        [slotKey]: d[slotKey].map(i => i.id === itemId ? { ...i, completed: newCompleted } : i),
      }),
    })));

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
    // Find the item first to see if it was originally dragged from a subject's tasks
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

    // Mark task as not completed in subjects list if it has a subjectId and taskId
    if (foundItem && foundItem.subjectId && foundItem.taskId) {
      const item = foundItem;
      onUpdateSubjects(subjects.map(s => {
        if (s.id !== item.subjectId) return s;
        const updatedTasks = s.tasks.map(t => t.id === item.taskId ? { ...t, completed: false } : t);
        return {
          ...s,
          tasks: updatedTasks,
          completed: false, // subject is no longer fully completed
        };
      }));
    }
  };

  const handleAddCustomTaskSubmit = (e: React.FormEvent, dayId: string, slotKey: 'mattina' | 'pomeriggio' | 'sera') => {
    e.preventDefault();
    if (!newTaskName.trim()) return;
    let parsedName = newTaskName;
    let parsedPages: number | undefined;
    const pageRegex = /\((\d+)\s*(?:pag|pagine)?\)/i;
    const match = newTaskName.match(pageRegex);
    if (match) { parsedPages = parseInt(match[1]); parsedName = newTaskName.replace(pageRegex, '').trim(); }

    let newItem: CalendarItem;
    if (quickTaskCategory === 'studio') {
      newItem = { id: `cal-custom-${Date.now()}`, name: parsedName, pages: parsedPages, completed: false };
    } else if (quickTaskCategory.startsWith('subj-')) {
      newItem = { id: `cal-custom-subj-${Date.now()}`, subjectId: quickTaskCategory, name: parsedName, pages: parsedPages, completed: false };
    } else {
      newItem = { id: `cal-custom-event-${Date.now()}`, name: parsedName, eventType: quickTaskCategory as 'esame' | 'svago' | 'lezione' | 'altro', completed: false };
    }

    onUpdateAllWeeks(weeks.map(w => ({
      ...w,
      days: w.days.map(d => d.id !== dayId ? d : {
        ...d,
        [slotKey]: [...d[slotKey], newItem],
      }),
    })));
    setNewTaskName('');
    setAddingTaskForSlot(null);
  };

  const renderSlotHeader = (slotKey: 'mattina' | 'pomeriggio' | 'sera') => {
    const labels = { mattina: 'Mattina', pomeriggio: 'Pomeriggio', sera: 'Sera' };
    const classes = { mattina: 'morning-pill', pomeriggio: 'afternoon-pill', sera: 'evening-pill' };
    return <div className={`slot-pill ${classes[slotKey]}`}><span>{labels[slotKey]}</span></div>;
  };

  return (
    <div className="weekly-calendar-grid">
      {activeWeek.days.map((day) => {
        const parts = day.name.split(' ');
        const dayNameOnly = parts[0];
        const dayNumberOnly = parts[1] || '';
        const monthOnly = day.dateLabel.split(' ')[1] || '';
        const monthClass = getMonthClass(day.dateLabel);
        const isWeekend = ['sabato', 'domenica'].some(d => dayNameOnly.toLowerCase().startsWith(d));

        const todayDate = new Date();
        const monthsShort = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'];
        const isToday = day.dateLabel === `${todayDate.getDate()} ${monthsShort[todayDate.getMonth()]}`;

        const isPast = (() => {
          if (isToday) return false;
          const monthsMap: Record<string, number> = {
            'Mag': 4, 'Giu': 5, 'Lug': 6, 'Ago': 7,
            'mag': 4, 'giu': 5, 'lug': 6, 'ago': 7
          };
          const dateParts = day.dateLabel.split(' ');
          const dNum = parseInt(dateParts[0]);
          const mStr = dateParts[1];
          if (!dNum || !mStr) return false;
          const mNum = monthsMap[mStr];
          if (mNum === undefined) return false;

          const currentYear = 2026;
          const dayPure = new Date(currentYear, mNum, dNum);
          const todayPure = new Date(todayDate.getFullYear(), todayDate.getMonth(), todayDate.getDate());

          return dayPure < todayPure;
        })();

        return (
          <div
            key={day.id}
            className={`calendar-column glass-container ${monthClass} ${isWeekend ? 'day-weekend' : ''} ${isToday ? 'day-today' : ''} ${isPast ? 'day-past' : ''}`}
          >
            {/* Column Header — month color applied via class on this div */}
            <div className={`column-header cal-col-header-month ${monthClass}`}>
              <div className="day-title day-title-row">
                {/* Always show day name for all weeks */}
                <span className="day-name">{dayNameOnly}</span>
                <span className="day-number-highlight">{dayNumberOnly}</span>
                <span className="day-month-neutral">{monthOnly}</span>
              </div>
              {isToday && <span className="today-badge">Oggi</span>}
            </div>

            <div className="slots-container">
              {(['mattina', 'pomeriggio', 'sera'] as const).map((slotKey) => {
                const isOver = dragOverSlot?.dayId === day.id && dragOverSlot?.slotKey === slotKey;
                const items = day[slotKey] || [];

                return (
                  <div
                    key={slotKey}
                    onDragOver={(e) => handleDragOver(e, day.id, slotKey)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, day.id, slotKey)}
                    className={`time-slot-box ${slotKey}-slot-box ${isOver ? 'drag-hover' : ''}`}
                  >
                    {renderSlotHeader(slotKey)}

                    {items.length === 0 ? (
                      <div className="slot-placeholder"><span>Trascina qui</span></div>
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
                              draggable
                              onDragStart={(e) => handleCalendarItemDragStart(e, item.id, day.id, slotKey)}
                              onDragEnd={handleCalendarItemDragEnd}
                              className={`scheduled-item-pill ${colorClass} ${isEvent ? `event-pill event-${item.eventType}` : ''} ${item.completed ? 'completed' : ''}`}
                            >
                              {/* Top row: checkbox + name + [event badge] + delete */}
                              <div className="item-header-row">
                                <label className="checkbox-container-sm">
                                  <input
                                    type="checkbox"
                                    checked={item.completed}
                                    onChange={() => handleToggleItem(day.id, slotKey, item.id)}
                                  />
                                  <span
                                    className="checkmark-sm"
                                    style={{
                                      '--accent-color': isEvent ? getEventColor(item.eventType) : undefined
                                    } as React.CSSProperties}
                                  ></span>
                                </label>
                                <span className="item-name" title={item.name}>{item.name}</span>
                                {isEvent && (
                                  <span className={`event-type-badge event-badge-${item.eventType}`}>
                                    {item.eventType === 'esame' ? 'ESAME' : item.eventType === 'svago' ? 'SVAGO' : item.eventType === 'lezione' ? 'LEZIONE' : 'ALTRO'}
                                  </span>
                                )}
                                <button
                                  type="button"
                                  className="btn-delete-item"
                                  onClick={() => handleDeleteItem(day.id, slotKey, item.id)}
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

                    {addingTaskForSlot?.dayId === day.id && addingTaskForSlot?.slotKey === slotKey ? (
                      <form onSubmit={(e) => handleAddCustomTaskSubmit(e, day.id, slotKey)} className="add-quick-task-form" style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        <input
                          type="text"
                          placeholder="Es. Quiz (12 pag) o Ripasso"
                          value={newTaskName}
                          onChange={(e) => setNewTaskName(e.target.value)}
                          className="quick-input"
                          autoFocus
                          required
                        />
                        <select
                          value={quickTaskCategory}
                          onChange={(e) => setQuickTaskCategory(e.target.value)}
                          className="quick-select"
                          style={{
                            background: '#1a1b24',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '4px',
                            color: '#e4e4e7',
                            fontSize: '11px',
                            padding: '4px 6px',
                            width: '100%',
                            cursor: 'pointer',
                            outline: 'none'
                          }}
                        >
                          <optgroup label="COMPITI DI STUDIO" style={{ background: '#1a1b24', color: '#a1a1aa' }}>
                            <option value="studio" style={{ color: '#e4e4e7' }}>📝 Compito Generico</option>
                            {subjects.map(s => (
                              <option key={s.id} value={s.id} style={{ color: '#e4e4e7' }}>📚 {s.name}</option>
                            ))}
                          </optgroup>
                          <optgroup label="EVENTI EXTRA" style={{ background: '#1a1b24', color: '#a1a1aa' }}>
                            <option value="esame" style={{ color: '#e4e4e7' }}>🔴 Esame</option>
                            <option value="svago" style={{ color: '#e4e4e7' }}>🔵 Svago</option>
                            <option value="lezione" style={{ color: '#e4e4e7' }}>🟢 Lezione</option>
                            <option value="altro" style={{ color: '#e4e4e7' }}>🟣 Altro</option>
                          </optgroup>
                        </select>
                        <div className="quick-form-buttons" style={{ marginTop: '2px' }}>
                          <button type="submit" className="btn-quick btn-ok">✓</button>
                          <button type="button" className="btn-quick btn-cancel" onClick={() => setAddingTaskForSlot(null)}>
                            <XIcon size={10} />
                          </button>
                        </div>
                      </form>
                    ) : (
                      <div className="slot-action-row">
                        <button
                          className="btn-add-to-slot"
                          onClick={() => { setAddingTaskForSlot({ dayId: day.id, slotKey }); setNewTaskName(''); setQuickTaskCategory('studio'); }}
                          title="Aggiungi compito o evento rapido"
                        >
                          <PlusIcon size={11} />
                          <span>Aggiungi...</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};
