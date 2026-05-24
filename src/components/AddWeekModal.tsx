import React, { useState } from 'react';
import { WeekPlan, DaySchedule } from '../types/planner';

interface AddWeekModalProps {
  onClose: () => void;
  onAddWeek: (newWeek: WeekPlan) => void;
  suggestedWeekNumber: number;
}

export const AddWeekModal: React.FC<AddWeekModalProps> = ({
  onClose,
  onAddWeek,
  suggestedWeekNumber,
}) => {
  const [weekName, setWeekName] = useState(`Settimana ${suggestedWeekNumber}`);
  const [startDateStr, setStartDateStr] = useState(() => {
    // Get next Monday as a default starter
    const today = new Date();
    const dayOfWeek = today.getDay();
    const daysUntilNextMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;
    const nextMonday = new Date(today);
    nextMonday.setDate(today.getDate() + daysUntilNextMonday);
    return nextMonday.toISOString().split('T')[0];
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!weekName.trim() || !startDateStr) return;

    const startDate = new Date(startDateStr);
    
    // Day names in Italian as requested by screenshot
    const dayNames = [
      'Lunedì',
      'Martedì',
      'Mercoledì',
      'Giovedì',
      'Venerdì',
      'Sabato',
      'Domenica'
    ];

    const monthsShort = [
      'Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu',
      'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'
    ];

    const days: DaySchedule[] = [];

    // Construct the 7 days of the week starting from the chosen startDate
    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);

      const dayNumber = currentDate.getDate();
      const monthLabel = monthsShort[currentDate.getMonth()];
      const dayLabel = `${dayNames[i]} ${dayNumber}`;
      
      days.push({
        id: `day-${currentDate.getTime()}-${i}`,
        name: dayLabel,
        dateLabel: `${dayNumber} ${monthLabel}`,
        mattina: [],
        pomeriggio: [],
        sera: []
      });
    }

    // Format week range for the week display title
    const firstDay = days[0];
    const lastDay = days[6];
    const fullWeekName = `${weekName}: ${firstDay.dateLabel} - ${lastDay.dateLabel}`;

    const newWeek: WeekPlan = {
      id: `week-${Date.now()}`,
      name: fullWeekName,
      days
    };

    onAddWeek(newWeek);
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content glass-container">
        <div className="modal-header">
          <h2>Crea Nuova Settimana</h2>
          <button className="btn-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          <div className="form-group">
            <label htmlFor="week-num">Nome Settimana</label>
            <input
              id="week-num"
              type="text"
              value={weekName}
              onChange={(e) => setWeekName(e.target.value)}
              className="form-control"
              placeholder="Es. Settimana 2 o Sessione Finale"
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="start-date">Lunedì di Inizio</label>
            <input
              id="start-date"
              type="date"
              value={startDateStr}
              onChange={(e) => setStartDateStr(e.target.value)}
              className="form-control"
              required
            />
            <p className="hint text-muted">
              Seleziona la data di inizio di questa settimana. Verranno generati automaticamente i 7 giorni (Lunedì - Domenica).
            </p>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Annulla
            </button>
            <button type="submit" className="btn btn-success">
              Genera Settimana
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
