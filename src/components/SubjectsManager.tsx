import React, { useState } from 'react';
import type { Subject, Task, TaskQuantityType } from '../types/planner';
import { TrashIcon, BookIcon, PenIcon, SettingsIcon, CopyIcon, ChevronLeftIcon } from './Icons';
import { CybersecurityLogo } from './CybersecurityLogo';

interface SubjectsManagerProps {
  subjects: Subject[];
  onUpdateSubjects: (updatedSubjects: Subject[]) => void;
  onResetAll?: () => void;
}

const PRESET_COLORS = [
  { name: 'Gold',    value: '#fbbf24', class: 'color-gold'    },
  { name: 'Blue',    value: '#60a5fa', class: 'color-blue'    },
  { name: 'Emerald', value: '#34d399', class: 'color-emerald' },
  { name: 'Purple',  value: '#a78bfa', class: 'color-purple'  },
  { name: 'Red',     value: '#f87171', class: 'color-red'     },
  { name: 'Pink',    value: '#f472b6', class: 'color-pink'    },
];

const CYBER_LOGOS = [
  { key: 'shield',         name: 'Firewall' },
  { key: 'lock',           name: 'Crittografia' },
  { key: 'key',            name: 'Autenticazione' },
  { key: 'terminal',       name: 'Terminale' },
  { key: 'globe',          name: 'Sicurezza Rete' },
  { key: 'radar',          name: 'Scanner Minacce' },
  { key: 'bug',            name: 'Analisi Malware' },
  { key: 'database',       name: 'Database Sicuro' },
  { key: 'cpu',            name: 'Sicurezza Chip' },
  { key: 'server',         name: 'Mainframe' },
  { key: 'wifi',           name: 'Sicurezza WiFi' },
  { key: 'cloud',          name: 'Cloud Security' },
  { key: 'eye',            name: 'Monitoring/SIEM' },
  { key: 'zap',            name: 'Exploit/Attacchi' },
  { key: 'layers',         name: 'Stack Tech' },
  { key: 'link',           name: 'Networking' },
  { key: 'alert-triangle', name: 'Incident Response' },
  { key: 'hard-drive',     name: 'Storage Security' },
  { key: 'fingerprint',    name: 'Biometria' },
  { key: 'code',           name: 'Secure Coding' },
  { key: 'activity',       name: 'Network Monitor' },
  { key: 'user-check',     name: 'User Auth' },
];

const getQtyLabel = (pages: number, quantityType?: TaskQuantityType): string => {
  switch (quantityType) {
    case 'ore-video': return `${pages}h video`;
    case 'esercizi':  return `${pages} esercizi`;
    case 'quiz':      return `${pages} quiz`;
    default:          return `${pages} pag`;
  }
};

const getQtyInputLabel = (quantityType: TaskQuantityType): string => {
  switch (quantityType) {
    case 'ore-video': return 'Ore';
    case 'esercizi':  return 'N. Esercizi';
    case 'quiz':      return 'N. Quiz';
    default:          return 'Pagine';
  }
};

export const SubjectsManager: React.FC<SubjectsManagerProps> = ({ subjects, onUpdateSubjects, onResetAll }) => {
  const [selectedSubjId, setSelectedSubjId] = useState<string | null>(null);
  const [addingTaskCategory, setAddingTaskCategory] = useState<'teoria' | 'esercizi' | 'altro' | null>(null);
  const [taskName, setTaskName] = useState('');
  const [taskPages, setTaskPages] = useState<number>(10);
  const [taskQuantityType, setTaskQuantityType] = useState<TaskQuantityType>('pagine');
  const [copiedTask, setCopiedTask] = useState<{ name: string; pages: number; category: 'teoria' | 'esercizi' | 'altro'; quantityType: TaskQuantityType } | null>(null);

  // States for inline task editing
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editPages, setEditPages] = useState<number>(10);
  const [editQuantityType, setEditQuantityType] = useState<TaskQuantityType>('pagine');

  const [showSettings, setShowSettings] = useState(false);

  const activeSubj = subjects.find(s => s.id === selectedSubjId);

  const handleCreateSubject = () => {
    const newSubj: Subject = {
      id: `subj-${Date.now()}`,
      name: 'Nuova Materia', pages: 30, completed: false,
      color: PRESET_COLORS[Math.floor(Math.random() * PRESET_COLORS.length)].value,
      logo: 'shield', description: '', tasks: []
    };
    onUpdateSubjects([...subjects, newSubj]);
    setSelectedSubjId(newSubj.id);
  };

  const handleDeleteSubject = (id: string) => {
    if (window.confirm('Sei sicuro di voler eliminare definitivamente questa materia e tutti i suoi compiti?')) {
      onUpdateSubjects(subjects.filter(s => s.id !== id));
      setSelectedSubjId(null);
    }
  };

  const handleUpdateActiveField = (field: keyof Subject, value: any) => {
    if (!selectedSubjId) return;
    onUpdateSubjects(subjects.map(s => s.id === selectedSubjId ? { ...s, [field]: value } : s));
  };

  const openAddTask = (category: 'teoria' | 'esercizi' | 'altro') => {
    setAddingTaskCategory(category);
    setTaskName('');
    setTaskPages(15);
    // Default quantity type per category
    if (category === 'teoria') setTaskQuantityType('pagine');
    else if (category === 'esercizi') setTaskQuantityType('esercizi');
    else setTaskQuantityType('pagine');
  };

  const handleAddTask = (e: React.FormEvent, category: 'teoria' | 'esercizi' | 'altro') => {
    e.preventDefault();
    if (!taskName.trim() || !selectedSubjId || !activeSubj) return;
    const newTask: Task = {
      id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      name: taskName, pages: taskPages, completed: false,
      category, quantityType: taskQuantityType,
    };
    onUpdateSubjects(subjects.map(s => s.id === selectedSubjId ? { ...s, tasks: [...(s.tasks || []), newTask] } : s));
    setTaskName('');
    setTaskPages(10);
    setAddingTaskCategory(null);
  };

  const handlePasteTask = (category: 'teoria' | 'esercizi' | 'altro') => {
    if (!copiedTask || !selectedSubjId || !activeSubj) return;
    const pastedTask: Task = {
      id: `task-paste-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      name: copiedTask.name, pages: copiedTask.pages, completed: false,
      category, quantityType: copiedTask.quantityType,
    };
    onUpdateSubjects(subjects.map(s => s.id === selectedSubjId ? { ...s, tasks: [...(s.tasks || []), pastedTask] } : s));
  };

  const handleToggleTask = (taskId: string) => {
    if (!selectedSubjId) return;
    onUpdateSubjects(subjects.map(s => {
      if (s.id === selectedSubjId) {
        const updatedTasks = s.tasks.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t);
        return { ...s, tasks: updatedTasks, completed: updatedTasks.length > 0 && updatedTasks.every(t => t.completed) };
      }
      return s;
    }));
  };

  const handleDeleteTask = (taskId: string) => {
    if (!selectedSubjId) return;
    onUpdateSubjects(subjects.map(s => {
      if (s.id === selectedSubjId) {
        const updatedTasks = s.tasks.filter(t => t.id !== taskId);
        return { ...s, tasks: updatedTasks, completed: updatedTasks.length > 0 && updatedTasks.every(t => t.completed) };
      }
      return s;
    }));
  };

  const startEditing = (task: Task) => {
    setEditingTaskId(task.id);
    setEditName(task.name);
    setEditPages(task.pages);
    setEditQuantityType(task.quantityType || 'pagine');
  };

  const handleSaveEdit = (taskId: string) => {
    if (!selectedSubjId || !editName.trim()) return;
    onUpdateSubjects(subjects.map(s => {
      if (s.id === selectedSubjId) {
        const updatedTasks = s.tasks.map(t => t.id === taskId ? { ...t, name: editName.trim(), pages: editPages, quantityType: editQuantityType } : t);
        return { ...s, tasks: updatedTasks };
      }
      return s;
    }));
    setEditingTaskId(null);
  };

  const renderTaskRow = (t: Task) => {
    const isEditing = editingTaskId === t.id;
    return (
      <div key={t.id} className={`column-task-row ${t.completed ? 'completed' : ''} ${isEditing ? 'editing-row' : ''}`}>
        {isEditing ? (
          <div className="task-row-edit-form" style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '6px', padding: '4px 0' }}>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="form-control edit-task-name-input"
              style={{ fontSize: '11px', padding: '4px 8px', background: 'rgba(10, 10, 12, 0.4)', color: '#fff', border: '1px solid var(--border-color)', borderRadius: '4px' }}
              required
            />
            <div className="edit-task-inputs-row" style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
              <input
                type="number"
                min="1"
                value={editPages}
                onChange={(e) => setEditPages(parseInt(e.target.value) || 1)}
                className="form-control edit-task-pages-input text-center"
                style={{ fontSize: '11px', padding: '3px 4px', width: '45px', background: 'rgba(10, 10, 12, 0.4)', color: '#fff', border: '1px solid var(--border-color)', borderRadius: '4px' }}
              />
              <select
                value={editQuantityType}
                onChange={(e) => setEditQuantityType(e.target.value as TaskQuantityType)}
                className="form-control edit-task-select"
                style={{ fontSize: '10px', padding: '3px', background: 'var(--bg-tertiary)', color: '#fff', border: '1px solid var(--border-color)', borderRadius: '4px', flex: '1', cursor: 'pointer' }}
              >
                <option value="pagine">pag</option>
                <option value="ore-video">video</option>
                <option value="esercizi">es.</option>
                <option value="quiz">quiz</option>
              </select>
              <button className="btn btn-primary btn-xs" type="button" onClick={() => handleSaveEdit(t.id)} style={{ padding: '4px 8px', fontSize: '9px' }}>✓</button>
              <button className="btn btn-secondary btn-xs" type="button" onClick={() => setEditingTaskId(null)} style={{ padding: '4px 8px', fontSize: '9px' }}>×</button>
            </div>
          </div>
        ) : (
          <>
            <label className="checkbox-container-sm">
              <input type="checkbox" checked={t.completed} onChange={() => handleToggleTask(t.id)} />
              <span className="checkmark-sm" style={{ '--accent-color': activeSubj!.color } as React.CSSProperties}></span>
            </label>
            <div className="task-row-details" onClick={() => startEditing(t)} style={{ cursor: 'pointer', flex: 1, minWidth: 0 }} title="Clicca per modificare dettagli">
              <span className="task-row-title-text" style={{ display: 'block', fontSize: '12px', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.name}</span>
              <span className="task-row-pages-text" style={{ fontSize: '10px', color: '#71717a' }}>{getQtyLabel(t.pages, t.quantityType)}</span>
            </div>
            <div className="task-row-actions">
              <button
                className="btn-copy-task"
                onClick={() => setCopiedTask({ name: t.name, pages: t.pages, category: t.category, quantityType: t.quantityType || 'pagine' })}
                title="Copia task"
                type="button"
              >
                <CopyIcon size={11} />
              </button>
              <button
                className="btn-edit-task-trigger"
                onClick={() => startEditing(t)}
                title="Modifica capitolo"
                type="button"
                style={{ background: 'transparent', border: 'none', color: '#71717a', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px', fontSize: '11px', opacity: 0.6 }}
              >
                ✏️
              </button>
              <button className="btn-remove-task" onClick={() => handleDeleteTask(t.id)}>×</button>
            </div>
          </>
        )}
      </div>
    );
  };

  const renderQtyTypeToggle = (category: 'teoria' | 'esercizi' | 'altro') => {
    if (category === 'teoria') {
      return (
        <div className="qty-type-toggle">
          <button type="button" className={`qty-type-btn ${taskQuantityType === 'pagine' ? 'active' : ''}`} onClick={() => setTaskQuantityType('pagine')}>Pagine</button>
          <button type="button" className={`qty-type-btn ${taskQuantityType === 'ore-video' ? 'active' : ''}`} onClick={() => setTaskQuantityType('ore-video')}>Ore Video</button>
        </div>
      );
    }
    if (category === 'esercizi') {
      return (
        <div className="qty-type-toggle">
          <button type="button" className={`qty-type-btn ${taskQuantityType === 'esercizi' ? 'active' : ''}`} onClick={() => setTaskQuantityType('esercizi')}>Esercizi</button>
          <button type="button" className={`qty-type-btn ${taskQuantityType === 'quiz' ? 'active' : ''}`} onClick={() => setTaskQuantityType('quiz')}>Quiz</button>
        </div>
      );
    }
    return null;
  };

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
          {renderQtyTypeToggle(category)}
          <div className="inline-add-row">
            <label className="qty-input-label">{getQtyInputLabel(taskQuantityType)}</label>
            <input
              type="number" min="1" placeholder="0"
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
          <button className="btn-column-add-trigger" onClick={() => openAddTask(category)}>
            + Aggiungi task
          </button>
          {copiedTask && (
            <button
              className="btn-column-paste-trigger"
              onClick={() => handlePasteTask(category)}
              title={`Incolla "${copiedTask.name}"`}
              type="button"
            >
              <CopyIcon size={11} />
              Incolla
            </button>
          )}
        </div>
      )}
    </>
  );

  // View 1: Grid
  if (!selectedSubjId || !activeSubj) {
    return (
      <div className="subjects-manager-container">
        <div className="manager-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <div className="manager-title-group">
            <BookIcon className="panel-icon text-orange" size={24} />
            <h2>Le tue materie</h2>
            <p className="subtitle">Gestisci e organizza le tue materie d'esame in categorie dedicate.</p>
          </div>
          {onResetAll && (
            <div className="settings-container" style={{ position: 'relative' }}>
              <button 
                className="btn-settings-toggle"
                onClick={() => setShowSettings(!showSettings)}
                title="Impostazioni applicazione"
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#e4e4e7',
                  width: '38px',
                  height: '38px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'background 0.2s, transform 0.2s',
                }}
                onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'; }}
                onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'; }}
              >
                <SettingsIcon size={20} style={{ transform: showSettings ? 'rotate(45deg)' : 'none', transition: 'transform 0.3s ease' }} />
              </button>

              {showSettings && (
                <div className="settings-dropdown glass-container" style={{
                  position: 'absolute',
                  right: 0,
                  top: '46px',
                  width: '260px',
                  background: 'rgba(20, 20, 26, 0.98)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '10px',
                  padding: '16px',
                  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
                  zIndex: 9999,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}>
                  <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: '#fff', letterSpacing: '0.03em', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '8px' }}>IMPOSTAZIONI</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <p style={{ margin: 0, fontSize: '11px', color: '#a1a1aa', lineHeight: 1.4 }}>
                      Da qui puoi resettare l'intero piano di studi alle condizioni di fabbrica iniziale.
                    </p>
                    <button 
                      onClick={() => { setShowSettings(false); onResetAll(); }}
                      style={{
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.2)',
                        color: '#f87171',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        fontSize: '11.5px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'background 0.2s, color 0.2s',
                        width: '100%',
                        textAlign: 'center'
                      }}
                      onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.25)'; e.currentTarget.style.color = '#fff'; }}
                      onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'; e.currentTarget.style.color = '#f87171'; }}
                    >
                      Ripristina dati iniziali
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
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
                  <CybersecurityLogo logo={subj.logo || 'shield'} size={44} />
                </div>
                <h3 className="card-subj-title">{subj.name}</h3>
                {totalCount > 0 ? (
                  <span className="card-subj-stats">{completedCount}/{totalCount} Compiti completati</span>
                ) : (
                  <span className="card-subj-stats empty-stats">Nessun compito ancora</span>
                )}
                {subj.completed && <span className="card-completed-badge">✓ Completato</span>}
              </div>
            );
          })}
          <div onClick={handleCreateSubject} className="subject-grid-card add-subj-grid-card-btn" title="Crea una nuova materia">
            <div className="add-card-plus-icon">+</div>
            <h3 className="add-card-title">AGGIUNGI</h3>
          </div>
        </div>
      </div>
    );
  }

  // View 2: Single Subject Workspace
  const theoryTasks   = activeSubj.tasks.filter(t => t.category === 'teoria');
  const exerciseTasks = activeSubj.tasks.filter(t => t.category === 'esercizi');
  const otherTasks    = activeSubj.tasks.filter(t => t.category === 'altro');

  return (
    <div className="subject-workspace-container animate-fade-in">
      <div className="workspace-header">
        <button
          className="btn btn-secondary btn-sm btn-back-to-grid"
          onClick={() => { setSelectedSubjId(null); setCopiedTask(null); }}
        >
          <ChevronLeftIcon size={15} />
          Torna alle materie
        </button>
        <div className="workspace-title-area">
          <span className="workspace-logo-display">
            <CybersecurityLogo logo={activeSubj.logo} size={32} color={activeSubj.color} />
          </span>
          <h2 className="workspace-title">{activeSubj.name}</h2>
        </div>
        {copiedTask && (
          <div className="clipboard-indicator">
            <CopyIcon size={12} />
            <span>Copiato: <strong>{copiedTask.name}</strong></span>
            <button className="btn-clear-clipboard" onClick={() => setCopiedTask(null)} title="Svuota clipboard">×</button>
          </div>
        )}
      </div>

      <div className="workspace-grid-layout">
        <div className="workspace-columns-area">

          {/* Column 1: Teoria */}
          <div className="workspace-column glass-container">
            <div className="column-header-title">
              <BookIcon size={16} className="column-cat-icon" />
              <h3>TEORIA</h3>
            </div>
            <div className="column-tasks-list">
              {theoryTasks.length === 0
                ? <p className="column-empty-hint">Nessun capitolo registrato</p>
                : theoryTasks.map(renderTaskRow)}
            </div>
            {renderColumnFooter('teoria')}
          </div>

          {/* Column 2: Esercizi */}
          <div className="workspace-column glass-container">
            <div className="column-header-title">
              <PenIcon size={16} className="column-cat-icon" />
              <h3>ESERCIZI</h3>
            </div>
            <div className="column-tasks-list">
              {exerciseTasks.length === 0
                ? <p className="column-empty-hint">Nessun esercizio registrato</p>
                : exerciseTasks.map(renderTaskRow)}
            </div>
            {renderColumnFooter('esercizi')}
          </div>

          {/* Column 3: Altro */}
          <div className="workspace-column glass-container">
            <div className="column-header-title">
              <SettingsIcon size={16} className="column-cat-icon" />
              <h3>ALTRO</h3>
            </div>
            <div className="column-tasks-list">
              {otherTasks.length === 0
                ? <p className="column-empty-hint">Nessun altro task</p>
                : otherTasks.map(renderTaskRow)}
            </div>
            {renderColumnFooter('altro')}
          </div>
        </div>

        {/* Right side: Info Panel */}
        <div className="workspace-info-panel glass-container">
          <div className="panel-title-area"><h4>INFO MATERIA</h4></div>

          <div className="info-field">
            <label>Nome Materia</label>
            <input type="text" value={activeSubj.name} onChange={(e) => handleUpdateActiveField('name', e.target.value)} className="form-control" required />
          </div>

          <div className="info-field">
            <label>Descrizione / Syllabus</label>
            <textarea
              value={activeSubj.description || ''}
              onChange={(e) => handleUpdateActiveField('description', e.target.value)}
              placeholder="Aggiungi note sull'esame, scadenze o syllabus..."
              className="form-control textarea-desc"
              rows={4}
            />
          </div>

          <div className="info-field">
            <label>Logo Rappresentativo</label>
            <div className="logo-emoji-picker-grid">
              {CYBER_LOGOS.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  className={`btn-emoji-selector ${activeSubj.logo === item.key ? 'active' : ''}`}
                  onClick={() => handleUpdateActiveField('logo', item.key)}
                  title={item.name}
                  style={activeSubj.logo === item.key ? { '--btn-active-color': activeSubj.color } as React.CSSProperties : undefined}
                >
                  <CybersecurityLogo logo={item.key} size={17} />
                </button>
              ))}
            </div>
          </div>

          <div className="info-field">
            <label>Colore Tema</label>
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
