import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Zap, Mail, Lock, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import api from '@/services/api';

export default function Signin() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.email || !form.password) { setError('Please provide both email and password.'); return; }
    setLoading(true);
    try {
      const res = await api.post('/auth/login', form);
      const data = res.data;
      localStorage.setItem('token', data.token);
      if (data.role === 'provider')  navigate(`/provider/${data._id}`);
      else if (data.role === 'client') navigate('/client/dashboard');
      else if (data.role === 'admin')  navigate('/admin/dashboard');
      else navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-luxury-950 bg-hero-glow flex flex-col font-sans">
      {/* Top bar */}
      <div className="flex justify-between items-center px-8 py-5 border-b border-white/5">
        <Link to="/" className="flex items-center gap-2.5 no-underline group">
          <div className="w-8 h-8 rounded-lg bg-gold-gradient flex items-center justify-center shadow-gold-sm group-hover:shadow-gold transition-all">
            <Zap className="w-4 h-4 text-luxury-950" strokeWidth={2.5} />
          </div>
          <span className="text-gold-shimmer text-lg font-bold">SoftBid</span>
        </Link>
        <span className="text-sm text-ivory-subtle">
          Don't have an account?{' '}
          <Link to="/signup" className="text-gold-400 font-semibold hover:text-gold-300 no-underline transition-colors">
            Sign Up
          </Link>
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <Card className="border-gold-500/10 shadow-gold">
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-2xl font-black tracking-tight">Welcome back</CardTitle>
              <CardDescription>Sign in to your SoftBid account</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              {error && (
                <div className="mb-5 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                  {error}
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label>Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ivory-subtle" />
                    <Input
                      type="email"
                      placeholder="you@example.com"
                      className="pl-10"
                      value={form.email}
                      onChange={set('email')}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ivory-subtle" />
                    <Input
                      type={showPass ? 'text' : 'password'}
                      placeholder="••••••••"
                      className="pl-10 pr-10"
                      value={form.password}
                      onChange={set('password')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-ivory-subtle hover:text-ivory"
                    >
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex justify-end">
                  <span className="text-xs text-gold-500/70 hover:text-gold-400 cursor-pointer transition-colors">
                    Forgot password?
                  </span>
                </div>

                <Button type="submit" className="w-full" size="lg" disabled={loading}>
                  {loading ? 'Signing in...' : (<>Sign In <ArrowRight className="ml-2 w-4 h-4" /></>)}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
