
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
  const [figletMode, setFigletMode] = useState(true);
  const [showFontModal, setShowFontModal] = useState(false);
  const [availableFonts, setAvailableFonts] = useState<string[]>([]);
  const [fontSize, setFontSize] = useState(12);
  const [streaming, setStreaming] = useState(false);
  // OpenTUI-style demo samples (rendered above the message list)
  // sample banners (OpenTUI‑style) – hidden by default since they can clutter the ui
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
  useEffect(() => {
    if (msgsRef.current) {
      msgsRef.current.scrollTop = msgsRef.current.scrollHeight;
    }
  }, [messages, streaming]);

  // Load available fonts once
  useEffect(() => {
    import('figlet').then(figletModule => {
      const figlet = (figletModule && (figletModule as any).default) || (figletModule as any);
      figlet.fonts((err: any, fonts: string[]) => {
        if (!err && fonts) setAvailableFonts(fonts);
      });
    });
  }, []);

  // load font list + auto-preload all fonts in background (user requested)
  // --- Helpers ---
  function push(m: Omit<Msg, 'id'>) {
    setMessages((s) => [...s, { id: uid(), ...m }]);
  }

  // --- Command handler ---
  const handleCommand = (cmd: string) => {
        // Hacker News command
        if (cmd.trim().toLowerCase() === 'hn' || cmd.trim().toLowerCase() === 'hackernews') {
          push({ role: 'system', text: 'Fetching top Hacker News stories...' });
          fetch('https://hacker-news.firebaseio.com/v0/topstories.json')
            .then(res => res.json())
            .then(async (ids) => {
              const top10 = ids.slice(0, 10);
              const stories = await Promise.all(top10.map((id: number) =>
                fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`).then(r => r.json())
              ));
              let out = stories.map((s: any, i: number) => {
                const url = s.url || 'https://news.ycombinator.com/item?id=' + s.id;
                return `${i + 1}. ${s.title} [${s.score}★]\n    <a href='${url}' target='_blank' rel='noopener noreferrer'>${url}</a>`;
              }).join('\n\n');
              push({ role: 'assistant', text: '\nHacker News Top Stories:\n\n' + out });
            })
            .catch(() => push({ role: 'assistant', text: 'Failed to fetch Hacker News.' }));
          return;
        }
    const text = cmd.trim();
    if (!text) return;
    push({ role: 'user', text });
    const [name, ...args] = text.split(/\s+/);
    if (name === 'clear') {
      setMessages([{ id: uid(), role: 'system', text: 'Figlet TUI — type `help` for commands.' }]);
      return;
    }
    if (name === 'help') {
      push({ role: 'system', text: 'Commands: figlet [-s] <text>, font <name>, font-select, figlet-mode, size <n>, list-fonts [q], clear, help' });
      return;
    }
    if (name === 'figlet-mode') {
      setFigletMode(v => !v);
      push({ role: 'system', text: 'Figlet mode is now'+ ` ${!figletMode ? 'ON' : 'OFF'}` });
      return;
    }
    if (name === 'font-select') {
      setShowFontModal(true);
      return;
    }
    if (name === 'font' && args.length > 0) {
      setFont(args.join(' '));
      push({ role: 'system', text: `Font set to: ${args.join(' ')}` });
      return;
    }
    // If figletMode is ON and not a recognized command, treat as figlet
    if (figletMode && name !== 'figlet' && name !== 'font' && name !== 'font-select' && name !== 'clear' && name !== 'help' && name !== 'figlet-mode') {
      import('figlet').then(figletModule => {
        const figlet = (figletModule && (figletModule as any).default) || (figletModule as any);
        figlet.text(text, { font: font }, (err: any, data: string) => {
          if (err || !data) {
            push({ role: 'assistant', text: 'Error rendering figlet.' });
          } else {
            push({ role: 'assistant', text: '\n' + data });
          }
        });
      }).catch(() => {
        push({ role: 'assistant', text: 'Figlet library not found.' });
      });
      return;
    }
    if (name === 'figlet') {
      // Dynamically import figlet and render ASCII art
      import('figlet').then(figletModule => {
        const figlet = (figletModule && (figletModule as any).default) || (figletModule as any);
        const figletText = args.join(' ');
        figlet.text(figletText, { font: font }, (err: any, data: string) => {
          if (err || !data) {
            push({ role: 'assistant', text: 'Error rendering figlet.' });
          } else {
            // Add extra line break for clearance
            push({ role: 'assistant', text: '\n' + data });
          }
        });
      }).catch(() => {
        push({ role: 'assistant', text: 'Figlet library not found.' });
      });
      return;
    }
    // Minimal: echo command
    push({ role: 'assistant', text: `You typed: ${text}` });
  };

  // --- Render ---
  return (
    <div className="ai-tui" style={{ minHeight: 320, height: '80vh', maxHeight: '80vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', background: '#181828', color: '#fff' }}>
      {/* Font Selection Modal */}
      {showFontModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#222', color: '#fff', borderRadius: 10, padding: 24, minWidth: 320, maxHeight: '70vh', overflowY: 'auto', boxShadow: '0 4px 32px #0008' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <strong>Select a Font</strong>
              <button onClick={() => setShowFontModal(false)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: 20, cursor: 'pointer' }}>&times;</button>
            </div>
            <div style={{ maxHeight: 320, overflowY: 'auto' }}>
              {availableFonts.length === 0 && <div>Loading fonts...</div>}
              {availableFonts.map(f => (
                <div key={f} style={{ padding: '6px 0', cursor: 'pointer', color: f === font ? '#7b61ff' : '#fff', fontWeight: f === font ? 'bold' : 'normal' }}
                  onClick={() => {
                    setFont(f);
                    setShowFontModal(false);
                    push({ role: 'system', text: `Font set to: ${f}` });
                    setTimeout(() => { inputRef.current?.focus(); }, 0);
                  }}>
                  {f}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      <div className="tui-header" style={{ padding: 16, borderBottom: '1px solid #333', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <strong>Figlet TUI</strong>
          <div style={{ fontSize: 12, color: '#aaa' }}>
            Type text and press Enter — Figlet mode is
            <span
              style={{ marginLeft: 6, fontWeight: 'bold', userSelect: 'none', fontSize: 14 }}
            >
              <span
                onClick={() => {
                  setFigletMode(v => !v);
                  push({ role: 'system', text: `Figlet mode is now ${!figletMode ? 'ON' : 'OFF'}` });
                }}
                style={{
                  color: figletMode ? '#0f0' : '#f44',
                  cursor: 'pointer',
                  borderBottom: '1px dotted ' + (figletMode ? '#0f0' : '#f44'),
                  padding: '0 4px',
                  transition: 'color 0.2s, border-color 0.2s'
                }}
                title="Click to toggle Figlet mode"
              >
                {figletMode ? 'ON' : 'OFF'}
              </span>
            </span>
          </div>
        </div>
      </div>
      <div ref={msgsRef} style={{ flex: 1, overflow: 'auto', padding: 16, fontSize: 13 }}>
        {messages.map((m) => (
          <div key={m.id} style={{ marginBottom: 8 }}>
            <span style={{ color: m.role === 'user' ? '#0ff' : m.role === 'assistant' ? '#7b61ff' : '#aaa', fontWeight: 'bold' }}>{m.role}:</span>
            {m.role === 'assistant' && m.text.trim().startsWith('Hacker News Top Stories:') ? (
              <span
                style={{ display: 'block', marginLeft: 8, fontSize: 12 }}
                dangerouslySetInnerHTML={{
                  __html: m.text
                    // Color links and shorten to domain
                    .replace(/<a ([^>]+)>([^<]+)<\/a>/g, (match, attrs, text) => {
                      const colors = ['#ffb347', '#00eaff', '#fff68f', '#ff5e5e', '#7b61ff'];
                      let color = colors[Math.floor(Math.random() * colors.length)];
                      const rankMatch = text.match(/^\d+\./);
                      if (rankMatch) {
                        const rank = parseInt(rankMatch[0], 10);
                        color = colors[(rank - 1) % colors.length];
                      }
                      // Extract href
                      const hrefMatch = attrs.match(/href=['"]([^'"]+)['"]/);
                      let domain = text;
                      if (hrefMatch) {
                        try {
                          const url = new URL(hrefMatch[1]);
                          domain = url.hostname.replace(/^www\./, '');
                        } catch {}
                      }
                      return `<a ${attrs} style="color: ${color}; font-weight: bold; text-decoration: underline;">${domain}</a>`;
                    })
                    // Split articles onto new lines
                    .replace(/\n\n/g, '<br/><br/>')
                    .replace(/(\d+\. .+?)<br\/>/g, '$1<br/>')
                }}
              />
            ) : (
              <pre style={{ display: 'inline', marginLeft: 8, fontSize: 13 }}>{m.text}</pre>
            )}
          </div>
        ))}
      </div>
      <form style={{ display: 'flex', borderTop: '1px solid #333', padding: 12 }} onSubmit={e => { e.preventDefault(); handleCommand(input); setInput(''); }}>
        <input
          ref={inputRef}
          className="tui-input"
          value={input}
          onChange={e => setInput(e.target.value)}
          style={{ flex: 1, padding: '8px 12px', borderRadius: 6, border: '1px solid #444', background: '#222', color: '#fff', marginRight: 8 }}
          placeholder="Type command — try: figlet hello"
        />
        <button type="submit" className="btn" style={{ padding: '8px 16px', borderRadius: 6, background: '#7b61ff', color: '#fff', border: 'none' }}>Send</button>
      </form>
    </div>
  );
}
