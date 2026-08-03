'use client';

import { useState } from 'react';
import { updateSettings } from './actions';
import { SaveIcon, AlertTriangleIcon } from 'lucide-react';

export function SettingsClient({ initialSettings }: { initialSettings: any }) {
  const [formData, setFormData] = useState(initialSettings);
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    await updateSettings(formData);
    setIsSaving(false);
    alert('Settings saved successfully!');
  };

  return (
    <div style={{ background: 'rgba(23, 23, 23, 0.6)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '24px', padding: '40px' }}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        
        {/* Maintenance Mode Toggle */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '24px', padding: '24px', background: formData.maintenance_mode ? 'rgba(123, 16, 22, 0.1)' : 'rgba(255,255,255,0.02)', border: formData.maintenance_mode ? '1px solid rgba(123, 16, 22, 0.3)' : '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', transition: 'all 0.3s' }}>
          <div style={{ background: formData.maintenance_mode ? 'rgba(123, 16, 22, 0.2)' : 'rgba(255,255,255,0.1)', padding: '12px', borderRadius: '50%', color: formData.maintenance_mode ? '#ff6b6b' : '#7E7E7E' }}>
            <AlertTriangleIcon size={24} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <h3 style={{ color: '#F2F2F0', fontSize: '18px', fontWeight: 600, margin: 0 }}>Maintenance Mode</h3>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={formData.maintenance_mode}
                  onChange={(e) => setFormData({ ...formData, maintenance_mode: e.target.checked })}
                  style={{ width: '20px', height: '20px', accentColor: '#7B1016', cursor: 'pointer' }}
                />
                <span style={{ marginLeft: '8px', color: '#B9B9B9', fontWeight: 600, fontSize: '14px' }}>
                  {formData.maintenance_mode ? 'Active' : 'Disabled'}
                </span>
              </label>
            </div>
            <p style={{ color: '#7E7E7E', fontSize: '14px', margin: '0 0 16px 0', lineHeight: 1.5 }}>
              When active, all non-admin users will see the maintenance screen and cannot access the site.
            </p>
            
            {formData.maintenance_mode && (
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: '#B9B9B9', fontSize: '13px', fontWeight: 600 }}>Maintenance Message</label>
                <textarea 
                  value={formData.maintenance_text}
                  onChange={(e) => setFormData({ ...formData, maintenance_text: e.target.value })}
                  rows={3}
                  style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '12px', color: '#fff', outline: 'none', resize: 'vertical' }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Announcements */}
        <div>
          <label style={{ display: 'block', marginBottom: '8px', color: '#B9B9B9', fontSize: '14px', fontWeight: 600 }}>Global Announcement Text</label>
          <p style={{ color: '#7E7E7E', fontSize: '13px', margin: '0 0 12px 0' }}>This text will appear at the top of the home page. Leave blank to hide.</p>
          <input 
            value={formData.announcement_text}
            onChange={(e) => setFormData({ ...formData, announcement_text: e.target.value })}
            placeholder="e.g., Welcome to VOUXA! New servers added."
            style={{ width: '100%', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '16px', color: '#fff', outline: 'none', fontSize: '15px' }}
          />
        </div>

        {/* Server Player Warning Context */}
        <div>
          <label style={{ display: 'block', marginBottom: '8px', color: '#B9B9B9', fontSize: '14px', fontWeight: 600 }}>Player Warning Message</label>
          <p style={{ color: '#7E7E7E', fontSize: '13px', margin: '0 0 12px 0' }}>This text will appear above the server selector buttons in the video player.</p>
          <textarea 
            value={formData.server_warning_text}
            onChange={(e) => setFormData({ ...formData, server_warning_text: e.target.value })}
            rows={3}
            placeholder="e.g., If video isn't playing, try switching to another server."
            style={{ width: '100%', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '16px', color: '#fff', outline: 'none', fontSize: '15px', resize: 'vertical' }}
          />
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '32px' }}>
          <button type="submit" disabled={isSaving} style={{
            background: '#7B1016', color: '#fff', padding: '12px 32px', borderRadius: '8px',
            border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600,
            opacity: isSaving ? 0.7 : 1, fontSize: '15px'
          }}>
            <SaveIcon size={18} /> {isSaving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>

      </form>
    </div>
  );
}
