import React, { useState, useEffect } from 'react';
import { X, Mail, Lock, AlertCircle } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useTranslation } from 'react-i18next';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const { t } = useTranslation();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Clear all fields every time the modal opens to prevent password caching
  useEffect(() => {
    if (isOpen) {
      setEmail('');
      setPassword('');
      setError(null);
      setSuccessMessage(null);
      setIsSignUp(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setLoading(true);

    if (!isSupabaseConfigured) {
      setError(t('auth.offline'));
      setLoading(false);
      return;
    }

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        setSuccessMessage(t('auth.success'));
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        onClose();
      }
    } catch (err: any) {
      setError(err.message || "An error occurred during authentication.");
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
            <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary-container rounded-2xl flex items-center justify-center text-on-primary font-display font-bold text-2xl shadow-ambient mx-auto mb-4">
              L
            </div>
            <h2 className="text-2xl font-display font-bold text-on-surface">
              {isSignUp ? t('auth.signup.title') : t('auth.signin.title')}
            </h2>
            <p className="text-on-surface-variant mt-2 text-sm">
              {isSignUp ? t('auth.signup.subtitle') : t('auth.signin.subtitle')}
            </p>
          </div>

          {!isSupabaseConfigured && (
            <div className="mb-6 p-4 bg-error/10 text-error rounded-xl flex items-start text-sm">
              <AlertCircle className="w-5 h-5 mr-2 shrink-0 mt-0.5" />
              <p>{t('auth.offline')}</p>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-error/10 text-error rounded-xl text-sm">
              {error}
            </div>
          )}

          {successMessage && (
            <div className="mb-6 p-4 bg-primary/10 text-primary rounded-xl text-sm">
              {successMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
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
                  placeholder={t('auth.emailPlaceholder')}
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
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border-b-2 border-outline-variant/30 bg-surface-container-highest focus:border-primary focus:bg-surface-container-lowest focus:outline-none transition-colors rounded-t-xl rounded-b-sm text-on-surface"
                  placeholder="••••••••"
                  minLength={6}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !isSupabaseConfigured}
              className="w-full py-3 px-4 border border-transparent rounded-full shadow-ambient text-sm font-bold text-on-primary bg-primary hover:bg-primary-container focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-6"
            >
              {loading ? t('auth.loading') : (isSignUp ? t('auth.button.signup') : t('auth.button.signin'))}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-sm text-primary hover:text-primary-container font-medium transition-colors"
            >
              {isSignUp ? t('auth.switch.tosignin') : t('auth.switch.tosignup')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
