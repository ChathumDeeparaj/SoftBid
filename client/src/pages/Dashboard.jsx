import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Gavel, Search, Clock, TrendingUp, Briefcase,
  CheckCircle, AlertCircle, ChevronRight, Trophy,
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import api from '@/services/api';

const STATUS_CONFIG = {
  awarded:      { label: 'Awaiting Acceptance', color: 'text-amber-400',   variant: 'destructive', icon: AlertCircle },
  'in-progress':{ label: 'In Progress',         color: 'text-emerald-400', variant: 'live',        icon: Clock },
  completed:    { label: 'Completed',            color: 'text-gold-400',    variant: 'gold',        icon: Trophy },
};

function WonProjectCard({ project }) {
  const cfg = STATUS_CONFIG[project.status] || {};
  const Icon = cfg.icon || Briefcase;
  const milestones = project.milestones || [];
  const approved = milestones.filter((m) => m.status === 'approved').length;
  const progress = milestones.length > 0 ? Math.round((approved / milestones.length) * 100) : 0;

  return (
    <Card className="border-white/8 hover:border-gold-500/20 transition-all duration-200 group">
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-3 mb-3">
          <Badge variant={cfg.variant || 'secondary'} className="gap-1.5 shrink-0">
            <Icon className="w-3 h-3" />
            {cfg.label || project.status}
          </Badge>
          <span className="text-xs text-ivory-subtle">
            {project.awardedAt ? new Date(project.awardedAt).toLocaleDateString() : ''}
          </span>
        </div>

        <h3 className="text-ivory font-bold text-lg mb-1 group-hover:text-gold-300 transition-colors">
          {project.title}
        </h3>
        <p className="text-ivory-subtle text-sm line-clamp-2 mb-4">{project.description}</p>

        <div className="flex gap-5 mb-4">
          <div>
            <div className="text-xs text-ivory-subtle mb-0.5">Client</div>
            <div className="text-sm font-semibold text-ivory">
              {project.client?.companyName || project.client?.email || '—'}
            </div>
          </div>
          <div>
            <div className="text-xs text-ivory-subtle mb-0.5">Budget</div>
            <div className="text-sm font-bold text-gold-400">
              LKR {project.clientBudgetLKR?.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Milestone progress */}
        {milestones.length > 0 && (
          <div className="mb-4">
            <div className="flex justify-between text-xs text-ivory-subtle mb-1.5">
              <span>Milestones: {approved}/{milestones.length} approved</span>
              <span className="text-gold-400 font-bold">{progress}%</span>
            </div>
            <Progress value={progress} className="h-1.5" />
          </div>
        )}

        {/* Action */}
        <div className="flex justify-between items-center border-t border-white/5 pt-4">
          {project.status === 'awarded' && (
            <span className="text-xs text-amber-400 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" /> Accept contract to begin
            </span>
          )}
          {project.status === 'in-progress' && (
            <span className="text-xs text-emerald-400 flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5" /> Work in progress
            </span>
          )}
          {project.status === 'completed' && (
            <span className="text-xs text-gold-400 flex items-center gap-1">
              <Trophy className="w-3.5 h-3.5" /> Project delivered
            </span>
          )}
          <Button asChild size="sm" variant="outline" className="gap-1.5">
            <Link to={`/project/${project._id}/workspace`}>
              Open Workspace <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('open');

  // Open projects (for bidding)
  const [openProjects, setOpenProjects] = useState([]);
  const [openLoading, setOpenLoading] = useState(true);
  const [openError, setOpenError] = useState('');
  const [search, setSearch] = useState('');

  // Won / active projects
  const [wonProjects, setWonProjects] = useState([]);
  const [wonLoading, setWonLoading] = useState(true);
  const [wonError, setWonError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/signin'); return; }

    api.get('/projects/open')
      .then((res) => setOpenProjects(res.data))
      .catch((err) => setOpenError(err.response?.data?.message || err.message))
      .finally(() => setOpenLoading(false));

    api.get('/projects/won')
      .then((res) => setWonProjects(res.data))
      .catch((err) => setWonError(err.response?.data?.message || err.message))
      .finally(() => setWonLoading(false));
  }, [navigate]);

  const filteredOpen = openProjects.filter((p) =>
    p.title?.toLowerCase().includes(search.toLowerCase()) ||
    p.description?.toLowerCase().includes(search.toLowerCase())
  );

  const actionRequired = wonProjects.filter((p) => p.status === 'awarded').length;
  const inProgress = wonProjects.filter((p) => p.status === 'in-progress').length;

  return (
    <div className="min-h-screen bg-luxury-950">
      <Navbar />
      <div className="max-w-6xl mx-auto px-6 py-10">

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="mb-8">
          <h1 className="text-3xl font-black text-ivory tracking-tight mb-1">
            Provider <span className="text-gold-shimmer">Dashboard</span>
          </h1>
          <p className="text-ivory-subtle">Manage your bids and active contracts.</p>
        </div>

        {/* ── Stats row ───────────────────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Open Bids', value: openProjects.length, color: 'text-ivory' },
            { label: 'Action Required', value: actionRequired, color: 'text-amber-400' },
            { label: 'In Progress', value: inProgress, color: 'text-emerald-400' },
          ].map(({ label, value, color }) => (
            <Card key={label} className="border-white/8">
              <CardContent className="p-5 text-center">
                <div className={`text-2xl font-black ${color} mb-1`}>{value}</div>
                <div className="text-xs text-ivory-subtle uppercase tracking-wider">{label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* ── Tabs ────────────────────────────────────────────────────────── */}
        <div className="flex gap-1 mb-6 p-1 rounded-xl bg-white/5 w-fit">
          {[
            { id: 'open', label: 'Open Bids', icon: Gavel },
            { id: 'work', label: `My Work ${wonProjects.length > 0 ? `(${wonProjects.length})` : ''}`, icon: Briefcase },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                tab === id
                  ? 'bg-gold-500/15 text-gold-400 border border-gold-500/25'
                  : 'text-ivory-subtle hover:text-ivory'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
              {id === 'work' && actionRequired > 0 && (
                <span className="w-5 h-5 rounded-full bg-amber-500 text-white text-xs flex items-center justify-center font-bold">
                  {actionRequired}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── Open Bids Tab ────────────────────────────────────────────────── */}
        {tab === 'open' && (
          <>
            <div className="relative max-w-md mb-6">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ivory-subtle" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search open projects..."
                className="pl-10"
              />
            </div>

            {openError && (
              <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">{openError}</div>
            )}

            {openLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-52" />)}
              </div>
            ) : filteredOpen.length === 0 ? (
              <div className="text-center py-20 text-ivory-subtle">
                <Gavel className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p className="font-medium">No open projects found.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {filteredOpen.map((project) => (
                  <Card key={project._id}
                    className="border-gold-500/8 hover:border-gold-500/20 hover:-translate-y-1 transition-all duration-200 group">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-3">
                        <Badge variant="gold">Open</Badge>
                        <span className="text-xs text-ivory-subtle flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(project.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <h3 className="text-ivory font-bold text-lg mb-2 group-hover:text-gold-300 transition-colors">
                        {project.title}
                      </h3>
                      <p className="text-ivory-subtle text-sm leading-relaxed line-clamp-2 mb-4">
                        {project.description}
                      </p>
                      <div className="flex justify-between items-center border-t border-white/5 pt-4">
                        <div>
                          <div className="text-xs text-ivory-subtle mb-0.5">Budget</div>
                          <div className="font-bold text-gold-400">LKR {project.clientBudgetLKR?.toLocaleString()}</div>
                        </div>
                        <div>
                          <div className="text-xs text-ivory-subtle mb-0.5">NPE Estimate</div>
                          <div className="font-semibold text-emerald-400 flex items-center gap-1">
                            <TrendingUp className="w-3.5 h-3.5" />
                            LKR {project.npeEstimate?.toLocaleString()}
                          </div>
                        </div>
                        <Button asChild size="sm">
                          <Link to={`/project/${project._id}/live`}>
                            <Gavel className="mr-1.5 w-3.5 h-3.5" /> Bid Now
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── My Work Tab ──────────────────────────────────────────────────── */}
        {tab === 'work' && (
          <>
            {wonError && (
              <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">{wonError}</div>
            )}

            {wonLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {[1, 2].map((i) => <Skeleton key={i} className="h-52" />)}
              </div>
            ) : wonProjects.length === 0 ? (
              <div className="text-center py-20 text-ivory-subtle">
                <Briefcase className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p className="font-medium">No won projects yet.</p>
                <p className="text-xs mt-1">Win an auction to see your active contracts here.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {wonProjects.map((project) => (
                  <WonProjectCard key={project._id} project={project} />
                ))}
              </div>
            )}
          </>
        )}

      </div>
    </div>
  );
}
