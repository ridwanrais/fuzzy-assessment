'use client';

import { use } from 'react';
import { useCampaign } from '@/hooks/useCampaign';
import { useState } from 'react';

export default function CampaignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: campaign, loading, error, generateMutation } = useCampaign(id);
  const [generatingIds, setGeneratingIds] = useState<Set<string>>(new Set());

  const handleGenerate = (contactId: string) => {
    setGeneratingIds((prev) => new Set(prev).add(contactId));

    generateMutation.mutate({ contactId }, {
      onSettled: () => {
        setGeneratingIds((prev) => {
          const next = new Set(prev);
          next.delete(contactId);
          return next;
        });
      }
    });
  };

  const cardStyle = {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
    marginBottom: '24px',
    overflow: 'hidden',
  };

  const btnStyle = {
    padding: '8px 16px',
    backgroundColor: '#0f172a',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'opacity 0.2s',
  };

  if (loading && !campaign) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '64px', color: '#64748b' }}>
        Loading campaign details...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px', color: '#ef4444', backgroundColor: '#fef2f2', borderRadius: '8px', border: '1px solid #fca5a5' }}>
        Error loading campaign: {error}
      </div>
    );
  }

  if (!campaign) return null;

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', color: '#0f172a', marginBottom: '8px', fontWeight: 600 }}>{campaign.name}</h1>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', color: '#64748b', fontSize: '14px' }}>
          <span>Campaign ID:</span>
          <code style={{ backgroundColor: '#e2e8f0', padding: '2px 6px', borderRadius: '4px' }}>{id}</code>
        </div>
      </div>

      <div style={{ ...cardStyle, padding: '24px' }}>
        <h3 style={{ marginTop: 0, color: '#334155', fontSize: '16px', marginBottom: '12px' }}>Prompt Template</h3>
        <pre style={{ margin: 0, padding: '16px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', color: '#334155', whiteSpace: 'pre-wrap', fontFamily: 'monospace', fontSize: '14px' }}>
          {campaign.promptTemplate}
        </pre>
      </div>

      <h2 style={{ fontSize: '20px', color: '#0f172a', marginTop: '32px', marginBottom: '16px', fontWeight: 600 }}>
        Attached Contacts <span style={{ color: '#64748b', fontWeight: 400, fontSize: '16px' }}>({campaign.contacts.length})</span>
      </h2>
      
      <div style={cardStyle}>
        {campaign.contacts.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>No contacts attached to this campaign.</div>
        ) : (
          <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', color: '#64748b', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '16px 24px', fontWeight: 600 }}>Contact</th>
                <th style={{ padding: '16px 24px', fontWeight: 600, width: '120px' }}>Status</th>
                <th style={{ padding: '16px 24px', fontWeight: 600, width: '45%' }}>Result</th>
                <th style={{ padding: '16px 24px', fontWeight: 600, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {campaign.contacts.map((c) => {
                const isGenerating = generatingIds.has(c.contact._id);
                
                let badgeColor = '#f1f5f9';
                let badgeText = '#475569';
                if (c.status === 'finished') { badgeColor = '#dcfce7'; badgeText = '#166534'; }
                if (c.status === 'failed') { badgeColor = '#fee2e2'; badgeText = '#991b1b'; }
                if (c.status === 'pending' || isGenerating) { badgeColor = '#fef3c7'; badgeText = '#92400e'; }

                return (
                  <tr key={c.contactId} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '16px 24px', verticalAlign: 'top' }}>
                      <div style={{ fontWeight: 500, color: '#0f172a', marginBottom: '4px' }}>{c.contact.name}</div>
                      <div style={{ color: '#64748b', fontSize: '14px' }}>{c.contact.email}</div>
                    </td>
                    <td style={{ padding: '16px 24px', verticalAlign: 'top' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '4px 10px',
                        borderRadius: '9999px',
                        fontSize: '12px',
                        fontWeight: 500,
                        backgroundColor: badgeColor,
                        color: badgeText,
                        textTransform: 'capitalize'
                      }}>
                        {isGenerating ? 'Generating' : c.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td style={{ padding: '16px 24px', verticalAlign: 'top' }}>
                      {c.status === 'failed' && c.error && (
                        <div style={{ color: '#ef4444', fontSize: '14px', backgroundColor: '#fef2f2', padding: '8px 12px', borderRadius: '6px' }}>
                          {c.error}
                        </div>
                      )}
                      {c.generatedMessage && (
                        <div style={{ fontSize: '14px', color: '#334155', whiteSpace: 'pre-wrap', backgroundColor: '#f8fafc', padding: '12px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                          {c.generatedMessage}
                        </div>
                      )}
                      {c.status === 'not_generated' && !isGenerating && (
                        <span style={{ color: '#94a3b8', fontSize: '14px', fontStyle: 'italic' }}>Pending generation...</span>
                      )}
                    </td>
                    <td style={{ padding: '16px 24px', verticalAlign: 'top', textAlign: 'right' }}>
                      <button
                        onClick={() => handleGenerate(c.contactId)}
                        disabled={isGenerating}
                        style={{ ...btnStyle, opacity: isGenerating ? 0.5 : 1, cursor: isGenerating ? 'not-allowed' : 'pointer' }}
                      >
                        {isGenerating ? 'Generating...' : (c.status === 'finished' || c.status === 'failed' ? 'Regenerate' : 'Generate')}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
