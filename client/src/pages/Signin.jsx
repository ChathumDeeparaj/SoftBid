import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const inputStyle = {
  width: '100%', padding: '11px 14px', borderRadius: '10px',
  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)',
  color: '#f1f5f9', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box',
  transition: 'border-color 0.2s',
};
const labelStyle = { display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' };

const Field = ({ label, children }) => (
  <div style={{ marginBottom: '18px' }}>
    <label style={labelStyle}>{label}</label>
    {children}
  </div>
);

const Input = ({ ...props }) => {
  const [focused, setFocused] = useState(false);
  return (
    <input
      {...props}
      style={{ ...inputStyle, borderColor: focused ? 'rgba(99,102,241,0.7)' : 'rgba(255,255,255,0.12)' }}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    />
  );
};

export default function Signin() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.email || !form.password) {
      setError('Please provide both email and password.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('http://localhost:5001/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });

      const data = await res.json();

      if (res.ok) {
        // Save token to localStorage
        localStorage.setItem('token', data.token);

        // Navigate based on role
        if (data.role === 'provider') {
          navigate('/provider/dashboard');
        } else if (data.role === 'client') {
          navigate('/client/dashboard');
        } else if (data.role === 'admin') {
          navigate('/admin/dashboard');
        } else {
          // Fallback
          navigate('/');
        }
      } else {
        setError(data.message || 'Invalid email or password.');
      }
    } catch (err) {
      setError('Network Error. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const gradientText = {
    background: 'linear-gradient(135deg, #a5b4fc 0%, #c084fc 100%)',
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
  };

  const primaryBtn = {
    width: '100%', padding: '13px', borderRadius: '11px', fontSize: '0.95rem',
    fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', border: 'none',
    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
    color: '#fff', boxShadow: '0 0 24px rgba(99,102,241,0.4)',
    transition: 'all 0.2s ease', marginTop: '8px',
    opacity: loading ? 0.7 : 1,
  };

  return (
    <div style={{ minHeight: '100vh', background: '#080a14', display: 'flex', flexDirection: 'column', fontFamily: "'Inter','Segoe UI',sans-serif" }}>
      {/* Top bar */}
      <div style={{ padding: '20px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><path d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
          </div>
          <span style={{ fontWeight: 800, fontSize: '1.15rem', ...gradientText }}>SoftBid</span>
        </Link>
        <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
          Don't have an account?{' '}
          <Link to="/signup" style={{ color: '#a5b4fc', fontWeight: 600, textDecoration: 'none' }}>Sign Up</Link>
        </span>
      </div>

      {/* Content */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
        <div style={{ width: '100%', maxWidth: '450px' }}>
          {/* Card */}
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '24px', padding: '40px 36px' }}>

            <h1 style={{ fontSize: '1.7rem', fontWeight: 900, color: '#f1f5f9', margin: '0 0 8px', letterSpacing: '-0.03em' }}>
              Welcome back
            </h1>
            <p style={{ fontSize: '0.9rem', color: '#64748b', margin: '0 0 32px' }}>Sign in to your SoftBid account</p>

            {error && (
              <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#fca5a5', padding: '12px', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '20px' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleLogin}>
              <Field label="Email Address">
                <Input type="email" placeholder="john@example.com" value={form.email} onChange={set('email')} />
              </Field>

              <Field label="Password">
                <Input type="password" placeholder="••••••••" value={form.password} onChange={set('password')} />
              </Field>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '-10px', marginBottom: '24px' }}>
                <span style={{ fontSize: '0.8rem', color: '#a5b4fc', cursor: 'pointer', fontWeight: 600 }}>Forgot password?</span>
              </div>

              <button type="submit" style={primaryBtn} disabled={loading}>
                {loading ? 'Signing in...' : 'Sign In →'}
              </button>
            </form>

          </div>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; }
        input::placeholder { color: #334155; }
      `}</style>
    </div>
  );
}
