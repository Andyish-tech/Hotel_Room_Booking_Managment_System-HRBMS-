import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { showSuccess, showError, showWarning } from '../utils/toast';
import { isRequired } from '../utils/validation';

const SecuritySettings = () => {
  const [existingQuestions, setExistingQuestions] = useState([]);
  const [questions, setQuestions] = useState([
    { question: '', answer: '' }
  ]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [questionErrors, setQuestionErrors] = useState({});
  const [questionTouched, setQuestionTouched] = useState({});

  const predefinedQuestions = [
    'What is your mother\'s maiden name?',
    'What was the name of your first pet?',
    'What city were you born in?',
    'What is your favorite book?',
    'What was the name of your first school?',
    'What is your favorite food?',
    'What is the name of your childhood best friend?',
    'What was the make and model of your first car?',
  ];

  useEffect(() => {
    fetchExistingQuestions();
  }, []);

  const fetchExistingQuestions = async () => {
    try {
      const response = await axios.get('/security/questions');
      const data = response.data.data || [];
      setExistingQuestions(data);

      if (data.length > 0) {
        // Pre-fill with existing questions (answers masked)
        setQuestions(data.map(q => ({
          secId: q.Sec_Id,
          question: q.question,
          answer: '',
          isExisting: true
        })));
      }
    } catch (error) {
      console.error('Failed to fetch security questions');
    } finally {
      setFetching(false);
    }
  };

  const handleQuestionBlur = (key) => {
    setQuestionTouched((prev) => ({ ...prev, [key]: true }));
  };

  const handleQuestionChange = (index, field, value) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], [field]: value };
    setQuestions(updated);
    // Clear error on change
    const questionKey = `question_${index}`;
    const answerKey = `answer_${index}`;
    const key = field === 'question' ? questionKey : answerKey;
    if (questionErrors[key]) {
      setQuestionErrors((prev) => ({ ...prev, [key]: null }));
    }
  };

  const addQuestion = () => {
    if (questions.length >= 3) {
      showWarning('Maximum of 3 security questions allowed');
      return;
    }
    setQuestions([...questions, { question: '', answer: '' }]);
  };

  const removeQuestion = (index) => {
    if (questions.length <= 1) {
      showError('You need at least one security question');
      return;
    }
    const updated = questions.filter((_, i) => i !== index);
    setQuestions(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate all questions have values
    // Validate each question individually with inline errors
    let hasQuestionErrors = false;
    const newQuestionErrors = {};
    questions.forEach((q, index) => {
      const questionKey = `question_${index}`;
      const answerKey = `answer_${index}`;
      
      if (!isRequired(q.question)) {
        newQuestionErrors[questionKey] = 'Please select or type a question';
        hasQuestionErrors = true;
      }
      if (!isRequired(q.answer)) {
        newQuestionErrors[answerKey] = 'Answer is required';
        hasQuestionErrors = true;
      } else if (q.answer.trim().length < 2) {
        newQuestionErrors[answerKey] = 'Answer must be at least 2 characters';
        hasQuestionErrors = true;
      }
    });
    
    setQuestionErrors(newQuestionErrors);
    
    if (hasQuestionErrors) {
      showError('Please fix the form errors before submitting');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        questions: questions.map(q => ({
          question: q.question,
          answer: q.answer
        }))
      };

      const response = await axios.post('/security/questions', payload);
      if (response.data.success) {
        showSuccess(response.data.message || 'Security questions saved!');
        fetchExistingQuestions();
        // Reset to minimal form
        setQuestions([{ question: '', answer: '' }]);
        setQuestionErrors({});
        setQuestionTouched({});
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to save security questions';
      showError(message);
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand"></div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-black">Security Questions</h3>
          <p className="text-sm text-black mt-1">
            Set up security questions to recover your password if you forget it.
          </p>
        </div>
        {existingQuestions.length > 0 && (
          <span className="bg-brand text-black px-2 py-0.5 rounded-full text-xs font-medium">
            {existingQuestions.length} question{existingQuestions.length > 1 ? 's' : ''} set
          </span>
        )}
      </div>

      {/* Existing questions indicator */}
      {existingQuestions.length > 0 && (
        <div className="bg-gray-100 border border-gray-200 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-black mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-sm font-medium text-black">
                You have {existingQuestions.length} security question{existingQuestions.length > 1 ? 's' : ''} configured.
              </p>
              <p className="text-xs text-black/60 mt-0.5">
                Fill in the form below to replace them with new questions and answers.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Info banner if no questions set */}
      {existingQuestions.length === 0 && (
        <div className="bg-gray-100 border border-gray-200 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-black mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <p className="text-sm text-black">
              You haven't set up any security questions yet. 
              This is required for password recovery if you forget your login credentials.
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {questions.map((q, index) => (
          <div key={index} className="bg-brand rounded-xl p-5 border border-gray-200 relative shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-black">
                Question {index + 1}
              </span>
              {questions.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeQuestion(index)}
                  className="text-red-500 hover:text-red-700 text-sm font-medium transition-colors"
                >
                  Remove
                </button>
              )}
            </div>
            <div className="space-y-3">
              <div>
                <label className="form-label">Select or type a question</label>
                <div className="flex gap-2">
                  <select
                    value={predefinedQuestions.includes(q.question) ? q.question : 'custom'}
                    onChange={(e) => {
                      if (e.target.value === 'custom') {
                        handleQuestionChange(index, 'question', '');
                      } else {
                        handleQuestionChange(index, 'question', e.target.value);
                      }
                    }}
                    onBlur={() => handleQuestionBlur(`question_${index}`)}
                    className={`input-field ${questionTouched[`question_${index}`] && questionErrors[`question_${index}`] ? 'border-red-500' : ''}`}
                  >
                    <option value="">Select a question...</option>
                    {predefinedQuestions.map(pq => (
                      <option key={pq} value={pq}>{pq}</option>
                    ))}
                    <option value="custom">Custom question...</option>
                  </select>
                </div>
                {!predefinedQuestions.includes(q.question) && (
                  <input
                    type="text"
                    value={q.question}
                    onChange={(e) => handleQuestionChange(index, 'question', e.target.value)}
                    onBlur={() => handleQuestionBlur(`question_${index}`)}
                    className={`input-field mt-2 ${questionTouched[`question_${index}`] && questionErrors[`question_${index}`] ? 'border-red-500' : ''}`}
                    placeholder="Type your custom security question"
                    required
                  />
                )}
                {questionTouched[`question_${index}`] && questionErrors[`question_${index}`] && (
                  <p className="text-red-500 text-xs mt-1">{questionErrors[`question_${index}`]}</p>
                )}
              </div>
              <div>
                <label className="form-label">Answer</label>
                <input
                  type="text"
                  value={q.answer}
                  onChange={(e) => handleQuestionChange(index, 'answer', e.target.value)}
                  onBlur={() => handleQuestionBlur(`answer_${index}`)}
                  className={`input-field ${questionTouched[`answer_${index}`] && questionErrors[`answer_${index}`] ? 'border-red-500' : ''}`}
                  placeholder="Your answer (case-insensitive)"
                  required
                  minLength={2}
                />
                {questionTouched[`answer_${index}`] && questionErrors[`answer_${index}`] && (
                  <p className="text-red-500 text-xs mt-1">{questionErrors[`answer_${index}`]}</p>
                )}
                <p className="text-xs text-gray-400 mt-1">
                  Answer is case-insensitive and will be trimmed when saved.
                </p>
              </div>
            </div>
          </div>
        ))}

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={addQuestion}
            className="btn-secondary flex items-center gap-2 text-sm"
            disabled={questions.length >= 3}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Another Question
          </button>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary flex items-center gap-2 ml-auto"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Saving...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Save Questions
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SecuritySettings;
