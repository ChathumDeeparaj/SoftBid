import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('projects');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Data
  const [projects, setProjects] = useState([]);
  const [npeConfig, setNpeConfig] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/signin'); return; }

    const fetchAdminData = async () => {
      try {
        const userRes = await fetch('http://localhost:5001/api/auth/me', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const userData = await userRes.json();
        
        if (userData.role !== 'admin') {
          navigate('/');
          return;
        }
        setUser(userData);

        // Fetch all projects
        const projRes = await fetch('http://localhost:5001/api/projects/all', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (projRes.ok) setProjects(await projRes.json());

        // Fetch NPE config if super admin
        if (userData.isSuperAdmin) {
          const npeRes = await fetch('http://localhost:5001/api/npe/config', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (npeRes.ok) setNpeConfig(await npeRes.json());
        }

      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();
  }, [navigate]);

  const handleUpdateConfig = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5001/api/npe/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(npeConfig)
      });
      if (!res.ok) throw new Error('Failed to update config');
      alert('NPE Configuration updated successfully!');
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return <div style={{ minHeight: '100vh', background: '#080a14', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading Admin Panel...</div>;

  return (
    <div style={{ minHeight: '100vh', background: '#080a14', fontFamily: "'Inter', sans-serif" }}>
      <Navbar />
      
      <div style={{ maxWidth: '1200px', margin: '40px auto', padding: '0 24px' }}>
        <h1 style={{ fontSize: '2.5rem', color: '#f1f5f9', marginBottom: '8px' }}>Admin Dashboard</h1>
        <p style={{ color: '#64748b', marginBottom: '32px' }}>Manage platform activity {user?.isSuperAdmin && 'and mathematical models'}.</p>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '16px', borderBottom: '1px solid rgba(255,255,255,0.1)', marginBottom: '32px' }}>
          <button 
            onClick={() => setActiveTab('projects')}
            style={{ background: 'none', border: 'none', padding: '12px 24px', color: activeTab === 'projects' ? '#a5b4fc' : '#64748b', borderBottom: activeTab === 'projects' ? '2px solid #a5b4fc' : 'none', cursor: 'pointer', fontWeight: 600, fontSize: '1rem' }}>
            All Projects
          </button>
          {user?.isSuperAdmin && (
            <button 
              onClick={() => setActiveTab('npe')}
              style={{ background: 'none', border: 'none', padding: '12px 24px', color: activeTab === 'npe' ? '#a5b4fc' : '#64748b', borderBottom: activeTab === 'npe' ? '2px solid #a5b4fc' : 'none', cursor: 'pointer', fontWeight: 600, fontSize: '1rem' }}>
              NPE Parameters (Super Admin)
            </button>
          )}
        </div>

        {/* Tab Content: Projects */}
        {activeTab === 'projects' && (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', color: '#f1f5f9' }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.05)' }}>
                  <th style={{ padding: '16px', textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Project</th>
                  <th style={{ padding: '16px', textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Client</th>
                  <th style={{ padding: '16px', textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Budget / NPE</th>
                  <th style={{ padding: '16px', textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Risk Flag</th>
                  <th style={{ padding: '16px', textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {projects.map(p => (
                  <tr key={p._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '16px' }}>
                      <div style={{ fontWeight: 600 }}>{p.title}</div>
                      <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{new Date(p.createdAt).toLocaleDateString()}</div>
                    </td>
                    <td style={{ padding: '16px' }}>{p.client?.companyName || p.client?.email}</td>
                    <td style={{ padding: '16px' }}>
                      <div style={{ color: '#fca5a5' }}>LKR {p.clientBudgetLKR?.toLocaleString('en-LK')}</div>
                      <div style={{ color: '#6ee7b7', fontSize: '0.85rem' }}>NPE: {p.npeEstimate?.toLocaleString('en-LK')}</div>
                    </td>
                    <td style={{ padding: '16px' }}>
                      {p.riskAccepted ? <span style={{ color: '#ef4444', background: 'rgba(239,68,68,0.1)', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 600 }}>High Risk (Client Override)</span> : <span style={{ color: '#10b981' }}>Normal</span>}
                    </td>
                    <td style={{ padding: '16px' }}>
                      <span style={{ textTransform: 'uppercase', fontSize: '0.8rem', fontWeight: 700, color: p.status === 'open' ? '#818cf8' : '#94a3b8' }}>{p.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab Content: NPE Parameters */}
        {activeTab === 'npe' && npeConfig && (
          <form onSubmit={handleUpdateConfig} style={{ background: '#0f1320', padding: '32px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <h2 style={{ fontSize: '1.5rem', color: '#f1f5f9', marginBottom: '24px' }}>Mathematical Engine Calibration</h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
              <div>
                <label style={{ display: 'block', color: '#cbd5e1', marginBottom: '8px', fontSize: '0.9rem' }}>Sri Lanka Hourly Rate (LKR)</label>
                <input 
                  type="number" value={npeConfig.hourlyRateLKR} 
                  onChange={e => setNpeConfig({...npeConfig, hourlyRateLKR: Number(e.target.value)})}
                  style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '8px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', color: '#cbd5e1', marginBottom: '8px', fontSize: '0.9rem' }}>Hours per Function Point</label>
                <input 
                  type="number" value={npeConfig.hoursPerFP} 
                  onChange={e => setNpeConfig({...npeConfig, hoursPerFP: Number(e.target.value)})}
                  style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '8px' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '24px', marginBottom: '32px' }}>
              {/* Integration Multipliers */}
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '12px' }}>
                <h3 style={{ color: '#94a3b8', fontSize: '0.9rem', textTransform: 'uppercase', marginBottom: '16px' }}>Integrations (CAF)</h3>
                <label style={{ display: 'flex', justifyContent: 'space-between', color: '#fff', marginBottom: '8px' }}>
                  0-1 <input type="number" step="0.1" value={npeConfig.integrationMultipliers.low} onChange={e => setNpeConfig({...npeConfig, integrationMultipliers: {...npeConfig.integrationMultipliers, low: Number(e.target.value)}})} style={{ width: '60px', background: 'transparent', color: '#fff', border: '1px solid #333' }} />
                </label>
                <label style={{ display: 'flex', justifyContent: 'space-between', color: '#fff', marginBottom: '8px' }}>
                  2-3 <input type="number" step="0.1" value={npeConfig.integrationMultipliers.mid} onChange={e => setNpeConfig({...npeConfig, integrationMultipliers: {...npeConfig.integrationMultipliers, mid: Number(e.target.value)}})} style={{ width: '60px', background: 'transparent', color: '#fff', border: '1px solid #333' }} />
                </label>
                <label style={{ display: 'flex', justifyContent: 'space-between', color: '#fff' }}>
                  4+ <input type="number" step="0.1" value={npeConfig.integrationMultipliers.high} onChange={e => setNpeConfig({...npeConfig, integrationMultipliers: {...npeConfig.integrationMultipliers, high: Number(e.target.value)}})} style={{ width: '60px', background: 'transparent', color: '#fff', border: '1px solid #333' }} />
                </label>
              </div>
              
              {/* Security Multipliers */}
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '12px' }}>
                <h3 style={{ color: '#94a3b8', fontSize: '0.9rem', textTransform: 'uppercase', marginBottom: '16px' }}>Security (CAF)</h3>
                <label style={{ display: 'flex', justifyContent: 'space-between', color: '#fff', marginBottom: '8px' }}>
                  Basic <input type="number" step="0.1" value={npeConfig.securityMultipliers.basic} onChange={e => setNpeConfig({...npeConfig, securityMultipliers: {...npeConfig.securityMultipliers, basic: Number(e.target.value)}})} style={{ width: '60px', background: 'transparent', color: '#fff', border: '1px solid #333' }} />
                </label>
                <label style={{ display: 'flex', justifyContent: 'space-between', color: '#fff', marginBottom: '8px' }}>
                  Standard <input type="number" step="0.1" value={npeConfig.securityMultipliers.standard} onChange={e => setNpeConfig({...npeConfig, securityMultipliers: {...npeConfig.securityMultipliers, standard: Number(e.target.value)}})} style={{ width: '60px', background: 'transparent', color: '#fff', border: '1px solid #333' }} />
                </label>
                <label style={{ display: 'flex', justifyContent: 'space-between', color: '#fff' }}>
                  High <input type="number" step="0.1" value={npeConfig.securityMultipliers.high} onChange={e => setNpeConfig({...npeConfig, securityMultipliers: {...npeConfig.securityMultipliers, high: Number(e.target.value)}})} style={{ width: '60px', background: 'transparent', color: '#fff', border: '1px solid #333' }} />
                </label>
              </div>
            </div>

            {/* Features Management */}
            <div style={{ marginTop: '48px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '32px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{ fontSize: '1.5rem', color: '#f1f5f9' }}>Manage Features & Base FP</h2>
                <button type="button" onClick={() => {
                  const newId = 'feature_' + Date.now();
                  setNpeConfig({
                    ...npeConfig,
                    features: [...(npeConfig.features || []), { id: newId, label: 'New Feature', baseFP: 10 }]
                  });
                }} style={{ padding: '8px 16px', background: 'rgba(16,185,129,0.2)', color: '#34d399', border: '1px solid rgba(16,185,129,0.4)', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>
                  + Add Feature
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px', marginBottom: '32px' }}>
                {(npeConfig.features || []).map((f, i) => (
                  <div key={f.id} style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.8rem', marginBottom: '4px' }}>Label</label>
                      <input type="text" value={f.label} onChange={e => {
                        const newFeatures = [...npeConfig.features];
                        newFeatures[i].label = e.target.value;
                        setNpeConfig({...npeConfig, features: newFeatures});
                      }} style={{ width: '100%', padding: '8px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '6px' }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ flex: 1, marginRight: '16px' }}>
                        <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.8rem', marginBottom: '4px' }}>Base FP</label>
                        <input type="number" value={f.baseFP} onChange={e => {
                          const newFeatures = [...npeConfig.features];
                          newFeatures[i].baseFP = Number(e.target.value);
                          setNpeConfig({...npeConfig, features: newFeatures});
                        }} style={{ width: '100%', padding: '8px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '6px' }} />
                      </div>
                      <button type="button" onClick={() => {
                        setNpeConfig({
                          ...npeConfig,
                          features: npeConfig.features.filter(feat => feat.id !== f.id)
                        });
                      }} style={{ padding: '8px 12px', background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '6px', cursor: 'pointer', alignSelf: 'flex-end' }}>
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button type="submit" style={{ padding: '12px 24px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>
              Save NPE Configuration
            </button>
          </form>
        )}

      </div>
    </div>
  );
}
