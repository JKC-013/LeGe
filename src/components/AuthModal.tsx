import React, { useState } from 'react';
import { X, Mail, Lock, User, AlertCircle, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { ChristianCross } from './ChristianCross';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}


  const withTimeout = (promise: Promise<any>, ms: number = 30000) => {
    return Promise.race([
      promise,
      new Promise((_, reject) => setTimeout(() => reject(new Error("REQUEST_TIMEOUT")), ms))
    ]);
  };

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const { t } = useTranslation();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    

    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setLoading(true);

    if (!isSupabaseConfigured) {
      setError("Supabase is not configured. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your environment variables.");
      setLoading(false);
      return;
    }

    if (isSignUp && password !== confirmPassword) {
      setError(t("auth.passwordsNotMatch"));
      setLoading(false);
      return;
    }

    try {
      if (isSignUp) {
        const { data, error } = await withTimeout(supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name,
            }
          }
        }));
        
        if (error) throw error;
        
        if (data.user && data.user.identities && data.user.identities.length === 0) {
          setError(t("auth.emailRegistered"));
          return;
        }

        if (!data.session) {
          setSuccessMessage("Registration successful! Please check your email to confirm your account before signing in.");
        } else {
          setSuccessMessage("Registration successful! You are now signed in.");
          setTimeout(() => {
            onClose();
          }, 1500);
        }
        setIsSignUp(false);
      } else {
        const { data, error } = await withTimeout(supabase.auth.signInWithPassword({
          email,
          password,
        }));
        if (error) throw error;
        
        setSuccessMessage("Sign in successful!");
        setTimeout(() => {
          onClose();
        }, 1000);
      }
    } catch (err: any) {
      console.error("Auth error:", err);
      let errMsg = err.message || "An error occurred during authentication.";
      if (errMsg === 'Failed to fetch') {
        errMsg = "Network error (Failed to fetch). Please check your internet connection and ensure your Supabase project URL is correct and active.";
      } else if (errMsg.includes('Email not confirmed')) {
        errMsg = "Please check your email and confirm your account before signing in. (Or disable email confirmation in your Supabase Auth settings).";
      }
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-surface/80 backdrop-blur-sm">
      <div className="bg-surface-container-lowest w-full max-w-md rounded-3xl shadow-ambient overflow-hidden relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-container rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
        
        <div className="p-8">
          <div className="text-center mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary-container rounded-2xl flex items-center justify-center text-on-primary font-display font-bold text-2xl shadow-ambient mx-auto mb-4 hover:scale-105 transition-transform">
              <ChristianCross className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-display font-bold text-on-surface">
              {isSignUp ? t('auth.signUpTitle') : t('auth.signInTitle')}
            </h2>
            <p className="text-on-surface-variant mt-2 text-sm">
              {isSignUp ? t('auth.signUpDesc') : t('auth.signInDesc')}
            </p>
          </div>

          {!isSupabaseConfigured && (
            <div className="mb-6 p-4 bg-error/10 text-error rounded-xl flex items-start text-sm">
              <AlertCircle className="w-5 h-5 mr-2 shrink-0 mt-0.5" />
              <p>Supabase is not configured. The app is running in offline mode. Please provide your Supabase keys to enable authentication.</p>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-error/10 text-error rounded-xl text-sm border border-error/20">
              {error}
            </div>
          )}

          {successMessage && (
            <div className="mb-6 p-4 bg-primary/10 text-primary rounded-xl text-sm border border-primary/20">
              {successMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div>
                <label className="block text-sm font-medium text-on-surface mb-1.5">{t('auth.name')}</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-on-surface-variant" />
                  </div>
                  <input
                    type="text"
                    required={isSignUp}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 border-b-2 border-outline-variant/30 bg-surface-container-highest focus:border-primary focus:bg-surface-container-lowest focus:outline-none transition-colors rounded-t-xl rounded-b-sm text-on-surface"
                    placeholder={t('auth.namePlaceholder')}
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-on-surface mb-1.5">{t('auth.email')}</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-on-surface-variant" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border-b-2 border-outline-variant/30 bg-surface-container-highest focus:border-primary focus:bg-surface-container-lowest focus:outline-none transition-colors rounded-t-xl rounded-b-sm text-on-surface"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-on-surface mb-1.5">{t('auth.password')}</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-on-surface-variant" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border-b-2 border-outline-variant/30 bg-surface-container-highest focus:border-primary focus:bg-surface-container-lowest focus:outline-none transition-colors rounded-t-xl rounded-b-sm text-on-surface"
                  placeholder="••••••••"
                  minLength={6}
                />
              </div>
            </div>

            {isSignUp && (
              <div>
                <label className="block text-sm font-medium text-on-surface mb-1.5">{t('auth.confirmPassword')}</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-on-surface-variant" />
                  </div>
                  <input
                    type="password"
                    required={isSignUp}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 border-b-2 border-outline-variant/30 bg-surface-container-highest focus:border-primary focus:bg-surface-container-lowest focus:outline-none transition-colors rounded-t-xl rounded-b-sm text-on-surface"
                    placeholder="••••••••"
                    minLength={6}
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !isSupabaseConfigured}
              className="w-full py-3 px-4 border border-transparent rounded-full shadow-ambient text-sm font-bold text-on-primary bg-primary hover:bg-primary-container focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-6"
            >
              {loading ? (<span className="flex items-center justify-center"><Loader2 className="w-4 h-4 mr-2 animate-spin" /> {t('auth.wait')}</span>) : (isSignUp ? t('auth.signUp') : t('auth.signIn'))}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError(null);
                setSuccessMessage(null);
              }}
              className="text-sm text-primary hover:text-primary-container font-medium transition-colors"
            >
              {isSignUp ? t('auth.switchSignIn') : t('auth.switchSignUp')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
