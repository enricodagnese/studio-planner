import React, { useState } from 'react';
import type { Subject, Task } from '../types/planner';
import { PlusIcon, TrashIcon, BookIcon } from './Icons';

interface SubjectsManagerProps {
  subjects: Subject[];
  onUpdateSubjects: (updatedSubjects: Subject[]) => void;
}

const PRESET_COLORS = [
  { name: 'Gold', value: '#d97706', class: 'color-gold' },
  { name: 'Blue', value: '#2563eb', class: 'color-blue' },
  { name: 'Emerald', value: '#059669', class: 'color-emerald' },
  { name: 'Purple', value: '#7c3aed', class: 'color-purple' },
  { name: 'Red', value: '#dc2626', class: 'color-red' },
  { name: 'Pink', value: '#db2777', class: 'color-pink' },
];

export const SubjectsManager: React.FC<SubjectsManagerProps> = ({
  subjects,
  onUpdateSubjects,
}) => {
  const [newSubjName, setNewSubjName] = useState('');
  const [newSubjPages, setNewSubjPages] = useState<number>(30);
  const [newSubjColor, setNewSubjColor] = useState(PRESET_COLORS[0].value);
  const [showAddForm, setShowAddForm] = useState(false);

  // Task inline states
  const [addingTaskForSubjId, setAddingTaskForSubjId] = useState<string | null>(null);
  const [taskName, setTaskName] = useState('');
  const [taskPages, setTaskPages] = useState<number>(10);

  // Subject Edit inline states
  const [editingSubjId, setEditingSubjId] = useState<string | null>(null);
  const [editSubjName, setEditSubjName] = useState('');
  const [editSubjPages, setEditSubjPages] = useState<number>(0);
  const [editSubjColor, setEditSubjColor] = useState('');

  // Handle Add Subject
  const handleAddSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubjName.trim()) return;

    const newSubj: Subject = {
      id: `subj-${Date.now()}`,
      name: newSubjName,
      pages: newSubjPages,
      completed: false,
      color: newSubjColor,
      tasks: [],
    };

    onUpdateSubjects([...subjects, newSubj]);
    setNewSubjName('');
    setNewSubjPages(30);
    setShowAddForm(false);
  };

  // Handle Delete Subject
  const handleDeleteSubject = (id: string) => {
    if (window.confirm("Sei sicuro di voler eliminare definitivamente questa materia e tutti i suoi compiti associati?")) {
      onUpdateSubjects(subjects.filter((s) => s.id !== id));
    }
  };

  // Start Edit Subject
  const startEditSubject = (subj: Subject) => {
    setEditingSubjId(subj.id);
    setEditSubjName(subj.name);
    setEditSubjPages(subj.pages);
    setEditSubjColor(subj.color);
  };

  // Save Edit Subject
  const saveEditSubject = (id: string) => {
    if (!editSubjName.trim()) return;
    onUpdateSubjects(
      subjects.map((s) =>
        s.id === id
          ? { ...s, name: editSubjName, pages: editSubjPages, color: editSubjColor }
          : s
      )
    );
    setEditingSubjId(null);
  };

  // Add Task to Subject
  const handleAddTask = (e: React.FormEvent, subjId: string) => {
    e.preventDefault();
    if (!taskName.trim()) return;

    const newTask: Task = {
      id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      name: taskName,
      pages: taskPages,
      completed: false,
    };

    onUpdateSubjects(
      subjects.map((s) => {
        if (s.id === subjId) {
          return {
            ...s,
            tasks: [...(s.tasks || []), newTask],
          };
        }
        return s;
      })
    );

    setTaskName('');
    setTaskPages(10);
    setAddingTaskForSubjId(null);
  };

  // Toggle Task Completion
  const handleToggleTask = (subjId: string, taskId: string) => {
    onUpdateSubjects(
      subjects.map((s) => {
        if (s.id === subjId) {
          const updatedTasks = s.tasks.map((t) =>
            t.id === taskId ? { ...t, completed: !t.completed } : t
          );
          // A subject is completed if all its tasks are completed (and it has at least 1 task)
          const allCompleted = updatedTasks.length > 0 && updatedTasks.every((t) => t.completed);
          return {
            ...s,
            tasks: updatedTasks,
            completed: allCompleted,
          };
        }
        return s;
      })
    );
  };

  // Delete Task
  const handleDeleteTask = (subjId: string, taskId: string) => {
    onUpdateSubjects(
      subjects.map((s) => {
        if (s.id === subjId) {
          const updatedTasks = s.tasks.filter((t) => t.id !== taskId);
          const allCompleted = updatedTasks.length > 0 && updatedTasks.every((t) => t.completed);
          return {
            ...s,
            tasks: updatedTasks,
            completed: allCompleted,
          };
        }
        return s;
      })
    );
  };

  return (
    <div className="subjects-manager-container">
      <div className="manager-header">
        <div className="manager-title-group">
          <BookIcon className="panel-icon text-orange" size={24} />
          <h2>📚 Le tue materie & task</h2>
          <p className="subtitle">Gestisci gli argomenti d'esame e pianifica in dettaglio i singoli capitoli o compiti da svolgere.</p>
        </div>
        <button
          className="btn btn-primary btn-add-subj-main"
          onClick={() => setShowAddForm(!showAddForm)}
        >
          <PlusIcon size={16} />
          <span>Aggiungi Materia</span>
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={handleAddSubject} className="add-subject-modal-form glass-container animate-fade-in">
          <h3>Nuova Materia / Corso</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>Nome Materia o Argomento Generale</label>
              <input
                type="text"
                value={newSubjName}
                onChange={(e) => setNewSubjName(e.target.value)}
                placeholder="Es. Sistemi Operativi, Algoritmi, ecc."
                className="form-control"
                required
                autoFocus
              />
            </div>
            <div className="form-group">
              <label>Budget Pagine Complessivo</label>
              <input
                type="number"
                min="0"
                value={newSubjPages}
                onChange={(e) => setNewSubjPages(parseInt(e.target.value) || 0)}
                className="form-control"
              />
            </div>
            <div className="form-group">
              <label>Colore Rappresentativo</label>
              <div className="color-selectors color-manager-selectors">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    className={`color-dot ${c.class} ${newSubjColor === c.value ? 'active' : ''}`}
                    onClick={() => setNewSubjColor(c.value)}
                    title={c.name}
                  />
                ))}
              </div>
            </div>
          </div>
          <div className="form-buttons">
            <button type="submit" className="btn btn-success">Salva Materia</button>
            <button type="button" className="btn btn-secondary" onClick={() => setShowAddForm(false)}>
              Annulla
            </button>
          </div>
        </form>
      )}

      {subjects.length === 0 ? (
        <div className="manager-empty-state glass-container">
          <BookIcon size={48} className="empty-icon text-muted" />
          <h3>Nessuna materia registrata</h3>
          <p>Crea la tua prima materia d'esame cliccando sul pulsante "+ Aggiungi Materia" in alto a destra.</p>
          <button className="btn btn-primary" onClick={() => setShowAddForm(true)}>
            Registra una materia ora
          </button>
        </div>
      ) : (
        <div className="subjects-manager-grid">
          {subjects.map((subj) => {
            const tasksList = subj.tasks || [];
            const completedCount = tasksList.filter((t) => t.completed).length;
            const totalCount = tasksList.length;
            const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
            
            // Calculate total pages scheduled in this subject
            const totalPages = tasksList.reduce((acc, curr) => acc + curr.pages, 0);

            const isEditing = editingSubjId === subj.id;
            const presetColor = PRESET_COLORS.find(c => c.value === subj.color);
            const colorClass = presetColor ? presetColor.class : 'color-gold';

            return (
              <div
                key={subj.id}
                className={`subject-manager-card glass-container ${colorClass}`}
                style={{ '--accent-color': subj.color } as React.CSSProperties}
              >
                {/* Card Header (Subject Title & Page Budget) */}
                <div className="card-subj-header">
                  {isEditing ? (
                    <div className="edit-subj-inputs">
                      <input
                        type="text"
                        value={editSubjName}
                        onChange={(e) => setEditSubjName(e.target.value)}
                        className="form-control edit-subj-name-input"
                        placeholder="Nome Materia"
                        required
                      />
                      <input
                        type="number"
                        value={editSubjPages}
                        onChange={(e) => setEditSubjPages(parseInt(e.target.value) || 0)}
                        className="form-control edit-subj-pages-input"
                        placeholder="Pag"
                      />
                      <div className="edit-colors-list">
                        {PRESET_COLORS.map((c) => (
                          <button
                            key={c.value}
                            type="button"
                            className={`color-dot-sm ${c.class} ${editSubjColor === c.value ? 'active' : ''}`}
                            onClick={() => setEditSubjColor(c.value)}
                          />
                        ))}
                      </div>
                      <div className="edit-subj-buttons">
                        <button className="btn btn-success btn-xs" onClick={() => saveEditSubject(subj.id)}>Salva</button>
                        <button className="btn btn-secondary btn-xs" onClick={() => setEditingSubjId(null)}>Annulla</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="subj-title-area">
                        <div className="subj-color-badge" style={{ backgroundColor: subj.color }} />
                        <h3 className="subj-name" title={subj.name}>{subj.name}</h3>
                      </div>
                      <div className="subj-stats-badge">
                        <span className="pages-stat" title="Budget Pagine / Pagine Programmate">
                          {totalPages > 0 ? `${totalPages} pag prog` : `${subj.pages} pag target`}
                        </span>
                        <div className="card-header-actions">
                          <button
                            className="btn-card-action btn-edit-subj"
                            onClick={() => startEditSubject(subj)}
                            title="Modifica materia"
                          >
                            ✏️
                          </button>
                          <button
                            className="btn-card-action btn-delete-subj"
                            onClick={() => handleDeleteSubject(subj.id)}
                            title="Elimina materia"
                          >
                            <TrashIcon size={13} />
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Progress bar inside card */}
                {totalCount > 0 && (
                  <div className="subj-progress-section">
                    <div className="progress-labels">
                      <span>Progresso task</span>
                      <span className="percent-text">{progress}% ({completedCount}/{totalCount})</span>
                    </div>
                    <div className="subj-progress-bar-track">
                      <div
                        className="subj-progress-bar-fill"
                        style={{ width: `${progress}%`, backgroundColor: subj.color }}
                      />
                    </div>
                  </div>
                )}

                {/* Tasks List within Subject */}
                <div className="card-tasks-section">
                  <h4>Capitoli e Task da studiare</h4>
                  
                  {tasksList.length === 0 ? (
                    <p className="no-tasks-hint">Nessun sotto-task creato. Aggiungine uno sotto per tracciare i capitoli dell'esame!</p>
                  ) : (
                    <div className="subj-tasks-list">
                      {tasksList.map((task) => (
                        <div
                          key={task.id}
                          className={`subj-task-row ${task.completed ? 'task-row-completed' : ''}`}
                        >
                          <label className="checkbox-container-sm">
                            <input
                              type="checkbox"
                              checked={task.completed}
                              onChange={() => handleToggleTask(subj.id, task.id)}
                            />
                            <span className="checkmark-sm" style={{ '--accent-color': subj.color } as React.CSSProperties}></span>
                          </label>
                          <div className="task-row-text">
                            <span className="task-row-name" title={task.name}>{task.name}</span>
                            <span className="task-row-pages">{task.pages} pagine</span>
                          </div>
                          <button
                            className="btn-delete-task-row"
                            onClick={() => handleDeleteTask(subj.id, task.id)}
                            title="Elimina task"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add Quick Task Form inside Subject */}
                  {addingTaskForSubjId === subj.id ? (
                    <form
                      onSubmit={(e) => handleAddTask(e, subj.id)}
                      className="add-task-inline-form glass-input-panel animate-fade-in"
                    >
                      <div className="inline-form-inputs">
                        <input
                          type="text"
                          value={taskName}
                          onChange={(e) => setTaskName(e.target.value)}
                          placeholder="Es. Leggere Cap. 1"
                          className="form-control input-task-name"
                          required
                          autoFocus
                        />
                        <input
                          type="number"
                          min="1"
                          value={taskPages}
                          onChange={(e) => setTaskPages(parseInt(e.target.value) || 1)}
                          className="form-control input-task-pages"
                          title="Numero pagine"
                          placeholder="Pagine"
                          required
                        />
                      </div>
                      <div className="inline-form-buttons">
                        <button type="submit" className="btn btn-success btn-xs">Salva</button>
                        <button
                          type="button"
                          className="btn btn-secondary btn-xs"
                          onClick={() => setAddingTaskForSubjId(null)}
                        >
                          Annulla
                        </button>
                      </div>
                    </form>
                  ) : (
                    <button
                      className="btn-add-task-row-trigger"
                      onClick={() => {
                        setAddingTaskForSubjId(subj.id);
                        setTaskName('');
                        setTaskPages(15);
                      }}
                    >
                      <PlusIcon size={12} />
                      <span>Aggiungi Capitolo / Task...</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
