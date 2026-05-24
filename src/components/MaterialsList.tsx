import React, { useState } from 'react';
import type { Subject } from '../types/planner';
import { BookIcon } from './Icons';

interface MaterialsListProps {
  subjects: Subject[];
  onAddSubject: (name: string, pages: number, color: string) => void;
  onToggleSubject: (id: string) => void;
  onDeleteSubject: (id: string) => void;
  onUpdateSubjects?: (updatedSubjects: Subject[]) => void;
  onRedirectToSubjects?: () => void;
}

const PRESET_COLORS = [
  { name: 'Gold', value: '#d97706', class: 'color-gold' },
  { name: 'Blue', value: '#2563eb', class: 'color-blue' },
  { name: 'Emerald', value: '#059669', class: 'color-emerald' },
  { name: 'Purple', value: '#7c3aed', class: 'color-purple' },
  { name: 'Red', value: '#dc2626', class: 'color-red' },
  { name: 'Pink', value: '#db2777', class: 'color-pink' },
];

export const MaterialsList: React.FC<MaterialsListProps> = ({
  subjects,
  onToggleSubject,
  onUpdateSubjects,
  onRedirectToSubjects,
}) => {
  // Tree collapse state
  const [expandedSubjIds, setExpandedSubjIds] = useState<Record<string, boolean>>({});

  const toggleExpandSubject = (subjId: string) => {
    setExpandedSubjIds((prev) => ({
      ...prev,
      [subjId]: !prev[subjId],
    }));
  };

  const handleDragStart = (
    e: React.DragEvent,
    type: 'subject' | 'task',
    subjectId: string,
    taskId?: string,
    taskName?: string,
    taskPages?: number
  ) => {
    e.dataTransfer.setData('text/plain', taskId || subjectId);
    e.dataTransfer.effectAllowed = 'copyMove';

    if (type === 'subject') {
      (window as any).reactPlannerDraggedItem = { type: 'subject', id: subjectId };
    } else {
      (window as any).reactPlannerDraggedItem = {
        type: 'task',
        subjectId,
        taskId,
        name: taskName,
        pages: taskPages,
      };
    }

    // Add visual dragging effect
    const element = e.currentTarget as HTMLElement;
    element.classList.add('dragging');
  };

  const handleDragEnd = (e: React.DragEvent) => {
    const element = e.currentTarget as HTMLElement;
    element.classList.remove('dragging');
  };

  const handleToggleTaskLocal = (subjId: string, taskId: string) => {
    if (!onUpdateSubjects) return;
    onUpdateSubjects(
      subjects.map((s) => {
        if (s.id === subjId) {
          const updatedTasks = s.tasks.map((t) =>
            t.id === taskId ? { ...t, completed: !t.completed } : t
          );
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
    <div className="materials-list-panel glass-container">
      <div className="panel-header">
        <div className="title-with-icon">
          <BookIcon className="panel-icon text-gold" />
          <h2>Libreria Materie</h2>
        </div>
        {onRedirectToSubjects && (
          <button 
            className="btn btn-secondary btn-sm"
            onClick={onRedirectToSubjects}
            title="Gestisci le tue materie e compiti"
          >
            ✏️ Gestisci
          </button>
        )}
      </div>

      <div className="subjects-grid">
        {subjects.length === 0 ? (
          <div className="empty-state">
            <p>Nessun argomento registrato.</p>
            <p className="hint">Clicca su "✏️ Gestisci" per aggiungere il tuo primo blocco di studio e i suoi compiti!</p>
          </div>
        ) : (
          subjects.map((sub) => {
            const presetColor = PRESET_COLORS.find(c => c.value === sub.color);
            const colorClass = presetColor ? presetColor.class : 'color-gold';
            const tasksList = sub.tasks || [];
            const hasTasks = tasksList.length > 0;
            const isExpanded = !!expandedSubjIds[sub.id];

            // Sum total pages of tasks, fallback to sub.pages
            const totalPages = hasTasks
              ? tasksList.reduce((sum, t) => sum + t.pages, 0)
              : sub.pages;

            return (
              <div key={sub.id} className="subject-tree-node">
                {/* Subject Header Card (Draggable!) */}
                <div
                  draggable
                  onDragStart={(e) => handleDragStart(e, 'subject', sub.id)}
                  onDragEnd={handleDragEnd}
                  className={`subject-card draggable-card ${colorClass} ${sub.completed ? 'completed' : ''}`}
                  style={{ '--accent-color': sub.color } as React.CSSProperties}
                >
                  {/* Collapsible toggle arrow */}
                  {hasTasks && (
                    <button
                      type="button"
                      className={`btn-tree-toggle ${isExpanded ? 'expanded' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation(); // Avoid checkbox click or dragging trigger
                        toggleExpandSubject(sub.id);
                      }}
                      title={isExpanded ? "Comprimi task" : "Espandi task"}
                    >
                      ▶
                    </button>
                  )}

                  <div className="card-drag-handle" title="Trascina materia intera">
                    <div className="drag-dots">⋮⋮</div>
                  </div>

                  <label className="checkbox-container" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={sub.completed}
                      onChange={() => onToggleSubject(sub.id)}
                    />
                    <span className="checkmark"></span>
                  </label>

                  <div className="card-main-content">
                    <span className="subject-title">{sub.name}</span>
                    <span className="pages-badge">{totalPages} pag</span>
                  </div>
                </div>

                {/* Sub-tasks Tree View (expanded list) */}
                {isExpanded && hasTasks && (
                  <div className="subject-sub-tasks-tree animate-slide-down">
                    {tasksList.map((task) => (
                      <div
                        key={task.id}
                        draggable
                        onDragStart={(e) =>
                          handleDragStart(e, 'task', sub.id, task.id, task.name, task.pages)
                        }
                        onDragEnd={handleDragEnd}
                        className={`tree-task-pill draggable-card ${colorClass} ${
                          task.completed ? 'completed' : ''
                        }`}
                      >
                        <div className="tree-task-drag-handle" title="Trascina questo capitolo">
                          ⋮⋮
                        </div>
                        <label className="checkbox-container-sm" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={task.completed}
                            onChange={() => handleToggleTaskLocal(sub.id, task.id)}
                          />
                          <span className="checkmark-sm" style={{ '--accent-color': sub.color } as React.CSSProperties}></span>
                        </label>
                        <span className="tree-task-title" title={task.name}>
                          {task.name}
                        </span>
                        <span className="tree-task-pages-badge">{task.pages} pag</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
      <div className="drag-instructions">
        <span className="info-icon">💡</span> Espandi le materie per trascinare i singoli capitoli d'esame direttamente sul calendario!
      </div>
    </div>
  );
};
