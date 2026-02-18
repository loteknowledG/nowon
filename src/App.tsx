import React, { useEffect, useState } from 'react';

export default function App(): JSX.Element {
  const phrases = [
    'Computers & AI',
    'Secure agent platforms',
    'Automation & intelligence',
  ];
  const [text, setText] = useState('');
  const [pIdx, setPIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [deleting, setDeleting] = useState(false);
  const [theme, setTheme] = useState<string>(() => (localStorage.getItem('nowon-theme') === 'light' ? 'light' : 'dark'));

  useEffect(() => {
    if (theme === 'light') document.documentElement.dataset.theme = 'light';
    else delete document.documentElement.dataset.theme;
    localStorage.setItem('nowon-theme', theme === 'light' ? 'light' : 'dark');
  }, [theme]);

  useEffect(() => {
    let t = 80;
    const full = phrases[pIdx];
    if (deleting) t = 40;
    const timer = window.setTimeout(() => {
      if (!deleting) {
        setCharIdx((i) => i + 1);
        setText(full.slice(0, charIdx + 1));
        if (charIdx + 1 === full.length) setDeleting(true);
      } else {
        setCharIdx((i) => i - 1);
        setText(full.slice(0, Math.max(0, charIdx - 1)));
        if (charIdx - 1 <= 0) {
          setDeleting(false);
          setPIdx((pi) => (pi + 1) % phrases.length);
        }
      }
    }, deleting ? 80 : 120);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [charIdx, deleting, pIdx]);

  // effects-only: keep a canonical ASCII buffer and always retype from it
  const asciiArt = `  ,ggg,,ggg,     ,ggggg,   gg    gg    gg   ,ggggg,    ,ggg,,ggg,
 ,8" "8P" "8,   dP"  "Y8gggI8    I8    88bgdP"  "Y8ggg,8" "8P" "8,
 I8   8I   8I  i8'    ,8I  I8    I8    8I i8'    ,8I  I8   8I   8I
,dP   8I   Yb,,d8,   ,d8' ,d8,  ,d8,  ,8I,d8,   ,d8' ,dP   8I   Yb,
8P'   8I   \`Y8P"Y8888P"   P""Y88P""Y88P" P"Y8888P"   8P'   8I   \`Y8`;

  const [asciiIdx, setAsciiIdx] = useState(0);
  const [displayStr, setDisplayStr] = useState('');
  const [waveActive, setWaveActive] = useState(false);
  const [eraserPos, setEraserPos] = useState<number | null>(null);
  const [typistPos, setTypistPos] = useState<number | null>(null);
  const [erased, setErased] = useState<boolean[]>([]);

  // initial type-in (character by character)
  useEffect(() => {
    if (asciiIdx >= asciiArt.length) return;
    const id = window.setTimeout(() => {
      setAsciiIdx((i) => {
        const next = i + 1;
        setDisplayStr(asciiArt.slice(0, next));
        return next;
      });
    }, 8);
    return () => clearTimeout(id);
  }, [asciiIdx, asciiArt]);

  // erase → retype wave (CSS-only: toggle `erased` flags; canonical asciiArt is never mutated)
  useEffect(() => {
    if (asciiIdx < asciiArt.length) return; // wait until initial type completes
    if (waveActive) return;
    setWaveActive(true);
    console.log('[ascii] starting wave');

    // ensure erased buffer matches ascii length
    if (erased.length !== asciiArt.length) setErased(new Array(asciiArt.length).fill(false));

    const speed = 60;        // ms per erase step — slightly slower so flicker is visible
    const retypeDelay = 280; // ms to wait before retyping an erased char (visible gap)
    let pos = 0;
    let cancelled = false;

    const step = () => {
      if (cancelled) return;
      // advance to next non-newline
      while (pos < asciiArt.length && asciiArt[pos] === '\n') pos++;
      if (pos < asciiArt.length) {
        const idx = pos;
        // mark erased (CSS will hide the char and show caret)
        console.log('[ascii] erase ->', idx);
        setErased((prev) => {
          const next = prev.slice();
          next[idx] = true;
          return next;
        });
        setEraserPos(idx);
        window.setTimeout(() => setEraserPos(null), Math.max(60, speed));

        // schedule retype (un-hide) from canonical
        window.setTimeout(() => {
          if (cancelled) return;
          console.log('[ascii] retype <-', idx);
          setErased((prev) => {
            const next = prev.slice();
            next[idx] = false;
            return next;
          });
          setTypistPos(idx);
          // keep the per-character caret visible longer so the movement is obvious
          window.setTimeout(() => setTypistPos(null), 520);
        }, retypeDelay + (Math.random() * 80));

        pos++;
        window.setTimeout(step, speed);
      } else {
        // finished a full pass: reset and loop after a shorter pause so it's continuous
        setErased(new Array(asciiArt.length).fill(false));
        pos = 0;
        window.setTimeout(step, 300 + Math.random() * 260);
      }
    };

    const t = window.setTimeout(step, 600);
    return () => {
      cancelled = true;
      clearTimeout(t);
      setWaveActive(false);
    };
  }, [asciiIdx, asciiArt]);

  const triggerWave = () => {
    console.log('[ascii] manual trigger');
    setAsciiIdx(asciiArt.length);
    setWaveActive(false);
    // effect will start automatically because asciiIdx >= asciiArt.length and waveActive is false
  };

  return (
    <div className="container">
      <div className="header" style={{ gridColumn: '1 / -1' }}>
        <div className="header-left">
          <span className="ascii-logo" aria-hidden>
            <pre className="ascii-pre">
              {(displayStr || asciiArt.slice(0, asciiIdx)).split('').map((ch, i) => {
                const isErased = !!erased[i];
                const isTypist = i === typistPos;
                if (ch === '\n') return <br key={i} />;
                const classList: string[] = [];
                if (isErased) classList.push('erased');
                if (isTypist) classList.push('typist-char', 'active-glow');
                const className = classList.length ? classList.join(' ') : undefined;
                return (
                  <span key={i} className={className}>
                    {ch === ' ' ? '\u00A0' : ch}
                    {isErased && <span className="eraser-caret" aria-hidden>█</span>}
                    {isTypist && <span className="typist-caret ascii-inline-cursor" aria-hidden>|</span>}
                  </span>
                );
              })}
            </pre>
            <span className="ascii-cursor" aria-hidden>{asciiIdx < asciiArt.length ? '|' : ''}</span>
          </span>
          <span className="sr-only">NOWON</span>
        </div>

        <div className="header-right">
          <nav>
            <a href="#">Products</a>
            <a href="#">Platform</a>
            <a href="#">Docs</a>
            <a href="#">Contact</a>
          </nav>
          <button className="theme-toggle" onClick={() => setTheme((t) => (t === 'light' ? 'dark' : 'light'))}>
            Toggle theme
          </button>
          <button className="theme-toggle" onClick={triggerWave} title="Force the ASCII erase/retype wave">
            Trigger wave
          </button>
        </div>
      </div>

      <section className="hero">
        <div className="kicker">Computers • AI • Agents</div>
        <h1>
          Nowon — where <span className="type">{text}</span>
        </h1>
        <p className="lead">Build secure, agentified automation for the enterprise. CLI-first, privacy-conscious, and designed for teams that treat automation like engineering.</p>
        <div className="ctas">
          <button className="btn">Get started</button>
          <button className="btn ghost">Explore templates</button>
        </div>

        <div className="features" style={{ marginTop: 22 }}>
          <div className="card"><h4>CLI-first</h4><p>Scriptable tools for deterministic automation and reproducible runs.</p></div>
          <div className="card"><h4>Agent Templates</h4><p>Prebuilt templates & skills to accelerate delivery.</p></div>
          <div className="card"><h4>Secure by design</h4><p>Keys, auditable approvals and local-only execution.</p></div>
        </div>

        <div className="terminal-card" role="region" aria-label="CLI input">
          <div className="terminal-left" aria-hidden></div>
          <input className="terminal-input" placeholder="Type your message or /help" aria-label="CLI input" />
          <div className="terminal-meta"><span className="term-badge">gemini-2.5-pro</span><span>200k context</span></div>
        </div>
      </section>

      <aside>
        <div className="cli-card">
          <div className="cli-badge"><span className="dot" /> <span className="mon">cli.nowon — pif • demo</span></div>
          <pre>
{`$ curl -o pif.mjs https://nothumanallowed.com/cli/pif.mjs
$ node pif.mjs register --name "Nowon-Agent"
$ pif template:list --category=automation
$ pif evolve --task "security audit"

# Preview (web hands)
$ python tools/web_hands.py open "https://nowon.example" --headful`}
          </pre>
        </div>

        <div style={{ height: 18 }} />

        <div className="cli-card" style={{ marginTop: 12, textAlign: 'center' }}>
          <strong style={{ display: 'block', marginBottom: 8, color: 'var(--accent)' }}>Live preview</strong>
          <img src="/webhands.png" alt="preview" style={{ width: '100%', borderRadius: 8, border: '1px solid rgba(255,255,255,0.03)' }} />
        </div>
      </aside>

      <div className="ai-stub" aria-hidden>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 6px 12px' }}>
          <strong>Nowon AI (beta)</strong>
          <small style={{ color: 'var(--muted)' }}>• client stub</small>
        </header>
        <div className="messages" id="msgs"><div style={{ opacity: 0.6, color: 'var(--muted)', fontSize: 12 }}>AI stub ready — connect a backend to enable messages.</div></div>
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <input placeholder="Ask Nowon..." disabled />
          <button className="btn ghost" style={{ padding: '8px 10px' }}>Connect</button>
        </div>
      </div>

      <footer style={{ gridColumn: '1 / -1' }}>© Nowon — Computers &amp; AI</footer>
    </div>
  );
}

