import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldAlert, AlertTriangle, CheckCircle, Eye,
  Filter, RefreshCw, Bell, ChevronDown, ChevronUp,
  User, Briefcase, Clock,
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import api from '@/services/api';
import { io } from 'socket.io-client';

// ── Severity config ───────────────────────────────────────────────────────────
const SEVERITY = {
  critical:   { label: 'Critical',   color: 'text-red-400',   bg: 'bg-red-500/10',   border: 'border-red-500/25',   icon: ShieldAlert },
  suspicious: { label: 'Suspicious', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/25', icon: AlertTriangle },
};

const RESOLUTION_BADGE = {
  pending:   { label: 'Pending',   variant: 'destructive' },
  dismissed: { label: 'Dismissed', variant: 'secondary'  },
  warned:    { label: 'Warned',    variant: 'gold'        },
  banned:    { label: 'Banned',    variant: 'destructive' },
};

// ── Single flagged message card ───────────────────────────────────────────────
function FlaggedCard({ msg, onResolved }) {
  const [expanded, setExpanded] = useState(false);
  const [adminNote, setAdminNote] = useState('');
  const [resolving, setResolving] = useState(null);
  const [error, setError] = useState('');

  const sev = SEVERITY[msg.flagSeverity] || SEVERITY.suspicious;
  const SevIcon = sev.icon;
  const resBadge = RESOLUTION_BADGE[msg.flagResolution] || RESOLUTION_BADGE.pending;
  const isResolved = msg.flagResolution !== 'pending';

  const handleResolve = async (resolution) => {
    setResolving(resolution);
    setError('');
    try {
      await api.put(`/messages/${msg._id}/resolve`, { resolution, adminNote });
      onResolved(msg._id, resolution);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resolve.');
    } finally {
      setResolving(null);
    }
  };

  return (
    <Card className={`border ${sev.border} transition-all`} style={{ background: 'rgba(255,255,255,0.02)' }}>
      <CardContent className="p-5">
        {/* Header row */}
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className={`flex items-center gap-1.5 font-bold text-sm ${sev.color}`}>
              <SevIcon className="w-4 h-4" />
              {sev.label}
            </span>
            <Badge variant={resBadge.variant} className="text-xs">{resBadge.label}</Badge>
            {msg.wasRedacted && (
              <span className="text-xs text-red-400 flex items-center gap-1 font-semibold">
                <ShieldAlert className="w-3 h-3" /> Redacted
              </span>
            )}
          </div>
          <span className="text-xs text-ivory-subtle shrink-0 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {new Date(msg.createdAt).toLocaleString()}
          </span>
        </div>

        {/* Project & Sender info */}
        <div className="flex flex-wrap gap-5 mb-3 text-sm">
          <div>
            <div className="text-xs text-ivory-subtle uppercase tracking-wider mb-0.5">Project</div>
            <div className="font-semibold text-ivory">{msg.project?.title || msg.project || '—'}</div>
          </div>
          <div>
            <div className="text-xs text-ivory-subtle uppercase tracking-wider mb-0.5">Sender</div>
            <div className="flex items-center gap-1.5 font-semibold text-ivory">
              {msg.sender?.role === 'provider'
                ? <Briefcase className="w-3.5 h-3.5 text-gold-400" />
                : <User className="w-3.5 h-3.5 text-emerald-400" />}
              {msg.sender?.companyName || msg.sender?.email || '—'}
              <span className="text-xs text-ivory-subtle">({msg.sender?.role})</span>
            </div>
          </div>
          <div>
            <div className="text-xs text-ivory-subtle uppercase tracking-wider mb-0.5">Receiver</div>
            <div className="font-semibold text-ivory">
              {msg.receiver?.companyName || msg.receiver?.email || '—'}
            </div>
          </div>
        </div>

        {/* Flag reasons */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {msg.flagReasons?.map((r) => (
            <span key={r}
              className={`text-xs px-2 py-0.5 rounded-full border font-mono ${sev.bg} ${sev.color} ${sev.border}`}>
              {r}
            </span>
          ))}
        </div>

        {/* Expand to see raw content */}
        <button
          onClick={() => setExpanded((v) => !v)}
          className="flex items-center gap-1.5 text-xs text-ivory-subtle hover:text-ivory transition-colors mb-3"
        >
          <Eye className="w-3.5 h-3.5" />
          {expanded ? 'Hide' : 'View'} original message
          {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>

        {expanded && (
          <div className="space-y-3 mb-4">
            <div>
              <div className="text-xs text-red-400 uppercase tracking-wider mb-1 font-semibold">Original (raw)</div>
              <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-3 text-sm text-ivory font-mono leading-relaxed whitespace-pre-wrap">
                {msg.rawContent}
              </div>
            </div>
            {msg.wasRedacted && (
              <div>
                <div className="text-xs text-emerald-400 uppercase tracking-wider mb-1 font-semibold">Delivered to receiver (redacted)</div>
                <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3 text-sm text-ivory-subtle font-mono leading-relaxed whitespace-pre-wrap">
                  {msg.content}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Admin actions — only if pending */}
        {!isResolved ? (
          <div className="space-y-3">
            <Textarea
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
              placeholder="Admin note (optional, visible internally)…"
              rows={2}
              className="text-xs"
            />
            {error && <p className="text-red-400 text-xs">{error}</p>}
            <div className="flex gap-2 flex-wrap">
              <Button size="sm" variant="outline" className="text-xs gap-1.5"
                onClick={() => handleResolve('dismissed')} disabled={!!resolving}>
                <CheckCircle className="w-3.5 h-3.5" />
                {resolving === 'dismissed' ? 'Dismissing…' : 'Dismiss'}
              </Button>
              <Button size="sm" className="text-xs gap-1.5 bg-amber-500/20 border-amber-500/30 text-amber-400 hover:bg-amber-500/30"
                onClick={() => handleResolve('warned')} disabled={!!resolving}>
                <AlertTriangle className="w-3.5 h-3.5" />
                {resolving === 'warned' ? 'Warning…' : 'Warn User'}
              </Button>
              <Button size="sm" className="text-xs gap-1.5"
                style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)' }}
                onClick={() => handleResolve('banned')} disabled={!!resolving}>
                <ShieldAlert className="w-3.5 h-3.5" />
                {resolving === 'banned' ? 'Banning…' : 'Ban User'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-xs text-ivory-subtle mt-2 flex items-center gap-1.5">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
            Resolved as <span className="font-semibold text-ivory capitalize">{msg.flagResolution}</span>
            {msg.flagReviewedAt && ` · ${new Date(msg.flagReviewedAt).toLocaleDateString()}`}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Main Admin Messages page ──────────────────────────────────────────────────
export default function AdminMessages() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('pending');
  const [liveAlerts, setLiveAlerts] = useState([]);  // real-time incoming flags
  const socketRef = useRef(null);

  const fetchFlagged = useCallback(async (resolution = 'pending') => {
    setLoading(true);
    try {
      const res = await api.get(`/messages/flagged?resolution=${resolution}`);
      setMessages(res.data);
    } catch (err) {
      console.error('Fetch flagged error:', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/signin'); return; }
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload.role !== 'admin') { navigate('/admin/dashboard'); return; }
    } catch { navigate('/signin'); return; }

    fetchFlagged('pending');

    // Real-time admin alerts via socket
    socketRef.current = io('http://localhost:5001', { auth: { token } });

    socketRef.current.on('message_flagged', (data) => {
      setLiveAlerts((prev) => [data, ...prev].slice(0, 5));
      // If we're on the pending tab, prepend to list
      setMessages((prev) => {
        const exists = prev.find((m) => m._id === data.messageId);
        if (exists) return prev;
        return [{
          _id: data.messageId,
          project: { title: data.projectTitle },
          sender: data.sender,
          rawContent: data.rawContent,
          content: data.sanitizedContent,
          flagSeverity: data.flagSeverity,
          flagReasons: data.flagReasons,
          wasRedacted: data.wasRedacted,
          flagResolution: 'pending',
          createdAt: data.sentAt,
        }, ...prev];
      });
    });

    socketRef.current.on('flag_resolved', ({ messageId, resolution }) => {
      setMessages((prev) =>
        prev.map((m) => m._id === messageId ? { ...m, flagResolution: resolution } : m)
      );
    });

    return () => socketRef.current?.disconnect();
  }, [navigate, fetchFlagged]);

  const handleTabChange = (newTab) => {
    setTab(newTab);
    fetchFlagged(newTab);
  };

  const handleResolved = (messageId, resolution) => {
    setMessages((prev) =>
      prev.map((m) => m._id === messageId ? { ...m, flagResolution: resolution } : m)
    );
  };

  const pendingCount = messages.filter((m) => m.flagResolution === 'pending').length;
  const criticalCount = messages.filter((m) => m.flagSeverity === 'critical' && m.flagResolution === 'pending').length;

  return (
    <div className="min-h-screen bg-luxury-950 pb-16">
      <Navbar />
      <div className="max-w-5xl mx-auto px-6 py-10 space-y-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-ivory tracking-tight mb-1 flex items-center gap-3">
              <ShieldAlert className="w-8 h-8 text-red-400" />
              Message <span className="text-gold-shimmer">Monitor</span>
            </h1>
            <p className="text-ivory-subtle">Real-time flagged communication surveillance.</p>
          </div>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => fetchFlagged(tab)}>
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </Button>
        </div>

        {/* Live alert toast */}
        {liveAlerts.length > 0 && (
          <div className="space-y-2">
            {liveAlerts.map((alert, i) => (
              <div key={i}
                className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 flex items-start gap-3 animate-pulse-once">
                <Bell className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <span className="font-bold text-red-400">🚨 New Flag</span>
                  {' '}— <span className="text-ivory">{alert.sender?.name}</span>
                  {' '}in project <span className="text-gold-400 font-semibold">"{alert.projectTitle}"</span>
                  {' '}· Reasons: {alert.flagReasons?.join(', ')}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Pending Review', value: pendingCount, color: 'text-amber-400' },
            { label: 'Critical Flags', value: criticalCount, color: 'text-red-400' },
            { label: 'Total Loaded', value: messages.length, color: 'text-ivory' },
          ].map(({ label, value, color }) => (
            <Card key={label} className="border-white/8">
              <CardContent className="p-5 text-center">
                <div className={`text-2xl font-black ${color} mb-1`}>{value}</div>
                <div className="text-xs text-ivory-subtle uppercase tracking-wider">{label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-xl bg-white/5 w-fit">
          {[
            { id: 'pending', label: 'Pending' },
            { id: 'dismissed', label: 'Dismissed' },
            { id: 'warned', label: 'Warned' },
            { id: 'banned', label: 'Banned' },
            { id: 'all', label: 'All' },
          ].map(({ id, label }) => (
            <button key={id} onClick={() => handleTabChange(id)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                tab === id
                  ? 'bg-gold-500/15 text-gold-400 border border-gold-500/25'
                  : 'text-ivory-subtle hover:text-ivory'
              }`}>
              {label}
              {id === 'pending' && pendingCount > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-red-500 text-white text-xs font-bold">
                  {pendingCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Message list */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-48" />)}
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-20 text-ivory-subtle">
            <CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="font-medium">No flagged messages in this category.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Sort: critical first, then by date */}
            {messages
              .slice()
              .sort((a, b) => {
                if (a.flagSeverity === 'critical' && b.flagSeverity !== 'critical') return -1;
                if (b.flagSeverity === 'critical' && a.flagSeverity !== 'critical') return 1;
                return new Date(b.createdAt) - new Date(a.createdAt);
              })
              .map((msg) => (
                <FlaggedCard key={msg._id} msg={msg} onResolved={handleResolved} />
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
