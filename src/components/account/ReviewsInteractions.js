import React, { useState } from 'react';
import './AccountSection.css';

const ReviewsInteractions = () => {
  const [reviews] = useState([
    {
      id: 1,
      productName: 'Universal Car Remote Key Fob',
      rating: 5,
      review: 'Great product! Works perfectly with my car.',
      date: '2026-01-20',
      helpful: 3
    },
    {
      id: 2,
      productName: 'Smart Garage Remote',
      rating: 4,
      review: 'Good quality, easy to program.',
      date: '2026-01-15',
      helpful: 1
    }
  ]);

  const [questions] = useState([
    {
      id: 1,
      productName: 'Premium Car Remote Control',
      question: 'Does this work with Toyota?',
      answer: 'Yes, this remote is compatible with most Toyota models.',
      date: '2026-01-18'
    }
  ]);

  return (
    <div className="account-section">
      <h2>Reviews & Interactions</h2>
      
      <div className="section-content">
        <div className="reviews-section">
          <h3>Reviews You've Written</h3>
          
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
                    <button className="btn btn-outline btn-small">Edit</button>
                    <button className="btn btn-outline-red btn-small">Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="section-divider"></div>

        <div className="questions-section">
          <h3>Questions & Answers</h3>
          
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
                    <p className="answer-text">{q.answer}</p>
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
