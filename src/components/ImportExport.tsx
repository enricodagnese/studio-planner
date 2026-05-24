import React, { useRef } from 'react';
import { PlannerState } from '../types/planner';
import { DownloadIcon, UploadIcon } from './Icons';

interface ImportExportProps {
  plannerState: PlannerState;
  onImportState: (importedState: PlannerState) => void;
}

export const ImportExport: React.FC<ImportExportProps> = ({ plannerState, onImportState }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    try {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(plannerState, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      
      const fileName = `sessione_studio_backup_${new Date().toISOString().split('T')[0]}.json`;
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
        
        // Basic schema verification
        if (parsed && Array.isArray(parsed.weeks) && Array.isArray(parsed.subjects) && typeof parsed.activeWeekId === 'string') {
          if (window.confirm("Sicuro di voler importare questo backup? Sovrascriverà tutti i dati correnti!")) {
            onImportState(parsed);
          }
        } else {
          alert("File JSON non valido per questa applicazione.");
        }
      } catch (err) {
        alert("Errore durante la lettura del file: " + err);
      }
    };
    reader.readAsText(file);
    // Reset file value to allow importing the same file again
    e.target.value = '';
  };

  return (
    <div className="backup-actions">
      <button 
        className="btn btn-secondary btn-sm" 
        onClick={handleExport}
        title="Esporta i dati di studio come file JSON"
      >
        <DownloadIcon size={16} />
        <span>Backup</span>
      </button>
      
      <button 
        className="btn btn-secondary btn-sm" 
        onClick={handleImportClick}
        title="Ripristina i dati da un file di backup JSON"
      >
        <UploadIcon size={16} />
        <span>Ripristina</span>
      </button>
      
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        accept=".json" 
        style={{ display: 'none' }} 
      />
    </div>
  );
};
