import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Zap, LayoutDashboard, LogOut, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const NAV_LINKS = [
  { label: 'Home', to: '/' },
  { label: 'Post a Project', to: '/post-project' },
  { label: 'Providers', to: '/providers' },
];

export default function Navbar() {
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll);
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUserRole(payload.role);
      } catch { /* ignore */ }
    }
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUserRole(null);
    window.location.href = '/';
  };

  const getDashboardLink = () => {
    if (userRole === 'admin') return '/admin/dashboard';
    if (userRole === 'client') return '/client/dashboard';
    return '/provider/dashboard';
  };

  return (
    <nav
      className={cn(
        'sticky top-0 z-50 transition-all duration-300',
        scrolled
          ? 'bg-luxury-950/95 backdrop-blur-xl border-b border-gold-500/15 shadow-[0_4px_32px_rgba(0,0,0,0.6)]'
          : 'bg-luxury-950/80 backdrop-blur-lg border-b border-white/5'
      )}
    >
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group no-underline">
            <div className="w-8 h-8 rounded-lg bg-gold-gradient flex items-center justify-center shadow-gold-sm group-hover:shadow-gold transition-all duration-200">
              <Zap className="w-4 h-4 text-luxury-950" strokeWidth={2.5} />
            </div>
            <span className="text-gold-shimmer text-lg font-bold tracking-tight">SoftBid</span>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map(({ label, to }) => (
              <Link
                key={to}
                to={to}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 no-underline',
                  isActive(to)
                    ? 'text-gold-400 bg-gold-500/10'
                    : 'text-ivory-subtle hover:text-ivory hover:bg-luxury-800'
                )}
              >
                {label}
              </Link>
            ))}
          </div>

          {/* Auth buttons */}
          <div className="hidden md:flex items-center gap-2">
            {userRole ? (
              <>
                <Button variant="secondary" size="sm" asChild>
                  <Link to={getDashboardLink()}>
                    <LayoutDashboard className="w-4 h-4 mr-1.5" />
                    Dashboard
                  </Link>
                </Button>
                <Button variant="destructive" size="sm" onClick={handleLogout}>
                  <LogOut className="w-4 h-4 mr-1.5" />
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/signin">Sign In</Link>
                </Button>
                <Button size="sm" asChild>
                  <Link to="/signup">Get Started</Link>
                </Button>
              </>
            )}
          </div>

          {/* Hamburger */}
          <button
            className="md:hidden p-2 rounded-lg border border-white/10 text-ivory-subtle hover:text-ivory hover:bg-luxury-800 transition-colors"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-white/5 bg-luxury-950 px-6 py-4 flex flex-col gap-2 animate-fade-up">
          {NAV_LINKS.map(({ label, to }) => (
            <Link
              key={to}
              to={to}
              onClick={() => setMenuOpen(false)}
              className={cn(
                'px-4 py-2.5 rounded-lg text-sm font-medium transition-colors no-underline',
                isActive(to) ? 'text-gold-400 bg-gold-500/10' : 'text-ivory-subtle hover:text-ivory hover:bg-luxury-800'
              )}
            >
              {label}
            </Link>
          ))}
          <div className="flex gap-2 mt-2">
            {userRole ? (
              <>
                <Button variant="secondary" size="sm" className="flex-1" asChild>
                  <Link to={getDashboardLink()} onClick={() => setMenuOpen(false)}>Dashboard</Link>
                </Button>
                <Button variant="destructive" size="sm" className="flex-1" onClick={() => { handleLogout(); setMenuOpen(false); }}>
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" size="sm" className="flex-1" asChild>
                  <Link to="/signin" onClick={() => setMenuOpen(false)}>Sign In</Link>
                </Button>
                <Button size="sm" className="flex-1" asChild>
                  <Link to="/signup" onClick={() => setMenuOpen(false)}>Get Started</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}