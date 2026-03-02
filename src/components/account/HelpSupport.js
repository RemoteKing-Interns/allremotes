"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "../../context/AuthContext";

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
    <div className="account-section">
      <h2>Help & Support</h2>
      
      <div className="section-content">
        <div className="support-tickets-section">
          <div className="section-header">
            <h3>Support Tickets</h3>
            <button 
              className="btn btn-gradient btn-small"
              onClick={() => setShowNewTicket(!showNewTicket)}
            >
              {showNewTicket ? 'Cancel' : '+ New Ticket'}
            </button>
          </div>

          {showNewTicket && (
            <form onSubmit={handleSubmitTicket} className="account-form">
              <div className="form-group">
                <label>Subject</label>
                <input
                  type="text"
                  value={ticketForm.subject}
                  onChange={(e) => setTicketForm({...ticketForm, subject: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Category</label>
                <select
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
              <div className="form-group">
                <label>Message</label>
                <textarea
                  rows="6"
                  value={ticketForm.message}
                  onChange={(e) => setTicketForm({...ticketForm, message: e.target.value})}
                  required
                />
              </div>
              <button type="submit" className="btn btn-secondary">Submit Ticket</button>
            </form>
          )}

          {tickets.length === 0 ? (
            <div className="empty-state">
              <p>No support tickets</p>
            </div>
          ) : (
            <div className="tickets-list">
              {tickets.map(ticket => (
                <div key={ticket.id} className="ticket-card">
                  <div className="ticket-header">
                    <div>
                      <h4>{ticket.subject}</h4>
                      <p className="ticket-id">Ticket #{ticket.id}</p>
                    </div>
                    <span className={`ticket-status ${ticket.status}`}>
                      {ticket.status}
                    </span>
                  </div>
                  <div className="ticket-dates">
                    <p>Created: {new Date(ticket.date).toLocaleDateString()}</p>
                    <p>Last Update: {new Date(ticket.lastUpdate).toLocaleDateString()}</p>
                  </div>
                  <button className="btn btn-outline btn-small" type="button" disabled title="Ticket threads coming soon">
                    View Details
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="section-divider"></div>

        <div className="faq-section">
          <h3>Frequently Asked Questions</h3>
          <div className="faq-list">
            {faqs.map((faq, idx) => (
              <div key={idx} className="faq-item">
                <h4 className="faq-question">{faq.question}</h4>
                <p className="faq-answer">{faq.answer}</p>
              </div>
            ))}
          </div>
          <Link href="/support" className="btn btn-gradient">
            View All FAQs
          </Link>
        </div>

        <div className="section-divider"></div>

        <div className="contact-support-section">
          <h3>Contact Support</h3>
          <div className="contact-options">
            <div className="contact-option">
              <h4>📧 Email</h4>
              <p>support@allremotes.com</p>
              <p className="contact-time">Response within 24 hours</p>
            </div>
            <div className="contact-option">
              <h4>📞 Phone</h4>
              <p>1-800-REMOTES</p>
              <p className="contact-time">Mon-Fri, 9 AM - 5 PM EST</p>
            </div>
            <div className="contact-option">
              <h4>💬 Live Chat</h4>
              <button className="btn btn-gradient">Start Chat</button>
              <p className="contact-time">Available now</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpSupport;
