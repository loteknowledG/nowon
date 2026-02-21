import React, { useEffect, useState, useRef } from 'react';
const FigletTui = React.lazy(() => import('./tui-ftw/figlet-tui'));

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

  // ASCII rendering uses CSS-only sizing (removed runtime vw calculation)

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
    // throttle background counter — reduce CPU use (was 10ms)
    const id = window.setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return;
      setCountOffset((n) => n + 1n);
    }, 250); // update every 250ms instead of 10ms
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

  // Note: runtime font-size calculation removed — CSS `.ascii-pre` controls sizing now.

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

  if (typeof window !== 'undefined' && window.location.pathname.includes('/tui-ftw')) {
    return (
      <React.Suspense fallback={<div style={{padding:24}}>Loading Figlet TUI…</div>}>
        <TuiFtw />
      </React.Suspense>
    );
  }

  // Custom landing page (replace with your preferred content)
  return (
    <div className="site-wrapper">
      <div className="header" style={{ gridColumn: '1 / -1', marginBottom: 32 }}>
        <div className="header-left">
          <span className="ascii-logo" aria-hidden>
            <pre className={`ascii-pre neon${waveActive ? ' flicker' : ''}`} style={{ fontSize: 16, margin: 0 }}>
              {(displayStr || asciiArt.slice(0, asciiIdx)).split('').map((ch, i) => {
                const isErased = !!erased[i];
                const isTypist = i === typistPos;
                if (ch === '\n') return <br key={i} />;
                const classList = [];
                if (isErased) classList.push('erased');
                if (isTypist) classList.push('typist-char');
                const className = classList.length ? classList.join(' ') : undefined;
                return (
                  <span key={i} className={className}>
                    {ch === ' ' ? '\u00A0' : ch}
                    {isErased && <span className="eraser-caret" aria-hidden>│</span>}
                    {isTypist && <span className="typist-caret ascii-inline-cursor" aria-hidden>│</span>}
                  </span>
                );
              })}
              {asciiIdx < asciiArt.length && typistPos == null && (
                <span className="ascii-cursor ascii-inline-caret" aria-hidden>│</span>
              )}
            </pre>
          </span>
        </div>
      </div>
      <React.Suspense fallback={<div style={{ padding: 32 }}>Loading Figlet TUI…</div>}>
        <FigletTui />
      </React.Suspense>
    </div>
  );
}

