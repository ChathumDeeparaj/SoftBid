import React from 'react';

const formatLKR = (n) => `LKR ${Number(n).toLocaleString('en-LK')}`;

export default function NPEWarningModal({ clientBudget, npeBenchmark, npeBreakdown, onAdjust, onProceed }) {
  const variance = ((npeBenchmark - clientBudget) / npeBenchmark) * 100;

  const confidenceColors = { low: '#f59e0b', medium: '#6366f1', high: '#10b981' };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px'
    }}>
      <div style={{
        background: '#0f1320', border: '1px solid rgba(239,68,68,0.4)',
        borderRadius: '24px', padding: '40px', maxWidth: '520px', width: '100%',
        boxShadow: '0 0 60px rgba(239,68,68,0.15)'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <div style={{ fontSize: '2rem' }}>⚠️</div>
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#f1f5f9', margin: 0 }}>
              Budget Reality Check
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: '4px 0 0' }}>
              Powered by the NPE Engine
            </p>
          </div>
        </div>

        {/* Budget vs NPE */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
          <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '14px', padding: '16px' }}>
            <p style={{ fontSize: '0.75rem', color: '#f87171', textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 8px', fontWeight: 700 }}>Your Budget</p>
            <p style={{ fontSize: '1.5rem', fontWeight: 900, color: '#fca5a5', margin: 0 }}>{formatLKR(clientBudget)}</p>
          </div>
          <div style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '14px', padding: '16px' }}>
            <p style={{ fontSize: '0.75rem', color: '#818cf8', textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 8px', fontWeight: 700 }}>Market Estimate</p>
            <p style={{ fontSize: '1.5rem', fontWeight: 900, color: '#a5b4fc', margin: 0 }}>{formatLKR(npeBenchmark)}</p>
          </div>
        </div>

        {/* Warning message */}
        <div style={{ background: 'rgba(239,68,68,0.07)', borderRadius: '12px', padding: '16px', marginBottom: '20px' }}>
          <p style={{ color: '#fca5a5', fontSize: '0.95rem', margin: '0 0 8px', fontWeight: 600 }}>
            Your budget is <strong>{variance.toFixed(0)}% below</strong> the professional market estimate for this scope.
          </p>
          <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: 0, lineHeight: 1.6 }}>
            Projects underfunded by this margin have a <strong style={{ color: '#f87171' }}>70% higher failure rate</strong>. 
            Providers may be unable to deliver the selected features at this price point.
          </p>
        </div>

        {/* NPE Breakdown */}
        {npeBreakdown && (
          <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '12px', padding: '16px', marginBottom: '24px', fontSize: '0.82rem' }}>
            <p style={{ color: '#64748b', margin: '0 0 10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>How we calculated this</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8' }}>
                <span>Function Points (UFP)</span><span style={{ color: '#f1f5f9', fontWeight: 600 }}>{npeBreakdown.unadjustedFP} FP</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8' }}>
                <span>Complexity Multiplier</span><span style={{ color: '#f1f5f9', fontWeight: 600 }}>×{npeBreakdown.complexityMultiplier}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8' }}>
                <span>Estimated Hours</span><span style={{ color: '#f1f5f9', fontWeight: 600 }}>{npeBreakdown.estimatedHours} hrs</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8' }}>
                <span>Hourly Rate (LKR)</span><span style={{ color: '#f1f5f9', fontWeight: 600 }}>LKR {npeBreakdown.hourlyRateLKR}/hr</span>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={onAdjust} style={{
            flex: 1, padding: '14px', borderRadius: '12px', fontWeight: 700, fontSize: '0.95rem',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff',
            border: 'none', cursor: 'pointer', boxShadow: '0 0 20px rgba(99,102,241,0.4)'
          }}>
            📝 Adjust Budget / Scope
          </button>
          <button onClick={onProceed} style={{
            flex: 1, padding: '14px', borderRadius: '12px', fontWeight: 700, fontSize: '0.95rem',
            background: 'rgba(239,68,68,0.12)', color: '#f87171',
            border: '1px solid rgba(239,68,68,0.3)', cursor: 'pointer'
          }}>
            ⚠️ Proceed with Risk
          </button>
        </div>
      </div>
    </div>
  );
}
