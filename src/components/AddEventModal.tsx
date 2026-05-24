import React, { useState } from 'react';
import type { WeekPlan } from '../types/planner';
import { XIcon, CalendarIcon, BookIcon } from './Icons';

interface AddEventModalProps {
  weeks: WeekPlan[];
  onClose: () => void;
  onConfirm: (
    title: string,
    eventType: 'esame' | 'svago',
    slots: Array<{ dayId: string; slotKey: 'mattina' | 'pomeriggio' | 'sera' }>
  ) => void;
}

const SLOT_LABELS = {
  mattina:    { short: 'M', label: 'Mattina',    cls: 'morning-slot-btn'   },
  pomeriggio: { short: 'P', label: 'Pomeriggio', cls: 'afternoon-slot-btn' },
  sera:       { short: 'S', label: 'Sera',       cls: 'evening-slot-btn'   },
};

export const AddEventModal: React.FC<AddEventModalProps> = ({ weeks, onClose, onConfirm }) => {
  const [title, setTitle] = useState('');
  const [eventType, setEventType] = useState<'esame' | 'svago'>('esame');
  const [selectedSlots, setSelectedSlots] = useState<Set<string>>(new Set());

  const toggleSlot = (dayId: string, slotKey: string) => {
    const key = `${dayId}:${slotKey}`;
    setSelectedSlots(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || selectedSlots.size === 0) return;
    const slots = Array.from(selectedSlots).map(key => {
      const [dayId, slotKey] = key.split(':');
      return { dayId, slotKey: slotKey as 'mattina' | 'pomeriggio' | 'sera' };
    });
    onConfirm(title.trim(), eventType, slots);
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <form className="modal-panel add-event-modal" onSubmit={handleSubmit}>

        {/* Header */}
        <div className="modal-header">
          <div className="modal-header-title">
            <CalendarIcon size={18} className="modal-header-icon" />
            <h3>Aggiungi Evento Extra</h3>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose}>
            <XIcon size={16} />
          </button>
        </div>

        <div className="modal-body">

          {/* Title */}
          <div className="event-form-group">
            <label className="event-form-label">Titolo evento *</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Es. Esame Cloud Computing, Pausa relax..."
              className="form-control"
              autoFocus
              required
            />
          </div>

          {/* Event Type Toggle */}
          <div className="event-form-group">
            <label className="event-form-label">Tipologia</label>
            <div className="event-type-toggle">
              <button
                type="button"
                className={`event-type-btn esame-type-btn ${eventType === 'esame' ? 'active' : ''}`}
                onClick={() => setEventType('esame')}
              >
                <BookIcon size={13} />
                ESAME
              </button>
              <button
                type="button"
                className={`event-type-btn svago-type-btn ${eventType === 'svago' ? 'active' : ''}`}
                onClick={() => setEventType('svago')}
              >
                <span className="svago-icon-star">★</span>
                SVAGO
              </button>
            </div>
          </div>

          {/* Slot Picker */}
          <div className="event-form-group">
            <label className="event-form-label">
              Seleziona giorni e fasce orarie
              {selectedSlots.size > 0 && (
                <span className="slot-count-badge">{selectedSlots.size} selezionati</span>
              )}
            </label>

            <div className="slot-picker-scroll">
              {weeks.map(week => (
                <div key={week.id} className="slot-picker-week">
                  <div className="slot-picker-week-label">{week.name}</div>
                  <div className="slot-picker-days-grid">
                    {week.days.map(day => {
                      const parts = day.name.split(' ');
                      const dayShort = parts[0].slice(0, 3); // "Lun", "Mar", "Mer"...
                      const dayNum = parts[1] || '';
                      return (
                        <div key={day.id} className="slot-picker-day-col">
                          <div className="slot-picker-day-label">
                            <span className="slot-day-name">{dayShort}</span>
                            <span className="slot-day-number">{dayNum}</span>
                          </div>
                          <div className="slot-picker-btns">
                            {(['mattina', 'pomeriggio', 'sera'] as const).map(slotKey => {
                              const key = `${day.id}:${slotKey}`;
                              const isSelected = selectedSlots.has(key);
                              return (
                                <button
                                  key={slotKey}
                                  type="button"
                                  className={`slot-pick-btn ${SLOT_LABELS[slotKey].cls} ${isSelected ? 'slot-selected' : ''}`}
                                  onClick={() => toggleSlot(day.id, slotKey)}
                                  title={`${day.name} — ${SLOT_LABELS[slotKey].label}`}
                                >
                                  {SLOT_LABELS[slotKey].short}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Annulla
          </button>
          <button
            type="submit"
            className={`btn btn-event-confirm ${eventType === 'esame' ? 'btn-esame' : 'btn-svago'}`}
            disabled={!title.trim() || selectedSlots.size === 0}
          >
            Aggiungi {selectedSlots.size > 0 ? `(${selectedSlots.size} slot)` : ''} all'agenda
          </button>
        </div>

      </form>
    </div>
  );
};
