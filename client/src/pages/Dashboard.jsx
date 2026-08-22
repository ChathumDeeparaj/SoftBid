import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Gavel, Search, Clock, TrendingUp } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import api from '@/services/api';

export default function Dashboard() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/signin'); return; }

    api.get('/projects/open')
      .then(res => setProjects(res.data))
      .catch(err => setError(err.response?.data?.message || err.message))
      .finally(() => setLoading(false));
  }, [navigate]);

  const filtered = projects.filter(p =>
    p.title?.toLowerCase().includes(search.toLowerCase()) ||
    p.description?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-luxury-950">
      <Navbar />
      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="mb-10">
          <h1 className="text-3xl font-black text-ivory tracking-tight mb-2">
            Open <span className="text-gold-shimmer">Projects</span>
          </h1>
          <p className="text-ivory-subtle mb-6">Browse active projects and place your winning bid.</p>
          <div className="relative max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ivory-subtle" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search projects..."
              className="pl-10"
            />
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">{error}</div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {[1,2,3,4].map(i => <Skeleton key={i} className="h-52" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-ivory-subtle">
            <Gavel className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="font-medium">No open projects found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filtered.map(project => (
              <Card
                key={project._id}
                className="border-gold-500/8 hover:border-gold-500/20 hover:-translate-y-1 transition-all duration-200 group"
              >
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
                      <div className="font-bold text-gold-400">
                        LKR {project.clientBudgetLKR?.toLocaleString()}
                      </div>
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
                        <Gavel className="mr-1.5 w-3.5 h-3.5" />
                        Bid Now
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
