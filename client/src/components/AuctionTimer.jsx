import React, { useEffect, useState } from 'react';
import { Clock, Lock, CheckCircle } from 'lucide-react';

/**
 * AuctionTimer — shows a live countdown AND the actual close date/time.
 *
 * States:
 *   - open  + time remaining  → animated countdown (HH:MM:SS) + "closes on DATE"
 *   - open  + < 30 min left   → red pulsing urgent countdown
 *   - closed                  → "Auction Closed" banner + closed-on date
 *   - awarded                 → "Awarded" banner + closed-on date
 *   - completed               → "Project Completed" banner
 */

function pad(n) {
  return String(n).padStart(2, '0');
}

function getTimeLeft(endsAt) {
  const diff = new Date(endsAt) - new Date();
  if (diff <= 0) return null;
  const totalSeconds = Math.floor(diff / 1000);
  const days    = Math.floor(totalSeconds / 86400);
  const hours   = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return { days, hours, minutes, seconds, totalSeconds };
}

function formatDateTime(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return d.toLocaleString('en-US', {
    weekday: 'short',
    month:   'short',
    day:     'numeric',
    year:    'numeric',
    hour:    '2-digit',
    minute:  '2-digit',
    hour12:  true,
  });
}

export default function AuctionTimer({ auctionEndsAt, status }) {
  const [timeLeft, setTimeLeft] = useState(() =>
    auctionEndsAt ? getTimeLeft(auctionEndsAt) : null
  );

  useEffect(() => {
    if (!auctionEndsAt || status !== 'open') return;

    const tick = () => setTimeLeft(getTimeLeft(auctionEndsAt));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [auctionEndsAt, status]);

  const formattedDate = formatDateTime(auctionEndsAt);

  // ── Closed ──
  if (status === 'closed') {
    return (
      <div className="flex items-center gap-3 bg-red-950/60 border border-red-500/30 rounded-xl px-5 py-3">
        <Lock className="w-5 h-5 text-red-400 shrink-0" />
        <div>
          <div className="text-red-300 font-bold text-sm tracking-wide uppercase">Auction Closed</div>
          <div className="text-red-400/70 text-xs mt-0.5">
            Bidding ended {formattedDate ? `on ${formattedDate}` : ''} — awaiting award decision.
          </div>
        </div>
      </div>
    );
  }

  // ── Awarded ──
  if (status === 'awarded') {
    return (
      <div className="flex items-center gap-3 bg-gold-500/10 border border-gold-500/30 rounded-xl px-5 py-3">
        <CheckCircle className="w-5 h-5 text-gold-400 shrink-0" />
        <div>
          <div className="text-gold-300 font-bold text-sm tracking-wide uppercase">Project Awarded</div>
          <div className="text-gold-400/70 text-xs mt-0.5">
            A provider has been selected.{formattedDate ? ` Auction closed ${formattedDate}.` : ''}
          </div>
        </div>
      </div>
    );
  }

  // ── Completed ──
  if (status === 'completed') {
    return (
      <div className="flex items-center gap-3 bg-emerald-950/60 border border-emerald-500/30 rounded-xl px-5 py-3">
        <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
        <div>
          <div className="text-emerald-300 font-bold text-sm tracking-wide uppercase">Project Completed</div>
          <div className="text-emerald-400/70 text-xs mt-0.5">This project has been successfully delivered.</div>
        </div>
      </div>
    );
  }

  // ── Open but no deadline ──
  if (!auctionEndsAt) {
    return (
      <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-5 py-3">
        <Clock className="w-4 h-4 text-ivory-subtle shrink-0" />
        <div className="text-ivory-subtle text-xs">No bid deadline set for this auction.</div>
      </div>
    );
  }

  // ── Open + time expired (scheduler hasn't caught it yet) ──
  if (!timeLeft) {
    return (
      <div className="flex items-center gap-3 bg-orange-950/60 border border-orange-500/30 rounded-xl px-5 py-3">
        <Clock className="w-5 h-5 text-orange-400 animate-pulse shrink-0" />
        <div>
          <div className="text-orange-300 font-bold text-sm tracking-wide uppercase">Closing…</div>
          <div className="text-orange-400/70 text-xs mt-0.5">
            Deadline was {formattedDate}. Waiting for server to confirm closure.
          </div>
        </div>
      </div>
    );
  }

  const isUrgent = timeLeft.totalSeconds < 30 * 60; // under 30 minutes

  // Digit block
  const Digit = ({ value, label }) => (
    <div className="flex flex-col items-center">
      <div className={`
        min-w-[52px] h-14 flex items-center justify-center rounded-lg font-black font-mono text-2xl border transition-colors
        ${isUrgent
          ? 'bg-red-950/70 border-red-500/40 text-red-300'
          : 'bg-luxury-900/80 border-gold-500/20 text-gold-300'}
      `}>
        {value}
      </div>
      <span className={`text-[10px] uppercase tracking-widest mt-1.5 font-medium ${isUrgent ? 'text-red-500' : 'text-ivory-subtle'}`}>
        {label}
      </span>
    </div>
  );

  const Colon = () => (
    <span className={`text-2xl font-black mb-4 select-none ${isUrgent ? 'text-red-500 animate-pulse' : 'text-gold-500/60'}`}>:</span>
  );

  return (
    <div className={`rounded-xl border px-5 py-4 transition-colors ${
      isUrgent ? 'bg-red-950/40 border-red-500/30' : 'bg-luxury-900/50 border-gold-500/15'
    }`}>
      {/* Header row */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Clock className={`w-4 h-4 ${isUrgent ? 'text-red-400 animate-pulse' : 'text-gold-400'}`} />
          <span className={`text-xs font-semibold uppercase tracking-widest ${isUrgent ? 'text-red-400' : 'text-gold-400'}`}>
            {isUrgent ? '⚠ Auction Ending Soon' : 'Auction Closes In'}
          </span>
        </div>
        {/* Always show actual close date */}
        {formattedDate && (
          <span className="text-xs text-ivory-subtle font-mono">
            Closes: <span className={isUrgent ? 'text-red-300' : 'text-ivory'}>{formattedDate}</span>
          </span>
        )}
      </div>

      {/* Countdown digits */}
      <div className="flex items-center gap-2">
        {timeLeft.days > 0 && (
          <>
            <Digit value={pad(timeLeft.days)} label="Days" />
            <Colon />
          </>
        )}
        <Digit value={pad(timeLeft.hours)} label="Hours" />
        <Colon />
        <Digit value={pad(timeLeft.minutes)} label="Mins" />
        <Colon />
        <Digit value={pad(timeLeft.seconds)} label="Secs" />
      </div>
    </div>
  );
}
