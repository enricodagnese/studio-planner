import React, { useState } from 'react';
import type { Subject, WeekPlan, CalendarItem } from '../types/planner';
import { PlusIcon, SunIcon, MoonIcon, LandscapeIcon } from './Icons';

interface WeeklyGridProps {
  activeWeek: WeekPlan;
  weeks: WeekPlan[];
  subjects: Subject[];
  onUpdateAllWeeks: (updatedWeeks: WeekPlan[]) => void;
}

export const WeeklyGrid: React.FC<WeeklyGridProps> = ({
  activeWeek,
  weeks,
  subjects,
  onUpdateAllWeeks,
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

  // Helper to assign a specific color class to each column based on Italian day name
  const getDayClass = (dayName: string) => {
    const name = dayName.toLowerCase();
    if (name.includes('lunedì')) return 'day-lunedi';
    if (name.includes('martedì')) return 'day-martedi';
    if (name.includes('mercoledì')) return 'day-mercoledi';
    if (name.includes('giovedì')) return 'day-giovedi';
    if (name.includes('venerdì')) return 'day-venerdi';
    if (name.includes('sabato')) return 'day-sabato';
    if (name.includes('domenica')) return 'day-domenica';
    return '';
  };

  // --- Drag & Drop Handlers ---

  const handleDragOver = (e: React.DragEvent, dayId: string, slotKey: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
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

    const subjectId = e.dataTransfer.getData('application/react-planner-subject');
    const calendarItemId = e.dataTransfer.getData('application/react-planner-calendar-item');
    const sourceDayId = e.dataTransfer.getData('source-day-id');
    const sourceSlotKey = e.dataTransfer.getData('source-slot-key') as 'mattina' | 'pomeriggio' | 'sera' | '';

    const updatedWeeks = JSON.parse(JSON.stringify(weeks)) as WeekPlan[];

    if (subjectId) {
      // Case 1: Dragging a subject from the materials library
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
    } else if (calendarItemId && sourceDayId && sourceSlotKey) {
      // Case 2: Dragging an existing calendar item (cross-week supported!)
      let movedItem: CalendarItem | null = null;
      
      // Find and remove from source day of any week
      for (const w of updatedWeeks) {
        const sourceDay = w.days.find(d => d.id === sourceDayId);
        if (sourceDay) {
          const itemIndex = sourceDay[sourceSlotKey].findIndex(item => item.id === calendarItemId);
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
  };

  const handleCalendarItemDragStart = (
    e: React.DragEvent,
    itemId: string,
    dayId: string,
    slotKey: 'mattina' | 'pomeriggio' | 'sera'
  ) => {
    e.dataTransfer.setData('text/plain', itemId);
    e.dataTransfer.setData('application/react-planner-calendar-item', itemId);
    e.dataTransfer.setData('source-day-id', dayId);
    e.dataTransfer.setData('source-slot-key', slotKey);
    e.dataTransfer.effectAllowed = 'move';
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

  // Render Slot Header Pill Helper
  const renderSlotHeader = (slotKey: 'mattina' | 'pomeriggio' | 'sera') => {
    switch (slotKey) {
      case 'mattina':
        return (
          <div className="slot-pill morning-pill">
            <SunIcon size={14} className="slot-icon" />
            <span>Mattina</span>
          </div>
        );
      case 'pomeriggio':
        return (
          <div className="slot-pill afternoon-pill">
            <LandscapeIcon size={14} className="slot-icon" />
            <span>Pomeriggio</span>
          </div>
        );
      case 'sera':
        return (
          <div className="slot-pill evening-pill">
            <MoonIcon size={14} className="slot-icon" />
            <span>Sera</span>
          </div>
        );
    }
  };

  return (
    <div className="weekly-calendar-grid">
      {activeWeek.days.map((day) => {
        const dayColorClass = getDayClass(day.name);
        return (
          <div key={day.id} className={`calendar-column glass-container ${dayColorClass}`}>
            <div className="column-header">
              <h3>{day.name}</h3>
              <span className="date-tag">{day.dateLabel}</span>
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

                    <div className="slot-items-list">
                      {items.map((item) => {
                        const colorClass = getSubjectColorClass(item.subjectId);
                        const pageLabel = getSubjectPages(item);

                        return (
                          <div
                            key={item.id}
                            draggable
                            onDragStart={(e) => handleCalendarItemDragStart(e, item.id, day.id, slotKey)}
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
                            <button
                              className="btn-delete-item"
                              onClick={() => handleDeleteItem(day.id, slotKey, item.id)}
                              title="Rimuovi"
                            >
                              ×
                            </button>
                          </div>
                        );
                      })}
                    </div>

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
                      <button
                        className="btn-add-to-slot"
                        onClick={() => {
                          setAddingTaskForSlot({ dayId: day.id, slotKey });
                          setNewTaskName('');
                        }}
                        title="Aggiungi compito rapido"
                      >
                        <PlusIcon size={12} />
                        <span>Aggiungi compito...</span>
                      </button>
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
