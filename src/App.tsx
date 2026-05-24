import { useState, useEffect } from 'react';
import type { PlannerState, Subject, WeekPlan } from './types/planner';
import { MaterialsList } from './components/MaterialsList';
import { WeeklyGrid } from './components/WeeklyGrid';
import { AddWeekModal } from './components/AddWeekModal';
import { ImportExport } from './components/ImportExport';
import { SubjectsManager } from './components/SubjectsManager';
import { PlusIcon, CalendarIcon, BookIcon } from './components/Icons';
import './App.css';

// Version key for forced migration when data structure changes
const PLANNER_VERSION = '4';
const VERSION_KEY = 'antigravity-studio-planner-version';

const INITIAL_SUBJECTS: Subject[] = [
  { 
    id: 'subj-1', name: 'Cloud - LAN e VLAN', pages: 14, completed: false,
    color: '#fbbf24', logo: 'globe',
    description: 'Syllabus generale e configurazione di LAN, VLAN e protocollo 802.1Q.',
    tasks: [
      { id: 'task-1-1', name: 'Capitolo 1: Standard LAN', pages: 8, completed: false, category: 'teoria', quantityType: 'pagine' },
      { id: 'task-1-2', name: 'Quiz VLAN & Trunking', pages: 6, completed: false, category: 'esercizi', quantityType: 'quiz' }
    ]
  },
  { 
    id: 'subj-2', name: 'Cloud - Multi QoS', pages: 18, completed: false,
    color: '#60a5fa', logo: 'cpu',
    description: 'Meccanismi di coda, prioritizzazione e policy di Quality of Service.',
    tasks: [
      { id: 'task-2-1', name: 'Lettura QoS Overview', pages: 10, completed: false, category: 'teoria', quantityType: 'pagine' },
      { id: 'task-2-2', name: 'Esercizi code prioritizzazione', pages: 8, completed: false, category: 'esercizi', quantityType: 'esercizi' }
    ]
  },
  { 
    id: 'subj-3', name: 'Cloud - CC Concept', pages: 22, completed: false,
    color: '#34d399', logo: 'shield',
    description: 'Definizioni e modelli del Cloud (IaaS, PaaS, SaaS).',
    tasks: [
      { id: 'task-3-1', name: 'Architettura Cloud Computing', pages: 12, completed: false, category: 'teoria', quantityType: 'pagine' },
      { id: 'task-3-2', name: 'Quiz di ricapitolazione', pages: 10, completed: false, category: 'esercizi', quantityType: 'quiz' }
    ]
  },
  { id: 'subj-4', name: 'Cloud - CC Virtualization', pages: 16, completed: false, color: '#a78bfa', logo: 'terminal', description: 'Hypervisor, macchine virtuali e architetture di virtualizzazione.', tasks: [] },
  { id: 'subj-5', name: 'Cloud - CC Container', pages: 23, completed: false, color: '#f87171', logo: 'database', description: 'Docker, containerizzazione e orchestrazione base.', tasks: [] },
  { id: 'subj-6', name: 'Cloud - Network soft.', pages: 17, completed: false, color: '#f472b6', logo: 'server', description: 'Reti software-defined (SDN) e piani di controllo/dati.', tasks: [] }
];

// Calendar: May 25 2026 (Monday) → July 17 2026 (Friday)
// Verification: Jan 1 2026 = Thursday. May 25 = Thursday + 144 days = Thursday + 20w4d = Monday ✓
const INITIAL_WEEKS: WeekPlan[] = [
  {
    id: 'week-1', name: 'Settimana 1: 25 Mag - 31 Mag',
    days: [
      { id: 'w1d1', name: 'Lunedì 25',   dateLabel: '25 Mag', mattina: [], pomeriggio: [], sera: [] },
      { id: 'w1d2', name: 'Martedì 26',  dateLabel: '26 Mag', mattina: [], pomeriggio: [], sera: [] },
      { id: 'w1d3', name: 'Mercoledì 27',dateLabel: '27 Mag', mattina: [], pomeriggio: [], sera: [] },
      { id: 'w1d4', name: 'Giovedì 28',  dateLabel: '28 Mag', mattina: [], pomeriggio: [], sera: [] },
      { id: 'w1d5', name: 'Venerdì 29',  dateLabel: '29 Mag', mattina: [], pomeriggio: [], sera: [] },
      { id: 'w1d6', name: 'Sabato 30',   dateLabel: '30 Mag', mattina: [], pomeriggio: [], sera: [] },
      { id: 'w1d7', name: 'Domenica 31', dateLabel: '31 Mag', mattina: [], pomeriggio: [], sera: [] },
    ]
  },
  {
    id: 'week-2', name: 'Settimana 2: 1 Giu - 7 Giu',
    days: [
      { id: 'w2d1', name: 'Lunedì 1',    dateLabel: '1 Giu', mattina: [], pomeriggio: [], sera: [] },
      { id: 'w2d2', name: 'Martedì 2',   dateLabel: '2 Giu', mattina: [], pomeriggio: [], sera: [] },
      { id: 'w2d3', name: 'Mercoledì 3', dateLabel: '3 Giu', mattina: [], pomeriggio: [], sera: [] },
      { id: 'w2d4', name: 'Giovedì 4',   dateLabel: '4 Giu', mattina: [], pomeriggio: [], sera: [] },
      { id: 'w2d5', name: 'Venerdì 5',   dateLabel: '5 Giu', mattina: [], pomeriggio: [], sera: [] },
      { id: 'w2d6', name: 'Sabato 6',    dateLabel: '6 Giu', mattina: [], pomeriggio: [], sera: [] },
      { id: 'w2d7', name: 'Domenica 7',  dateLabel: '7 Giu', mattina: [], pomeriggio: [], sera: [] },
    ]
  },
  {
    id: 'week-3', name: 'Settimana 3: 8 Giu - 14 Giu',
    days: [
      { id: 'w3d1', name: 'Lunedì 8',    dateLabel: '8 Giu', mattina: [], pomeriggio: [], sera: [] },
      { id: 'w3d2', name: 'Martedì 9',   dateLabel: '9 Giu', mattina: [], pomeriggio: [], sera: [] },
      { id: 'w3d3', name: 'Mercoledì 10',dateLabel: '10 Giu', mattina: [], pomeriggio: [], sera: [] },
      { id: 'w3d4', name: 'Giovedì 11',  dateLabel: '11 Giu', mattina: [], pomeriggio: [], sera: [] },
      { id: 'w3d5', name: 'Venerdì 12',  dateLabel: '12 Giu', mattina: [], pomeriggio: [], sera: [] },
      { id: 'w3d6', name: 'Sabato 13',   dateLabel: '13 Giu', mattina: [], pomeriggio: [], sera: [] },
      { id: 'w3d7', name: 'Domenica 14', dateLabel: '14 Giu', mattina: [], pomeriggio: [], sera: [] },
    ]
  },
  {
    id: 'week-4', name: 'Settimana 4: 15 Giu - 21 Giu',
    days: [
      { id: 'w4d1', name: 'Lunedì 15',   dateLabel: '15 Giu', mattina: [], pomeriggio: [], sera: [] },
      { id: 'w4d2', name: 'Martedì 16',  dateLabel: '16 Giu', mattina: [], pomeriggio: [], sera: [] },
      { id: 'w4d3', name: 'Mercoledì 17',dateLabel: '17 Giu', mattina: [], pomeriggio: [], sera: [] },
      { id: 'w4d4', name: 'Giovedì 18',  dateLabel: '18 Giu', mattina: [], pomeriggio: [], sera: [] },
      { id: 'w4d5', name: 'Venerdì 19',  dateLabel: '19 Giu', mattina: [], pomeriggio: [], sera: [] },
      { id: 'w4d6', name: 'Sabato 20',   dateLabel: '20 Giu', mattina: [], pomeriggio: [], sera: [] },
      { id: 'w4d7', name: 'Domenica 21', dateLabel: '21 Giu', mattina: [], pomeriggio: [], sera: [] },
    ]
  },
  {
    id: 'week-5', name: 'Settimana 5: 22 Giu - 28 Giu',
    days: [
      { id: 'w5d1', name: 'Lunedì 22',   dateLabel: '22 Giu', mattina: [], pomeriggio: [], sera: [] },
      { id: 'w5d2', name: 'Martedì 23',  dateLabel: '23 Giu', mattina: [], pomeriggio: [], sera: [] },
      { id: 'w5d3', name: 'Mercoledì 24',dateLabel: '24 Giu', mattina: [], pomeriggio: [], sera: [] },
      { id: 'w5d4', name: 'Giovedì 25',  dateLabel: '25 Giu', mattina: [], pomeriggio: [], sera: [] },
      { id: 'w5d5', name: 'Venerdì 26',  dateLabel: '26 Giu', mattina: [], pomeriggio: [], sera: [] },
      { id: 'w5d6', name: 'Sabato 27',   dateLabel: '27 Giu', mattina: [], pomeriggio: [], sera: [] },
      { id: 'w5d7', name: 'Domenica 28', dateLabel: '28 Giu', mattina: [], pomeriggio: [], sera: [] },
    ]
  },
  {
    id: 'week-6', name: 'Settimana 6: 29 Giu - 5 Lug',
    days: [
      { id: 'w6d1', name: 'Lunedì 29',   dateLabel: '29 Giu', mattina: [], pomeriggio: [], sera: [] },
      { id: 'w6d2', name: 'Martedì 30',  dateLabel: '30 Giu', mattina: [], pomeriggio: [], sera: [] },
      { id: 'w6d3', name: 'Mercoledì 1', dateLabel: '1 Lug', mattina: [], pomeriggio: [], sera: [] },
      { id: 'w6d4', name: 'Giovedì 2',   dateLabel: '2 Lug', mattina: [], pomeriggio: [], sera: [] },
      { id: 'w6d5', name: 'Venerdì 3',   dateLabel: '3 Lug', mattina: [], pomeriggio: [], sera: [] },
      { id: 'w6d6', name: 'Sabato 4',    dateLabel: '4 Lug', mattina: [], pomeriggio: [], sera: [] },
      { id: 'w6d7', name: 'Domenica 5',  dateLabel: '5 Lug', mattina: [], pomeriggio: [], sera: [] },
    ]
  },
  {
    id: 'week-7', name: 'Settimana 7: 6 Lug - 12 Lug',
    days: [
      { id: 'w7d1', name: 'Lunedì 6',    dateLabel: '6 Lug', mattina: [], pomeriggio: [], sera: [] },
      { id: 'w7d2', name: 'Martedì 7',   dateLabel: '7 Lug', mattina: [], pomeriggio: [], sera: [] },
      { id: 'w7d3', name: 'Mercoledì 8', dateLabel: '8 Lug', mattina: [], pomeriggio: [], sera: [] },
      { id: 'w7d4', name: 'Giovedì 9',   dateLabel: '9 Lug', mattina: [], pomeriggio: [], sera: [] },
      { id: 'w7d5', name: 'Venerdì 10',  dateLabel: '10 Lug', mattina: [], pomeriggio: [], sera: [] },
      { id: 'w7d6', name: 'Sabato 11',   dateLabel: '11 Lug', mattina: [], pomeriggio: [], sera: [] },
      { id: 'w7d7', name: 'Domenica 12', dateLabel: '12 Lug', mattina: [], pomeriggio: [], sera: [] },
    ]
  },
  {
    id: 'week-8', name: 'Settimana 8: 13 Lug - 17 Lug',
    days: [
      { id: 'w8d1', name: 'Lunedì 13',   dateLabel: '13 Lug', mattina: [], pomeriggio: [], sera: [] },
      { id: 'w8d2', name: 'Martedì 14',  dateLabel: '14 Lug', mattina: [], pomeriggio: [], sera: [] },
      { id: 'w8d3', name: 'Mercoledì 15',dateLabel: '15 Lug', mattina: [], pomeriggio: [], sera: [] },
      { id: 'w8d4', name: 'Giovedì 16',  dateLabel: '16 Lug', mattina: [], pomeriggio: [], sera: [] },
      { id: 'w8d5', name: 'Venerdì 17',  dateLabel: '17 Lug', mattina: [], pomeriggio: [], sera: [] },
    ]
  },
];

const LOCAL_STORAGE_KEY = 'antigravity-studio-planner-state';
const TITLE_STORAGE_KEY = 'antigravity-studio-planner-title';

function App() {
  const [subjects, setSubjects] = useState<Subject[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}-subjects`);
    const colorMigrationMap: Record<string, string> = {
      '#d97706': '#fbbf24', '#2563eb': '#60a5fa', '#059669': '#34d399',
      '#7c3aed': '#a78bfa', '#dc2626': '#f87171', '#db2777': '#f472b6',
    };
    const logoMigrationMap: Record<string, string> = {
      '☁️': 'globe', '⚙️': 'cpu', '🌐': 'shield',
      '💻': 'terminal', '📦': 'database', '📡': 'server', '📚': 'shield'
    };
    if (saved) {
      const parsed = JSON.parse(saved) as Subject[];
      return parsed.map((s) => ({
        ...s,
        color: colorMigrationMap[s.color] || s.color,
        logo: logoMigrationMap[s.logo] || s.logo || 'shield',
        description: s.description || '',
        tasks: (s.tasks || []).map((t) => ({
          ...t,
          category: t.category || 'teoria',
          quantityType: t.quantityType || 'pagine',
        })),
      }));
    }
    return INITIAL_SUBJECTS;
  });

  const [weeks, setWeeks] = useState<WeekPlan[]>(() => {
    // Version-based migration: if version doesn't match, reset weeks entirely
    const savedVersion = localStorage.getItem(VERSION_KEY);
    if (savedVersion !== PLANNER_VERSION) {
      return INITIAL_WEEKS;
    }
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}-weeks`);
    if (saved) {
      return JSON.parse(saved) as WeekPlan[];
    }
    return INITIAL_WEEKS;
  });

  const [activeWeekId, setActiveWeekId] = useState<string>(() => {
    const savedVersion = localStorage.getItem(VERSION_KEY);
    if (savedVersion !== PLANNER_VERSION) return INITIAL_WEEKS[0]?.id || '';
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}-activeWeekId`);
    if (saved) {
      const activeExists = weeks.some(w => w.id === saved);
      if (activeExists) return saved;
    }
    return INITIAL_WEEKS[0]?.id || '';
  });

  const [sessionTitle, setSessionTitle] = useState<string>(() => {
    return localStorage.getItem(TITLE_STORAGE_KEY) || 'SESSIONE ESTIVA';
  });

  const [showAddWeekModal, setShowAddWeekModal] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<'planner' | 'subjects'>('planner');
  const [theme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('antigravity-studio-planner-theme') as 'dark' | 'light') || 'dark';
  });

  // Sync version on mount (after state is set)
  useEffect(() => {
    localStorage.setItem(VERSION_KEY, PLANNER_VERSION);
  }, []);

  useEffect(() => { localStorage.setItem(`${LOCAL_STORAGE_KEY}-subjects`, JSON.stringify(subjects)); }, [subjects]);
  useEffect(() => { localStorage.setItem('antigravity-studio-planner-theme', theme); }, [theme]);
  useEffect(() => { localStorage.setItem(`${LOCAL_STORAGE_KEY}-weeks`, JSON.stringify(weeks)); }, [weeks]);
  useEffect(() => { localStorage.setItem(`${LOCAL_STORAGE_KEY}-activeWeekId`, activeWeekId); }, [activeWeekId]);
  useEffect(() => { localStorage.setItem(TITLE_STORAGE_KEY, sessionTitle); }, [sessionTitle]);

  const handleAddSubject = (name: string, pages: number, color: string) => {
    setSubjects([...subjects, {
      id: `subj-${Date.now()}`, name, pages, completed: false,
      color, logo: 'shield', description: '', tasks: [],
    }]);
  };

  const handleToggleSubject = (id: string) => {
    setSubjects(subjects.map((s) => (s.id === id ? { ...s, completed: !s.completed } : s)));
  };

  const handleDeleteSubject = (id: string) => {
    if (window.confirm("Sei sicuro di voler eliminare questa materia dalla libreria?")) {
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
    if (window.confirm("⚠️ ATTENZIONE: Questo cancellerà PERMANENTEMENTE tutti i tuoi dati di studio. Vuoi procedere?")) {
      localStorage.removeItem(`${LOCAL_STORAGE_KEY}-subjects`);
      localStorage.removeItem(`${LOCAL_STORAGE_KEY}-weeks`);
      localStorage.removeItem(`${LOCAL_STORAGE_KEY}-activeWeekId`);
      localStorage.removeItem(TITLE_STORAGE_KEY);
      localStorage.removeItem(VERSION_KEY);
      setSubjects(INITIAL_SUBJECTS);
      setWeeks(INITIAL_WEEKS);
      setActiveWeekId(INITIAL_WEEKS[0].id);
      setSessionTitle('SESSIONE ESTIVA');
    }
  };

  return (
    <div className={`app-container ${theme === 'light' ? 'light-theme' : ''}`}>
      <header className="app-header">
        <div className="header-title-container">
          <div className="session-badge">
            <BookIcon size={14} />
            Studio Workspace
          </div>
          <input
            type="text"
            value={sessionTitle}
            onChange={(e) => setSessionTitle(e.target.value)}
            className="app-title-editable"
            title="Clicca per rinominare la sessione"
          />
        </div>

        <div className="header-navigation-tabs">
          <button
            className={`nav-tab-btn ${activeTab === 'planner' ? 'active' : ''}`}
            onClick={() => setActiveTab('planner')}
            title="Mostra la programmazione del calendario"
          >
            <CalendarIcon size={15} />
            Planner
          </button>
          <button
            className={`nav-tab-btn ${activeTab === 'subjects' ? 'active' : ''}`}
            onClick={() => setActiveTab('subjects')}
            title="Gestisci le materie e i sotto-task in dettaglio"
          >
            <BookIcon size={15} />
            Le tue materie
          </button>
        </div>

        <div className="header-controls">
          {activeTab === 'planner' && (
            <button
              className={`btn ${isSidebarOpen ? 'btn-warning' : 'btn-secondary'} btn-sm`}
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              title={isSidebarOpen ? "Nascondi Libreria" : "Mostra Libreria"}
            >
              <span>{isSidebarOpen ? 'Chiudi Libreria' : 'Apri Libreria'}</span>
            </button>
          )}
          {activeTab === 'planner' && (
            <button className="btn btn-primary btn-sm" onClick={() => setShowAddWeekModal(true)} title="Pianifica una nuova settimana">
              <PlusIcon size={16} />
              <span>Nuova Settimana</span>
            </button>
          )}
          <ImportExport plannerState={{ weeks, subjects, activeWeekId }} onImportState={handleImportState} />
        </div>
      </header>

      {activeTab === 'subjects' ? (
        <SubjectsManager subjects={subjects} onUpdateSubjects={setSubjects} />
      ) : (
        <div className={`main-dashboard-layout ${isSidebarOpen ? '' : 'sidebar-closed'}`}>
          {isSidebarOpen && (
            <aside className="layout-left-column">
              <MaterialsList
                subjects={subjects}
                onAddSubject={handleAddSubject}
                onToggleSubject={handleToggleSubject}
                onDeleteSubject={handleDeleteSubject}
                onUpdateSubjects={setSubjects}
                onRedirectToSubjects={() => setActiveTab('subjects')}
              />
            </aside>
          )}
          <main className="layout-right-column">
            {weeks.length > 0 ? (
              weeks.map((week, index) => (
                <div key={week.id} className="week-wrapper">
                  <WeeklyGrid
                    activeWeek={week}
                    weeks={weeks}
                    subjects={subjects}
                    onUpdateAllWeeks={setWeeks}
                    onUpdateSubjects={setSubjects}
                    isFirstWeek={index === 0}
                  />
                </div>
              ))
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

      <footer className="danger-zone">
        <button className="btn-danger-text" onClick={handleResetAll}>
          Ripristina dati iniziali di fabbrica
        </button>
      </footer>

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
