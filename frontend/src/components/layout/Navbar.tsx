import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Search,
  Bell,
  Plus,
  User,
  LogOut,
  Sliders,
  CheckCircle2,
  Layers,
  ChevronDown,
  Trophy,
  Menu,
  X
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { getInitials } from '../../utils/stringUtils';
import { useNotificationStore } from '../../store/notificationStore';
import { useActivityStore } from '../../store/activityStore';
import { apiClient } from '../../services/apiClient';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileNav, setShowMobileNav] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchMode, setSearchMode] = useState<'records' | 'ai'>('records');
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);
  const [aiSources, setAiSources] = useState<any[]>([]);
  const [isAskingAi, setIsAskingAi] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const { notifications, markAsRead, markAllAsRead } = useNotificationStore();

  const handleAskAi = async () => {
    if (!searchQuery.trim()) return;
    setIsAskingAi(true);
    setSearchError(null);
    setAiAnswer(null);
    setAiSources([]);
    try {
      const res: any = await apiClient.search.ask(searchQuery.trim());
      setAiAnswer(res.data?.answer || res.answer || 'No answer generated.');
      setAiSources(res.data?.sources || res.sources || []);
    } catch (err: any) {
      console.error('AI assistant ask failed:', err);
      setSearchError('Failed to get answer from AI Assistant.');
    } finally {
      setIsAskingAi(false);
    }
  };

  useEffect(() => {
    if (searchMode === 'ai') return;
    const q = searchQuery.trim();
    if (!q) {
      setSearchResults([]);
      setIsSearching(false);
      setSearchError(null);
      return;
    }

    setIsSearching(true);
    setSearchError(null);

    const debounceId = setTimeout(async () => {
      try {
        const response: any = await apiClient.activities.getAll({ q, limit: 15 });
        const results = response.data?.activities || response.activities || [];
        setSearchResults(results);
      } catch (err: any) {
        setSearchError('Search failed. Please try again.');
        console.error('Search error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 400);

    return () => clearTimeout(debounceId);
  }, [searchQuery]);

  const navRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
        setShowNotifications(false);
        setShowSearch(false);
        setShowMobileNav(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowUserMenu(false);
        setShowNotifications(false);
        setShowSearch(false);
        setShowMobileNav(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Records', path: '/records' },
    { name: 'Goals', path: '/achieved-goals' },
    { name: 'Reports', path: '/reports' },
    { name: 'Insights', path: '/insights' },
    { name: 'Profile', path: '/profile' },
  ];

  return (
    <header className="navbar-header-container" style={{
      position: 'sticky',
      top: 0,
      zIndex: 40,
      backgroundColor: 'rgba(245, 237, 224, 0.90)',
      backdropFilter: 'blur(16px)',
      borderBottom: '1px solid rgba(139, 90, 43, 0.12)',
      padding: '0.85rem 2rem',
    }}>
      <div style={{
        maxWidth: '1280px',
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        {/* Left: Brand Logo & Navigation */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          <NavLink to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', textDecoration: 'none' }}>
            {/* Logo Icon */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '2.5px',
              padding: '4px',
              borderRadius: '6px',
              background: 'rgba(124, 77, 46, 0.15)',
              border: '1px solid rgba(124, 77, 46, 0.35)',
            }}>
              <div style={{ width: '6px', height: '6px', backgroundColor: '#C8874A', borderRadius: '1.5px' }} />
              <div style={{ width: '6px', height: '6px', backgroundColor: '#7C4D2E', borderRadius: '1.5px' }} />
              <div style={{ width: '6px', height: '6px', backgroundColor: '#7C4D2E', borderRadius: '1.5px' }} />
              <div style={{ width: '6px', height: '6px', backgroundColor: '#C8874A', borderRadius: '1.5px' }} />
            </div>
            <span style={{
              fontSize: '1.25rem',
              fontWeight: 800,
              letterSpacing: '-0.02em',
              color: '#2C1810',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
            }}>
              WorkLog <span style={{ color: '#7C4D2E' }}>AI</span>
            </span>
          </NavLink>

          {/* Navigation Links */}
          <nav className="nav-desktop-links" style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
            {navLinks.map((link) => (
              <NavLink
                key={link.name}
                to={link.path}
                style={({ isActive }) => ({
                  color: isActive ? '#2C1810' : '#7A6355',
                  fontSize: '0.9rem',
                  fontWeight: isActive ? 600 : 500,
                  textDecoration: 'none',
                  position: 'relative',
                  padding: '0.4rem 0',
                  transition: 'color 0.2s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                })}
              >
                {({ isActive }) => (
                  <>
                    <span>{link.name}</span>
                    {isActive && (
                      <div style={{
                        position: 'absolute',
                        bottom: '-4px',
                        width: '4px',
                        height: '4px',
                        borderRadius: '50%',
                        backgroundColor: '#7C4D2E',
                        boxShadow: '0 0 8px rgba(124, 77, 46, 0.6)',
                      }} />
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Right: Actions & User */}
        <div ref={navRef} className="navbar-actions-group" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          {/* Search Trigger */}
          <button
            onClick={() => setShowSearch(!showSearch)}
            aria-label="Search"
            className="navbar-search-btn"
            style={{
              background: 'rgba(124, 77, 46, 0.06)',
              border: '1px solid rgba(139, 90, 43, 0.15)',
              color: '#7A6355',
              borderRadius: '9999px',
              padding: '0.45rem 0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.8rem',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            <Search size={14} />
            <span className="navbar-search-text" style={{ color: '#A89080' }}>Search records...</span>
          </button>

          {/* Search Dropdown */}
          {showSearch && (
            <div className="navbar-search-dropdown">
              {/* Mode Switcher */}
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setSearchMode('records')}
                  style={{
                    flex: 1,
                    padding: '0.35rem',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: searchMode === 'records' ? '#7C4D2E' : 'rgba(139, 90, 43, 0.08)',
                    color: searchMode === 'records' ? 'white' : '#4A2E1A',
                    cursor: 'pointer',
                  }}
                >
                  Work Records
                </button>
                <button
                  type="button"
                  onClick={() => setSearchMode('ai')}
                  style={{
                    flex: 1,
                    padding: '0.35rem',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: searchMode === 'ai' ? '#7C4D2E' : 'rgba(139, 90, 43, 0.08)',
                    color: searchMode === 'ai' ? 'white' : '#4A2E1A',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.3rem',
                  }}
                >
                  <Sparkles size={12} />
                  <span>Ask AI Assistant</span>
                </button>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                <input
                  autoFocus
                  placeholder={searchMode === 'records' ? 'Search records...' : 'Ask anything about your work...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && searchMode === 'ai') {
                      handleAskAi();
                    }
                  }}
                  style={{ flex: 1, padding: '0.5rem', borderRadius: '8px', border: '1px solid #ccc', fontSize: '0.85rem' }}
                />
                {searchMode === 'ai' && (
                  <button
                    onClick={handleAskAi}
                    disabled={isAskingAi || !searchQuery.trim()}
                    className="btn-primary"
                    style={{ padding: '0.5rem 0.85rem', fontSize: '0.8rem' }}
                  >
                    {isAskingAi ? 'Asking...' : 'Ask'}
                  </button>
                )}
              </div>

              <div style={{ maxHeight: '400px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {searchMode === 'ai' ? (
                  <div>
                    {isAskingAi && (
                      <div style={{ fontSize: '0.85rem', color: '#7A6355', padding: '1rem', textAlign: 'center' }}>
                        Retrieving relevant chunks and consulting Gemini...
                      </div>
                    )}
                    {aiAnswer && (
                      <div style={{ backgroundColor: 'rgba(124, 77, 46, 0.06)', borderRadius: '10px', padding: '1rem', border: '1px solid rgba(124, 77, 46, 0.15)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#7C4D2E', fontWeight: 700, fontSize: '0.8rem', marginBottom: '0.5rem' }}>
                          <Sparkles size={13} />
                          <span>AI Answer</span>
                        </div>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: '#2C1810', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                          {aiAnswer}
                        </p>
                        {aiSources.length > 0 && (
                          <div style={{ marginTop: '0.75rem', paddingTop: '0.5rem', borderTop: '1px solid rgba(124, 77, 46, 0.1)' }}>
                            <div style={{ fontSize: '0.7rem', color: '#A89080', fontWeight: 700, marginBottom: '0.35rem' }}>
                              SOURCES CITED ({aiSources.length})
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                              {aiSources.slice(0, 3).map((s, idx) => (
                                <div key={idx} style={{ fontSize: '0.75rem', color: '#7A6355', backgroundColor: 'rgba(255, 255, 255, 0.7)', padding: '0.35rem 0.5rem', borderRadius: '6px' }}>
                                  <strong>{s.project || 'Project'}:</strong> {s.text?.slice(0, 70)}...
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    {!isAskingAi && !aiAnswer && (
                      <div style={{ fontSize: '0.85rem', color: '#A89080', padding: '1rem', textAlign: 'center' }}>
                        Type a question and press Ask to query your grounded work history with RAG.
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    {!searchQuery.trim() && (
                      <div style={{ fontSize: '0.85rem', color: '#A89080', padding: '1rem', textAlign: 'center' }}>
                        Type to search across all records...
                      </div>
                    )}
                    {isSearching && (
                      <div style={{ fontSize: '0.85rem', color: '#7A6355', padding: '1rem', textAlign: 'center' }}>
                        Searching...
                      </div>
                    )}
                    {searchError && (
                      <div style={{ fontSize: '0.85rem', color: '#D32F2F', padding: '1rem', textAlign: 'center' }}>
                        {searchError}
                      </div>
                    )}
                    {!isSearching && !searchError && searchQuery.trim() && searchResults.length === 0 && (
                      <div style={{ fontSize: '0.85rem', color: '#7A6355', padding: '1rem', textAlign: 'center' }}>
                        No results found for "{searchQuery}"
                      </div>
                    )}
                    {!isSearching && searchResults.map(res => (
                      <div key={res.id || res._id} onClick={() => { setShowSearch(false); navigate(`/records/${res.id || res._id}`); }} className="glass-card-interactive" style={{ cursor: 'pointer', padding: '0.85rem', borderRadius: '8px', border: '1px solid rgba(139, 90, 43, 0.1)', background: 'rgba(254, 252, 248, 0.9)' }}>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#2C1810' }}>{res.title || res.project || 'Work Entry'}</div>
                        <div style={{ fontSize: '0.75rem', color: '#7A6355', margin: '0.3rem 0' }}>
                          <span className="tag-chip" style={{ fontSize: '0.65rem', padding: '0.15rem 0.4rem', marginRight: '0.4rem' }}>{res.category}</span>
                          {res.workType && <span style={{ marginRight: '0.4rem' }}>{res.workType}</span>}
                          {res.workDate && `• ${new Date(res.workDate).toLocaleDateString()}`}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#4A2E1A', marginTop: '0.4rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: '1.4' }}>
                          {res.aiRefinedText || res.text}
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>
          )}

          {/* Notification Bell */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#7A6355',
                cursor: 'pointer',
                padding: '0.4rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%',
                position: 'relative',
              }}
            >
              <Bell size={18} />
              <span style={{
                position: 'absolute',
                top: '4px',
                right: '4px',
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                backgroundColor: '#C8874A',
              }} />
            </button>

            {/* Notification Dropdown */}
            {showNotifications && (
              <div style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: 0,
                width: '280px',
                maxWidth: 'calc(100vw - 16px)',
                backgroundColor: '#FEFCF8',
                border: '1px solid rgba(139, 90, 43, 0.15)',
                borderRadius: '14px',
                padding: '1rem',
                boxShadow: '0 12px 30px rgba(124, 77, 46, 0.12)',
                zIndex: 50,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#2C1810' }}>Notifications</span>
                  <span onClick={markAllAsRead} style={{ fontSize: '0.75rem', color: '#7C4D2E', cursor: 'pointer' }}>Mark all read</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  {notifications.length === 0 && <div style={{ fontSize: '0.8rem', color: '#7A6355' }}>No notifications</div>}
                  {notifications.map(n => (
                    <div
                      key={n.id}
                      onClick={() => {
                        markAsRead(n.id);
                        setShowNotifications(false);
                        if (n.targetRoute) navigate(n.targetRoute);
                      }}
                      style={{ fontSize: '0.8rem', color: n.read ? '#7A6355' : '#4A2E1A', padding: '0.4rem 0', borderBottom: '1px solid rgba(139, 90, 43, 0.08)', cursor: n.targetRoute ? 'pointer' : 'default', fontWeight: n.read ? 'normal' : 'bold' }}
                    >
                      {n.title}: {n.message}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Primary CTA: Add Today's Work */}
          {/* <button
            onClick={() => navigate('/add-work')}
            className="btn-primary"
            style={{
              padding: '0.5rem 1.15rem',
              fontSize: '0.85rem',
              fontWeight: 600,
            }}
          >
            <Plus size={16} strokeWidth={2.5} />
            <span>Add Today's Work</span>
          </button> */}

          {/* User Profile Avatar KD */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                backgroundColor: '#FEFCF8',
                border: '2px solid rgba(139, 90, 43, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#7C4D2E',
                fontWeight: 700,
                fontSize: '0.875rem',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(124, 77, 46, 0.2)',
              }}
            >
              {user?.initials || getInitials(user?.name)}
            </button>

            {/* Profile Dropdown */}
            {showUserMenu && (
              <div style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: 0,
                width: '230px',
                maxWidth: 'calc(100vw - 16px)',
                backgroundColor: '#FEFCF8',
                border: '1px solid rgba(139, 90, 43, 0.15)',
                borderRadius: '14px',
                padding: '0.75rem',
                boxShadow: '0 12px 30px rgba(124, 77, 46, 0.12)',
                zIndex: 50,
              }}>
                <div style={{ padding: '0.5rem 0.6rem', borderBottom: '1px solid rgba(139, 90, 43, 0.1)', marginBottom: '0.4rem' }}>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#2C1810' }}>{user?.name || ''}</div>
                  <div style={{ fontSize: '0.75rem', color: '#7A6355' }}>{user?.jobRole || ''}</div>
                </div>
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    navigate('/achieved-goals');
                  }}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.6rem',
                    padding: '0.5rem 0.6rem',
                    backgroundColor: 'transparent',
                    border: 'none',
                    color: '#4A2E1A',
                    fontSize: '0.825rem',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(124, 77, 46, 0.07)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <Trophy size={14} color="#7A6355" />
                  <span>Achieved Goals</span>
                </button>
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    navigate('/profile');
                  }}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.6rem',
                    padding: '0.5rem 0.6rem',
                    backgroundColor: 'transparent',
                    border: 'none',
                    color: '#4A2E1A',
                    fontSize: '0.825rem',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(124, 77, 46, 0.07)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <Sliders size={14} color="#7A6355" />
                  <span>Work Profile Setup</span>
                </button>
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    logout();
                    navigate('/login');
                  }}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.6rem',
                    padding: '0.5rem 0.6rem',
                    backgroundColor: 'transparent',
                    border: 'none',
                    color: '#F87171',
                    fontSize: '0.825rem',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <LogOut size={14} />
                  <span>Log Out</span>
                </button>
              </div>
            )}
          </div>

          {/* Mobile Hamburger Toggle Button */}
          <button
            onClick={() => setShowMobileNav(!showMobileNav)}
            aria-label="Toggle navigation menu"
            className="nav-mobile-toggle"
            style={{
              background: 'rgba(124, 77, 46, 0.08)',
              border: '1px solid rgba(139, 90, 43, 0.15)',
              borderRadius: '8px',
              padding: '0.45rem',
              color: '#2C1810',
              cursor: 'pointer',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {showMobileNav ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {showMobileNav && (
        <div
          className="nav-mobile-drawer glass-panel"
          style={{
            position: 'absolute',
            top: '100%',
            left: '8px',
            right: '8px',
            backgroundColor: 'rgba(254, 252, 248, 0.98)',
            border: '1px solid rgba(139, 90, 43, 0.18)',
            borderRadius: '16px',
            padding: '1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
            boxShadow: '0 16px 36px rgba(124, 77, 46, 0.18)',
            zIndex: 60,
          }}
        >
          {navLinks.map((link) => (
            <NavLink
              key={link.name}
              to={link.path}
              onClick={() => setShowMobileNav(false)}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.75rem 1rem',
                borderRadius: '10px',
                textDecoration: 'none',
                fontSize: '0.95rem',
                fontWeight: isActive ? 700 : 500,
                color: isActive ? '#FFFFFF' : '#4A2E1A',
                backgroundColor: isActive ? '#7C4D2E' : 'rgba(124, 77, 46, 0.05)',
                transition: 'all 0.15s ease',
              })}
            >
              <span>{link.name}</span>
              <ChevronDown size={14} style={{ transform: 'rotate(-90deg)', opacity: 0.6 }} />
            </NavLink>
          ))}
          <button
            onClick={() => {
              setShowMobileNav(false);
              navigate('/add-work');
            }}
            className="btn-primary"
            style={{
              marginTop: '0.5rem',
              padding: '0.75rem',
              width: '100%',
              borderRadius: '9999px',
              justifyContent: 'center',
            }}
          >
            <Plus size={16} />
            <span>Add Today's Work</span>
          </button>
        </div>
      )}
    </header>
  );
};
