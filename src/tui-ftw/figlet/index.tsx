import React, { useEffect, useRef, useState } from 'react';

export default function FigletDemo(): JSX.Element {
  const [input, setInput] = useState('nowon');
  const [art, setArt] = useState('');
  const [fonts, setFonts] = useState<string[]>([]);
  const [font, setFont] = useState('Standard');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [fontSize, setFontSize] = useState(12);
  const [preloading, setPreloading] = useState(false);
  const [preloadProgress, setPreloadProgress] = useState(0);
  const [preloaded, setPreloaded] = useState<boolean>(() => Boolean(globalThis.localStorage?.getItem('figlet-fonts-preloaded')));
  const mounted = useRef(true);

  useEffect(() => {
    return () => { mounted.current = false; };
  }, []);

  useEffect(() => {
    // load available fonts (fallback to a small set on error)
    (async () => {
      try {
        const figletModule = await import('figlet');
        const figlet = (figletModule && (figletModule as any).default) || (figletModule as any);
        // compute base using Vite's BASE_URL when available, otherwise derive root segment from document.baseURI
        const _base = (() => {
          const viteBase = (import.meta as any).env?.BASE_URL;
          if (typeof viteBase === 'string' && viteBase !== '/') return viteBase.replace(/\/$/, '');
          try { const p = new URL(document.baseURI).pathname; const seg = p.split('/').filter(Boolean)[0]; return seg ? `/${seg}` : ''; } catch (e) { return ''; }
        })();
        const _fontPath = `${_base}/fonts`;
        try { figlet.defaults && figlet.defaults({ fontPath: _fontPath, fetchFontIfMissing: true }); } catch (e) { /* ignore */ }
        const list: string[] = await new Promise((res, rej) => figlet.fonts((err: any, l: string[]) => (err ? rej(err) : res(l))));
        if (!mounted.current) return;
        // prefer a short curated order but keep full list available
        setFonts(list.slice(0, 120));
        setFont((prev) => prev || list[0] || 'Standard');
      } catch (err) {
        setFonts(['Standard', 'Slant', 'Small', 'Ghost']);
      }
    })();
  }, []);

  async function render(text = input, useFont = font) {
    setLoading(true);
    try {
      const figletModule = await import('figlet');
      const figlet = (figletModule && (figletModule as any).default) || (figletModule as any);
      // ensure fontPath respects the site's base (prefer Vite BASE_URL)
      const _base = (() => {
        const viteBase = (import.meta as any).env?.BASE_URL;
        if (typeof viteBase === 'string' && viteBase !== '/') return viteBase.replace(/\/$/, '');
        try { const p = new URL(document.baseURI).pathname; const seg = p.split('/').filter(Boolean)[0]; return seg ? `/${seg}` : ''; } catch (e) { return ''; }
      })();
      const _fontPath = `${_base}/fonts`;
      try { figlet.defaults && figlet.defaults({ fontPath: _fontPath, fetchFontIfMissing: true }); } catch (e) { /* ignore */ }
      const data: string = await new Promise((resolve, reject) => {
        figlet.text(text || ' ', { font: useFont, horizontalLayout: 'default' }, (err: any, d: string) => (err ? reject(err) : resolve(d)));
      });
      if (!mounted.current) return;
      setArt(data);
    } catch (err: any) {
      const msg = String(err?.message || String(err));
      if (msg.includes('FIGlet header contains invalid values')) {
        // user-selected font appears invalid in this environment — fallback to Standard
        setArt(`figlet error: invalid font header for "${useFont}" — falling back to "Standard".`);
        if (useFont !== 'Standard') {
          setFont('Standard');
          // try rendering with Standard shortly after
          setTimeout(() => { void render(text, 'Standard'); }, 60);
        }
      } else {
        setArt(`figlet error: ${msg}`);
      }
    } finally {
      setLoading(false);
    }
  }

  // live preview (debounced)
  useEffect(() => {
    const t = setTimeout(() => { void render(); }, 120);
    return () => clearTimeout(t);
  }, [input, font]);

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(art);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch (e) {
      /* ignore */
    }
  };

  const onDownload = () => {
    const blob = new Blob([art], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(input || 'figlet').replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const onInsertToRepl = () => {
    window.dispatchEvent(new CustomEvent('nowon:insert-into-clack', { detail: { text: art } }));
  };

  const onRunNativeDemo = async () => {
    const cmd = 'npm run opentui:figlet';
    try {
      await navigator.clipboard.writeText(cmd);
      setArt((a) => `${a}\n\n[Native demo command copied to clipboard: ${cmd}]`);
    } catch (e) {
      // fallback: append as note to the preview area
      setArt((a) => `${a}\n\nRun this in a terminal: ${cmd}`);
    }
  };

  // preload fonts (progress + persistence)
  async function preloadFonts(names?: string[]) {
    setPreloading(true);
    setPreloadProgress(0);
    try {
      const figletModule = await import('figlet');
      const figlet = (figletModule && (figletModule as any).default) || (figletModule as any);
      // ensure fontPath respects base (prefer Vite BASE_URL)
      const _base = (() => {
        const viteBase = (import.meta as any).env?.BASE_URL;
        if (typeof viteBase === 'string' && viteBase !== '/') return viteBase.replace(/\/$/, '');
        try { const p = new URL(document.baseURI).pathname; const seg = p.split('/').filter(Boolean)[0]; return seg ? `/${seg}` : ''; } catch (e) { return ''; }
      })();
      const _fontPath = `${_base}/fonts`;
      try { figlet.defaults && figlet.defaults({ fontPath: _fontPath, fetchFontIfMissing: true }); } catch (e) { /* ignore */ }

      const list = names && names.length ? names : await new Promise<string[]>((res, rej) => figlet.fonts((err: any, l: string[]) => (err ? rej(err) : res(l))));
      for (let i = 0; i < list.length; i++) {
        try {
          // loadFont will fetch+parse and cache inside figlet
          // eslint-disable-next-line no-await-in-loop
          await figlet.loadFont(list[i]);
        } catch (e) {
          // ignore single-font failures
        }
        const pct = Math.round(((i + 1) / list.length) * 100);
        setPreloadProgress(pct);
      }
      localStorage.setItem('figlet-fonts-preloaded', '1');
      setPreloaded(true);
    } catch (err) {
      console.error('preloadFonts error', err);
    } finally {
      setPreloading(false);
      setTimeout(() => setPreloadProgress(0), 600);
    }
  }

  // UI helper to start full preload (user-initiated)
  function onPreloadAllFonts() {
    if (preloading) return;
    void preloadFonts();
  }

  // background: preload a small set of popular fonts quietly (do not mark full preloaded)
  useEffect(() => {
    if (preloaded) return;
    const timer = setTimeout(async () => {
      try {
        const popular = ['Standard', 'Slant', 'Small', 'Ghost', 'Colossal', 'Banner'];
        await preloadFonts(popular);
        // do NOT set the full preloaded marker here — user-run preloads mark that flag
      } catch (e) {
        /* ignore */
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, [preloaded]);

  return (
    <div style={{ padding: 16 }} className="cli-card">
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 8 }}>
        <strong>Figlet generator (client-side)</strong>
        <div style={{ marginLeft: 'auto', color: 'var(--muted)', fontSize: 13 }}>{loading ? 'Rendering…' : 'Live preview'}</div>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 12, alignItems: 'stretch' }}>
        <input
          aria-label="Figlet text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          style={{ flex: 1, padding: '8px 10px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.04)', background: 'transparent', color: 'inherit', fontFamily: 'Hack, monospace' }}
        />

        <select value={font} onChange={(e) => setFont(e.target.value)} style={{ minWidth: 160, padding: '8px 10px', borderRadius: 8, background: 'transparent', border: '1px solid rgba(255,255,255,0.04)', color: 'inherit' }}>
          {fonts.map((f) => (
            <option key={f} value={f}>{f}</option>
          ))}
        </select>

        <button className="btn" onClick={() => void render()} style={{ whiteSpace: 'nowrap' }} disabled={loading}>{loading ? 'Rendering…' : 'Render'}</button>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 12, alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <label style={{ color: 'var(--muted)', fontSize: 13, minWidth: 36 }}>Size</label>
          <input type="range" min={8} max={40} value={fontSize} onChange={(e) => setFontSize(Number(e.target.value))} style={{ width: 140 }} />
          <input type="number" value={fontSize} onChange={(e) => setFontSize(Number(e.target.value || 0))} style={{ width: 64, padding: '6px 8px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.04)', background: 'transparent', color: 'inherit', textAlign: 'center' }} />
        </div>

        <button className="btn ghost" onClick={onPreloadAllFonts} disabled={preloading || preloaded} title="Preload all FIGlet fonts to avoid any runtime downloads">
          {preloaded ? 'Fonts preloaded' : preloading ? `Preloading (${preloadProgress}%)` : 'Preload fonts'}
        </button>

        <button className="btn ghost" onClick={() => void onRunNativeDemo()} title="Copy command to run native OpenTUI Figlet demo">Run native demo</button>

        <button className="btn ghost" onClick={onCopy} disabled={!art}>{copied ? 'Copied' : 'Copy'}</button>
        <button className="btn ghost" onClick={onDownload} disabled={!art}>Download .txt</button>
        <button className="btn ghost" onClick={onInsertToRepl} disabled={!art}>Insert into REPL</button>
        <button className="btn ghost" onClick={() => { setInput(''); setArt(''); }} style={{ marginLeft: 'auto' }}>Clear</button>
      </div>

      {preloading && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ height: 8, background: 'rgba(255,255,255,0.03)', borderRadius: 6, overflow: 'hidden' }}>
            <div style={{ width: `${preloadProgress}%`, height: '100%', background: 'linear-gradient(90deg,#00e6a8,#7b61ff)' }} />
          </div>
          <div style={{ color: 'var(--muted)', fontSize: 12, marginTop: 6 }}>{preloadProgress}% loaded</div>
        </div>
      )}

      <div style={{ borderRadius: 8, padding: 12, background: 'rgba(0,0,0,0.04)', minHeight: 120, whiteSpace: 'pre', fontFamily: "'Hack','VT323',monospace", overflow: 'auto' }}>
        <pre className="ascii-pre neon" style={{ margin: 0, whiteSpace: 'pre', fontSize: fontSize }}>{art || 'Type text above to preview Figlet ASCII — choose a font.'}</pre>
      </div>

      <div style={{ marginTop: 10, color: 'var(--muted)', fontSize: 13 }}>Tip: use <code>/figlet &lt;text&gt;</code> in the Console demo or press <strong>Insert into REPL</strong> to paste the ASCII into the Clack console.</div>
    </div>
  );
}
