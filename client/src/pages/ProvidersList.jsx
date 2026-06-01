import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';

export default function ProvidersList() {
  const navigate = useNavigate();
  const [providers, setProviders] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/signin');
      return;
    }

    const fetchProviders = async () => {
      try {
        const res = await fetch('http://localhost:5001/api/users/providers', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!res.ok) throw new Error('Failed to fetch providers');
        const data = await res.json();
        setProviders(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProviders();
  }, [navigate]);

  // Client-side search filtering
  const filteredProviders = providers.filter(p => {
    const query = searchQuery.toLowerCase();
    const matchEmail = p.email && p.email.toLowerCase().includes(query);
    const matchPortfolio = p.portfolioUrl && p.portfolioUrl.toLowerCase().includes(query);
    const matchExperience = p.yearsExperience && p.yearsExperience.toString().includes(query);
    return matchEmail || matchPortfolio || matchExperience;
  });

  const gradientText = {
    background: 'linear-gradient(135deg, #a5b4fc 0%, #c084fc 100%)',
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
  };

  const inputStyle = {
    width: '100%', padding: '16px 20px', borderRadius: '14px',
    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)',
    color: '#f1f5f9', fontSize: '1rem', outline: 'none', boxSizing: 'border-box',
    transition: 'border-color 0.2s', boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
  };

  return (
    <div style={{ minHeight: '100vh', background: '#080a14', fontFamily: "'Inter','Segoe UI',sans-serif" }}>
      <Navbar />

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '60px 24px' }}>
        
        {/* Header & Search */}
        <div style={{ marginBottom: '50px', textAlign: 'center' }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: '#f1f5f9', margin: '0 0 12px' }}>
            Browse <span style={gradientText}>Software Providers</span>
          </h1>
          <p style={{ fontSize: '1.05rem', color: '#64748b', margin: '0 auto 32px', maxWidth: '600px' }}>
            Discover top-tier talent, browse portfolios, and find the perfect partner for your next software project.
          </p>
          
          <div style={{ maxWidth: '600px', margin: '0 auto', position: 'relative' }}>
            <input 
              type="text" 
              placeholder="Search by email, portfolio, or years of experience..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={inputStyle}
              onFocus={e => e.target.style.borderColor = 'rgba(99,102,241,0.7)'}
              onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.12)'}
            />
            <div style={{ position: 'absolute', right: '20px', top: '16px', color: '#64748b' }}>
              🔍
            </div>
          </div>
        </div>

        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#fca5a5', padding: '16px', borderRadius: '12px', marginBottom: '30px', textAlign: 'center' }}>
            {error}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div style={{ textAlign: 'center', color: '#64748b', padding: '40px' }}>
            Loading providers...
          </div>
        )}

        {/* Providers Grid */}
        {!loading && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
            
            {filteredProviders.length === 0 ? (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px 24px', color: '#64748b', background: 'rgba(255,255,255,0.02)', borderRadius: '20px', border: '1px dashed rgba(255,255,255,0.15)' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>🔍</div>
                <h3 style={{ color: '#f1f5f9', margin: '0 0 8px' }}>No providers found</h3>
                <p style={{ margin: 0 }}>Try adjusting your search query.</p>
              </div>
            ) : (
              filteredProviders.map(provider => (
                <div key={provider._id} style={{
                  background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '20px', padding: '28px', transition: 'all 0.2s', cursor: 'pointer',
                  display: 'flex', flexDirection: 'column'
                }} onMouseOver={e => e.currentTarget.style.transform = 'translateY(-4px)'} onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                    <div style={{ width: '50px', height: '50px', borderRadius: '12px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', color: '#fff', fontWeight: 800 }}>
                      {provider.email.charAt(0).toUpperCase()}
                    </div>
                    {provider.isVerified && (
                      <span style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', padding: '4px 10px', borderRadius: '999px', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase' }}>
                        Verified
                      </span>
                    )}
                  </div>

                  <h3 style={{ color: '#f1f5f9', fontSize: '1.15rem', fontWeight: 700, margin: '0 0 4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {provider.email}
                  </h3>
                  
                  <div style={{ display: 'flex', gap: '12px', margin: '16px 0', fontSize: '0.85rem', color: '#94a3b8' }}>
                    <span style={{ background: 'rgba(255,255,255,0.05)', padding: '6px 12px', borderRadius: '8px' }}>
                      💼 {provider.yearsExperience || 0} Yrs Exp.
                    </span>
                  </div>

                  <div style={{ marginTop: 'auto', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                    {provider.portfolioUrl && provider.portfolioUrl !== 'N/A' ? (
                      <a href={provider.portfolioUrl} target="_blank" rel="noreferrer" style={{ color: '#a5b4fc', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }} onClick={e => e.stopPropagation()}>
                        View Portfolio ↗
                      </a>
                    ) : (
                      <span style={{ color: '#64748b', fontSize: '0.9rem' }}>No portfolio provided</span>
                    )}
                  </div>

                </div>
              ))
            )}
            
          </div>
        )}

      </div>
    </div>
  );
}
