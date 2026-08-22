import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Radio, Trophy, Crown, Send } from 'lucide-react';
import Navbar from '@/components/Navbar';
import AuctionTimer from '@/components/AuctionTimer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import api from '@/services/api';
import { io } from 'socket.io-client';


const RANK_ICONS = [
  <Crown className="w-4 h-4 text-gold-400" />,
  <Trophy className="w-4 h-4 text-slate-300" />,
  <Trophy className="w-4 h-4 text-amber-700" />,
];

export default function LiveAuction() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userRole, setUserRole] = useState(null);
  const [bidAmount, setBidAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/signin'); return; }
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      setUserRole(payload.role);
    } catch { /* ignore */ }

    socketRef.current = io('http://localhost:5001', {
      auth: { token: localStorage.getItem('token') },
    });
    socketRef.current.emit('join_auction', projectId);
    socketRef.current.on('bids_updated', (updatedBids) => setBids(updatedBids));

    const fetchAuctionData = async () => {
      try {
        const [projectRes, bidsRes] = await Promise.all([
          api.get(`/projects/${projectId}`),
          api.get(`/bids/${projectId}`),
        ]);
        setProject(projectRes.data);
        setBids(bidsRes.data);
      } catch (err) {
        setError(err.response?.data?.message || err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchAuctionData();

    return () => {
      socketRef.current.emit('leave_auction', projectId);
      socketRef.current.disconnect();
    };
  }, [projectId, navigate]);

  const handleSubmitBid = async (e) => {
    e.preventDefault();
    if (!bidAmount) return;
    setSubmitting(true);
    try {
      await api.post('/bids', { projectId, bidAmountLKR: Number(bidAmount) });
      setBidAmount('');
    } catch (err) {
      alert(err.response?.data?.message || 'Error submitting bid');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-luxury-950">
      <Navbar />
      <div className="max-w-6xl mx-auto px-6 py-10 space-y-4">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-80 w-full" />
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
    <div className="min-h-screen bg-luxury-950 pb-16">
      <Navbar />
      <div className="max-w-6xl mx-auto px-6 py-10 space-y-8">

        {/* Header card */}
        <Card className="border-gold-500/15 bg-card-gradient">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <Badge variant="live" className="gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                    Live Auction
                  </Badge>
                  <span className="text-xs text-ivory-subtle font-mono">
                    ID: {projectId.slice(-8).toUpperCase()}
                  </span>
                </div>
                <h1 className="text-3xl font-black text-ivory mb-3 tracking-tight">{project.title}</h1>
                <p className="text-ivory-subtle leading-relaxed max-w-xl mb-6">{project.description}</p>
                <div className="flex flex-col gap-4">
                  <div className="flex gap-6">
                    <div>
                      <div className="text-xs uppercase tracking-wider text-ivory-subtle mb-1">Client Budget</div>
                      <div className="text-xl font-bold text-ivory">LKR {project.clientBudgetLKR?.toLocaleString()}</div>
                    </div>
                    <div className="w-px bg-white/8" />
                    <div>
                      <div className="text-xs uppercase tracking-wider text-gold-500 mb-1">NPE Estimate</div>
                      <div className="text-xl font-bold text-gold-400">LKR {project.npeEstimate?.toLocaleString()}</div>
                    </div>
                  </div>
                  {/* Auction Timer */}
                  <AuctionTimer auctionEndsAt={project.auctionEndsAt} status={project.status} />
                </div>
              </div>

              {/* Bid form — only shown when auction is open */}
              {userRole === 'provider' && project.status === 'open' && (
                <Card className="w-full md:w-72 border-gold-500/20 shrink-0">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Send className="w-4 h-4 text-gold-400" />
                      Place Your Bid
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSubmitBid} className="space-y-3">
                      <div className="space-y-1.5">
                        <Label>Bid Amount (LKR)</Label>
                        <Input
                          type="number"
                          value={bidAmount}
                          onChange={(e) => setBidAmount(e.target.value)}
                          placeholder="e.g. 250,000"
                        />
                      </div>
                      <Button type="submit" className="w-full" disabled={submitting}>
                        {submitting ? 'Submitting...' : 'Submit Bid'}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Leaderboard */}
        <Card className="border-gold-500/12">
          <CardHeader>
            <CardTitle className="flex items-center gap-2.5">
              <Radio className="w-5 h-5 text-gold-400" />
              AHP-TOPSIS Live Leaderboard
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {bids.length === 0 ? (
              <div className="text-center py-16 text-ivory-subtle">
                <Trophy className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p className="font-medium">No bids yet — be the first to place one!</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-white/8 hover:bg-transparent">
                    <TableHead className="w-20 text-center">Rank</TableHead>
                    <TableHead>Provider</TableHead>
                    <TableHead>Trust Score</TableHead>
                    <TableHead className="text-right">Bid Amount (LKR)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bids.map((bid, index) => (
                    <TableRow
                      key={bid._id}
                      className={index === 0 ? 'bg-gold-500/5 border-l-2 border-l-gold-500' : ''}
                    >
                      <TableCell className="text-center">
                        <div className={`w-8 h-8 rounded-full mx-auto flex items-center justify-center font-bold text-sm
                          ${index === 0 ? 'bg-gold-gradient text-luxury-950' : index === 1 ? 'bg-slate-600 text-white' : index === 2 ? 'bg-amber-800 text-white' : 'border border-white/10 text-ivory-subtle'}`}>
                          {index < 3 ? RANK_ICONS[index] : bid.rank}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="w-8 h-8">
                            <AvatarFallback className="text-xs">
                              {bid.provider?.companyName?.charAt(0) || bid.provider?.email?.charAt(0) || '?'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-semibold text-ivory text-sm">
                              {bid.provider?.companyName || bid.provider?.email || 'Unknown'}
                            </div>
                            {bid.provider?.isVerified && (
                              <span className="text-xs text-gold-500 font-semibold">✦ VERIFIED</span>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3 min-w-[140px]">
                          <span className="text-gold-400 font-mono font-semibold text-sm w-14 shrink-0">
                            {bid.trustScore.toFixed(4)}
                          </span>
                          <Progress value={bid.trustScore * 100} className="flex-1" />
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-bold text-ivory">
                        {bid.bidAmountLKR.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
