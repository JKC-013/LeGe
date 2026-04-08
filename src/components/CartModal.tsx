import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from '../store';
import { X, ShoppingCart, Trash2, Send, AlertCircle } from 'lucide-react';

interface CartModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CartModal({ isOpen, onClose }: CartModalProps) {
  const { t } = useTranslation();
  const { cartItems, songs, removeFromCart, clearCart, submitToWorship } = useStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const cartSongs = songs.filter(s => cartItems.includes(s.id));

  const handleSubmit = async () => {
    if (cartItems.length === 0) {
      setSubmitError(t('cart.emptyError'));
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');
    try {
      await submitToWorship(cartItems);
      setSubmitSuccess(true);
      clearCart();
      setTimeout(() => {
        setSubmitSuccess(false);
        onClose();
      }, 2000);
    } catch (err: any) {
      setSubmitError(err.message || t('cart.submitError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center">
      <div className="bg-surface-container-lowest w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-surface-container-lowest border-b border-outline-variant/15 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold text-on-surface">{t('cart.title')}</h2>
            {cartItems.length > 0 && (
              <span className="bg-primary text-on-primary text-xs font-bold px-2 py-1 rounded-full">
                {cartItems.length}
              </span>
            )}
          </div>
          <button onClick={onClose} className="p-1 hover:bg-surface-container rounded-full transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-4 min-h-[200px]">
          {cartItems.length === 0 ? (
            <div className="text-center py-12 text-outline-variant">
              <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">{t('cart.empty')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {cartSongs.map((song) => (
                <div
                  key={song.id}
                  className="flex items-start justify-between p-3 bg-surface-container rounded-xl border border-outline-variant/15 hover:bg-surface-container-high transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-on-surface truncate">{song.title}</h3>
                    <p className="text-xs text-on-surface-variant">{song.author}</p>
                  </div>
                  <button
                    onClick={() => removeFromCart(song.id)}
                    className="ml-2 p-2 hover:bg-red-50 hover:text-red-600 rounded-full transition-colors flex-shrink-0"
                    title={t('cart.remove')}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {submitError && (
          <div className="mx-6 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 text-red-700 text-sm">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <p>{submitError}</p>
          </div>
        )}

        {submitSuccess && (
          <div className="mx-6 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm font-medium">
            ✓ {t('cart.submitSuccess')}
          </div>
        )}

        <div className="sticky bottom-0 bg-surface-container-lowest border-t border-outline-variant/15 px-6 py-4 space-y-2">
          <button
            onClick={handleSubmit}
            disabled={cartItems.length === 0 || isSubmitting}
            className={`w-full py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
              isSubmitting || cartItems.length === 0
                ? 'bg-primary/50 text-on-primary/50 cursor-not-allowed'
                : 'bg-primary text-on-primary hover:shadow-md'
            }`}
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin" />
                {t('cart.submit')}...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                {t('cart.submit')}
              </>
            )}
          </button>
          {cartItems.length > 0 && (
            <button
              onClick={() => clearCart()}
              className="w-full py-2 rounded-lg text-on-surface-variant hover:bg-surface-container transition-colors text-sm font-medium"
            >
              {t('cart.clear')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
