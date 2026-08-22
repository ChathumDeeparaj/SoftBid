import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, BadgeCheck, ExternalLink, User } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import api from '@/services/api';

export default function ProvidersList() {
  const navigate = useNavigate();
  const [providers, setProviders] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/signin'); return; }
    api.get('/users/providers')
      .then(res => setProviders(res.data))
      .catch(err => setError(err.response?.data?.message || err.message))
      .finally(() => setLoading(false));
  }, [navigate]);

  const filtered = providers.filter(p => {
    const q = searchQuery.toLowerCase();
    return (
      p.email?.toLowerCase().includes(q) ||
      p.portfolioUrl?.toLowerCase().includes(q) ||
      p.yearsExperience?.toString().includes(q) ||
      p.companyName?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-luxury-950">
      <Navbar />
      <div className="max-w-7xl mx-auto px-6 py-12">

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-black text-ivory tracking-tight mb-3">
            Browse <span className="text-gold-shimmer">Software Providers</span>
          </h1>
          <p className="text-ivory-subtle max-w-xl mx-auto mb-8">
            Discover elite talent, browse portfolios, and find the perfect partner for your project.
          </p>
          <div className="relative max-w-lg mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ivory-subtle" />
            <Input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by name, email, skills..."
              className="pl-11 h-12 text-base"
            />
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400 text-center">{error}</div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {[1,2,3,4,5,6,7,8].map(i => <Skeleton key={i} className="h-52" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-ivory-subtle">
            <User className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="font-medium">No providers found matching your search.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filtered.map(provider => (
              <Card
                key={provider._id}
                className="border-gold-500/8 hover:border-gold-500/25 hover:-translate-y-1.5 transition-all duration-200 group"
              >
                <CardContent className="p-6 flex flex-col gap-4">
                  <div className="flex justify-between items-start">
                    <Avatar className="w-12 h-12">
                      <AvatarFallback className="text-lg font-black">
                        {(provider.companyName || provider.email).charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    {provider.isVerified && (
                      <Badge variant="success" className="gap-1">
                        <BadgeCheck className="w-3 h-3" />
                        Verified
                      </Badge>
                    )}
                  </div>

                  <div>
                    <h3 className="text-ivory font-bold text-base leading-snug group-hover:text-gold-300 transition-colors truncate">
                      {provider.companyName || provider.email}
                    </h3>
                    <p className="text-xs text-ivory-subtle mt-0.5 truncate">{provider.email}</p>
                  </div>

                  <div className="flex gap-2">
                    <Badge variant="secondary">
                      💼 {provider.yearsExperience || 0} yrs exp.
                    </Badge>
                    {provider.feedbackScore > 0 && (
                      <Badge variant="secondary">
                        ⭐ {provider.feedbackScore.toFixed(1)}
                      </Badge>
                    )}
                  </div>

                  <div className="border-t border-white/5 pt-3 flex justify-between items-center">
                    {provider.portfolioUrl && provider.portfolioUrl !== 'N/A' ? (
                      <a
                        href={provider.portfolioUrl}
                        target="_blank"
                        rel="noreferrer"
                        onClick={e => e.stopPropagation()}
                        className="text-xs text-gold-500/70 hover:text-gold-400 flex items-center gap-1 no-underline transition-colors"
                      >
                        <ExternalLink className="w-3 h-3" /> Portfolio
                      </a>
                    ) : (
                      <span className="text-xs text-ivory-subtle/40">No portfolio</span>
                    )}
                    <Link
                      to={`/provider/${provider._id}`}
                      className="text-xs text-gold-400 hover:text-gold-300 font-semibold no-underline transition-colors"
                    >
                      View Profile →
                    </Link>
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
