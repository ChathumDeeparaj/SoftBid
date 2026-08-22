import React from 'react';
import { AlertTriangle, TrendingDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';

const fmt = (n) => `LKR ${Number(n).toLocaleString('en-LK')}`;

export default function NPEWarningModal({ clientBudget, npeBenchmark, npeBreakdown, onAdjust, onProceed }) {
  const variance = ((npeBenchmark - clientBudget) / npeBenchmark) * 100;

  return (
    <Dialog open>
      <DialogContent className="max-w-[520px]">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <DialogTitle>Budget Reality Check</DialogTitle>
              <DialogDescription className="mt-0.5">Powered by the NPE Engine</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Budget vs Estimate */}
        <div className="grid grid-cols-2 gap-3 my-4">
          <div className="rounded-xl border border-red-500/20 bg-red-500/8 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-red-400 mb-2">Your Budget</p>
            <p className="text-2xl font-black text-red-300">{fmt(clientBudget)}</p>
          </div>
          <div className="rounded-xl border border-gold-500/25 bg-gold-500/8 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-gold-400 mb-2">Market Estimate</p>
            <p className="text-2xl font-black text-gold-300">{fmt(npeBenchmark)}</p>
          </div>
        </div>

        {/* Warning message */}
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/8 p-4 mb-4">
          <div className="flex items-start gap-2">
            <TrendingDown className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-amber-300 font-semibold text-sm mb-1">
                Your budget is <strong>{variance.toFixed(0)}% below</strong> the professional market rate
              </p>
              <p className="text-ivory-subtle text-xs leading-relaxed">
                Projects underfunded by this margin have a{' '}
                <strong className="text-red-400">70% higher failure rate</strong>. Providers may be
                unable to deliver the selected features at this price point.
              </p>
            </div>
          </div>
        </div>

        {/* NPE Breakdown */}
        {npeBreakdown && (
          <div className="rounded-xl border border-white/6 bg-luxury-800/50 p-4 mb-4 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-ivory-subtle mb-3">How we calculated this</p>
            {[
              ['Function Points (UFP)',    `${npeBreakdown.unadjustedFP} FP`],
              ['Complexity Multiplier',    `×${npeBreakdown.complexityMultiplier}`],
              ['Estimated Hours',          `${npeBreakdown.estimatedHours} hrs`],
              ['Hourly Rate',              `LKR ${npeBreakdown.hourlyRateLKR}/hr`],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between text-xs">
                <span className="text-ivory-subtle">{label}</span>
                <span className="text-ivory font-semibold font-mono">{value}</span>
              </div>
            ))}
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-2">
          <Button onClick={onAdjust} className="flex-1">
            📝 Adjust Budget / Scope
          </Button>
          <Button variant="destructive" onClick={onProceed} className="flex-1">
            ⚠️ Proceed with Risk
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
