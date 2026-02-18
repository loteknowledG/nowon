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

  return (
    <div className="container">
      <div className="header" style={{ gridColumn: '1 / -1' }}>
        <div className="header-left">
          <span className="caret">&gt;</span>
          <span className="ascii-logo" aria-hidden>nowon</span>
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

