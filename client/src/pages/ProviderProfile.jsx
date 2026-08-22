import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BadgeCheck, MapPin, Clock, ExternalLink, Star, Edit3, Save, X } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import api from '@/services/api';

const StarRating = ({ rating, total = 5 }) => (
  <span className="text-gold-400">
    {'★'.repeat(rating)}
    <span className="text-white/20">{'★'.repeat(total - rating)}</span>
  </span>
);

export default function ProviderProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [provider, setProvider] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isOwner, setIsOwner] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({});
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/signin'); return; }
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      setIsOwner(payload.id === id);
      setIsClient(payload.role === 'client');
    } catch { /* ignore */ }

    const fetchProfileAndReviews = async () => {
      try {
        const [profileRes, reviewsRes] = await Promise.all([
          api.get(`/users/providers/${id}`),
          api.get(`/users/providers/${id}/reviews`),
        ]);
        setProvider(profileRes.data);
        setReviews(reviewsRes.data);
        setFormData({
          description: profileRes.data.description || '',
          skills: profileRes.data.skills?.join(', ') || '',
          portfolioUrl: profileRes.data.portfolioUrl || '',
          country: profileRes.data.country || '',
          avgResponseTime: profileRes.data.avgResponseTime || '1 hour',
          lastDelivery: profileRes.data.lastDelivery || '1 day',
        });
      } catch (err) {
        setError(err.response?.data?.message || err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchProfileAndReviews();
  }, [id, navigate]);

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const skillsArray = formData.skills.split(',').map(s => s.trim()).filter(Boolean);
      const res = await api.put(`/users/providers/${id}`, { ...formData, skills: skillsArray });
      setProvider(res.data);
      setIsEditing(false);
    } catch (err) {
      alert(err.response?.data?.message || 'Error saving profile');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!comment.trim()) { setReviewError('Please enter a comment'); return; }
    setSubmittingReview(true);
    setReviewError('');
    try {
      await api.post(`/users/providers/${id}/reviews`, { rating, comment });
      const [profileRes, reviewsRes] = await Promise.all([
        api.get(`/users/providers/${id}`),
        api.get(`/users/providers/${id}/reviews`),
      ]);
      setProvider(profileRes.data);
      setReviews(reviewsRes.data);
      setComment(''); setRating(5);
    } catch (err) {
      setReviewError(err.response?.data?.message || 'Error submitting review');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-luxury-950">
      <Navbar />
      <div className="max-w-5xl mx-auto px-6 py-10 flex gap-8">
        <Skeleton className="w-72 h-[500px] shrink-0" />
        <div className="flex-1 space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    </div>
  );

  if (error || !provider) return (
    <div className="min-h-screen bg-luxury-950 flex flex-col">
      <Navbar />
      <div className="flex-1 flex flex-col items-center justify-center gap-4">
        <p className="text-red-400 text-lg font-semibold">{error || 'Provider not found'}</p>
        <Button variant="outline" onClick={() => navigate('/providers')}>Back to Providers</Button>
      </div>
    </div>
  );

  const displayName = provider.companyName || provider.email.split('@')[0];

  return (
    <div className="min-h-screen bg-luxury-950 pb-16">
      <Navbar />
      <div className="max-w-5xl mx-auto px-6 py-10 flex flex-col md:flex-row gap-8 items-start">

        {/* ── Left: Profile Sidebar ── */}
        <Card className="md:w-72 shrink-0 border-gold-500/12 w-full">
          <CardContent className="p-6">
            {/* Online status */}
            <div className="flex justify-end mb-4">
              <Badge variant="success" className="gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Online
              </Badge>
            </div>

            {/* Avatar */}
            <div className="flex flex-col items-center text-center mb-6">
              <div className="relative mb-4">
                <Avatar className="w-24 h-24 ring-4 ring-gold-500/20">
                  <AvatarFallback className="text-3xl font-black">
                    {displayName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                {provider.isVerified && (
                  <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-gold-gradient border-2 border-luxury-900 flex items-center justify-center">
                    <BadgeCheck className="w-4 h-4 text-luxury-950" />
                  </div>
                )}
              </div>

              <h1 className="text-xl font-black text-ivory mb-1">{displayName}</h1>

              {isEditing ? (
                <Textarea
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  placeholder="Profile description"
                  className="mt-2 text-sm resize-none h-20"
                />
              ) : (
                <p className="text-sm text-ivory-subtle leading-relaxed mt-1">
                  {provider.description || 'Professional software developer delivering scalable solutions.'}
                </p>
              )}

              {/* Star rating */}
              <div className="flex items-center gap-2 mt-4">
                <StarRating rating={Math.round(provider.feedbackScore || 0)} />
                <span className="text-ivory font-bold">
                  {provider.feedbackScore > 0 ? provider.feedbackScore.toFixed(1) : '—'}
                </span>
                <span className="text-xs text-ivory-subtle">({provider.completedProjects || 0})</span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2 mb-6">
              {isOwner ? (
                isEditing ? (
                  <>
                    <Button onClick={handleSaveProfile} disabled={saving} className="flex-1" size="sm">
                      <Save className="w-3.5 h-3.5 mr-1" />{saving ? 'Saving...' : 'Save'}
                    </Button>
                    <Button onClick={() => setIsEditing(false)} variant="secondary" className="flex-1" size="sm">
                      <X className="w-3.5 h-3.5 mr-1" />Cancel
                    </Button>
                  </>
                ) : (
                  <Button onClick={() => setIsEditing(true)} variant="outline" className="flex-1" size="sm">
                    <Edit3 className="w-3.5 h-3.5 mr-1" />Edit Profile
                  </Button>
                )
              ) : (
                <Button className="flex-1" size="sm">Contact</Button>
              )}
            </div>

            <Separator className="mb-4" />

            {/* Profile meta */}
            <div className="space-y-3 text-sm">
              {[
                { icon: <MapPin className="w-3.5 h-3.5" />, label: 'Location', field: 'country', value: provider.country },
                { icon: <Clock className="w-3.5 h-3.5" />, label: 'Avg Response', field: 'avgResponseTime', value: provider.avgResponseTime },
                { icon: <Star className="w-3.5 h-3.5" />, label: 'Experience', value: `${provider.yearsExperience || 0} years` },
              ].map(({ icon, label, field, value }) => (
                <div key={label} className="flex justify-between items-center">
                  <span className="flex items-center gap-1.5 text-ivory-subtle">
                    {icon}{label}
                  </span>
                  {isEditing && field ? (
                    <Input
                      value={formData[field]}
                      onChange={e => setFormData({...formData, [field]: e.target.value})}
                      className="w-28 h-7 text-xs px-2 text-right"
                    />
                  ) : (
                    <span className="text-ivory font-semibold">{value || '—'}</span>
                  )}
                </div>
              ))}

              {provider.portfolioUrl && provider.portfolioUrl !== 'N/A' && (
                <a href={provider.portfolioUrl} target="_blank" rel="noreferrer"
                  className="flex items-center justify-between text-gold-400 hover:text-gold-300 no-underline transition-colors">
                  <span className="text-ivory-subtle">Portfolio</span>
                  <span className="flex items-center gap-1 font-semibold"><ExternalLink className="w-3 h-3" /> View</span>
                </a>
              )}
            </div>

            {/* Edit extras */}
            {isEditing && (
              <>
                <Separator className="my-4" />
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label>Skills (comma separated)</Label>
                    <Input value={formData.skills} onChange={e => setFormData({...formData, skills: e.target.value})} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Portfolio URL</Label>
                    <Input value={formData.portfolioUrl} onChange={e => setFormData({...formData, portfolioUrl: e.target.value})} />
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* ── Right: Skills, Reviews ── */}
        <div className="flex-1 space-y-8">

          {/* Skills */}
          {provider.skills?.length > 0 && (
            <Card className="border-gold-500/10">
              <CardHeader><CardTitle>Skills & Expertise</CardTitle></CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {provider.skills.map(skill => (
                    <Badge key={skill} variant="secondary">{skill}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Reviews */}
          <Card className="border-gold-500/10">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Reviews ({provider.completedProjects || 0})</CardTitle>
                <div className="flex items-center gap-2 text-sm">
                  <StarRating rating={Math.round(provider.feedbackScore || 0)} />
                  <span className="text-ivory font-bold">
                    {provider.feedbackScore > 0 ? provider.feedbackScore.toFixed(1) : '—'}
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">

              {/* Leave Review Form */}
              {isClient && (
                <div className="rounded-xl border border-gold-500/15 bg-luxury-800/50 p-5 mb-2">
                  <h3 className="text-ivory font-semibold mb-4 text-sm">Leave a Review</h3>
                  {reviewError && (
                    <p className="text-red-400 text-xs mb-3">{reviewError}</p>
                  )}
                  <form onSubmit={handleSubmitReview} className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Label>Rating</Label>
                      <select
                        value={rating}
                        onChange={e => setRating(Number(e.target.value))}
                        className="bg-luxury-800 border border-white/10 text-gold-400 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-gold-500/30"
                      >
                        {[5,4,3,2,1].map(n => (
                          <option key={n} value={n}>{'★'.repeat(n)} {n}</option>
                        ))}
                      </select>
                    </div>
                    <Textarea
                      value={comment}
                      onChange={e => setComment(e.target.value)}
                      placeholder="Describe your experience..."
                      className="h-20"
                    />
                    <Button type="submit" size="sm" disabled={submittingReview}>
                      {submittingReview ? 'Submitting...' : 'Submit Review'}
                    </Button>
                  </form>
                </div>
              )}

              {/* Review list */}
              {reviews.length === 0 ? (
                <p className="text-ivory-subtle text-sm italic">No reviews yet.</p>
              ) : (
                <div className="space-y-5">
                  {reviews.map(review => (
                    <div key={review._id} className="border-b border-white/5 pb-5 last:border-0 last:pb-0">
                      <div className="flex items-center gap-3 mb-3">
                        <Avatar className="w-9 h-9">
                          <AvatarFallback className="text-sm">
                            {(review.client?.companyName || review.client?.email)?.charAt(0).toUpperCase() || 'C'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="text-ivory font-semibold text-sm">
                            {review.client?.companyName || review.client?.email || 'Anonymous Client'}
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            <StarRating rating={review.rating} />
                            <span className="text-ivory-subtle">
                              {new Date(review.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-ivory-muted leading-relaxed">{review.comment}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
