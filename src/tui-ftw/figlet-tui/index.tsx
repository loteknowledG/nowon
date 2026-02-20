import React, { useEffect, useRef, useState } from 'react';

type Role = 'user' | 'assistant' | 'system';
type Msg = { id: string; role: Role; text: string };
const uid = (p = '') => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}${p}`;

export default function FigletTui(): JSX.Element {
  const [messages, setMessages] = useState<Msg[]>([{ id: uid(), role: 'system', text: 'Figlet TUI — type `help` for commands. Try: `figlet hello`' }]);
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [fonts, setFonts] = useState<string[]>([]);
  const [font, setFont] = useState('Standard');
  const [fontSize, setFontSize] = useState(12);
  const [streaming, setStreaming] = useState(false);
  // OpenTUI-style demo samples (rendered above the message list)
  const [samples, setSamples] = useState<{ font: string; art: string; color: string; size: number }[]>([]);

  // UI: filterable font list to mimic OpenTUI ASCII Font demo
  const [fontFilter, setFontFilter] = useState('');
  const [fontListOpen, setFontListOpen] = useState(true);
  const fontListRef = useRef<HTMLDivElement | null>(null);

  const cancelRef = useRef(false);
  const msgsRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [preloading, setPreloading] = useState(false);
  const [preloadProgress, setPreloadProgress] = useState(0);

  useEffect(() => { inputRef.current?.focus(); }, []);
  useEffect(() => { msgsRef.current?.scrollTo({ top: msgsRef.current.scrollHeight, behavior: 'smooth' }); }, [messages, streaming]);

  // load font list + auto-preload all fonts in background (user requested)
  useEffect(() => {
    (async () => {
      try {
        const figletModule = await import('figlet');
        const figlet = (figletModule && (figletModule as any).default) || (figletModule as any);
        // respect Vite base (import.meta.env.BASE_URL) or derive root segment from document.baseURI
        const _base = (() => {
          const viteBase = (import.meta as any).env?.BASE_URL;
          if (typeof viteBase === 'string' && viteBase !== '/') return viteBase.replace(/\/$/, '');
          try { const p = new URL(document.baseURI).pathname; const seg = p.split('/').filter(Boolean)[0]; return seg ? `/${seg}` : ''; } catch (e) { return ''; }
        })();
        try { figlet.defaults && figlet.defaults({ fontPath: `${_base}/fonts`, fetchFontIfMissing: true }); } catch (e) { /* ignore */ }
        const list: string[] = await new Promise((res, rej) => figlet.fonts((err: any, l: string[]) => (err ? rej(err) : res(l))));
        setFonts(list);
        setFont((f) => f || list[0] || 'Standard');

        // generate OpenTUI-style samples (non-blocking)
        ;(async () => {
          try {
            const samplesToLoad = [
              { font: 'Banner3-D', text: 'FONTS', color: '#FF8A8A', size: 48 },
              { font: 'Tiny', text: 'TINY FONT DEMO', color: '#FFFFFF', size: 14 },
              { font: 'Block', text: 'HI 2025', color: '#FFD54F', size: 32 },
              { font: 'Shade', text: 'SHADE FONT DEMO', color: '#FFFFFF', size: 14 },
            ];
            const arts: { font: string; art: string; color: string; size: number }[] = [];
            for (const s of samplesToLoad) {
              try {
                // ensure font is available then render sample
                // eslint-disable-next-line no-await-in-loop
                await figlet.loadFont(s.font).catch(() => {});
                // eslint-disable-next-line no-await-in-loop
                const art = await new Promise<string>((res, rej) =>
                  figlet.text(s.text, { font: s.font }, (e: any, d: string) => (e ? rej(e) : res(d))),
                );
                arts.push({ font: s.font, art, color: s.color, size: s.size });
              } catch (e) {
                // ignore single-sample failures
              }
            }
            if (!cancelRef.current) setSamples(arts);
          } catch (e) {
            // ignore
          }
        })();

        // pick first loaded font as the default selected font in the selector list
        setTimeout(() => {
          setFont((prev) => prev || (list && list.length ? list[0] : 'Standard'));
        }, 10);

        // auto preload ALL fonts in background (per your instruction)
        if (!localStorage.getItem('figlet-fonts-preloaded')) {
          void (async () => {
            try {
              setPreloading(true);
              for (let i = 0; i < list.length; i++) {
                if (cancelRef.current) break;
                // eslint-disable-next-line no-await-in-loop
                await figlet.loadFont(list[i]).catch(() => {});
                setPreloadProgress(Math.round(((i + 1) / list.length) * 100));
              }
              localStorage.setItem('figlet-fonts-preloaded', '1');
            } finally {
              setPreloading(false);
              setTimeout(() => setPreloadProgress(0), 500);
            }
          })();
        }
      } catch (err) {
        // ignore
      }
    })();
  }, []);

  function push(m: Omit<Msg, 'id'>) {
    setMessages((s) => [...s, { id: uid(), ...m }]);
  }

  async function runFiglet(text: string, opts?: { stream?: boolean }) {
    const t = text || '';
    push({ role: 'user', text: `figlet ${t}` });
    const figletModule = await import('figlet');
    const figlet = (figletModule && (figletModule as any).default) || (figletModule as any);
    // ensure fontPath respects Vite base or derive the app root
    const _base = (() => {
      const viteBase = (import.meta as any).env?.BASE_URL;
      if (typeof viteBase === 'string' && viteBase !== '/') return viteBase.replace(/\/$/, '');
      try { const p = new URL(document.baseURI).pathname; const seg = p.split('/').filter(Boolean)[0]; return seg ? `/${seg}` : ''; } catch (e) { return ''; }
    })();
    try { figlet.defaults && figlet.defaults({ fontPath: `${_base}/fonts`, fetchFontIfMissing: true }); } catch (e) { /* ignore */ }

    if (opts?.stream) {
      setStreaming(true);
      cancelRef.current = false;
      const id = uid('a');
      setMessages((s) => [...s, { id, role: 'assistant', text: '' }]);
      try {
        // attempt render; if font/header/network error happens, retry with Standard
        let art: string;
        try {
          art = await new Promise((resolve, reject) => figlet.text(t || ' ', { font }, (err: any, data: string) => (err ? reject(err) : resolve(data))));
        } catch (innerErr: any) {
          const msg = String(innerErr?.message || innerErr || '');
          if (msg.includes('FIGlet header contains invalid values') || msg.includes('Network response was not ok')) {
            try {
              await figlet.loadFont('Standard');
              art = await new Promise<string>((resolve, reject) => figlet.text(t || ' ', { font: 'Standard' }, (e: any, d: string) => (e ? reject(e) : resolve(d))));
              // annotate fallback in-stream
              art = art + '\n\n[fallback: rendered with Standard because the selected font failed]';
            } catch (retryErr) {
              throw retryErr || innerErr;
            }
          } else {
            throw innerErr;
          }
        }

        for (let i = 0; i < art.length; i += 4) {
          if (cancelRef.current) {
            setMessages((s) => s.map((m) => (m.id === id ? { ...m, text: m.text + '\n[stream cancelled]' } : m)));
            setStreaming(false);
            return;
          }
          const chunk = art.slice(i, i + 4);
          setMessages((s) => s.map((m) => (m.id === id ? { ...m, text: m.text + chunk } : m)));
          // eslint-disable-next-line no-await-in-loop
          await new Promise((r) => setTimeout(r, 12 + Math.random() * 30));
        }
      } catch (err: any) {
        const emsg = String(err?.message || String(err));
        setMessages((s) => { const next = s.slice(); next[next.length - 1] = { id: uid(), role: 'assistant', text: `figlet error: ${emsg}` }; return next; });
        // run a quick diagnostic on the font URL (helps detect HTML/404/service-worker issues)
        (async () => {
          try {
            const _base = (() => {
              const viteBase = (import.meta as any).env?.BASE_URL;
              if (typeof viteBase === 'string' && viteBase !== '/') return viteBase.replace(/\/$/, '');
              try { const p = new URL(document.baseURI).pathname; const seg = p.split('/').filter(Boolean)[0]; return seg ? `/${seg}` : ''; } catch (e) { return ''; }
            })();
            const url = `${_base}/fonts/${encodeURIComponent(font)}.flf`;
            const r = await fetch(url, { cache: 'no-cache' });
            const body = await r.text();
            const snippet = body.slice(0, 200).replace(/\s+/g, ' ').trim();
            const isHtml = /<!doctype|<html|<meta|<script/i.test(snippet);
            setMessages((s) => [...s, { id: uid(), role: 'system', text: `font URL: ${url} — status: ${r.status}${isHtml ? ' (HTML returned)' : ''}` }, { id: uid(), role: 'system', text: `response snippet: ${snippet}` }]);
          } catch (e) {
            setMessages((s) => [...s, { id: uid(), role: 'system', text: `font diagnostic failed: ${String(e)}` }]);
          }
        })();
      } finally {
        setStreaming(false);
      }
      return;
    }

    try {
      // try render; on font/header/network errors attempt a safe fallback to Standard
      let art: string;
      try {
        art = await new Promise((resolve, reject) => figlet.text(t || ' ', { font }, (err: any, data: string) => (err ? reject(err) : resolve(data))));
      } catch (innerErr: any) {
        const msg = String(innerErr?.message || innerErr || '');
        if (msg.includes('FIGlet header contains invalid values') || msg.includes('Network response was not ok')) {
          try {
            // ensure Standard is loaded then render with it
            // eslint-disable-next-line no-await-in-loop
            await figlet.loadFont('Standard');
            const fallback = await new Promise<string>((resolve, reject) => figlet.text(t || ' ', { font: 'Standard' }, (e: any, d: string) => (e ? reject(e) : resolve(d))));
            push({ role: 'assistant', text: fallback + '\n\n[fallback: rendered with Standard because the selected font failed]'});
            return;
          } catch (retryErr) {
            // fall through to outer error handler
            innerErr = retryErr || innerErr;
          }
        }
        throw innerErr;
      }

      push({ role: 'assistant', text: art });
    } catch (err: any) {
      const emsg = String(err?.message || String(err));
      push({ role: 'assistant', text: `figlet error: ${emsg}` });
      (async () => {
        try {
          const _base = (() => { try { const p = new URL(document.baseURI).pathname; return p.endsWith('/') ? p.slice(0, -1) : p; } catch (e) { return ''; } })();
          const url = `${_base}/fonts/${encodeURIComponent(font)}.flf`;
          const r = await fetch(url, { cache: 'no-cache' });
          const body = await r.text();
          const snippet = body.slice(0, 200).replace(/\s+/g, ' ').trim();
          const isHtml = /<!doctype|<html|<meta|<script/i.test(snippet);
          push({ role: 'system', text: `font URL: ${url} — status: ${r.status}${isHtml ? ' (HTML returned)' : ''}` });
          push({ role: 'system', text: `response snippet: ${snippet}` });
        } catch (e) {
          push({ role: 'system', text: `font diagnostic failed: ${String(e)}` });
        }
      })();
    }
  }

  function handleCommand(raw: string) {
    const cmd = raw.trim();
    if (!cmd) return;
    const parts = cmd.split(/\s+/);
    const name = parts[0].toLowerCase();
    const rest = parts.slice(1).join(' ');

    if (name === 'help') {
      push({ role: 'system', text: 'Commands: figlet [-s] <text>, font <name>, size <n>, list-fonts [q], clear, help' });
      return;
    }
    if (name === 'clear') { setMessages([{ id: uid(), role: 'system', text: 'Figlet TUI — type `help` for commands.' }]); return; }

    if (name === 'font') {
      if (!rest) { push({ role: 'system', text: `current font: ${font}` }); return; }
      if (!fonts.includes(rest)) { push({ role: 'system', text: `font not found: ${rest}` }); return; }
      setFont(rest); push({ role: 'system', text: `font set to ${rest}` }); return;
    }
    if (name === 'size') {
      const n = Number(rest);
      if (!Number.isFinite(n) || n <= 0) { push({ role: 'system', text: `invalid size: ${rest}` }); return; }
      setFontSize(Math.max(6, Math.min(64, Math.round(n)))); push({ role: 'system', text: `size set to ${n}` }); return;
    }
    if (name === 'list-fonts') {
      const q = rest.toLowerCase();
      const matches = fonts.filter((f) => !q || f.toLowerCase().includes(q)).slice(0, 80);
      push({ role: 'system', text: matches.join(', ') || 'no matches' }); return;
    }
    // figlet command — supports `-s` or `--stream`
    if (name === 'figlet') {
      const stream = parts[1] === '-s' || parts[1] === '--stream';
      const text = stream ? parts.slice(2).join(' ') : parts.slice(1).join(' ');
      void runFiglet(text, { stream });
      return;
    }

    // unknown — treat as figlet text shorthand
    void runFiglet(cmd, {});
  }

  function onSend() {
    const t = input.trim();
    if (!t) return;
    setHistory((h) => [...h, t].slice(-200));
    setHistoryIndex(-1);
    setInput('');
    handleCommand(t);
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c') {
        if (streaming) { e.preventDefault(); cancelRef.current = true; }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [streaming]);

  return (
    <div className="ai-tui" role="region" aria-label="Figlet TUI demo" style={{ minHeight: 320 }}>
      <div className="tui-header">
        <div className="tui-left">
          <strong>Figlet TUI</strong>
          <div style={{ fontSize: 12, color: 'var(--muted)' }}>Type commands (e.g. <code>figlet hello</code>)</div>
        </div>
        <div className="tui-controls">
          <div style={{ color: 'var(--muted)', fontSize: 12 }}>{preloading ? `Preloading fonts ${preloadProgress}%` : 'Fonts preloaded: ' + (localStorage.getItem('figlet-fonts-preloaded') ? 'yes' : 'no')}</div>
          <div style={{ marginLeft: 12 }}>
            <button className="btn ghost" onClick={async () => { const cmd = 'npm run opentui:figlet'; try { await navigator.clipboard.writeText(cmd); push({ role: 'system', text: `Native demo command copied to clipboard: ${cmd}` }); } catch (e) { push({ role: 'system', text: `Run in terminal: ${cmd}` }); } }} style={{ whiteSpace: 'nowrap' }}>Run native demo</button>
          </div>
        </div>
      </div>

      {/* OpenTUI-like controls: filterable font list + live preview */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
        <div style={{ width: 260, background: 'rgba(255,255,255,0.01)', borderRadius: 8, padding: 8, border: '1px solid rgba(255,255,255,0.03)' }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
            <strong style={{ fontSize: 13 }}>Fonts</strong>
            <input
              placeholder="Filter fonts..."
              value={fontFilter}
              onChange={(e) => setFontFilter(e.target.value)}
              style={{ flex: 1, padding: '6px 8px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.03)', background: 'transparent', color: 'inherit' }}
            />
            <button className="btn ghost" onClick={() => setFontListOpen((v) => !v)} style={{ whiteSpace: 'nowrap' }}>{fontListOpen ? 'Hide' : 'Show'}</button>
          </div>

          {fontListOpen && (
            <div ref={fontListRef} style={{ maxHeight: 220, overflow: 'auto', fontFamily: "'Hack','VT323',monospace", fontSize: 13 }}>
              {fonts.filter((f) => !fontFilter || f.toLowerCase().includes(fontFilter.toLowerCase())).slice(0, 200).map((f) => (
                <div
                  key={f}
                  onClick={() => { setFont(f); push({ role: 'system', text: `font set to ${f}` }); }}
                  style={{ padding: '6px 8px', borderRadius: 6, background: f === font ? 'linear-gradient(90deg,#00e6a8,#7b61ff)' : 'transparent', color: f === font ? '#041024' : 'var(--muted)', cursor: 'pointer', marginBottom: 6 }}
                >
                  {f}
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ flex: 1 }}>
          {samples.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <pre className="ascii-pre neon" style={{ margin: 0, fontSize: samples[0].size }}>{samples[0].art}</pre>
              <div style={{ display: 'flex', gap: 12, marginTop: 8, alignItems: 'flex-start' }}>
                {samples.slice(1).map((s) => (
                  <pre key={s.font} className="ascii-pre" style={{ margin: 0, color: s.color, fontSize: s.size }}>{s.art}</pre>
                ))}
              </div>
            </div>
          )}

          {messages.map((m) => (
            <div key={m.id} className={`tui-message tui-${m.role}`}>
              <div className="tui-meta">{m.role === 'user' ? 'you>' : m.role}</div>
              <pre className="tui-text" style={{ fontSize: m.role === 'assistant' ? fontSize : undefined }}>{m.text}</pre>
            </div>
          ))}
        </div>
      </div>

      <div className="tui-input-row">
        <input
          ref={inputRef}
          className="tui-input"
          value={input}
          onChange={(e) => { setInput(e.target.value); setHistoryIndex(-1); }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') { e.preventDefault(); onSend(); return; }
            if (e.key === 'ArrowUp') { e.preventDefault(); if (history.length === 0) return; const next = historyIndex === -1 ? history.length - 1 : Math.max(0, historyIndex - 1); setHistoryIndex(next); setInput(history[next] || ''); return; }
            if (e.key === 'ArrowDown') { e.preventDefault(); if (history.length === 0) return; if (historyIndex === -1) { setInput(''); return; } const next = historyIndex + 1; if (next >= history.length) { setHistoryIndex(-1); setInput(''); } else { setHistoryIndex(next); setInput(history[next]); } return; }
            if (e.key === 'Tab') {
              // simple tab-complete for `font `
              if (input.startsWith('font ')) {
                e.preventDefault();
                const q = input.slice(5).toLowerCase();
                const match = fonts.find((f) => f.toLowerCase().startsWith(q));
                if (match) setInput(`font ${match}`);
              }
            }
          }}
          placeholder="Type command — try: figlet hello"
        />
        <button className="btn" onClick={onSend} disabled={streaming}>{streaming ? 'Streaming…' : 'Send'}</button>
        <button className="btn ghost" onClick={() => { cancelRef.current = true; setStreaming(false); }} disabled={!streaming}>Cancel (Ctrl+C)</button>
      </div>

      <div className="tui-hint">Hints: <kbd>Enter</kbd> send · <kbd>↑/↓</kbd> history · try <code>list-fonts</code> · <code>font Slant</code></div>
    </div>
  );
}
