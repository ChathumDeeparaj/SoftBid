/**
 * GlobalSocketNotifier
 *
 * Mounts once at the App level. Listens for platform-wide socket events
 * (warnings, bans) and shows toast-style alerts regardless of which page the user is on.
 */
import React, { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { AlertTriangle, ShieldAlert, X } from 'lucide-react';

function Toast({ toast, onClose }) {
  useEffect(() => {
    const timer = setTimeout(() => onClose(toast.id), 10000);
    return () => clearTimeout(timer);
  }, [toast.id, onClose]);

  const isBan = toast.type === 'ban';

  return (
    <div
      className={`flex items-start gap-3 rounded-2xl border p-4 shadow-2xl backdrop-blur-md animate-slide-in-right
        ${isBan
          ? 'border-red-500/40 bg-red-950/80'
          : 'border-amber-500/40 bg-amber-950/80'
        }`}
      style={{ minWidth: '320px', maxWidth: '400px' }}
    >
      {isBan
        ? <ShieldAlert className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
        : <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
      }
      <div className="flex-1 text-sm">
        <div className={`font-bold mb-1 ${isBan ? 'text-red-400' : 'text-amber-400'}`}>
          {toast.title}
        </div>
        <div className="text-ivory-subtle leading-relaxed">{toast.message}</div>
      </div>
      {!isBan && (
        <button onClick={() => onClose(toast.id)} className="text-ivory-subtle/50 hover:text-ivory shrink-0">
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

export default function GlobalSocketNotifier() {
  const [toasts, setToasts] = useState([]);
  const socketRef = useRef(null);
  const toastId = useRef(0);

  const addToast = (data) => {
    const id = ++toastId.current;
    setToasts((prev) => [...prev, { ...data, id }]);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    socketRef.current = io('http://localhost:5001', { auth: { token } });

    // Admin warned this user for sharing contact info
    socketRef.current.on('platform_warning', (data) => {
      addToast({
        type: 'warning',
        title: '⚠️ Platform Warning',
        message: data.message || 'Your message was flagged for attempting to share contact information. Further violations may result in account suspension.',
      });
    });

    // Account banned
    socketRef.current.on('account_banned', (data) => {
      addToast({
        type: 'ban',
        title: '🚫 Account Suspended',
        message: data.message || 'Your account has been suspended for violating platform policies.',
      });
      // Force sign out after 5 seconds
      setTimeout(() => {
        localStorage.removeItem('token');
        window.location.href = '/signin';
      }, 5000);
    });

    return () => socketRef.current?.disconnect();
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3"
      style={{ pointerEvents: 'auto' }}
    >
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onClose={removeToast} />
      ))}
    </div>
  );
}
