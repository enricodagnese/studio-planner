import React, { useState } from 'react';
import type { Subject } from '../types/planner';
import { BookIcon, EditIcon, LightbulbIcon, GripVerticalIcon, ChevronRightIcon } from './Icons';
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

      <div className="subjects-grid" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
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
            const theoryTasks = tasksList.filter(t => t.category === 'teoria' && !t.completed);
            const exerciseTasks = tasksList.filter(t => t.category === 'esercizi' && !t.completed);
            const otherTasks = tasksList.filter(t => t.category === 'altro' && !t.completed);
            const hasTasks = theoryTasks.length > 0 || exerciseTasks.length > 0 || otherTasks.length > 0;
            const isExpanded = !!expandedSubjIds[sub.id];

            return (
              <div key={sub.id} className="subject-tree-node" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {/* Main subject card: NOT draggable, only for preview and opening tasks */}
                <div
                  className={`subject-card ${colorClass} ${sub.completed ? 'completed' : ''}`}
                  style={{ 
                    '--accent-color': sub.color,
                    paddingLeft: '14px',
                    paddingRight: '14px',
                    borderLeft: `4px solid ${sub.color}`,
                    background: 'rgba(30, 31, 41, 0.75)',
                    display: 'flex',
                    alignItems: 'center',
                    cursor: 'default'
                  } as React.CSSProperties}
                  onClick={() => hasTasks && toggleExpandSubject(sub.id)}
                >
                  <div className="card-main-content" style={{ display: 'flex', alignItems: 'center', width: '100%', gap: '12px' }}>
                    <span className="subject-sidebar-logo" style={{ color: sub.color, display: 'flex', alignItems: 'center' }}>
                      <CybersecurityLogo logo={sub.logo || 'shield'} size={18} />
                    </span>
                    <span className="subject-title" style={{ flex: '1', fontWeight: 600, fontSize: '13.5px', color: '#fff' }}>
                      {sub.name}
                    </span>
                    {hasTasks && (
                      <button
                        type="button"
                        className={`btn-tree-toggle ${isExpanded ? 'expanded' : ''}`}
                        onClick={(e) => { e.stopPropagation(); toggleExpandSubject(sub.id); }}
                        title={isExpanded ? 'Comprimi compiti' : 'Apri compiti'}
                        style={{
                          position: 'relative',
                          left: 'auto',
                          top: 'auto',
                          transform: isExpanded ? 'rotate(90deg)' : 'none',
                          transition: 'transform 0.2s ease',
                          background: 'transparent',
                          border: 'none',
                          color: '#a1a1aa',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '24px',
                          height: '24px'
                        }}
                      >
                        <ChevronRightIcon size={15} />
                      </button>
                    )}
                  </div>
                </div>

                {isExpanded && hasTasks && (
                  <div className="subject-sub-tasks-tree animate-slide-down" style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingLeft: '12px', borderLeft: '1.5px dashed rgba(255,255,255,0.08)', marginLeft: '22px' }}>
                    {theoryTasks.length > 0 && (
                      <div className="task-category-group" style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        <div className="task-category-header" style={{ fontSize: '9px', fontWeight: 800, letterSpacing: '0.06em', color: '#71717a', textTransform: 'uppercase', paddingLeft: '6px', marginBottom: '2px' }}>Teoria</div>
                        {theoryTasks.map((task) => (
                          <div
                            key={task.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, 'task', sub.id, task.id, task.name, task.pages, task.quantityType)}
                            onDragEnd={handleDragEnd}
                            className={`tree-task-pill draggable-card ${colorClass} ${task.completed ? 'completed' : ''}`}
                            style={{ '--accent-color': sub.color } as React.CSSProperties}
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
                    {exerciseTasks.length > 0 && (
                      <div className="task-category-group" style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        <div className="task-category-header" style={{ fontSize: '9px', fontWeight: 800, letterSpacing: '0.06em', color: '#71717a', textTransform: 'uppercase', paddingLeft: '6px', marginBottom: '2px' }}>Esercizi</div>
                        {exerciseTasks.map((task) => (
                          <div
                            key={task.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, 'task', sub.id, task.id, task.name, task.pages, task.quantityType)}
                            onDragEnd={handleDragEnd}
                            className={`tree-task-pill draggable-card ${colorClass} ${task.completed ? 'completed' : ''}`}
                            style={{ '--accent-color': sub.color } as React.CSSProperties}
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
                    {otherTasks.length > 0 && (
                      <div className="task-category-group" style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        <div className="task-category-header" style={{ fontSize: '9px', fontWeight: 800, letterSpacing: '0.06em', color: '#71717a', textTransform: 'uppercase', paddingLeft: '6px', marginBottom: '2px' }}>Altro</div>
                        {otherTasks.map((task) => (
                          <div
                            key={task.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, 'task', sub.id, task.id, task.name, task.pages, task.quantityType)}
                            onDragEnd={handleDragEnd}
                            className={`tree-task-pill draggable-card ${colorClass} ${task.completed ? 'completed' : ''}`}
                            style={{ '--accent-color': sub.color } as React.CSSProperties}
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
                )}
              </div>
            );
          })
        )}
      </div>
      <div className="drag-instructions" style={{ marginTop: '16px' }}>
        <LightbulbIcon size={13} className="drag-instructions-icon" />
        Apri la materia per trascinare i singoli compiti sul calendario
      </div>
    </div>
  );
};
