import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  CheckCircle, Clock, AlertCircle, Plus, Star, ChevronRight,
  Briefcase, User, Calendar, FileText, Send, Trophy,
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import api from '@/services/api';
import { io } from 'socket.io-client';
import ProjectChat from '@/components/ProjectChat';


// ── Milestone status config ───────────────────────────────────────────────────
const MS_CONFIG = {
  pending:   { label: 'Pending',   color: 'text-ivory-subtle', bg: 'bg-white/5',         icon: Clock },
  submitted: { label: 'In Review', color: 'text-amber-400',    bg: 'bg-amber-500/10',    icon: AlertCircle },
  approved:  { label: 'Approved',  color: 'text-emerald-400',  bg: 'bg-emerald-500/10',  icon: CheckCircle },
};

const STATUS_LABEL = {
  awarded:     { label: 'Awaiting Acceptance', color: 'text-amber-400',    variant: 'destructive' },
  'in-progress': { label: 'In Progress',       color: 'text-emerald-400',  variant: 'live' },
  completed:   { label: 'Completed',           color: 'text-gold-400',     variant: 'gold' },
};

function StarRating({ rating }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`w-4 h-4 ${s <= rating ? 'text-gold-400 fill-gold-400' : 'text-white/20'}`}
        />
      ))}
    </div>
  );
}

export default function ProviderWorkspace() {
  const { projectId } = useParams();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Milestone form
  const [showMilestoneForm, setShowMilestoneForm] = useState(false);
  const [msTitle, setMsTitle] = useState('');
  const [msDescription, setMsDescription] = useState('');
  const [msDueDate, setMsDueDate] = useState('');
  const [msNote, setMsNote] = useState('');
  const [submittingMs, setSubmittingMs] = useState(false);
  const [msError, setMsError] = useState('');

  // Accept contract
  const [accepting, setAccepting] = useState(false);
  const [acceptError, setAcceptError] = useState('');
  const [currentUserId, setCurrentUserId] = useState(null);

  const socketRef = useRef(null);


  const refetch = useCallback(async () => {
    try {
      const res = await api.get(`/projects/${projectId}`);
      setProject(res.data);
    } catch (err) {
      console.error('Refetch error:', err.message);
    }
  }, [projectId]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/signin'); return; }

    // Verify this user is a provider
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload.role !== 'provider') { navigate('/dashboard'); return; }
      setCurrentUserId(payload.id);
    } catch { navigate('/signin'); return; }


    // Socket
    socketRef.current = io('http://localhost:5001', {
      auth: { token },
    });
    socketRef.current.emit('join_auction', projectId);

    // Listen for client approving a milestone — refetch
    socketRef.current.on('milestone_approved', ({ projectId: pid }) => {
      if (pid === projectId) refetch();
    });

    // Listen for review submitted by client
    socketRef.current.on('project_reviewed', ({ projectId: pid }) => {
      if (pid === projectId) refetch();
    });

    // Initial fetch
    api.get(`/projects/${projectId}`)
      .then((res) => setProject(res.data))
      .catch((err) => setError(err.response?.data?.message || err.message))
      .finally(() => setLoading(false));

    return () => {
      socketRef.current.emit('leave_auction', projectId);
      socketRef.current.disconnect();
    };
  }, [projectId, navigate, refetch]);

  const handleAccept = async () => {
    setAccepting(true);
    setAcceptError('');
    try {
      const res = await api.put(`/projects/${projectId}/accept`);
      setProject(res.data.project);
    } catch (err) {
      setAcceptError(err.response?.data?.message || 'Failed to accept contract.');
    } finally {
      setAccepting(false);
    }
  };

  const handleSubmitMilestone = async (e) => {
    e.preventDefault();
    if (!msTitle.trim()) return;
    setSubmittingMs(true);
    setMsError('');
    try {
      const res = await api.post(`/projects/${projectId}/milestones`, {
        title: msTitle, description: msDescription,
        dueDate: msDueDate || undefined, providerNote: msNote,
      });
      setProject(res.data.project);
      setMsTitle(''); setMsDescription(''); setMsDueDate(''); setMsNote('');
      setShowMilestoneForm(false);
    } catch (err) {
      setMsError(err.response?.data?.message || 'Failed to submit milestone.');
    } finally {
      setSubmittingMs(false);
    }
  };

  // ── Derived ──────────────────────────────────────────────────────────────────
  const milestones = project?.milestones || [];
  const approved = milestones.filter((m) => m.status === 'approved').length;
  const progress = milestones.length > 0 ? Math.round((approved / milestones.length) * 100) : 0;
  const statusCfg = STATUS_LABEL[project?.status] || {};

  // ── Loading / Error ───────────────────────────────────────────────────────────
  if (loading) return (
    <div className="min-h-screen bg-luxury-950">
      <Navbar />
      <div className="max-w-5xl mx-auto px-6 py-10 space-y-4">
        <Skeleton className="h-36 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    </div>
  );

  if (error || !project) return (
    <div className="min-h-screen bg-luxury-950 flex flex-col">
      <Navbar />
      <div className="flex-1 flex flex-col items-center justify-center gap-4">
        <p className="text-red-400 text-lg font-semibold">{error || 'Project not found'}</p>
        <Button variant="outline" onClick={() => navigate(-1)}>Go Back</Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-luxury-950 pb-20">
      <Navbar />
      <div className="max-w-5xl mx-auto px-6 py-10 space-y-8">

        {/* ── Breadcrumb ─────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-2 text-xs text-ivory-subtle">
          <Link to="/dashboard" className="hover:text-gold-400 transition-colors">Dashboard</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-ivory">{project.title}</span>
        </div>

        {/* ── Contract Header ───────────────────────────────────────────────── */}
        <Card className="border-gold-500/20 bg-card-gradient overflow-hidden">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3 flex-wrap">
                  <Badge variant={statusCfg.variant || 'secondary'}>
                    {statusCfg.label || project.status}
                  </Badge>
                  <span className="text-xs font-mono text-ivory-subtle">
                    ID: {projectId.slice(-8).toUpperCase()}
                  </span>
                </div>
                <h1 className="text-3xl font-black text-ivory tracking-tight mb-2">
                  {project.title}
                </h1>
                <p className="text-ivory-subtle text-sm leading-relaxed max-w-xl mb-5">
                  {project.description}
                </p>

                <div className="flex flex-wrap gap-6">
                  <div>
                    <div className="text-xs uppercase tracking-wider text-ivory-subtle mb-1">Client</div>
                    <div className="font-semibold text-ivory flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-gold-400" />
                      {project.client?.companyName || project.client?.email || '—'}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-wider text-ivory-subtle mb-1">Contract Value</div>
                    <div className="font-bold text-gold-400">
                      LKR {project.awardedBid?.bidAmountLKR?.toLocaleString() || '—'}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-wider text-ivory-subtle mb-1">Awarded</div>
                    <div className="font-semibold text-ivory flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-ivory-subtle" />
                      {project.awardedAt ? new Date(project.awardedAt).toLocaleDateString() : '—'}
                    </div>
                  </div>
                  {project.contractAcceptedAt && (
                    <div>
                      <div className="text-xs uppercase tracking-wider text-ivory-subtle mb-1">Started</div>
                      <div className="font-semibold text-emerald-400 flex items-center gap-1.5">
                        <CheckCircle className="w-3.5 h-3.5" />
                        {new Date(project.contractAcceptedAt).toLocaleDateString()}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Accept button — only when status is 'awarded' */}
              {project.status === 'awarded' && (
                <div className="shrink-0 flex flex-col items-start gap-3">
                  <div
                    className="rounded-xl border border-amber-500/30 p-4 text-sm max-w-xs"
                    style={{ background: 'rgba(245,158,11,0.08)' }}
                  >
                    <div className="font-bold text-amber-400 mb-1 flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4" /> Action Required
                    </div>
                    <p className="text-ivory-subtle text-xs leading-relaxed">
                      You have been awarded this contract. Accept to begin work and unlock milestone tracking.
                    </p>
                  </div>
                  <Button
                    onClick={handleAccept}
                    disabled={accepting}
                    className="w-full font-bold"
                    style={{ background: 'linear-gradient(135deg, #CAA342, #E8C56A)', color: '#0F0E17' }}
                  >
                    {accepting ? 'Accepting...' : '✅ Accept Contract'}
                  </Button>
                  {acceptError && (
                    <p className="text-red-400 text-xs">{acceptError}</p>
                  )}
                </div>
              )}

              {/* Completed ribbon */}
              {project.status === 'completed' && (
                <div className="shrink-0 flex flex-col items-center gap-2 p-4 rounded-xl border border-gold-500/25"
                  style={{ background: 'rgba(202,163,66,0.08)' }}>
                  <Trophy className="w-10 h-10 text-gold-400" />
                  <div className="text-gold-400 font-bold text-sm text-center">Project Complete!</div>
                  {project.completedAt && (
                    <div className="text-ivory-subtle text-xs">
                      {new Date(project.completedAt).toLocaleDateString()}
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* ── Client Review received ────────────────────────────────────────── */}
        {project.clientReview?.rating && (
          <Card className="border-gold-500/20">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-gold-500/15 flex items-center justify-center shrink-0">
                  <Star className="w-5 h-5 text-gold-400" />
                </div>
                <div>
                  <div className="font-bold text-ivory mb-1">Client Review</div>
                  <StarRating rating={project.clientReview.rating} />
                  {project.clientReview.comment && (
                    <p className="text-ivory-subtle text-sm mt-2 leading-relaxed italic">
                      "{project.clientReview.comment}"
                    </p>
                  )}
                  <p className="text-xs text-ivory-subtle mt-2">
                    {new Date(project.clientReview.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── Milestone Tracker ─────────────────────────────────────────────── */}
        {['in-progress', 'completed'].includes(project.status) && (
          <Card className="border-white/8">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <div className="flex items-center gap-2.5">
                <FileText className="w-5 h-5 text-gold-400" />
                <CardTitle>Milestone Tracker</CardTitle>
              </div>
              {project.status === 'in-progress' && (
                <Button
                  size="sm"
                  onClick={() => setShowMilestoneForm((v) => !v)}
                  className="gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  {showMilestoneForm ? 'Cancel' : 'Add Milestone'}
                </Button>
              )}
            </CardHeader>

            {/* Overall progress bar */}
            {milestones.length > 0 && (
              <div className="px-6 pb-4">
                <div className="flex items-center justify-between text-xs text-ivory-subtle mb-2">
                  <span>{approved} / {milestones.length} milestones approved</span>
                  <span className="text-gold-400 font-bold">{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            )}

            <CardContent className="pt-0 space-y-4">
              {/* Add milestone form */}
              {showMilestoneForm && (
                <form
                  onSubmit={handleSubmitMilestone}
                  className="rounded-xl border border-gold-500/20 p-5 space-y-4"
                  style={{ background: 'rgba(202,163,66,0.05)' }}
                >
                  <div className="font-semibold text-gold-400 text-sm flex items-center gap-2">
                    <Plus className="w-4 h-4" /> New Milestone
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label>Milestone Title *</Label>
                      <Input value={msTitle} onChange={(e) => setMsTitle(e.target.value)}
                        placeholder="e.g. Requirements & Wireframes Complete" required />
                    </div>
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label>Description</Label>
                      <Textarea value={msDescription} onChange={(e) => setMsDescription(e.target.value)}
                        placeholder="What was done in this milestone?" rows={2} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Due Date (optional)</Label>
                      <Input type="date" value={msDueDate} onChange={(e) => setMsDueDate(e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Note to Client</Label>
                      <Input value={msNote} onChange={(e) => setMsNote(e.target.value)}
                        placeholder="Any message for the client?" />
                    </div>
                  </div>
                  {msError && (
                    <p className="text-red-400 text-xs flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" /> {msError}
                    </p>
                  )}
                  <div className="flex gap-2 justify-end">
                    <Button type="button" variant="outline" size="sm" onClick={() => setShowMilestoneForm(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" size="sm" disabled={submittingMs} className="gap-1.5">
                      <Send className="w-3.5 h-3.5" />
                      {submittingMs ? 'Submitting...' : 'Submit for Review'}
                    </Button>
                  </div>
                </form>
              )}

              {/* Milestone list */}
              {milestones.length === 0 ? (
                <div className="text-center py-10 text-ivory-subtle">
                  <FileText className="w-10 h-10 mx-auto mb-3 opacity-20" />
                  <p className="text-sm font-medium">No milestones yet.</p>
                  <p className="text-xs mt-1">Click "Add Milestone" to submit your first progress update.</p>
                </div>
              ) : (
                <div className="relative">
                  {/* Timeline line */}
                  <div className="absolute left-5 top-5 bottom-5 w-px bg-white/8" />
                  <div className="space-y-4 pl-12">
                    {milestones.map((ms, idx) => {
                      const cfg = MS_CONFIG[ms.status] || MS_CONFIG.pending;
                      const Icon = cfg.icon;
                      return (
                        <div key={ms._id || idx} className="relative">
                          {/* Circle on timeline */}
                          <div className={`absolute -left-12 w-10 h-10 rounded-full flex items-center justify-center ${cfg.bg} border border-white/10`}>
                            <Icon className={`w-4 h-4 ${cfg.color}`} />
                          </div>

                          <div className={`rounded-xl border p-4 ${ms.status === 'approved' ? 'border-emerald-500/20' : ms.status === 'submitted' ? 'border-amber-500/20' : 'border-white/8'}`}
                            style={{ background: ms.status === 'approved' ? 'rgba(16,185,129,0.05)' : ms.status === 'submitted' ? 'rgba(245,158,11,0.05)' : 'rgba(255,255,255,0.02)' }}>
                            <div className="flex items-start justify-between gap-3 mb-2">
                              <div>
                                <div className="font-bold text-ivory text-sm">{ms.title}</div>
                                {ms.description && (
                                  <p className="text-ivory-subtle text-xs mt-0.5">{ms.description}</p>
                                )}
                              </div>
                              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.color} shrink-0`}>
                                {cfg.label}
                              </span>
                            </div>

                            {ms.providerNote && (
                              <div className="text-xs text-ivory-subtle mt-2 flex gap-1.5">
                                <span className="text-gold-500 shrink-0">Note:</span>
                                <span>{ms.providerNote}</span>
                              </div>
                            )}

                            {ms.status === 'approved' && ms.clientNote && (
                              <div className="mt-2 text-xs rounded-lg p-2 border border-emerald-500/15"
                                style={{ background: 'rgba(16,185,129,0.05)' }}>
                                <span className="text-emerald-400 font-semibold">Client: </span>
                                <span className="text-ivory-subtle">{ms.clientNote}</span>
                              </div>
                            )}

                            <div className="flex gap-4 mt-2 text-xs text-ivory-subtle">
                              {ms.dueDate && (
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  Due: {new Date(ms.dueDate).toLocaleDateString()}
                                </span>
                              )}
                              {ms.submittedAt && (
                                <span>Submitted: {new Date(ms.submittedAt).toLocaleDateString()}</span>
                              )}
                              {ms.approvedAt && (
                                <span className="text-emerald-400">
                                  Approved: {new Date(ms.approvedAt).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* ── Project Brief ─────────────────────────────────────────────────── */}
        <Card className="border-white/8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2.5 text-base">
              <Briefcase className="w-4 h-4 text-gold-400" /> Project Brief
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div>
                <div className="text-xs uppercase tracking-wider text-ivory-subtle mb-1">Budget</div>
                <div className="font-bold text-gold-400">LKR {project.clientBudgetLKR?.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-wider text-ivory-subtle mb-1">NPE Estimate</div>
                <div className="font-bold text-ivory">LKR {project.npeEstimate?.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-wider text-ivory-subtle mb-1">Timeframe</div>
                <div className="font-semibold text-ivory">{project.timeframe || 'Not specified'}</div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-wider text-ivory-subtle mb-1">Security</div>
                <div className="font-semibold text-ivory capitalize">{project.securityLevel}</div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-wider text-ivory-subtle mb-1">Integrations</div>
                <div className="font-semibold text-ivory">{project.integrations}</div>
              </div>
            </div>

            {project.selectedFeatures?.length > 0 && (
              <>
                <Separator className="bg-white/8" />
                <div>
                  <div className="text-xs uppercase tracking-wider text-ivory-subtle mb-2">Features</div>
                  <div className="flex flex-wrap gap-2">
                    {project.selectedFeatures.map((f) => (
                      <span key={f} className="text-xs px-2.5 py-1 rounded-full border border-gold-500/20 text-gold-400 bg-gold-500/8">
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* ── Project Chat ─────────────────────────────────────────────── */}
        {project.status !== 'awarded' && project.client && (
          <Card className="border-white/8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2.5 text-base">
                <Send className="w-4 h-4 text-gold-400" /> Project Chat
              </CardTitle>
              <p className="text-xs text-ivory-subtle">
                All messages are monitored. Do not share contact information.
              </p>
            </CardHeader>
            <CardContent className="p-0" style={{ height: '480px', display: 'flex', flexDirection: 'column' }}>
              <ProjectChat
                projectId={projectId}
                receiverId={project.client?._id || project.client}
                currentUserId={currentUserId}
              />
            </CardContent>
          </Card>
        )}

      </div>
    </div>
  );
}
