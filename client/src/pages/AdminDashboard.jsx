import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, Layers, ChevronRight, Plus, Trash2, MessageSquare, ShieldAlert } from 'lucide-react';
import { io } from 'socket.io-client';
import Navbar from '@/components/Navbar';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import api from '@/services/api';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [projects, setProjects] = useState([]);
  const [npeConfig, setNpeConfig] = useState(null);
  const [flaggedCount, setFlaggedCount] = useState(0);
  const socketRef = useRef(null);


  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/signin'); return; }

    const fetchAdminData = async () => {
      try {
        const userRes = await api.get('/auth/me');
        const userData = userRes.data;
        if (userData.role !== 'admin') { navigate('/'); return; }
        setUser(userData);
        const projRes = await api.get('/projects/all');
        if (projRes.data) setProjects(projRes.data);
        if (userData.isSuperAdmin) {
          const npeRes = await api.get('/npe/config');
          if (npeRes.data) setNpeConfig(npeRes.data);
        }
        // Fetch pending flag count for badge
        const countRes = await api.get('/messages/flagged/count');
        setFlaggedCount(countRes.data.count || 0);
      } catch (err) {
        setError(err.response?.data?.message || err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();

    // Real-time: listen for new flags to update badge count
    socketRef.current = io('http://localhost:5001', { auth: { token } });
    socketRef.current.on('message_flagged', () => {
      setFlaggedCount((c) => c + 1);
    });
    socketRef.current.on('flag_resolved', () => {
      setFlaggedCount((c) => Math.max(0, c - 1));
    });

    return () => socketRef.current?.disconnect();
  }, [navigate]);



  const handleUpdateConfig = async (e) => {
    e.preventDefault();
    try {
      await api.put('/npe/config', npeConfig);
      alert('NPE Configuration updated successfully!');
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-luxury-950">
      <Navbar />
      <div className="max-w-6xl mx-auto px-6 py-10 space-y-4">
        <Skeleton className="h-16 w-80" />
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-80 w-full" />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-luxury-950 pb-16">
      <Navbar />
      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-ivory mb-1 tracking-tight">Admin Dashboard</h1>
          <p className="text-ivory-subtle">
            Platform management {user?.isSuperAdmin && '& NPE engine calibration'}
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">{error}</div>
        )}

        <Tabs defaultValue="projects">
          <TabsList className="mb-6">
            <TabsTrigger value="projects">
              <Layers className="w-4 h-4 mr-2" /> All Projects
            </TabsTrigger>
            <TabsTrigger value="messages" onClick={() => navigate('/admin/messages')}>
              <MessageSquare className="w-4 h-4 mr-2" />
              Message Monitor
              {flaggedCount > 0 && (
                <span className="ml-2 px-1.5 py-0.5 rounded-full bg-red-500 text-white text-xs font-bold animate-pulse">
                  {flaggedCount}
                </span>
              )}
            </TabsTrigger>
            {user?.isSuperAdmin && (
              <TabsTrigger value="npe">
                <Settings className="w-4 h-4 mr-2" /> NPE Engine
              </TabsTrigger>
            )}
          </TabsList>

          {/* Projects Tab */}
          <TabsContent value="projects">
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Project</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Budget / NPE</TableHead>
                      <TableHead>Risk</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {projects.map(p => (
                      <TableRow key={p._id}>
                        <TableCell>
                          <div className="font-semibold text-ivory">{p.title}</div>
                          <div className="text-xs text-ivory-subtle">{new Date(p.createdAt).toLocaleDateString()}</div>
                        </TableCell>
                        <TableCell className="text-ivory-subtle">{p.client?.companyName || p.client?.email}</TableCell>
                        <TableCell>
                          <div className="text-red-300 text-sm font-semibold">LKR {p.clientBudgetLKR?.toLocaleString('en-LK')}</div>
                          <div className="text-emerald-400 text-xs">NPE: {p.npeEstimate?.toLocaleString('en-LK')}</div>
                        </TableCell>
                        <TableCell>
                          {p.riskAccepted
                            ? <Badge variant="destructive">High Risk</Badge>
                            : <Badge variant="success">Normal</Badge>}
                        </TableCell>
                        <TableCell>
                          <Badge variant={p.status === 'open' ? 'gold' : 'secondary'}>
                            {p.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* NPE Config Tab */}
          {user?.isSuperAdmin && npeConfig && (
            <TabsContent value="npe">
              <form onSubmit={handleUpdateConfig}>
                <Card className="mb-6">
                  <CardHeader><CardTitle>Engine Calibration</CardTitle></CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label>Sri Lanka Hourly Rate (LKR)</Label>
                        <Input
                          type="number"
                          value={npeConfig.hourlyRateLKR}
                          onChange={e => setNpeConfig({...npeConfig, hourlyRateLKR: Number(e.target.value)})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Hours per Function Point</Label>
                        <Input
                          type="number"
                          value={npeConfig.hoursPerFP}
                          onChange={e => setNpeConfig({...npeConfig, hoursPerFP: Number(e.target.value)})}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                  <Card>
                    <CardHeader><CardTitle className="text-sm">Integration Multipliers</CardTitle></CardHeader>
                    <CardContent className="space-y-3">
                      {[['Low (0-1)', 'low'], ['Mid (2-3)', 'mid'], ['High (4+)', 'high']].map(([label, key]) => (
                        <div key={key} className="flex justify-between items-center">
                          <Label>{label}</Label>
                          <Input
                            type="number" step="0.1"
                            value={npeConfig.integrationMultipliers[key]}
                            onChange={e => setNpeConfig({...npeConfig, integrationMultipliers: {...npeConfig.integrationMultipliers, [key]: Number(e.target.value)}})}
                            className="w-20 text-center"
                          />
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader><CardTitle className="text-sm">Security Multipliers</CardTitle></CardHeader>
                    <CardContent className="space-y-3">
                      {[['Basic', 'basic'], ['Standard', 'standard'], ['High', 'high']].map(([label, key]) => (
                        <div key={key} className="flex justify-between items-center">
                          <Label>{label}</Label>
                          <Input
                            type="number" step="0.1"
                            value={npeConfig.securityMultipliers[key]}
                            onChange={e => setNpeConfig({...npeConfig, securityMultipliers: {...npeConfig.securityMultipliers, [key]: Number(e.target.value)}})}
                            className="w-20 text-center"
                          />
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>

                <Card className="mb-6">
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle>Features & Base FP</CardTitle>
                      <Button type="button" variant="outline" size="sm"
                        onClick={() => setNpeConfig({...npeConfig, features: [...(npeConfig.features||[]), {id:'feature_'+Date.now(),label:'New Feature',baseFP:10}]})}>
                        <Plus className="w-4 h-4 mr-1" /> Add Feature
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {(npeConfig.features||[]).map((f, i) => (
                        <div key={f.id} className="rounded-lg border border-white/5 bg-luxury-800 p-3 space-y-2">
                          <Input
                            value={f.label}
                            onChange={e => { const nf=[...npeConfig.features]; nf[i].label=e.target.value; setNpeConfig({...npeConfig,features:nf}); }}
                            placeholder="Feature label"
                            className="text-sm"
                          />
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              value={f.baseFP}
                              onChange={e => { const nf=[...npeConfig.features]; nf[i].baseFP=Number(e.target.value); setNpeConfig({...npeConfig,features:nf}); }}
                              className="text-sm"
                              placeholder="Base FP"
                            />
                            <Button type="button" variant="destructive" size="icon"
                              onClick={() => setNpeConfig({...npeConfig, features: npeConfig.features.filter(feat => feat.id !== f.id)})}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Button type="submit" size="lg">Save NPE Configuration</Button>
              </form>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}
