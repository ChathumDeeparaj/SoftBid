import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Radio, Trophy, Crown, Send, CheckCircle, Star, AlertCircle } from 'lucide-react';
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
  const [userId, setUserId] = useState(null);
  const [bidAmount, setBidAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [awarding, setAwarding] = useState(false);
  const [awardError, setAwardError] = useState('');
  const [awardSuccess, setAwardSuccess] = useState(null); // { providerName, bidAmount }
  const socketRef = useRef(null);

  // Re-fetch project data (used after socket events)
  const refetchProject = useCallback(async () => {
    try {
      const [projectRes, bidsRes] = await Promise.all([
        api.get(`/projects/${projectId}`),
        api.get(`/bids/${projectId}`),
      ]);
      setProject(projectRes.data);
      setBids(bidsRes.data);
    } catch (err) {
      console.error('Refetch error:', err.message);
    }
  }, [projectId]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/signin'); return; }
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      setUserRole(payload.role);
      setUserId(payload.id);
    } catch { /* ignore */ }

    socketRef.current = io('http://localhost:5001', {
      auth: { token: localStorage.getItem('token') },
    });
    socketRef.current.emit('join_auction', projectId);

    // Real-time bid updates
    socketRef.current.on('bids_updated', (updatedBids) => setBids(updatedBids));

    // Auction auto-closed by scheduler → refresh project status
    socketRef.current.on('auction_closed', ({ projectId: closedId }) => {
      if (closedId === projectId) {
        setProject((prev) => prev ? { ...prev, status: 'closed' } : prev);
      }
    });

    // Someone awarded the contract → refresh everything
    socketRef.current.on('auction_awarded', (data) => {
      if (data.projectId === projectId) {
        refetchProject();
        setAwardSuccess({
          providerName: data.awardedProvider?.companyName || data.awardedProvider?.email || 'Provider',
          bidAmount: null,
        });
      }
    });

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
  }, [projectId, navigate, refetchProject]);

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

  const handleAward = async (bid) => {
    setAwarding(true);
    setAwardError('');
    try {
      await api.put(`/projects/${projectId}/award`, { bidId: bid._id });
      setAwardSuccess({
        providerName: bid.provider?.companyName || bid.provider?.email || 'Provider',
        bidAmount: bid.bidAmountLKR,
      });
      // Update local project status immediately
      setProject((prev) => ({
        ...prev,
        status: 'awarded',
        awardedBid: bid._id,
        awardedProvider: bid.provider?._id,
      }));
    } catch (err) {
      setAwardError(err.response?.data?.message || 'Failed to award project. Please try again.');
    } finally {
      setAwarding(false);
    }
  };

  // Derived state
  // project.client is populated: { _id, email, companyName }
  const clientId = project?.client?._id?.toString() || project?.client?.toString();
  const isOwner = !!userId && clientId === userId;

  const topBid = bids[0] || null;
  const isClosed = project?.status === 'closed';
  const isAwarded = project?.status === 'awarded';

  // ── Loading ──────────────────────────────────────────────────────────────
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

        {/* ── Header card ─────────────────────────────────────────────────── */}
        <Card className="border-gold-500/15 bg-card-gradient">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <Badge variant={isAwarded ? 'secondary' : isClosed ? 'destructive' : 'live'} className="gap-1.5">
                    {!isAwarded && !isClosed && (
                      <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                    )}
                    {isAwarded ? '🏆 Awarded' : isClosed ? 'Auction Closed' : 'Live Auction'}
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

              {/* Bid form — only shown to providers when auction is open */}
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

        {/* ── Award Success Banner ─────────────────────────────────────────── */}
        {(isAwarded || awardSuccess) && (
          <div
            className="rounded-xl border border-gold-500/30 p-6"
            style={{
              background: 'linear-gradient(135deg, rgba(202,163,66,0.12) 0%, rgba(202,163,66,0.04) 100%)',
            }}
          >
            <div className="flex items-center gap-4">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center shrink-0"
                style={{ background: 'linear-gradient(135deg, #CAA342 0%, #E8C56A 100%)' }}
              >
                <CheckCircle className="w-7 h-7 text-luxury-950" />
              </div>
              <div>
                <div className="text-xl font-black text-gold-400 mb-1">
                  🏆 Contract Awarded!
                </div>
                <div className="text-ivory-subtle text-sm">
                  The contract for <span className="text-ivory font-semibold">"{project.title}"</span> has been
                  awarded to{' '}
                  <span className="text-gold-400 font-bold">
                    {awardSuccess?.providerName ||
                      bids.find((b) => b._id === project.awardedBid)?.provider?.companyName ||
                      'the winning provider'}
                  </span>
                  {awardSuccess?.bidAmount && (
                    <> for <span className="text-ivory font-semibold">LKR {awardSuccess.bidAmount.toLocaleString()}</span></>
                  )}.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Award Panel — shown to project owner when auction is closed ─── */}
        {isClosed && isOwner && !isAwarded && (
          <Card
            className="border-gold-500/30 overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(202,163,66,0.08) 0%, rgba(15,14,23,0.9) 60%)',
            }}
          >
            <CardHeader className="border-b border-gold-500/15 pb-4">
              <CardTitle className="flex items-center gap-2.5 text-gold-400">
                <Crown className="w-5 h-5" />
                Award This Contract
              </CardTitle>
              <p className="text-ivory-subtle text-sm mt-1">
                The auction has closed. Review the AHP-TOPSIS rankings below and award the contract
                to your preferred provider.
              </p>
            </CardHeader>
            <CardContent className="p-6">
              {bids.length === 0 ? (
                <div className="flex items-center gap-3 text-ivory-subtle py-2">
                  <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
                  <span>No bids were placed for this project. The auction ended without any offers.</span>
                </div>
              ) : (
                <>
                  {/* Top recommended bid */}
                  {topBid && (
                    <div
                      className="rounded-xl border border-gold-500/25 p-5 mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
                      style={{ background: 'rgba(202,163,66,0.07)' }}
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className="w-12 h-12 rounded-full flex items-center justify-center font-black text-luxury-950 text-lg shrink-0"
                          style={{ background: 'linear-gradient(135deg, #CAA342, #E8C56A)' }}
                        >
                          {topBid.provider?.companyName?.charAt(0) || topBid.provider?.email?.charAt(0) || '?'}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-ivory text-base">
                              {topBid.provider?.companyName || topBid.provider?.email || 'Unknown'}
                            </span>
                            {topBid.provider?.isVerified && (
                              <span className="text-xs text-gold-500 font-semibold flex items-center gap-0.5">
                                <Star className="w-3 h-3" /> VERIFIED
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-xs text-ivory-subtle">Trust Score:</span>
                            <span className="text-gold-400 font-mono font-semibold text-sm">
                              {topBid.trustScore.toFixed(4)}
                            </span>
                            <span className="text-xs text-ivory-subtle">•</span>
                            <span className="text-xs text-ivory-subtle">Bid:</span>
                            <span className="text-ivory font-bold">
                              LKR {topBid.bidAmountLKR.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-start sm:items-end gap-2 shrink-0">
                        <div className="text-xs text-gold-500 font-semibold uppercase tracking-wider">
                          ⭐ Top Ranked by AHP-TOPSIS
                        </div>
                        <Button
                          onClick={() => handleAward(topBid)}
                          disabled={awarding}
                          className="font-bold"
                          style={{
                            background: 'linear-gradient(135deg, #CAA342, #E8C56A)',
                            color: '#0F0E17',
                          }}
                        >
                          {awarding ? 'Awarding...' : '🏆 Award Contract'}
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Other bids — client can still choose a lower-ranked one */}
                  {bids.length > 1 && (
                    <div>
                      <p className="text-xs text-ivory-subtle mb-3 uppercase tracking-wider">
                        Or choose another bid
                      </p>
                      <div className="space-y-2">
                        {bids.slice(1).map((bid, idx) => (
                          <div
                            key={bid._id}
                            className="rounded-lg border border-white/8 p-4 flex items-center justify-between gap-4"
                            style={{ background: 'rgba(255,255,255,0.02)' }}
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-ivory-subtle text-sm font-bold">
                                {idx + 2}
                              </div>
                              <div>
                                <div className="font-semibold text-ivory text-sm">
                                  {bid.provider?.companyName || bid.provider?.email || 'Unknown'}
                                </div>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="text-xs text-ivory-subtle">Score:</span>
                                  <span className="text-gold-400 font-mono text-xs">{bid.trustScore.toFixed(4)}</span>
                                  <span className="text-xs text-ivory-subtle">•</span>
                                  <span className="text-ivory text-xs font-bold">
                                    LKR {bid.bidAmountLKR.toLocaleString()}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleAward(bid)}
                              disabled={awarding}
                              className="shrink-0 text-xs"
                            >
                              Award
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Error message */}
                  {awardError && (
                    <div className="mt-4 flex items-center gap-2 text-red-400 text-sm rounded-lg border border-red-500/20 bg-red-500/8 px-4 py-3">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      {awardError}
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* ── AHP-TOPSIS Live Leaderboard ──────────────────────────────────── */}
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
                    {isAwarded && <TableHead className="text-center">Status</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bids.map((bid, index) => {
                    const isWinner = bid._id === project.awardedBid || bid.status === 'accepted';
                    return (
                      <TableRow
                        key={bid._id}
                        className={`
                          ${isWinner ? 'bg-gold-500/8 border-l-2 border-l-gold-500' : ''}
                          ${index === 0 && !isAwarded ? 'bg-gold-500/5 border-l-2 border-l-gold-500' : ''}
                        `}
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
                        {isAwarded && (
                          <TableCell className="text-center">
                            {isWinner ? (
                              <span className="inline-flex items-center gap-1 text-xs font-bold text-gold-400 bg-gold-500/10 border border-gold-500/25 rounded-full px-2.5 py-1">
                                <Crown className="w-3 h-3" /> Winner
                              </span>
                            ) : (
                              <span className="text-xs text-ivory-subtle/50">—</span>
                            )}
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
