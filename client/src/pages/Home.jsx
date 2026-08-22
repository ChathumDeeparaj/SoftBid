import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';

/* ── Animated counter ── */
const AnimCounter = ({ target, suffix = '' }) => {
  const ref = useRef(null);
  useEffect(() => {
    let startTs = 0;
    const tick = (ts) => {
      if (!startTs) startTs = ts;
      const p = Math.min((ts - startTs) / 1800, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      if (ref.current) ref.current.textContent = Math.floor(ease * target) + suffix;
      if (p < 1) requestAnimationFrame(tick);
    };
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { requestAnimationFrame(tick); obs.disconnect(); } }, { threshold: 0.5 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [target, suffix]);
  return <span ref={ref}>0{suffix}</span>;
};

const STATS = [
  { value: 12400, suffix: '+', label: 'Projects Posted' },
  { value: 98, suffix: '%', label: 'Client Satisfaction' },
  { value: 3200, suffix: '+', label: 'Expert Providers' },
  { value: 48, suffix: 'h', label: 'Avg. First Bid' },
];

const FEATURES = [
  { icon: '⚡', title: 'NPE Budget Engine', desc: 'Industry-calibrated estimates powered by Function Point Analysis prevent scope creep and budget shock.' },
  { icon: '🏆', title: 'AHP-TOPSIS Ranking', desc: 'Multi-criteria decision science ranks every bid on price, reputation, experience, and delivery reliability.' },
  { icon: '📡', title: 'Live Auction Room', desc: 'Real-time WebSocket bidding with instant leaderboard updates — watch competitive bids come in as they happen.' },
  { icon: '✦', title: 'Verified Providers', desc: 'Every provider goes through identity, portfolio, and past-project verification before bidding on your project.' },
  { icon: '🔒', title: 'Secure Procurement', desc: 'Zero cleartext tokens, JWT-guarded routes, and role-enforced access control at every layer.' },
  { icon: '🌐', title: 'Sri Lanka Powered', desc: 'Hourly rates and market benchmarks calibrated for the Sri Lankan software industry — not US pricing.' },
];

const HOW_STEPS = [
  { num: '01', title: 'Post Your Project', desc: 'Describe your requirements. Our NPE Engine estimates a fair market price based on your selected features.' },
  { num: '02', title: 'Receive Live Bids', desc: 'Qualified providers bid in real-time. The AHP-TOPSIS algorithm continuously re-ranks them as new bids arrive.' },
  { num: '03', title: 'Award the Best', desc: 'Review the ranked leaderboard, view provider profiles, reviews, and portfolios, then award with confidence.' },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-luxury-950 overflow-x-hidden">
      <Navbar />

      {/* ── Hero ── */}
      <section className="relative py-28 px-6 text-center overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 bg-hero-glow pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-gold-500/5 blur-[120px] pointer-events-none" />

        <div className="relative max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full border border-gold-500/30 bg-gold-500/8 px-4 py-1.5 text-xs font-semibold text-gold-400 mb-8 uppercase tracking-widest">
            <span className="w-1.5 h-1.5 rounded-full bg-gold-400 animate-gold-pulse" />
            Sri Lanka's Premier Software Bidding Platform
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black mb-6 leading-[1.05] tracking-tight">
            <span className="text-ivory">The Intelligent Way</span>
            <br />
            <span className="text-gold-shimmer">to Procure Software</span>
          </h1>

          <p className="text-xl text-ivory-subtle max-w-2xl mx-auto mb-10 leading-relaxed">
            Post your project, receive ranked bids from verified providers, and award contracts backed by AI-powered fairness — all in real time.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button asChild size="xl">
              <Link to="/signup">Start Your Project</Link>
            </Button>
            <Button asChild variant="outline" size="xl">
              <Link to="/providers">Browse Providers</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="py-16 border-y border-white/5 bg-luxury-900/30">
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {STATS.map(({ value, suffix, label }) => (
            <div key={label}>
              <div className="text-4xl font-black text-gold-shimmer mb-2">
                <AnimCounter target={value} suffix={suffix} />
              </div>
              <div className="text-sm text-ivory-subtle font-medium">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="text-xs uppercase tracking-widest text-gold-500/70 font-semibold mb-4">Platform Capabilities</div>
            <h2 className="text-4xl font-black text-ivory mb-4">Built for Precision Procurement</h2>
            <p className="text-ivory-subtle max-w-xl mx-auto">
              Every feature is purpose-built to ensure you get the right provider, at the right price, with zero guesswork.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map(({ icon, title, desc }) => (
              <div key={title}
                className="group rounded-2xl border border-white/5 bg-luxury-900 p-7 transition-all duration-300 hover:border-gold-500/20 hover:-translate-y-1 hover:shadow-gold-sm hover:bg-card-gradient">
                <div className="text-3xl mb-4">{icon}</div>
                <h3 className="text-lg font-bold text-ivory mb-2 group-hover:text-gold-300 transition-colors">{title}</h3>
                <p className="text-sm text-ivory-subtle leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="py-24 px-6 bg-luxury-900/20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <div className="text-xs uppercase tracking-widest text-gold-500/70 font-semibold mb-4">The Process</div>
            <h2 className="text-4xl font-black text-ivory">From Brief to Build in 3 Steps</h2>
          </div>
          <div className="relative">
            <div className="hidden md:block absolute top-8 left-[calc(50%-1px)] h-full w-0.5 bg-gradient-to-b from-gold-500/30 via-gold-500/10 to-transparent" />
            <div className="space-y-12">
              {HOW_STEPS.map(({ num, title, desc }, i) => (
                <div key={num} className={`flex gap-8 items-start ${i % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'}`}>
                  <div className="flex-1 hidden md:block" />
                  <div className="w-16 h-16 rounded-2xl bg-gold-gradient flex items-center justify-center text-luxury-950 font-black text-lg shadow-gold shrink-0">
                    {num}
                  </div>
                  <div className="flex-1">
                    <div className="rounded-2xl border border-gold-500/12 bg-luxury-900 p-6 hover:border-gold-500/25 transition-all">
                      <h3 className="text-lg font-bold text-ivory mb-2">{title}</h3>
                      <p className="text-ivory-subtle text-sm leading-relaxed">{desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24 px-6 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-hero-glow opacity-60 pointer-events-none" />
        <div className="relative max-w-2xl mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-gold-gradient mx-auto mb-6 flex items-center justify-center shadow-gold">
            <span className="text-2xl">✦</span>
          </div>
          <h2 className="text-4xl font-black text-ivory mb-4">Ready to Find Your Perfect Match?</h2>
          <p className="text-ivory-subtle mb-8 text-lg">
            Join thousands of businesses who've discovered that fair, transparent bidding delivers better results.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button asChild size="xl">
              <Link to="/signup">Post a Project — It's Free</Link>
            </Button>
            <Button asChild variant="outline" size="xl">
              <Link to="/signin">Sign In</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/5 py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-ivory-subtle/50">
          <div className="flex items-center gap-2">
            <span className="text-gold-shimmer font-bold">SoftBid</span>
            <span>© 2025 · Sri Lanka's Software Procurement Platform</span>
          </div>
          <div className="flex gap-6">
            <Link to="/providers" className="hover:text-gold-400 no-underline transition-colors">Providers</Link>
            <Link to="/post-project" className="hover:text-gold-400 no-underline transition-colors">Post a Project</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
