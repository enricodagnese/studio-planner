import React, { useState } from 'react';
import type { Subject, Task } from '../types/planner';
import { TrashIcon, BookIcon } from './Icons';
import { CybersecurityLogo } from './CybersecurityLogo';

interface SubjectsManagerProps {
  subjects: Subject[];
  onUpdateSubjects: (updatedSubjects: Subject[]) => void;
}

const PRESET_COLORS = [
  { name: 'Gold', value: '#fbbf24', class: 'color-gold' },
  { name: 'Blue', value: '#60a5fa', class: 'color-blue' },
  { name: 'Emerald', value: '#34d399', class: 'color-emerald' },
  { name: 'Purple', value: '#a78bfa', class: 'color-purple' },
  { name: 'Red', value: '#f87171', class: 'color-red' },
  { name: 'Pink', value: '#f472b6', class: 'color-pink' },
];

const CYBER_LOGOS = [
  { key: 'shield', name: 'Firewall' },
  { key: 'lock', name: 'Crittografia' },
  { key: 'key', name: 'Autenticazione' },
  { key: 'terminal', name: 'Terminale Hacker' },
  { key: 'globe', name: 'Sicurezza Rete' },
  { key: 'radar', name: 'Scanner Minacce' },
  { key: 'bug', name: 'Analisi Malware' },
  { key: 'database', name: 'Database Sicuro' },
  { key: 'cpu', name: 'Sicurezza Chip' },
  { key: 'server', name: 'Mainframe Sicuro' }
];

export const SubjectsManager: React.FC<SubjectsManagerProps> = ({
  subjects,
  onUpdateSubjects,
}) => {
  const [selectedSubjId, setSelectedSubjId] = useState<string | null>(null);

  // Task creation state
  const [addingTaskCategory, setAddingTaskCategory] = useState<'teoria' | 'esercizi' | 'altro' | null>(null);
  const [taskName, setTaskName] = useState('');
  const [taskPages, setTaskPages] = useState<number>(10);

  // Copy/paste clipboard for tasks within subjects
  const [copiedTask, setCopiedTask] = useState<{ name: string; pages: number; category: 'teoria' | 'esercizi' | 'altro' } | null>(null);

  // Active Subject helper
  const activeSubj = subjects.find(s => s.id === selectedSubjId);

  // Add Subject (Autoselects the new subject immediately to edit!)
  const handleCreateSubject = () => {
    const newSubj: Subject = {
      id: `subj-${Date.now()}`,
      name: 'Nuova Materia',
      pages: 30,
      completed: false,
      color: PRESET_COLORS[Math.floor(Math.random() * PRESET_COLORS.length)].value,
      logo: 'shield',
      description: '',
      tasks: []
    };
    onUpdateSubjects([...subjects, newSubj]);
    setSelectedSubjId(newSubj.id);
  };

  // Delete Subject
  const handleDeleteSubject = (id: string) => {
    if (window.confirm("Sei sicuro di voler eliminare definitivamente questa materia e tutti i suoi compiti?")) {
      onUpdateSubjects(subjects.filter((s) => s.id !== id));
      setSelectedSubjId(null);
    }
  };

  // Update a single field inside the active Subject
  const handleUpdateActiveField = (field: keyof Subject, value: any) => {
    if (!selectedSubjId) return;
    onUpdateSubjects(
      subjects.map((s) => (s.id === selectedSubjId ? { ...s, [field]: value } : s))
    );
  };

  // Add Task inside category column
  const handleAddTask = (e: React.FormEvent, category: 'teoria' | 'esercizi' | 'altro') => {
    e.preventDefault();
    if (!taskName.trim() || !selectedSubjId || !activeSubj) return;

    const newTask: Task = {
      id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      name: taskName,
      pages: taskPages,
      completed: false,
      category,
    };

    onUpdateSubjects(
      subjects.map((s) => {
        if (s.id === selectedSubjId) {
          return {
            ...s,
            tasks: [...(s.tasks || []), newTask]
          };
        }
        return s;
      })
    );

    setTaskName('');
    setTaskPages(10);
    setAddingTaskCategory(null);
  };

  // Paste a copied task into a specific category column
  const handlePasteTask = (category: 'teoria' | 'esercizi' | 'altro') => {
    if (!copiedTask || !selectedSubjId || !activeSubj) return;

    const pastedTask: Task = {
      id: `task-paste-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      name: copiedTask.name,
      pages: copiedTask.pages,
      completed: false,
      category,
    };

    onUpdateSubjects(
      subjects.map((s) => {
        if (s.id === selectedSubjId) {
          return {
            ...s,
            tasks: [...(s.tasks || []), pastedTask]
          };
        }
        return s;
      })
    );
  };

  // Toggle Task Checklist
  const handleToggleTask = (taskId: string) => {
    if (!selectedSubjId) return;
    onUpdateSubjects(
      subjects.map((s) => {
        if (s.id === selectedSubjId) {
          const updatedTasks = s.tasks.map((t) =>
            t.id === taskId ? { ...t, completed: !t.completed } : t
          );
          const allCompleted = updatedTasks.length > 0 && updatedTasks.every((t) => t.completed);
          return {
            ...s,
            tasks: updatedTasks,
            completed: allCompleted
          };
        }
        return s;
      })
    );
  };

  // Delete Task Row
  const handleDeleteTask = (taskId: string) => {
    if (!selectedSubjId) return;
    onUpdateSubjects(
      subjects.map((s) => {
        if (s.id === selectedSubjId) {
          const updatedTasks = s.tasks.filter((t) => t.id !== taskId);
          const allCompleted = updatedTasks.length > 0 && updatedTasks.every((t) => t.completed);
          return {
            ...s,
            tasks: updatedTasks,
            completed: allCompleted
          };
        }
        return s;
      })
    );
  };

  // Render a single task row with copy button
  const renderTaskRow = (t: Task) => (
    <div key={t.id} className={`column-task-row ${t.completed ? 'completed' : ''}`}>
      <label className="checkbox-container-sm">
        <input type="checkbox" checked={t.completed} onChange={() => handleToggleTask(t.id)} />
        <span className="checkmark-sm" style={{ '--accent-color': activeSubj!.color } as React.CSSProperties}></span>
      </label>
      <div className="task-row-details">
        <span className="task-row-title-text">{t.name}</span>
        <span className="task-row-pages-text">{t.pages} pag</span>
      </div>
      <div className="task-row-actions">
        <button
          className="btn-copy-task"
          onClick={() => setCopiedTask({ name: t.name, pages: t.pages, category: t.category })}
          title="Copia task"
          type="button"
        >
          📋
        </button>
        <button className="btn-remove-task" onClick={() => handleDeleteTask(t.id)}>×</button>
      </div>
    </div>
  );

  // Render column add/paste area
  const renderColumnFooter = (category: 'teoria' | 'esercizi' | 'altro') => (
    <>
      {addingTaskCategory === category ? (
        <form onSubmit={(e) => handleAddTask(e, category)} className="column-add-task-form glass-input-panel">
          <input
            type="text"
            placeholder={category === 'teoria' ? 'Es. Capitolo 1' : category === 'esercizi' ? 'Es. Esercitazione code' : 'Es. Ripasso finale'}
            value={taskName}
            onChange={(e) => setTaskName(e.target.value)}
            className="form-control"
            required
            autoFocus
          />
          <div className="inline-add-row">
            <input
              type="number"
              min="1"
              placeholder="Pagine"
              value={taskPages}
              onChange={(e) => setTaskPages(parseInt(e.target.value) || 1)}
              className="form-control text-center"
              required
            />
            <div className="inline-add-buttons">
              <button type="submit" className="btn btn-success btn-xs">✓</button>
              <button type="button" className="btn btn-secondary btn-xs" onClick={() => setAddingTaskCategory(null)}>×</button>
            </div>
          </div>
        </form>
      ) : (
        <div className="column-footer-actions">
          <button className="btn-column-add-trigger" onClick={() => { setAddingTaskCategory(category); setTaskName(''); setTaskPages(15); }}>
            + Aggiungi task
          </button>
          {copiedTask && (
            <button
              className="btn-column-paste-trigger"
              onClick={() => handlePasteTask(category)}
              title={`Incolla "${copiedTask.name}"`}
              type="button"
            >
              📋 Incolla
            </button>
          )}
        </div>
      )}
    </>
  );

  // View 1: Main List Grid (Drawing 1)
  if (!selectedSubjId || !activeSubj) {
    return (
      <div className="subjects-manager-container">
        <div className="manager-header">
          <div className="manager-title-group">
            <BookIcon className="panel-icon text-orange" size={24} />
            <h2>📚 Le tue materie</h2>
            <p className="subtitle">Gestisci e organizza le tue materie d'esame in categorie dedicate.</p>
          </div>
        </div>

        <div className="subjects-drawing-grid">
          {subjects.map((subj) => {
            const completedCount = subj.tasks.filter(t => t.completed).length;
            const totalCount = subj.tasks.length;
            const presetColor = PRESET_COLORS.find(c => c.value === subj.color);
            const colorClass = presetColor ? presetColor.class : 'color-gold';

            return (
              <div
                key={subj.id}
                onClick={() => setSelectedSubjId(subj.id)}
                className={`subject-grid-card glass-container ${colorClass} ${subj.completed ? 'completed' : ''}`}
                style={{ '--accent-color': subj.color } as React.CSSProperties}
              >
                <div className="card-emoji-logo" style={{ color: subj.color }}>
                  <CybersecurityLogo logo={subj.logo || 'shield'} size={42} />
                </div>
                <h3 className="card-subj-title">{subj.name}</h3>
                {totalCount > 0 ? (
                  <span className="card-subj-stats">
                    {completedCount}/{totalCount} Compiti completati
                  </span>
                ) : (
                  <span className="card-subj-stats empty-stats">Crea compiti e capitoli</span>
                )}
                {subj.completed && <span className="card-completed-badge">✓ Completato</span>}
              </div>
            );
          })}

          {/* Dotted border AGGIUNGI + Card (Drawing 1) */}
          <div
            onClick={handleCreateSubject}
            className="subject-grid-card add-subj-grid-card-btn"
            title="Crea una nuova materia"
          >
            <div className="add-card-plus-icon">+</div>
            <h3 className="add-card-title">AGGIUNGI</h3>
          </div>
        </div>
      </div>
    );
  }

  // View 2: Single Subject Workspace (Drawing 2)
  const theoryTasks = activeSubj.tasks.filter(t => t.category === 'teoria');
  const exerciseTasks = activeSubj.tasks.filter(t => t.category === 'esercizi');
  const otherTasks = activeSubj.tasks.filter(t => t.category === 'altro');

  return (
    <div className="subject-workspace-container animate-fade-in">
      {/* Workspace Header */}
      <div className="workspace-header">
        <button className="btn btn-secondary btn-sm btn-back-to-grid" onClick={() => { setSelectedSubjId(null); setCopiedTask(null); }}>
          ⬅ Torna alle materie
        </button>
        <div className="workspace-title-area">
          <span className="workspace-logo-display">
            <CybersecurityLogo logo={activeSubj.logo} size={32} color={activeSubj.color} />
          </span>
          <h2 className="workspace-title">{activeSubj.name}</h2>
        </div>
        {copiedTask && (
          <div className="clipboard-indicator">
            📋 <span>Copiato: <strong>{copiedTask.name}</strong></span>
            <button className="btn-clear-clipboard" onClick={() => setCopiedTask(null)} title="Svuota clipboard">✕</button>
          </div>
        )}
      </div>

      {/* Main Workspace split */}
      <div className="workspace-grid-layout">
        
        {/* Left columns (Teoria, Esercizi, Altro) */}
        <div className="workspace-columns-area">
          
          {/* Column 1: Teoria */}
          <div className="workspace-column glass-container">
            <div className="column-header-title">
              <span className="column-emoji">📚</span>
              <h3>TEORIA</h3>
            </div>
            <div className="column-tasks-list">
              {theoryTasks.length === 0 ? (
                <p className="column-empty-hint">Nessun capitolo registrato</p>
              ) : (
                theoryTasks.map(renderTaskRow)
              )}
            </div>
            {renderColumnFooter('teoria')}
          </div>

          {/* Column 2: Esercizi */}
          <div className="workspace-column glass-container">
            <div className="column-header-title">
              <span className="column-emoji">📝</span>
              <h3>ESERCIZI</h3>
            </div>
            <div className="column-tasks-list">
              {exerciseTasks.length === 0 ? (
                <p className="column-empty-hint">Nessun esercizio registrato</p>
              ) : (
                exerciseTasks.map(renderTaskRow)
              )}
            </div>
            {renderColumnFooter('esercizi')}
          </div>

          {/* Column 3: Altro */}
          <div className="workspace-column glass-container">
            <div className="column-header-title">
              <span className="column-emoji">⚙️</span>
              <h3>ALTRO</h3>
            </div>
            <div className="column-tasks-list">
              {otherTasks.length === 0 ? (
                <p className="column-empty-hint">Nessun altro task</p>
              ) : (
                otherTasks.map(renderTaskRow)
              )}
            </div>
            {renderColumnFooter('altro')}
          </div>

        </div>

        {/* Right side: INFO Column/Panel (Drawing 2) */}
        <div className="workspace-info-panel glass-container">
          <div className="panel-title-area">
            <h4>INFO MATERIA</h4>
          </div>

          {/* Edit Name */}
          <div className="info-field">
            <label>Nome Materia</label>
            <input
              type="text"
              value={activeSubj.name}
              onChange={(e) => handleUpdateActiveField('name', e.target.value)}
              className="form-control"
              required
            />
          </div>

          {/* Edit Description (DESC) */}
          <div className="info-field">
            <label>Descrizione / Syllabus (DESC)</label>
            <textarea
              value={activeSubj.description || ''}
              onChange={(e) => handleUpdateActiveField('description', e.target.value)}
              placeholder="Aggiungi note sull'esame, scadenze o syllabus della materia..."
              className="form-control textarea-desc"
              rows={4}
            />
          </div>

          {/* Edit Logo Emoji (LOGO picker) */}
          <div className="info-field">
            <label>Logo Rappresentativo (LOGO)</label>
            <div className="logo-emoji-picker-grid">
              {CYBER_LOGOS.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  className={`btn-emoji-selector ${activeSubj.logo === item.key ? 'active' : ''}`}
                  onClick={() => handleUpdateActiveField('logo', item.key)}
                  title={item.name}
                >
                  <CybersecurityLogo logo={item.key} size={18} />
                </button>
              ))}
            </div>
          </div>

          {/* Edit Color theme (COLORE presets) */}
          <div className="info-field">
            <label>Colore Tema (COLORE)</label>
            <div className="color-selectors color-manager-selectors">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  className={`color-dot ${c.class} ${activeSubj.color === c.value ? 'active' : ''}`}
                  onClick={() => handleUpdateActiveField('color', c.value)}
                  title={c.name}
                />
              ))}
            </div>
          </div>

          {/* Danger delete area */}
          <div className="info-danger-area">
            <button className="btn btn-secondary btn-block btn-delete-subj-workspace" onClick={() => handleDeleteSubject(activeSubj.id)}>
              <TrashIcon size={14} />
              <span>Elimina Intera Materia</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
