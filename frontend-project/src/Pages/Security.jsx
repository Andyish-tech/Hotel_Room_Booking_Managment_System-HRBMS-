import React, { useState } from 'react';
import SecuritySettings from '../Components/SecuritySettings';
import axios from 'axios';
import { showSuccess, showError } from '../utils/toast';
import { isRequired, isValidPassword, matches, validate, hasErrors } from '../utils/validation';

const Security = () => {
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [changingPassword, setChangingPassword] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const validatePasswordForm = (data) => {
    const rules = {
      currentPassword: [
        { validate: (v) => isRequired(v), message: 'Current password is required' },
      ],
      newPassword: [
        { validate: (v) => isRequired(v), message: 'New password is required' },
        { validate: (v) => isValidPassword(v), message: 'Password must be at least 6 characters' },
        {
          validate: (v, d) => !isRequired(d.currentPassword) || v !== d.currentPassword,
          message: 'New password must be different from your current password',
        },
      ],
      confirmPassword: [
        { validate: (v) => isRequired(v), message: 'Please confirm your new password' },
        {
          validate: (v, d) => matches(v, d.newPassword),
          message: 'Passwords do not match',
        },
      ],
    };
    return validate(rules, data);
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    const fieldErrors = validatePasswordForm(passwordData);
    setErrors((prev) => ({ ...prev, [name]: fieldErrors[name] || null }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const getPasswordStrength = (pwd) => {
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[a-z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(pwd)) score++;
    return score;
  };

  const strength = getPasswordStrength(passwordData.newPassword);

  const getStrengthLabel = () => {
    if (strength <= 1) return { label: 'Weak', color: 'bg-red-500', text: 'text-red-600' };
    if (strength <= 3) return { label: 'Medium', color: 'bg-yellow-500', text: 'text-yellow-600' };
    if (strength === 4) return { label: 'Strong', color: 'bg-brand', text: 'text-black' };
    return { label: 'Very Strong', color: 'bg-brand', text: 'text-black' };
  };

  const strengthInfo = getStrengthLabel();

  const handleChangePassword = async (e) => {
    e.preventDefault();

    const validationErrors = validatePasswordForm(passwordData);
    setErrors(validationErrors);
    setTouched({ currentPassword: true, newPassword: true, confirmPassword: true });

    if (hasErrors(validationErrors)) {
      showError('Please fix the form errors before submitting');
      return;
    }

    setChangingPassword(true);
    try {
      const response = await axios.put('/security/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      if (response.data.success) {
        showSuccess('Password changed successfully!');
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setErrors({});
        setTouched({});
        setShowChangePassword(false);
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to change password';
      showError(message);
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-black">Security Settings</h2>          <p className="text-black mt-1">
              Manage your password and security questions for account recovery
            </p>
      </div>

      {/* Info card */}
      <div className="bg-gradient-to-r from-brand to-yellow-600 rounded-2xl p-6 text-black shadow-lg">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-black/10 rounded-xl flex items-center justify-center shrink-0">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-1">Account Protection</h3>
            <p className="text-black/70 text-sm">
              Regularly change your password and set up security questions to keep your account secure. 
              Security questions provide an additional layer of protection — you can verify your identity 
              to regain access if you ever forget your password.
            </p>
          </div>
        </div>
      </div>

      {/* Change Password Section */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-black">Password</h3>
            <p className="text-sm text-black mt-1">
              Update your login password. Use a strong, unique password.
            </p>
          </div>
          {!showChangePassword && (
            <button
              onClick={() => setShowChangePassword(true)}
              className="btn-primary flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
              Change Password
            </button>
          )}
        </div>

        {showChangePassword && (
          <form onSubmit={handleChangePassword} className="space-y-4 max-w-lg">
            <div>
              <label className="form-label">Current Password</label>
              <div className="relative">
                <input
                  type={showCurrent ? 'text' : 'password'}
                  name="currentPassword"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
                  onBlur={handleBlur}
                  className={`input-field pr-10 ${touched.currentPassword && errors.currentPassword ? 'border-red-500' : ''}`}
                  placeholder="Enter your current password"
                  required
                />
                {touched.currentPassword && errors.currentPassword && (
                  <p className="text-red-500 text-xs mt-1">{errors.currentPassword}</p>
                )}
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showCurrent ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="form-label">New Password</label>
              <div className="relative">
                <input
                  type={showNew ? 'text' : 'password'}
                  name="newPassword"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  onBlur={handleBlur}
                  className={`input-field pr-10 ${touched.newPassword && errors.newPassword ? 'border-red-500' : ''}`}
                  placeholder="Enter new password"
                  required
                />
                {touched.newPassword && errors.newPassword && (
                  <p className="text-red-500 text-xs mt-1">{errors.newPassword}</p>
                )}
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showNew ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {passwordData.newPassword && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div
                        key={i}
                        className={`h-1.5 flex-1 rounded-full ${
                          i <= strength ? strengthInfo.color : 'bg-gray-200'
                        } transition-colors duration-300`}
                      />
                    ))}
                  </div>
                  <p className={`text-xs ${strengthInfo.text}`}>
                    {strengthInfo.label}
                  </p>
                  <ul className="text-xs text-black mt-1 space-y-0.5">
                    <li className={passwordData.newPassword.length >= 8 ? 'text-black' : ''}>
                      {passwordData.newPassword.length >= 8 ? '✓' : '○'} At least 8 characters
                    </li>
                    <li className={/[A-Z]/.test(passwordData.newPassword) ? 'text-black' : ''}>
                      {/[A-Z]/.test(passwordData.newPassword) ? '✓' : '○'} One uppercase letter
                    </li>
                    <li className={/[a-z]/.test(passwordData.newPassword) ? 'text-black' : ''}>
                      {/[a-z]/.test(passwordData.newPassword) ? '✓' : '○'} One lowercase letter
                    </li>
                    <li className={/[0-9]/.test(passwordData.newPassword) ? 'text-black' : ''}>
                      {/[0-9]/.test(passwordData.newPassword) ? '✓' : '○'} One number
                    </li>
                    <li className={/[!@#$%^&*(),.?":{}|<>]/.test(passwordData.newPassword) ? 'text-black' : ''}>
                      {/[!@#$%^&*(),.?":{}|<>]/.test(passwordData.newPassword) ? '✓' : '○'} One special character
                    </li>
                  </ul>
                </div>
              )}
            </div>

            <div>
              <label className="form-label">Confirm New Password</label>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  name="confirmPassword"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                  onBlur={handleBlur}
                  className={`input-field pr-10 ${touched.confirmPassword && errors.confirmPassword ? 'border-red-500' : ''}`}
                  placeholder="Re-enter new password"
                  required
                />
                {touched.confirmPassword && errors.confirmPassword && (
                  <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>
                )}
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirm ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {passwordData.confirmPassword && passwordData.newPassword !== passwordData.confirmPassword && (
                <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
              )}
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={changingPassword}
                className="btn-primary flex items-center gap-2"
              >
                {changingPassword ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Updating...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Update Password
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowChangePassword(false);
                  setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                }}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Security Settings Form */}
      <SecuritySettings />
    </div>
  );
};

export default Security;
