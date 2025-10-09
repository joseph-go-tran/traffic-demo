import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, MapPin, Loader2, Check } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLogin, useRegister } from '../../hooks/useAuth';

interface LoginPageProps {
  onLogin: () => void;
  onRegister: () => void;
}

export default function LoginPage({ onLogin, onRegister }: LoginPageProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  // React Query hooks
  const loginMutation = useLogin();
  const registerMutation = useRegister();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: ''
  });

  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Clear local errors
    setLocalErrors({});

    // Validate password confirmation for registration
    if (!isLogin) {
      if (!formData.password) {
        setLocalErrors({ password: 'Password is required' });
        return;
      }
      if (!formData.confirmPassword) {
        setLocalErrors({ confirmPassword: 'Please confirm your password' });
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setLocalErrors({ confirmPassword: 'Passwords do not match' });
        return;
      }
      if (formData.password.length < 8) {
        setLocalErrors({ password: 'Password must be at least 8 characters long' });
        return;
      }
    }

    try {
      if (isLogin) {
        await loginMutation.mutateAsync({
          email: formData.email,
          password: formData.password,
        });
        onLogin();
        navigate(from, { replace: true });
      } else {
        await registerMutation.mutateAsync({
          email: formData.email,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName,
        });
        onRegister();
        navigate(from, { replace: true });
      }
    } catch (error) {
      console.error('Authentication error:', error);
      // Error handling is done by React Query
    }
  };

  const isLoading = loginMutation.isPending || registerMutation.isPending;
  const error = loginMutation.error || registerMutation.error;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setFormData({
      ...formData,
      [name]: value
    });

    // Clear local error for the field being edited
    if (localErrors[name]) {
      setLocalErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }

    // Real-time validation for confirm password
    if (name === 'confirmPassword' && value && formData.password) {
      if (value !== formData.password) {
        setLocalErrors(prev => ({ ...prev, confirmPassword: 'Passwords do not match' }));
      } else {
        setLocalErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors.confirmPassword;
          return newErrors;
        });
      }
    }

    // Also check if password is being changed and confirm password exists
    if (name === 'password' && formData.confirmPassword) {
      if (value !== formData.confirmPassword) {
        setLocalErrors(prev => ({ ...prev, confirmPassword: 'Passwords do not match' }));
      } else {
        setLocalErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors.confirmPassword;
          return newErrors;
        });
      }
    }
  };

  // Helper function to extract error messages from API response
  const getErrorMessage = (err: unknown): string[] => {
    if (!err) return [];

    const error = err as { response?: { data?: Record<string, unknown> } };
    const response = error?.response?.data;
    const messages: string[] = [];

    if (typeof response === 'string') {
      messages.push(response);
    } else if (response && typeof response === 'object') {
      // Check for detail field (general error - no field prefix)
      if ('detail' in response && typeof response.detail === 'string') {
        messages.push(response.detail);
      }
      // Check for message field (general error - no field prefix)
      else if ('message' in response && typeof response.message === 'string') {
        messages.push(response.message);
      }
      // Field-specific errors (show just the message without field name)
      else {
        Object.keys(response).forEach(field => {
          const fieldErrors = response[field];
          if (Array.isArray(fieldErrors)) {
            fieldErrors.forEach(msg => {
              // Show only the error message without field name prefix
              messages.push(String(msg));
            });
          } else if (typeof fieldErrors === 'string') {
            // Show only the error message without field name prefix
            messages.push(fieldErrors);
          }
        });
      }
    }

    // Fallback message if no specific error found
    if (messages.length === 0) {
      messages.push(isLogin ? 'Login failed. Please check your credentials.' : 'Registration failed. Please try again.');
    }

    return messages;
  };

  const errorMessages = getErrorMessage(error);

  // Check if passwords match (for visual feedback)
  const passwordsMatch = !isLogin &&
    formData.password &&
    formData.confirmPassword &&
    formData.password === formData.confirmPassword &&
    !localErrors.confirmPassword;

  // Helper to check if a specific field has an error
  const hasFieldError = (fieldName: string): boolean => {
    // Check local errors first
    if (localErrors[fieldName]) return true;

    // Check API errors
    if (!error) return false;
    const err = error as { response?: { data?: Record<string, unknown> } };
    const response = err?.response?.data;
    if (!response) return false;
    return fieldName in response;
  };

  // Get error message for specific field
  const getFieldError = (fieldName: string): string | null => {
    // Check local errors first
    if (localErrors[fieldName]) return localErrors[fieldName];

    // Check API errors
    if (!error) return null;
    const err = error as { response?: { data?: Record<string, unknown> } };
    const response = err?.response?.data;
    if (!response) return null;

    const fieldError = response[fieldName];

    if (Array.isArray(fieldError)) {
      return String(fieldError[0]);
    } else if (typeof fieldError === 'string') {
      return fieldError;
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center px-4">
      <div className="max-w-md w-full my-5">
        {/* Logo and Brand */}
        <div className="text-center mb-8">
          <div className="bg-white p-3 rounded-xl inline-block mb-4">
            <MapPin className="h-8 w-8 text-purple-600" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">TrafficFlow</h1>
          <p className="text-purple-100">Your smart navigation companion</p>
        </div>

        {/* Auth Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </h2>
            <p className="text-gray-600 text-center">
              {isLogin
                ? 'Sign in to access your saved routes and preferences'
                : 'Join millions of users for smarter navigation'
              }
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    First Name
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    required
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:border-transparent ${
                      hasFieldError('first_name')
                        ? 'border-red-300 focus:ring-red-600'
                        : 'border-gray-300 focus:ring-purple-600'
                    }`}
                    placeholder="John"
                  />
                  {hasFieldError('first_name') && (
                    <p className="mt-1 text-sm text-red-600">{getFieldError('first_name')}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    required
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:border-transparent ${
                      hasFieldError('last_name')
                        ? 'border-red-300 focus:ring-red-600'
                        : 'border-gray-300 focus:ring-purple-600'
                    }`}
                    placeholder="Doe"
                  />
                  {hasFieldError('last_name') && (
                    <p className="mt-1 text-sm text-red-600">{getFieldError('last_name')}</p>
                  )}
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 ${hasFieldError('email') ? 'text-red-400' : 'text-gray-400'}`} />
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:border-transparent ${
                    hasFieldError('email')
                      ? 'border-red-300 focus:ring-red-600'
                      : 'border-gray-300 focus:ring-purple-600'
                  }`}
                  placeholder="you@example.com"
                />
              </div>
              {hasFieldError('email') && (
                <p className="mt-1 text-sm text-red-600">{getFieldError('email')}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 ${hasFieldError('password') ? 'text-red-400' : 'text-gray-400'}`} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:border-transparent ${
                    hasFieldError('password')
                      ? 'border-red-300 focus:ring-red-600'
                      : 'border-gray-300 focus:ring-purple-600'
                  }`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {hasFieldError('password') && (
                <p className="mt-1 text-sm text-red-600">{getFieldError('password')}</p>
              )}
            </div>

            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 ${
                    hasFieldError('confirmPassword') ? 'text-red-400' :
                    passwordsMatch ? 'text-green-400' : 'text-gray-400'
                  }`} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    required
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className={`w-full pl-10 py-3 border rounded-lg focus:ring-2 focus:border-transparent ${
                      hasFieldError('confirmPassword')
                        ? 'border-red-300 focus:ring-red-600 pr-4'
                        : passwordsMatch
                        ? 'border-green-300 focus:ring-green-600 pr-10'
                        : 'border-gray-300 focus:ring-purple-600 pr-4'
                    }`}
                    placeholder="••••••••"
                  />
                  {passwordsMatch && (
                    <Check className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-green-500" />
                  )}
                </div>
                {hasFieldError('confirmPassword') && (
                  <p className="mt-1 text-sm text-red-600">{getFieldError('confirmPassword')}</p>
                )}
                {passwordsMatch && (
                  <p className="mt-1 text-sm text-green-600">Passwords match!</p>
                )}
              </div>
            )}

            {isLogin && (
              <div className="flex items-center justify-between">
                <label className="flex items-center">
                  <input type="checkbox" className="rounded border-gray-300 text-purple-600 focus:ring-purple-600" />
                  <span className="ml-2 text-sm text-gray-600">Remember me</span>
                </label>
                <button type="button" className="text-sm text-purple-600 hover:text-purple-700">
                  Forgot password?
                </button>
              </div>
            )}

            {/* Error Display - Show API errors only for login */}
            {isLogin && error && errorMessages.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3 flex-1">
                    <div className="text-sm text-red-600">
                      {errorMessages.map((msg, index) => (
                        <p key={index} className={index > 0 ? 'mt-1' : ''}>{msg}</p>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-purple-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  {isLogin ? 'Signing In...' : 'Creating Account...'}
                </>
              ) : (
                isLogin ? 'Sign In' : 'Create Account'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <button
                onClick={() => {
                  setIsLogin(!isLogin);
                  setLocalErrors({});
                  loginMutation.reset();
                  registerMutation.reset();
                }}
                className="text-purple-600 hover:text-purple-700 font-medium"
              >
                {isLogin ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          </div>

          {!isLogin && (
            <div className="mt-4 text-xs text-gray-500 text-center">
              By creating an account, you agree to our{' '}
              <button className="text-purple-600 hover:underline">Terms of Service</button>
              {' '}and{' '}
              <button className="text-purple-600 hover:underline">Privacy Policy</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
