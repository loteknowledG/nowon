import React, { useEffect, useState } from 'react';

export default function OpenTuiLinkDemo(): JSX.Element {
  const [status, setStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle');
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    setStatus('loading');
    (async () => {
      try {
        // try dynamic import of local @opentui/react to verify linking
        const mod = await import('@opentui/react');
        if (!mounted) return;
        setStatus('ok');
        setInfo(`@opentui/react import OK — exports: ${Object.keys(mod).slice(0,6).join(', ')}${Object.keys(mod).length>6?', ...':''}`);
      } catch (err: any) {
        if (!mounted) return;
        setStatus('error');
        setInfo(String(err?.message || err));
      }
    })();
    return () => { mounted = false; };
  }, []);

  return (
    <div style={{ padding: 18 }} className="cli-card">
      <strong>OpenTUI local link</strong>
      <div style={{ marginTop: 8, color: 'var(--muted)' }}>This verifies the local <code>@opentui/react</code> package is linked into the workspace.</div>

      <div style={{ marginTop: 12 }}>
        <div style={{ fontSize: 13 }}><strong>Status</strong></div>
        <div style={{ marginTop: 8, color: status === 'ok' ? 'var(--accent)' : 'var(--muted)' }}>{status.toUpperCase()}{info ? ` — ${info}` : ''}</div>
      </div>

      <div style={{ marginTop: 14, color: 'var(--muted)' }}>
        Next steps:
        <ul>
          <li>Rewrite the Figlet TUI to use <code>@opentui/react</code> components (I'll scaffold that if you confirm).</li>
          <li>Optionally link native OpenTUI examples for full-featured TUI demos outside the browser.</li>
        </ul>
      </div>

      <div style={{ marginTop: 12 }}>
        <button className="btn" onClick={() => { navigator.clipboard?.writeText('C:/dev/opentui'); }}>Copy local path</button>
      </div>
    </div>
  );
}
