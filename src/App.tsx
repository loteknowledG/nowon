import React, { useEffect, useState, useRef } from 'react';

export default function App(): JSX.Element {
  // show one word at a time (prevent wrapping / layout shifts)
  const phrases = [
    'Computers',
    'AI',
    'Secure',
    'agent',
    'platforms',
    'Automation',
    'intelligence',
  ];
  const [text, setText] = useState('');
  const [pIdx, setPIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [deleting, setDeleting] = useState(false);
  const [theme] = useState<string>(() => 'dark');

  useEffect(() => {
    if (theme === 'light') document.documentElement.dataset.theme = 'light';
    else delete document.documentElement.dataset.theme;
    localStorage.setItem('nowon-theme', theme === 'light' ? 'light' : 'dark');
  }, [theme]);

  useEffect(() => {
    const full = phrases[pIdx];
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
  const [eraserPos] = useState<number | null>(null);
  const [typistPos, setTypistPos] = useState<number | null>(null);
  const [erased, setErased] = useState<boolean[]>([]);

  // runtime font-size (vw) for ASCII so the longest line fits the viewport width
  const asciiRef = useRef<HTMLElement | null>(null);
  const [asciiFontVw, setAsciiFontVw] = useState<number | null>(null);

  // kicker: show one word at a time (prevents wrap/layout shift)
  const kickerWords = ['Computers', 'AI', 'Agents'];
  void kickerWords; // kept for semantic/SEO (UI pill removed)
  void kickerWords; // intentionally kept for semantic/SEO; pill UI removed

  // background counting grid (subtle, low-contrast rows of numbers that count up)
  const [countOffset, setCountOffset] = useState<bigint>(0n);
  const [bgGrid, setBgGrid] = useState({ rows: 20, cols: 120 });

  useEffect(() => {
    const calc = () => {
      // derive rows from the count-bg font-size * line-height (10px * 1.2 = 12px)
      const lineH = 10 * 1.2; // px — mirrors .count-bg font-size & line-height
      const rows = Math.max(6, Math.ceil(window.innerHeight / lineH));
      const cols = Math.max(20, Math.ceil(window.innerWidth / 8));
      setBgGrid({ rows, cols });
    };
    calc();
    window.addEventListener('resize', calc);
    return () => window.removeEventListener('resize', calc);
  }, []);

  // advance the counter offset so numbers appear to be counting up
  useEffect(() => {
    const id = window.setInterval(() => setCountOffset((n) => n + 1n), 10); // very fast counting (10ms)
    return () => clearInterval(id);
  }, []);

  const bgText = React.useMemo(() => {
    let s = '';
    let n = countOffset;
    for (let r = 0; r < bgGrid.rows; r++) {
      for (let c = 0; c < bgGrid.cols; c++) {
        s += n.toString(16).toUpperCase() + ' ';
        n = n + 1n;
      }
      s += '\n';
    }
    return s;
  }, [bgGrid, countOffset]);

  // initial type-in (character by character) — show per-char caret as characters appear
  useEffect(() => {
    if (asciiIdx >= asciiArt.length) return;
    const id = window.setTimeout(() => {
      setAsciiIdx((i) => {
        const next = i + 1;
        setDisplayStr(asciiArt.slice(0, next));
        // place a per-character caret at the newly-typed char so the write is synchronous
        setTypistPos(next - 1);
        window.setTimeout(() => setTypistPos(null), 80);
        return next;
      });
    }, 8);
    return () => clearTimeout(id);
  }, [asciiIdx, asciiArt]);

  // size the ASCII font so the longest ASCII line always fits the available column width
  useEffect(() => {
    const computeAsciiFont = () => {
      const pre = asciiRef.current as HTMLElement | null;
      if (!pre) return;
      const parent = pre.parentElement as HTMLElement | null;
      const available = parent ? parent.clientWidth - 12 /* padding guard */ : Math.max(320, window.innerWidth - 48);
      const lines = asciiArt.split('\n');
      const maxChars = Math.max(...lines.map((l) => l.length));
      if (!maxChars) return;

      // measure a single-monospace character width at a known font-size to derive ratio
      const probe = document.createElement('span');
      probe.style.position = 'absolute';
      probe.style.visibility = 'hidden';
      probe.style.fontFamily = getComputedStyle(pre).fontFamily || "'Hack','VT323',monospace";
      probe.style.fontSize = '100px';
      probe.textContent = '0';
      document.body.appendChild(probe);
      const charWidthAt100 = probe.getBoundingClientRect().width || 1;
      document.body.removeChild(probe);
      const charPerPx = charWidthAt100 / 100; // px width per 1px font-size

      const targetCharWidth = Math.max(1, available / maxChars);
      const targetFontPx = Math.floor(targetCharWidth / charPerPx);
      // limit by viewport height so ASCII never overflows vertically
      const numLines = lines.length || 1;
      const maxFontPxByHeight = Math.max(8, Math.floor((window.innerHeight * 0.6) / numLines));
      const finalFontPx = Math.max(8, Math.min(40, Math.min(targetFontPx, maxFontPxByHeight)));
      // convert px -> vw (viewport width units)
      const finalFontVw = (finalFontPx / window.innerWidth) * 100;
      // clamp vw to sensible range
      const clampedVw = Math.max(0.4, Math.min(10, finalFontVw));
      setAsciiFontVw(clampedVw);
    };

    computeAsciiFont();
    window.addEventListener('resize', computeAsciiFont);
    return () => window.removeEventListener('resize', computeAsciiFont);
  }, [asciiArt]);

  // erase → retype wave (start at the beginning and move forward)
  /* eslint-disable react-hooks/exhaustive-deps */
  // the effect intentionally does not include `waveActive`/`erased.length` in deps
  // (managed internally).
  useEffect(() => {
    if (asciiIdx < asciiArt.length) return; // wait until initial type completes
    if (waveActive) return;
    setWaveActive(true);

    // ensure erased buffer matches ascii length
    if (erased.length !== asciiArt.length) setErased(new Array(asciiArt.length).fill(false));

    const speed = 37;        // ms per erase step — slightly slower so flicker is visible
    const retypeDelay = 280; // ms to wait before retyping an erased char (visible gap)
    let pos = 0;
    let cancelled = false;

    const step = () => {
      if (cancelled) return;
      // advance to next non-newline
      while (pos < asciiArt.length && asciiArt[pos] === '\n') pos++;
      if (pos < asciiArt.length) {
        const idx = pos;
        // place the visible typist caret on the character being erased (keeps visual sync)
        setTypistPos(idx);
        window.setTimeout(() => setTypistPos(null), Math.max(60, speed));

        setErased((prev) => {
          const next = prev.slice();
          next[idx] = true;
          return next;
        });

        // schedule retype (un-hide) from canonical
        window.setTimeout(() => {
          if (cancelled) return;
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
  /* eslint-enable react-hooks/exhaustive-deps */



  return (
    <div className="site-wrapper">
      <pre className="count-bg" aria-hidden>{bgText}</pre>
      <div className="container">
      <div className="header" style={{ gridColumn: '1 / -1' }}>
        <div className="header-left">
          <span className="ascii-logo" aria-hidden>
            <pre ref={asciiRef} className="ascii-pre neon flicker" style={asciiFontVw ? { fontSize: `${asciiFontVw}vw` } : undefined }>
              {(displayStr || asciiArt.slice(0, asciiIdx)).split('').map((ch, i) => {
                const isErased = !!erased[i];
                const isTypist = i === typistPos;
                if (ch === '\n') return <br key={i} />;
                const classList: string[] = [];
                if (isErased) classList.push('erased');
                if (isTypist) classList.push('typist-char', 'active-glow');
                const className = classList.length ? classList.join(' ') : undefined;

                // per-character randomized spark timing (CSS vars injected inline)
                const sparkCycle = (3 + Math.random() * 7).toFixed(2) + 's'; // 3–10s cycle
                const sparkDelay = (-Math.random() * parseFloat(sparkCycle)).toFixed(2) + 's';
                const spanStyle = { ['--spark-cycle']: sparkCycle, ['--spark-delay']: sparkDelay } as React.CSSProperties;

                return (
                  <span key={i} className={className} style={spanStyle}>
                    {ch === ' ' ? '\u00A0' : ch}
                    {isErased && <span className="eraser-caret" aria-hidden>│</span>}
                    {isTypist && <span className="typist-caret ascii-inline-cursor" aria-hidden>│</span>}
                  </span>
                );
              })}
              { /* inline typing caret: appears at the next write position during initial type-in */ }
              {asciiIdx < asciiArt.length && typistPos == null && (
                <span className="ascii-cursor ascii-inline-caret" aria-hidden>│</span>
              )}
              {/* decorative ghost caret — preserves the large visual gap while local carets do actual typing/erasing */}
              <span
                className="ascii-ghost-caret"
                aria-hidden
                style={(() => {
                  const trackIndex = (eraserPos !== null && eraserPos !== undefined) ? eraserPos : ((typistPos !== null && typistPos !== undefined) ? typistPos : Math.max(0, asciiIdx - 1));
                  const clamped = Math.max(0, Math.min(trackIndex, asciiArt.length - 1));
                  const before = asciiArt.slice(0, clamped + 1);
                  const line = before.split('\n').length - 1;
                  const lastNl = before.lastIndexOf('\n');
                  const col = clamped - (lastNl === -1 ? 0 : lastNl + 1);
                  return { left: `${col}ch`, top: `calc(${line} * 1em + 0.25em)` } as React.CSSProperties;
                })()}
              >│</span>
            </pre>
          </span>
          <span className="sr-only">nowon</span>
        </div>

        <div className="header-right">
          <nav>
            <a href="#">Products</a>
            <a href="#">Platform</a>
            <a href="#">Docs</a>
            <a href="#">Contact</a>
          </nav>
        </div>
      </div>

      <section className="hero">
        <h1>
          nowon — where <span className="type">{text || '\u00A0'}</span>
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
$ node pif.mjs register --name "nowon-Agent"
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
          <strong>nowon AI (beta)</strong>
          <small style={{ color: 'var(--muted)' }}>• client stub</small>
        </header>
        <div className="messages" id="msgs"><div style={{ opacity: 0.6, color: 'var(--muted)', fontSize: 12 }}>AI stub ready — connect a backend to enable messages.</div></div>
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <input placeholder="Ask nowon..." disabled />
          <button className="btn ghost" style={{ padding: '8px 10px' }}>Connect</button>
        </div>
      </div>

      <footer style={{ gridColumn: '1 / -1' }}>© nowon — Computers &amp; AI</footer>
    </div>
    </div>
  );
}

