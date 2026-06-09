import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import NPEWarningModal from '../components/NPEWarningModal';

// Removed hardcoded featureOptions - fetching dynamically from API

export default function PostProject() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Step 1 data
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [timeframe, setTimeframe] = useState('');
  const [clientBudgetLKR, setClientBudgetLKR] = useState('');

  // Step 2 data
  const [selectedFeatures, setSelectedFeatures] = useState([]);
  const [integrations, setIntegrations] = useState(0);
  const [securityLevel, setSecurityLevel] = useState('basic');

  // Dynamic features and providers from backend
  const [dynamicFeatures, setDynamicFeatures] = useState([]);
  const [availableProviders, setAvailableProviders] = useState([]);
  const [invitedProviders, setInvitedProviders] = useState([]);

  // Step 3 (NPE) data
  const [npeResult, setNpeResult] = useState(null);
  const [showWarningModal, setShowWarningModal] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/signin');
      return;
    }

    // Fetch NPE config to get dynamic features
    const fetchConfig = async () => {
      try {
        const res = await fetch('http://localhost:5001/api/npe/config', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const config = await res.json();
          setDynamicFeatures(config.features || []);
        }
      } catch (err) {
        console.error('Failed to fetch NPE config:', err);
      }
    };
    
    // Fetch registered providers to allow inviting favorites
    const fetchProviders = async () => {
      try {
        const res = await fetch('http://localhost:5001/api/users/providers', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setAvailableProviders(data);
        }
      } catch (err) {
        console.error('Failed to fetch providers:', err);
      }
    };

    fetchConfig();
    fetchProviders();
  }, [navigate]);

  const handleNextStep = () => {
    if (step === 1) {
      if (!title || !description || !clientBudgetLKR) {
        setError('Please fill out all required fields.');
        return;
      }
      setError('');
      setStep(2);
    } else if (step === 2) {
      if (selectedFeatures.length === 0) {
        setError('Please select at least one feature.');
        return;
      }
      setError('');
      calculateNPEPreview();
    }
  };

  const toggleFeature = (id) => {
    if (selectedFeatures.includes(id)) {
      setSelectedFeatures(selectedFeatures.filter(f => f !== id));
    } else {
      setSelectedFeatures([...selectedFeatures, id]);
    }
  };

  const calculateNPEPreview = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5001/api/npe/preview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          features: selectedFeatures,
          integrations,
          securityLevel
        })
      });

      if (!res.ok) throw new Error('Failed to calculate NPE estimate');
      const data = await res.json();
      setNpeResult(data);
      
      // Check variance (budget vs benchmark)
      const budget = Number(clientBudgetLKR);
      const benchmark = data.benchmark;
      const variance = ((benchmark - budget) / benchmark) * 100;
      
      if (variance > 20) {
        // If budget is more than 20% below estimate, show warning
        setShowWarningModal(true);
      } else {
        // Safe to proceed to submit
        setStep(3);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const submitProject = async (riskAccepted = false) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const payload = {
        title,
        description,
        timeframe,
        clientBudgetLKR: Number(clientBudgetLKR),
        selectedFeatures,
        integrations: Number(integrations),
        securityLevel,
        riskAccepted,
        invitedProviders
      };
      const res = await fetch('http://localhost:5001/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to submit project');
      }
      
      // Success
      navigate('/client/dashboard');
    } catch (err) {
      setError(err.message);
      setShowWarningModal(false);
    } finally {
      setLoading(false);
    }
  };

  // --- Styles ---
  const inputStyle = {
    width: '100%', padding: '14px', borderRadius: '12px',
    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
    color: '#f1f5f9', outline: 'none', marginBottom: '20px'
  };

  const labelStyle = { display: 'block', marginBottom: '8px', color: '#cbd5e1', fontWeight: 600, fontSize: '0.9rem' };

  const btnStyle = {
    padding: '14px 24px', borderRadius: '12px', fontWeight: 700, fontSize: '1rem',
    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff',
    border: 'none', cursor: 'pointer', display: 'block', width: '100%',
    boxShadow: '0 0 20px rgba(99,102,241,0.3)'
  };

  return (
    <div style={{ minHeight: '100vh', background: '#080a14', fontFamily: "'Inter', sans-serif" }}>
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

      <div style={{ maxWidth: '800px', margin: '60px auto', padding: '0 24px' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '40px', position: 'relative' }}>
          <div style={{ position: 'absolute', top: '15px', left: 0, right: 0, height: '2px', background: 'rgba(255,255,255,0.1)', zIndex: 0 }} />
          {[1, 2, 3].map(num => (
            <div key={num} style={{ 
              width: '32px', height: '32px', borderRadius: '50%', zIndex: 1,
              background: step >= num ? '#6366f1' : '#1e293b',
              color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700
            }}>
              {num}
            </div>
          ))}
        </div>

        <div style={{ background: '#0f1320', padding: '40px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)' }}>
          {error && <div style={{ background: 'rgba(239,68,68,0.1)', color: '#fca5a5', padding: '16px', borderRadius: '12px', marginBottom: '24px' }}>{error}</div>}

          {/* STEP 1 */}
          {step === 1 && (
            <div>
              <h2 style={{ fontSize: '1.8rem', color: '#f1f5f9', marginBottom: '24px' }}>Project Basics</h2>
              
              <label style={labelStyle}>Project Title *</label>
              <input style={inputStyle} value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. E-Commerce Platform" />
              
              <label style={labelStyle}>Description *</label>
              <textarea style={{ ...inputStyle, minHeight: '120px' }} value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe your software needs..." />
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div>
                  <label style={labelStyle}>Your Budget (LKR) *</label>
                  <input style={inputStyle} type="number" value={clientBudgetLKR} onChange={e => setClientBudgetLKR(e.target.value)} placeholder="e.g. 500000" />
                </div>
                <div>
                  <label style={labelStyle}>Timeframe</label>
                  <input style={inputStyle} value={timeframe} onChange={e => setTimeframe(e.target.value)} placeholder="e.g. 3 Months" />
                </div>
              </div>
              
              <button style={btnStyle} onClick={handleNextStep}>Next: Select Features →</button>
            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <div>
              <h2 style={{ fontSize: '1.8rem', color: '#f1f5f9', marginBottom: '12px' }}>Scope & Complexity</h2>
              <p style={{ color: '#94a3b8', marginBottom: '32px' }}>Select the features you need. This helps our NPE Engine calculate a fair market estimate.</p>
              
              <div style={{ marginBottom: '32px' }}>
                <label style={labelStyle}>Add a Feature</label>
                {dynamicFeatures.length === 0 && <p style={{ color: '#64748b', fontSize: '0.85rem' }}>Loading features...</p>}
                
                <select 
                  style={{ ...inputStyle, marginBottom: 0, width: '100%' }} 
                  value=""
                  onChange={(e) => {
                    if (e.target.value && !selectedFeatures.includes(e.target.value)) {
                      setSelectedFeatures([...selectedFeatures, e.target.value]);
                    }
                  }}
                >
                  <option value="">-- Select a feature from the list --</option>
                  {dynamicFeatures.filter(f => !selectedFeatures.includes(f.id)).map(f => (
                    <option key={f.id} value={f.id}>{f.label} (Base FP: {f.baseFP})</option>
                  ))}
                </select>

                {/* Selected Features Chips */}
                {selectedFeatures.length > 0 && (
                  <div style={{ marginTop: '16px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {selectedFeatures.map(id => {
                      const feat = dynamicFeatures.find(f => f.id === id);
                      if (!feat) return null;
                      return (
                        <div key={id} style={{
                          background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)',
                          color: '#c7d2fe', padding: '8px 12px', borderRadius: '20px', fontSize: '0.85rem',
                          display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600
                        }}>
                          <span>{feat.label}</span>
                          <button 
                            type="button"
                            onClick={() => setSelectedFeatures(selectedFeatures.filter(f => f !== id))}
                            style={{ background: 'transparent', border: 'none', color: '#818cf8', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', fontSize: '1rem', marginLeft: '4px' }}
                          >
                            ✕
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '32px' }}>
                <div>
                  <label style={labelStyle}>Number of External Integrations</label>
                  <select style={inputStyle} value={integrations} onChange={e => setIntegrations(Number(e.target.value))}>
                    <option value={0}>0 (Standalone)</option>
                    <option value={1}>1 Integration</option>
                    <option value={2}>2 Integrations</option>
                    <option value={3}>3 Integrations</option>
                    <option value={4}>4+ Integrations (Complex)</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Security Requirement</label>
                  <select style={inputStyle} value={securityLevel} onChange={e => setSecurityLevel(e.target.value)}>
                    <option value="basic">Basic (Standard Web App)</option>
                    <option value="standard">Standard (E-commerce / FinTech)</option>
                    <option value="high">High (Enterprise / Healthcare)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '16px' }}>
                <button style={{ ...btnStyle, background: 'rgba(255,255,255,0.1)', flex: 1, boxShadow: 'none' }} onClick={() => setStep(1)}>← Back</button>
                <button style={{ ...btnStyle, flex: 2 }} onClick={handleNextStep} disabled={loading}>
                  {loading ? 'Calculating...' : 'Preview Estimate →'}
                </button>
              </div>
              
              <div style={{ marginTop: '32px' }}>
                <label style={labelStyle}>Invite Favorite Providers to Bid (Optional - Max 5)</label>
                <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '12px' }}>Select providers you'd specifically like to notify about this project.</p>
                <select 
                  style={{ ...inputStyle, marginBottom: 0, width: '100%' }} 
                  value=""
                  disabled={invitedProviders.length >= 5}
                  onChange={(e) => {
                    if (e.target.value && !invitedProviders.includes(e.target.value) && invitedProviders.length < 5) {
                      setInvitedProviders([...invitedProviders, e.target.value]);
                    }
                  }}
                >
                  <option value="">{invitedProviders.length >= 5 ? "Maximum of 5 providers reached" : "-- Select a provider --"}</option>
                  {availableProviders.filter(p => !invitedProviders.includes(p._id)).map(p => (
                    <option key={p._id} value={p._id}>{p.email} ({p.yearsExperience} years exp.)</option>
                  ))}
                </select>

                {invitedProviders.length > 0 && (
                  <div style={{ marginTop: '16px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {invitedProviders.map(id => {
                      const prov = availableProviders.find(p => p._id === id);
                      if (!prov) return null;
                      return (
                        <div key={id} style={{
                          background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)',
                          color: '#6ee7b7', padding: '8px 12px', borderRadius: '20px', fontSize: '0.85rem',
                          display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600
                        }}>
                          <span>{prov.email.split('@')[0]}</span>
                          <button 
                            type="button"
                            onClick={() => setInvitedProviders(invitedProviders.filter(p => p !== id))}
                            style={{ background: 'transparent', border: 'none', color: '#34d399', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', fontSize: '1rem', marginLeft: '4px' }}
                          >
                            ✕
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 3 */}
          {step === 3 && npeResult && (
            <div>
              <h2 style={{ fontSize: '1.8rem', color: '#f1f5f9', marginBottom: '12px', textAlign: 'center' }}>Ready to Publish</h2>
              <p style={{ color: '#94a3b8', marginBottom: '32px', textAlign: 'center' }}>Your budget aligns with market expectations. You're ready to start receiving bids.</p>
              
              <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '16px', padding: '24px', textAlign: 'center', marginBottom: '32px' }}>
                <span style={{ fontSize: '2rem' }}>✅</span>
                <h3 style={{ color: '#34d399', margin: '12px 0 8px' }}>Budget Reality Check Passed</h3>
                <p style={{ color: '#a7f3d0', margin: 0, fontSize: '0.9rem' }}>NPE Benchmark: LKR {npeResult.benchmark.toLocaleString('en-LK')}</p>
              </div>

              <button style={btnStyle} onClick={() => submitProject(false)} disabled={loading}>
                {loading ? 'Submitting...' : 'Post Project Now'}
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
