"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';

const ADMIN_EMAIL = 'admin@allremotes.com';

export default function AdminSupportChat({ orderId, returnId = null, customerEmail, customerName }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [chatUnavailable, setChatUnavailable] = useState(false);
  const [sending, setSending] = useState(false);
  const [threadId, setThreadId] = useState(null);
  const [customerOnline, setCustomerOnline] = useState(false);
  const [customerTyping, setCustomerTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const threadIdRef = useRef(null);

  useEffect(() => { threadIdRef.current = threadId; }, [threadId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadMessages = useCallback(async () => {
    if (!customerEmail) return;
    try {
      const params = new URLSearchParams();
      params.append('customerEmail', customerEmail);
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
  }, [customerEmail, orderId, returnId]);

  // Poll messages every 3s
  useEffect(() => {
    loadMessages();
    const interval = setInterval(loadMessages, 3000);
    return () => clearInterval(interval);
  }, [loadMessages]);

  useEffect(() => { scrollToBottom(); }, [messages, customerTyping]);

  // Admin presence heartbeat — mark admin as online
  useEffect(() => {
    const ping = () => fetch('/api/presence', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: ADMIN_EMAIL }),
    }).catch(() => {});
    ping();
    const interval = setInterval(ping, 15000);
    return () => clearInterval(interval);
  }, []);

  // Poll customer online status every 10s
  useEffect(() => {
    if (!customerEmail) return;
    const checkOnline = async () => {
      try {
        const resp = await fetch(`/api/presence?email=${encodeURIComponent(customerEmail)}`, { cache: 'no-store' });
        const data = await resp.json().catch(() => null);
        setCustomerOnline(resp.ok && data?.online === true);
      } catch { setCustomerOnline(false); }
    };
    checkOnline();
    const interval = setInterval(checkOnline, 10000);
    return () => clearInterval(interval);
  }, [customerEmail]);

  // Poll customer typing indicator every 2s
  useEffect(() => {
    const checkTyping = async () => {
      const tid = threadIdRef.current;
      if (!tid) return;
      try {
        const resp = await fetch(`/api/support-chat/typing?threadId=${tid}`, { cache: 'no-store' });
        const data = await resp.json().catch(() => null);
        setCustomerTyping(resp.ok && data?.typing?.sender === 'customer');
      } catch { setCustomerTyping(false); }
    };
    const interval = setInterval(checkTyping, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleTyping = () => {
    const tid = threadIdRef.current;
    if (!tid) return;
    if (typingTimeoutRef.current) return;
    fetch('/api/support-chat/typing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ threadId: tid, sender: 'admin' }),
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
          customerEmail,
          customerName: customerName || '',
          sender: 'admin',
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
      <div className="mt-4 rounded-lg border border-neutral-200 bg-white p-4">
        <p className="text-sm text-neutral-500">Loading chat...</p>
      </div>
    );
  }

  if (chatUnavailable) {
    return (
      <div className="mt-4 rounded-lg border border-neutral-200 bg-neutral-50 p-4 text-center">
        <p className="text-sm text-neutral-500">Live chat requires MongoDB. Not available in file-based mode.</p>
      </div>
    );
  }

  const lastAdminMsgIdx = [...messages].reverse().findIndex(m => m.sender === 'admin');
  const lastAdminMsg = lastAdminMsgIdx >= 0 ? messages[messages.length - 1 - lastAdminMsgIdx] : null;

  return (
    <div className="mt-4 rounded-lg border border-neutral-200 bg-white overflow-hidden">
      {/* Header */}
      <div className="border-b border-neutral-200 bg-neutral-50 px-4 py-3 flex items-center justify-between">
        <div>
          <h4 className="text-sm font-semibold text-neutral-900">Support Chat</h4>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className={`inline-block h-2 w-2 rounded-full ${customerOnline ? 'bg-emerald-500 animate-pulse' : 'bg-neutral-300'}`} />
            <p className="text-xs text-neutral-500">
              {customerOnline
                ? `${customerName || customerEmail} is online`
                : `${customerName || customerEmail} is offline`}
            </p>
          </div>
        </div>
        {customerTyping && (
          <span className="text-xs text-neutral-400 italic">typing…</span>
        )}
      </div>

      {/* Messages */}
      <div className="h-72 overflow-y-auto p-4 space-y-3 bg-white">
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-neutral-500">No messages yet. Start a conversation.</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isLastAdmin = msg === lastAdminMsg;
            return (
              <div key={msg.id} className={`flex flex-col ${msg.sender === 'admin' ? 'items-end' : 'items-start'}`}>
                {msg.sender !== 'admin' && (
                  <span className="text-[10px] text-neutral-400 px-1 mb-0.5">
                    {customerName || customerEmail}
                  </span>
                )}
                <div className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                  msg.sender === 'admin'
                    ? 'bg-blue-600 text-white rounded-br-sm'
                    : 'bg-neutral-100 text-neutral-900 rounded-bl-sm'
                }`}>
                  <p className="text-sm">{msg.message}</p>
                </div>
                <div className="flex items-center gap-1 mt-0.5 px-1">
                  <span className="text-[10px] text-neutral-400">
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {msg.sender === 'admin' && isLastAdmin && (
                    <span className={`text-[10px] ${customerOnline ? 'text-emerald-500' : 'text-neutral-400'}`}>
                      · {customerOnline ? 'Seen' : 'Delivered'}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}

        {/* Customer typing indicator */}
        {customerTyping && (
          <div className="flex items-start gap-2">
            <div className="bg-neutral-100 rounded-2xl rounded-bl-sm px-4 py-2">
              <div className="flex gap-1 items-center h-4">
                <span className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
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
            placeholder="Reply to customer..."
            className="flex-1 rounded-full border border-neutral-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none"
            disabled={sending}
          />
          <button
            type="submit"
            disabled={sending || !newMessage.trim()}
            className="rounded-full bg-blue-600 text-white px-4 py-2 text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {sending ? '…' : 'Send'}
          </button>
        </div>
      </form>
    </div>
  );
}
