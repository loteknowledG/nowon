import React, { useEffect, useMemo, useState } from 'react';

const makeData = (n: number) => Array.from({ length: n }, (_, i) => ({ id: i + 1, name: `task-${i + 1}`, cpu: Math.round(Math.random() * 100) }));

export default function ReactiveTuiDemo(): JSX.Element {
  const [rows, setRows] = useState(() => makeData(12));
  const [dense, setDense] = useState(false);
  const [sidebarIndex, setSidebarIndex] = useState(0);
  const [width, setWidth] = useState<number>(() => window.innerWidth);

  // keyboard focus for the task list (shows your position)
  const rootRef = React.useRef<HTMLDivElement | null>(null);
  const tableRef = React.useRef<HTMLDivElement | null>(null);
  const [focusedRow, setFocusedRow] = useState(0);

  useEffect(() => {
    const onResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // clamp focused row when data changes
  useEffect(() => {
    setFocusedRow((i) => Math.max(0, Math.min(i, rows.length - 1)));
  }, [rows]);

  const breakpoint = useMemo(() => (width < 900 ? 'narrow' : 'wide'), [width]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    // only handle arrow navigation when root has focus
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const next = Math.min(rows.length - 1, focusedRow + 1);
      setFocusedRow(next);
      const el = tableRef.current?.querySelectorAll('tbody tr')[next] as HTMLElement | undefined;
      el?.scrollIntoView({ block: 'nearest' });
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prev = Math.max(0, focusedRow - 1);
      setFocusedRow(prev);
      const el = tableRef.current?.querySelectorAll('tbody tr')[prev] as HTMLElement | undefined;
      el?.scrollIntoView({ block: 'nearest' });
    }
  };

  return (
    <div ref={rootRef} tabIndex={0} onKeyDown={onKeyDown} style={{ padding: 16, outline: 'none' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
        <div>
          <strong>reactive_tui — browser prototype</strong>
          <div style={{ color: 'var(--muted)', fontSize: 13 }}>Responsive CSS-driven layout (breakpoint: {breakpoint})</div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <label style={{ color: 'var(--muted)', fontSize: 13 }}>Density</label>
          <button className={dense ? 'btn' : 'btn ghost'} onClick={() => setDense((d) => !d)}>{dense ? 'Dense' : 'Comfort'}</button>
          <button className="btn ghost" onClick={() => setRows((r) => makeData(r.length + 5))}>Add rows</button>
          <button className="btn ghost" onClick={() => setRows(() => makeData(12))}>Reset rows</button>
          <button className="btn ghost" onClick={() => { rootRef.current?.focus(); setFocusedRow(0); }}>Focus table</button>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: breakpoint === 'narrow' ? '1fr' : '220px 1fr 320px',
          gap: 14,
          marginTop: 14,
          alignItems: 'start',
        }}
      >
        <aside style={{ borderRadius: 10, padding: 10, border: '1px solid rgba(255,255,255,0.03)', background: 'var(--panel)' }}>
          <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 8 }}>Sidebar</div>
          <div style={{ display: 'grid', gap: 8 }}>
            {['Overview', 'Workers', 'Queue', 'Metrics', 'Settings'].map((s, i) => (
              <button
                key={s}
                className={i === sidebarIndex ? 'btn' : 'btn ghost'}
                onClick={() => setSidebarIndex(i)}
                style={{ textAlign: 'left', padding: dense ? '6px 8px' : '10px 12px' }}
              >
                {s}
              </button>
            ))}
          </div>
        </aside>

        <main style={{ borderRadius: 10, padding: 14, border: '1px solid rgba(255,255,255,0.03)', background: 'linear-gradient(180deg, rgba(0,0,0,0.02), transparent)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <strong>Tasks</strong>
            <div style={{ color: 'var(--muted)', fontSize: 13 }}>{rows.length} rows · focus: {focusedRow + 1}</div>
          </div>

          <div style={{ marginTop: 12, overflow: 'auto', maxHeight: 300 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'Hack, monospace' }}>
              <thead style={{ color: 'var(--muted)', fontSize: 13 }}>
                <tr>
                  <th style={{ textAlign: 'left', padding: '6px 8px' }}>ID</th>
                  <th style={{ textAlign: 'left', padding: '6px 8px' }}>Name</th>
                  <th style={{ textAlign: 'left', padding: '6px 8px' }}>CPU %</th>
                </tr>
              </thead>
              <tbody ref={tableRef}>
                {rows.map((r, idx) => {
                  const isFocused = idx === focusedRow;
                  return (
                    <tr
                      key={r.id}
                      onClick={() => setFocusedRow(idx)}
                      aria-selected={isFocused}
                      style={{
                        background: isFocused ? 'linear-gradient(90deg, rgba(123,97,255,0.06), rgba(0,230,168,0.02))' : 'transparent',
                        borderLeft: isFocused ? '4px solid rgba(123,97,255,0.38)' : undefined,
                        transition: 'background .12s ease',
                      }}
                    >
                      <td style={{ padding: dense ? '4px 8px' : '8px 8px' }}>{r.id}</td>
                      <td style={{ padding: dense ? '4px 8px' : '8px 8px', position: 'relative' }}>
                        {isFocused ? <span style={{ display: 'inline-block', width: 8, height: 18, background: 'rgba(123,97,255,0.9)', borderRadius: 2, marginRight: 8, verticalAlign: 'middle' }}></span> : <span style={{ display: 'inline-block', width: 8, height: 18, marginRight: 8, verticalAlign: 'middle' }}></span>}
                        {r.name}
                      </td>
                      <td style={{ padding: dense ? '4px 8px' : '8px 8px' }}>{r.cpu}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
            <button className="btn ghost" onClick={() => setRows((s) => s.map((r) => ({ ...r, cpu: Math.round(Math.random() * 100) })))}>Randomize</button>
            <button className="btn" onClick={() => setRows((s) => s.slice(0, Math.max(1, s.length - 3)))}>Trim</button>
          </div>
        </main>

        <aside style={{ borderRadius: 10, padding: 12, border: '1px solid rgba(255,255,255,0.03)', background: 'var(--panel)' }}>
          <div style={{ fontSize: 13, color: 'var(--muted)' }}><strong>Chart</strong></div>
          <div style={{ height: 160, marginTop: 8, background: 'linear-gradient(180deg, rgba(123,97,255,0.06), rgba(0,230,168,0.03))', borderRadius: 8 }}>
            <div style={{ padding: 10, color: 'rgba(0,0,0,0.6)' }}>[placeholder sparkline]</div>
          </div>

          <div style={{ marginTop: 12, color: 'var(--muted)', fontSize: 13 }}>
            <div style={{ marginBottom: 8 }}><strong>Layout CSS</strong></div>
            <pre style={{ background: 'transparent', color: 'var(--muted)', fontSize: 12 }}>{`.dashboard { display: grid; grid-template-columns: 220px 1fr 320px; gap: 1rem }
@media (max-width: 900px) { .dashboard { grid-template-columns: 1fr } }`}</pre>
          </div>
        </aside>
      </div>
    </div>
  );
}
