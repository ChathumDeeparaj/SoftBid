import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  PlusCircle, FolderOpen, ArrowRight, Clock, Gavel,
  CheckCircle, AlertCircle, Star, ChevronDown, ChevronUp,
  Trophy, Briefcase,
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import api from '@/services/api';

const STATUS_VARIANT = {
  open:          'default',
  closed:        'destructive',
  awarded:       'destructive',
  'in-progress': 'secondary',
  completed:     'gold',
  cancelled:     'destructive',
};

// ── Star rating picker ────────────────────────────────────────────────────────
function StarPicker({ value, onChange }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onChange(s)}
          onMouseEnter={() => setHover(s)}
          onMouseLeave={() => setHover(0)}
          className="transition-transform hover:scale-110"
        >
          <Star
            className={`w-7 h-7 transition-colors ${
              s <= (hover || value) ? 'text-gold-400 fill-gold-400' : 'text-white/20'
            }`}
          />
        </button>
      ))}
    </div>
  );
}

// ── Per-project milestone + review panel ──────────────────────────────────────
function ProjectPanel({ project, onRefresh }) {
  const [expanded, setExpanded] = useState(false);
  const [approvingId, setApprovingId] = useState(null);
  const [clientNote, setClientNote] = useState('');
  const [completing, setCompleting] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [panelError, setPanelError] = useState('');

  const milestones = project.milestones || [];
  const submittedMs = milestones.filter((m) => m.status === 'submitted');
  const approved = milestones.filter((m) => m.status === 'approved').length;
  const progress = milestones.length > 0 ? Math.round((approved / milestones.length) * 100) : 0;

  const handleApproveMilestone = async (milestoneId) => {
    setApprovingId(milestoneId);
    setPanelError('');
    try {
      await api.put(`/projects/${project._id}/milestones/${milestoneId}/approve`, { clientNote });
      setClientNote('');
      onRefresh();
    } catch (err) {
      setPanelError(err.response?.data?.message || 'Failed to approve milestone.');
    } finally {
      setApprovingId(null);
    }
  };

  const handleComplete = async () => {
    setCompleting(true);
    setPanelError('');
    try {
      await api.put(`/projects/${project._id}/complete`);
      onRefresh();
    } catch (err) {
      setPanelError(err.response?.data?.message || 'Failed to mark as complete.');
    } finally {
      setCompleting(false);
    }
  };

  const handleReview = async (e) => {
    e.preventDefault();
    if (!reviewRating) return;
    setSubmittingReview(true);
    setPanelError('');
    try {
      await api.post(`/projects/${project._id}/review`, { rating: reviewRating, comment: reviewComment });
      onRefresh();
    } catch (err) {
      setPanelError(err.response?.data?.message || 'Failed to submit review.');
    } finally {
      setSubmittingReview(false);
    }
  };

  const isActionable = ['in-progress', 'awarded'].includes(project.status);
  const needsAttention = submittedMs.length > 0;

  return (
    <Card className={`border-white/8 transition-all ${needsAttention ? 'border-amber-500/25' : ''}`}>
      <CardContent className="p-6">
        {/* Top row */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant={STATUS_VARIANT[project.status] || 'secondary'}>
              {project.status}
            </Badge>
            {needsAttention && (
              <span className="text-xs text-amber-400 flex items-center gap-1 font-semibold">
                <AlertCircle className="w-3.5 h-3.5" /> {submittedMs.length} milestone{submittedMs.length > 1 ? 's' : ''} awaiting approval
              </span>
            )}
          </div>
          <span className="text-xs text-ivory-subtle flex items-center gap-1 shrink-0">
            <Clock className="w-3 h-3" />
            {new Date(project.createdAt).toLocaleDateString()}
          </span>
        </div>

        <h3 className="text-ivory font-bold text-lg mb-1">{project.title}</h3>
        <p className="text-ivory-subtle text-sm line-clamp-2 mb-4">{project.description}</p>

        {/* Milestone progress bar — for in-progress/completed */}
        {milestones.length > 0 && (
          <div className="mb-4">
            <div className="flex justify-between text-xs text-ivory-subtle mb-1.5">
              <span>{approved}/{milestones.length} milestones approved</span>
              <span className="text-gold-400 font-bold">{progress}%</span>
            </div>
            <Progress value={progress} className="h-1.5" />
          </div>
        )}

        {/* Review already given */}
        {project.clientReview?.rating && (
          <div className="flex items-center gap-2 mb-4 text-xs text-gold-400">
            <Star className="w-3.5 h-3.5 fill-gold-400" />
            You rated this project {project.clientReview.rating}/5
          </div>
        )}

        <div className="flex justify-between items-center border-t border-white/5 pt-4">
          <Button asChild size="sm" variant="outline">
            <Link to={`/project/${project._id}/live`}>
              <Gavel className="mr-1.5 w-3.5 h-3.5" /> View Auction
            </Link>
          </Button>

          <div className="flex gap-2">
            {isActionable && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setExpanded((v) => !v)}
                className="gap-1.5 text-gold-400"
              >
                {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                {expanded ? 'Hide' : 'Manage'}
              </Button>
            )}
            {project.status === 'completed' && !project.clientReview?.rating && (
              <Button size="sm" variant="ghost" onClick={() => setExpanded((v) => !v)} className="text-gold-400 gap-1.5">
                <Star className="w-3.5 h-3.5" /> Leave Review
              </Button>
            )}
          </div>
        </div>

        {/* ── Expanded panel ────────────────────────────────────────────── */}
        {expanded && (
          <div className="mt-5 space-y-5 border-t border-white/5 pt-5">
            {panelError && (
              <div className="text-red-400 text-xs flex items-center gap-1.5 rounded-lg border border-red-500/20 bg-red-500/8 px-3 py-2">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {panelError}
              </div>
            )}

            {/* Provider info */}
            {project.awardedProvider && (
              <div className="text-sm">
                <div className="text-xs uppercase tracking-wider text-ivory-subtle mb-1">Awarded Provider</div>
                <div className="font-semibold text-ivory flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-gold-400" />
                  {project.awardedProvider?.companyName || project.awardedProvider?.email || '—'}
                </div>
                {project.contractAcceptedAt ? (
                  <div className="text-xs text-emerald-400 mt-0.5 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    Contract accepted {new Date(project.contractAcceptedAt).toLocaleDateString()}
                  </div>
                ) : (
                  <div className="text-xs text-amber-400 mt-0.5">Waiting for provider to accept the contract…</div>
                )}
              </div>
            )}

            {/* Submitted milestones awaiting approval */}
            {submittedMs.length > 0 && (
              <div>
                <div className="text-xs uppercase tracking-wider text-amber-400 mb-3 font-semibold flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5" /> Milestones Awaiting Your Approval
                </div>
                <div className="space-y-3">
                  {submittedMs.map((ms) => (
                    <div key={ms._id}
                      className="rounded-xl border border-amber-500/20 p-4"
                      style={{ background: 'rgba(245,158,11,0.05)' }}>
                      <div className="font-semibold text-ivory text-sm mb-1">{ms.title}</div>
                      {ms.description && <p className="text-ivory-subtle text-xs mb-2">{ms.description}</p>}
                      {ms.providerNote && (
                        <div className="text-xs mb-3">
                          <span className="text-gold-500">Provider note: </span>
                          <span className="text-ivory-subtle">{ms.providerNote}</span>
                        </div>
                      )}
                      <div className="space-y-2">
                        <input
                          className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-ivory placeholder:text-ivory-subtle/50 focus:outline-none focus:border-gold-500/50"
                          placeholder="Optional feedback for the provider..."
                          value={approvingId === ms._id ? clientNote : ''}
                          onChange={(e) => setClientNote(e.target.value)}
                          onFocus={() => setApprovingId(ms._id)}
                        />
                        <Button
                          size="sm"
                          className="gap-1.5"
                          style={{ background: 'linear-gradient(135deg, #CAA342, #E8C56A)', color: '#0F0E17' }}
                          onClick={() => handleApproveMilestone(ms._id)}
                          disabled={approvingId === ms._id && approvingId !== null && !clientNote && false}
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          {approvingId === ms._id ? 'Approving...' : 'Approve Milestone'}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* All milestones overview */}
            {milestones.length > 0 && (
              <div>
                <div className="text-xs uppercase tracking-wider text-ivory-subtle mb-2 font-semibold">All Milestones</div>
                <div className="space-y-2">
                  {milestones.map((ms) => (
                    <div key={ms._id} className="flex items-center gap-3 text-xs">
                      {ms.status === 'approved' ? (
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      ) : ms.status === 'submitted' ? (
                        <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      ) : (
                        <Clock className="w-3.5 h-3.5 text-ivory-subtle shrink-0" />
                      )}
                      <span className={ms.status === 'approved' ? 'text-emerald-400' : ms.status === 'submitted' ? 'text-amber-400' : 'text-ivory-subtle'}>
                        {ms.title}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Mark Complete button */}
            {project.status === 'in-progress' && approved === milestones.length && milestones.length > 0 && (
              <div className="rounded-xl border border-emerald-500/20 p-4" style={{ background: 'rgba(16,185,129,0.05)' }}>
                <div className="font-semibold text-emerald-400 mb-1 flex items-center gap-1.5">
                  <Trophy className="w-4 h-4" /> All milestones approved!
                </div>
                <p className="text-ivory-subtle text-xs mb-3">
                  Ready to mark this project as completed? This will finalize the contract.
                </p>
                <Button onClick={handleComplete} disabled={completing} size="sm"
                  className="gap-1.5" style={{ background: 'linear-gradient(135deg, #10b981, #34d399)', color: '#0F0E17' }}>
                  <CheckCircle className="w-3.5 h-3.5" />
                  {completing ? 'Completing...' : 'Mark as Complete'}
                </Button>
              </div>
            )}

            {/* Review form — after completion, before review submitted */}
            {project.status === 'completed' && !project.clientReview?.rating && (
              <form onSubmit={handleReview}
                className="rounded-xl border border-gold-500/20 p-5 space-y-4"
                style={{ background: 'rgba(202,163,66,0.06)' }}>
                <div className="font-bold text-gold-400 flex items-center gap-2">
                  <Star className="w-4 h-4" /> Leave a Review
                </div>
                <p className="text-ivory-subtle text-xs">
                  How was your experience with this provider? Your review improves the ranking system.
                </p>
                <div className="space-y-1.5">
                  <div className="text-xs text-ivory-subtle uppercase tracking-wider">Rating *</div>
                  <StarPicker value={reviewRating} onChange={setReviewRating} />
                </div>
                <div className="space-y-1.5">
                  <div className="text-xs text-ivory-subtle uppercase tracking-wider">Comment (optional)</div>
                  <Textarea
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Share your experience..."
                    rows={3}
                  />
                </div>
                <Button type="submit" disabled={!reviewRating || submittingReview} size="sm"
                  style={{ background: 'linear-gradient(135deg, #CAA342, #E8C56A)', color: '#0F0E17' }}>
                  {submittingReview ? 'Submitting...' : 'Submit Review'}
                </Button>
              </form>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Main ClientDashboard ──────────────────────────────────────────────────────
export default function ClientDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const userRes = await api.get('/auth/me');
      const userData = userRes.data;
      if (userData.role !== 'client') { navigate('/dashboard'); return; }
      setUser(userData);
      const projRes = await api.get('/projects/my-projects');
      setProjects(projRes.data);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/signin'); return; }
    fetchData();
  }, [navigate, fetchData]);

  // Stats
  const open = projects.filter((p) => p.status === 'open').length;
  const active = projects.filter((p) => ['awarded', 'in-progress'].includes(p.status)).length;
  const needsAction = projects.filter((p) =>
    p.milestones?.some((m) => m.status === 'submitted') ||
    (p.status === 'completed' && !p.clientReview?.rating)
  ).length;

  return (
    <div className="min-h-screen bg-luxury-950">
      <Navbar />
      <div className="max-w-6xl mx-auto px-6 py-10">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black text-ivory tracking-tight mb-1">
              Welcome, <span className="text-gold-shimmer">{user?.companyName || 'Client'}</span>
            </h1>
            <p className="text-ivory-subtle">Manage your projects and track provider progress.</p>
          </div>
          <Button asChild size="lg">
            <Link to="/post-project">
              <PlusCircle className="mr-2 w-4 h-4" /> Post a Project
            </Link>
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Open Auctions', value: open, color: 'text-ivory' },
            { label: 'Active Projects', value: active, color: 'text-emerald-400' },
            { label: 'Needs Action', value: needsAction, color: 'text-amber-400' },
          ].map(({ label, value, color }) => (
            <Card key={label} className="border-white/8">
              <CardContent className="p-5 text-center">
                <div className={`text-2xl font-black ${color} mb-1`}>{value}</div>
                <div className="text-xs text-ivory-subtle uppercase tracking-wider">{label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">{error}</div>
        )}

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-40" />)}
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-20 text-ivory-subtle">
            <FolderOpen className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="font-medium">No projects yet.</p>
            <Button asChild className="mt-4">
              <Link to="/post-project">Post Your First Project</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Action-required projects first */}
            {projects
              .slice()
              .sort((a, b) => {
                const aAction = a.milestones?.some((m) => m.status === 'submitted') ? 1 : 0;
                const bAction = b.milestones?.some((m) => m.status === 'submitted') ? 1 : 0;
                return bAction - aAction;
              })
              .map((project) => (
                <ProjectPanel key={project._id} project={project} onRefresh={fetchData} />
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
