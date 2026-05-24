import React, { useState } from 'react';
import type { Subject } from '../types/planner';
import { BookIcon, EditIcon, LightbulbIcon, GripVerticalIcon, ChevronRightIcon, ChevronDownIcon } from './Icons';
import { CybersecurityLogo } from './CybersecurityLogo';

interface MaterialsListProps {
  subjects: Subject[];
  onAddSubject: (name: string, pages: number, color: string) => void;
  onToggleSubject: (id: string) => void;
  onDeleteSubject: (id: string) => void;
  onUpdateSubjects?: (updatedSubjects: Subject[]) => void;
  onRedirectToSubjects?: () => void;
}

const PRESET_COLORS = [
  { name: 'Gold',    value: '#fbbf24', class: 'color-gold'    },
  { name: 'Blue',    value: '#60a5fa', class: 'color-blue'    },
  { name: 'Emerald', value: '#34d399', class: 'color-emerald' },
  { name: 'Purple',  value: '#a78bfa', class: 'color-purple'  },
  { name: 'Red',     value: '#f87171', class: 'color-red'     },
  { name: 'Pink',    value: '#f472b6', class: 'color-pink'    },
];

const getQtyLabel = (pages: number, quantityType?: string): string => {
  switch (quantityType) {
    case 'ore-video': return `${pages}h video`;
    case 'esercizi':  return `${pages} es.`;
    case 'quiz':      return `${pages} quiz`;
    default:          return `${pages} pag`;
  }
};

export const MaterialsList: React.FC<MaterialsListProps> = ({
  subjects,
  onToggleSubject,
  onUpdateSubjects,
  onRedirectToSubjects,
}) => {
  const [expandedSubjIds, setExpandedSubjIds] = useState<Record<string, boolean>>({});

  const toggleExpandSubject = (subjId: string) => {
    setExpandedSubjIds((prev) => ({ ...prev, [subjId]: !prev[subjId] }));
  };

  const handleDragStart = (
    e: React.DragEvent,
    type: 'subject' | 'task',
    subjectId: string,
    taskId?: string,
    taskName?: string,
    taskPages?: number,
    taskQuantityType?: string
  ) => {
    e.dataTransfer.setData('text/plain', taskId || subjectId);
    e.dataTransfer.effectAllowed = 'copyMove';

    if (type === 'subject') {
      (window as any).reactPlannerDraggedItem = { type: 'subject', id: subjectId };
    } else {
      (window as any).reactPlannerDraggedItem = {
        type: 'task', subjectId, taskId,
        name: taskName, pages: taskPages, quantityType: taskQuantityType,
      };
    }
    (e.currentTarget as HTMLElement).classList.add('dragging');
  };

  const handleDragEnd = (e: React.DragEvent) => {
    (e.currentTarget as HTMLElement).classList.remove('dragging');
  };

  const handleToggleTaskLocal = (subjId: string, taskId: string) => {
    if (!onUpdateSubjects) return;
    onUpdateSubjects(
      subjects.map((s) => {
        if (s.id === subjId) {
          const updatedTasks = s.tasks.map((t) => t.id === taskId ? { ...t, completed: !t.completed } : t);
          return { ...s, tasks: updatedTasks, completed: updatedTasks.length > 0 && updatedTasks.every(t => t.completed) };
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
          <button className="btn btn-secondary btn-sm" onClick={onRedirectToSubjects} title="Gestisci le tue materie e compiti">
            <EditIcon size={13} />
            Gestisci
          </button>
        )}
      </div>

      <div className="subjects-grid">
        {subjects.length === 0 ? (
          <div className="empty-state">
            <p>Nessun argomento registrato.</p>
            <p className="hint">Clicca su "Gestisci" per aggiungere la tua prima materia!</p>
          </div>
        ) : (
          subjects.map((sub) => {
            const presetColor = PRESET_COLORS.find(c => c.value === sub.color);
            const colorClass = presetColor ? presetColor.class : 'color-gold';
            const tasksList = sub.tasks || [];
            const hasTasks = tasksList.length > 0;
            const isExpanded = !!expandedSubjIds[sub.id];
            const totalPages = hasTasks ? tasksList.reduce((sum, t) => sum + t.pages, 0) : sub.pages;

            return (
              <div key={sub.id} className="subject-tree-node">
                <div
                  draggable
                  onDragStart={(e) => handleDragStart(e, 'subject', sub.id)}
                  onDragEnd={handleDragEnd}
                  className={`subject-card draggable-card ${colorClass} ${sub.completed ? 'completed' : ''}`}
                  style={{ '--accent-color': sub.color } as React.CSSProperties}
                >
                  {hasTasks && (
                    <button
                      type="button"
                      className={`btn-tree-toggle ${isExpanded ? 'expanded' : ''}`}
                      onClick={(e) => { e.stopPropagation(); toggleExpandSubject(sub.id); }}
                      title={isExpanded ? 'Comprimi task' : 'Espandi task'}
                    >
                      {isExpanded ? <ChevronDownIcon size={12} /> : <ChevronRightIcon size={12} />}
                    </button>
                  )}

                  <div className="card-drag-handle" title="Trascina materia intera">
                    <GripVerticalIcon size={14} className="drag-grip-icon" />
                  </div>

                  <label className="checkbox-container" onClick={(e) => e.stopPropagation()}>
                    <input type="checkbox" checked={sub.completed} onChange={() => onToggleSubject(sub.id)} />
                    <span className="checkmark"></span>
                  </label>

                  <div className="card-main-content">
                    <span className="subject-sidebar-logo" style={{ color: sub.color }}>
                      <CybersecurityLogo logo={sub.logo || 'shield'} size={16} />
                    </span>
                    <span className="subject-title">{sub.name}</span>
                    <span className="pages-badge">{totalPages} pag</span>
                  </div>
                </div>

                {isExpanded && hasTasks && (
                  <div className="subject-sub-tasks-tree animate-slide-down">
                    {tasksList.map((task) => (
                      <div
                        key={task.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, 'task', sub.id, task.id, task.name, task.pages, task.quantityType)}
                        onDragEnd={handleDragEnd}
                        className={`tree-task-pill draggable-card ${colorClass} ${task.completed ? 'completed' : ''}`}
                      >
                        <div className="tree-task-drag-handle" title="Trascina questo capitolo">
                          <GripVerticalIcon size={12} className="drag-grip-icon" />
                        </div>
                        <label className="checkbox-container-sm" onClick={(e) => e.stopPropagation()}>
                          <input type="checkbox" checked={task.completed} onChange={() => handleToggleTaskLocal(sub.id, task.id)} />
                          <span className="checkmark-sm" style={{ '--accent-color': sub.color } as React.CSSProperties}></span>
                        </label>
                        <span className="tree-task-title" title={task.name}>{task.name}</span>
                        <span className="tree-task-pages-badge">{getQtyLabel(task.pages, task.quantityType)}</span>
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
        <LightbulbIcon size={13} className="drag-instructions-icon" />
        Espandi le materie per trascinare i singoli capitoli sul calendario
      </div>
    </div>
  );
};
