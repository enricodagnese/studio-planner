import React, { useRef } from 'react';
import type { PlannerState } from '../types/planner';
import { XIcon, DownloadIcon, UploadIcon, TrashIcon, SettingsIcon } from './Icons';

interface SettingsModalProps {
  weeks: any[];
  subjects: any[];
  activeWeekId: string;
  onImportState: (importedState: PlannerState) => void;
  onResetAll: () => void;
  eventColors: {
    esame: string;
    svago: string;
    lezione: string;
    altro: string;
  };
  onChangeEventColors: (colors: {
    esame: string;
    svago: string;
    lezione: string;
    altro: string;
  }) => void;
  onClose: () => void;
  taskFontSize: number;
  onChangeTaskFontSize: (size: number) => void;
  dayFontSize: number;
  onChangeDayFontSize: (size: number) => void;
}

const DEFAULT_COLORS = {
  esame: '#ef4444',
  svago: '#3b82f6',
  lezione: '#10b981',
  altro: '#a78bfa'
};

export const SettingsModal: React.FC<SettingsModalProps> = ({
  weeks,
  subjects,
  activeWeekId,
  onImportState,
  onResetAll,
  eventColors,
  onChangeEventColors,
  onClose,
  taskFontSize,
  onChangeTaskFontSize,
  dayFontSize,
  onChangeDayFontSize
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    try {
      const stateToExport: PlannerState = { weeks, subjects, activeWeekId };
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(stateToExport, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      
      const fileName = `backup_studio_workspace_${new Date().toISOString().split('T')[0]}.json`;
      downloadAnchor.setAttribute("download", fileName);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (err) {
      alert("Errore durante l'esportazione dei dati: " + err);
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string) as PlannerState;
        
        // Basic schema validation
        if (parsed && Array.isArray(parsed.weeks) && Array.isArray(parsed.subjects) && typeof parsed.activeWeekId === 'string') {
          if (window.confirm("Sei sicuro di voler importare questo backup? Questo sovrascriverà tutti i dati correnti del tuo workspace!")) {
            onImportState(parsed);
            onClose();
          }
        } else {
          alert("File JSON non valido. Assicurati che sia un backup generato da questa applicazione.");
        }
      } catch (err) {
        alert("Errore durante il caricamento del file: " + err);
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset input
  };

  const handleColorChange = (key: keyof typeof DEFAULT_COLORS, color: string) => {
    onChangeEventColors({
      ...eventColors,
      [key]: color
    });
  };

  const handleResetColors = () => {
    if (window.confirm("Vuoi ripristinare i colori predefiniti per gli eventi?")) {
      onChangeEventColors(DEFAULT_COLORS);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content glass-container settings-modal-content animate-scale-up" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px', width: '92%' }}>
        <header className="modal-header">
          <div className="modal-title-container">
            <SettingsIcon size={16} className="text-gold" />
            <h3>Impostazioni Workspace</h3>
          </div>
          <button type="button" className="btn-close-modal" onClick={onClose} title="Chiudi">
            <XIcon size={14} />
          </button>
        </header>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '10px 0' }}>
          
          {/* Colors Customization Section */}
          <section className="settings-section">
            <h4 style={{ fontSize: '12px', color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px', fontWeight: 700 }}>
              Colori Categorie Eventi
            </h4>
            <div className="color-selectors-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {(Object.keys(DEFAULT_COLORS) as Array<keyof typeof DEFAULT_COLORS>).map((key) => {
                const labels = { esame: 'Esame', svago: 'Svago', lezione: 'Lezione', altro: 'Altro' };
                return (
                  <div key={key} className="color-picker-row" style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.02)', padding: '6px 10px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <input 
                      type="color" 
                      value={eventColors[key]} 
                      onChange={(e) => handleColorChange(key, e.target.value)} 
                      style={{ width: '28px', height: '28px', border: 'none', borderRadius: '4px', cursor: 'pointer', background: 'transparent', padding: 0 }}
                      title={`Scegli colore per ${labels[key]}`}
                    />
                    <span style={{ fontSize: '12px', fontWeight: 600, color: '#e4e4e7' }}>{labels[key]}</span>
                  </div>
                );
              })}
            </div>
            <button 
              type="button" 
              className="btn btn-secondary btn-xs" 
              onClick={handleResetColors}
              style={{ marginTop: '10px', fontSize: '10px', padding: '4px 8px' }}
            >
              Ripristina Colori Predefiniti
            </button>
          </section>

          <hr style={{ border: 'none', borderBottom: '1px solid rgba(255,255,255,0.08)', margin: 0 }} />

          {/* UI Sizing Scale Section */}
          <section className="settings-section">
            <h4 style={{ fontSize: '12px', color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px', fontWeight: 700 }}>
              Dimensioni Caratteri (Homepage Oggi)
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 600, color: '#e4e4e7' }}>
                  <span>Dimensione Giorno Corrente</span>
                  <span style={{ color: 'var(--accent-primary)' }}>{dayFontSize}px</span>
                </div>
                <input 
                  type="range" 
                  min="20" 
                  max="44" 
                  step="1"
                  value={dayFontSize} 
                  onChange={(e) => onChangeDayFontSize(parseInt(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--accent-primary)', cursor: 'pointer' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 600, color: '#e4e4e7' }}>
                  <span>Dimensione Compiti</span>
                  <span style={{ color: 'var(--accent-primary)' }}>{taskFontSize}px</span>
                </div>
                <input 
                  type="range" 
                  min="16" 
                  max="36" 
                  step="1"
                  value={taskFontSize} 
                  onChange={(e) => onChangeTaskFontSize(parseInt(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--accent-primary)', cursor: 'pointer' }}
                />
              </div>
            </div>
          </section>

          <hr style={{ border: 'none', borderBottom: '1px solid rgba(255,255,255,0.08)', margin: 0 }} />

          {/* Backup & Restore Section */}
          <section className="settings-section">
            <h4 style={{ fontSize: '12px', color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px', fontWeight: 700 }}>
              Salvataggio & Backup
            </h4>
            <p style={{ fontSize: '11px', color: '#71717a', lineHeight: '1.4', marginBottom: '12px' }}>
              Esporta lo stato completo del tuo workspace per non perdere i tuoi progressi, o ripristina un backup precedentemente salvato.
            </p>
            <div className="settings-actions-row" style={{ display: 'flex', gap: '10px' }}>
              <button 
                type="button" 
                className="btn btn-secondary btn-sm" 
                onClick={handleExport}
                style={{ flex: 1, justifyContent: 'center' }}
              >
                <DownloadIcon size={14} />
                <span>Backup</span>
              </button>
              
              <button 
                type="button" 
                className="btn btn-secondary btn-sm" 
                onClick={handleImportClick}
                style={{ flex: 1, justifyContent: 'center' }}
              >
                <UploadIcon size={14} />
                <span>Ripristina Backup</span>
              </button>
            </div>
            
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              accept=".json" 
              style={{ display: 'none' }} 
            />
          </section>

          <hr style={{ border: 'none', borderBottom: '1px solid rgba(255,255,255,0.08)', margin: 0 }} />

          {/* Danger Zone */}
          <section className="settings-section">
            <h4 style={{ fontSize: '12px', color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px', fontWeight: 700 }}>
              Zona di Pericolo
            </h4>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(239, 68, 68, 0.03)', padding: '10px', borderRadius: '6px', border: '1px solid rgba(239, 68, 68, 0.15)' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#fca5a5' }}>Ripristino Completo Dati</span>
                <span style={{ fontSize: '10px', color: '#f87171', opacity: 0.8 }}>Elimina permanentemente tutti i compiti e materie.</span>
              </div>
              <button 
                type="button" 
                className="btn btn-danger btn-sm" 
                onClick={() => { if (window.confirm("Sei sicuro di voler effettuare l'inizializzazione totale dei dati? Questa operazione NON è reversibile.")) { onResetAll(); onClose(); } }}
              >
                <TrashIcon size={13} />
                <span>Ripristina</span>
              </button>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
};
