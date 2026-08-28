import React, { useRef, useState, useEffect } from 'react';
import type { PlannerState } from '../types/planner';
import { XIcon, DownloadIcon, UploadIcon, TrashIcon, SettingsIcon } from './Icons';
import { supabase, getSupabaseClient } from '../utils/supabase';

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
  
  // Supabase states & handlers
  user: any;
  onUserChange: (user: any) => void;
  isSyncing: boolean;
  syncError?: string;
  lastSynced: string;
  supabaseConfig: { url: string; anonKey: string };
  onConnectSupabase: (url: string, key: string) => boolean;
  onDisconnectSupabase: () => void;
  onForceSync: () => void;
}

const DEFAULT_COLORS = {
  esame: '#ef4444',
  svago: '#3b82f6',
  lezione: '#10b981',
  altro: '#a78bfa'
};

const SUPABASE_SQL_SETUP = `-- 1. Crea la tabella per salvare lo stato dello studio
CREATE TABLE IF NOT EXISTS public.user_planner_state (
  user_id UUID PRIMARY KEY,
  weeks JSONB NOT NULL DEFAULT '[]'::JSONB,
  subjects JSONB NOT NULL DEFAULT '[]'::JSONB,
  session_title TEXT DEFAULT 'SESSIONE ESTIVA',
  event_colors JSONB DEFAULT '{"esame":"#ef4444","svago":"#3b82f6","lezione":"#10b981","altro":"#a78bfa"}'::JSONB,
  task_font_size INTEGER DEFAULT 26,
  day_font_size INTEGER DEFAULT 30,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Disabilita le policy RLS per consentire il salvataggio e la sincronizzazione immediata
ALTER TABLE public.user_planner_state DISABLE ROW LEVEL SECURITY;`;

const CloudIcon = ({ size = 16, style = {} }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <path d="M17.5 19A3.5 3.5 0 0 0 21 15.5c0-2.79-2.54-4.5-5-4.5-.48 0-.93.07-1.39.2A5 5 0 0 0 5 12c0 .28.03.55.08.82A4.5 4.5 0 0 0 1 17c0 2.2 1.8 4 4 4h12.5" />
  </svg>
);

const LockIcon = ({ size = 16, style = {} }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const RefreshIcon = ({ size = 16, style = {}, className = "" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style} className={className}>
    <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
    <path d="M3 3v5h5" />
    <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
    <path d="M16 16h5v5" />
  </svg>
);

const DatabaseIcon = ({ size = 16, style = {} }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <ellipse cx="12" cy="5" rx="9" ry="3" />
    <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
    <path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3" />
  </svg>
);

const GitHubIcon = ({ size = 16, style = {} }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="currentColor" style={style}>
    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
  </svg>
);

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
  onChangeDayFontSize,
  user,
  onUserChange,
  isSyncing,
  syncError,
  lastSynced,
  supabaseConfig,
  onConnectSupabase,
  onDisconnectSupabase,
  onForceSync
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Credentials input states
  const [urlInput, setUrlInput] = useState(supabaseConfig.url);
  const [keyInput, setKeyInput] = useState(supabaseConfig.anonKey);
  const [isEditingKeys, setIsEditingKeys] = useState(!supabaseConfig.url);
  const [showSqlGuide, setShowSqlGuide] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  // Auth Form States
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  // Keep input states in sync with config changes
  useEffect(() => {
    setUrlInput(supabaseConfig.url);
    setKeyInput(supabaseConfig.anonKey);
    setIsEditingKeys(!supabaseConfig.url);
  }, [supabaseConfig]);

  const handleConnectDb = (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim() || !keyInput.trim()) {
      alert("Inserisci sia l'URL che la chiave Anon di Supabase!");
      return;
    }
    const success = onConnectSupabase(urlInput.trim(), keyInput.trim());
    if (success) {
      setIsEditingKeys(false);
    } else {
      alert("Impossibile connettere a Supabase. Verifica le tue credenziali.");
    }
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SETUP);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let client = supabase;

    // If supabase client not initialized or credentials modified, auto-connect first
    if (!client || (urlInput.trim() && urlInput.trim() !== supabaseConfig.url) || (keyInput.trim() && keyInput.trim() !== supabaseConfig.anonKey)) {
      if (urlInput.trim() && keyInput.trim()) {
        const ok = onConnectSupabase(urlInput.trim(), keyInput.trim());
        if (!ok) {
          setAuthError("Impossibile inizializzare Supabase. Verifica URL e Anon Key.");
          return;
        }
        client = supabase;
      } else {
        setAuthError("Configura prima l'URL e la Anon Key di Supabase.");
        return;
      }
    }

    if (!client) {
      setAuthError("Client Supabase non configurato.");
      return;
    }

    setAuthLoading(true);
    setAuthError('');
    try {
      if (isSignUp) {
        const { data, error } = await client.auth.signUp({
          email: email.trim(),
          password: password.trim(),
        });
        if (error) {
          setAuthError(error.message);
        } else {
          if (data?.user && data?.session) {
            onUserChange(data.user);
          } else {
            alert("Registrazione completata! Se su Supabase è attiva la conferma email, clicca sul link ricevuto prima di accedere. Altrimenti puoi fare il login subito.");
            setIsSignUp(false);
          }
        }
      } else {
        const { data, error } = await client.auth.signInWithPassword({
          email: email.trim(),
          password: password.trim(),
        });
        if (error) {
          if (error.message.includes("Email not confirmed")) {
            setAuthError("Email non ancora confermata. Controlla la tua casella di posta per confermare l'account, o disattiva 'Confirm email' su Supabase (Authentication -> Sign In / Providers -> Email).");
          } else if (error.message.includes("Invalid login credentials") || error.message.includes("invalid_credentials")) {
            setAuthError(`Credenziali errate per "${email.trim()}". Verifica se l'email contiene errori di battitura o se la password è corretta. Puoi anche usare il pulsante GitHub in alto!`);
          } else {
            setAuthError(error.message);
          }
        } else if (data?.user) {
          onUserChange(data.user);
          setAuthError('');
        }
      }
    } catch (err: any) {
      setAuthError(err?.message || "Errore di connessione a Supabase.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleGitHubLogin = async () => {
    let client = getSupabaseClient() || supabase;
    if (!client || (urlInput.trim() && urlInput.trim() !== supabaseConfig.url) || (keyInput.trim() && keyInput.trim() !== supabaseConfig.anonKey)) {
      if (urlInput.trim() && keyInput.trim()) {
        const ok = onConnectSupabase(urlInput.trim(), keyInput.trim());
        if (!ok) {
          setAuthError("Impossibile inizializzare Supabase. Verifica URL e Anon Key.");
          return;
        }
        client = getSupabaseClient() || supabase;
      }
    }
    if (!client) {
      setAuthError("Configura prima l'URL e la Anon Key di Supabase.");
      return;
    }
    setAuthLoading(true);
    setAuthError('');
    try {
      const { error } = await client.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: window.location.origin + window.location.pathname,
        },
      });
      if (error) {
        setAuthError(error.message);
        setAuthLoading(false);
      }
    } catch (err: any) {
      setAuthError(err?.message || "Errore durante l'accesso con GitHub.");
      setAuthLoading(false);
    }
  };

  const handleSendMagicLink = async () => {
    if (!email.trim()) {
      setAuthError("Inserisci prima il tuo indirizzo email nel campo sopra per ricevere il link.");
      return;
    }
    setAuthLoading(true);
    setAuthError('');
    try {
      const client = getSupabaseClient() || supabase;
      if (!client) throw new Error("Supabase non configurato");
      const { error } = await client.auth.signInWithOtp({ email: email.trim() });
      if (error) {
        setAuthError(error.message);
      } else {
        alert(`Abbiamo inviato un link di accesso a ${email.trim()}. Clicca sul link nella tua email per accedere!`);
      }
    } catch (err: any) {
      setAuthError(err?.message || "Errore durante l'invio del link di accesso");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    if (supabase) {
      const { error } = await supabase.auth.signOut();
      if (error) {
        alert("Errore durante la disconnessione: " + error.message);
      }
    }
    onUserChange(null);
  };

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
        </header>        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '10px 6px 10px 0', maxHeight: '72vh', overflowY: 'auto' }}>
          <style>{`
            @keyframes spin-slow {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
            .spin-loader {
              animation: spin-slow 1.5s linear infinite;
            }
            .btn-xs {
              padding: 4px 8px;
              font-size: 11px;
            }
          `}</style>
          
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

          {/* Supabase Cloud Sync Section */}
          <section className="settings-section" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <CloudIcon size={15} style={{ color: 'var(--accent-primary)' }} />
              <h4 style={{ fontSize: '12px', color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0, fontWeight: 700 }}>
                Sincronizzazione Cloud (Supabase)
              </h4>
            </div>

            {isEditingKeys ? (
              <form onSubmit={handleConnectDb} style={{ display: 'flex', flexDirection: 'column', gap: '10px', background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <p style={{ fontSize: '11px', color: '#a1a1aa', lineHeight: '1.4', margin: 0 }}>
                  Connetti un database Supabase per salvare automaticamente i tuoi dati sul Cloud e sincronizzarli tra dispositivi.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '10px', fontWeight: 600, color: '#a1a1aa' }}>SUPABASE PROJECT URL</label>
                  <input
                    type="url"
                    placeholder="https://xyz.supabase.co"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', padding: '6px 10px', color: '#fff', fontSize: '12px' }}
                    required
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '10px', fontWeight: 600, color: '#a1a1aa' }}>SUPABASE ANON PUBLIC KEY</label>
                  <input
                    type="password"
                    placeholder="eyJhbGciOiJIUzI1NiIsIn..."
                    value={keyInput}
                    onChange={(e) => setKeyInput(e.target.value)}
                    style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', padding: '6px 10px', color: '#fff', fontSize: '12px' }}
                    required
                  />
                </div>
                <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                  <button type="submit" className="btn btn-primary btn-sm" style={{ flex: 1, justifyContent: 'center' }}>
                    <DatabaseIcon size={13} />
                    <span>Connetti Database</span>
                  </button>
                  {supabaseConfig.url && (
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => setIsEditingKeys(false)}>
                      Annulla
                    </button>
                  )}
                </div>
              </form>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {/* DB Info Banner */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(16, 185, 129, 0.04)', border: '1px solid rgba(16, 185, 129, 0.15)', padding: '10px', borderRadius: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }} />
                    <span style={{ fontSize: '11px', fontWeight: 600, color: '#a7f3d0' }}>Database Connesso</span>
                  </div>
                  <button
                    type="button"
                    style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '10px', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline', padding: 0 }}
                    onClick={() => setIsEditingKeys(true)}
                  >
                    Modifica chiavi
                  </button>
                </div>

                {/* Authentication Panel */}
                {!user ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
                    
                    {/* 1-Click GitHub Login Button */}
                    <button
                      type="button"
                      disabled={authLoading}
                      onClick={handleGitHubLogin}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        background: '#24292f',
                        color: '#ffffff',
                        border: '1px solid rgba(255,255,255,0.2)',
                        borderRadius: '6px',
                        padding: '8px 12px',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'background 0.2s',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
                      }}
                      onMouseOver={(e) => (e.currentTarget.style.background = '#2f363d')}
                      onMouseOut={(e) => (e.currentTarget.style.background = '#24292f')}
                    >
                      <GitHubIcon size={16} />
                      <span>{authLoading ? 'Connessione...' : 'Accedi con GitHub'}</span>
                    </button>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '2px 0' }}>
                      <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }} />
                      <span style={{ fontSize: '10px', color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.05em' }}>oppure con email</span>
                      <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }} />
                    </div>

                    <form onSubmit={handleAuthSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '2px', marginBottom: '2px' }}>
                        <button
                          type="button"
                          onClick={() => { setIsSignUp(false); setAuthError(''); }}
                          style={{ flex: 1, background: 'none', border: 'none', borderBottom: !isSignUp ? '2px solid var(--accent-primary)' : 'none', color: !isSignUp ? '#fff' : '#71717a', padding: '4px 0', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                        >
                          Accedi
                        </button>
                        <button
                          type="button"
                          onClick={() => { setIsSignUp(true); setAuthError(''); }}
                          style={{ flex: 1, background: 'none', border: 'none', borderBottom: isSignUp ? '2px solid var(--accent-primary)' : 'none', color: isSignUp ? '#fff' : '#71717a', padding: '4px 0', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                        >
                          Registrati
                        </button>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <label style={{ fontSize: '10px', fontWeight: 600, color: '#a1a1aa' }}>EMAIL</label>
                        <input
                          type="email"
                          placeholder="nome@esempio.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', padding: '6px 10px', color: '#fff', fontSize: '12px' }}
                          required
                        />
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <label style={{ fontSize: '10px', fontWeight: 600, color: '#a1a1aa' }}>PASSWORD</label>
                        <input
                          type="password"
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', padding: '6px 10px', color: '#fff', fontSize: '12px' }}
                          required
                        />
                      </div>

                      {authError && (
                        <div style={{ fontSize: '11px', color: '#fca5a5', background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.35)', padding: '8px 10px', borderRadius: '6px', lineHeight: '1.4' }}>
                          <strong>⚠️ Errore:</strong> {authError}
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={authLoading}
                        className="btn btn-primary btn-sm"
                        style={{ width: '100%', justifyContent: 'center', marginTop: '4px' }}
                      >
                        <LockIcon size={12} />
                        <span>{authLoading ? 'Elaborazione...' : isSignUp ? 'Crea Account Cloud' : 'Accedi con Password'}</span>
                      </button>

                      {!isSignUp && (
                        <button
                          type="button"
                          disabled={authLoading}
                          onClick={handleSendMagicLink}
                          style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '11px', textDecoration: 'underline', cursor: 'pointer', textAlign: 'center', marginTop: '2px', padding: '4px' }}
                        >
                          Password dimenticata? Invia link di accesso via email
                        </button>
                      )}
                    </form>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <span style={{ fontSize: '10px', color: '#a1a1aa', fontWeight: 600 }}>ACCOUNT ATTIVO</span>
                        <span style={{ fontSize: '12px', fontWeight: 700, color: '#fff', maxWidth: '190px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={user.email}>
                          {user.email}
                        </span>
                      </div>
                      <button
                        type="button"
                        className="btn btn-danger btn-xs"
                        onClick={handleSignOut}
                        style={{ fontSize: '10px', padding: '4px 8px' }}
                      >
                        Esci
                      </button>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '10px', marginTop: '4px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1 }}>
                        <span style={{ fontSize: '10px', color: '#a1a1aa' }}>STATO CLOUD</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {isSyncing ? (
                            <>
                              <RefreshIcon size={10} className="spin-loader" style={{ color: 'var(--accent-primary)' }} />
                              <span style={{ fontSize: '11px', color: '#e4e4e7' }}>In corso...</span>
                            </>
                          ) : syncError ? (
                            <>
                              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ef4444' }} />
                              <span style={{ fontSize: '11px', color: '#f87171' }}>Errore sincronizzazione</span>
                            </>
                          ) : (
                            <>
                              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }} />
                              <span style={{ fontSize: '11px', color: '#a1a1aa' }}>
                                Sincronizzato: <strong style={{ color: '#fff' }}>{lastSynced || 'Ora'}</strong>
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      <button
                        type="button"
                        disabled={isSyncing}
                        className="btn btn-secondary btn-xs"
                        onClick={onForceSync}
                        style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', padding: '6px 10px' }}
                      >
                        <RefreshIcon size={10} className={isSyncing ? "spin-loader" : ""} />
                        Sincronizza
                      </button>
                    </div>

                    {syncError && (
                      <div style={{ fontSize: '11px', color: '#fca5a5', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.25)', padding: '8px 10px', borderRadius: '6px', lineHeight: '1.4' }}>
                        <div style={{ fontWeight: 700, color: '#f87171', marginBottom: '2px' }}>Errore Database:</div>
                        <div>{syncError}</div>
                        {(syncError.includes('user_planner_state') || syncError.includes('relation') || syncError.includes('policy') || syncError.includes('42P01') || syncError.includes('PGRST')) && (
                          <div style={{ marginTop: '6px', paddingTop: '6px', borderTop: '1px dashed rgba(239,68,68,0.2)', fontSize: '10.5px' }}>
                            💡 <em>La tabella o le regole di sicurezza (RLS) potrebbero non essere state create su Supabase.</em>
                            <button
                              type="button"
                              onClick={() => setShowSqlGuide(!showSqlGuide)}
                              style={{ background: 'none', border: 'none', color: '#38bdf8', textDecoration: 'underline', cursor: 'pointer', padding: '2px 0 0 0', display: 'block', fontSize: '11px', fontWeight: 600 }}
                            >
                              {showSqlGuide ? "▲ Chiudi Guida SQL" : "▼ Apri Script SQL per Supabase"}
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* SQL Table Setup Guide Accordion */}
                <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                  <button
                    type="button"
                    onClick={() => setShowSqlGuide(!showSqlGuide)}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'transparent', border: 'none', color: '#a1a1aa', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}
                  >
                    <span>🛠️ Script Configurazione Database (SQL)</span>
                    <span style={{ color: '#71717a' }}>{showSqlGuide ? '▲' : '▼'}</span>
                  </button>
                  
                  {showSqlGuide && (
                    <div style={{ padding: '10px 12px 12px 12px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <p style={{ fontSize: '11px', color: '#94a3b8', margin: 0, lineHeight: '1.4' }}>
                        Vai nella sezione <strong>SQL Editor</strong> del tuo progetto su Supabase, incolla questo script e premi <strong>Run</strong>:
                      </p>
                      <pre style={{ background: '#090a0f', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', padding: '8px 10px', fontSize: '10px', color: '#38bdf8', overflowX: 'auto', maxHeight: '140px', margin: 0, fontFamily: 'monospace' }}>
                        {SUPABASE_SQL_SETUP}
                      </pre>
                      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <button
                          type="button"
                          className="btn btn-secondary btn-xs"
                          onClick={handleCopySql}
                          style={{ fontSize: '10px', padding: '4px 10px', background: copiedSql ? 'rgba(16,185,129,0.2)' : undefined, color: copiedSql ? '#10b981' : undefined }}
                        >
                          {copiedSql ? "✓ Copiato negli appunti!" : "📋 Copia Script SQL"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '-4px' }}>
                  <button
                    type="button"
                    style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '10px', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline', padding: 0 }}
                    onClick={onDisconnectSupabase}
                  >
                    Disconnetti interamente database
                  </button>
                </div>
              </div>
            )}
          </section>

          <hr style={{ border: 'none', borderBottom: '1px solid rgba(255,255,255,0.08)', margin: 0 }} />

          {/* Backup & Restore Section */}
          <section className="settings-section">
            <h4 style={{ fontSize: '12px', color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px', fontWeight: 700 }}>
              Salvataggio & Backup Locale
            </h4>
            <p style={{ fontSize: '11px', color: '#71717a', lineHeight: '1.4', marginBottom: '12px' }}>
              Esporta lo stato completo del tuo workspace in un file locale per non perdere i tuoi progressi, o ripristina un backup precedentemente salvato.
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
