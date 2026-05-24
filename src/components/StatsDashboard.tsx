import React from 'react';
import type { Subject, WeekPlan } from '../types/planner';
import { BookIcon, FlameIcon, AwardIcon } from './Icons';

interface StatsDashboardProps {
  subjects: Subject[];
  weeks: WeekPlan[];
}

export const StatsDashboard: React.FC<StatsDashboardProps> = ({ subjects, weeks }) => {
  // Calculate total pages from core checklist
  const totalPagesPlanned = subjects.reduce((sum, s) => sum + s.pages, 0);
  const totalPagesCompleted = subjects.filter(s => s.completed).reduce((sum, s) => sum + s.pages, 0);

  // Calculate pages planned & completed from the scheduled weekly tasks
  // (This handles pages inside slot assignments)
  let calendarPagesPlanned = 0;
  let calendarPagesCompleted = 0;
  let calendarItemsTotal = 0;
  let calendarItemsCompleted = 0;

  weeks.forEach(w => {
    w.days.forEach(d => {
      ['mattina', 'pomeriggio', 'sera'].forEach(slotKey => {
        const slots = d[slotKey as 'mattina' | 'pomeriggio' | 'sera'] || [];
        slots.forEach(item => {
          calendarItemsTotal++;
          if (item.completed) calendarItemsCompleted++;
          
          if (item.pages && item.pages > 0) {
            calendarPagesPlanned += item.pages;
            if (item.completed) {
              calendarPagesCompleted += item.pages;
            }
          } else if (item.subjectId) {
            // Find subject to get page count if linked
            const sub = subjects.find(s => s.id === item.subjectId);
            if (sub) {
              calendarPagesPlanned += sub.pages;
              if (item.completed) {
                calendarPagesCompleted += sub.pages;
              }
            }
          }
        });
      });
    });
  });

  // Decide which page count to show
  // We'll show the calendar pages if there are scheduled items, otherwise the core subject list pages
  const displayPlanned = calendarPagesPlanned > 0 ? calendarPagesPlanned : totalPagesPlanned;
  const displayCompleted = calendarPagesPlanned > 0 ? calendarPagesCompleted : totalPagesCompleted;
  
  const pageProgressPercent = displayPlanned > 0 ? Math.round((displayCompleted / displayPlanned) * 100) : 0;
  const taskProgressPercent = calendarItemsTotal > 0 ? Math.round((calendarItemsCompleted / calendarItemsTotal) * 100) : 0;

  // Let's compute study streak
  // A day is considered studied if at least one scheduled task in it is completed
  const allDaysSorted: { dateStr: string; studied: boolean }[] = [];
  
  // Collect all days in chron order (assuming weeks are ordered)
  weeks.forEach(w => {
    w.days.forEach(d => {
      let studied = false;
      ['mattina', 'pomeriggio', 'sera'].forEach(slotKey => {
        const slots = d[slotKey as 'mattina' | 'pomeriggio' | 'sera'] || [];
        if (slots.some(item => item.completed)) {
          studied = true;
        }
      });
      allDaysSorted.push({ dateStr: d.id, studied });
    });
  });

  // Calculate current active streak starting from the latest studied day going backward
  let currentStreak = 0;
  let maxStreak = 0;
  let runningStreak = 0;

  for (let i = 0; i < allDaysSorted.length; i++) {
    if (allDaysSorted[i].studied) {
      runningStreak++;
      if (runningStreak > maxStreak) maxStreak = runningStreak;
    } else {
      runningStreak = 0;
    }
  }

  // Calculate current streak from the end
  for (let i = allDaysSorted.length - 1; i >= 0; i--) {
    if (allDaysSorted[i].studied) {
      currentStreak++;
    } else {
      // If we haven't studied today or yesterday, streak breaks, but let's allow "today" being uncompleted
      // For a simple visual, let's just count consecutive studied days from the last studied day
      if (currentStreak > 0) break;
    }
  }

  // Visual variables for the SVG circular progress
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (pageProgressPercent / 100) * circumference;

  return (
    <div className="stats-dashboard">
      <div className="stat-card main-progress">
        <div className="circular-progress-container">
          <svg className="circular-progress" width="90" height="90" viewBox="0 0 90 90">
            <circle
              className="circle-bg"
              cx="45"
              cy="45"
              r={radius}
              strokeWidth="8"
            />
            <circle
              className="circle-indicator"
              cx="45"
              cy="45"
              r={radius}
              strokeWidth="8"
              strokeDasharray={circumference}
              strokeDashoffset={isNaN(strokeDashoffset) ? circumference : strokeDashoffset}
            />
          </svg>
          <div className="progress-value">{pageProgressPercent}%</div>
        </div>
        <div className="stat-details">
          <h3>Progresso Totale</h3>
          <p className="subtitle">Basato sulle pagine studiate</p>
          <div className="progress-fraction">
            <span className="completed-pages">{displayCompleted}</span>
            <span className="separator">/</span>
            <span className="total-pages">{displayPlanned} pag totali</span>
          </div>
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-icon-wrapper purple-glow">
          <AwardIcon size={24} className="stat-icon text-purple" />
        </div>
        <div className="stat-content">
          <h3>Task Completati</h3>
          <p className="stat-value">{calendarItemsCompleted} <span className="value-unit">/ {calendarItemsTotal}</span></p>
          <div className="mini-progress-bar">
            <div className="mini-progress-fill purple-bg" style={{ width: `${taskProgressPercent}%` }}></div>
          </div>
          <p className="subtitle">{taskProgressPercent}% di compiti eseguiti</p>
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-icon-wrapper orange-glow">
          <FlameIcon size={24} className="stat-icon text-orange" />
        </div>
        <div className="stat-content">
          <h3>Streak di Studio</h3>
          <p className="stat-value">{maxStreak} <span className="value-unit">giorni</span></p>
          <div className="streak-indicator-dots">
            {allDaysSorted.slice(-7).map((d, index) => (
              <span 
                key={index} 
                className={`streak-dot ${d.studied ? 'studied' : 'idle'}`}
                title={d.studied ? "Studiato!" : "Riposo"}
              />
            ))}
          </div>
          <p className="subtitle">Massima costanza registrata</p>
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-icon-wrapper blue-glow">
          <BookIcon size={24} className="stat-icon text-blue" />
        </div>
        <div className="stat-content">
          <h3>Materie Attive</h3>
          <p className="stat-value">{subjects.length} <span className="value-unit">materie</span></p>
          <p className="subtitle">
            {subjects.filter(s => s.completed).length} già completate con successo
          </p>
        </div>
      </div>
    </div>
  );
};
