import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Send, AlertTriangle, ShieldAlert, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import api from '@/services/api';
import { io } from 'socket.io-client';

// ── Helper: format timestamp ──────────────────────────────────────────────────
function formatTime(date) {
  return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// ── Single message bubble ─────────────────────────────────────────────────────
function MessageBubble({ msg, currentUserId }) {
  const isMine = msg.sender?._id === currentUserId || msg.sender === currentUserId;

  return (
    <div className={`flex gap-2.5 ${isMine ? 'flex-row-reverse' : 'flex-row'}`}>
      <Avatar className="w-7 h-7 shrink-0 mt-1">
        <AvatarFallback className="text-xs">
          {msg.sender?.companyName?.charAt(0) || msg.sender?.email?.charAt(0) || '?'}
        </AvatarFallback>
      </Avatar>

      <div className={`flex flex-col max-w-[72%] ${isMine ? 'items-end' : 'items-start'}`}>
        {/* Sender name */}
        <span className="text-[10px] text-ivory-subtle mb-0.5">
          {msg.sender?.companyName || msg.sender?.email || 'Unknown'}
        </span>

        {/* Bubble */}
        <div
          className={`rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed break-words ${
            isMine
              ? 'bg-gold-500/20 text-ivory rounded-tr-sm'
              : 'bg-white/8 text-ivory rounded-tl-sm'
          }`}
        >
          {/* Render content — highlight [removed] tags */}
          {msg.content.split(/(\[(?:contact|email|link|profile link) removed\])/gi).map((part, i) => {
            const isRemoved = /\[(?:contact|email|link|profile link) removed\]/i.test(part);
            return isRemoved ? (
              <span key={i}
                className="inline-flex items-center gap-1 text-xs bg-red-500/20 text-red-400 border border-red-500/30 rounded px-1.5 py-0.5 mx-0.5 font-mono">
                <ShieldAlert className="w-3 h-3" /> {part}
              </span>
            ) : part;
          })}
        </div>

        {/* Redaction warning */}
        {msg.wasRedacted && (
          <div className="flex items-center gap-1 mt-1 text-[10px] text-red-400">
            <AlertTriangle className="w-3 h-3" />
            Contact info was removed from this message
          </div>
        )}

        {/* Suspicious keyword flag (shown subtly to both parties) */}
        {!msg.wasRedacted && msg.flagSeverity === 'suspicious' && (
          <div className="flex items-center gap-1 mt-1 text-[10px] text-amber-400">
            <AlertTriangle className="w-3 h-3" />
            This message has been flagged for review
          </div>
        )}

        <span className="text-[10px] text-ivory-subtle/50 mt-1">
          {formatTime(msg.createdAt)}
        </span>
      </div>
    </div>
  );
}

// ── Main ProjectChat component ────────────────────────────────────────────────
export default function ProjectChat({ projectId, receiverId, currentUserId }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [platformWarning, setPlatformWarning] = useState(null);
  const bottomRef = useRef(null);
  const socketRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (!projectId || !currentUserId) return;

    // Load message history
    api.get(`/messages/${projectId}`)
      .then((res) => setMessages(res.data))
      .catch((err) => console.error('Chat load error:', err.message))
      .finally(() => setLoading(false));

    // Socket connection
    const token = localStorage.getItem('token');
    socketRef.current = io('http://localhost:5001', { auth: { token } });
    socketRef.current.emit('join_chat', projectId);

    // New message arrives
    socketRef.current.on('new_message', ({ message }) => {
      setMessages((prev) => {
        // Avoid duplicates
        if (prev.find((m) => m._id === message._id)) return prev;
        return [...prev, message];
      });
    });

    // Platform warning (from admin warning action)
    socketRef.current.on('platform_warning', (data) => {
      setPlatformWarning(data);
      setTimeout(() => setPlatformWarning(null), 10000);
    });

    return () => {
      socketRef.current?.emit('leave_chat', projectId);
      socketRef.current?.disconnect();
    };
  }, [projectId, currentUserId]);

  // Auto-scroll on new messages
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim() || sending) return;
    setSending(true);
    try {
      const res = await api.post('/messages', {
        projectId,
        receiverId,
        content: text.trim(),
      });
      // Optimistically add to UI (socket will also deliver, dedup handled above)
      setMessages((prev) => [...prev, res.data.message]);
      setText('');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to send message.');
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Platform warning banner */}
      {platformWarning && (
        <div className="mx-4 mt-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 flex items-start gap-2 text-xs">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <div className="font-bold text-amber-400 mb-0.5">{platformWarning.title}</div>
            <div className="text-ivory-subtle">{platformWarning.message}</div>
          </div>
        </div>
      )}

      {/* Message list */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 min-h-0">
        {loading ? (
          <div className="text-center text-ivory-subtle text-sm py-6">Loading messages…</div>
        ) : messages.length === 0 ? (
          <div className="text-center text-ivory-subtle py-10">
            <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-20" />
            <p className="text-sm">No messages yet. Start the conversation!</p>
            <p className="text-xs mt-2 text-ivory-subtle/60">
              All messages are monitored. Do not share contact info outside the platform.
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <MessageBubble key={msg._id} msg={msg} currentUserId={currentUserId} />
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Platform policy reminder */}
      <div className="px-4 py-1.5 border-t border-white/5">
        <p className="text-[10px] text-ivory-subtle/40 text-center flex items-center justify-center gap-1">
          <ShieldAlert className="w-3 h-3" />
          Messages are monitored. Sharing contact info outside SoftBid violates our Terms of Service.
        </p>
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="px-4 pb-4 pt-2">
        <div className="flex gap-2 items-end">
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message… (Enter to send)"
            rows={2}
            className="resize-none text-sm flex-1"
            maxLength={2000}
          />
          <Button type="submit" disabled={!text.trim() || sending} size="icon" className="shrink-0 h-10 w-10">
            <Send className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex justify-end mt-1">
          <span className="text-[10px] text-ivory-subtle/40">{text.length}/2000</span>
        </div>
      </form>
    </div>
  );
}
