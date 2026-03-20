"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { btn, tw } from './tw';

const ReviewsInteractions = () => {
  const { user } = useAuth();
  const userKey = useMemo(() => user?.id || user?.email || null, [user]);
  const reviewsKey = useMemo(() => (userKey ? `allremotes_user_reviews_${userKey}` : null), [userKey]);
  const questionsKey = useMemo(() => (userKey ? `allremotes_user_questions_${userKey}` : null), [userKey]);

  const [reviews, setReviews] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [newReview, setNewReview] = useState({ productName: '', rating: 5, review: '' });
  const [newQuestion, setNewQuestion] = useState({ productName: '', question: '' });

  const persist = (key, value) => {
    if (!key) return;
    try { localStorage.setItem(key, JSON.stringify(value || [])); } catch {}
  };

  useEffect(() => {
    if (!reviewsKey) return;
    try {
      const raw = localStorage.getItem(reviewsKey);
      const parsed = raw ? JSON.parse(raw) : [];
      setReviews(Array.isArray(parsed) ? parsed : []);
    } catch {
      setReviews([]);
    }
  }, [reviewsKey]);

  useEffect(() => {
    if (!questionsKey) return;
    try {
      const raw = localStorage.getItem(questionsKey);
      const parsed = raw ? JSON.parse(raw) : [];
      setQuestions(Array.isArray(parsed) ? parsed : []);
    } catch {
      setQuestions([]);
    }
  }, [questionsKey]);

  const submitReview = (e) => {
    e.preventDefault();
    const productName = newReview.productName.trim();
    const reviewText = newReview.review.trim();
    if (!productName || !reviewText) return;
    const row = {
      id: Date.now(),
      productName,
      rating: Math.max(1, Math.min(5, Number(newReview.rating) || 5)),
      review: reviewText,
      date: new Date().toISOString(),
      helpful: 0,
    };
    const next = [row, ...reviews];
    setReviews(next);
    persist(reviewsKey, next);
    setNewReview({ productName: '', rating: 5, review: '' });
  };

  const deleteReview = (id) => {
    const next = reviews.filter((r) => r.id !== id);
    setReviews(next);
    persist(reviewsKey, next);
  };

  const submitQuestion = (e) => {
    e.preventDefault();
    const productName = newQuestion.productName.trim();
    const questionText = newQuestion.question.trim();
    if (!productName || !questionText) return;
    const row = {
      id: Date.now(),
      productName,
      question: questionText,
      answer: '',
      date: new Date().toISOString(),
    };
    const next = [row, ...questions];
    setQuestions(next);
    persist(questionsKey, next);
    setNewQuestion({ productName: '', question: '' });
  };

  return (
    <div className={tw.section}>
      <h2 className={tw.sectionTitle}>Reviews & Interactions</h2>
      
      <div className={tw.sectionContent}>
        <div className="grid gap-3">
          <h3 className={tw.sectionH3}>Reviews You've Written</h3>

          <form onSubmit={submitReview} className={tw.formSpaced}>
            <div className={tw.formRow2}>
              <div className={tw.formGroup}>
                <label className={tw.label}>Product</label>
                <input
                  className={tw.input}
                  value={newReview.productName}
                  onChange={(e) => setNewReview({ ...newReview, productName: e.target.value })}
                  placeholder="Product name"
                />
              </div>
              <div className={`${tw.formGroup} md:max-w-40`}>
                <label className={tw.label}>Rating</label>
                <select
                  className={tw.input}
                  value={newReview.rating}
                  onChange={(e) => setNewReview({ ...newReview, rating: Number(e.target.value) })}
                >
                  <option value={5}>5</option>
                  <option value={4}>4</option>
                  <option value={3}>3</option>
                  <option value={2}>2</option>
                  <option value={1}>1</option>
                </select>
              </div>
            </div>
            <div className={tw.formGroup}>
              <label className={tw.label}>Review</label>
              <textarea
                className={tw.textarea}
                rows="3"
                value={newReview.review}
                onChange={(e) => setNewReview({ ...newReview, review: e.target.value })}
                placeholder="Write your review…"
              />
            </div>
            <button type="submit" className={btn.secondary} disabled={!newReview.productName.trim() || !newReview.review.trim()}>
              Submit Review
            </button>
          </form>
          
          {reviews.length === 0 ? (
            <div className={tw.emptyState}>
              <p>You haven't written any reviews yet</p>
            </div>
          ) : (
            <div className={tw.gridList}>
              {reviews.map(review => (
                <div key={review.id} className={tw.card}>
                  <div className={tw.cardHeader}>
                    <h4 className={tw.strongText}>{review.productName}</h4>
                    <div className="inline-flex items-center gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <span
                          key={i}
                          className={i < review.rating ? "text-base text-amber-500" : "text-base text-neutral-300"}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                  </div>
                  <p className="mt-2 text-sm text-neutral-700">{review.review}</p>
                  <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
                    <span className="text-xs text-neutral-500">{new Date(review.date).toLocaleDateString()}</span>
                    <span className="text-xs text-neutral-500">{review.helpful} people found this helpful</span>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <button className={btn.outlineSm} type="button" disabled title="Editing coming soon">Edit</button>
                    <button className={btn.outlineDangerSm} type="button" onClick={() => deleteReview(review.id)}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={tw.divider}></div>

        <div className="grid gap-3">
          <h3 className={tw.sectionH3}>Questions & Answers</h3>

          <form onSubmit={submitQuestion} className={tw.formSpaced}>
            <div className={tw.formRow2}>
              <div className={tw.formGroup}>
                <label className={tw.label}>Product</label>
                <input
                  className={tw.input}
                  value={newQuestion.productName}
                  onChange={(e) => setNewQuestion({ ...newQuestion, productName: e.target.value })}
                  placeholder="Product name"
                />
              </div>
            </div>
            <div className={tw.formGroup}>
              <label className={tw.label}>Question</label>
              <textarea
                className={tw.textarea}
                rows="3"
                value={newQuestion.question}
                onChange={(e) => setNewQuestion({ ...newQuestion, question: e.target.value })}
                placeholder="Ask a question…"
              />
            </div>
            <button type="submit" className={btn.secondary} disabled={!newQuestion.productName.trim() || !newQuestion.question.trim()}>
              Submit Question
            </button>
          </form>
          
          {questions.length === 0 ? (
            <div className={tw.emptyState}>
              <p>You haven't asked or answered any questions yet</p>
            </div>
          ) : (
            <div className={tw.gridList}>
              {questions.map(q => (
                <div key={q.id} className={tw.card}>
                  <h4 className={tw.strongText}>{q.productName}</h4>
                  <div className="mt-2 flex items-start gap-2 rounded-lg bg-neutral-50 px-3 py-2 text-sm">
                    <p className="w-5 shrink-0 font-bold text-neutral-700">Q:</p>
                    <p className="text-neutral-700">{q.question}</p>
                  </div>
                  <div className="mt-2 flex items-start gap-2 rounded-lg bg-neutral-50 px-3 py-2 text-sm">
                    <p className="w-5 shrink-0 font-bold text-neutral-700">A:</p>
                    <p className="text-neutral-700">{q.answer || 'No answer yet'}</p>
                  </div>
                  <span className="mt-2 inline-block text-xs text-neutral-500">{new Date(q.date).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReviewsInteractions;
