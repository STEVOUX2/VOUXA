'use client';

import { useState } from 'react';
import { updateHomepageConfig } from './actions';
import { CheckIcon, XIcon, SaveIcon } from 'lucide-react';

export function TmdbClient({ initialConfig }: { initialConfig: any }) {
  const [config, setConfig] = useState(initialConfig);
  const [isSaving, setIsSaving] = useState(false);

  const handleToggle = (id: string) => {
    setConfig({
      ...config,
      sections: config.sections.map((s: any) => s.id === id ? { ...s, active: !s.active } : s)
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    await updateHomepageConfig(config);
    setIsSaving(false);
    alert('Homepage layout saved!');
  };

  return (
    <div>
      <div style={{ background: 'rgba(23, 23, 23, 0.6)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '24px', padding: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#F2F2F0', margin: 0 }}>Homepage Categories</h2>
          <button onClick={handleSave} disabled={isSaving} style={{
            background: '#7B1016', color: '#fff', padding: '10px 24px', borderRadius: '8px',
            border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600,
            opacity: isSaving ? 0.7 : 1
          }}>
            <SaveIcon size={18} /> {isSaving ? 'Saving...' : 'Save Layout'}
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {config.sections.map((section: any) => (
            <div key={section.id} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
              padding: '20px 24px', borderRadius: '12px'
            }}>
              <div>
                <h3 style={{ color: '#F2F2F0', fontSize: '16px', fontWeight: 600, margin: '0 0 4px 0' }}>{section.title}</h3>
                <p style={{ color: '#7E7E7E', fontSize: '13px', margin: 0, fontFamily: 'monospace' }}>API: {section.type}</p>
              </div>
              
              <button onClick={() => handleToggle(section.id)} style={{
                background: section.active ? 'rgba(123, 16, 22, 0.2)' : 'rgba(255,255,255,0.05)',
                border: section.active ? '1px solid rgba(123, 16, 22, 0.5)' : '1px solid rgba(255,255,255,0.1)',
                color: section.active ? '#ff6b6b' : '#B9B9B9',
                padding: '8px 16px', borderRadius: '999px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600
              }}>
                {section.active ? <CheckIcon size={16} /> : <XIcon size={16} />}
                {section.active ? 'Enabled' : 'Disabled'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
