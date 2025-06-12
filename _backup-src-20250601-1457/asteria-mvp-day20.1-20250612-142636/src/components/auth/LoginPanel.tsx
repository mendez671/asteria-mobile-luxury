// ===============================
// PHASE 4.6: LUXURY LOGIN PANEL
// Firebase authentication UI component
// ===============================

'use client';

import React, { useState } from 'react';
import { useFirebaseAuth } from '@/components/chat/hooks/useFirebaseAuth';
import { LockClosedIcon, UserIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

interface LoginPanelProps {
  onClose?: () => void;
  className?: string;
}

export default function LoginPanel({ onClose, className = '' }: LoginPanelProps) {
  const { signIn, createMember, loading, error, clearError } = useFirebaseAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    displayName: '',
    tier: 'standard' as 'elite' | 'premium' | 'standard'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    try {
      if (isSignUp) {
        await createMember(formData.email, formData.password, {
          displayName: formData.displayName,
          tier: formData.tier,
          preferences: {},
          tagMemberId: undefined // Can be set later for existing TAG members
        });
      } else {
        await signIn(formData.email, formData.password);
      }
      
      // Close panel on successful authentication
      onClose?.();
    } catch (err) {
      // Error is handled by the hook
      console.error('Authentication error:', err);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className={`bg-gradient-to-br from-purple-900/90 to-blue-900/90 backdrop-blur-lg rounded-xl p-8 shadow-2xl border border-white/10 ${className}`}>
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-blue-400 rounded-full flex items-center justify-center mx-auto mb-4">
          <LockClosedIcon className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">
          {isSignUp ? 'Join TAG Inner Circle' : 'Welcome Back'}
        </h2>
        <p className="text-purple-200">
          {isSignUp 
            ? 'Create your exclusive member account'
            : 'Sign in to access your concierge services'
          }
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-900/50 border border-red-500/50 rounded-lg p-4 mb-6">
          <p className="text-red-200 text-sm">{error}</p>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Display Name (Sign Up Only) */}
        {isSignUp && (
          <div>
            <label className="block text-sm font-medium text-purple-200 mb-2">
              Full Name
            </label>
            <div className="relative">
              <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-purple-300" />
              <input
                type="text"
                value={formData.displayName}
                onChange={(e) => handleInputChange('displayName', e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                placeholder="Enter your full name"
                required={isSignUp}
              />
            </div>
          </div>
        )}

        {/* Member Tier (Sign Up Only) */}
        {isSignUp && (
          <div>
            <label className="block text-sm font-medium text-purple-200 mb-2">
              Membership Tier
            </label>
            <select
              value={formData.tier}
              onChange={(e) => handleInputChange('tier', e.target.value)}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
            >
              <option value="standard" className="bg-purple-900">Standard Member</option>
              <option value="premium" className="bg-purple-900">Premium Member</option>
              <option value="elite" className="bg-purple-900">Elite Member</option>
            </select>
          </div>
        )}

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-purple-200 mb-2">
            Email Address
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
            placeholder="Enter your email"
            required
          />
        </div>

        {/* Password */}
        <div>
          <label className="block text-sm font-medium text-purple-200 mb-2">
            Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              className="w-full px-4 py-3 pr-12 bg-white/10 border border-white/20 rounded-lg text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
              placeholder="Enter your password"
              required
              minLength={6}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-purple-300 hover:text-white"
            >
              {showPassword ? (
                <EyeSlashIcon className="w-5 h-5" />
              ) : (
                <EyeIcon className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 disabled:from-gray-500 disabled:to-gray-600 text-white font-semibold py-3 rounded-lg transition-all duration-200 disabled:cursor-not-allowed"
        >
          {loading ? (
            <div className="flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
              {isSignUp ? 'Creating Account...' : 'Signing In...'}
            </div>
          ) : (
            isSignUp ? 'Create Account' : 'Sign In'
          )}
        </button>
      </form>

      {/* Toggle Sign Up/Sign In */}
      <div className="text-center mt-6 pt-6 border-t border-white/10">
        <p className="text-purple-200">
          {isSignUp ? 'Already have an account?' : 'New to TAG Inner Circle?'}
        </p>
        <button
          type="button"
          onClick={() => {
            setIsSignUp(!isSignUp);
            clearError();
            setFormData({ email: '', password: '', displayName: '', tier: 'standard' });
          }}
          className="text-purple-300 hover:text-white font-medium mt-1 underline"
        >
          {isSignUp ? 'Sign In' : 'Create Account'}
        </button>
      </div>

      {/* Close Button */}
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-purple-300 hover:text-white"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
} 