import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { showSuccess, showError } from '../utils/toast';
import { isRequired, isValidPassword, matches, validate, hasErrors } from '../utils/validation';

const ForgotPassword = () => {
  const navigate = useNavigate();

  // Step: 'username' -> 'question' -> 'reset'
  const [step, setStep] = useState('username');
  const [loading, setLoading] = useState(false);

  // Step 1 data
  const [username, setUsername] = useState('');
  const [userInfo, setUserInfo] = useState(null);
  const [questions, setQuestions] = useState([]);

  // Step 2 data
  const [selectedSecId, setSelectedSecId] = useState('');
  const [answer, setAnswer] = useState('');
  const [resetToken, setResetToken] = useState('');

  // Step 3 data
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // Step 1: Find user and get security questions
  const handleFindUser = async (e) => {
    e.preventDefault();
    if (!isRequired(username)) {
      showError('Please enter your username');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.get('/security/recovery-questions', {
        params: { username: username.trim() }
      });

      if (response.data.success) {
        setUserInfo({
          userId: response.data.data.userId,
          fullName: response.data.data.fullName
        });
        setQuestions(response.data.data.questions);
        if (response.data.data.questions.length > 0) {
          setSelectedSecId(response.data.data.questions[0].secId);
        }
        setStep('question');
        showSuccess('Account found! Please answer your security question.');
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to find account';
      showError(message);
    } finally {
      setLoading(false);
    }
  };

  const validateResetForm = (data) => {
    const rules = {
      newPassword: [
        { validate: (v) => isRequired(v), message: 'New password is required' },
        { validate: (v) => isValidPassword(v), message: 'Password must be at least 6 characters' },
      ],
      confirmPassword: [
        { validate: (v) => isRequired(v), message: 'Please confirm your password' },
        {
          validate: (v, d) => matches(v, d.newPassword),
          message: 'Passwords do not match',
        },
      ],
    };
    return validate(rules, data);
  };

  const handleResetBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const data = { newPassword, confirmPassword };
    const fieldErrors = validateResetForm(data);
    setErrors((prev) => ({ ...prev, [field]: fieldErrors[field] || null }));
  };

  // Step 2: Verify security answer
  const handleVerifyAnswer = async (e) => {
    e.preventDefault();
    if (!isRequired(answer)) {
      showError('Please answer the security question');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post('/security/verify-answer', {
        userId: userInfo.userId,
        secId: selectedSecId,
        answer: answer.trim()
      });

      if (response.data.success) {
        setResetToken(response.data.data.resetToken);
        setStep('reset');
        showSuccess('Answer verified! Now set your new password.');
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Incorrect answer';
      showError(message);
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Reset password
  const handleResetPassword = async (e) => {
    e.preventDefault();

    const data = { newPassword, confirmPassword };
    const validationErrors = validateResetForm(data);
    setErrors(validationErrors);
    setTouched({ newPassword: true, confirmPassword: true });

    if (hasErrors(validationErrors)) {
      showError('Please fix the form errors before submitting');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post('/security/reset-password', {
        resetToken,
        newPassword
      });

      if (response.data.success) {
        showSuccess('Password reset successfully! You can now login.');
        setTimeout(() => navigate('/login'), 1500);
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to reset password';
      showError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (step === 'question') setStep('username');
    else if (step === 'reset') setStep('question');
  };

  // Progress steps indicator
  const steps = [
    { key: 'username', label: 'Username', icon: '1' },
    { key: 'question', label: 'Verify', icon: '2' },
    { key: 'reset', label: 'Reset', icon: '3' },
  ];

  const currentStepIndex = steps.findIndex(s => s.key === step);

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200">
      {/* Logo */}
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-brand rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
          <svg className="w-8 h-8 text-black" fill="currentColor" viewBox="0 0 24 24">
            <path d="M19 9.3V4h-3v2.6L12 3 2 12h3v8h5v-6h4v6h5v-8h3l-3-2.7zm-9 .7c0-1.1.9-2 2-2s2 .9 2 2h-4z"/>
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-black">Reset Password</h2>
        <p className="text-black mt-1">Recover access to your account</p>
      </div>

      {/* Progress indicator */}
      <div className="flex items-center justify-center mb-8 gap-2">
        {steps.map((s, idx) => (
          <React.Fragment key={s.key}>
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300
                ${idx <= currentStepIndex
                  ? 'bg-brand text-black shadow-md'
                  : 'bg-gray-200 text-gray-400'
                }`}>
                {idx < currentStepIndex ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  s.icon
                )}
              </div>
              <span className={`text-sm font-medium ${idx <= currentStepIndex ? 'text-black' : 'text-gray-400'}`}>
                {s.label}
              </span>
            </div>
            {idx < steps.length - 1 && (
              <div className={`w-10 h-0.5 ${idx < currentStepIndex ? 'bg-brand' : 'bg-gray-200'}`} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Step 1: Enter Username */}
      {step === 'username' && (
        <form onSubmit={handleFindUser} className="space-y-6">
          <div className="bg-gray-100 rounded-xl p-4 border border-gray-200">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-black mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-black">
                Enter your username to find your account. You'll then verify your identity 
                using your security questions.
              </p>
            </div>
          </div>

          <div>
            <label htmlFor="username" className="form-label">Username</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="input-field pl-10"
                placeholder="Enter your username"
                autoFocus
                required
              />
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 py-3">
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Searching...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Find Account
              </>
            )}
          </button>

          <div className="text-center">
            <Link to="/login" className="text-sm text-black hover:text-gray-800 font-medium">
              ← Back to Login
            </Link>
          </div>
        </form>
      )}

      {/* Step 2: Answer Security Question */}
      {step === 'question' && (
        <form onSubmit={handleVerifyAnswer} className="space-y-6">
          <div className="bg-gray-100 rounded-xl p-4 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-brand rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-black">Account Found</p>
                <p className="text-xs text-black/60">{userInfo?.fullName}</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-100 rounded-xl p-4 border border-gray-200">
            <p className="text-sm text-black font-medium mb-1">Security Verification</p>
            <p className="text-xs text-black/60">Answer the security question below to verify your identity.</p>
          </div>

          <div>
            <label className="form-label">Security Question</label>
            <select
              value={selectedSecId}
              onChange={(e) => setSelectedSecId(e.target.value)}
              className="input-field"
              required
            >
              {questions.map((q) => (
                <option key={q.secId} value={q.secId}>{q.question}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="form-label">Your Answer</label>
            <input
              type="text"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              className="input-field"
              placeholder="Enter your answer"
              autoFocus
              required
            />
          </div>

          <div className="flex gap-3">
            <button type="button" onClick={handleBack} className="btn-secondary flex-1">
              Back
            </button>
            <button type="submit" disabled={loading} className="btn-primary flex-[2] flex items-center justify-center gap-2">
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Verifying...
                </>
              ) : (
                'Verify Answer'
              )}
            </button>
          </div>
        </form>
      )}

      {/* Step 3: Reset Password */}
      {step === 'reset' && (
        <form onSubmit={handleResetPassword} className="space-y-6">
          <div className="bg-gray-100 rounded-xl p-4 border border-gray-200">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-black shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-black font-medium">Identity Verified! Choose a new password.</p>
            </div>
          </div>

          <div>
            <label htmlFor="newPassword" className="form-label">New Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                id="newPassword"
                value={newPassword}
                onChange={(e) => { setNewPassword(e.target.value); if (errors.newPassword) setErrors((prev) => ({ ...prev, newPassword: null })); }}
                onBlur={() => handleResetBlur('newPassword')}
                className={`input-field pl-10 pr-10 ${touched.newPassword && errors.newPassword ? 'border-red-500' : ''}`}
                placeholder="Enter new password (min 6 chars)"
                minLength={6}
                autoFocus
                required
              />
              {touched.newPassword && errors.newPassword && (
                <p className="text-red-500 text-xs mt-1">{errors.newPassword}</p>
              )}
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                {showPassword ? (
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                          d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => { setConfirmPassword(e.target.value); if (errors.confirmPassword) setErrors((prev) => ({ ...prev, confirmPassword: null })); }}
                onBlur={() => handleResetBlur('confirmPassword')}
                className={`input-field pl-10 ${(touched.confirmPassword && errors.confirmPassword) || (confirmPassword && newPassword !== confirmPassword) ? 'border-red-500' : ''}`}
                placeholder="Confirm new password"
                minLength={6}
                required
              />
              {touched.confirmPassword && errors.confirmPassword && (
                <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>
              )}
            </div>
            {confirmPassword && newPassword !== confirmPassword && (
              <p className="text-red-500 text-xs mt-1">Passwords do not match</p>
            )}
          </div>

          {/* Password strength indicator */}
          <div className="space-y-1">
            <div className="flex gap-1">
              {[1, 2, 3].map((level) => (
                <div
                  key={level}
                  className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                    newPassword.length >= level * 2
                      ? newPassword.length >= 6
                        ? newPassword.length >= 8
                          ? 'bg-brand'
                          : 'bg-yellow-500'
                        : 'bg-red-500'
                      : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>
            <p className="text-xs text-gray-400">
              {newPassword.length === 0
                ? 'Enter a password'
                : newPassword.length < 6
                  ? 'Too short (min 6 characters)'
                  : newPassword.length < 8
                    ? 'Medium strength'
                    : 'Strong password'}
            </p>
          </div>

          <div className="flex gap-3">
            <button type="button" onClick={handleBack} className="btn-secondary flex-1">
              Back
            </button>
            <button
              type="submit"
              disabled={loading || (confirmPassword && newPassword !== confirmPassword)}
              className="btn-primary flex-[2] flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Resetting...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Reset Password
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default ForgotPassword;
