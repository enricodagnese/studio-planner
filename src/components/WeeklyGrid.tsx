import React, { useState } from 'react';
import type { Subject, WeekPlan, CalendarItem } from '../types/planner';
import { PlusIcon } from './Icons';

interface WeeklyGridProps {
  activeWeek: WeekPlan;
  weeks: WeekPlan[];
  subjects: Subject[];
  onUpdateAllWeeks: (updatedWeeks: WeekPlan[]) => void;
  onUpdateSubjects: (updatedSubjects: Subject[]) => void;
  isFirstWeek?: boolean;
}

export const WeeklyGrid: React.FC<WeeklyGridProps> = ({
  activeWeek,
  weeks,
  subjects,
  onUpdateAllWeeks,
  onUpdateSubjects,
  isFirstWeek = false,
}) => {
  const [addingTaskForSlot, setAddingTaskForSlot] = useState<{ dayId: string; slotKey: string } | null>(null);
  const [newTaskName, setNewTaskName] = useState('');
  const [dragOverSlot, setDragOverSlot] = useState<{ dayId: string; slotKey: string } | null>(null);

  // Helper to find preset color class based on subject id
  const getSubjectColorClass = (subjectId?: string) => {
    if (!subjectId) return 'item-custom';
    const sub = subjects.find(s => s.id === subjectId);
    if (!sub) return 'item-custom';
    
    const colorsMap: Record<string, string> = {
      '#fbbf24': 'color-gold',
      '#60a5fa': 'color-blue',
      '#34d399': 'color-emerald',
      '#a78bfa': 'color-purple',
      '#f87171': 'color-red',
      '#f472b6': 'color-pink',
      // Legacy dark colors
      '#d97706': 'color-gold',
      '#2563eb': 'color-blue',
      '#059669': 'color-emerald',
      '#7c3aed': 'color-purple',
      '#dc2626': 'color-red',
      '#db2777': 'color-pink',
    };
    return colorsMap[sub.color] || 'color-gold';
  };

  // Helper to find page count
  const getSubjectPages = (item: CalendarItem) => {
    if (item.pages) return `${item.pages} pag`;
    if (item.subjectId) {
      const sub = subjects.find(s => s.id === item.subjectId);
      if (sub) return `${sub.pages} pag`;
    }
    return '';
  };

  // Helper: determine month class for the calendar column background
  const getMonthClass = (dateLabel: string) => {
    const month = dateLabel.split(' ')[1]?.toLowerCase() || '';
    if (month.includes('mag')) return 'month-mag';
    if (month.includes('giu')) return 'month-giu';
    if (month.includes('lug') || month.includes('ago')) return 'month-lug';
    return '';
  };

  // --- Drag & Drop Handlers ---

  const handleDragOver = (e: React.DragEvent, dayId: string, slotKey: string) => {
    e.preventDefault();
    
    // Dynamically set dropEffect to prevent browser mismatch blocks
    const dragged = (window as any).reactPlannerDraggedItem;
    if (dragged && dragged.type === 'calendar-item') {
      e.dataTransfer.dropEffect = 'move';
    } else {
      e.dataTransfer.dropEffect = 'copy';
    }

    if (dragOverSlot?.dayId !== dayId || dragOverSlot?.slotKey !== slotKey) {
      setDragOverSlot({ dayId, slotKey });
    }
  };

  const handleDragLeave = () => {
    setDragOverSlot(null);
  };

  const handleDrop = (e: React.DragEvent, dayId: string, slotKey: 'mattina' | 'pomeriggio' | 'sera') => {
    e.preventDefault();
    setDragOverSlot(null);

    // Retrieve dragged item from bulletproof global window state
    const dragged = (window as any).reactPlannerDraggedItem;
    if (!dragged) return;

    const updatedWeeks = JSON.parse(JSON.stringify(weeks)) as WeekPlan[];

    if (dragged.type === 'subject') {
      // Case 1: Dragging a whole subject from the materials library
      const subjectId = dragged.id;
      const originSubject = subjects.find(s => s.id === subjectId);
      if (!originSubject) return;

      const newItem: CalendarItem = {
        id: `cal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        subjectId: originSubject.id,
        name: originSubject.name,
        completed: false,
      };

      const targetWeek = updatedWeeks.find(w => w.id === activeWeek.id);
      if (!targetWeek) return;
      const targetDay = targetWeek.days.find(d => d.id === dayId);
      if (!targetDay) return;

      targetDay[slotKey].push(newItem);
      onUpdateAllWeeks(updatedWeeks);

    } else if (dragged.type === 'task') {
      // Case 2: Dragging a specific granular sub-task from the materials library tree
      const originSubject = subjects.find(s => s.id === dragged.subjectId);
      if (!originSubject) return;

      const newItem: CalendarItem = {
        id: `cal-task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        subjectId: dragged.subjectId,
        name: `${originSubject.name}: ${dragged.name}`,
        pages: dragged.pages,
        completed: false,
      };

      const targetWeek = updatedWeeks.find(w => w.id === activeWeek.id);
      if (!targetWeek) return;
      const targetDay = targetWeek.days.find(d => d.id === dayId);
      if (!targetDay) return;

      targetDay[slotKey].push(newItem);
      onUpdateAllWeeks(updatedWeeks);

      // Auto-remove this task from the subject's task list now that it is scheduled
      if (dragged.taskId) {
        const updatedSubjects = subjects.map(s => {
          if (s.id === dragged.subjectId) {
            return {
              ...s,
              tasks: s.tasks.filter(t => t.id !== dragged.taskId),
            };
          }
          return s;
        });
        onUpdateSubjects(updatedSubjects);
      }

    } else if (dragged.type === 'calendar-item') {
      // Case 3: Dragging an existing calendar item (cross-week & intra-week fully supported!)
      const calendarItemId = dragged.id;
      const sourceDayId = dragged.sourceDayId;
      const sourceSlotKey = dragged.sourceSlotKey as 'mattina' | 'pomeriggio' | 'sera';

      let movedItem: CalendarItem | null = null;
      
      // Find and remove from source day of any week
      for (const w of updatedWeeks) {
        const sourceDay = w.days.find(d => d.id === sourceDayId);
        if (sourceDay) {
          const itemIndex = sourceDay[sourceSlotKey].findIndex((item: CalendarItem) => item.id === calendarItemId);
          if (itemIndex !== -1) {
            [movedItem] = sourceDay[sourceSlotKey].splice(itemIndex, 1);
            break;
          }
        }
      }

      if (!movedItem) return;

      // Add to target day in current active week
      const targetWeek = updatedWeeks.find(w => w.id === activeWeek.id);
      if (!targetWeek) return;
      const targetDay = targetWeek.days.find(d => d.id === dayId);
      if (!targetDay) return;

      targetDay[slotKey].push(movedItem);
      onUpdateAllWeeks(updatedWeeks);
    }

    // Reset global drag state
    (window as any).reactPlannerDraggedItem = null;
  };

  const handleCalendarItemDragStart = (
    e: React.DragEvent,
    itemId: string,
    dayId: string,
    slotKey: 'mattina' | 'pomeriggio' | 'sera'
  ) => {
    e.dataTransfer.setData('text/plain', itemId);
    e.dataTransfer.effectAllowed = 'copyMove'; // Enable both copy and move for full compatibility
    
    // Set global window drag state for absolute reliability
    (window as any).reactPlannerDraggedItem = {
      type: 'calendar-item',
      id: itemId,
      sourceDayId: dayId,
      sourceSlotKey: slotKey
    };

    // Add visual dragging effect
    const element = e.currentTarget as HTMLElement;
    element.classList.add('dragging');
  };

  const handleCalendarItemDragEnd = (e: React.DragEvent) => {
    const element = e.currentTarget as HTMLElement;
    element.classList.remove('dragging');
  };

  // --- Task Manipulation Handlers ---

  const handleToggleItem = (dayId: string, slotKey: 'mattina' | 'pomeriggio' | 'sera', itemId: string) => {
    const updatedWeeks = weeks.map(w => {
      if (w.id === activeWeek.id) {
        const day = w.days.find(d => d.id === dayId);
        if (day) {
          const item = day[slotKey].find(i => i.id === itemId);
          if (item) {
            item.completed = !item.completed;
          }
        }
      }
      return w;
    });
    onUpdateAllWeeks(updatedWeeks);
  };

  const handleDeleteItem = (dayId: string, slotKey: 'mattina' | 'pomeriggio' | 'sera', itemId: string) => {
    const updatedWeeks = weeks.map(w => {
      if (w.id === activeWeek.id) {
        const day = w.days.find(d => d.id === dayId);
        if (day) {
          day[slotKey] = day[slotKey].filter(i => i.id !== itemId);
        }
      }
      return w;
    });
    onUpdateAllWeeks(updatedWeeks);
  };

  const handleAddCustomTaskSubmit = (e: React.FormEvent, dayId: string, slotKey: 'mattina' | 'pomeriggio' | 'sera') => {
    e.preventDefault();
    if (!newTaskName.trim()) return;

    // Parse page helper: Es. "Quiz IPv4 (12 pag)" or just custom name
    let parsedName = newTaskName;
    let parsedPages: number | undefined;

    const pageRegex = /\((\d+)\s*(?:pag|pagine)?\)/i;
    const match = newTaskName.match(pageRegex);
    if (match) {
      parsedPages = parseInt(match[1]);
      parsedName = newTaskName.replace(pageRegex, '').trim();
    }

    const newItem: CalendarItem = {
      id: `cal-custom-${Date.now()}`,
      name: parsedName,
      pages: parsedPages,
      completed: false,
    };

    const updatedWeeks = weeks.map(w => {
      if (w.id === activeWeek.id) {
        const day = w.days.find(d => d.id === dayId);
        if (day) {
          day[slotKey].push(newItem);
        }
      }
      return w;
    });

    onUpdateAllWeeks(updatedWeeks);
    setNewTaskName('');
    setAddingTaskForSlot(null);
  };

  // Render Slot Header Pill Helper (no emojis/icons as requested)
  const renderSlotHeader = (slotKey: 'mattina' | 'pomeriggio' | 'sera') => {
    switch (slotKey) {
      case 'mattina':
        return (
          <div className="slot-pill morning-pill">
            <span>Mattina</span>
          </div>
        );
      case 'pomeriggio':
        return (
          <div className="slot-pill afternoon-pill">
            <span>Pomeriggio</span>
          </div>
        );
      case 'sera':
        return (
          <div className="slot-pill evening-pill">
            <span>Sera</span>
          </div>
        );
    }
  };

  return (
    <div className="weekly-calendar-grid">
      {activeWeek.days.map((day) => {
        const [dayNameOnly] = day.name.split(' ');
        const dayNumberOnly = day.name.split(' ')[1] || '';
        const monthOnly = day.dateLabel.split(' ')[1] || '';
        const monthClass = getMonthClass(day.dateLabel);
        const isWeekend = dayNameOnly.toLowerCase().includes('sabato') || dayNameOnly.toLowerCase().includes('domenica');
        
        // High-end dynamic current day highlighter
        const todayDate = new Date();
        const todayDayNumber = todayDate.getDate();
        const monthsShort = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'];
        const todayMonthShort = monthsShort[todayDate.getMonth()];
        const isToday = day.dateLabel === `${todayDayNumber} ${todayMonthShort}`;

        return (
          <div 
            key={day.id} 
            className={`calendar-column glass-container ${monthClass} ${isWeekend ? 'day-weekend' : ''} ${isToday ? 'day-today' : ''}`}
          >
            <div className="column-header">
              <div className="day-title day-title-row">
                {isFirstWeek ? (
                  <>
                    <span className="day-name">{dayNameOnly}</span>
                    <span className="day-number-highlight">{dayNumberOnly}</span>
                    <span className="day-month-neutral">{monthOnly}</span>
                  </>
                ) : (
                  <>
                    <span className="day-number-highlight">{dayNumberOnly}</span>
                    <span className="day-month-neutral">{monthOnly}</span>
                  </>
                )}
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
                      <div className="slot-placeholder">
                        <span>Trascina qui</span>
                      </div>
                    ) : (
                      <div className="slot-items-list">
                        {items.map((item) => {
                          const colorClass = getSubjectColorClass(item.subjectId);
                          const pageLabel = getSubjectPages(item);

                          return (
                            <div
                              key={item.id}
                              draggable
                              onDragStart={(e) => handleCalendarItemDragStart(e, item.id, day.id, slotKey)}
                              onDragEnd={handleCalendarItemDragEnd}
                              className={`scheduled-item-pill ${colorClass} ${item.completed ? 'completed' : ''}`}
                            >
                              <label className="checkbox-container-sm">
                                <input
                                  type="checkbox"
                                  checked={item.completed}
                                  onChange={() => handleToggleItem(day.id, slotKey, item.id)}
                                />
                                <span className="checkmark-sm"></span>
                              </label>
                              <div className="item-text-content">
                                <span className="item-name" title={item.name}>{item.name}</span>
                                {pageLabel && <span className="item-pages">{pageLabel}</span>}
                              </div>
                              <div className="item-pill-actions">
                                <button
                                  type="button"
                                  className="btn-delete-item"
                                  onClick={() => handleDeleteItem(day.id, slotKey, item.id)}
                                  title="Rimuovi"
                                >
                                  ×
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {addingTaskForSlot?.dayId === day.id && addingTaskForSlot?.slotKey === slotKey ? (
                      <form
                        onSubmit={(e) => handleAddCustomTaskSubmit(e, day.id, slotKey)}
                        className="add-quick-task-form"
                      >
                        <input
                          type="text"
                          placeholder="Es. Quiz (12 pag) o Ripasso"
                          value={newTaskName}
                          onChange={(e) => setNewTaskName(e.target.value)}
                          className="quick-input"
                          autoFocus
                          required
                        />
                        <div className="quick-form-buttons">
                          <button type="submit" className="btn-quick btn-ok">✓</button>
                          <button
                            type="button"
                            className="btn-quick btn-cancel"
                            onClick={() => setAddingTaskForSlot(null)}
                          >
                            ×
                          </button>
                        </div>
                      </form>
                    ) : (
                      <div className="slot-action-row">
                        <button
                          className="btn-add-to-slot"
                          onClick={() => {
                            setAddingTaskForSlot({ dayId: day.id, slotKey });
                            setNewTaskName('');
                          }}
                          title="Aggiungi compito rapido"
                        >
                          <PlusIcon size={12} />
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
