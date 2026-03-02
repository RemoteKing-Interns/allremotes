"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';

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
    <div className="account-section">
      <h2>Reviews & Interactions</h2>
      
      <div className="section-content">
        <div className="reviews-section">
          <h3>Reviews You've Written</h3>

          <form onSubmit={submitReview} className="account-form" style={{ marginBottom: 16 }}>
            <div className="form-row">
              <div className="form-group" style={{ flex: 1 }}>
                <label>Product</label>
                <input
                  value={newReview.productName}
                  onChange={(e) => setNewReview({ ...newReview, productName: e.target.value })}
                  placeholder="Product name"
                />
              </div>
              <div className="form-group" style={{ width: 160 }}>
                <label>Rating</label>
                <select
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
            <div className="form-group">
              <label>Review</label>
              <textarea
                rows="3"
                value={newReview.review}
                onChange={(e) => setNewReview({ ...newReview, review: e.target.value })}
                placeholder="Write your review…"
              />
            </div>
            <button type="submit" className="btn btn-secondary" disabled={!newReview.productName.trim() || !newReview.review.trim()}>
              Submit Review
            </button>
          </form>
          
          {reviews.length === 0 ? (
            <div className="empty-state">
              <p>You haven't written any reviews yet</p>
            </div>
          ) : (
            <div className="reviews-list">
              {reviews.map(review => (
                <div key={review.id} className="review-card">
                  <div className="review-header">
                    <h4>{review.productName}</h4>
                    <div className="review-rating">
                      {[...Array(5)].map((_, i) => (
                        <span key={i} style={{ color: i < review.rating ? '#ffc107' : '#ddd' }}>
                          ★
                        </span>
                      ))}
                    </div>
                  </div>
                  <p className="review-text">{review.review}</p>
                  <div className="review-footer">
                    <span className="review-date">{new Date(review.date).toLocaleDateString()}</span>
                    <span className="review-helpful">{review.helpful} people found this helpful</span>
                  </div>
                  <div className="review-actions">
                    <button className="btn btn-outline btn-small" type="button" disabled title="Editing coming soon">Edit</button>
                    <button className="btn btn-outline-red btn-small" type="button" onClick={() => deleteReview(review.id)}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="section-divider"></div>

        <div className="questions-section">
          <h3>Questions & Answers</h3>

          <form onSubmit={submitQuestion} className="account-form" style={{ marginBottom: 16 }}>
            <div className="form-row">
              <div className="form-group" style={{ flex: 1 }}>
                <label>Product</label>
                <input
                  value={newQuestion.productName}
                  onChange={(e) => setNewQuestion({ ...newQuestion, productName: e.target.value })}
                  placeholder="Product name"
                />
              </div>
            </div>
            <div className="form-group">
              <label>Question</label>
              <textarea
                rows="3"
                value={newQuestion.question}
                onChange={(e) => setNewQuestion({ ...newQuestion, question: e.target.value })}
                placeholder="Ask a question…"
              />
            </div>
            <button type="submit" className="btn btn-secondary" disabled={!newQuestion.productName.trim() || !newQuestion.question.trim()}>
              Submit Question
            </button>
          </form>
          
          {questions.length === 0 ? (
            <div className="empty-state">
              <p>You haven't asked or answered any questions yet</p>
            </div>
          ) : (
            <div className="questions-list">
              {questions.map(q => (
                <div key={q.id} className="question-card">
                  <h4>{q.productName}</h4>
                  <div className="question-item">
                    <p className="question-label">Q:</p>
                    <p className="question-text">{q.question}</p>
                  </div>
                  <div className="question-item">
                    <p className="answer-label">A:</p>
                    <p className="answer-text">{q.answer || 'No answer yet'}</p>
                  </div>
                  <span className="question-date">{new Date(q.date).toLocaleDateString()}</span>
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
