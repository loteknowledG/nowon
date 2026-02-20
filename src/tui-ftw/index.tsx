import React, { Suspense, useMemo, useState } from 'react';

const loaders = {
  opentui: () => import('./opentui'),
  reactive_tui: () => import('./reactive_tui'),
  'blessed-contrib': () => import('./blessed-contrib'),
  sveltui: () => import('./sveltui'),
  rezi: () => import('./rezi'),
  chalk: () => import('./chalk'),
  figlet: () => import('./figlet'),
  'figlet-tui': () => import('./figlet-tui'),
  'opentui-link': () => import('./opentui-link'),
  clack: () => import('./clack'),
  enquirer: () => import('./enquirer'),
} as const;

type DemoKey = keyof typeof loaders;
const demoList: { key: DemoKey; label: string }[] = [
  { key: 'opentui', label: 'OpenTUI' },
  { key: 'reactive_tui', label: 'Reactive TUI' },
  { key: 'blessed-contrib', label: 'blessed-contrib' },
  { key: 'sveltui', label: 'SvelTUI' },
  { key: 'rezi', label: 'Rezi' },
  { key: 'chalk', label: 'Chalk' },
  { key: 'figlet', label: 'Figlet' },
  { key: 'figlet-tui', label: 'Figlet TUI' },
  { key: 'opentui-link', label: 'OpenTUI (local)' },
  { key: 'clack', label: '@clack/prompts' },
  { key: 'enquirer', label: 'Enquirer' },
];

export default function TuiFtwIndex(): JSX.Element {
  const [selected, setSelected] = useState<DemoKey | null>(null);

  const DemoComponent = useMemo(() => {
    if (!selected) return null;
    return React.lazy(loaders[selected]);
  }, [selected]);

  return (
    <div style={{ padding: 18 }}>
      <div style={{ display: 'flex', gap: 18, alignItems: 'flex-start' }}>
        <div style={{ width: 220, borderRight: '1px solid rgba(255,255,255,0.03)', paddingRight: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <strong>tui‑ftw (private)</strong>
            <button
              className="btn ghost"
              onClick={() => {
                // prefer history.back(), fallback to homepage if no history
                if (window.history.length > 1) window.history.back();
                else window.location.pathname = '/nowon/';
              }}
              style={{ fontSize: 12 }}
            >
              Close
            </button>
          </div>
          <div style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 8 }}>Click a demo to load (lazy)</div>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 6 }}>
            {demoList.map((d) => (
              <li key={d.key}>
                <button
                  className={`btn ${selected === d.key ? '' : 'ghost'}`}
                  onClick={() => setSelected(d.key)}
                  style={{ width: '100%', textAlign: 'left', padding: '8px 10px', borderRadius: 8 }}
                >
                  {d.label}
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div style={{ flex: 1, minHeight: 280 }}>
          {!selected && (
            <div style={{ padding: 18, borderRadius: 8, background: 'rgba(0,0,0,0.04)', color: 'var(--muted)' }}>
              <strong>Pick a demo</strong>
              <p style={{ marginTop: 8 }}>Demos load lazily and are isolated under <code>src/tui-ftw/</code>. No site changes are made.</p>
            </div>
          )}

          {selected && DemoComponent && (
            <div style={{ borderRadius: 8, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.03)', background: 'linear-gradient(180deg, rgba(0,0,0,0.02), transparent)' }}>
              <Suspense fallback={<div style={{ padding: 18 }}>Loading demo…</div>}>
                <DemoComponent />
              </Suspense>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
