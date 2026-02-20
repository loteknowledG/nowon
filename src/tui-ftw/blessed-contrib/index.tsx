import React from 'react';

export default function BlessedContribDemo(): JSX.Element {
  return (
    <div style={{padding:12}}>
      <h3>blessed-contrib (mock)</h3>
      <p>Dashboard-style experiment — emulate charts/logs/tables within the page for UX testing.</p>
      <div style={{display:'flex',gap:12}}>
        <div style={{flex:1,background:'#081226',padding:8,borderRadius:6}}>chart placeholder</div>
        <div style={{width:260,background:'#081226',padding:8,borderRadius:6}}>log/table placeholder</div>
      </div>
    </div>
  );
}
