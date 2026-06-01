import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';

/* ─── Tiny reusable animated counter ─── */
const AnimCounter = ({ target, suffix = '' }) => {
  const ref = useRef(null);
  useEffect(() => {
    let start = 0;
    const duration = 1800;
    const step = (timestamp) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      if (ref.current) ref.current.textContent = Math.floor(ease * target) + suffix;
      if (progress < 1) requestAnimationFrame(step);
    };
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { requestAnimationFrame(step); observer.disconnect(); }
    }, { threshold: 0.5 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, suffix]);
  return <span ref={ref}>0{suffix}</span>;
};

/* ─── Data ─── */
const STATS = [
  { value: 12400, suffix: '+', label: 'Projects Posted' },
  { value: 98,    suffix: '%', label: 'Client Satisfaction' },
  { value: 3200,  suffix: '+', label: 'Expert Freelancers' },
  { value: 48,    suffix: 'h', label: 'Avg. First Bid' },
];

const FEATURES = [
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M13 10V3L4 14h7v7l9-11h-7z"/>
      </svg>
    ),
    title: 'Live Reverse Auctions',
    desc: 'Watch bids drop in real-time. Our live auction engine ensures you always get the most competitive price.',
    color: '#6366f1',
    glow: 'rgba(99,102,241,0.3)',
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="4"/><path d="M6 20v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/>
      </svg>
    ),
    title: 'Verified Freelancers',
    desc: 'Every bidder is skill-verified and portfolio-reviewed. You only deal with professionals who can deliver.',
    color: '#8b5cf6',
    glow: 'rgba(139,92,246,0.3)',
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
      </svg>
    ),
    title: 'Escrow Protection',
    desc: 'Funds are held securely until milestones are met. Pay only when you are 100% satisfied.',
    color: '#a78bfa',
    glow: 'rgba(167,139,250,0.3)',
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
      </svg>
    ),
    title: 'Real-Time Analytics',
    desc: 'Track bid history, market rates, and project performance with an intuitive live dashboard.',
    color: '#c084fc',
    glow: 'rgba(192,132,252,0.3)',
  },
];

const STEPS = [
  { num: '01', title: 'Post Your Project', desc: 'Describe your software project, set your budget ceiling, and publish in under 2 minutes.' },
  { num: '02', title: 'Bids Roll In', desc: 'Qualified freelancers compete in a live reverse auction, driving prices down for you.' },
  { num: '03', title: 'Pick the Best', desc: 'Compare portfolios, reviews, and bid prices then award the project with one click.' },
  { num: '04', title: 'Ship It', desc: 'Collaborate on milestones with built-in messaging and release payment upon delivery.' },
];

const CATEGORIES = [
  '⚛️ React / Next.js', '🐍 Python / Django', '📱 iOS & Android', '☁️ Cloud & DevOps',
  '🔗 Blockchain', '🤖 AI / ML', '🎨 UI / UX Design', '🗄️ Database Architecture',
];

/* ─── Styles helper ─── */
const s = {
  page: {
    minHeight: '100vh',
    background: '#080a14',
    color: '#e2e8f0',
    fontFamily: "'Inter', 'Segoe UI', sans-serif",
    overflowX: 'hidden',
  },
  section: (pt = 96, pb = 96) => ({
    padding: `${pt}px 24px ${pb}px`,
    maxWidth: '1200px',
    margin: '0 auto',
  }),
  sectionLabel: {
    display: 'inline-block',
    fontSize: '0.75rem',
    fontWeight: 700,
    letterSpacing: '2px',
    textTransform: 'uppercase',
    color: '#818cf8',
    background: 'rgba(99,102,241,0.12)',
    border: '1px solid rgba(99,102,241,0.25)',
    borderRadius: '999px',
    padding: '4px 14px',
    marginBottom: '16px',
  },
  h2: {
    fontSize: 'clamp(1.9rem, 4vw, 2.8rem)',
    fontWeight: 800,
    letterSpacing: '-0.04em',
    color: '#f1f5f9',
    margin: '0 0 12px',
    lineHeight: 1.15,
  },
  subtext: {
    fontSize: '1.05rem',
    color: 'rgba(148,163,184,0.85)',
    lineHeight: 1.7,
    maxWidth: '520px',
    margin: '0 auto',
  },
  gradientText: {
    background: 'linear-gradient(135deg, #a5b4fc 0%, #c084fc 50%, #f472b6 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },
};

/* ══════════════════════════════════════════════
   HOME PAGE
══════════════════════════════════════════════ */
const Home = () => {
  const [serverStatus, setServerStatus] = useState('Checking API Connection...');

  useEffect(() => {
    fetch('http://localhost:5001/api/health')
      .then((res) => res.json())
      .then((data) => {
        if (data.status === 'success') setServerStatus('Connected to Backend ✅');
      })
      .catch((err) => setServerStatus('Backend Offline ❌'));
  }, []);

  return (
    <div style={s.page}>
      <Navbar />
      <div style={{ textAlign: 'center', padding: '10px', background: 'rgba(99,102,241,0.1)', fontSize: '14px', borderBottom: '1px solid rgba(99,102,241,0.2)', color: '#818cf8', fontWeight: 'bold' }}>
        System Status: {serverStatus}
      </div>

      {/* ── HERO ── */}
      <section style={{ position: 'relative', overflow: 'hidden', padding: '100px 24px 120px', textAlign: 'center' }}>
        {/* Radial glow blobs */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: `
            radial-gradient(ellipse 60% 45% at 50% -10%, rgba(99,102,241,0.28) 0%, transparent 70%),
            radial-gradient(ellipse 40% 30% at 80% 60%, rgba(139,92,246,0.15) 0%, transparent 60%),
            radial-gradient(ellipse 35% 25% at 15% 70%, rgba(192,132,252,0.12) 0%, transparent 60%)
          `,
        }}/>

        {/* Animated grid dots */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: 'radial-gradient(circle, rgba(99,102,241,0.18) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          maskImage: 'radial-gradient(ellipse 80% 60% at 50% 50%, black 20%, transparent 80%)',
          WebkitMaskImage: 'radial-gradient(ellipse 80% 60% at 50% 50%, black 20%, transparent 80%)',
        }}/>

        <div style={{ position: 'relative', maxWidth: '860px', margin: '0 auto' }}>
          {/* Badge */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '999px', padding: '6px 16px', marginBottom: '32px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#6ee7b7', display: 'inline-block', boxShadow: '0 0 8px #6ee7b7' }}/>
            <span style={{ fontSize: '0.82rem', color: '#a5b4fc', fontWeight: 600, letterSpacing: '0.4px' }}>Live auctions running now</span>
          </div>

          {/* Headline */}
          <h1 style={{ fontSize: 'clamp(2.6rem, 7vw, 5rem)', fontWeight: 900, letterSpacing: '-0.05em', lineHeight: 1.08, margin: '0 0 24px', color: '#f1f5f9' }}>
            Hire Software Talent<br/>
            <span style={s.gradientText}>Through Competitive Bidding</span>
          </h1>

          <p style={{ fontSize: 'clamp(1rem, 2vw, 1.2rem)', color: 'rgba(148,163,184,0.9)', lineHeight: 1.75, maxWidth: '600px', margin: '0 auto 44px' }}>
            Post your project, let verified freelancers compete in real-time reverse auctions, and build better software for less — guaranteed.
          </p>

          {/* CTA buttons */}
          <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/post-project" style={{ textDecoration: 'none' }}>
              <button style={{
                padding: '14px 32px', borderRadius: '12px', fontSize: '1rem', fontWeight: 700,
                cursor: 'pointer', border: 'none',
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                color: '#fff', boxShadow: '0 0 32px rgba(99,102,241,0.45)',
                transition: 'all 0.25s ease',
              }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 0 48px rgba(99,102,241,0.7)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 0 32px rgba(99,102,241,0.45)'; e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                🚀 Post a Project Free
              </button>
            </Link>
            <Link to="/auction" style={{ textDecoration: 'none' }}>
              <button style={{
                padding: '14px 32px', borderRadius: '12px', fontSize: '1rem', fontWeight: 700,
                cursor: 'pointer', background: 'transparent', color: '#c4b5fd',
                border: '1.5px solid rgba(139,92,246,0.5)', transition: 'all 0.25s ease',
              }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(139,92,246,0.12)'; e.currentTarget.style.borderColor = 'rgba(139,92,246,0.8)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(139,92,246,0.5)'; }}
              >
                🎯 Browse Live Auctions
              </button>
            </Link>
          </div>

          {/* Social proof */}
          <div style={{ marginTop: '52px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex' }}>
              {['#6366f1','#8b5cf6','#a78bfa','#c084fc','#e879f9'].map((c, i) => (
                <div key={i} style={{ width: '34px', height: '34px', borderRadius: '50%', background: c, border: '2px solid #080a14', marginLeft: i ? '-10px' : 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, color: '#fff' }}>
                  {String.fromCharCode(65 + i)}
                </div>
              ))}
            </div>
            <p style={{ fontSize: '0.875rem', color: 'rgba(148,163,184,0.8)', margin: 0 }}>
              Trusted by <strong style={{ color: '#a5b4fc' }}>3,200+</strong> clients worldwide
            </p>
            <div style={{ display: 'flex', gap: '2px' }}>
              {[...Array(5)].map((_, i) => <span key={i} style={{ color: '#fbbf24', fontSize: '1rem' }}>★</span>)}
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section style={{ background: 'rgba(255,255,255,0.02)', borderTop: '1px solid rgba(99,102,241,0.12)', borderBottom: '1px solid rgba(99,102,241,0.12)', padding: '56px 24px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '32px', textAlign: 'center' }}>
          {STATS.map((stat) => (
            <div key={stat.label}>
              <div style={{ fontSize: 'clamp(2.2rem, 4vw, 3rem)', fontWeight: 900, letterSpacing: '-0.04em', ...s.gradientText }}>
                <AnimCounter target={stat.value} suffix={stat.suffix} />
              </div>
              <div style={{ fontSize: '0.9rem', color: 'rgba(148,163,184,0.7)', marginTop: '6px', fontWeight: 500 }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section style={{ ...s.section(), textAlign: 'center' }}>
        <span style={s.sectionLabel}>Why SoftBid</span>
        <h2 style={s.h2}>Everything you need to hire<br/>software talent, <span style={s.gradientText}>smarter</span></h2>
        <p style={s.subtext}>We built the tools that make procurement simple, transparent, and incredibly cost-effective.</p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '24px', marginTop: '56px' }}>
          {FEATURES.map((f) => (
            <div key={f.title} style={{
              background: 'rgba(255,255,255,0.03)',
              border: `1px solid rgba(255,255,255,0.07)`,
              borderRadius: '20px',
              padding: '32px 28px',
              textAlign: 'left',
              transition: 'all 0.3s ease',
              cursor: 'default',
            }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                e.currentTarget.style.borderColor = `${f.color}55`;
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = `0 16px 48px ${f.glow}`;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: `${f.color}22`, border: `1px solid ${f.color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: f.color, marginBottom: '20px' }}>
                {f.icon}
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f1f5f9', margin: '0 0 10px' }}>{f.title}</h3>
              <p style={{ fontSize: '0.9rem', color: 'rgba(148,163,184,0.8)', lineHeight: 1.7, margin: 0 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section style={{ background: 'rgba(99,102,241,0.04)', borderTop: '1px solid rgba(99,102,241,0.1)', borderBottom: '1px solid rgba(99,102,241,0.1)' }}>
        <div style={{ ...s.section(), textAlign: 'center' }}>
          <span style={s.sectionLabel}>The Process</span>
          <h2 style={s.h2}>From idea to shipped <span style={s.gradientText}>in 4 steps</span></h2>
          <p style={s.subtext}>Our streamlined workflow gets your project into expert hands faster than any other platform.</p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0', marginTop: '56px', position: 'relative' }}>
            {/* Connector line */}
            <div style={{ position: 'absolute', top: '36px', left: '12%', right: '12%', height: '1px', background: 'linear-gradient(90deg, transparent, rgba(99,102,241,0.4), rgba(139,92,246,0.4), transparent)', pointerEvents: 'none' }} className="step-connector"/>

            {STEPS.map((step, i) => (
              <div key={step.num} style={{ padding: '0 16px', position: 'relative' }}>
                {/* Number circle */}
                <div style={{
                  width: '72px', height: '72px', borderRadius: '50%', margin: '0 auto 24px',
                  background: `linear-gradient(135deg, rgba(99,102,241,${0.15 + i * 0.07}) 0%, rgba(139,92,246,${0.15 + i * 0.07}) 100%)`,
                  border: '1.5px solid rgba(99,102,241,0.35)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 0 24px rgba(99,102,241,0.2)',
                }}>
                  <span style={{ fontSize: '1.3rem', fontWeight: 900, color: '#a5b4fc' }}>{step.num}</span>
                </div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#f1f5f9', margin: '0 0 10px' }}>{step.title}</h3>
                <p style={{ fontSize: '0.875rem', color: 'rgba(148,163,184,0.75)', lineHeight: 1.7, margin: 0 }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CATEGORIES ── */}
      <section style={{ ...s.section(80, 80), textAlign: 'center' }}>
        <span style={s.sectionLabel}>Expertise</span>
        <h2 style={s.h2}>Every tech stack, <span style={s.gradientText}>covered</span></h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'center', marginTop: '40px' }}>
          {CATEGORIES.map((cat) => (
            <span key={cat} style={{
              padding: '10px 20px', borderRadius: '999px', fontSize: '0.875rem', fontWeight: 600,
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
              color: 'rgba(209,213,219,0.85)', cursor: 'pointer', transition: 'all 0.2s ease',
            }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.14)'; e.currentTarget.style.borderColor = 'rgba(99,102,241,0.45)'; e.currentTarget.style.color = '#a5b4fc'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'rgba(209,213,219,0.85)'; }}
            >
              {cat}
            </span>
          ))}
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section style={{ padding: '0 24px 96px' }}>
        <div style={{
          maxWidth: '900px', margin: '0 auto', borderRadius: '28px',
          background: 'linear-gradient(135deg, rgba(99,102,241,0.22) 0%, rgba(139,92,246,0.18) 50%, rgba(192,132,252,0.12) 100%)',
          border: '1px solid rgba(99,102,241,0.3)',
          padding: 'clamp(48px, 8vw, 80px) clamp(24px, 6vw, 72px)',
          textAlign: 'center',
          position: 'relative', overflow: 'hidden',
          boxShadow: '0 0 80px rgba(99,102,241,0.15)',
        }}>
          {/* Glow */}
          <div style={{ position: 'absolute', top: '-40%', left: '50%', transform: 'translateX(-50%)', width: '60%', height: '100%', background: 'radial-gradient(ellipse, rgba(139,92,246,0.2) 0%, transparent 70%)', pointerEvents: 'none' }}/>

          <h2 style={{ ...s.h2, fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', margin: '0 0 16px' }}>
            Ready to build something<br/><span style={s.gradientText}>extraordinary?</span>
          </h2>
          <p style={{ ...s.subtext, margin: '0 auto 40px' }}>
            Join thousands of companies that have shipped faster and smarter with SoftBid's competitive auction model.
          </p>
          <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/signup" style={{ textDecoration: 'none' }}>
              <button style={{
                padding: '14px 36px', borderRadius: '12px', fontSize: '1rem', fontWeight: 700,
                cursor: 'pointer', border: 'none',
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                color: '#fff', boxShadow: '0 0 32px rgba(99,102,241,0.5)',
                transition: 'all 0.25s ease',
              }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 0 56px rgba(99,102,241,0.75)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 0 32px rgba(99,102,241,0.5)'; e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                Get Started — It's Free
              </button>
            </Link>
            <Link to="/post-project" style={{ textDecoration: 'none' }}>
              <button style={{
                padding: '14px 36px', borderRadius: '12px', fontSize: '1rem', fontWeight: 700,
                cursor: 'pointer', background: 'rgba(255,255,255,0.06)', color: '#e2e8f0',
                border: '1.5px solid rgba(255,255,255,0.15)', transition: 'all 0.25s ease',
              }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
              >
                View Demo
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.07)', padding: '36px 24px', textAlign: 'center' }}>
        <p style={{ color: 'rgba(100,116,139,0.8)', fontSize: '0.85rem', margin: 0 }}>
          © {new Date().getFullYear()} SoftBid · Built for the future of software procurement
        </p>
      </footer>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        @media (max-width: 640px) {
          .step-connector { display: none; }
        }
        * { box-sizing: border-box; }
      `}</style>
    </div>
  );
};

export default Home;
