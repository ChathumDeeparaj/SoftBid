import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PlusCircle, FolderOpen, ArrowRight, Clock, Gavel } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import api from '@/services/api';

const STATUS_VARIANT = {
  open:        'default',
  'in-progress': 'secondary',
  completed:   'success',
  cancelled:   'destructive',
};

export default function ClientDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/signin'); return; }

    const fetchData = async () => {
      try {
        const userRes = await api.get('/auth/me');
        const userData = userRes.data;
        if (userData.role !== 'client') { navigate('/provider/dashboard'); return; }
        setUser(userData);
        const projRes = await api.get('/projects/my-projects');
        setProjects(projRes.data);
      } catch (err) {
        setError(err.response?.data?.message || err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-luxury-950">
      <Navbar />
      <div className="max-w-6xl mx-auto px-6 py-10">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-10">
          <div>
            <h1 className="text-3xl font-black text-ivory tracking-tight mb-1">
              Welcome back, <span className="text-gold-shimmer">{user?.companyName || 'Client'}</span>
            </h1>
            <p className="text-ivory-subtle">Manage your projects and track bid activity.</p>
          </div>
          <Button asChild size="lg">
            <Link to="/post-project">
              <PlusCircle className="mr-2 w-4 h-4" />
              Post New Project
            </Link>
          </Button>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">{error}</div>
        )}

        {/* Projects grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {[1,2,3].map(i => <Skeleton key={i} className="h-52 w-full" />)}
          </div>
        ) : projects.length === 0 ? (
          <Card className="border-dashed border-white/10 bg-transparent">
            <CardContent className="flex flex-col items-center justify-center py-20 gap-4">
              <FolderOpen className="w-14 h-14 text-ivory-subtle/30" />
              <div className="text-center">
                <p className="text-ivory font-semibold mb-1">No projects yet</p>
                <p className="text-sm text-ivory-subtle">Post your first project to start receiving bids.</p>
              </div>
              <Button asChild>
                <Link to="/post-project">Post a Project</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {projects.map(project => (
              <Card
                key={project._id}
                className="border-gold-500/8 hover:border-gold-500/20 hover:-translate-y-1 transition-all duration-200 cursor-pointer group"
                onClick={() => navigate(`/project/${project._id}/live`)}
              >
                <CardContent className="p-6 flex flex-col h-full">
                  <div className="flex justify-between items-start mb-3">
                    <Badge variant={STATUS_VARIANT[project.status] || 'secondary'}>
                      {project.status}
                    </Badge>
                    <span className="text-xs text-ivory-subtle flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(project.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <h3 className="text-ivory font-bold text-lg mb-2 leading-snug group-hover:text-gold-300 transition-colors">
                    {project.title}
                  </h3>
                  <p className="text-ivory-subtle text-sm leading-relaxed flex-1 line-clamp-2 mb-4">
                    {project.description}
                  </p>

                  <div className="border-t border-white/5 pt-4 flex justify-between items-center">
                    <div>
                      <div className="text-xs text-ivory-subtle mb-0.5">Budget</div>
                      <div className="font-bold text-gold-400">
                        LKR {project.clientBudgetLKR?.toLocaleString('en-LK')}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-gold-500/60 group-hover:text-gold-400 transition-colors text-sm font-semibold">
                      <Gavel className="w-4 h-4" />
                      View Auction
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
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
