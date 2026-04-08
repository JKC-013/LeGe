import React, { useState, useRef, useEffect } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useStore } from '../store';
import { Globe, LogOut, User as UserIcon, ChevronDown, Menu, X, Bookmark } from 'lucide-react';
import { AuthModal } from './AuthModal';

export function Layout() {
  const { t, i18n } = useTranslation();
  const { currentUser, logout } = useStore();
  const navigate = useNavigate();
  const [langOpen, setLangOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.documentElement.lang = i18n.language;
    function handleClickOutside(event: MouseEvent) {
      if (langRef.current && !langRef.current.contains(event.target as Node)) {
        setLangOpen(false);
      }
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMobileMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    setLangOpen(false);
  };

  const handleLogin = () => {
    setIsAuthModalOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col font-sans relative">
      {/* Subtle Music Background */}
      <div className="fixed inset-0 z-[-1] pointer-events-none overflow-hidden bg-surface">
        <svg className="absolute w-full h-full opacity-50 text-primary" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="music-bg" x="0" y="0" width="800" height="800" patternUnits="userSpaceOnUse">
              {/* Abstract Staff Lines */}
              <g stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.6">
                <path d="M0 200 Q 200 150 400 200 T 800 200" />
                <path d="M0 220 Q 200 170 400 220 T 800 220" />
                <path d="M0 240 Q 200 190 400 240 T 800 240" />
                <path d="M0 260 Q 200 210 400 260 T 800 260" />
                <path d="M0 280 Q 200 230 400 280 T 800 280" />

                <path d="M0 600 Q 200 650 400 600 T 800 600" />
                <path d="M0 620 Q 200 670 400 620 T 800 620" />
                <path d="M0 640 Q 200 690 400 640 T 800 640" />
                <path d="M0 660 Q 200 710 400 660 T 800 660" />
                <path d="M0 680 Q 200 730 400 680 T 800 680" />
              </g>
              {/* Musical Notes */}
              <g fill="currentColor" fontFamily="serif" fontSize="70" opacity="0.9">
                <text x="80" y="260">𝄞</text>
                <text x="300" y="220">♪</text>
                <text x="450" y="270">♫</text>
                <text x="650" y="210">♩</text>
                
                <text x="120" y="660">𝄢</text>
                <text x="350" y="630">♬</text>
                <text x="550" y="670">♪</text>
                <text x="750" y="620">♫</text>
              </g>
            </pattern>
          </defs>
          <rect x="0" y="0" width="100%" height="100%" fill="url(#music-bg)" />
        </svg>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-surface/50 to-surface"></div>
      </div>

      <header className="bg-surface/80 backdrop-blur-[24px] sticky top-0 z-50 border-b border-outline-variant/15">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary-container rounded-xl flex items-center justify-center text-on-primary font-display font-bold text-xl shadow-ambient group-hover:scale-105 transition-transform">
              L
            </div>
            <span className="text-xl font-display font-bold tracking-tight text-on-surface hidden sm:inline">
              Lege's Music
            </span>
          </Link>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-2">
            <Link to="/" className="text-on-surface-variant hover:text-primary hover:bg-surface-container px-4 py-2 rounded-full font-medium transition-all text-sm">{t('nav.home')}</Link>
            {currentUser && (
              <>
                <Link to="/favourites" className="text-on-surface-variant hover:text-primary hover:bg-surface-container px-4 py-2 rounded-full font-medium transition-all text-sm">{t('nav.favourites')}</Link>
                <Link to="/collection" className="text-on-surface-variant hover:text-primary hover:bg-surface-container px-4 py-2 rounded-full font-medium transition-all text-sm flex items-center gap-1">
                  <Bookmark className="w-4 h-4" />
                  {t('nav.bookmark')}
                </Link>
              </>
            )}
            {(currentUser?.role === 'publisher' || currentUser?.role === 'admin') && (
              <Link to="/publisher" className="text-on-surface-variant hover:text-primary hover:bg-surface-container px-4 py-2 rounded-full font-medium transition-all text-sm">{t('nav.publisher')}</Link>
            )}
            {currentUser?.role === 'admin' && (
              <Link to="/admin" className="text-on-surface-variant hover:text-primary hover:bg-surface-container px-4 py-2 rounded-full font-medium transition-all text-sm">{t('nav.admin')}</Link>
            )}
          </nav>

          {/* Actions */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Mobile Menu Button */}
            <div className="relative md:hidden" ref={menuRef}>
              <button 
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 text-on-surface-variant hover:text-primary hover:bg-surface-container rounded-full transition-all"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
              
              {mobileMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-surface-container-lowest rounded-xl shadow-ambient border border-outline-variant/15 py-2 z-20 overflow-hidden">
                  <Link to="/" onClick={() => setMobileMenuOpen(false)} className="block px-4 py-2 text-on-surface-variant hover:text-primary hover:bg-surface-container transition-all">{t('nav.home')}</Link>
                  {currentUser && (
                    <>
                      <Link to="/favourites" onClick={() => setMobileMenuOpen(false)} className="block px-4 py-2 text-on-surface-variant hover:text-primary hover:bg-surface-container transition-all">{t('nav.favourites')}</Link>
                      <Link to="/collection" onClick={() => setMobileMenuOpen(false)} className="block px-4 py-2 text-on-surface-variant hover:text-primary hover:bg-surface-container transition-all flex items-center gap-2">
                        <Bookmark className="w-4 h-4" />
                        {t('nav.bookmark')}
                      </Link>
                    </>
                  )}
                  {(currentUser?.role === 'publisher' || currentUser?.role === 'admin') && (
                    <Link to="/publisher" onClick={() => setMobileMenuOpen(false)} className="block px-4 py-2 text-on-surface-variant hover:text-primary hover:bg-surface-container transition-all">{t('nav.publisher')}</Link>
                  )}
                  {currentUser?.role === 'admin' && (
                    <Link to="/admin" onClick={() => setMobileMenuOpen(false)} className="block px-4 py-2 text-on-surface-variant hover:text-primary hover:bg-surface-container transition-all">{t('nav.admin')}</Link>
                  )}
                </div>
              )}
            </div>

            {/* Language Selector */}
            <div className="relative" ref={langRef}>
              <button 
                onClick={() => setLangOpen(!langOpen)} 
                className="flex items-center space-x-1 text-on-surface-variant hover:text-primary hover:bg-surface-container px-2 sm:px-3 py-2 rounded-full transition-all text-sm"
              >
                <Globe className="w-5 h-5" />
                <span className="hidden sm:inline font-medium uppercase">{i18n.language}</span>
                <ChevronDown className="w-4 h-4" />
              </button>
              
              {langOpen && (
                <div className="absolute right-0 mt-2 w-32 bg-surface-container-lowest rounded-xl shadow-ambient border border-outline-variant/15 py-1 z-20 overflow-hidden">
                  <button 
                    onClick={() => changeLanguage('zh')}
                    className={`block w-full text-left px-4 py-2.5 text-sm transition-colors ${i18n.language === 'zh' ? 'bg-surface-container text-primary font-bold' : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'}`}
                  >
                    繁體中文
                  </button>
                  <button 
                    onClick={() => changeLanguage('vi')}
                    className={`block w-full text-left px-4 py-2.5 text-sm transition-colors ${i18n.language === 'vi' ? 'bg-surface-container text-primary font-bold' : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'}`}
                  >
                    Tiếng Việt
                  </button>
                </div>
              )}
            </div>
            
            {currentUser ? (
              <div className="flex items-center space-x-2">
                <span className="text-xs sm:text-sm font-medium text-on-surface-variant hidden sm:inline-block truncate max-w-[100px]">{currentUser.email}</span>
                <button onClick={() => { logout(); navigate('/'); setMobileMenuOpen(false); }} className="text-on-surface-variant hover:text-primary hover:bg-surface-container p-2 rounded-full transition-all" title={t('nav.logout')}>
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <button onClick={handleLogin} className="flex items-center space-x-1 sm:space-x-2 px-3 sm:px-6 py-2 bg-primary text-on-primary rounded-full hover:bg-primary-container transition-colors text-xs sm:text-sm font-medium shadow-ambient">
                <UserIcon className="w-4 h-4" />
                <span>{t('nav.login')}</span>
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
        <Outlet />
      </main>
      
      <footer className="border-t border-[#E5E0D8] py-8 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-[#8C9A94] text-sm">
          &copy; {new Date().getFullYear()} Lege's Music. All rights reserved.
        </div>
      </footer>

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </div>
  );
}
