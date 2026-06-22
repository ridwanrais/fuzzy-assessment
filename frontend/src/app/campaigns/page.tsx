'use client';

import { useCampaigns } from '@/hooks/useCampaigns';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useToast } from '@/contexts/ToastContext';

export default function CampaignsPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const { data, loading, error, createMutation } = useCampaigns();
  
  const [formState, setFormState] = useState({ name: '', promptTemplate: '' });

  const availableVariables = [
    { key: 'name', label: 'Name', required: true },
    { key: 'company', label: 'Company', required: false },
    { key: 'title', label: 'Job Title', required: false },
  ];

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formState.promptTemplate.includes('{{name}}')) {
      showToast('Prompt template must include at least the {{name}} placeholder.', 'error');
      return;
    }

    createMutation.mutate(formState, {
      onSuccess: (newCampaign) => {
        router.push(`/campaigns/${newCampaign._id}`);
      },
    });
  };

  const inputStyle = { padding: '10px 14px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '14px', outline: 'none', flex: '1', width: '100%', boxSizing: 'border-box' as const };
  const btnStyle = { padding: '10px 16px', backgroundColor: '#0f172a', color: 'white', border: 'none', borderRadius: '6px', fontSize: '14px', fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap' as const };
  const cardStyle = { backgroundColor: '#ffffff', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)', marginBottom: '24px' };

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ fontSize: '28px', color: '#0f172a', marginBottom: '24px', fontWeight: 600 }}>Campaigns</h1>

      <div style={cardStyle}>
        <h3 style={{ marginTop: 0, color: '#334155', fontSize: '18px', marginBottom: '16px' }}>Create New Campaign</h3>
        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#334155', marginBottom: '8px' }}>Campaign Name</label>
            <input required placeholder="e.g. Q3 Outreach" value={formState.name} onChange={(e) => setFormState({ ...formState, name: e.target.value })} style={inputStyle} />
          </div>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '8px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#334155' }}>Prompt Template</label>
            </div>
            
            <textarea 
              required 
              placeholder="Write a personalized email to {{name}} at {{company}}..." 
              value={formState.promptTemplate} 
              onChange={(e) => {
                setFormState({ ...formState, promptTemplate: e.target.value });
              }} 
              style={{ ...inputStyle, minHeight: '120px', fontFamily: 'monospace' }} 
            />
            
            <div style={{ marginTop: '12px', padding: '12px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <p style={{ fontSize: '13px', color: '#475569', margin: '0 0 8px 0', fontWeight: 500 }}>Available Placeholders:</p>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {availableVariables.map(v => (
                  <span
                    key={v.key}
                    style={{
                      padding: '4px 8px',
                      fontSize: '12px',
                      fontFamily: 'monospace',
                      backgroundColor: '#e2e8f0',
                      border: '1px solid #cbd5e1',
                      borderRadius: '4px',
                      color: '#334155',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <span>{`{{${v.key}}}`}</span>
                    {v.required && <span style={{ color: '#ef4444', fontSize: '10px' }}>*</span>}
                  </span>
                ))}
              </div>
              <p style={{ fontSize: '12px', color: '#64748b', margin: '8px 0 0 0' }}>
                <span style={{ color: '#ef4444' }}>*</span> Required placeholder. The LLM will interpolate these values for each contact before generating the message.
              </p>
            </div>
          </div>
          <div style={{ alignSelf: 'flex-start' }}>
            <button type="submit" disabled={createMutation.isPending} style={{ ...btnStyle, backgroundColor: '#2563eb', opacity: createMutation.isPending ? 0.7 : 1 }}>
              {createMutation.isPending ? 'Creating...' : 'Create Campaign'}
            </button>
          </div>
        </form>
      </div>

      <div style={{ ...cardStyle, padding: 0, overflow: 'hidden' }}>
        {error && <p style={{ color: '#ef4444', padding: '16px 24px' }}>Error: {error}</p>}

        {data && (
          <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', color: '#64748b', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <th style={{ padding: '16px 24px', fontWeight: 600 }}>Campaign Name</th>
                <th style={{ padding: '16px 24px', fontWeight: 600 }}>Progress</th>
                <th style={{ padding: '16px 24px', fontWeight: 600 }}>Created</th>
                <th style={{ padding: '16px 24px', fontWeight: 600, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody style={{ opacity: loading ? 0.6 : 1, transition: 'opacity 0.2s' }}>
              {data.length === 0 ? (
                <tr><td colSpan={4} style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>No campaigns found.</td></tr>
              ) : (
                data.map((c) => (
                  <tr key={c._id} style={{ borderTop: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '16px 24px', fontWeight: 500, color: '#0f172a' }}>{c.name}</td>
                    <td style={{ padding: '16px 24px', color: '#475569' }}>
                      {c.stats ? `${c.stats.finished} / ${c.stats.total} Generated` : '—'}
                    </td>
                    <td style={{ padding: '16px 24px', color: '#475569' }}>{new Date(c.createdAt || Date.now()).toLocaleDateString()}</td>
                    <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                      <Link href={`/campaigns/${c._id}`} style={{ color: '#2563eb', textDecoration: 'none', fontWeight: 500 }}>
                        View Details →
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
