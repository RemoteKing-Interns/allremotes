"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "../../context/AuthContext";
import { btn, tw } from "./tw";

const HelpSupport = () => {
  const { user } = useAuth();
  const userKey = useMemo(() => user?.id || user?.email || null, [user]);
  const ticketsKey = useMemo(() => (userKey ? `allremotes_support_tickets_${userKey}` : null), [userKey]);

  const [tickets, setTickets] = useState([]);

  const [showNewTicket, setShowNewTicket] = useState(false);
  const [ticketForm, setTicketForm] = useState({
    subject: '',
    category: 'general',
    message: ''
  });

  const faqs = [
    {
      question: 'How do I program my remote?',
      answer: 'Please refer to the instruction manual included with your remote or visit our support page for video tutorials.'
    },
    {
      question: 'What is your return policy?',
      answer: 'We offer a 30-day return policy on all products. Items must be in original condition.'
    },
    {
      question: 'Do you ship internationally?',
      answer: 'Yes, we ship worldwide. Shipping costs and delivery times vary by location.'
    }
  ];

  const handleSubmitTicket = (e) => {
    e.preventDefault();
    const subject = ticketForm.subject.trim();
    const message = ticketForm.message.trim();
    if (!subject || !message) return;
    const now = new Date().toISOString();
    const row = {
      id: `TKT-${Date.now()}`,
      subject,
      category: ticketForm.category,
      message,
      status: 'open',
      date: now,
      lastUpdate: now,
    };
    const next = [row, ...tickets];
    setTickets(next);
    if (ticketsKey) {
      try { localStorage.setItem(ticketsKey, JSON.stringify(next)); } catch {}
    }
    setTicketForm({ subject: '', category: 'general', message: '' });
    setShowNewTicket(false);
  };

  useEffect(() => {
    if (!ticketsKey) return;
    try {
      const raw = localStorage.getItem(ticketsKey);
      const parsed = raw ? JSON.parse(raw) : [];
      setTickets(Array.isArray(parsed) ? parsed : []);
    } catch {
      setTickets([]);
    }
  }, [ticketsKey]);

  return (
    <div className={tw.section}>
      <h2 className={tw.sectionTitle}>Help & Support</h2>
      
      <div className={tw.sectionContent}>
        <div className="grid gap-3">
          <div className={tw.sectionHeader}>
            <h3 className={tw.sectionH3}>Support Tickets</h3>
            <button 
              className={btn.gradientSm}
              onClick={() => setShowNewTicket(!showNewTicket)}
            >
              {showNewTicket ? 'Cancel' : '+ New Ticket'}
            </button>
          </div>

          {showNewTicket && (
            <form onSubmit={handleSubmitTicket} className={tw.form}>
              <div className={tw.formGroup}>
                <label className={tw.label}>Subject</label>
                <input
                  className={tw.input}
                  type="text"
                  value={ticketForm.subject}
                  onChange={(e) => setTicketForm({...ticketForm, subject: e.target.value})}
                  required
                />
              </div>
              <div className={tw.formGroup}>
                <label className={tw.label}>Category</label>
                <select
                  className={tw.input}
                  value={ticketForm.category}
                  onChange={(e) => setTicketForm({...ticketForm, category: e.target.value})}
                >
                  <option value="general">General Inquiry</option>
                  <option value="order">Order Issue</option>
                  <option value="product">Product Question</option>
                  <option value="technical">Technical Support</option>
                  <option value="return">Return/Refund</option>
                </select>
              </div>
              <div className={tw.formGroup}>
                <label className={tw.label}>Message</label>
                <textarea
                  className={tw.textarea}
                  rows="6"
                  value={ticketForm.message}
                  onChange={(e) => setTicketForm({...ticketForm, message: e.target.value})}
                  required
                />
              </div>
              <button type="submit" className={btn.secondary}>Submit Ticket</button>
            </form>
          )}

          {tickets.length === 0 ? (
            <div className={tw.emptyState}>
              <p>No support tickets</p>
            </div>
          ) : (
            <div className={tw.gridList}>
              {tickets.map(ticket => (
                <div key={ticket.id} className={tw.card}>
                  <div className={tw.cardHeader}>
                    <div>
                      <h4 className={tw.strongText}>{ticket.subject}</h4>
                      <p className={tw.muted}>Ticket #{ticket.id}</p>
                    </div>
                    <span className={`${tw.badgeStatus} ${ticket.status === "open" ? tw.badgePending : ticket.status === "resolved" ? tw.badgeDelivered : ticket.status === "closed" ? tw.badgeCancelled : ""}`}>
                      {ticket.status}
                    </span>
                  </div>
                  <div className="mt-2 grid gap-1 text-xs text-neutral-500">
                    <p>Created: {new Date(ticket.date).toLocaleDateString()}</p>
                    <p>Last Update: {new Date(ticket.lastUpdate).toLocaleDateString()}</p>
                  </div>
                  <button className={`${btn.outlineSm} mt-3`} type="button" disabled title="Ticket threads coming soon">
                    View Details
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={tw.divider}></div>

        <div className="grid gap-3">
          <h3 className={tw.sectionH3}>Frequently Asked Questions</h3>
          <div className={tw.gridList}>
            {faqs.map((faq, idx) => (
              <div key={idx} className={tw.card}>
                <h4 className="text-sm font-bold text-neutral-900">{faq.question}</h4>
                <p className="mt-1 text-sm text-neutral-700">{faq.answer}</p>
              </div>
            ))}
          </div>
          <Link href="/support" className={btn.gradient}>
            View All FAQs
          </Link>
        </div>

        <div className={tw.divider}></div>

        <div className="grid gap-3">
          <h3 className={tw.sectionH3}>Contact Support</h3>
          <div className="grid gap-3 md:grid-cols-3">
            <div className={`${tw.card} flex flex-col items-center text-center`}>
              <div className="mb-2 flex items-center justify-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
                </div>
                <h4 className="text-sm font-bold text-neutral-900">Email Support</h4>
              </div>
              <p className="text-sm text-neutral-700">support@allremotes.com</p>
              <p className="text-xs text-neutral-500">Response within 24 hours</p>
            </div>
            <div className={`${tw.card} flex flex-col items-center text-center`}>
              <div className="mb-2 flex items-center justify-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                  </svg>
                </div>
                <h4 className="text-sm font-bold text-neutral-900">Phone Support</h4>
              </div>
              <p className="text-sm text-neutral-700">1-800-REMOTES</p>
              <p className="text-xs text-neutral-500">Mon-Fri, 9 AM - 5 PM EST</p>
            </div>
            <div className={`${tw.card} flex flex-col items-center text-center`}>
              <div className="mb-2 flex items-center justify-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                  </svg>
                </div>
                <h4 className="text-sm font-bold text-neutral-900">Live Chat</h4>
              </div>
              <Link href="/contact" className={`${btn.gradient} mt-1 min-w-[10.5rem] justify-center`}>
                Start Chat
              </Link>
              <p className="mt-2 text-xs text-neutral-500">Available now</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpSupport;
