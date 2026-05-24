import { useState, useEffect } from 'react';
import type { PlannerState, Subject, WeekPlan } from './types/planner';
import { MaterialsList } from './components/MaterialsList';
import { WeeklyGrid } from './components/WeeklyGrid';
import { AddWeekModal } from './components/AddWeekModal';
import { ImportExport } from './components/ImportExport';
import { SubjectsManager } from './components/SubjectsManager';
import { PlusIcon, SunIcon, MoonIcon } from './components/Icons';
import './App.css';

// Initial Mock Data matching the user's screenshot exactly
const INITIAL_SUBJECTS: Subject[] = [
  { 
    id: 'subj-1', 
    name: 'Cloud - LAN e VLAN', 
    pages: 14, 
    completed: false, 
    color: '#d97706',
    tasks: [
      { id: 'task-1-1', name: 'Capitolo 1: Standard LAN', pages: 8, completed: false },
      { id: 'task-1-2', name: 'Quiz VLAN & Trunking', pages: 6, completed: false }
    ]
  },
  { 
    id: 'subj-2', 
    name: 'Cloud - Multi QoS', 
    pages: 18, 
    completed: false, 
    color: '#2563eb',
    tasks: [
      { id: 'task-2-1', name: 'Lettura QoS Overview', pages: 10, completed: false },
      { id: 'task-2-2', name: 'Esercizi code prioritizzazione', pages: 8, completed: false }
    ]
  },
  { 
    id: 'subj-3', 
    name: 'Cloud - CC Concept', 
    pages: 22, 
    completed: false, 
    color: '#059669',
    tasks: [
      { id: 'task-3-1', name: 'Architettura Cloud Computing', pages: 12, completed: false },
      { id: 'task-3-2', name: 'Quiz di ricapitolazione', pages: 10, completed: false }
    ]
  },
  { 
    id: 'subj-4', 
    name: 'Cloud - CC Virtualization', 
    pages: 16, 
    completed: false, 
    color: '#7c3aed',
    tasks: []
  },
  { 
    id: 'subj-5', 
    name: 'Cloud - CC Container', 
    pages: 23, 
    completed: false, 
    color: '#dc2626',
    tasks: []
  },
  { 
    id: 'subj-6', 
    name: 'Cloud - Network soft.', 
    pages: 17, 
    completed: false, 
    color: '#db2777',
    tasks: []
  }
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
  },
  {
    id: 'week-3',
    name: 'Settimana 3: 8 Giu - 14 Giu',
    days: [
      { id: 'day-3-1', name: 'Lunedì 8', dateLabel: '8 Giu', mattina: [], pomeriggio: [], sera: [] },
      { id: 'day-3-2', name: 'Martedì 9', dateLabel: '9 Giu', mattina: [], pomeriggio: [], sera: [] },
      { id: 'day-3-3', name: 'Mercoledì 10', dateLabel: '10 Giu', mattina: [], pomeriggio: [], sera: [] },
      { id: 'day-3-4', name: 'Giovedì 11', dateLabel: '11 Giu', mattina: [], pomeriggio: [], sera: [] },
      { id: 'day-3-5', name: 'Venerdì 12', dateLabel: '12 Giu', mattina: [], pomeriggio: [], sera: [] },
      { id: 'day-3-6', name: 'Sabato 13', dateLabel: '13 Giu', mattina: [], pomeriggio: [], sera: [] },
      { id: 'day-3-7', name: 'Domenica 14', dateLabel: '14 Giu', mattina: [], pomeriggio: [], sera: [] }
    ]
  },
  {
    id: 'week-4',
    name: 'Settimana 4: 15 Giu - 21 Giu',
    days: [
      { id: 'day-4-1', name: 'Lunedì 15', dateLabel: '15 Giu', mattina: [], pomeriggio: [], sera: [] },
      { id: 'day-4-2', name: 'Martedì 16', dateLabel: '16 Giu', mattina: [], pomeriggio: [], sera: [] },
      { id: 'day-4-3', name: 'Mercoledì 17', dateLabel: '17 Giu', mattina: [], pomeriggio: [], sera: [] },
      { id: 'day-4-4', name: 'Giovedì 18', dateLabel: '18 Giu', mattina: [], pomeriggio: [], sera: [] },
      { id: 'day-4-5', name: 'Venerdì 19', dateLabel: '19 Giu', mattina: [], pomeriggio: [], sera: [] },
      { id: 'day-4-6', name: 'Sabato 20', dateLabel: '20 Giu', mattina: [], pomeriggio: [], sera: [] },
      { id: 'day-4-7', name: 'Domenica 21', dateLabel: '21 Giu', mattina: [], pomeriggio: [], sera: [] }
    ]
  },
  {
    id: 'week-5',
    name: 'Settimana 5: 22 Giu - 28 Giu',
    days: [
      { id: 'day-5-1', name: 'Lunedì 22', dateLabel: '22 Giu', mattina: [], pomeriggio: [], sera: [] },
      { id: 'day-5-2', name: 'Martedì 23', dateLabel: '23 Giu', mattina: [], pomeriggio: [], sera: [] },
      { id: 'day-5-3', name: 'Mercoledì 24', dateLabel: '24 Giu', mattina: [], pomeriggio: [], sera: [] },
      { id: 'day-5-4', name: 'Giovedì 25', dateLabel: '25 Giu', mattina: [], pomeriggio: [], sera: [] },
      { id: 'day-5-5', name: 'Venerdì 26', dateLabel: '26 Giu', mattina: [], pomeriggio: [], sera: [] },
      { id: 'day-5-6', name: 'Sabato 27', dateLabel: '27 Giu', mattina: [], pomeriggio: [], sera: [] },
      { id: 'day-5-7', name: 'Domenica 28', dateLabel: '28 Giu', mattina: [], pomeriggio: [], sera: [] }
    ]
  },
  {
    id: 'week-6',
    name: 'Settimana 6: 29 Giu - 5 Lug',
    days: [
      { id: 'day-6-1', name: 'Lunedì 29', dateLabel: '29 Giu', mattina: [], pomeriggio: [], sera: [] },
      { id: 'day-6-2', name: 'Martedì 30', dateLabel: '30 Giu', mattina: [], pomeriggio: [], sera: [] },
      { id: 'day-6-3', name: 'Mercoledì 1', dateLabel: '1 Lug', mattina: [], pomeriggio: [], sera: [] },
      { id: 'day-6-4', name: 'Giovedì 2', dateLabel: '2 Lug', mattina: [], pomeriggio: [], sera: [] },
      { id: 'day-6-5', name: 'Venerdì 3', dateLabel: '3 Lug', mattina: [], pomeriggio: [], sera: [] },
      { id: 'day-6-6', name: 'Sabato 4', dateLabel: '4 Lug', mattina: [], pomeriggio: [], sera: [] },
      { id: 'day-6-7', name: 'Domenica 5', dateLabel: '5 Lug', mattina: [], pomeriggio: [], sera: [] }
    ]
  },
  {
    id: 'week-7',
    name: 'Settimana 7: 6 Lug - 12 Lug',
    days: [
      { id: 'day-7-1', name: 'Lunedì 6', dateLabel: '6 Lug', mattina: [], pomeriggio: [], sera: [] },
      { id: 'day-7-2', name: 'Martedì 7', dateLabel: '7 Lug', mattina: [], pomeriggio: [], sera: [] },
      { id: 'day-7-3', name: 'Mercoledì 8', dateLabel: '8 Lug', mattina: [], pomeriggio: [], sera: [] },
      { id: 'day-7-4', name: 'Giovedì 9', dateLabel: '9 Lug', mattina: [], pomeriggio: [], sera: [] },
      { id: 'day-7-5', name: 'Venerdì 10', dateLabel: '10 Lug', mattina: [], pomeriggio: [], sera: [] },
      { id: 'day-7-6', name: 'Sabato 11', dateLabel: '11 Lug', mattina: [], pomeriggio: [], sera: [] },
      { id: 'day-7-7', name: 'Domenica 12', dateLabel: '12 Lug', mattina: [], pomeriggio: [], sera: [] }
    ]
  },
  {
    id: 'week-8',
    name: 'Settimana 8: 13 Lug - 19 Lug',
    days: [
      { id: 'day-8-1', name: 'Lunedì 13', dateLabel: '13 Lug', mattina: [], pomeriggio: [], sera: [] },
      { id: 'day-8-2', name: 'Martedì 14', dateLabel: '14 Lug', mattina: [], pomeriggio: [], sera: [] },
      { id: 'day-8-3', name: 'Mercoledì 15', dateLabel: '15 Lug', mattina: [], pomeriggio: [], sera: [] },
      { id: 'day-8-4', name: 'Giovedì 16', dateLabel: '16 Lug', mattina: [], pomeriggio: [], sera: [] },
      { id: 'day-8-5', name: 'Venerdì 17', dateLabel: '17 Lug', mattina: [], pomeriggio: [], sera: [] },
      { id: 'day-8-6', name: 'Sabato 18', dateLabel: '18 Lug', mattina: [], pomeriggio: [], sera: [] },
      { id: 'day-8-7', name: 'Domenica 19', dateLabel: '19 Lug', mattina: [], pomeriggio: [], sera: [] }
    ]
  },
  {
    id: 'week-9',
    name: 'Settimana 9: 20 Lug - 26 Lug',
    days: [
      { id: 'day-9-1', name: 'Lunedì 20', dateLabel: '20 Lug', mattina: [], pomeriggio: [], sera: [] },
      { id: 'day-9-2', name: 'Martedì 21', dateLabel: '21 Lug', mattina: [], pomeriggio: [], sera: [] },
      { id: 'day-9-3', name: 'Mercoledì 22', dateLabel: '22 Lug', mattina: [], pomeriggio: [], sera: [] },
      { id: 'day-9-4', name: 'Giovedì 23', dateLabel: '23 Lug', mattina: [], pomeriggio: [], sera: [] },
      { id: 'day-9-5', name: 'Venerdì 24', dateLabel: '24 Lug', mattina: [], pomeriggio: [], sera: [] },
      { id: 'day-9-6', name: 'Sabato 25', dateLabel: '25 Lug', mattina: [], pomeriggio: [], sera: [] },
      { id: 'day-9-7', name: 'Domenica 26', dateLabel: '26 Lug', mattina: [], pomeriggio: [], sera: [] }
    ]
  },
  {
    id: 'week-10',
    name: 'Settimana 10: 27 Lug - 2 Ago',
    days: [
      { id: 'day-10-1', name: 'Lunedì 27', dateLabel: '27 Lug', mattina: [], pomeriggio: [], sera: [] },
      { id: 'day-10-2', name: 'Martedì 28', dateLabel: '28 Lug', mattina: [], pomeriggio: [], sera: [] },
      { id: 'day-10-3', name: 'Mercoledì 29', dateLabel: '29 Lug', mattina: [], pomeriggio: [], sera: [] },
      { id: 'day-10-4', name: 'Giovedì 30', dateLabel: '30 Lug', mattina: [], pomeriggio: [], sera: [] },
      { id: 'day-10-5', name: 'Venerdì 31', dateLabel: '31 Lug', mattina: [], pomeriggio: [], sera: [] },
      { id: 'day-10-6', name: 'Sabato 1', dateLabel: '1 Ago', mattina: [], pomeriggio: [], sera: [] },
      { id: 'day-10-7', name: 'Domenica 2', dateLabel: '2 Ago', mattina: [], pomeriggio: [], sera: [] }
    ]
  }
];

const LOCAL_STORAGE_KEY = 'antigravity-studio-planner-state';
const TITLE_STORAGE_KEY = 'antigravity-studio-planner-title';

function App() {
  // Load State from LocalStorage or use defaults
  const [subjects, setSubjects] = useState<Subject[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}-subjects`);
    if (saved) {
      const parsed = JSON.parse(saved) as Subject[];
      // Migrate existing state database to support the new tasks array cleanly
      return parsed.map((s) => ({
        ...s,
        tasks: s.tasks || [],
      }));
    }
    return INITIAL_SUBJECTS;
  });

  const [weeks, setWeeks] = useState<WeekPlan[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}-weeks`);
    if (saved) {
      const parsed = JSON.parse(saved) as WeekPlan[];
      // If the user has <= 2 weeks, auto-migrate to cover the new expanded July schedule!
      if (parsed.length > 0 && parsed.length <= 2) {
        return INITIAL_WEEKS;
      }
      return parsed;
    }
    return INITIAL_WEEKS;
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<'planner' | 'subjects'>('planner');
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('antigravity-studio-planner-theme');
    return (saved as 'dark' | 'light') || 'dark';
  });

  // Sync to LocalStorage
  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}-subjects`, JSON.stringify(subjects));
  }, [subjects]);

  useEffect(() => {
    localStorage.setItem('antigravity-studio-planner-theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}-weeks`, JSON.stringify(weeks));
  }, [weeks]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}-activeWeekId`, activeWeekId);
  }, [activeWeekId]);

  useEffect(() => {
    localStorage.setItem(TITLE_STORAGE_KEY, sessionTitle);
  }, [sessionTitle]);



  // Subject Actions
  const handleAddSubject = (name: string, pages: number, color: string) => {
    const newSubject: Subject = {
      id: `subj-${Date.now()}`,
      name,
      pages,
      completed: false,
      color,
      tasks: [],
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



  const handleAddWeek = (newWeek: WeekPlan) => {
    setWeeks([...weeks, newWeek]);
    setActiveWeekId(newWeek.id);
    setShowAddWeekModal(false);
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





  return (
    <div className={`app-container ${theme === 'light' ? 'light-theme' : ''}`}>
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

        {/* Tabbed Navigation Bar */}
        <div className="header-navigation-tabs">
          <button
            className={`nav-tab-btn ${activeTab === 'planner' ? 'active' : ''}`}
            onClick={() => setActiveTab('planner')}
            title="Mostra la programmazione del calendario"
          >
            📅 Planner
          </button>
          <button
            className={`nav-tab-btn ${activeTab === 'subjects' ? 'active' : ''}`}
            onClick={() => setActiveTab('subjects')}
            title="Gestisci le materie e i sotto-task in dettaglio"
          >
            📚 Le tue materie
          </button>
        </div>

        <div className="header-controls">
          {/* Theme Toggle Button */}
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            title={theme === 'dark' ? "Passa al tema chiaro" : "Passa al tema scuro"}
          >
            {theme === 'dark' ? <SunIcon size={16} /> : <MoonIcon size={16} />}
            <span>{theme === 'dark' ? 'Tema Chiaro' : 'Tema Scuro'}</span>
          </button>

          {/* Collapsible Sidebar Toggle Button (Dangerous/Warning style, only if in planner tab) */}
          {activeTab === 'planner' && (
            <button
              className={`btn ${isSidebarOpen ? 'btn-warning' : 'btn-secondary'} btn-sm`}
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              title={isSidebarOpen ? "Nascondi la Libreria Materie" : "Mostra la Libreria Materie"}
            >
              <span>{isSidebarOpen ? 'Chiudi Libreria' : 'Apri Libreria'}</span>
            </button>
          )}

          {/* Primary Style for New Week (only if in planner tab) */}
          {activeTab === 'planner' && (
            <button
              className="btn btn-primary btn-sm"
              onClick={() => setShowAddWeekModal(true)}
              title="Pianifica una nuova settimana"
            >
              <PlusIcon size={16} />
              <span>Nuova Settimana</span>
            </button>
          )}

          {/* Backup Utilities (Secondary) */}
          <ImportExport
            plannerState={{ weeks, subjects, activeWeekId }}
            onImportState={handleImportState}
          />
        </div>
      </header>

      {/* Main Dashboard Layout */}
      {activeTab === 'subjects' ? (
        <SubjectsManager
          subjects={subjects}
          onUpdateSubjects={setSubjects}
        />
      ) : (
        <div className={`main-dashboard-layout ${isSidebarOpen ? '' : 'sidebar-closed'}`}>
          {/* Left Column: Collapsible Materials library (fully unrendered when closed) */}
          {isSidebarOpen && (
            <aside className="layout-left-column">
              <MaterialsList
                subjects={subjects}
                onAddSubject={handleAddSubject}
                onToggleSubject={handleToggleSubject}
                onDeleteSubject={handleDeleteSubject}
                onUpdateSubjects={setSubjects}
              />
            </aside>
          )}

          {/* Right Column: Calendar grid for the WHOLE MONTH stacked vertically */}
          <main className="layout-right-column">
          {weeks.length > 0 ? (
            weeks.map((week, index) => {
              return (
                <div key={week.id} className="week-wrapper">
                  <div className="week-wrapper-header">
                    <h2 className="week-title">
                      {week.name.split(':')[1]?.trim() || week.name}
                    </h2>
                  </div>
                  <WeeklyGrid
                    activeWeek={week}
                    weeks={weeks}
                    subjects={subjects}
                    onUpdateAllWeeks={setWeeks}
                    isFirstWeek={index === 0}
                  />
                </div>
              );
            })
          ) : (
            <div className="empty-state glass-container" style={{ padding: '40px' }}>
              <p>Nessuna settimana pianificata attiva.</p>
              <button className="btn btn-primary" onClick={() => setShowAddWeekModal(true)} style={{ marginTop: '12px' }}>
                Crea la prima settimana
              </button>
            </div>
          )}
        </main>
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
