import React, { useState, useEffect } from 'react';
import { PlannerState, Subject, WeekPlan } from './types/planner';
import { StatsDashboard } from './components/StatsDashboard';
import { MaterialsList } from './components/MaterialsList';
import { WeeklyGrid } from './components/WeeklyGrid';
import { AddWeekModal } from './components/AddWeekModal';
import { ImportExport } from './components/ImportExport';
import { PlusIcon, ChevronLeftIcon, ChevronRightIcon } from './components/Icons';
import './App.css';

// Initial Mock Data matching the user's screenshot exactly
const INITIAL_SUBJECTS: Subject[] = [
  { id: 'subj-1', name: 'Cloud - LAN e VLAN', pages: 14, completed: false, color: '#d97706' },
  { id: 'subj-2', name: 'Cloud - Multi QoS', pages: 18, completed: false, color: '#d97706' },
  { id: 'subj-3', name: 'Cloud - CC Concept', pages: 22, completed: false, color: '#d97706' },
  { id: 'subj-4', name: 'Cloud - CC Virtualization', pages: 16, completed: false, color: '#d97706' },
  { id: 'subj-5', name: 'Cloud - CC Container', pages: 23, completed: false, color: '#d97706' },
  { id: 'subj-6', name: 'Cloud - Network soft.', pages: 17, completed: false, color: '#d97706' }
];

const INITIAL_WEEKS: WeekPlan[] = [
  {
    id: 'week-1',
    name: 'Settimana 1: 25 Mag - 31 Mag',
    days: [
      {
        id: 'day-1',
        name: 'Lunedì 25',
        dateLabel: '25 Mag',
        mattina: [
          { id: 'item-1-1', name: 'IPv4', pages: 12, completed: false },
          { id: 'item-1-2', name: 'Quiz IPv4', completed: false }
        ],
        pomeriggio: [],
        sera: []
      },
      {
        id: 'day-2',
        name: 'Martedì 26',
        dateLabel: '26 Mag',
        mattina: [
          { id: 'item-2-1', name: 'Routing', pages: 18, completed: false },
          { id: 'item-2-2', name: 'Quiz Routing', completed: false }
        ],
        pomeriggio: [],
        sera: []
      },
      {
        id: 'day-3',
        name: 'Mercoledì 27',
        dateLabel: '27 Mag',
        mattina: [
          { id: 'item-3-1', name: 'IPv6', pages: 36, completed: false },
          { id: 'item-3-2', name: 'IPv6', pages: 36, completed: false }
        ],
        pomeriggio: [],
        sera: []
      },
      {
        id: 'day-4',
        name: 'Giovedì 28',
        dateLabel: '28 Mag',
        mattina: [],
        pomeriggio: [
          { id: 'item-4-1', name: 'LABORATORIO NETWORK', pages: 14, completed: false }
        ],
        sera: []
      },
      {
        id: 'day-5',
        name: 'Venerdì 29',
        dateLabel: '29 Mag',
        mattina: [],
        pomeriggio: [],
        sera: []
      },
      {
        id: 'day-6',
        name: 'Sabato 30',
        dateLabel: '30 Mag',
        mattina: [],
        pomeriggio: [],
        sera: []
      },
      {
        id: 'day-7',
        name: 'Domenica 31',
        dateLabel: '31 Mag',
        mattina: [],
        pomeriggio: [],
        sera: []
      }
    ]
  },
  {
    id: 'week-2',
    name: 'Settimana 2: 1 Giu - 7 Giu',
    days: [
      { id: 'day-8', name: 'Lunedì 1', dateLabel: '1 Giu', mattina: [], pomeriggio: [], sera: [] },
      { id: 'day-9', name: 'Martedì 2', dateLabel: '2 Giu', mattina: [], pomeriggio: [], sera: [] },
      { id: 'day-10', name: 'Mercoledì 3', dateLabel: '3 Giu', mattina: [], pomeriggio: [], sera: [] },
      { id: 'day-11', name: 'Giovedì 4', dateLabel: '4 Giu', mattina: [], pomeriggio: [], sera: [] },
      { id: 'day-12', name: 'Venerdì 5', dateLabel: '5 Giu', mattina: [], pomeriggio: [], sera: [] },
      { id: 'day-13', name: 'Sabato 6', dateLabel: '6 Giu', mattina: [], pomeriggio: [], sera: [] },
      { id: 'day-14', name: 'Domenica 7', dateLabel: '7 Giu', mattina: [], pomeriggio: [], sera: [] }
    ]
  }
];

const LOCAL_STORAGE_KEY = 'antigravity-studio-planner-state';
const TITLE_STORAGE_KEY = 'antigravity-studio-planner-title';

function App() {
  // Load State from LocalStorage or use defaults
  const [subjects, setSubjects] = useState<Subject[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}-subjects`);
    return saved ? JSON.parse(saved) : INITIAL_SUBJECTS;
  });

  const [weeks, setWeeks] = useState<WeekPlan[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}-weeks`);
    return saved ? JSON.parse(saved) : INITIAL_WEEKS;
  });

  const [activeWeekId, setActiveWeekId] = useState<string>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}-activeWeekId`);
    if (saved) return saved;
    return INITIAL_WEEKS[0]?.id || '';
  });

  const [sessionTitle, setSessionTitle] = useState<string>(() => {
    const saved = localStorage.getItem(TITLE_STORAGE_KEY);
    return saved ? saved : 'SESSIONE ESTIVA';
  });

  const [showAddWeekModal, setShowAddWeekModal] = useState(false);

  // Sync to LocalStorage
  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}-subjects`, JSON.stringify(subjects));
  }, [subjects]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}-weeks`, JSON.stringify(weeks));
  }, [weeks]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}-activeWeekId`, activeWeekId);
  }, [activeWeekId]);

  useEffect(() => {
    localStorage.setItem(TITLE_STORAGE_KEY, sessionTitle);
  }, [sessionTitle]);

  const activeWeek = weeks.find((w) => w.id === activeWeekId) || weeks[0];

  // Subject Actions
  const handleAddSubject = (name: string, pages: number, color: string) => {
    const newSubject: Subject = {
      id: `subj-${Date.now()}`,
      name,
      pages,
      completed: false,
      color,
    };
    setSubjects([...subjects, newSubject]);
  };

  const handleToggleSubject = (id: string) => {
    setSubjects(
      subjects.map((s) => (s.id === id ? { ...s, completed: !s.completed } : s))
    );
  };

  const handleDeleteSubject = (id: string) => {
    if (window.confirm("Sei sicuro di voler eliminare questa materia dalla libreria? Non rimuoverà le ore già programmate nel calendario.")) {
      setSubjects(subjects.filter((s) => s.id !== id));
    }
  };

  // Week Actions
  const handleUpdateWeekSchedule = (updatedWeek: WeekPlan) => {
    setWeeks(weeks.map((w) => (w.id === updatedWeek.id ? updatedWeek : w)));
  };

  const handleAddWeek = (newWeek: WeekPlan) => {
    setWeeks([...weeks, newWeek]);
    setActiveWeekId(newWeek.id);
    setShowAddWeekModal(false);
  };

  const handleNextWeek = () => {
    const currentIndex = weeks.findIndex((w) => w.id === activeWeekId);
    if (currentIndex < weeks.length - 1) {
      setActiveWeekId(weeks[currentIndex + 1].id);
    }
  };

  const handlePrevWeek = () => {
    const currentIndex = weeks.findIndex((w) => w.id === activeWeekId);
    if (currentIndex > 0) {
      setActiveWeekId(weeks[currentIndex - 1].id);
    }
  };

  const handleImportState = (importedState: PlannerState) => {
    setWeeks(importedState.weeks);
    setSubjects(importedState.subjects);
    if (importedState.weeks.length > 0) {
      setActiveWeekId(importedState.activeWeekId || importedState.weeks[0].id);
    }
  };

  const handleResetAll = () => {
    if (window.confirm("⚠️ ATTENZIONE: Questo cancellerà in modo PERMANENTE tutti i tuoi dati di studio e ripristinerà lo stato iniziale. Vuoi procedere?")) {
      localStorage.removeItem(`${LOCAL_STORAGE_KEY}-subjects`);
      localStorage.removeItem(`${LOCAL_STORAGE_KEY}-weeks`);
      localStorage.removeItem(`${LOCAL_STORAGE_KEY}-activeWeekId`);
      localStorage.removeItem(TITLE_STORAGE_KEY);
      
      setSubjects(INITIAL_SUBJECTS);
      setWeeks(INITIAL_WEEKS);
      setActiveWeekId(INITIAL_WEEKS[0].id);
      setSessionTitle('SESSIONE ESTIVA');
    }
  };

  const currentWeekIndex = weeks.findIndex((w) => w.id === activeWeekId);

  return (
    <div className="app-container">
      {/* Top Header */}
      <header className="app-header">
        <div className="header-title-container">
          <div className="session-badge">📚 Studio Workspace</div>
          <input
            type="text"
            value={sessionTitle}
            onChange={(e) => setSessionTitle(e.target.value)}
            className="app-title-editable"
            title="Clicca per rinominare la sessione"
          />
        </div>

        <div className="header-controls">
          {/* Week Selector */}
          <div className="week-navigator">
            <button
              onClick={handlePrevWeek}
              disabled={currentWeekIndex <= 0}
              className="btn-nav"
              title="Settimana precedente"
            >
              <ChevronLeftIcon size={18} />
            </button>
            <span className="week-display-title">
              {activeWeek ? activeWeek.name.split(':')[0] : 'Nessuna settimana'}
            </span>
            <button
              onClick={handleNextWeek}
              disabled={currentWeekIndex >= weeks.length - 1}
              className="btn-nav"
              title="Settimana successiva"
            >
              <ChevronRightIcon size={18} />
            </button>
          </div>

          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setShowAddWeekModal(true)}
            title="Pianifica una nuova settimana"
          >
            <PlusIcon size={16} />
            <span>Nuova Settimana</span>
          </button>

          {/* Backup Utilities */}
          <ImportExport
            plannerState={{ weeks, subjects, activeWeekId }}
            onImportState={handleImportState}
          />
        </div>
      </header>

      {/* Statistics dashboard */}
      <StatsDashboard subjects={subjects} weeks={weeks} />

      {/* Materials checklist panel */}
      <MaterialsList
        subjects={subjects}
        onAddSubject={handleAddSubject}
        onToggleSubject={handleToggleSubject}
        onDeleteSubject={handleDeleteSubject}
      />

      {/* Week Grid Panel */}
      {activeWeek ? (
        <div className="calendar-section-wrapper">
          <div className="calendar-section-header" style={{ marginBottom: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#ffedd5' }}>
              🎯 Programmazione: <span style={{ color: '#d97706', fontWeight: '800' }}>{activeWeek.name}</span>
            </h2>
          </div>
          <WeeklyGrid
            activeWeek={activeWeek}
            subjects={subjects}
            onUpdateWeekSchedule={handleUpdateWeekSchedule}
          />
        </div>
      ) : (
        <div className="empty-state glass-container" style={{ padding: '40px' }}>
          <p>Nessuna settimana pianificata attiva.</p>
          <button className="btn btn-primary" onClick={() => setShowAddWeekModal(true)} style={{ marginTop: '12px' }}>
            Crea la prima settimana
          </button>
        </div>
      )}

      {/* Danger Zone / Reset */}
      <footer className="danger-zone">
        <button className="btn-danger-text" onClick={handleResetAll}>
          Ripristina dati iniziali di fabbrica
        </button>
      </footer>

      {/* Modals */}
      {showAddWeekModal && (
        <AddWeekModal
          onClose={() => setShowAddWeekModal(false)}
          onAddWeek={handleAddWeek}
          suggestedWeekNumber={weeks.length + 1}
        />
      )}
    </div>
  );
}

export default App;
