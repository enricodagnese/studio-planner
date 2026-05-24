import React, { useState } from 'react';
import type { Subject, WeekPlan, CalendarItem } from '../types/planner';
import { PlusIcon, SunIcon, MoonIcon, LandscapeIcon } from './Icons';

interface WeeklyGridProps {
  activeWeek: WeekPlan;
  subjects: Subject[];
  onUpdateWeekSchedule: (updatedWeek: WeekPlan) => void;
}

export const WeeklyGrid: React.FC<WeeklyGridProps> = ({
  activeWeek,
  subjects,
  onUpdateWeekSchedule,
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

    // Clone the active week to perform mutations safely
    const updatedWeek = JSON.parse(JSON.stringify(activeWeek)) as WeekPlan;
    
    // Find target day in updated week
    const targetDay = updatedWeek.days.find(d => d.id === dayId);
    if (!targetDay) return;

    if (subjectId) {
      // Case 1: Dragging a subject from the top materials library
      const originSubject = subjects.find(s => s.id === subjectId);
      if (!originSubject) return;

      const newItem: CalendarItem = {
        id: `cal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        subjectId: originSubject.id,
        name: originSubject.name,
        completed: false,
      };

      targetDay[slotKey].push(newItem);
      onUpdateWeekSchedule(updatedWeek);
    } else if (calendarItemId && sourceDayId && sourceSlotKey) {
      // Case 2: Dragging an existing calendar item from one slot to another (rescheduling)
      
      // If dropped in the exact same slot, do nothing
      if (sourceDayId === dayId && sourceSlotKey === slotKey) return;

      // Find the source day in updated week
      const sourceDay = updatedWeek.days.find(d => d.id === sourceDayId);
      if (!sourceDay) return;

      // Extract the item
      const itemIndex = sourceDay[sourceSlotKey].findIndex(item => item.id === calendarItemId);
      if (itemIndex === -1) return;

      const [movedItem] = sourceDay[sourceSlotKey].splice(itemIndex, 1);

      // Add to target slot
      targetDay[slotKey].push(movedItem);
      onUpdateWeekSchedule(updatedWeek);
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
    const updatedWeek = JSON.parse(JSON.stringify(activeWeek)) as WeekPlan;
    const day = updatedWeek.days.find(d => d.id === dayId);
    if (!day) return;

    const item = day[slotKey].find(i => i.id === itemId);
    if (item) {
      item.completed = !item.completed;
      onUpdateWeekSchedule(updatedWeek);
    }
  };

  const handleDeleteItem = (dayId: string, slotKey: 'mattina' | 'pomeriggio' | 'sera', itemId: string) => {
    const updatedWeek = JSON.parse(JSON.stringify(activeWeek)) as WeekPlan;
    const day = updatedWeek.days.find(d => d.id === dayId);
    if (!day) return;

    day[slotKey] = day[slotKey].filter(i => i.id !== itemId);
    onUpdateWeekSchedule(updatedWeek);
  };

  const handleAddCustomTaskSubmit = (e: React.FormEvent, dayId: string, slotKey: 'mattina' | 'pomeriggio' | 'sera') => {
    e.preventDefault();
    if (!newTaskName.trim()) return;

    const updatedWeek = JSON.parse(JSON.stringify(activeWeek)) as WeekPlan;
    const day = updatedWeek.days.find(d => d.id === dayId);
    if (!day) return;

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

    day[slotKey].push(newItem);
    onUpdateWeekSchedule(updatedWeek);
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
      {activeWeek.days.map((day) => (
        <div key={day.id} className="calendar-column glass-container">
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
      ))}
    </div>
  );
};
