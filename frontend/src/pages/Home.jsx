import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth, BACKEND_URL } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import RegisterModal from '../components/RegisterModal';
import Login from './Login';
import { 
  Layers, Sun, Moon, Sparkles, ArrowRight, GraduationCap, 
  Users, Folder, Building2, Heart, CloudUpload, Eye,
  Layout, Smartphone, Database, Globe, ChevronDown, LogOut,
  Bell, Check
} from 'lucide-react';

export default function Home() {
  const { user, logout, isAuthenticated, currentTheme, toggleTheme } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  console.log("DEBUG Home user details:", user);
  const navigate = useNavigate();
  const location = useLocation();
  const [popularProjects, setPopularProjects] = useState([]);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const showLoginModal = location.pathname === '/login';

  const profileRef = useRef(null);
  const notifRef = useRef(null);

  useEffect(() => {
    if (location.search.includes('register=true')) {
      setShowRegisterModal(true);
      navigate('/', { replace: true });
    }
  }, [location, navigate]);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfileDropdown(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifDropdown(false);
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

  useEffect(() => {
    const fetchPopular = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
        const res = await fetch(`${BACKEND_URL}/api/projects`, { headers });
        if (res.ok) {
          const data = await res.json();
          // Sort by likes and take top 4
          const sorted = data.sort((a, b) => (b.likesCount || 0) - (a.likesCount || 0)).slice(0, 4);
          setPopularProjects(sorted);
        }
      } catch (err) {
        console.error('Error fetching popular projects:', err);
      }
    };
    fetchPopular();
  }, []);

  const handleLike = async (e, projectId, currentlyLiked) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      alert('Please log in to like projects');
      return;
    }

    const token = localStorage.getItem('token');
    const endpoint = currentlyLiked ? 'unlike' : 'like';
    try {
      const res = await fetch(`${BACKEND_URL}/api/projects/${projectId}/${endpoint}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setPopularProjects(prev => prev.map(p => 
          p._id === projectId ? { ...p, userLiked: !currentlyLiked, likesCount: data.likesCount } : p
        ));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const thumbnailSrc = (project) => project.thumbnail
    ? (project.thumbnail.startsWith('data:') ? project.thumbnail : `${BACKEND_URL}${project.thumbnail}`)
    : 'https://via.placeholder.com/600x400?text=Project+Cover';

  return (
    <div className="min-h-screen bg-[#fafbfc] flex flex-col font-sans overflow-x-hidden relative">
      
      {/* Background Dots Pattern (Subtle) */}
      <div className="absolute top-0 right-0 w-1/2 h-screen opacity-40 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>

      {/* Top Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 w-full h-[76px] bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0">
        
        {/* Left: Logo */}
        <div className="flex-1 flex items-center">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-brand-blue/10 flex items-center justify-center text-brand-blue shadow-sm">
              <Layers className="w-5 h-5 fill-brand-blue" />
            </div>
            <div className="flex flex-col hidden sm:flex">
              <span className="font-extrabold text-[15px] leading-tight text-slate-900 font-display">Student Project</span>
              <span className="font-extrabold text-[15px] leading-tight text-slate-900 font-display">Showcase Portal</span>
            </div>
          </Link>
        </div>



        {/* Right: Actions */}
        <div className="flex-1 flex items-center justify-end gap-4">
          <button 
            onClick={toggleTheme}
            className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center text-slate-650 hover:bg-slate-50 transition cursor-pointer"
            title={currentTheme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {currentTheme === 'dark' ? <Sun className="w-4 h-4 text-amber-500 animate-pulse" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>
          {!isAuthenticated ? (
            <Link
              to="/login"
              className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-brand-blue text-white font-bold text-sm hover:bg-brand-blue-hover transition shadow-sm cursor-pointer"
            >
              <span>Sign In</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <>
              {/* Notifications Bell */}
              <div className="relative" ref={notifRef}>
                <button
                  onClick={() => setShowNotifDropdown(!showNotifDropdown)}
                  className="relative p-2 hover:bg-slate-50 rounded-full transition cursor-pointer text-slate-600"
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
                  <div className="absolute right-0 mt-3 w-80 max-h-96 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-2xl flex flex-col z-50">
                    <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 rounded-t-xl">
                      <span className="font-bold text-sm text-slate-800">Notifications</span>
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllAsRead}
                          className="text-xs text-brand-blue hover:text-brand-blue-hover font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" /> Mark all read
                        </button>
                      )}
                    </div>

                    <div className="flex flex-col max-h-80 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-8 text-center text-slate-400 text-sm italic">
                          No notifications yet.
                        </div>
                      ) : (
                        notifications.map((notif) => (
                          <div
                            key={notif._id}
                            onClick={() => handleNotificationClick(notif)}
                            className={`p-4 border-b border-slate-100 cursor-pointer hover:bg-slate-50 transition flex flex-col gap-1.5 ${
                              !notif.isRead ? 'bg-blue-50/20' : ''
                            }`}
                          >
                            <p className="text-sm text-slate-600 leading-relaxed font-medium text-left">{notif.message}</p>
                            <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
                              <span>{new Date(notif.createdAt).toLocaleDateString()}</span>
                              {!notif.isRead && <span className="w-2 h-2 rounded-full bg-brand-blue"></span>}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Profile Avatar & Details Dropdown (Matching Explore/Navbar) */}
              <div className="relative animate-fade-in" ref={profileRef}>
                <button
                  onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                  className="flex items-center gap-3 p-1 pl-2 pr-3 rounded-full hover:bg-slate-50 transition cursor-pointer"
                >
                  <img
                    src={user?.avatarUrl ? (user.avatarUrl.startsWith('http') ? user.avatarUrl : `${BACKEND_URL}${user.avatarUrl}`) : `https://api.dicebear.com/7.x/notionists/svg?seed=${user?.name || 'User'}`}
                    alt={user?.name}
                    className="w-10 h-10 rounded-full border border-slate-205 object-cover shadow-sm"
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
                      className="flex items-center gap-2 p-2.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-50 text-sm font-medium transition text-left"
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
          )}
        </div>
      </nav>

      {/* Main Content Container (Add padding top because navbar is now fixed) */}
      <main className="flex-1 flex flex-col items-center w-full max-w-7xl mx-auto px-6 py-12 pt-[108px] relative z-10">
        
        {/* Hero Section */}
        <div className="w-full grid lg:grid-cols-[1fr_1.1fr] gap-10 lg:gap-6 items-center pt-10 pb-16">
          
          {/* Hero Left: Text Content */}
          <div className="flex flex-col items-start pr-8 mb-30 relative">
            
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-brand-blue/10 mb-6">
              <Sparkles className="w-4 h-4 text-brand-blue" />
              <span className="text-[13px] font-semibold text-slate-800">A platform for students. Built for opportunities.</span>
            </div>

            <h1 className="text-[54px] sm:text-[64px] lg:text-[72px] font-extrabold text-slate-900 leading-[1.05] tracking-tight mb-5 font-display relative z-10">
              Where Ideas <br/>
              Become <span className="text-brand-blue relative inline-block">
                Impact
                <svg className="absolute -bottom-3 left-0 w-full h-5 text-brand-blue" viewBox="0 0 200 20" preserveAspectRatio="none">
                  <path d="M5,15 Q50,5 100,10 T195,15" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round"/>
                  <path d="M10,18 Q60,8 110,12 T190,18" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" opacity="0.6"/>
                </svg>
              </span>
            </h1>

            <p className="text-[16px] text-slate-500 font-medium leading-[1.6] mb-8 max-w-[420px]">
              Showcase your projects, get discovered by recruiters, <br className="hidden sm:block"/>
              and kickstart your career journey.
            </p>

            <div className="flex items-center gap-4 mb-12">
              {isAuthenticated ? (
                <>
                  <Link to="/dashboard" className="flex items-center gap-2 px-7 py-3.5 rounded-xl bg-brand-blue hover:bg-indigo-700 text-white text-[15px] font-semibold transition-colors">
                    Go to Dashboard <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link to="/explore" className="flex items-center gap-2 px-7 py-3.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-[15px] font-semibold transition-colors">
                    Explore Projects
                  </Link>
                </>
              ) : (
                <>
                  <button 
                    onClick={() => navigate('/login')} 
                    className="flex items-center gap-2 px-7 py-3.5 rounded-xl bg-brand-blue hover:bg-indigo-700 text-white text-[15px] font-semibold transition-colors cursor-pointer"
                  >
                    Get Started <ArrowRight className="w-4 h-4" />
                  </button>
                  <Link to="/explore" className="flex items-center gap-2 px-7 py-3.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-[15px] font-semibold transition-colors">
                    Explore Projects
                  </Link>
                </>
              )}
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center -space-x-3">
                <img src="https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100&h=100&fit=crop" className="w-11 h-11 rounded-full border-2 border-white object-cover shadow-sm" alt="Student 1" />
                <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop" className="w-11 h-11 rounded-full border-2 border-white object-cover shadow-sm" alt="Student 2" />
                <img src="https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&h=100&fit=crop" className="w-11 h-11 rounded-full border-2 border-white object-cover shadow-sm" alt="Student 3" />
                <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop" className="w-11 h-11 rounded-full border-2 border-white object-cover shadow-sm" alt="Student 4" />
                <div className="w-11 h-11 rounded-full border-2 border-white bg-brand-blue text-white text-[11px] font-bold flex items-center justify-center shadow-sm z-10">
                  +5K
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-[13px] font-semibold text-slate-700">Join 5,000+ students</span>
                <span className="text-[13px] font-medium text-slate-500">showcasing their talent</span>
              </div>
            </div>

            {/* Spiral Arrow pointing to right */}
            <svg className="absolute -top-4 -right-12 w-16 h-16 text-brand-blue/50 hidden lg:block" viewBox="0 0 100 100" fill="none">
              <path d="M10,90 Q40,0 90,70" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeDasharray="6 6" />
              <path d="M75,60 L90,70 L80,85" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>

          {/* Hero Right: Floating Cards */}
          <div className="relative w-full h-[600px] hidden lg:block mt-2">
            
            {/* Background Blob */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-[#4F46E5]/10 rounded-full blur-[80px] pointer-events-none"></div>

            {/* Background Dot Patterns */}
            <div className="absolute top-0 -left-4 w-32 h-32 opacity-30 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#94a3b8 2px, transparent 2px)', backgroundSize: '16px 16px' }}></div>
            <div className="absolute bottom-1/4 -right-8 w-32 h-48 opacity-30 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#94a3b8 2px, transparent 2px)', backgroundSize: '16px 16px' }}></div>

            {/* Spiral Arrow */}
            <svg className="absolute -top-4 -left-12 w-14 h-14 text-indigo-400/70 transform -rotate-12" viewBox="0 0 100 100" fill="none">
              <path d="M20,80 Q5,40 50,20 T90,50" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <path d="M75,55 L90,50 L85,35" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>

            {/* Top Left Card: Crop Disease (AI / ML) */}
            <div className="absolute top-[30px] left-[20px] w-[260px] bg-white rounded-2xl shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] border border-slate-100 p-3 transform rotate-[6deg] hover:rotate-[2deg] hover:scale-105 transition-all duration-500 z-30 group cursor-pointer">
              <div className="relative w-full h-32 rounded-xl overflow-hidden mb-4 bg-slate-900 border border-slate-100">
                <div className="absolute top-2 left-2 px-2.5 py-1 bg-purple-100 text-purple-700 rounded-full text-[10px] font-bold shadow-sm z-10">AI / ML</div>
                <img src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=600&auto=format&fit=crop" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-90" alt="Crop Disease" />
              </div>
              <h3 className="text-[14px] font-extrabold text-slate-900 mb-1.5 px-1 leading-tight">Crop Disease Detection</h3>
              <p className="text-[11px] font-medium text-slate-500 mb-4 px-1 leading-relaxed">Deep learning model to identify diseases in plants</p>
              <div className="flex items-center gap-4 text-[12px] font-bold text-slate-400 px-1 pb-1">
                <span className="flex items-center gap-1.5 text-slate-600"><Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" /> 282</span>
                <span className="flex items-center gap-1.5 text-slate-600"><Eye className="w-3.5 h-3.5" /> 1.2K</span>
              </div>
            </div>

            {/* Top Right Card: TaskFlow (Web App) */}
            <div className="absolute top-[-10px] right-[10px] w-[310px] bg-white rounded-2xl shadow-[0_20px_40px_-15px_rgba(0,0,0,0.08)] border border-slate-100 p-3 transform rotate-[11deg] hover:rotate-[7deg] hover:scale-105 transition-all duration-500 z-20 group cursor-pointer">
              <div className="relative w-full h-40 rounded-xl overflow-hidden mb-4 bg-slate-50 border border-slate-100">
                <div className="absolute top-2 left-2 px-2.5 py-1 bg-green-100 text-green-700 rounded-full text-[10px] font-bold shadow-sm z-10">Web App</div>
                <img src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=600&auto=format&fit=crop" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-90" alt="TaskFlow" />
              </div>
              <h3 className="text-[14px] font-extrabold text-slate-900 mb-1.5 px-1 leading-tight">TaskFlow</h3>
              <p className="text-[11px] font-medium text-slate-500 mb-4 px-1 leading-relaxed">Collaborative productivity platform for teams</p>
              <div className="flex items-center gap-4 text-[12px] font-bold text-slate-400 px-1 pb-1">
                <span className="flex items-center gap-1.5 text-slate-600"><Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" /> 196</span>
                <span className="flex items-center gap-1.5 text-slate-600"><Eye className="w-3.5 h-3.5" /> 982</span>
              </div>
            </div>

            {/* Bottom Left Card: FitTrack (Mobile App) */}
            <div className="absolute top-[280px] -left-[10px] w-[250px] bg-white rounded-2xl shadow-[0_20px_40px_-15px_rgba(0,0,0,0.12)] border border-slate-100 p-3 transform rotate-[-4deg] hover:rotate-[-2deg] hover:scale-105 transition-all duration-500 z-40 group cursor-pointer">
              <div className="relative w-full h-32 rounded-xl overflow-hidden mb-4 bg-orange-50 border border-slate-100 flex justify-center pt-3">
                <div className="absolute top-2 left-2 px-2.5 py-1 bg-orange-100 text-orange-700 rounded-full text-[10px] font-bold shadow-sm z-10">Mobile App</div>
                <img src="https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?q=80&w=400&auto=format&fit=crop" className="w-20 h-full object-cover rounded-t-xl shadow-[0_-5px_15px_rgba(0,0,0,0.1)] border border-slate-200 group-hover:scale-105 transition duration-500" alt="FitTrack" />
              </div>
              <h3 className="text-[14px] font-extrabold text-slate-900 mb-1.5 px-1 leading-tight">FitTrack</h3>
              <p className="text-[11px] font-medium text-slate-500 mb-4 px-1 leading-relaxed">AI powered fitness tracking and analytics app</p>
              <div className="flex items-center gap-4 text-[12px] font-bold text-slate-400 px-1 pb-1">
                <span className="flex items-center gap-1.5 text-slate-600"><Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" /> 312</span>
                <span className="flex items-center gap-1.5 text-slate-600"><Eye className="w-3.5 h-3.5" /> 1.5K</span>
              </div>
            </div>

            {/* Bottom Right Card: Sales Insight Dashboard (Data Science) */}
            <div className="absolute top-[310px] right-[20px] w-[270px] bg-white rounded-2xl shadow-[0_20px_40px_-15px_rgba(0,0,0,0.15)] border border-slate-100 p-3 transform rotate-[4deg] hover:rotate-[2deg] hover:scale-105 transition-all duration-500 z-30 group cursor-pointer">
              <div className="relative w-full h-28 rounded-xl overflow-hidden mb-4 bg-slate-900 border border-slate-100">
                <div className="absolute top-2 left-2 px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full text-[10px] font-bold shadow-sm z-10">Data Science</div>
                <img src="https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?q=80&w=600&auto=format&fit=crop" className="w-full h-full object-cover opacity-80 group-hover:scale-110 transition-transform duration-700" alt="Dashboard" />
              </div>
              <h3 className="text-[14px] font-extrabold text-slate-900 mb-1.5 px-1 leading-tight">Sales Insight Dashboard</h3>
              <p className="text-[11px] font-medium text-slate-500 mb-4 px-1 leading-relaxed">Interactive dashboard for sales data analysis</p>
              <div className="flex items-center gap-4 text-[12px] font-bold text-slate-400 px-1 pb-1">
                <span className="flex items-center gap-1.5 text-slate-600"><Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" /> 178</span>
                <span className="flex items-center gap-1.5 text-slate-600"><Eye className="w-3.5 h-3.5" /> 756</span>
              </div>
            </div>

            {/* Blue Floating Orb Element */}
            <div className="absolute top-[230px] -right-[10px] w-12 h-12 rounded-full bg-[#4F46E5] shadow-[0_10px_30px_rgba(79,70,229,0.5)] flex items-center justify-center transform hover:scale-110 hover:-translate-y-1 transition duration-500 cursor-pointer z-50">
              <Layers className="w-5 h-5 text-white fill-white" />
            </div>

          </div>
        </div>

        {/* Stats Banner */}
        <div className="w-full bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 p-8 sm:p-10 mb-20 relative z-30">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 divide-x-0 md:divide-x divide-slate-100">
            <div className="flex items-center gap-5 md:px-6">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center shrink-0">
                <Users className="w-6 h-6 text-indigo-600" />
              </div>
              <div className="flex flex-col">
                <span className="text-[24px] font-extrabold text-slate-900 font-display leading-tight">5,000+</span>
                <span className="text-[13px] font-medium text-slate-500">Active Students</span>
              </div>
            </div>
            
            <div className="flex items-center gap-5 md:px-6">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center shrink-0">
                <Folder className="w-6 h-6 text-emerald-600" />
              </div>
              <div className="flex flex-col">
                <span className="text-[24px] font-extrabold text-slate-900 font-display leading-tight">12,000+</span>
                <span className="text-[13px] font-medium text-slate-500">Projects Published</span>
              </div>
            </div>

            <div className="flex items-center gap-5 md:px-6">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center shrink-0">
                <Building2 className="w-6 h-6 text-amber-600" />
              </div>
              <div className="flex flex-col">
                <span className="text-[24px] font-extrabold text-slate-900 font-display leading-tight">800+</span>
                <span className="text-[13px] font-medium text-slate-500">Recruiters Onboarded</span>
              </div>
            </div>

            <div className="flex items-center gap-5 md:px-6">
              <div className="w-14 h-14 rounded-2xl bg-rose-50 flex items-center justify-center shrink-0">
                <Heart className="w-6 h-6 text-rose-500 fill-rose-500" />
              </div>
              <div className="flex flex-col">
                <span className="text-[24px] font-extrabold text-slate-900 font-display leading-tight">25,000+</span>
                <span className="text-[13px] font-medium text-slate-500">Project Likes</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Sections Container */}
        <div className="w-full grid lg:grid-cols-[1fr_1.5fr] gap-16 lg:gap-12 pb-16">
          
          {/* Why Choose Us */}
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-brand-blue tracking-wider uppercase mb-2 bg-blue-50 px-2 py-1 rounded w-fit">Why Choose Us</span>
            <h2 className="text-[28px] font-extrabold text-slate-900 font-display leading-tight mb-8 max-w-[300px]">
              Everything you need to showcase and grow
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-10">
              <div className="flex flex-col gap-3">
                <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 shadow-sm border border-purple-100">
                  <CloudUpload className="w-6 h-6" />
                </div>
                <h3 className="text-[15px] font-extrabold text-slate-900">Easy Project Upload</h3>
                <p className="text-[12px] font-medium text-slate-500 leading-relaxed">Upload your projects with images, videos, and links in minutes.</p>
              </div>
              
              <div className="flex flex-col gap-3">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shadow-sm border border-emerald-100">
                  <Eye className="w-6 h-6" />
                </div>
                <h3 className="text-[15px] font-extrabold text-slate-900">Get Discovered</h3>
                <p className="text-[12px] font-medium text-slate-500 leading-relaxed">Your projects are visible to students, recruiters, and industry experts.</p>
              </div>

              <div className="flex flex-col gap-3">
                <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 shadow-sm border border-amber-100">
                  <Users className="w-6 h-6" />
                </div>
                <h3 className="text-[15px] font-extrabold text-slate-900">Connect & Network</h3>
                <p className="text-[12px] font-medium text-slate-500 leading-relaxed">Follow peers, connect with recruiters, and grow your professional network.</p>
              </div>

              <div className="flex flex-col gap-3">
                <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shadow-sm border border-blue-100">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h3 className="text-[15px] font-extrabold text-slate-900">Build Your Profile</h3>
                <p className="text-[12px] font-medium text-slate-500 leading-relaxed">Create your profile, highlight skills, and showcase your achievements.</p>
              </div>
            </div>
          </div>

          {/* Popular Projects */}
          <div className="flex flex-col pt-1">
            <div className="flex items-end justify-between mb-8">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-indigo-500 tracking-wider uppercase mb-2 bg-indigo-50 px-2 py-1 rounded w-fit">Popular Projects</span>
                <h2 className="text-[28px] font-extrabold text-slate-900 font-display leading-tight">Projects making an impact</h2>
              </div>
              <Link to="/explore" className="text-[13px] font-bold text-brand-blue hover:underline hidden sm:flex items-center gap-1">
                View all projects <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {popularProjects.map(project => (
                <div key={project._id} onClick={() => navigate(`/projects/${project._id}`)} className="bg-white rounded-2xl border border-slate-200 p-3 shadow-sm hover:shadow-md transition cursor-pointer group">
                  <div className="relative w-full h-36 rounded-xl overflow-hidden mb-4 bg-slate-900 border border-slate-100">
                    <div className="absolute top-2 left-2 px-2 py-1 bg-white/90 backdrop-blur rounded text-[10px] font-bold text-brand-blue z-10">
                      {project.category || 'Project'}
                    </div>
                    <img src={thumbnailSrc(project)} className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition duration-500" alt={project.title} />
                  </div>
                  <h3 className="text-[15px] font-extrabold text-slate-900 mb-1 px-1 line-clamp-1">{project.title}</h3>
                  <p className="text-[12px] font-medium text-slate-500 mb-4 px-1 line-clamp-1">{project.description}</p>
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 px-1 pb-1">
                    <div className="flex items-center gap-4">
                      <span 
                        onClick={(e) => handleLike(e, project._id, project.userLiked)}
                        className={`flex items-center gap-1.5 transition cursor-pointer ${project.userLiked ? 'text-rose-500' : 'hover:text-rose-500'}`}
                      >
                        <Heart className={`w-3.5 h-3.5 transition-colors ${project.userLiked ? 'fill-current' : 'fill-slate-200 hover:fill-rose-500'}`} /> 
                        {project.likesCount || 0}
                      </span>
                      <span className="flex items-center gap-1.5"><Eye className="w-3.5 h-3.5 text-slate-400" /> {project.viewsCount > 999 ? (project.viewsCount/1000).toFixed(1)+'K' : (project.viewsCount||0)}</span>
                    </div>
                  </div>
                </div>
              ))}
              {popularProjects.length === 0 && (
                <p className="text-sm text-slate-500">No popular projects found.</p>
              )}
            </div>
          </div>
          
        </div>
      </main>

      <RegisterModal isOpen={showRegisterModal} onClose={() => setShowRegisterModal(false)} />
      {showLoginModal && <Login />}
    </div>
  );
}
