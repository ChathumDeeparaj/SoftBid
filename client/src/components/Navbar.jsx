import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

const NAV_LINKS = [
  { label: 'Home', to: '/' },
  { label: 'Post a Project', to: '/post-project' },
  { label: 'Live Auctions', to: '/auction' },
];

const Navbar = () => {
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll);
    
    // Check if user is logged in
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUserRole(payload.role);
      } catch (e) {
        console.error('Invalid token');
      }
    }
    
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUserRole(null);
    window.location.href = '/';
  };

  const getDashboardLink = () => {
    if (userRole === 'admin') return '/admin/dashboard';
    if (userRole === 'client') return '/client/dashboard';
    return '/provider/dashboard';
  };

  return (
    <nav
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        transition: 'all 0.3s ease',
        background: scrolled
          ? 'rgba(9, 11, 23, 0.92)'
          : 'rgba(9, 11, 23, 0.75)',
        backdropFilter: 'blur(18px)',
        WebkitBackdropFilter: 'blur(18px)',
        borderBottom: scrolled
          ? '1px solid rgba(99, 102, 241, 0.25)'
          : '1px solid rgba(99, 102, 241, 0.1)',
        boxShadow: scrolled ? '0 4px 32px rgba(0,0,0,0.45)' : 'none',
      }}
    >
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '68px' }}>

          {/* ── Logo ── */}
          <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* Icon mark */}
            <div style={{
              width: '34px', height: '34px', borderRadius: '9px',
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 14px rgba(99,102,241,0.5)',
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M13 10V3L4 14h7v7l9-11h-7z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span style={{
              fontSize: '1.35rem', fontWeight: 800, letterSpacing: '-0.5px',
              background: 'linear-gradient(135deg, #e0e7ff 0%, #a5b4fc 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>
              SoftBid
            </span>
          </Link>

          {/* ── Desktop nav links ── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }} className="navbar-desktop-links">
            {NAV_LINKS.map(({ label, to }) => (
              <Link
                key={to}
                to={to}
                style={{
                  textDecoration: 'none',
                  padding: '6px 14px',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  transition: 'all 0.2s ease',
                  color: isActive(to) ? '#a5b4fc' : 'rgba(209,213,219,0.8)',
                  background: isActive(to) ? 'rgba(99,102,241,0.15)' : 'transparent',
                }}
                onMouseEnter={e => {
                  if (!isActive(to)) {
                    e.currentTarget.style.color = '#e0e7ff';
                    e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                  }
                }}
                onMouseLeave={e => {
                  if (!isActive(to)) {
                    e.currentTarget.style.color = 'rgba(209,213,219,0.8)';
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
              >
                {label}
              </Link>
            ))}
          </div>

          {/* ── Auth buttons ── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }} className="navbar-desktop-links">
            {userRole ? (
              <>
                <Link to={getDashboardLink()} style={{ textDecoration: 'none' }}>
                  <button
                    style={{
                      padding: '8px 20px',
                      borderRadius: '9px',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      background: 'transparent',
                      color: 'rgba(209,213,219,0.9)',
                      border: '1px solid rgba(99,102,241,0.4)',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = 'rgba(99,102,241,0.12)';
                      e.currentTarget.style.color = '#a5b4fc';
                      e.currentTarget.style.borderColor = 'rgba(99,102,241,0.7)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = 'rgba(209,213,219,0.9)';
                      e.currentTarget.style.borderColor = 'rgba(99,102,241,0.4)';
                    }}
                  >
                    Dashboard
                  </button>
                </Link>
                <button
                  onClick={handleLogout}
                  style={{
                    padding: '8px 20px',
                    borderRadius: '9px',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.25s ease',
                    border: '1px solid rgba(239,68,68,0.4)',
                    background: 'rgba(239,68,68,0.1)',
                    color: '#fca5a5',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'rgba(239,68,68,0.2)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'rgba(239,68,68,0.1)';
                  }}
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                {/* Sign In */}
                <Link to="/signin" style={{ textDecoration: 'none' }}>
                  <button
                    style={{
                      padding: '8px 20px',
                      borderRadius: '9px',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      background: 'transparent',
                      color: 'rgba(209,213,219,0.9)',
                      border: '1px solid rgba(99,102,241,0.4)',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = 'rgba(99,102,241,0.12)';
                      e.currentTarget.style.color = '#a5b4fc';
                      e.currentTarget.style.borderColor = 'rgba(99,102,241,0.7)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = 'rgba(209,213,219,0.9)';
                      e.currentTarget.style.borderColor = 'rgba(99,102,241,0.4)';
                    }}
                  >
                    Sign In
                  </button>
                </Link>

                {/* Sign Up */}
                <Link to="/signup" style={{ textDecoration: 'none' }}>
                  <button
                    style={{
                      padding: '8px 20px',
                      borderRadius: '9px',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.25s ease',
                      border: 'none',
                      background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                      color: '#fff',
                      boxShadow: '0 0 18px rgba(99,102,241,0.35)',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.boxShadow = '0 0 26px rgba(99,102,241,0.6)';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.boxShadow = '0 0 18px rgba(99,102,241,0.35)';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    Sign Up
                  </button>
                </Link>
              </>
            )}
          </div>

          {/* ── Hamburger (mobile) ── */}
          <button
            className="navbar-hamburger"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
            style={{
              display: 'none',
              background: 'transparent',
              border: '1px solid rgba(99,102,241,0.35)',
              borderRadius: '8px',
              padding: '6px 10px',
              cursor: 'pointer',
              color: '#a5b4fc',
            }}
          >
            {menuOpen ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="3" y1="8" x2="21" y2="8" /><line x1="3" y1="16" x2="21" y2="16" />
              </svg>
            )}
          </button>

        </div>
      </div>

      {/* ── Mobile menu ── */}
      {menuOpen && (
        <div style={{
          padding: '12px 24px 20px',
          borderTop: '1px solid rgba(99,102,241,0.15)',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
        }}>
          {NAV_LINKS.map(({ label, to }) => (
            <Link
              key={to}
              to={to}
              onClick={() => setMenuOpen(false)}
              style={{
                textDecoration: 'none',
                padding: '10px 14px',
                borderRadius: '8px',
                fontSize: '0.9rem',
                fontWeight: 500,
                color: isActive(to) ? '#a5b4fc' : 'rgba(209,213,219,0.8)',
                background: isActive(to) ? 'rgba(99,102,241,0.15)' : 'transparent',
              }}
            >
              {label}
            </Link>
          ))}
          <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
            {userRole ? (
              <>
                <Link to={getDashboardLink()} style={{ flex: 1, textDecoration: 'none' }} onClick={() => setMenuOpen(false)}>
                  <button style={{
                    width: '100%', padding: '10px', borderRadius: '9px', fontWeight: 600,
                    fontSize: '0.875rem', cursor: 'pointer', background: 'transparent',
                    color: 'rgba(209,213,219,0.9)', border: '1px solid rgba(99,102,241,0.4)',
                  }}>Dashboard</button>
                </Link>
                <button onClick={() => { handleLogout(); setMenuOpen(false); }} style={{
                  flex: 1, width: '100%', padding: '10px', borderRadius: '9px', fontWeight: 600,
                  fontSize: '0.875rem', cursor: 'pointer', border: '1px solid rgba(239,68,68,0.4)',
                  background: 'rgba(239,68,68,0.1)', color: '#fca5a5',
                }}>Logout</button>
              </>
            ) : (
              <>
                <Link to="/signin" style={{ flex: 1, textDecoration: 'none' }} onClick={() => setMenuOpen(false)}>
                  <button style={{
                    width: '100%', padding: '10px', borderRadius: '9px', fontWeight: 600,
                    fontSize: '0.875rem', cursor: 'pointer', background: 'transparent',
                    color: 'rgba(209,213,219,0.9)', border: '1px solid rgba(99,102,241,0.4)',
                  }}>Sign In</button>
                </Link>
                <Link to="/signup" style={{ flex: 1, textDecoration: 'none' }} onClick={() => setMenuOpen(false)}>
                  <button style={{
                    width: '100%', padding: '10px', borderRadius: '9px', fontWeight: 600,
                    fontSize: '0.875rem', cursor: 'pointer', border: 'none',
                    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                    color: '#fff',
                  }}>Sign Up</button>
                </Link>
              </>
            )}
          </div>
        </div>
      )}

      {/* Responsive styles injected inline */}
      <style>{`
        @media (max-width: 768px) {
          .navbar-desktop-links { display: none !important; }
          .navbar-hamburger { display: flex !important; align-items: center; }
        }
      `}</style>
    </nav>
  );
};

export default Navbar;