import { useEffect, useState } from 'react';
import './App.css';
import { vocab, CONTENT_VERSION } from './data/vocab';
import { seedVocabIfNeeded } from './db/db';
import { HomeView } from './features/home/HomeView';
import { LibraryView } from './features/library/LibraryView';
import { PracticeView } from './features/practice/PracticeView';
import { StatsView } from './features/stats/StatsView';

type Tab = 'home' | 'library' | 'listening' | 'recording' | 'stats';

const TABS: Array<{ id: Tab; label: string; icon: string }> = [
  { id: 'home', label: 'Heute', icon: '⌂' },
  { id: 'listening', label: 'Hören', icon: '◉' },
  { id: 'recording', label: 'Sprechen', icon: '◎' },
  { id: 'library', label: 'Wortschatz', icon: '☰' },
  { id: 'stats', label: 'Fortschritt', icon: '▥' },
];

function App() {
  const [ready, setReady] = useState(false);
  const [tab, setTab] = useState<Tab>('home');
  const [error, setError] = useState(false);

  useEffect(() => {
    seedVocabIfNeeded(vocab, CONTENT_VERSION).then(() => setReady(true)).catch(() => setError(true));
  }, []);

  return (
    <div className="app-shell">
      <header className="app-header">
        <a className="brand" href="#" onClick={event => { event.preventDefault(); setTab('home'); }}>salâm<span>Persisch für dich</span></a>
        <span className="header-note">Hören. Sprechen. Ankommen.</span>
      </header>

      <main className="app-main">
        {error ? <div role="alert" className="notice"><h2>Lokaler Speicher nicht verfügbar</h2><p>Bitte erlaube Website-Daten im Browser und lade die Seite erneut.</p><button className="btn btn-primary" onClick={() => location.reload()}>Erneut laden</button></div> : !ready && <p className="app-loading">Lädt …</p>}
        {ready && tab === 'home' && <HomeView vocab={vocab} onStart={setTab} />}
        {ready && tab === 'library' && <LibraryView vocab={vocab} />}
        {ready && (tab === 'listening' || tab === 'recording') && <PracticeView key={tab} vocab={vocab} mode={tab} />}
        {ready && tab === 'stats' && <StatsView vocab={vocab} />}
      </main>

      <nav className="tab-nav" aria-label="Hauptnavigation">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            aria-current={tab === t.id ? 'page' : undefined}
            onClick={() => setTab(t.id)}
          >
            <span className="tab-icon" aria-hidden="true">
              {t.icon}
            </span>
            <span className="tab-label">{t.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

export default App;
