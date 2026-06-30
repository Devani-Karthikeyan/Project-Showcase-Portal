import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth, BACKEND_URL } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { Bell, Search, LogOut, Check, ArrowRight, Menu, ChevronDown, Layers, Sun, Moon } from 'lucide-react';

export default function Navbar({ isSidebarOpen, setIsSidebarOpen }) {
  const { user, logout, isAuthenticated, currentTheme, toggleTheme } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  console.log("DEBUG Navbar user details:", user, "BACKEND_URL:", BACKEND_URL);

  const getAvatar = () => {
    if (user?.avatarUrl && user.avatarUrl.startsWith('http')) return user.avatarUrl;
    if (user?.avatarUrl) return `${BACKEND_URL}${user.avatarUrl}`;
    return `https://api.dicebear.com/7.x/notionists/svg?seed=${user?.name || 'User'}`;
  };

  const timeAgo = (dateStr) => {
    const diff = new Date() - new Date(dateStr);
    const mins = Math.floor(diff / (1000 * 60));
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days === 1) return '1d ago';
    if (days < 30) return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString();
  };
  
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [navSearch, setNavSearch] = useState('');
  
  const notifRef = useRef(null);
  const profileRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifDropdown(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfileDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = async (notif) => {
    await markAsRead(notif._id);
    setShowNotifDropdown(false);
    if (notif.projectId) {
      navigate(`/projects/${notif.projectId}`);
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 w-full h-[76px] bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0">
      
      {/* Left section: Logo & Hamburger Menu */}
      <div className="flex items-center gap-4">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-brand-blue/10 flex items-center justify-center text-brand-blue shadow-sm">
            <Layers className="w-5 h-5 fill-brand-blue" />
          </div>
          <div className="flex flex-col hidden sm:flex">
            <span className="font-extrabold text-[15px] leading-tight text-slate-900 font-display">Student Project</span>
            <span className="font-extrabold text-[15px] leading-tight text-slate-900 font-display">Showcase Portal</span>
          </div>
        </Link>

        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2.5 ml-12 hover:bg-slate-50 transition text-slate-500 cursor-pointer ml-2"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Middle section: Central Search Input */}
      <div className="hidden md:flex flex-1 max-w-2xl mx-8 relative">
        <Search className="absolute left-4 top-3.5 w-[18px] h-[18px] text-slate-400" />
        <input
          type="text"
          placeholder="Search projects, technologies, students..."
          value={navSearch}
          onChange={(e) => {
            const val = e.target.value;
            setNavSearch(val);
            const path = location.pathname;
            if (path === '/dashboard' || path === '/bookmarks') {
              navigate(`${path}?search=${encodeURIComponent(val.trim())}`, { replace: true });
            } else {
              navigate(`/explore?search=${encodeURIComponent(val.trim())}`, { replace: true });
            }
          }}
          className="w-full pl-12 pr-12 py-3 rounded-xl border border-slate-200 bg-white text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:border-slate-300 focus:shadow-sm transition"
        />
        <div className="absolute right-3 top-2.5 px-2 py-0.5 rounded border border-slate-200 text-slate-400 text-xs font-medium">
          <Search className="w-3.5 h-3.5" />
        </div>
      </div>

      {/* Right section: Notifications and Profile */}
      <div className="flex items-center gap-6">
        <button 
          onClick={toggleTheme}
          className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center text-slate-650 hover:bg-slate-50 transition cursor-pointer shrink-0"
          title={currentTheme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {currentTheme === 'dark' ? <Sun className="w-4 h-4 text-amber-500 animate-pulse" /> : <Moon className="w-4 h-4 text-slate-600" />}
        </button>

        {isAuthenticated ? (
          <>
            {/* Notifications Bell */}
            <div className="relative" ref={notifRef}>
              {showNotifDropdown && (
                <div 
                  className="fixed inset-0 bg-black/60 backdrop-blur-[4px] z-40 cursor-default"
                  onClick={() => setShowNotifDropdown(false)}
                />
              )}
              <button
                onClick={() => setShowNotifDropdown(!showNotifDropdown)}
                className="relative p-2 hover:bg-slate-50 rounded-full transition cursor-pointer text-slate-600 z-50"
              >
                <Bell className="w-6 h-6" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-brand-blue text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                    {unreadCount}
                  </span>
                )}
              </button>
 
              {/* Notification Dropdown Panel */}
              {showNotifDropdown && (
                <div className="absolute right-0 mt-3 w-[360px] rounded-2xl border border-slate-200 bg-white shadow-2xl flex flex-col z-50 overflow-hidden">
                  <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 notif-popup-header">
                    <span className="font-bold text-[15px] text-slate-800 font-display">Notifications</span>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className="text-xs text-brand-blue hover:text-brand-blue-hover font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" /> Mark all read
                      </button>
                    )}
                  </div>

                  <div className="flex flex-col max-h-[380px] overflow-y-auto divide-y divide-slate-100">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center text-slate-400 text-sm italic">
                        No notifications yet.
                      </div>
                    ) : (
                      notifications.map((notif) => (
                        <div
                          key={notif._id}
                          onClick={() => handleNotificationClick(notif)}
                          className={`p-4 cursor-pointer hover:bg-slate-50 transition flex gap-3 items-start relative ${
                            !notif.isRead ? 'bg-blue-50/20' : ''
                          }`}
                        >
                          {/* Sender Profile Pic */}
                          <div className="relative shrink-0 mt-0.5">
                            <img
                              src={
                                notif.senderId?.avatarUrl
                                  ? (notif.senderId.avatarUrl.startsWith('http') ? notif.senderId.avatarUrl : `${BACKEND_URL}${notif.senderId.avatarUrl}`)
                                  : `https://api.dicebear.com/7.x/notionists/svg?seed=${notif.senderId?.name || 'System'}`
                              }
                              alt="avatar"
                              className="w-10 h-10 rounded-full border border-slate-150 object-cover bg-slate-50"
                            />
                            {!notif.isRead && (
                              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-brand-blue border-2 border-white"></span>
                            )}
                          </div>

                          {/* Message details */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-baseline justify-between gap-2 mb-0.5">
                              <span className="text-[13px] font-bold text-slate-900 truncate">
                                {notif.senderId?.name || 'System Notification'}
                              </span>
                              <span className="text-[10px] text-slate-400 font-bold shrink-0">
                                {timeAgo(notif.createdAt)}
                              </span>
                            </div>
                            {notif.senderId?.role && (
                              <span className="text-[10px] font-bold text-slate-400 capitalize block mb-1">
                                {notif.senderId.role}
                              </span>
                            )}
                            <p className="text-[13px] text-slate-600 leading-normal font-medium break-words">
                              {notif.message}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Profile Avatar & Details Dropdown */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                className="flex items-center gap-3 p-1 pl-2 pr-3 rounded-full hover:bg-slate-50 transition cursor-pointer"
              >
                <img
                  src={getAvatar()}
                  alt={user?.name}
                  className="w-10 h-10 rounded-full border border-slate-200 object-cover"
                />
                <div className="flex flex-col items-start hidden sm:flex">
                  <span className="text-sm font-bold text-slate-900 leading-tight">{user.name}</span>
                  <span className="text-[11px] font-medium text-slate-500 capitalize leading-tight mt-0.5">{user.role}</span>
                </div>
                <ChevronDown className="w-4 h-4 text-slate-400 ml-1" />
              </button>

              {showProfileDropdown && (
                <div className="absolute right-0 mt-3 w-52 p-2 rounded-xl border border-slate-200 bg-white shadow-2xl flex flex-col gap-1 z-50">
                  <div className="px-3 py-3 border-b border-slate-100 mb-1 flex flex-col sm:hidden">
                    <span className="text-sm font-bold text-slate-900">{user.name}</span>
                    <span className="text-xs text-slate-500 capitalize">{user.role}</span>
                  </div>

                  <Link
                    to="/dashboard"
                    onClick={() => setShowProfileDropdown(false)}
                    className="flex items-center gap-2 p-2.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-50 text-sm font-medium transition"
                  >
                    My Dashboard
                  </Link>

                  <button
                    onClick={() => {
                      logout();
                      setShowProfileDropdown(false);
                      navigate('/');
                    }}
                    className="flex items-center gap-2 p-2.5 rounded-lg text-rose-500 hover:bg-rose-50 text-sm font-medium transition cursor-pointer text-left w-full"
                  >
                    <LogOut className="w-4 h-4" /> Sign Out
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <Link
            to="/login"
            className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-brand-blue text-white font-bold text-sm hover:bg-brand-blue-hover transition shadow-sm cursor-pointer"
          >
            <span>Sign In</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        )}
      </div>
    </nav>
  );
}
