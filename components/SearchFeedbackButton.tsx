// components/SearchFeedbackButton.tsx
import React, { useState } from 'react';
import { MessageSquare, X } from 'lucide-react';

interface SearchFeedbackButtonProps {
  searchQuery: string;
  resultCount: number;
  onFeedbackSubmit?: (feedback: string) => void;
}

export const SearchFeedbackButton: React.FC<SearchFeedbackButtonProps> = ({ 
  searchQuery, 
  resultCount,
  onFeedbackSubmit 
}) => {
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!feedback.trim()) return;

    try {
      // Store feedback in localStorage for now (can be sent to database later)
      const feedbackData = {
        searchQuery,
        resultCount,
        feedback: feedback.trim(),
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent
      };

      // Get existing feedback or create new array
      const existingFeedback = JSON.parse(localStorage.getItem('searchFeedback') || '[]');
      existingFeedback.push(feedbackData);
      localStorage.setItem('searchFeedback', JSON.stringify(existingFeedback));

      // Log to console for debugging
      console.log('Search Feedback:', feedbackData);

      // Call parent callback if provided
      if (onFeedbackSubmit) {
        onFeedbackSubmit(feedback);
      }

      setSubmitted(true);
      setTimeout(() => {
        setShowFeedback(false);
        setFeedback('');
        setSubmitted(false);
      }, 2000);
    } catch (error) {
      console.error('Error saving feedback:', error);
    }
  };

  if (submitted) {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-100 text-green-700 rounded-md text-sm">
        <span>✓ Feedback submitted!</span>
      </div>
    );
  }

  if (showFeedback) {
    return (
      <div className="inline-flex items-center gap-2 bg-white border border-gray-300 rounded-lg p-2">
        <input
          type="text"
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="What were you looking for?"
          className="px-2 py-1 text-sm border-none outline-none min-w-[200px]"
          autoFocus
          onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
        />
        <button
          onClick={handleSubmit}
          className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
          disabled={!feedback.trim()}
        >
          Send
        </button>
        <button
          onClick={() => setShowFeedback(false)}
          className="p-1 text-gray-500 hover:text-gray-700"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setShowFeedback(true)}
      className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md text-sm transition-colors"
      title="Report search issue"
    >
      <MessageSquare className="w-4 h-4" />
      <span>Report Issue</span>
    </button>
  );
};