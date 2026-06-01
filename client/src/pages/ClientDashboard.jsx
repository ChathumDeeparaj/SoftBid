import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';

export default function ClientDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/signin');
      return;
    }

    const fetchData = async () => {
      try {
        // Fetch User Profile
        const userRes = await fetch('http://localhost:5001/api/auth/me', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!userRes.ok) throw new Error('Failed to fetch user profile');
        const userData = await userRes.json();
        
        if (userData.role !== 'client') {
          navigate('/provider/dashboard');
          return;
        }
        setUser(userData);

        // Fetch Client's Projects
        const projRes = await fetch('http://localhost:5001/api/projects/my-projects', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (projRes.ok) {
          const projData = await projRes.json();
          setProjects(projData);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  const gradientText = {
    background: 'linear-gradient(135deg, #a5b4fc 0%, #c084fc 100%)',
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
  };

  const primaryBtn = {
    padding: '12px 24px', borderRadius: '10px', fontSize: '0.95rem',
    fontWeight: 700, cursor: 'pointer', border: 'none',
    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
    color: '#fff', boxShadow: '0 0 24px rgba(99,102,241,0.4)',
    textDecoration: 'none', transition: 'transform 0.2s ease',
    display: 'inline-block'
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#080a14', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#64748b' }}>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#080a14', fontFamily: "'Inter','Segoe UI',sans-serif" }}>
      <Navbar />

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '60px 24px' }}>
        {/* Welcome Section */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <h1 style={{ fontSize: '2.2rem', fontWeight: 900, color: '#f1f5f9', margin: '0 0 8px' }}>
              Welcome back, <span style={gradientText}>{user?.companyName || user?.email.split('@')[0]}</span>
            </h1>
            <p style={{ fontSize: '0.95rem', color: '#64748b', margin: 0 }}>
              Manage your software projects and review active bids.
            </p>
          </div>
          
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <Link to="/providers" style={{ ...primaryBtn, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', boxShadow: 'none' }} onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}>
              Browse Providers
            </Link>
            <Link to="/post-project" style={primaryBtn} onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}>
              + Post New Project
            </Link>
          </div>
        </div>

        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#fca5a5', padding: '16px', borderRadius: '12px', marginBottom: '30px' }}>
            {error}
          </div>
        )}

        {/* Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px', marginBottom: '50px' }}>
          {[
            { label: 'Active Projects', value: projects.filter(p => p.status !== 'completed').length, color: '#6366f1' },
            { label: 'Total Projects Posted', value: projects.length, color: '#8b5cf6' },
            { label: 'Total Bids Received', value: 0, color: '#c084fc' }, // Placeholder for future sprint
          ].map((stat, i) => (
            <div key={i} style={{ 
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', 
              borderRadius: '20px', padding: '24px', position: 'relative', overflow: 'hidden' 
            }}>
              <div style={{ position: 'absolute', top: 0, right: 0, width: '100px', height: '100px', background: `radial-gradient(circle, ${stat.color}30 0%, transparent 70%)`, transform: 'translate(30%, -30%)' }} />
              <h3 style={{ fontSize: '0.85rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 12px', fontWeight: 600 }}>{stat.label}</h3>
              <p style={{ fontSize: '2.5rem', fontWeight: 900, color: '#f1f5f9', margin: 0 }}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Projects List */}
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f1f5f9', margin: '0 0 24px' }}>Your Projects</h2>
          
          {projects.length === 0 ? (
            <div style={{ 
              background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.15)', 
              borderRadius: '20px', padding: '60px 24px', textAlign: 'center' 
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🚀</div>
              <h3 style={{ color: '#f1f5f9', fontSize: '1.2rem', margin: '0 0 12px' }}>No projects yet</h3>
              <p style={{ color: '#64748b', fontSize: '0.9rem', maxWidth: '400px', margin: '0 auto 24px' }}>
                You haven't posted any software projects yet. Post your first project to start receiving bids from top freelancers.
              </p>
              <Link to="/post-project" style={{ color: '#a5b4fc', textDecoration: 'none', fontWeight: 600 }}>
                Post your first project →
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {projects.map(project => (
                <div key={project._id} style={{ 
                  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', 
                  borderRadius: '16px', padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  transition: 'background 0.2s', cursor: 'pointer'
                }} onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'} onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}>
                  
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f1f5f9', margin: 0 }}>{project.title}</h3>
                      <span style={{ 
                        fontSize: '0.7rem', padding: '4px 10px', borderRadius: '999px', fontWeight: 600, textTransform: 'uppercase',
                        background: project.status === 'open' ? 'rgba(99,102,241,0.2)' : 'rgba(139,92,246,0.2)',
                        color: project.status === 'open' ? '#818cf8' : '#a78bfa'
                      }}>
                        {project.status}
                      </span>
                    </div>
                    <p style={{ color: '#94a3b8', fontSize: '0.9rem', margin: '0 0 12px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {project.description}
                    </p>
                    <div style={{ display: 'flex', gap: '16px', fontSize: '0.8rem', color: '#64748b' }}>
                      <span>💰 {project.budgetRange}</span>
                      <span>📅 Posted {new Date(project.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  <div style={{ paddingLeft: '24px' }}>
                    <button style={{ 
                      background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', 
                      padding: '10px 20px', color: '#f1f5f9', fontWeight: 600, cursor: 'pointer', transition: 'border 0.2s'
                    }} onMouseOver={e => e.currentTarget.style.borderColor = '#6366f1'} onMouseOut={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'}>
                      View Bids
                    </button>
                  </div>

                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
