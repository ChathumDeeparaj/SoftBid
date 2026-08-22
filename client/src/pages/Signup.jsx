import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Zap, Building2, Code2, ArrowRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import api from '@/services/api';

const SKILLS_LIST = ['React', 'Vue', 'Angular', 'Node.js', 'Python', 'Django', 'Laravel', 'PHP', 'iOS', 'Android', 'Flutter', 'AWS', 'DevOps', 'UI/UX', 'Blockchain', 'AI/ML', 'PostgreSQL', 'MongoDB'];
const EXPERIENCE_OPTIONS = ['0–1 years', '1–3 years', '3–5 years', '5–10 years', '10+ years'];

export default function Signup() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [role, setRole] = useState('');
  const [form, setForm] = useState({ email: '', password: '', confirmPassword: '', companyName: '', portfolio: '', experience: '' });
  const [selectedSkills, setSelectedSkills] = useState([]);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));
  const toggleSkill = (s) => setSelectedSkills(sk => sk.includes(s) ? sk.filter(x => x !== s) : [...sk, s]);

  const handleRegister = async () => {
    if (form.password !== form.confirmPassword) { alert('Passwords do not match'); return; }
    try {
      const payload = {
        email: form.email,
        password: form.password,
        role: role === 'freelancer' ? 'provider' : 'client',
      };
      if (role === 'client') {
        payload.companyName = form.companyName || 'N/A';
      } else {
        payload.portfolioUrl = form.portfolio || 'N/A';
        payload.yearsExperience = parseInt(form.experience.split('–')[0]) || 0;
        payload.skills = selectedSkills;
      }
      const res = await api.post('/auth/register', payload);
      const data = res.data;
      localStorage.setItem('token', data.token);
      navigate(data.role === 'provider' ? '/provider/dashboard' : '/client/dashboard');
    } catch (err) {
      alert('Error: ' + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div className="min-h-screen bg-luxury-950 bg-hero-glow flex flex-col">
      {/* Top bar */}
      <div className="flex justify-between items-center px-8 py-5 border-b border-white/5">
        <Link to="/" className="flex items-center gap-2.5 no-underline group">
          <div className="w-8 h-8 rounded-lg bg-gold-gradient flex items-center justify-center shadow-gold-sm group-hover:shadow-gold transition-all">
            <Zap className="w-4 h-4 text-luxury-950" strokeWidth={2.5} />
          </div>
          <span className="text-gold-shimmer text-lg font-bold">SoftBid</span>
        </Link>
        <span className="text-sm text-ivory-subtle">
          Already have an account?{' '}
          <Link to="/signin" className="text-gold-400 font-semibold hover:text-gold-300 no-underline transition-colors">Sign In</Link>
        </span>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-lg">
          <Card className="border-gold-500/10 shadow-gold">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-black">Create your account</CardTitle>
              <CardDescription>Join the elite software procurement platform</CardDescription>
            </CardHeader>
            <CardContent>

              {/* Step 1 — Choose Role */}
              {step === 1 && (
                <div className="space-y-4">
                  <p className="text-center text-ivory-subtle text-sm mb-6">I am joining as a…</p>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { value: 'client', icon: <Building2 className="w-8 h-8" />, title: 'Client', desc: 'Post projects, receive bids' },
                      { value: 'freelancer', icon: <Code2 className="w-8 h-8" />, title: 'Provider', desc: 'Bid on projects, earn revenue' },
                    ].map(opt => (
                      <button key={opt.value} type="button" onClick={() => setRole(opt.value)}
                        className={cn(
                          'flex flex-col items-center gap-3 p-6 rounded-xl border transition-all text-center',
                          role === opt.value
                            ? 'border-gold-500/60 bg-gold-500/8 text-gold-300 shadow-gold-sm'
                            : 'border-white/8 bg-luxury-800/30 text-ivory-subtle hover:border-white/20 hover:text-ivory'
                        )}>
                        {opt.icon}
                        <div>
                          <div className="font-bold">{opt.title}</div>
                          <div className="text-xs opacity-70">{opt.desc}</div>
                        </div>
                        {role === opt.value && <Check className="w-4 h-4 text-gold-400" />}
                      </button>
                    ))}
                  </div>
                  <Button className="w-full mt-4" size="lg" onClick={() => { if (!role) { alert('Please choose a role'); return; } setStep(2); }} disabled={!role}>
                    Continue <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </div>
              )}

              {/* Step 2 — Basic Info */}
              {step === 2 && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Email Address</Label>
                    <Input type="email" placeholder="you@example.com" value={form.email} onChange={set('email')} />
                  </div>
                  <div className="space-y-2">
                    <Label>Password</Label>
                    <Input type="password" placeholder="Min. 8 characters" value={form.password} onChange={set('password')} />
                  </div>
                  <div className="space-y-2">
                    <Label>Confirm Password</Label>
                    <Input type="password" placeholder="Re-enter password" value={form.confirmPassword} onChange={set('confirmPassword')} />
                  </div>
                  {role === 'client' ? (
                    <div className="space-y-2">
                      <Label>Company Name</Label>
                      <Input placeholder="Your company or personal name" value={form.companyName} onChange={set('companyName')} />
                    </div>
                  ) : (
                    <>
                      <div className="space-y-2">
                        <Label>Portfolio URL</Label>
                        <Input type="url" placeholder="https://yourportfolio.com" value={form.portfolio} onChange={set('portfolio')} />
                      </div>
                      <div className="space-y-2">
                        <Label>Years of Experience</Label>
                        <select
                          value={form.experience}
                          onChange={set('experience')}
                          className="flex h-10 w-full rounded-lg border border-white/8 bg-luxury-800 px-4 py-2 text-sm text-ivory focus:outline-none focus:ring-2 focus:ring-gold-500/20 focus:border-gold-500/50"
                        >
                          <option value="">Select experience...</option>
                          {EXPERIENCE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                      </div>
                    </>
                  )}
                  <div className="flex gap-3 mt-2">
                    <Button variant="secondary" onClick={() => setStep(1)} className="flex-1">← Back</Button>
                    <Button onClick={() => role === 'freelancer' ? setStep(3) : handleRegister()} className="flex-1">
                      {role === 'freelancer' ? 'Next →' : 'Create Account'}
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 3 — Skills (providers only) */}
              {step === 3 && (
                <div className="space-y-5">
                  <p className="text-sm text-ivory-subtle">Select your primary skills <span className="text-ivory-subtle/50">(optional but recommended)</span></p>
                  <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto">
                    {SKILLS_LIST.map(skill => (
                      <button key={skill} type="button" onClick={() => toggleSkill(skill)}
                        className={cn(
                          'px-3 py-1.5 rounded-full text-xs font-semibold border transition-all',
                          selectedSkills.includes(skill)
                            ? 'bg-gold-gradient text-luxury-950 border-transparent shadow-gold-sm'
                            : 'border-white/10 text-ivory-subtle hover:border-gold-500/30 hover:text-ivory bg-transparent'
                        )}>
                        {skill}
                      </button>
                    ))}
                  </div>
                  {selectedSkills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {selectedSkills.map(s => <Badge key={s} variant="gold">{s}</Badge>)}
                    </div>
                  )}
                  <div className="flex gap-3">
                    <Button variant="secondary" onClick={() => setStep(2)} className="flex-1">← Back</Button>
                    <Button onClick={handleRegister} className="flex-1">🚀 Create Account</Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
