import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import NPEWarningModal from '../components/NPEWarningModal';

const featureOptions = [
  { id: 'user_auth', label: 'User Login / Registration', baseFP: 8 },
  { id: 'role_based_access', label: 'Role-based Access Control', baseFP: 6 },
  { id: 'payment', label: 'Payment Gateway Integration', baseFP: 15 },
  { id: 'admin_dashboard', label: 'Admin Dashboard', baseFP: 12 },
  { id: 'mobile_responsive', label: 'Mobile Responsive UI', baseFP: 5 },
  { id: 'api_integration', label: 'Third-party API Integration', baseFP: 10 },
  { id: 'reporting', label: 'Reports & Analytics', baseFP: 10 },
  { id: 'file_uploads', label: 'File Upload / Management', baseFP: 6 },
  { id: 'real_time', label: 'Real-time Updates (WebSockets)', baseFP: 13 },
  { id: 'custom_workflow', label: 'Custom Workflow Engine', baseFP: 20 },
];

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

  // Step 3 (NPE) data
  const [npeResult, setNpeResult] = useState(null);
  const [showWarningModal, setShowWarningModal] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) navigate('/signin');
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
      const res = await fetch('http://localhost:5001/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title, description, timeframe, clientBudgetLKR,
          selectedFeatures, integrations, securityLevel, riskAccepted
        })
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
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '16px', marginBottom: '32px' }}>
                {featureOptions.map(f => {
                  const isSelected = selectedFeatures.includes(f.id);
                  return (
                    <div key={f.id} onClick={() => toggleFeature(f.id)} style={{
                      padding: '16px', borderRadius: '12px', cursor: 'pointer', transition: 'all 0.2s',
                      background: isSelected ? 'rgba(99,102,241,0.1)' : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${isSelected ? '#6366f1' : 'rgba(255,255,255,0.1)'}`,
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '20px', height: '20px', borderRadius: '6px', border: `2px solid ${isSelected ? '#6366f1' : '#64748b'}`, background: isSelected ? '#6366f1' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {isSelected && <span style={{ color: '#fff', fontSize: '12px' }}>✓</span>}
                        </div>
                        <span style={{ color: isSelected ? '#f1f5f9' : '#cbd5e1', fontWeight: 600, fontSize: '0.95rem' }}>{f.label}</span>
                      </div>
                    </div>
                  );
                })}
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
