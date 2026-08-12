const fs = require('fs');

let content = fs.readFileSync('src/components/AuthModal.tsx', 'utf8');

// Add Loader2 import if not present
if (!content.includes('Loader2')) {
  content = content.replace('X, Mail, Lock, User, AlertCircle', 'X, Mail, Lock, User, AlertCircle, Loader2');
}

// Add timeout wrapper function
const timeoutFn = `
  const withTimeout = (promise: Promise<any>, ms: number = 10000) => {
    return Promise.race([
      promise,
      new Promise((_, reject) => setTimeout(() => reject(new Error("Request timed out. Please try again.")), ms))
    ]);
  };
`;
if (!content.includes('withTimeout')) {
  content = content.replace('export function AuthModal({ isOpen, onClose }: AuthModalProps) {', timeoutFn + '\nexport function AuthModal({ isOpen, onClose }: AuthModalProps) {');
}

// Use withTimeout for signUp and signInWithPassword
content = content.replace('await supabase.auth.signUp', 'await withTimeout(supabase.auth.signUp');
content = content.replace('data: { name }\n          }\n        });', 'data: { name }\n          }\n        }));');

content = content.replace('await supabase.auth.signInWithPassword', 'await withTimeout(supabase.auth.signInWithPassword');
content = content.replace('password,\n        });', 'password,\n        }));');

// Add a visible spinner to the button
content = content.replace(
  "{loading ? t('auth.wait') : (isSignUp ? t('auth.signUp') : t('auth.signIn'))}",
  "{loading ? (<span className=\"flex items-center justify-center\"><Loader2 className=\"w-4 h-4 mr-2 animate-spin\" /> {t('auth.wait')}</span>) : (isSignUp ? t('auth.signUp') : t('auth.signIn'))}"
);

fs.writeFileSync('src/components/AuthModal.tsx', content);
