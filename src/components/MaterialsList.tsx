import React, { useState } from 'react';
import { Subject } from '../types/planner';
import { PlusIcon, TrashIcon, BookIcon } from './Icons';

interface MaterialsListProps {
  subjects: Subject[];
  onAddSubject: (name: string, pages: number, color: string) => void;
  onToggleSubject: (id: string) => void;
  onDeleteSubject: (id: string) => void;
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
  onAddSubject,
  onToggleSubject,
  onDeleteSubject,
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState('');
  const [pages, setPages] = useState<number>(15);
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0].value);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onAddSubject(name, pages, selectedColor);
    setName('');
    setPages(15);
    setShowAddForm(false);
  };

  const handleDragStart = (e: React.DragEvent, subjectId: string) => {
    e.dataTransfer.setData('text/plain', subjectId);
    e.dataTransfer.setData('application/react-planner-subject', subjectId);
    e.dataTransfer.effectAllowed = 'copyMove';
    
    // Add visual dragging effect
    const element = e.currentTarget as HTMLElement;
    element.classList.add('dragging');
  };

  const handleDragEnd = (e: React.DragEvent) => {
    const element = e.currentTarget as HTMLElement;
    element.classList.remove('dragging');
  };

  return (
    <div className="materials-list-panel glass-container">
      <div className="panel-header">
        <div className="title-with-icon">
          <BookIcon className="panel-icon text-gold" />
          <h2>Libreria Materie & Argomenti</h2>
        </div>
        <button 
          className="btn btn-primary btn-sm"
          onClick={() => setShowAddForm(!showAddForm)}
        >
          <PlusIcon size={16} />
          {showAddForm ? 'Annulla' : 'Materia'}
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={handleSubmit} className="add-subject-form glass-input-panel">
          <div className="form-group">
            <label htmlFor="subj-name">Nome Argomento / Capitolo</label>
            <input
              id="subj-name"
              type="text"
              placeholder="Es. Cloud - LAN e VLAN"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="form-control"
              required
              autoFocus
            />
          </div>

          <div className="form-row">
            <div className="form-group col-6">
              <label htmlFor="subj-pages">Pagine</label>
              <input
                id="subj-pages"
                type="number"
                min="1"
                max="1000"
                value={pages}
                onChange={(e) => setPages(parseInt(e.target.value) || 0)}
                className="form-control"
                required
              />
            </div>
            <div className="form-group col-6">
              <label>Colore Badge</label>
              <div className="color-selectors">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    className={`color-dot ${c.class} ${selectedColor === c.value ? 'active' : ''}`}
                    onClick={() => setSelectedColor(c.value)}
                    title={c.name}
                  />
                ))}
              </div>
            </div>
          </div>

          <button type="submit" className="btn btn-success btn-block">
            Aggiungi alla Libreria
          </button>
        </form>
      )}

      <div className="subjects-grid">
        {subjects.length === 0 ? (
          <div className="empty-state">
            <p>Nessun argomento registrato.</p>
            <p className="hint">Clicca su "+ Materia" per aggiungere il tuo primo blocco di studio!</p>
          </div>
        ) : (
          subjects.map((sub) => {
            const presetColor = PRESET_COLORS.find(c => c.value === sub.color);
            const colorClass = presetColor ? presetColor.class : 'color-gold';

            return (
              <div
                key={sub.id}
                draggable
                onDragStart={(e) => handleDragStart(e, sub.id)}
                onDragEnd={handleDragEnd}
                className={`subject-card draggable-card ${colorClass} ${sub.completed ? 'completed' : ''}`}
                style={{ '--accent-color': sub.color } as React.CSSProperties}
              >
                <div className="card-drag-handle">
                  <div className="drag-dots">:::</div>
                </div>
                <div className="card-main-content">
                  <div className="card-header-row">
                    <label className="checkbox-container">
                      <input
                        type="checkbox"
                        checked={sub.completed}
                        onChange={() => onToggleSubject(sub.id)}
                      />
                      <span className="checkmark"></span>
                    </label>
                    <span className="subject-title">{sub.name}</span>
                  </div>
                  <div className="subject-meta">
                    <span className="pages-badge">{sub.pages} pag</span>
                  </div>
                </div>
                <button
                  className="btn-icon btn-delete-card"
                  onClick={() => onDeleteSubject(sub.id)}
                  title="Elimina materia"
                >
                  <TrashIcon size={14} />
                </button>
              </div>
            );
          })
        )}
      </div>
      <div className="drag-instructions">
        <span className="info-icon">💡</span> Trascina una materia sulle fasce orarie in basso per programmarla!
      </div>
    </div>
  );
};
