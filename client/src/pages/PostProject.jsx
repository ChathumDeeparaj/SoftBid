import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import Navbar from '@/components/Navbar';
import NPEWarningModal from '@/components/NPEWarningModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import api from '@/services/api';

const STEPS = ['Project Basics', 'Technical Scope', 'Review & Submit'];
const TIMEFRAMES = ['< 1 Month', '1-3 Months', '3-6 Months', '6-12 Months', '12+ Months'];
const SECURITY_LEVELS = [
  { value: 'basic', label: 'Basic', desc: 'Public-facing website' },
  { value: 'standard', label: 'Standard', desc: 'User authentication, payments' },
  { value: 'high', label: 'High', desc: 'Healthcare, finance, government' },
];

export default function PostProject() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [timeframe, setTimeframe] = useState('');
  const [clientBudgetLKR, setClientBudgetLKR] = useState('');
  const [selectedFeatures, setSelectedFeatures] = useState([]);
  const [integrations, setIntegrations] = useState(0);
  const [securityLevel, setSecurityLevel] = useState('basic');
  const [dynamicFeatures, setDynamicFeatures] = useState([]);
  const [availableProviders, setAvailableProviders] = useState([]);
  const [invitedProviders, setInvitedProviders] = useState([]);
  const [npeResult, setNpeResult] = useState(null);
  const [showWarningModal, setShowWarningModal] = useState(false);

  // Default deadline = 7 days from now (rounded to nearest hour)
  const defaultDeadline = () => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    d.setMinutes(0, 0, 0);
    return d.toISOString().slice(0, 16); // "YYYY-MM-DDTHH:mm"
  };
  const [auctionEndsAt, setAuctionEndsAt] = useState(defaultDeadline);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/signin'); return; }
    const fetchConfig = async () => {
      try {
        const res = await api.get('/npe/config');
        setDynamicFeatures(res.data.features || []);
      } catch (err) { console.error('Failed to fetch NPE config:', err); }
    };
    const fetchProviders = async () => {
      try {
        const res = await api.get('/users/providers');
        setAvailableProviders(res.data);
      } catch (err) { console.error('Failed to fetch providers:', err); }
    };
    fetchConfig();
    fetchProviders();
  }, [navigate]);

  const toggleFeature = (id) =>
    setSelectedFeatures(f => f.includes(id) ? f.filter(x => x !== id) : [...f, id]);

  const toggleProvider = (id) =>
    setInvitedProviders(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

  const handleNextStep = () => {
    if (step === 1) {
      if (!title || !description || !clientBudgetLKR || !auctionEndsAt) {
        setError('Please fill out all required fields including the bid deadline.'); return;
      }
      if (new Date(auctionEndsAt) <= new Date()) {
        setError('Bid deadline must be in the future.'); return;
      }
      setError(''); setStep(2);
    } else if (step === 2) {
      if (selectedFeatures.length === 0) { setError('Please select at least one feature.'); return; }
      setError(''); calculateNPEPreview();
    }
  };

  const calculateNPEPreview = async () => {
    setLoading(true);
    try {
      const res = await api.post('/npe/preview', { features: selectedFeatures, integrations, securityLevel });
      const data = res.data;
      setNpeResult(data);
      const variance = ((data.benchmark - Number(clientBudgetLKR)) / data.benchmark) * 100;
      if (variance > 20) setShowWarningModal(true);
      else setStep(3);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  const submitProject = async (riskAccepted = false) => {
    setLoading(true);
    try {
      await api.post('/projects', {
        title, description, timeframe,
        clientBudgetLKR: Number(clientBudgetLKR),
        selectedFeatures, integrations: Number(integrations), securityLevel, riskAccepted, invitedProviders,
        auctionEndsAt: new Date(auctionEndsAt).toISOString(),
      });
      navigate('/client/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || err.message);
      setShowWarningModal(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-luxury-950 pb-16">
      <Navbar />

      {showWarningModal && npeResult && (
        <NPEWarningModal
          clientBudget={Number(clientBudgetLKR)}
          npeBenchmark={npeResult.benchmark}
          npeBreakdown={npeResult.breakdown}
          onAdjust={() => { setShowWarningModal(false); setStep(1); }}
          onProceed={() => { setShowWarningModal(false); submitProject(true); }}
        />
      )}

      <div className="max-w-2xl mx-auto px-6 py-12">

        {/* Step indicators */}
        <div className="relative flex justify-between mb-10">
          <div className="absolute top-[14px] left-0 right-0 h-0.5 bg-white/8 z-0" />
          <div
            className="absolute top-[14px] left-0 h-0.5 bg-gold-gradient z-0 transition-all duration-500"
            style={{ width: `${((step - 1) / 2) * 100}%` }}
          />
          {STEPS.map((label, i) => {
            const num = i + 1;
            const isActive = step === num;
            const isDone = step > num;
            return (
              <div key={num} className="flex flex-col items-center gap-2 z-10">
                <div className={cn(
                  'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all',
                  isDone  ? 'bg-gold-gradient text-luxury-950 shadow-gold-sm' :
                  isActive ? 'border-2 border-gold-500 text-gold-400 bg-luxury-900' :
                             'border border-white/20 text-ivory-subtle bg-luxury-900'
                )}>
                  {isDone ? '✓' : num}
                </div>
                <span className={cn('text-xs font-medium hidden sm:block', isActive ? 'text-gold-400' : 'text-ivory-subtle')}>
                  {label}
                </span>
              </div>
            );
          })}
        </div>

        <Card className="border-gold-500/12">
          <CardHeader>
            <CardTitle>{STEPS[step - 1]}</CardTitle>
            <CardDescription>
              {step === 1 && 'Tell us about your project.'}
              {step === 2 && 'Define the technical requirements for the NPE estimate.'}
              {step === 3 && 'Review your project details and market estimate.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-5 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>
            )}

            {/* Step 1 */}
            {step === 1 && (
              <div className="space-y-5">
                <div className="space-y-2">
                  <Label>Project Title *</Label>
                  <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. E-Commerce Platform" />
                </div>
                <div className="space-y-2">
                  <Label>Description *</Label>
                  <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe your software needs in detail..." className="h-32" />
                </div>
                <div className="space-y-2">
                  <Label>Client Budget (LKR) *</Label>
                  <Input type="number" value={clientBudgetLKR} onChange={e => setClientBudgetLKR(e.target.value)} placeholder="e.g. 500000" />
                </div>
                <div className="space-y-2">
                  <Label>Timeframe</Label>
                  <div className="flex flex-wrap gap-2">
                    {TIMEFRAMES.map(t => (
                      <button key={t} type="button" onClick={() => setTimeframe(t)}
                        className={cn(
                          'px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all',
                          timeframe === t
                            ? 'bg-gold-gradient text-luxury-950 border-transparent shadow-gold-sm'
                            : 'border-white/10 text-ivory-subtle hover:border-gold-500/30 hover:text-ivory bg-transparent'
                        )}>
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Bid Deadline */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5">
                    Bid Deadline *
                    <span className="text-xs text-ivory-subtle font-normal">(when does bidding close?)</span>
                  </Label>
                  <Input
                    type="datetime-local"
                    value={auctionEndsAt}
                    onChange={e => setAuctionEndsAt(e.target.value)}
                    min={new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0, 16)}
                    className="[color-scheme:dark]"
                  />
                  <p className="text-xs text-ivory-subtle">
                    Providers can't amend bids in the final 30 minutes. Default is 7 days from now.
                  </p>
                </div>


                {/* Invite Providers */}
                {availableProviders.length > 0 && (
                  <div className="space-y-2">
                    <Label>Invite Specific Providers (optional)</Label>
                    <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto">
                      {availableProviders.map(p => (
                        <button key={p._id} type="button" onClick={() => toggleProvider(p._id)}
                          className={cn(
                            'px-2.5 py-1 rounded-full text-xs border transition-all',
                            invitedProviders.includes(p._id)
                              ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                              : 'border-white/10 text-ivory-subtle hover:border-white/20 bg-transparent'
                          )}>
                          {p.companyName || p.email}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <Button onClick={handleNextStep} className="w-full" size="lg">
                  Next: Technical Scope <ChevronRight className="ml-1 w-4 h-4" />
                </Button>
              </div>
            )}

            {/* Step 2 */}
            {step === 2 && (
              <div className="space-y-6">
                <div className="space-y-3">
                  <Label>Select Features *</Label>
                  {dynamicFeatures.length === 0 ? (
                    <p className="text-ivory-subtle text-sm">Loading features...</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {dynamicFeatures.map(f => (
                        <button key={f.id} type="button" onClick={() => toggleFeature(f.id)}
                          className={cn(
                            'flex justify-between items-center rounded-xl p-3 border text-left transition-all',
                            selectedFeatures.includes(f.id)
                              ? 'border-gold-500/50 bg-gold-500/8 text-ivory'
                              : 'border-white/8 bg-luxury-800/50 text-ivory-subtle hover:border-white/15 hover:text-ivory'
                          )}>
                          <span className="text-sm font-medium">{f.label}</span>
                          <Badge variant={selectedFeatures.includes(f.id) ? 'gold' : 'secondary'} className="text-xs">
                            {f.baseFP} FP
                          </Badge>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Number of Third-party Integrations</Label>
                  <Input type="number" min="0" max="20" value={integrations} onChange={e => setIntegrations(e.target.value)} />
                </div>

                <div className="space-y-2">
                  <Label>Security Level</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {SECURITY_LEVELS.map(s => (
                      <button key={s.value} type="button" onClick={() => setSecurityLevel(s.value)}
                        className={cn(
                          'rounded-xl p-3 border text-left transition-all',
                          securityLevel === s.value
                            ? 'border-gold-500/50 bg-gold-500/8'
                            : 'border-white/8 bg-luxury-800/50 hover:border-white/15'
                        )}>
                        <div className={cn('text-sm font-bold mb-0.5', securityLevel === s.value ? 'text-gold-400' : 'text-ivory')}>
                          {s.label}
                        </div>
                        <div className="text-xs text-ivory-subtle">{s.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button variant="secondary" onClick={() => setStep(1)} className="flex-1">← Back</Button>
                  <Button onClick={handleNextStep} className="flex-1" disabled={loading}>
                    {loading ? 'Calculating NPE...' : 'Calculate Estimate →'}
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3 */}
            {step === 3 && npeResult && (
              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-xl border border-white/8 bg-luxury-800/50 p-4">
                    <div className="text-xs uppercase tracking-wider text-ivory-subtle mb-2">Your Budget</div>
                    <div className="text-2xl font-black text-ivory">
                      LKR {Number(clientBudgetLKR).toLocaleString('en-LK')}
                    </div>
                  </div>
                  <div className="rounded-xl border border-gold-500/25 bg-gold-500/5 p-4">
                    <div className="text-xs uppercase tracking-wider text-gold-400 mb-2">NPE Estimate</div>
                    <div className="text-2xl font-black text-gold-300">
                      LKR {npeResult.benchmark?.toLocaleString('en-LK')}
                    </div>
                  </div>
                </div>

                {npeResult.breakdown && (
                  <div className="rounded-xl border border-white/8 bg-luxury-800/50 p-4 space-y-2">
                    <p className="text-xs uppercase tracking-wider text-ivory-subtle mb-3">NPE Breakdown</p>
                    {[
                      ['Function Points (UFP)', `${npeResult.breakdown.unadjustedFP} FP`],
                      ['Complexity Multiplier', `×${npeResult.breakdown.complexityMultiplier}`],
                      ['Estimated Hours', `${npeResult.breakdown.estimatedHours} hrs`],
                      ['Hourly Rate', `LKR ${npeResult.breakdown.hourlyRateLKR}/hr`],
                    ].map(([k, v]) => (
                      <div key={k} className="flex justify-between text-sm">
                        <span className="text-ivory-subtle">{k}</span>
                        <span className="text-ivory font-semibold font-mono">{v}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div>
                  <div className="text-xs uppercase tracking-wider text-ivory-subtle mb-2">Selected Features</div>
                  <div className="flex flex-wrap gap-1.5">
                    {dynamicFeatures.filter(f => selectedFeatures.includes(f.id)).map(f => (
                      <Badge key={f.id} variant="secondary">{f.label}</Badge>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button variant="secondary" onClick={() => setStep(2)} className="flex-1">← Back</Button>
                  <Button onClick={() => submitProject(false)} className="flex-1" disabled={loading}>
                    {loading ? 'Submitting...' : '🚀 Post Project'}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
