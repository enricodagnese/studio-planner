import { useState, useEffect } from 'react';
import type { PlannerState, Subject, WeekPlan } from './types/planner';
import { MaterialsList } from './components/MaterialsList';
import { WeeklyGrid } from './components/WeeklyGrid';
import { AddWeekModal } from './components/AddWeekModal';
import { ImportExport } from './components/ImportExport';
import { SubjectsManager } from './components/SubjectsManager';
import { PlusIcon } from './components/Icons';
import './App.css';

// Initial Mock Data matching the user's screenshot exactly (with soft cyber themes)
const INITIAL_SUBJECTS: Subject[] = [
  { 
    id: 'subj-1', 
    name: 'Cloud - LAN e VLAN', 
    pages: 14, 
    completed: false, 
    color: '#fbbf24', // Soft Gold
    logo: 'globe', // Cybersecurity vector icon key
    description: 'Syllabus generale e configurazione di LAN, VLAN e protocollo 802.1Q.',
    tasks: [
      { id: 'task-1-1', name: 'Capitolo 1: Standard LAN', pages: 8, completed: false, category: 'teoria' },
      { id: 'task-1-2', name: 'Quiz VLAN & Trunking', pages: 6, completed: false, category: 'esercizi' }
    ]
  },
  { 
    id: 'subj-2', 
    name: 'Cloud - Multi QoS', 
    pages: 18, 
    completed: false, 
    color: '#60a5fa', // Soft Blue
    logo: 'cpu', // Cybersecurity vector icon key
    description: 'Meccanismi di coda, prioritizzazione e policy di Quality of Service.',
    tasks: [
      { id: 'task-2-1', name: 'Lettura QoS Overview', pages: 10, completed: false, category: 'teoria' },
      { id: 'task-2-2', name: 'Esercizi code prioritizzazione', pages: 8, completed: false, category: 'esercizi' }
    ]
  },
  { 
    id: 'subj-3', 
    name: 'Cloud - CC Concept', 
    pages: 22, 
    completed: false, 
    color: '#34d399', // Soft Emerald
    logo: 'shield', // Cybersecurity vector icon key
    description: 'Definizioni e modelli del Cloud (IaaS, PaaS, SaaS).',
    tasks: [
      { id: 'task-3-1', name: 'Architettura Cloud Computing', pages: 12, completed: false, category: 'teoria' },
      { id: 'task-3-2', name: 'Quiz di ricapitolazione', pages: 10, completed: false, category: 'esercizi' }
    ]
  },
  { 
    id: 'subj-4', 
    name: 'Cloud - CC Virtualization', 
    pages: 16, 
    completed: false, 
    color: '#a78bfa', // Soft Purple
    logo: 'terminal', // Cybersecurity vector icon key
    description: 'Hypervisor, macchine virtuali e architetture di virtualizzazione.',
    tasks: []
  },
  { 
    id: 'subj-5', 
    name: 'Cloud - CC Container', 
    pages: 23, 
    completed: false, 
    color: '#f87171', // Soft Red
    logo: 'database', // Cybersecurity vector icon key
    description: 'Docker, containerizzazione e orchestrazione base.',
    tasks: []
  },
  { 
    id: 'subj-6', 
    name: 'Cloud - Network soft.', 
    pages: 17, 
    completed: false, 
    color: '#f472b6', // Soft Pink
    logo: 'server', // Cybersecurity vector icon key
    description: 'Reti software-defined (SDN) e piani di controllo/dati.',
    tasks: []
  }
];

const INITIAL_WEEKS: WeekPlan[] = [
  {
    id: 'week-1',
    name: 'Settimana 1: 18 Lug - 19 Lug',
    days: [
      { id: 'day-8-6', name: 'Sabato 18', dateLabel: '18 Lug', mattina: [], pomeriggio: [], sera: [] },
      { id: 'day-8-7', name: 'Domenica 19', dateLabel: '19 Lug', mattina: [], pomeriggio: [], sera: [] }
    ]
  },
  {
    id: 'week-2',
    name: 'Settimana 2: 20 Lug - 26 Lug',
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
    id: 'week-3',
    name: 'Settimana 3: 27 Lug - 2 Ago',
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
    const colorMigrationMap: Record<string, string> = {
      '#d97706': '#fbbf24',
      '#2563eb': '#60a5fa',
      '#059669': '#34d399',
      '#7c3aed': '#a78bfa',
      '#dc2626': '#f87171',
      '#db2777': '#f472b6',
    };
    const logoMigrationMap: Record<string, string> = {
      '☁️': 'globe',
      '⚙️': 'cpu',
      '🌐': 'shield',
      '💻': 'terminal',
      '📦': 'database',
      '📡': 'server',
      '📚': 'shield'
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
          category: t.category || 'teoria'
        })),
      }));
    }
    return INITIAL_SUBJECTS;
  });

  const [weeks, setWeeks] = useState<WeekPlan[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}-weeks`);
    if (saved) {
      const parsed = JSON.parse(saved) as WeekPlan[];
      // If the saved state has weeks with May (Mag) or June (Giu) days, auto-migrate to the new July starting date!
      const hasOldDays = parsed.some(w => w.days.some(d => d.dateLabel.includes('Mag') || d.dateLabel.includes('Giu')));
      if (hasOldDays || parsed.length > 3) {
        return INITIAL_WEEKS;
      }
      return parsed;
    }
    return INITIAL_WEEKS;
  });

  const [activeWeekId, setActiveWeekId] = useState<string>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}-activeWeekId`);
    if (saved) {
      const activeExists = INITIAL_WEEKS.some(w => w.id === saved);
      if (activeExists) return saved;
    }
    return INITIAL_WEEKS[0]?.id || '';
  });

  const [sessionTitle, setSessionTitle] = useState<string>(() => {
    const saved = localStorage.getItem(TITLE_STORAGE_KEY);
    return saved ? saved : 'SESSIONE ESTIVA';
  });

  const [showAddWeekModal, setShowAddWeekModal] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<'planner' | 'subjects'>('planner');
  const [theme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('antigravity-studio-planner-theme');
    return (saved as 'dark' | 'light') || 'dark';
  });

  const [copiedItem, setCopiedItem] = useState<{ name: string; pages?: number; subjectId?: string } | null>(null);

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
      logo: '📚',
      description: '',
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
                onRedirectToSubjects={() => setActiveTab('subjects')}
              />
            </aside>
          )}

          {/* Right Column: Calendar grid for the WHOLE MONTH stacked vertically */}
          <main className="layout-right-column">
          {weeks.length > 0 ? (
            weeks.map((week, index) => {
              return (
                <div key={week.id} className="week-wrapper">
                  <WeeklyGrid
                    activeWeek={week}
                    weeks={weeks}
                    subjects={subjects}
                    onUpdateAllWeeks={setWeeks}
                    isFirstWeek={index === 0}
                    copiedItem={copiedItem}
                    onCopyItem={setCopiedItem}
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
