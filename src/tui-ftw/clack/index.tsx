import React, { useEffect, useRef, useState } from 'react';

type Role = 'user' | 'assistant' | 'system';
type Msg = { id: string; role: Role; text: string };

const uid = (p = '') => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}${p}`;

export default function ClackDemo(): JSX.Element {
  const [messages, setMessages] = useState<Msg[]>([
    { id: uid(), role: 'system', text: 'Client-side @clack streaming demo — press Enter to send, Ctrl+C to cancel.' },
  ]);
  const [input, setInput] = useState('Give me a playful one‑line summary of nowon');
  const [streaming, setStreaming] = useState(false);
  const cancelRef = useRef(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const msgsRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  useEffect(() => {
    msgsRef.current?.scrollTo({ top: msgsRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, streaming]);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const push = (m: Omit<Msg, 'id'>) => setMessages((s) => [...s, { id: uid(), ...m }]);
  const replaceLast = (fn: (prev: Msg) => Msg) => setMessages((s) => (s.length ? [...s.slice(0, -1), fn(s[s.length - 1])] : s));

  async function simulateStreamResponse(prompt: string) {
    setStreaming(true);
    cancelRef.current = false;

    const assistantId = uid('a');
    setMessages((s) => [...s, { id: assistantId, role: 'assistant', text: '' }]);

    // simple deterministic 'stream' content (client-only)
    const base = `Streaming reply for: "${prompt}" — this is a client-side simulation of @clack/prompts stream.`;
    const extra = ' It supports cancel (Ctrl+C), task logs, and a typing-like streaming animation.';
    const reply = (base + extra).repeat(1);

    for (let i = 0; i < reply.length; i += 6) {
      if (cancelRef.current) {
        // mark cancelled and stop
        setMessages((s) => s.map((m) => (m.id === assistantId ? { ...m, text: m.text + '\n\n[stream cancelled]' } : m)));
        setStreaming(false);
        return;
      }
      const chunk = reply.slice(i, i + 6);
      setMessages((s) => s.map((m) => (m.id === assistantId ? { ...m, text: m.text + chunk } : m)));
      // small random delay to simulate streaming
      // eslint-disable-next-line no-await-in-loop
      await new Promise((r) => setTimeout(r, 20 + Math.random() * 40));
    }

    setStreaming(false);
  }

  function cancelStream() {
    if (!streaming) return;
    cancelRef.current = true;
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // only intercept when our demo container is focused (or inside it)
      const el = document.activeElement;
      if (!containerRef.current || !containerRef.current.contains(el)) return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c') {
        e.preventDefault();
        cancelStream();
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        cancelStream();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [streaming]);

  // listen for external insert events (figlet demo -> paste into REPL input)
  useEffect(() => {
    const onInsert = (ev: Event) => {
      const detail = (ev as CustomEvent)?.detail;
      if (!detail || typeof detail.text !== 'string') return;
      setInput(String(detail.text));
      setHistoryIndex(-1);
      inputRef.current?.focus();
    };
    window.addEventListener('nowon:insert-into-clack', onInsert as EventListener);
    return () => window.removeEventListener('nowon:insert-into-clack', onInsert as EventListener);
  }, []);

  async function onSend() {
    const trimmed = input.trim();
    if (!trimmed) return;
    // slash commands
    if (trimmed.startsWith('/')) {
      const [cmd, ...rest] = trimmed.split(' ');
      const arg = rest.join(' ');

      if (cmd === '/figlet') {
        const text = arg || 'nowon';
        push({ role: 'assistant', text: 'Generating ASCII...' });
        try {
          const figletModule = await import('figlet');
          const figlet = (figletModule && (figletModule as any).default) || (figletModule as any);
          const _base = (() => {
            const viteBase = (import.meta as any).env?.BASE_URL;
            if (typeof viteBase === 'string' && viteBase !== '/') return viteBase.replace(/\/$/, '');
            try { const p = new URL(document.baseURI).pathname; const seg = p.split('/').filter(Boolean)[0]; return seg ? `/${seg}` : ''; } catch (e) { return ''; }
          })();
          const _fontPath = `${_base}/fonts`;
          try { figlet.defaults && figlet.defaults({ fontPath: _fontPath, fetchFontIfMissing: true }); } catch (e) { /* ignore */ }
          const render = (t: string, opts = { horizontalLayout: 'default' }) =>
            new Promise<string>((resolve, reject) => figlet.text(t, opts as any, (err: any, data: string) => (err ? reject(err) : resolve(data)))) ;

          let art: string;
          try {
            art = await render(text);
          } catch (innerErr: any) {
            const msg = String(innerErr?.message || innerErr);
            // specific FONT header parse issue — try a safe fallback
            if (msg.includes('FIGlet header contains invalid values')) {
              try {
                art = await render(text, { font: 'Standard', horizontalLayout: 'default' } as any);
                setMessages((s) => {
                  const next = s.slice();
                  next[next.length - 1] = {
                    id: uid(),
                    role: 'assistant',
                    text: art + '\n\n[rendered with fallback font: Standard — original font header invalid]',
                  };
                  return next;
                });
                setInput('');
                inputRef.current?.focus();
                return;
              } catch (retryErr) {
                // fall through to outer catch
                throw innerErr;
              }
            }
            throw innerErr;
          }

          // replace the provisional assistant message with the successful art
          setMessages((s) => {
            const next = s.slice();
            next[next.length - 1] = { id: uid(), role: 'assistant', text: art };
            return next;
          });
        } catch (err: any) {
          const msg = String(err?.message || String(err));
          const friendly = msg.includes('FIGlet header contains invalid values')
            ? `${msg} — try the Figlet demo and select a different font.`
            : msg;
          setMessages((s) => {
            const next = s.slice();
            next[next.length - 1] = { id: uid(), role: 'assistant', text: `figlet error: ${friendly}` };
            return next;
          });
        } finally {
          setInput('');
          inputRef.current?.focus();
        }
        return;
      }

      if (cmd === '/clear') {
        setMessages([{ id: uid(), role: 'system', text: 'Console cleared.' }]);
        setHistory([]);
        setHistoryIndex(-1);
        setInput('');
        inputRef.current?.focus();
        return;
      }
      if (cmd === '/help') {
        push({ role: 'system', text: 'Commands: /help, /clear, /history, /figlet <text>' });
        setInput('');
        inputRef.current?.focus();
        return;
      }
      if (cmd === '/history') {
        push({ role: 'system', text: history.length ? history.join('\n') : 'No history' });
        setInput('');
        inputRef.current?.focus();
        return;
      }
      push({ role: 'system', text: `Unknown command: ${cmd}` });
      setInput('');
      inputRef.current?.focus();
      return;
    }

    push({ role: 'user', text: trimmed });
    setHistory((h) => [...h, trimmed].slice(-100));
    setHistoryIndex(-1);
    setInput('');
    inputRef.current?.focus();
    void simulateStreamResponse(trimmed);
  }

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      push({ role: 'system', text: `Uploaded ${f.name} (${Math.round((String(reader.result || '').length) / 1024)} KB)` });
    };
    reader.readAsText(f);
    e.currentTarget.value = '';
  }

  return (
    <div className="ai-tui" ref={containerRef} role="region" aria-label="@clack demo">
      <div className="tui-header">
        <div className="tui-left">
          <strong>@clack/prompts — client demo</strong>
          <div style={{ fontSize: 12, color: 'var(--muted)' }}>Streaming + cancel (Ctrl+C)</div>
        </div>
        <div className="tui-controls">
          <input className="tui-key" placeholder="(session only)" style={{ minWidth: 160 }} disabled value="demo-key-not-required" />
          <label className="btn ghost" style={{ padding: '6px 8px', borderRadius: 8 }}>
            Upload
            <input type="file" onChange={onFile} style={{ display: 'none' }} />
          </label>
          <button className="btn ghost" onClick={() => { setMessages([{ id: uid(), role: 'system', text: 'Cleared demo messages.' }]); setHistory([]); setHistoryIndex(-1); inputRef.current?.focus(); }}>
            Clear
          </button>
        </div>
      </div>

      <div className="tui-messages" ref={msgsRef}>
        {messages.map((m) => (
          <div key={m.id} className={`tui-message tui-${m.role}`}>
            <div className="tui-meta">{m.role === 'user' ? 'nowon>' : m.role}</div>
            <pre className="tui-text">{m.text || (m.role === 'assistant' && streaming ? '…' : '')}</pre>
          </div>
        ))}
      </div>

      <div className="tui-input-row">
        <input
          ref={inputRef}
          className="tui-input"
          value={input}
          onChange={(e) => { setInput(e.target.value); setHistoryIndex(-1); }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') { e.preventDefault(); onSend(); return; }
            if (e.key === 'ArrowUp') {
              e.preventDefault();
              if (history.length === 0) return;
              const next = historyIndex === -1 ? history.length - 1 : Math.max(0, historyIndex - 1);
              setHistoryIndex(next);
              setInput(history[next]);
              return;
            }
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              if (history.length === 0) return;
              if (historyIndex === -1) { setInput(''); return; }
              const next = historyIndex + 1;
              if (next >= history.length) { setHistoryIndex(-1); setInput(''); }
              else { setHistoryIndex(next); setInput(history[next]); }
              return;
            }
          }}
          placeholder="Type and press Enter — use /help or /clear"
        />
        <button className="btn" onClick={onSend} disabled={streaming}>{streaming ? 'Streaming…' : 'Send'}</button>
        <button className="btn ghost" onClick={cancelStream} disabled={!streaming}>Cancel (Ctrl+C)</button>
      </div>

      <div className="tui-hint">Hints: press <kbd>Enter</kbd> to send · <kbd>Ctrl</kbd>+<kbd>C</kbd> to cancel streaming · Try <code>/figlet hello</code> · Upload adds memory (mock)</div>
    </div>
  );
}
