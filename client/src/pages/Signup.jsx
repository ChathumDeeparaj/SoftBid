import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const SKILLS_LIST = ['React', 'Vue', 'Angular', 'Node.js', 'Python', 'Django', 'Laravel', 'PHP', 'iOS', 'Android', 'Flutter', 'AWS', 'DevOps', 'UI/UX', 'Blockchain', 'AI/ML', 'PostgreSQL', 'MongoDB'];

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

const Select = ({ children, ...props }) => {
  const [focused, setFocused] = useState(false);
  return (
    <select
      {...props}
      style={{ ...inputStyle, borderColor: focused ? 'rgba(99,102,241,0.7)' : 'rgba(255,255,255,0.12)', appearance: 'none', cursor: 'pointer' }}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    >
      {children}
    </select>
  );
};

export default function Signup() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1=role, 2=basic, 3=profile
  const [role, setRole] = useState(''); // 'client' | 'freelancer'
  const [skills, setSkills] = useState([]);
  const [form, setForm] = useState({
    fullName: '', email: '', password: '', confirmPassword: '',
    // client
    companyName: '', website: '', industry: '', budgetRange: '', phone: '',
    // freelancer
    title: '', hourlyRate: '', experience: '', portfolio: '', github: '', bio: '', location: '',
  });

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));
  const toggleSkill = (s) => setSkills(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);

  const handleRegister = async () => {
    try {
      const payload = {
        email: form.email,
        password: form.password,
        role: role === 'freelancer' ? 'provider' : 'client', // Map to backend role
      };

      if (role === 'client') {
        payload.companyName = form.companyName || 'N/A';
      } else {
        payload.portfolioUrl = form.portfolio || 'N/A';
        payload.yearsExperience = parseInt(form.experience.split('–')[0]) || 0; // Simple parse
      }

      const res = await fetch('http://localhost:5001/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok) {
        alert('Account created successfully! Token: ' + data.token);
        // Save token to localStorage here
        localStorage.setItem('token', data.token);
        
        // Navigate to the correct dashboard based on role
        if (data.role === 'provider') {
          navigate('/provider/dashboard');
        } else {
          navigate('/client/dashboard');
        }
      } else {
        alert('Error: ' + data.message);
      }
    } catch (error) {
      alert('Network Error: ' + error.message);
    }
  };

  const gradientText = {
    background: 'linear-gradient(135deg, #a5b4fc 0%, #c084fc 100%)',
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
  };

  const primaryBtn = {
    width: '100%', padding: '13px', borderRadius: '11px', fontSize: '0.95rem',
    fontWeight: 700, cursor: 'pointer', border: 'none',
    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
    color: '#fff', boxShadow: '0 0 24px rgba(99,102,241,0.4)',
    transition: 'all 0.2s ease', marginTop: '8px',
  };

  const steps = ['Role', 'Account', 'Profile'];

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
          Already have an account?{' '}
          <Link to="/signin" style={{ color: '#a5b4fc', fontWeight: 600, textDecoration: 'none' }}>Sign In</Link>
        </span>
      </div>

      {/* Content */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
        <div style={{ width: '100%', maxWidth: '500px' }}>

          {/* Step indicator */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0', marginBottom: '40px' }}>
            {steps.map((s, i) => {
              const idx = i + 1;
              const done = step > idx;
              const active = step === idx;
              return (
                <React.Fragment key={s}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                    <div style={{
                      width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 700, fontSize: '0.85rem',
                      background: done ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : active ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.05)',
                      border: active ? '2px solid #6366f1' : done ? 'none' : '1px solid rgba(255,255,255,0.1)',
                      color: done || active ? '#a5b4fc' : '#475569',
                    }}>
                      {done ? '✓' : idx}
                    </div>
                    <span style={{ fontSize: '0.72rem', fontWeight: 600, color: active ? '#a5b4fc' : '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{s}</span>
                  </div>
                  {i < steps.length - 1 && (
                    <div style={{ width: '60px', height: '1px', background: step > idx ? 'rgba(99,102,241,0.6)' : 'rgba(255,255,255,0.08)', margin: '0 8px 22px' }} />
                  )}
                </React.Fragment>
              );
            })}
          </div>

          {/* Card */}
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '24px', padding: '36px 32px' }}>

            {/* ── STEP 1: Role ── */}
            {step === 1 && (
              <div>
                <h1 style={{ fontSize: '1.7rem', fontWeight: 900, color: '#f1f5f9', margin: '0 0 8px', letterSpacing: '-0.03em' }}>
                  Join <span style={gradientText}>SoftBid</span>
                </h1>
                <p style={{ fontSize: '0.9rem', color: '#64748b', margin: '0 0 32px' }}>Choose how you'll use SoftBid</p>

                {/* Role cards */}
                {[
                  {
                    id: 'client',
                    emoji: '🏢',
                    title: "I need software built",
                    sub: "Post projects, receive bids, hire the best freelancers at the most competitive price.",
                    tags: ['Post Projects', 'Compare Bids', 'Escrow Payments'],
                    color: '#6366f1',
                  },
                  {
                    id: 'freelancer',
                    emoji: '💻',
                    title: "I'm a freelancer or agency",
                    sub: "Bid on software projects, showcase your skills, and grow your freelance & agency career",
                    tags: ['Bid on Projects', 'Build Portfolio', 'Get Paid Fast'],
                    color: '#8b5cf6',
                  },
                ].map(r => (
                  <div key={r.id} onClick={() => setRole(r.id)} style={{
                    border: `2px solid ${role === r.id ? r.color : 'rgba(255,255,255,0.08)'}`,
                    borderRadius: '16px', padding: '22px', marginBottom: '14px', cursor: 'pointer',
                    background: role === r.id ? `${r.color}14` : 'rgba(255,255,255,0.02)',
                    transition: 'all 0.2s ease',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                      <div style={{ fontSize: '2rem', lineHeight: 1 }}>{r.emoji}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <h3 style={{ margin: '0 0 6px', fontSize: '1rem', fontWeight: 700, color: '#f1f5f9' }}>{r.title}</h3>
                          <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: `2px solid ${role === r.id ? r.color : '#334155'}`, background: role === r.id ? r.color : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            {role === r.id && <span style={{ color: '#fff', fontSize: '0.7rem' }}>✓</span>}
                          </div>
                        </div>
                        <p style={{ margin: '0 0 12px', fontSize: '0.82rem', color: '#64748b', lineHeight: 1.6 }}>{r.sub}</p>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          {r.tags.map(t => (
                            <span key={t} style={{ fontSize: '0.72rem', fontWeight: 600, padding: '3px 10px', borderRadius: '999px', background: `${r.color}20`, color: role === r.id ? r.color : '#475569', border: `1px solid ${role === r.id ? r.color + '40' : 'transparent'}` }}>{t}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                <button style={{ ...primaryBtn, opacity: role ? 1 : 0.4 }} disabled={!role} onClick={() => role && setStep(2)}>
                  Continue →
                </button>
              </div>
            )}

            {/* ── STEP 2: Basic Account Info ── */}
            {step === 2 && (
              <div>
                <h1 style={{ fontSize: '1.6rem', fontWeight: 900, color: '#f1f5f9', margin: '0 0 6px', letterSpacing: '-0.03em' }}>Create your account</h1>
                <p style={{ fontSize: '0.88rem', color: '#64748b', margin: '0 0 28px' }}>Basic information for your {role === 'client' ? 'client' : 'freelancer'} profile</p>

                <Field label="Full Name">
                  <Input type="text" placeholder="John Smith" value={form.fullName} onChange={set('fullName')} />
                </Field>
                <Field label="Email Address">
                  <Input type="email" placeholder="john@example.com" value={form.email} onChange={set('email')} />
                </Field>
                <Field label="Password">
                  <Input type="password" placeholder="Min. 8 characters" value={form.password} onChange={set('password')} />
                </Field>
                <Field label="Confirm Password">
                  <Input type="password" placeholder="Repeat your password" value={form.confirmPassword} onChange={set('confirmPassword')} />
                </Field>

                {form.password && form.confirmPassword && form.password !== form.confirmPassword && (
                  <p style={{ color: '#f87171', fontSize: '0.8rem', marginTop: '-12px', marginBottom: '12px' }}>Passwords do not match</p>
                )}

                <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                  <button onClick={() => setStep(1)} style={{ flex: 1, padding: '13px', borderRadius: '11px', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8' }}>← Back</button>
                  <button
                    onClick={() => { if (form.fullName && form.email && form.password && form.password === form.confirmPassword) setStep(3); }}
                    style={{ ...primaryBtn, flex: 2, marginTop: 0, opacity: (form.fullName && form.email && form.password && form.password === form.confirmPassword) ? 1 : 0.4 }}
                  >Continue →</button>
                </div>
              </div>
            )}

            {/* ── STEP 3: Role-specific ── */}
            {step === 3 && role === 'client' && (
              <div>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#f1f5f9', margin: '0 0 6px', letterSpacing: '-0.03em' }}>🏢 Client Profile</h1>
                <p style={{ fontSize: '0.88rem', color: '#64748b', margin: '0 0 24px' }}>Tell freelancers about your business</p>

                <Field label="Company / Organisation Name">
                  <Input type="text" placeholder="Acme Corp (optional)" value={form.companyName} onChange={set('companyName')} />
                </Field>
                <Field label="Company Website">
                  <Input type="url" placeholder="https://yourcompany.com (optional)" value={form.website} onChange={set('website')} />
                </Field>
                <Field label="Industry">
                  <Select value={form.industry} onChange={set('industry')}>
                    <option value="">Select your industry</option>
                    {['Technology', 'Finance & Fintech', 'Healthcare', 'E-Commerce', 'Education', 'Media & Entertainment', 'Real Estate', 'Logistics', 'Government', 'Other'].map(i => <option key={i} value={i}>{i}</option>)}
                  </Select>
                </Field>
                <Field label="Typical Project Budget Range">
                  <Select value={form.budgetRange} onChange={set('budgetRange')}>
                    <option value="">Select budget range</option>
                    {['Under $500', '$500 – $2,000', '$2,000 – $10,000', '$10,000 – $50,000', '$50,000+'].map(b => <option key={b} value={b}>{b}</option>)}
                  </Select>
                </Field>
                <Field label="Phone Number (optional)">
                  <Input type="tel" placeholder="+1 555 000 0000" value={form.phone} onChange={set('phone')} />
                </Field>

                <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                  <button onClick={() => setStep(2)} style={{ flex: 1, padding: '13px', borderRadius: '11px', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8' }}>← Back</button>
                  <button onClick={handleRegister} style={{ ...primaryBtn, flex: 2, marginTop: 0 }}>🚀 Create Account</button>
                </div>
              </div>
            )}

            {step === 3 && role === 'freelancer' && (
              <div>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#f1f5f9', margin: '0 0 6px', letterSpacing: '-0.03em' }}>💻 Freelancer Profile</h1>
                <p style={{ fontSize: '0.88rem', color: '#64748b', margin: '0 0 24px' }}>Showcase yourself to potential clients</p>

                <Field label="Professional Title">
                  <Input type="text" placeholder="e.g. Full Stack React Developer" value={form.title} onChange={set('title')} />
                </Field>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <Field label="Hourly Rate (USD)">
                    <Input type="number" placeholder="50" value={form.hourlyRate} onChange={set('hourlyRate')} />
                  </Field>
                  <Field label="Years of Experience">
                    <Select value={form.experience} onChange={set('experience')}>
                      <option value="">Select</option>
                      {['0–1 years', '1–3 years', '3–5 years', '5–10 years', '10+ years'].map(e => <option key={e} value={e}>{e}</option>)}
                    </Select>
                  </Field>
                </div>

                <Field label="Skills (select all that apply)">
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '4px' }}>
                    {SKILLS_LIST.map(skill => (
                      <button key={skill} type="button" onClick={() => toggleSkill(skill)} style={{
                        padding: '5px 13px', borderRadius: '999px', fontSize: '0.78rem', fontWeight: 600,
                        cursor: 'pointer', transition: 'all 0.15s ease', border: 'none',
                        background: skills.includes(skill) ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : 'rgba(255,255,255,0.06)',
                        color: skills.includes(skill) ? '#fff' : '#64748b',
                        boxShadow: skills.includes(skill) ? '0 0 10px rgba(99,102,241,0.35)' : 'none',
                      }}>
                        {skill}
                      </button>
                    ))}
                  </div>
                </Field>

                <Field label="Portfolio / Website URL">
                  <Input type="url" placeholder="https://myportfolio.dev" value={form.portfolio} onChange={set('portfolio')} />
                </Field>
                <Field label="GitHub Profile URL">
                  <Input type="url" placeholder="https://github.com/username" value={form.github} onChange={set('github')} />
                </Field>
                <Field label="Location">
                  <Input type="text" placeholder="e.g. New York, USA" value={form.location} onChange={set('location')} />
                </Field>
                <Field label="Short Bio">
                  <textarea
                    placeholder="Tell clients what makes you unique (150 chars max)..."
                    maxLength={150}
                    value={form.bio}
                    onChange={set('bio')}
                    rows={3}
                    style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }}
                  />
                  <span style={{ fontSize: '0.72rem', color: '#475569' }}>{form.bio.length}/150</span>
                </Field>

                <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                  <button onClick={() => setStep(2)} style={{ flex: 1, padding: '13px', borderRadius: '11px', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8' }}>← Back</button>
                  <button onClick={handleRegister} style={{ ...primaryBtn, flex: 2, marginTop: 0 }}>🚀 Create Account</button>
                </div>
              </div>
            )}

          </div>

          <p style={{ textAlign: 'center', fontSize: '0.78rem', color: '#334155', marginTop: '20px' }}>
            By signing up you agree to our{' '}
            <span style={{ color: '#6366f1', cursor: 'pointer' }}>Terms of Service</span> and{' '}
            <span style={{ color: '#6366f1', cursor: 'pointer' }}>Privacy Policy</span>
          </p>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; }
        input::placeholder, textarea::placeholder { color: #334155; }
        select option { background: #1e1f2e; color: #f1f5f9; }
      `}</style>
    </div>
  );
}
