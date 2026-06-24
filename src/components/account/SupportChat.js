"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { btn } from './tw';

export default function SupportChat({ orderId, returnId }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [chatUnavailable, setChatUnavailable] = useState(false);
  const [sending, setSending] = useState(false);
  const [threadId, setThreadId] = useState(null);
  const [adminTyping, setAdminTyping] = useState(false);
  const [adminOnline, setAdminOnline] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const threadIdRef = useRef(null);

  const email = user?.email || '';

  // Keep threadIdRef in sync so intervals can access latest value
  useEffect(() => { threadIdRef.current = threadId; }, [threadId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadMessages = useCallback(async () => {
    if (!email) return;
    try {
      const params = new URLSearchParams();
      params.append('customerEmail', email);
      if (orderId) params.append('orderId', orderId);
      if (returnId) params.append('returnId', returnId);

      const resp = await fetch(`/api/support-chat?${params.toString()}`, { cache: 'no-store' });
      const data = await resp.json().catch(() => null);

      if (!resp.ok) {
        setChatUnavailable(true);
        setLoading(false);
        return;
      }

      if (Array.isArray(data) && data.length > 0 && data[0].id) {
        const tid = data[0].id;
        setThreadId(tid);
        const msgResp = await fetch(`/api/support-chat?threadId=${tid}`, { cache: 'no-store' });
        const msgData = await msgResp.json().catch(() => null);
        if (msgResp.ok && Array.isArray(msgData)) {
          setMessages(msgData);
        }
      }
      setLoading(false);
    } catch (err) {
      console.error('Failed to load messages:', err);
      setLoading(false);
    }
  }, [email, orderId, returnId]);

  // Poll messages every 3s
  useEffect(() => {
    loadMessages();
    const interval = setInterval(loadMessages, 3000);
    return () => clearInterval(interval);
  }, [loadMessages]);

  useEffect(() => { scrollToBottom(); }, [messages, adminTyping]);

  // Presence heartbeat — ping every 15s so admin can see we're online
  useEffect(() => {
    if (!email) return;
    const ping = () => fetch('/api/presence', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    }).catch(() => {});
    ping();
    const interval = setInterval(ping, 15000);
    return () => clearInterval(interval);
  }, [email]);

  // Poll admin typing indicator every 2s
  useEffect(() => {
    const checkTyping = async () => {
      const tid = threadIdRef.current;
      if (!tid) return;
      try {
        const resp = await fetch(`/api/support-chat/typing?threadId=${tid}`, { cache: 'no-store' });
        const data = await resp.json().catch(() => null);
        setAdminTyping(resp.ok && data?.typing?.sender === 'admin');
      } catch { setAdminTyping(false); }
    };
    const interval = setInterval(checkTyping, 2000);
    return () => clearInterval(interval);
  }, []);

  // Poll admin online status every 10s
  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL || '';
        const resp = await fetch(`/api/presence?email=${encodeURIComponent(adminEmail)}`, { cache: 'no-store' });
        const data = await resp.json().catch(() => null);
        setAdminOnline(resp.ok && data?.online === true);
      } catch { setAdminOnline(false); }
    };
    checkAdmin();
    const interval = setInterval(checkAdmin, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleTyping = () => {
    const tid = threadIdRef.current;
    if (!tid) return;
    // Debounce: send typing event at most every 3s
    if (typingTimeoutRef.current) return;
    fetch('/api/support-chat/typing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ threadId: tid, sender: 'customer' }),
    }).catch(() => {});
    typingTimeoutRef.current = setTimeout(() => { typingTimeoutRef.current = null; }, 3000);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      const resp = await fetch('/api/support-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          returnId,
          customerEmail: email,
          customerName: user?.name || '',
          sender: 'customer',
          message: newMessage.trim(),
          threadId,
        })
      });

      const data = await resp.json().catch(() => null);
      if (!resp.ok) throw new Error(data?.error || 'Failed to send message');

      setThreadId(data.thread.id);
      setNewMessage('');
      await loadMessages();
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-neutral-200 bg-white p-4">
        <p className="text-sm text-neutral-500">Loading chat...</p>
      </div>
    );
  }

  if (chatUnavailable) {
    return (
      <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 text-center">
        <p className="text-sm text-neutral-500">Live chat is unavailable. Please contact support via email.</p>
      </div>
    );
  }

  const lastCustomerMsgIdx = [...messages].reverse().findIndex(m => m.sender === 'customer');
  const lastCustomerMsg = lastCustomerMsgIdx >= 0 ? messages[messages.length - 1 - lastCustomerMsgIdx] : null;

  return (
    <div className="rounded-xl border border-neutral-200 bg-white overflow-hidden">
      {/* Header with online status */}
      <div className="border-b border-neutral-200 bg-neutral-50 px-4 py-3 flex items-center justify-between">
        <div>
          <h4 className="text-sm font-semibold text-neutral-900">
            {returnId ? 'Return Support Chat' : 'Order Support Chat'}
          </h4>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className={`inline-block h-2 w-2 rounded-full ${adminOnline ? 'bg-emerald-500 animate-pulse' : 'bg-neutral-300'}`} />
            <p className="text-xs text-neutral-500">
              {adminOnline ? 'Support is online' : 'Support is offline'}
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="h-80 overflow-y-auto p-4 space-y-3 bg-white">
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-neutral-500">No messages yet. Start a conversation with our support team.</p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isLast = msg === lastCustomerMsg;
            return (
              <div key={msg.id} className={`flex flex-col ${msg.sender === 'customer' ? 'items-end' : 'items-start'}`}>
                <div className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                  msg.sender === 'customer' ? 'bg-accent text-white rounded-br-sm' : 'bg-neutral-100 text-neutral-900 rounded-bl-sm'
                }`}>
                  <p className="text-sm">{msg.message}</p>
                </div>
                <div className="flex items-center gap-1 mt-0.5 px-1">
                  <span className={`text-[10px] ${msg.sender === 'customer' ? 'text-neutral-400' : 'text-neutral-400'}`}>
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {msg.sender === 'customer' && isLast && (
                    <span className="text-[10px] text-neutral-400">· Delivered</span>
                  )}
                </div>
              </div>
            );
          })
        )}

        {/* Admin typing indicator */}
        {adminTyping && (
          <div className="flex items-start gap-2">
            <div className="bg-neutral-100 rounded-2xl rounded-bl-sm px-4 py-2">
              <div className="flex gap-1 items-center h-4">
                <span className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
            <span className="text-[10px] text-neutral-400 mt-3">Support is typing…</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSendMessage} className="border-t border-neutral-200 p-3 bg-neutral-50">
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => { setNewMessage(e.target.value); handleTyping(); }}
            placeholder="Type your message..."
            className="flex-1 rounded-full border border-neutral-300 px-4 py-2 text-sm focus:border-accent focus:outline-none"
            disabled={sending}
          />
          <button
            type="submit"
            disabled={sending || !newMessage.trim()}
            className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 hover:bg-accent/90 transition-colors"
          >
            {sending ? '…' : 'Send'}
          </button>
        </div>
      </form>
    </div>
  );
}
