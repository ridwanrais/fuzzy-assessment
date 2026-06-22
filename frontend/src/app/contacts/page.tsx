'use client';

import { useContacts } from '@/hooks/useContacts';
import { useState, useEffect } from 'react';

export default function ContactsPage() {
  const { data, loading, error, setParams, params, createMutation } = useContacts({
    page: 1,
    limit: 10,
  });

  const [searchInput, setSearchInput] = useState('');
  const [formState, setFormState] = useState({
    name: '',
    email: '',
    company: '',
    title: '',
  });

  // Debounced search
  useEffect(() => {
    const handler = setTimeout(() => {
      setParams((prev) => ({ ...prev, search: searchInput, page: 1 }));
    }, 300);
    return () => clearTimeout(handler);
  }, [searchInput, setParams]);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formState, {
      onSuccess: () => {
        setFormState({ name: '', email: '', company: '', title: '' });
      },
    });
  };

  const hasNextPage = data ? data.items.length === params.limit : false;

  const inputStyle = {
    padding: '10px 14px',
    border: '1px solid #cbd5e1',
    borderRadius: '6px',
    fontSize: '14px',
    outline: 'none',
    minWidth: '200px',
    flex: '1',
  };

  const btnStyle = {
    padding: '10px 16px',
    backgroundColor: '#0f172a',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
  };

  const cardStyle = {
    backgroundColor: '#ffffff',
    padding: '24px',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
    marginBottom: '24px',
  };

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ fontSize: '28px', color: '#0f172a', marginBottom: '24px', fontWeight: 600 }}>Contacts Directory</h1>

      <div style={cardStyle}>
        <h3 style={{ marginTop: 0, color: '#334155', fontSize: '18px', marginBottom: '16px' }}>Add New Contact</h3>
        <form onSubmit={handleCreate} style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <input required placeholder="Full Name*" value={formState.name} onChange={(e) => setFormState({ ...formState, name: e.target.value })} style={inputStyle} />
          <input required type="email" placeholder="Email Address*" value={formState.email} onChange={(e) => setFormState({ ...formState, email: e.target.value })} style={inputStyle} />
          <input placeholder="Company" value={formState.company} onChange={(e) => setFormState({ ...formState, company: e.target.value })} style={inputStyle} />
          <input placeholder="Job Title" value={formState.title} onChange={(e) => setFormState({ ...formState, title: e.target.value })} style={inputStyle} />
          <button type="submit" disabled={createMutation.isPending} style={{ ...btnStyle, opacity: createMutation.isPending ? 0.7 : 1 }}>
            {createMutation.isPending ? 'Saving...' : 'Add Contact'}
          </button>
        </form>
        {createMutation.isError && <p style={{ color: '#ef4444', fontSize: '14px', marginTop: '12px' }}>{createMutation.error.message}</p>}
      </div>

      <div style={{ ...cardStyle, padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px 24px', borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
          <input 
            placeholder="Search by name or company..." 
            value={searchInput} 
            onChange={(e) => setSearchInput(e.target.value)} 
            style={{ ...inputStyle, width: '100%', maxWidth: '400px' }}
          />
        </div>

        {error && <p style={{ color: '#ef4444', padding: '16px 24px' }}>Error: {error}</p>}

        {data && (
          <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#ffffff', color: '#64748b', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <th style={{ padding: '16px 24px', fontWeight: 600 }}>Name</th>
                <th style={{ padding: '16px 24px', fontWeight: 600 }}>Email</th>
                <th style={{ padding: '16px 24px', fontWeight: 600 }}>Company</th>
                <th style={{ padding: '16px 24px', fontWeight: 600 }}>Title</th>
              </tr>
            </thead>
            <tbody style={{ opacity: loading ? 0.6 : 1, transition: 'opacity 0.2s' }}>
              {data.items.length === 0 ? (
                <tr><td colSpan={4} style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>No contacts found.</td></tr>
              ) : (
                data.items.map((c) => (
                  <tr key={c._id} style={{ borderTop: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '16px 24px', fontWeight: 500, color: '#0f172a' }}>{c.name}</td>
                    <td style={{ padding: '16px 24px', color: '#475569' }}>{c.email}</td>
                    <td style={{ padding: '16px 24px', color: '#475569' }}>{c.company || '—'}</td>
                    <td style={{ padding: '16px 24px', color: '#475569' }}>{c.title || '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderTop: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
          <button 
            disabled={params.page === 1 || loading} 
            onClick={() => setParams((p) => ({ ...p, page: (p.page || 1) - 1 }))}
            style={{ ...btnStyle, backgroundColor: '#ffffff', color: '#0f172a', border: '1px solid #cbd5e1', opacity: (params.page === 1 || loading) ? 0.5 : 1 }}
          >
            Previous
          </button>
          <span style={{ fontSize: '14px', color: '#475569', fontWeight: 500 }}>Page {params.page}</span>
          <button 
            disabled={!hasNextPage || loading} 
            onClick={() => setParams((p) => ({ ...p, page: (p.page || 1) + 1 }))}
            style={{ ...btnStyle, backgroundColor: '#ffffff', color: '#0f172a', border: '1px solid #cbd5e1', opacity: (!hasNextPage || loading) ? 0.5 : 1 }}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
