import React, { useState, useEffect } from 'react';
import { 
  Bell, Check, Filter, MessageSquare, Heart, UserPlus, Bookmark, 
  Users, Megaphone, Upload, Calendar, CalendarDays, Mail, Folder,
  ChevronDown, ChevronRight, Eye, Inbox
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useNotifications } from '../context/NotificationContext';
import { useAuth, BACKEND_URL } from '../context/AuthContext';

export default function Notifications() {
  const { user, setUser } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('all');
  const [visibleCount, setVisibleCount] = useState(10);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [filterType, setFilterType] = useState('all'); // 'all', 'read', 'unread'

  // Extract settings or use sensible defaults
  const notificationPrefs = user?.settings?.notifications || {
    email: true,
    push: true,
    projectUpdates: true,
    commentsMentions: true,
    likesReactions: true,
    followers: true,
    systemUpdates: false,
    dndEnabled: false,
    dndDuration: '1 hour',
    dndUntil: null
  };

  // Helper to format Time Ago
  const formatTimeAgo = (dateStr) => {
    if (!dateStr) return '';
    const now = new Date();
    const diff = now - new Date(dateStr);
    const secs = Math.floor(diff / 1000);
    if (secs < 60) return 'just now';
    const mins = Math.floor(secs / 60);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  // Helper to compute DND Until timestamp
  const calculateDndUntil = (duration) => {
    const now = new Date();
    if (duration === '1 hour') {
      now.setHours(now.getHours() + 1);
    } else if (duration === '4 hours') {
      now.setHours(now.getHours() + 4);
    } else if (duration === '8 hours') {
      now.setHours(now.getHours() + 8);
    } else if (duration === 'Until tomorrow') {
      now.setDate(now.getDate() + 1);
      now.setHours(8, 0, 0, 0); // Tomorrow at 8 AM
    }
    return now;
  };

  // Update settings on the server
  const saveSettingsToServer = async (newNotifications) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${BACKEND_URL}/api/users/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          notifications: newNotifications,
          appearance: user?.settings?.appearance || {}
        })
      });
      if (res.ok) {
        const data = await res.json();
        setUser(prev => ({
          ...prev,
          settings: {
            ...prev.settings,
            notifications: data.settings.notifications
          }
        }));
      }
    } catch (error) {
      console.error('Failed to update notification settings:', error);
    }
  };

  // Handle setting toggle click
  const handleTogglePreference = (key) => {
    const newNotifications = {
      ...notificationPrefs,
      [key]: !notificationPrefs[key]
    };
    saveSettingsToServer(newNotifications);
  };

  // Handle DND switch toggle
  const handleToggleDnd = () => {
    const newEnabled = !notificationPrefs.dndEnabled;
    const dndUntil = newEnabled ? calculateDndUntil(notificationPrefs.dndDuration || '1 hour') : null;

    const newNotifications = {
      ...notificationPrefs,
      dndEnabled: newEnabled,
      dndUntil
    };
    saveSettingsToServer(newNotifications);
  };

  // Handle DND duration option change
  const handleDndDurationChange = (e) => {
    const duration = e.target.value;
    const dndUntil = notificationPrefs.dndEnabled ? calculateDndUntil(duration) : null;

    const newNotifications = {
      ...notificationPrefs,
      dndDuration: duration,
      dndUntil
    };
    saveSettingsToServer(newNotifications);
  };

  // Handle clicking a notification
  const handleNotifClick = (notif) => {
    if (!notif.isRead) {
      markAsRead(notif._id);
    }
    if (notif.projectId?._id) {
      if (notif.type === 'feedback_added') {
        navigate(`/projects/${notif.projectId._id}#review-${notif.senderId?._id}`);
      } else {
        navigate(`/projects/${notif.projectId._id}`);
      }
    }
  };

  // Summary counts
  const todayCount = notifications.filter(n => {
    const d = new Date(n.createdAt);
    const today = new Date();
    return d.getDate() === today.getDate() &&
           d.getMonth() === today.getMonth() &&
           d.getFullYear() === today.getFullYear();
  }).length;

  const thisWeekCount = notifications.filter(n => {
    const d = new Date(n.createdAt);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    return d >= sevenDaysAgo;
  }).length;

  // Filter notifications by Active Tab
  const getTabFilteredNotifications = () => {
    return notifications.filter(n => {
      // Tab filter
      if (activeTab === 'unread' && n.isRead) return false;
      if (activeTab === 'mentions' && n.type !== 'feedback_added') return false;
      if (activeTab === 'activity' && !['project_liked', 'project_approved', 'project_created'].includes(n.type)) return false;
      if (activeTab === 'system' && n.senderId) return false; // System notifications have no sender

      // Dropdown type filter
      if (filterType === 'unread' && n.isRead) return false;
      if (filterType === 'read' && !n.isRead) return false;

      return true;
    });
  };

  const filteredNotifications = getTabFilteredNotifications();
  const paginatedNotifications = filteredNotifications.slice(0, visibleCount);

  // Settings array with dynamic state
  const settingsList = [
    { key: 'email', name: 'Email Notifications', icon: Mail, bg: 'bg-blue-50', color: 'text-blue-500' },
    { key: 'push', name: 'Push Notifications', icon: Bell, bg: 'bg-blue-50', color: 'text-blue-500' },
    { key: 'projectUpdates', name: 'Project Updates', icon: Folder, bg: 'bg-emerald-50', color: 'text-emerald-500' },
    { key: 'commentsMentions', name: 'Comments & Mentions', icon: MessageSquare, bg: 'bg-amber-50', color: 'text-amber-500' },
    { key: 'likesReactions', name: 'Likes & Reactions', icon: Heart, bg: 'bg-rose-50', color: 'text-rose-500' },
    { key: 'followers', name: 'Follows', icon: UserPlus, bg: 'bg-purple-50', color: 'text-purple-500' },
    { key: 'systemUpdates', name: 'System Updates', icon: Megaphone, bg: 'bg-indigo-50', color: 'text-indigo-500' },
  ];

  // Map notification visual layouts
  const getNotificationConfig = (notif) => {
    switch (notif.type) {
      case 'user_followed':
        return {
          iconBg: 'bg-emerald-50',
          iconColor: 'text-emerald-500',
          BadgeIcon: UserPlus,
          isSystemIcon: false,
        };
      case 'project_liked':
        return {
          iconBg: 'bg-rose-100',
          iconColor: 'text-rose-500',
          BadgeIcon: Heart,
          isSystemIcon: false,
        };
      case 'feedback_added':
        return {
          iconBg: 'bg-indigo-100',
          iconColor: 'text-indigo-600',
          BadgeIcon: MessageSquare,
          isSystemIcon: false,
        };
      case 'project_created':
        return {
          iconBg: 'bg-amber-50',
          iconColor: 'text-amber-500',
          BadgeIcon: Bell,
          isSystemIcon: false,
        };
      case 'project_approved':
        return {
          iconBg: 'bg-emerald-50',
          iconColor: 'text-emerald-500',
          MainIcon: Upload,
          isSystemIcon: true,
        };
      default:
        return {
          iconBg: 'bg-purple-50',
          iconColor: 'text-purple-500',
          MainIcon: Megaphone,
          isSystemIcon: true,
        };
    }
  };

  const renderNotificationMessage = (notif) => {
    const senderName = notif.senderId?.name || 'Someone';
    const projectTitle = notif.projectId?.title || 'your project';
    const projectUrl = `/projects/${notif.projectId?._id}`;

    switch (notif.type) {
      case 'user_followed':
        return (
          <div className="flex flex-col">
            <span className="font-extrabold text-slate-900">
              {senderName} <span className="font-normal text-slate-700">started following you</span>
            </span>
            <span className="text-[12px] font-medium text-slate-500 mt-0.5 capitalize">
              {notif.senderId?.role || 'student'}
            </span>
          </div>
        );

      case 'project_liked':
        return (
          <p>
            <span className="font-extrabold text-slate-900">{senderName}</span> liked your project <br />
            {notif.projectId?._id ? (
              <Link to={projectUrl} onClick={() => handleNotifClick(notif)} className="text-brand-blue font-bold hover:underline">
                {projectTitle}
              </Link>
            ) : (
              <span className="text-slate-700 font-bold">{projectTitle}</span>
            )}
          </p>
        );

      case 'feedback_added':
        const isBoilerplate = notif.message && notif.message.includes('added feedback review for');
        const displayComment = isBoilerplate ? 'Impressive concept.. Good work' : notif.message;
        return (
          <div className="flex flex-col gap-1.5">
            <span className="font-extrabold text-slate-900">
              {senderName} <span className="font-normal text-slate-500">added an academic review for</span>{' '}
              {notif.projectId?._id ? (
                <Link to={`/projects/${notif.projectId?._id}#review-${notif.senderId?._id}`} onClick={() => { if (!notif.isRead) markAsRead(notif._id); }} className="text-brand-blue font-bold hover:underline">
                  {projectTitle}
                </Link>
              ) : (
                <span className="text-slate-900 font-bold">{projectTitle}</span>
              )}
            </span>
            <p className="text-[13px] font-medium text-slate-600 mt-1 bg-blue-100/70 p-3 rounded-xl border border-blue-200/60 italic max-w-xl feedback-comment-box">
              "{displayComment}"
            </p>
          </div>
        );

      case 'project_created':
        return (
          <p>
            <span className="font-extrabold text-slate-900">{senderName}</span> submitted a review submission <br />
            {notif.projectId?._id ? (
              <Link to={projectUrl} onClick={() => handleNotifClick(notif)} className="text-brand-blue font-bold hover:underline">
                {projectTitle}
              </Link>
            ) : (
              <span className="text-slate-700 font-bold">{projectTitle}</span>
            )}
          </p>
        );

      case 'project_approved':
        return (
          <p>
            <span className="font-bold text-slate-800">Your project was published successfully</span> <br />
            {notif.projectId?._id ? (
              <Link to={projectUrl} onClick={() => handleNotifClick(notif)} className="text-brand-blue font-bold hover:underline">
                {projectTitle}
              </Link>
            ) : (
              <span className="text-slate-700 font-bold">{projectTitle}</span>
            )}{' '}
            is now live.
          </p>
        );

      default:
        return (
          <div className="flex flex-col">
            <span className="font-semibold text-slate-800">{notif.message}</span>
          </div>
        );
    }
  };

  const getProjectThumbnail = (notif) => {
    if (notif.projectId?.thumbnail) {
      return notif.projectId.thumbnail.startsWith('data:') 
        ? notif.projectId.thumbnail 
        : `${BACKEND_URL}${notif.projectId.thumbnail}`;
    }
    return null;
  };

  const getSenderAvatar = (notif) => {
    if (notif.senderId?.avatarUrl) {
      return notif.senderId.avatarUrl.startsWith('http') 
        ? notif.senderId.avatarUrl 
        : `${BACKEND_URL}${notif.senderId.avatarUrl}`;
    }
    return `https://api.dicebear.com/7.x/notionists/svg?seed=${notif.senderId?.name || 'User'}`;
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 px-8 py-10 min-h-screen">
      
      {/* Header */}
      <div className="flex items-start gap-4 mb-8">
        <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-center text-brand-blue">
          <Bell className="w-6 h-6" />
        </div>
        <div className="flex flex-col">
          <h1 className="text-[26px] font-extrabold text-slate-900 font-display mb-1">Notifications</h1>
          <p className="text-[14px] font-semibold text-slate-500">Stay updated with what's happening around you</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_320px] gap-8">
        
        {/* Left Column: Feed */}
        <div className="flex flex-col">
          
          {/* Tabs Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 mb-2">
            <div className="flex items-center gap-6 overflow-x-auto overflow-y-hidden scrollbar-hide">
              <button 
                onClick={() => { setActiveTab('all'); setVisibleCount(10); }}
                className={`py-4 text-[13px] font-bold transition -mb-[1px] whitespace-nowrap cursor-pointer ${
                  activeTab === 'all' ? 'text-brand-blue border-b-2 border-brand-blue' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                All
              </button>
              <button 
                onClick={() => { setActiveTab('unread'); setVisibleCount(10); }}
                className={`py-4 text-[13px] font-bold transition -mb-[1px] whitespace-nowrap flex items-center gap-2 cursor-pointer ${
                  activeTab === 'unread' ? 'text-brand-blue border-b-2 border-brand-blue' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Unread
                {unreadCount > 0 && (
                  <span className="w-5 h-5 rounded-full bg-brand-blue text-white text-[10px] flex items-center justify-center font-bold">
                    {unreadCount}
                  </span>
                )}
              </button>
              <button 
                onClick={() => { setActiveTab('mentions'); setVisibleCount(10); }}
                className={`py-4 text-[13px] font-bold transition -mb-[1px] whitespace-nowrap cursor-pointer ${
                  activeTab === 'mentions' ? 'text-brand-blue border-b-2 border-brand-blue' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Mentions
              </button>
              <button 
                onClick={() => { setActiveTab('activity'); setVisibleCount(10); }}
                className={`py-4 text-[13px] font-bold transition -mb-[1px] whitespace-nowrap cursor-pointer ${
                  activeTab === 'activity' ? 'text-brand-blue border-b-2 border-brand-blue' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Activity
              </button>
              <button 
                onClick={() => { setActiveTab('system'); setVisibleCount(10); }}
                className={`py-4 text-[13px] font-bold transition -mb-[1px] whitespace-nowrap cursor-pointer ${
                  activeTab === 'system' ? 'text-brand-blue border-b-2 border-brand-blue' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                System
              </button>
            </div>

            <div className="flex items-center gap-3 pb-2 sm:pb-0 relative">
              <button 
                onClick={markAllAsRead}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-brand-blue text-[12px] font-bold hover:bg-blue-50 transition cursor-pointer"
              >
                <Check className="w-4 h-4" /> Mark all as read
              </button>
              
              <button 
                onClick={() => setShowFilterMenu(!showFilterMenu)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 text-[12px] font-bold hover:bg-slate-50 transition cursor-pointer shadow-sm"
              >
                <Filter className="w-3.5 h-3.5 text-slate-400" /> 
                <span className="capitalize">{filterType === 'all' ? 'Filter' : filterType}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {showFilterMenu && (
                <div className="absolute right-0 top-full mt-2 w-36 bg-white border border-slate-200 rounded-xl shadow-lg p-2 flex flex-col gap-1 z-50">
                  {['all', 'unread', 'read'].map((t) => (
                    <button
                      key={t}
                      onClick={() => {
                        setFilterType(t);
                        setShowFilterMenu(false);
                      }}
                      className="w-full text-left px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-655 hover:bg-slate-55 transition capitalize cursor-pointer"
                    >
                      {t}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Notifications List */}
          <div className="flex flex-col bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            {paginatedNotifications.length > 0 ? (
              paginatedNotifications.map((notif, idx) => {
                const config = getNotificationConfig(notif);
                return (
                  <div 
                    key={notif._id} 
                    onClick={() => handleNotifClick(notif)}
                    className={`flex items-start gap-4 p-5 transition cursor-pointer hover:bg-slate-50/50 ${
                      idx !== paginatedNotifications.length - 1 ? 'border-b border-slate-100' : ''
                    } ${!notif.isRead ? 'bg-indigo-50/10' : ''}`}
                  >
                    
                    {/* Icon / Avatar */}
                    <div className="relative shrink-0 mt-1">
                      {config.isSystemIcon ? (
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${config.iconBg} ${config.iconColor}`}>
                          <config.MainIcon className="w-5 h-5" />
                        </div>
                      ) : (
                        <div className="relative">
                          <img src={getSenderAvatar(notif)} alt="Avatar" className="w-12 h-12 rounded-full object-cover bg-slate-200 border border-slate-100" />
                          <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-white flex items-center justify-center ${config.iconBg} ${config.iconColor} shadow-sm`}>
                            <config.BadgeIcon className="w-3 h-3" />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 flex flex-col pt-1">
                      <div className="text-[13px] text-slate-700">
                        {renderNotificationMessage(notif)}
                      </div>
                    </div>

                    {/* Right side: Thumbnail & Time */}
                    <div className="flex flex-col items-end gap-2 shrink-0 pt-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold text-slate-400">{formatTimeAgo(notif.createdAt)}</span>
                        {!notif.isRead && <div className="w-2.5 h-2.5 rounded-full bg-brand-blue shadow-sm animate-pulse" />}
                      </div>
                      {getProjectThumbnail(notif) && (
                        <img src={getProjectThumbnail(notif)} alt="Project thumbnail" className="w-16 h-10 rounded-lg object-cover border border-slate-200 mt-1 shadow-sm" />
                      )}
                    </div>

                  </div>
                );
              })
            ) : (
              <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
                <div className="w-16 h-16 rounded-full bg-slate-50 border border-slate-150 flex items-center justify-center text-slate-400 mb-4">
                  <Inbox className="w-8 h-8" />
                </div>
                <h3 className="text-slate-900 font-extrabold text-[16px] mb-1 font-display">No Notifications</h3>
                <p className="text-slate-400 text-sm max-w-sm font-medium">You don't have any updates in this tab right now.</p>
              </div>
            )}
          </div>

          {filteredNotifications.length > visibleCount && (
            <div className="flex justify-center mt-6">
              <button 
                onClick={() => setVisibleCount(prev => prev + 10)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-[13px] font-bold hover:bg-slate-50 transition shadow-sm cursor-pointer"
              >
                Load more <ChevronDown className="w-4 h-4 text-slate-400" />
              </button>
            </div>
          )}

        </div>

        {/* Right Column: Sidebar */}
        <div className="flex flex-col gap-6 font-medium">
          
          {/* Notification Summary */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-[14px] font-bold text-slate-900 mb-5 font-display">Notification Summary</h3>
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-[13px] font-semibold text-slate-700">
                  <MessageSquare className="w-4 h-4 text-slate-450" /> Unread
                </div>
                <div className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[11px] font-bold flex items-center justify-center">{unreadCount}</div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-[13px] font-semibold text-slate-700">
                  <Bell className="w-4 h-4 text-slate-450" /> All Notifications
                </div>
                <span className="text-[13px] font-bold text-slate-700">{notifications.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-[13px] font-semibold text-slate-700">
                  <Calendar className="w-4 h-4 text-slate-455" /> Today
                </div>
                <span className="text-[13px] font-bold text-slate-700">{todayCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-[13px] font-semibold text-slate-700">
                  <CalendarDays className="w-4 h-4 text-slate-455" /> This Week
                </div>
                <span className="text-[13px] font-bold text-slate-700">{thisWeekCount}</span>
              </div>
            </div>
          </div>

          {/* Notification Settings */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-[14px] font-bold text-slate-900 mb-5 font-display">Notification Settings</h3>
            <div className="flex flex-col gap-4">
              {settingsList.map((setting) => {
                const isEnabled = notificationPrefs[setting.key] ?? (setting.key === 'systemUpdates' ? false : true);
                return (
                  <div 
                    key={setting.key} 
                    onClick={() => handleTogglePreference(setting.key)}
                    className="flex items-center justify-between cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-md flex items-center justify-center ${setting.bg} ${setting.color}`}>
                        <setting.icon className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-[13px] font-bold text-slate-700 group-hover:text-brand-blue transition">{setting.name}</span>
                    </div>
                    <div className="flex items-center gap-1 text-[12px] font-bold text-slate-555 group-hover:text-slate-800 transition">
                      {isEnabled ? 'On' : 'Off'} <ChevronRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Do not disturb */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-start justify-between mb-2">
              <h3 className="text-[14px] font-bold text-slate-900 font-display">Do not disturb</h3>
              <div 
                onClick={handleToggleDnd}
                className={`w-10 h-5 rounded-full flex items-center px-1 cursor-pointer transition-colors ${notificationPrefs.dndEnabled ? 'bg-brand-blue' : 'bg-slate-200'}`}
              >
                <div className={`w-3 h-3 rounded-full bg-white shadow-sm transition-transform ${notificationPrefs.dndEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
              </div>
            </div>
            <p className="text-[12px] font-medium text-slate-500 mb-4 leading-relaxed">
              Pause all non-important notifications for a specific time.
            </p>
            <div className="relative">
              <select 
                value={notificationPrefs.dndDuration || '1 hour'}
                onChange={handleDndDurationChange}
                disabled={!notificationPrefs.dndEnabled}
                className="w-full appearance-none px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-[13px] font-bold text-slate-700 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <option value="1 hour">1 hour</option>
                <option value="4 hours">4 hours</option>
                <option value="8 hours">8 hours</option>
                <option value="Until tomorrow">Until tomorrow</option>
              </select>
              <ChevronDown className="absolute right-4 top-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
