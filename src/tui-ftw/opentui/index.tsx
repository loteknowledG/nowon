import React, { useEffect, useRef, useState } from 'react';

const items = ['Files', 'Processes', 'Logs', 'Settings', 'Help'];

export default function OpenTuiDemo(): JSX.Element {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [focusedArea, setFocusedArea] = useState<'list' | 'panel' | 'controls'>('list');
  const [focusIndex, setFocusIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(items[0]);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalFocus, setModalFocus] = useState<'confirm' | 'cancel'>('confirm');
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    rootRef.current?.focus();
  }, []);

  useEffect(() => {
    if (focusedArea === 'panel') inputRef.current?.focus();
  }, [focusedArea]);

  const clamp = (n: number) => (n + items.length) % items.length;

  const onKey = (e: React.KeyboardEvent) => {
    if (modalOpen) {
      // modal focus trap
      if (e.key === 'Escape') {
        e.preventDefault();
        setModalOpen(false);
        return;
      }
      if (e.key === 'Tab') {
        e.preventDefault();
        setModalFocus((f) => (f === 'confirm' ? 'cancel' : 'confirm'));
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        if (modalFocus === 'confirm') {
          setModalOpen(false);
          setSelected(`${selected} (action confirmed)`);
        } else setModalOpen(false);
        return;
      }
      return;
    }

    if (e.key === 'Tab') {
      e.preventDefault();
      setFocusedArea((a) => (a === 'list' ? 'panel' : a === 'panel' ? 'controls' : 'list'));
      return;
    }

    if (focusedArea === 'list') {
      if (e.key === 'ArrowDown') {
        setFocusIndex((i) => clamp(i + 1));
        e.preventDefault();
      } else if (e.key === 'ArrowUp') {
        setFocusIndex((i) => clamp(i - 1));
        e.preventDefault();
      } else if (e.key === 'Enter') {
        setSelected(items[focusIndex]);
        e.preventDefault();
      }
    } else if (focusedArea === 'panel') {
      if (e.key === 'Enter') {
        // open modal for active selection
        setModalOpen(true);
        setModalFocus('confirm');
        e.preventDefault();
      }
    } else if (focusedArea === 'controls') {
      if (e.key === 'Enter') {
        // quick toggle selected
        setSelected((s) => (s ? `${s} • refreshed` : 'refreshed'));
        e.preventDefault();
      }
    }
  };

  return (
    <div
      ref={rootRef}
      tabIndex={0}
      onKeyDown={onKey}
      style={{ padding: 18, outline: 'none' }}
      aria-label="OpenTUI keyboard focus demo"
    >
      <div style={{ display: 'flex', gap: 16 }}>
        <div style={{ width: 220 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <strong>OpenTUI — keyboard demo</strong>
            <small style={{ color: 'var(--muted)', fontSize: 12 }}>Focus: {focusedArea}</small>
          </div>

          <div style={{ display: 'grid', gap: 8 }}>
            {items.map((it, idx) => {
              const isFocused = focusedArea === 'list' && focusIndex === idx;
              const isSelected = selected === it;
              return (
                <button
                  key={it}
                  onClick={() => { setFocusIndex(idx); setFocusedArea('list'); setSelected(it); }}
                  className={isSelected ? 'btn' : 'btn ghost'}
                  style={{
                    textAlign: 'left',
                    padding: '8px 10px',
                    borderRadius: 8,
                    boxShadow: isFocused ? 'inset 0 0 0 2px rgba(123,97,255,0.18)' : undefined,
                  }}
                  aria-pressed={isSelected}
                >
                  {it}
                </button>
              );
            })}
          </div>

          <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
            <button className="btn ghost" onClick={() => { setFocusedArea('list'); setFocusIndex(0); }}>Focus list</button>
            <button className="btn ghost" onClick={() => setFocusedArea('panel')}>Open panel</button>
          </div>
        </div>

        <div style={{ flex: 1, padding: 14, borderRadius: 8, background: 'rgba(0,0,0,0.04)', minHeight: 180 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <strong>Panel — {selected}</strong>
            <div style={{ color: 'var(--muted)', fontSize: 13 }}>Press <kbd>Enter</kbd> to open modal</div>
          </div>

          <div style={{ marginTop: 12 }}>
            <label style={{ display: 'block', color: 'var(--muted)', marginBottom: 6 }}>Quick note for this item</label>
            <input
              ref={inputRef}
              value={selected ?? ''}
              onChange={(e) => setSelected(e.target.value)}
              className="tui-input"
              style={{ width: '100%', padding: '8px 10px', borderRadius: 8 }}
            />
          </div>

          <div style={{ marginTop: 14, color: 'var(--muted)' }}>
            <div>Interactive demo of keyboard focus and modal traps.</div>
            <div style={{ marginTop: 6 }}>Try: Arrow keys (list), <kbd>Tab</kbd> to move regions, <kbd>Enter</kbd> to act, <kbd>Esc</kbd> to close modal.</div>
          </div>
        </div>

        <div style={{ width: 260 }}>
          <div style={{ fontSize: 13, color: 'var(--muted)' }}><strong>Keybindings</strong></div>
          <ul style={{ marginTop: 8, color: 'var(--muted)', lineHeight: 1.8 }}>
            <li><kbd>ArrowUp / ArrowDown</kbd> — navigate list</li>
            <li><kbd>Tab</kbd> — cycle focus regions</li>
            <li><kbd>Enter</kbd> — select / open / confirm</li>
            <li><kbd>Esc</kbd> — close modal / cancel</li>
          </ul>

          <div style={{ marginTop: 12 }}>
            <button className="btn" onClick={() => { setFocusedArea('list'); setFocusIndex(0); rootRef.current?.focus(); }}>Focus demo</button>
            <button className="btn ghost" onClick={() => { setSelected('Files'); setFocusedArea('panel'); }}>Select Files</button>
          </div>
        </div>
      </div>

      {modalOpen && (
        <div role="dialog" aria-modal style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 520, background: 'var(--panel)', padding: 18, borderRadius: 12, border: '1px solid rgba(255,255,255,0.04)' }}>
            <strong>Confirm action for {selected}</strong>
            <p style={{ color: 'var(--muted)', marginTop: 8 }}>This simulates a modal focus trap. Use <kbd>Tab</kbd> to switch buttons and <kbd>Enter</kbd> to confirm.</p>

            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button className={modalFocus === 'confirm' ? 'btn' : 'btn ghost'} onClick={() => { setSelected(`${selected} (confirmed)`); setModalOpen(false); }}>Confirm</button>
              <button className={modalFocus === 'cancel' ? 'btn' : 'btn ghost'} onClick={() => setModalOpen(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
