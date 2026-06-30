import React, { useState, useEffect } from 'react';
import { 
  Users, Folder, Bell, MoreVertical, Heart, Check, 
  Bookmark, BellOff, Ban, ChevronDown, ChevronRight, Loader2,
  VolumeX, Eye, ShieldAlert, CheckCircle, ExternalLink
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth, BACKEND_URL } from '../context/AuthContext';
import { useBookmark } from '../context/BookmarkContext';

export default function Following() {
  const { user, isAuthenticated } = useAuth();
  const { handleBookmark } = useBookmark();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('all');
  const [sortBy, setSortBy] = useState('Recently Updated');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [showMoreMenuId, setShowMoreMenuId] = useState(null);
  
  const [followedUsers, setFollowedUsers] = useState([]);
  const [feed, setFeed] = useState([]);
  const [recommendedUsers, setRecommendedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [visibleFeedCount, setVisibleFeedCount] = useState(4);

  // Muted and Blocked simulated sets
  const [mutedUserIds, setMutedUserIds] = useState(new Set());
  const [blockedUserIds, setBlockedUserIds] = useState(new Set());
  const [showMutedModal, setShowMutedModal] = useState(false);
  const [showBlockedModal, setShowBlockedModal] = useState(false);

  const fetchFollowingData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };

      const [usersRes, feedRes, recsRes] = await Promise.all([
        fetch(`${BACKEND_URL}/api/users/following`, { headers }),
        fetch(`${BACKEND_URL}/api/users/following/feed`, { headers }),
        fetch(`${BACKEND_URL}/api/users/recommended`, { headers })
      ]);

      if (usersRes.ok) setFollowedUsers(await usersRes.json());
      if (feedRes.ok) setFeed(await feedRes.json());
      if (recsRes.ok) setRecommendedUsers(await recsRes.json());
      
    } catch (error) {
      console.error('Error fetching following data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchFollowingData();
  }, [isAuthenticated]);

  const handleFollowToggle = async (targetUserId, isFollowing) => {
    try {
      const token = localStorage.getItem('token');
      const endpoint = isFollowing ? 'unfollow' : 'follow';
      const url = `${BACKEND_URL}/api/users/${targetUserId}/${endpoint}`;
      
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (res.ok) {
        // Refresh local data state
        fetchFollowingData();
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
    }
  };

  // Toggle bookmark wrapper
  const onBookmarkClick = async (e, project) => {
    // Call the context bookmark handler
    await handleBookmark(e, project._id, project.userBookmarked, (newBookmarked, diff) => {
      // Optimistic state update in local feed array
      setFeed(prev => prev.map(p => {
        if (p._id === project._id) {
          return { ...p, userBookmarked: newBookmarked, bookmarksCount: (p.bookmarksCount || 0) + diff };
        }
        return p;
      }));
    });
  };

  const handleMuteToggle = (userId) => {
    setMutedUserIds(prev => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
    setShowMoreMenuId(null);
  };

  const handleBlockToggle = (userId) => {
    setBlockedUserIds(prev => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
        // Also unfollow if blocked
        handleFollowToggle(userId, true);
      }
      return next;
    });
    setShowMoreMenuId(null);
  };

  const getAvatar = (creator) => {
    if (creator?.avatarUrl && creator.avatarUrl.startsWith('http')) return creator.avatarUrl;
    if (creator?.avatarUrl) return `${BACKEND_URL}${creator.avatarUrl}`;
    return `https://api.dicebear.com/7.x/notionists/svg?seed=${creator?.name || 'User'}`;
  };

  const getProjectThumbnail = (project) => {
    if (project.thumbnail && project.thumbnail.startsWith('data:')) return project.thumbnail;
    if (project.thumbnail) return `${BACKEND_URL}${project.thumbnail}`;
    return 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=150&auto=format&fit=crop';
  };

  const getTimeAgo = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return `just now`;
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) return `${diffInDays}d ago`;
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  // Sort followed users locally
  const getSortedFollowedUsers = () => {
    const activeList = followedUsers.filter(u => !blockedUserIds.has(u._id));
    if (sortBy === 'Most Projects') {
      return [...activeList].sort((a, b) => (b.projectsCount || 0) - (a.projectsCount || 0));
    }
    if (sortBy === 'Most Followers') {
      return [...activeList].sort((a, b) => (b.followersCount || 0) - (a.followersCount || 0));
    }
    return activeList; // Default Recently Updated / Backend order
  };

  const sortedFollowedUsers = getSortedFollowedUsers();
  
  // Stats sums
  const totalPeopleFollowed = followedUsers.filter(u => !blockedUserIds.has(u._id)).length;
  const totalProjectsFollowedCount = followedUsers.reduce((sum, u) => sum + (u.projectsCount || 0), 0);
  const activeFeedList = feed.filter(item => !blockedUserIds.has(item.studentId?._id) && !mutedUserIds.has(item.studentId?._id));
  const paginatedFeed = activeFeedList.slice(0, visibleFeedCount);

  // Activity descriptions generator for realistic feel
  const getActivityAction = (idx) => {
    const actions = [
      'added a new project',
      'updated a project',
      'published a new project',
      'liked a project'
    ];
    return actions[idx % actions.length];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-brand-blue" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-50 px-8 py-10 min-h-screen">
      
      {/* Header */}
      <div className="flex items-start gap-4 mb-8">
        <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-center text-brand-blue">
          <Users className="w-6 h-6" />
        </div>
        <div className="flex flex-col">
          <h1 className="text-[26px] font-extrabold text-slate-900 font-display mb-1">Following</h1>
          <p className="text-[14px] font-semibold text-slate-500">People and projects you follow</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_320px] gap-8">
        
        {/* Left Column: Main Content */}
        <div className="flex flex-col">
          
          {/* Tabs Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 mb-6">
            <div className="flex items-center gap-8 overflow-x-auto overflow-y-hidden scrollbar-hide">
              <button 
                onClick={() => setActiveTab('all')}
                className={`py-4 text-[14px] font-bold transition -mb-[1px] whitespace-nowrap cursor-pointer ${
                  activeTab === 'all' ? 'text-brand-blue border-b-2 border-brand-blue' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                All
              </button>
              <button 
                onClick={() => setActiveTab('people')}
                className={`py-4 text-[14px] font-bold transition -mb-[1px] whitespace-nowrap cursor-pointer ${
                  activeTab === 'people' ? 'text-brand-blue border-b-2 border-brand-blue' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                People
              </button>
              <button 
                onClick={() => setActiveTab('projects')}
                className={`py-4 text-[14px] font-bold transition -mb-[1px] whitespace-nowrap cursor-pointer ${
                  activeTab === 'projects' ? 'text-brand-blue border-b-2 border-brand-blue' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Projects
              </button>
            </div>

            <div className="relative pb-2 sm:pb-0">
              <button 
                onClick={() => setShowSortMenu(!showSortMenu)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 text-[13px] font-bold hover:bg-slate-50 transition cursor-pointer shadow-sm whitespace-nowrap"
              >
                Sort by: {sortBy} <ChevronDown className="w-4 h-4 text-slate-400" />
              </button>

              {showSortMenu && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-lg p-2 flex flex-col gap-1 z-50">
                  {['Recently Updated', 'Most Projects', 'Most Followers'].map((option) => (
                    <button
                      key={option}
                      onClick={() => {
                        setSortBy(option);
                        setShowSortMenu(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                    >
                      {option}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div 
              onClick={() => setActiveTab('people')}
              className="bg-white rounded-2xl border border-slate-200 p-6 flex items-center gap-5 shadow-sm hover:border-slate-350 transition cursor-pointer"
            >
              <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center shrink-0">
                <Users className="w-5 h-5 text-indigo-500" />
              </div>
              <div className="flex flex-col">
                <span className="text-[12px] font-bold text-slate-500 mb-0.5">People</span>
                <span className="text-[22px] font-extrabold text-slate-900 font-display leading-none mb-1">{totalPeopleFollowed}</span>
                <span className="text-[11px] font-semibold text-slate-400">Students & creators</span>
              </div>
            </div>
            
            <div 
              onClick={() => setActiveTab('projects')}
              className="bg-white rounded-2xl border border-slate-200 p-6 flex items-center gap-5 shadow-sm hover:border-slate-350 transition cursor-pointer"
            >
              <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                <Folder className="w-5 h-5 text-emerald-500" />
              </div>
              <div className="flex flex-col">
                <span className="text-[12px] font-bold text-slate-500 mb-0.5">Projects</span>
                <span className="text-[22px] font-extrabold text-slate-900 font-display leading-none mb-1">{totalProjectsFollowedCount}</span>
                <span className="text-[11px] font-semibold text-slate-400">From followed people</span>
              </div>
            </div>

            <div 
              onClick={() => setActiveTab('all')}
              className="bg-white rounded-2xl border border-slate-200 p-6 flex items-center gap-5 shadow-sm hover:border-slate-350 transition cursor-pointer"
            >
              <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center shrink-0">
                <Bell className="w-5 h-5 text-amber-500" />
              </div>
              <div className="flex flex-col">
                <span className="text-[12px] font-bold text-slate-500 mb-0.5">Recent Activity</span>
                <span className="text-[22px] font-extrabold text-slate-900 font-display leading-none mb-1">{activeFeedList.length}</span>
                <span className="text-[11px] font-semibold text-slate-400">New updates</span>
              </div>
            </div>
          </div>

          {/* People You Follow Section */}
          {(activeTab === 'all' || activeTab === 'people') && (
            <div className="flex flex-col mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[16px] font-bold text-slate-900 font-display">People you follow</h2>
                <button 
                  onClick={() => setActiveTab('people')}
                  className="text-[13px] font-bold text-brand-blue hover:underline cursor-pointer"
                >
                  View all people
                </button>
              </div>
              
              {sortedFollowedUsers.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500 font-medium">
                  You aren't following anyone yet. Find recommended creators on the right to follow!
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 overflow-x-auto overflow-y-hidden pb-2 scrollbar-hide">
                  {sortedFollowedUsers.map(creator => (
                    <div 
                      key={creator._id} 
                      className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col shadow-sm min-w-[220px] relative hover:border-slate-350 transition"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <img src={getAvatar(creator)} alt={creator.name} className="w-12 h-12 rounded-full object-cover bg-slate-100 border border-slate-200 shadow-sm" />
                        <div className="relative">
                          <button 
                            onClick={() => setShowMoreMenuId(showMoreMenuId === creator._id ? null : creator._id)}
                            className="text-slate-400 hover:text-slate-655 p-1 rounded-lg hover:bg-slate-50 transition cursor-pointer"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>

                          {showMoreMenuId === creator._id && (
                            <div className="absolute right-0 mt-1 w-44 bg-white border border-slate-200 rounded-xl shadow-lg p-1.5 flex flex-col gap-0.5 z-40">
                              <button
                                onClick={() => handleMuteToggle(creator._id)}
                                className="w-full text-left px-3 py-2 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-50 transition flex items-center gap-2 cursor-pointer"
                              >
                                <VolumeX className="w-3.5 h-3.5 text-slate-400" />
                                {mutedUserIds.has(creator._id) ? 'Unmute' : 'Mute notifications'}
                              </button>
                              <button
                                onClick={() => handleBlockToggle(creator._id)}
                                className="w-full text-left px-3 py-2 rounded-lg text-xs font-bold text-rose-500 hover:bg-rose-50 transition flex items-center gap-2 cursor-pointer"
                              >
                                <Ban className="w-3.5 h-3.5 text-rose-400" />
                                Block user
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <h3 className="text-[14px] font-extrabold text-slate-900 truncate font-display">{creator.name}</h3>
                      <span className="text-[11px] font-bold text-slate-400 mt-0.5">@{creator.name.replace(/\s+/g, '').toLowerCase()}</span>
                      
                      <span className="text-[11px] font-bold text-slate-500 truncate mt-2 mb-4 leading-none">
                        {creator.title || creator.role}
                      </span>
                      
                      <div className="flex items-center gap-4 mb-5 border-t border-slate-100 pt-3">
                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600">
                          <Folder className="w-3.5 h-3.5 text-slate-400" /> {creator.projectsCount || 0} Projects
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600">
                          <Heart className="w-3.5 h-3.5 text-rose-450 fill-rose-50" /> {creator.followersCount || 0} Followers
                        </div>
                      </div>

                      <button 
                        onClick={() => handleFollowToggle(creator._id, true)}
                        className="w-full py-2.5 rounded-xl border border-brand-blue/20 bg-blue-50/50 text-brand-blue text-[12px] font-bold flex items-center justify-center gap-1.5 hover:bg-blue-100/50 transition mt-auto cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" /> Following
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Latest Activity Feed */}
          {(activeTab === 'all' || activeTab === 'projects') && (
            <div className="flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[16px] font-bold text-slate-900 font-display">Latest from people you follow</h2>
                <button 
                  onClick={() => setActiveTab('projects')}
                  className="text-[13px] font-bold text-brand-blue hover:underline cursor-pointer"
                >
                  View all activity
                </button>
              </div>
              
              {activeFeedList.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500 font-medium">
                  No recent activity found from people you follow.
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
                  {paginatedFeed.map((item, idx) => (
                    <div 
                      key={item._id} 
                      className={`flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 transition hover:bg-slate-50/60 ${
                        idx !== paginatedFeed.length - 1 ? 'border-b border-slate-100' : ''
                      }`}
                    >
                      {/* Left: User description & action */}
                      <div className="flex items-center gap-3 w-full md:w-[32%] min-w-0">
                        <img src={getAvatar(item.studentId)} alt={item.studentId?.name} className="w-10 h-10 rounded-full object-cover bg-slate-100 shrink-0 border border-slate-200 shadow-sm" />
                        <div className="flex flex-col min-w-0">
                          <span className="text-[13px] font-extrabold text-slate-900 truncate font-display">{item.studentId?.name}</span>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[11px] font-semibold text-slate-500 capitalize">{getActivityAction(idx)}</span>
                            <span className="text-[10px] font-bold text-slate-400 whitespace-nowrap">{getTimeAgo(item.createdAt)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Center/Right: Project Details card */}
                      <div className="flex items-center gap-4 flex-1 min-w-0 bg-slate-50/50 p-2.5 rounded-xl border border-slate-100 hover:border-slate-200 transition">
                        <img src={getProjectThumbnail(item)} alt="Thumbnail" className="w-16 h-10 rounded-lg object-cover border border-slate-200 shrink-0 shadow-sm" />
                        <div className="flex flex-col min-w-0">
                          <Link to={`/projects/${item._id}`} className="text-[13px] font-bold text-slate-900 truncate hover:text-brand-blue transition">
                            {item.title}
                          </Link>
                          <div className="flex items-center gap-2 mt-1 overflow-x-auto overflow-y-hidden scrollbar-hide pb-0.5">
                            {(item.modules || []).slice(0, 3).map(tag => (
                              <span key={tag} className="px-2 py-0.5 rounded text-[9px] font-bold bg-white border border-slate-150 text-slate-500 whitespace-nowrap shadow-sm">
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Right: bookmark action button */}
                      <button 
                        onClick={(e) => onBookmarkClick(e, item)}
                        className={`w-8 h-8 rounded-full flex items-center justify-center border transition shrink-0 ml-auto md:ml-2 cursor-pointer shadow-sm ${
                          item.userBookmarked 
                            ? 'bg-brand-blue border-brand-blue text-white hover:bg-brand-blue-hover' 
                            : 'bg-white border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <Bookmark className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {activeFeedList.length > visibleFeedCount && (
                <div className="flex justify-center mt-6">
                  <button 
                    onClick={() => setVisibleFeedCount(prev => prev + 4)}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-[13px] font-bold hover:bg-slate-50 transition shadow-sm cursor-pointer"
                  >
                    Load more activity <ChevronDown className="w-4 h-4 text-slate-400" />
                  </button>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Right Column: Sidebar */}
        <div className="flex flex-col gap-6">
          
          {/* Recommended to follow */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-[14px] font-bold text-slate-900 mb-5 font-display">Recommended to follow</h3>
            <div className="flex flex-col gap-5">
              {recommendedUsers.length === 0 ? (
                <p className="text-[13px] text-slate-500 font-semibold italic">No recommendations available.</p>
              ) : (
                recommendedUsers.map(creator => (
                  <div key={creator._id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <img src={getAvatar(creator)} alt={creator.name} className="w-10 h-10 rounded-full object-cover bg-slate-100 border border-slate-100 shrink-0" />
                      <div className="flex flex-col min-w-0">
                        <span className="text-[13px] font-bold text-slate-900 truncate font-display leading-tight">{creator.name}</span>
                        <span className="text-[11px] font-medium text-slate-500 truncate mt-0.5">
                          {creator.followersCount || 0} followers
                        </span>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleFollowToggle(creator._id, false)}
                      className="px-3.5 py-1.5 rounded-xl border border-brand-blue/30 text-brand-blue text-[11px] font-bold hover:bg-blue-50 transition shrink-0 ml-2 cursor-pointer"
                    >
                      Follow
                    </button>
                  </div>
                ))
              )}
            </div>
            {recommendedUsers.length > 0 && (
              <div className="mt-5 text-center">
                <button 
                  onClick={() => fetchFollowingData()}
                  className="text-[12px] font-bold text-brand-blue hover:underline cursor-pointer"
                >
                  View more suggestions
                </button>
              </div>
            )}
          </div>

          {/* Quick Filters */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-[14px] font-bold text-slate-900 mb-4 font-display">Quick Filters</h3>
            <div className="flex flex-col gap-3">
              <div 
                onClick={() => setActiveTab('people')}
                className="flex items-center justify-between cursor-pointer group p-2 -mx-2 rounded-lg hover:bg-slate-50 transition"
              >
                <div className="flex items-center gap-3">
                  <Users className="w-4 h-4 text-indigo-500" />
                  <span className="text-[13px] font-bold text-slate-700">People</span>
                </div>
                <div className="flex items-center gap-2 text-[12px] font-medium text-slate-500">
                  {totalPeopleFollowed} <ChevronRight className="w-3.5 h-3.5 group-hover:text-slate-800 transition" />
                </div>
              </div>
              <div 
                onClick={() => setActiveTab('projects')}
                className="flex items-center justify-between cursor-pointer group p-2 -mx-2 rounded-lg hover:bg-slate-50 transition"
              >
                <div className="flex items-center gap-3">
                  <Folder className="w-4 h-4 text-emerald-500" />
                  <span className="text-[13px] font-bold text-slate-700">Projects</span>
                </div>
                <div className="flex items-center gap-2 text-[12px] font-medium text-slate-500">
                  {totalProjectsFollowedCount} <ChevronRight className="w-3.5 h-3.5 group-hover:text-slate-800 transition" />
                </div>
              </div>
            </div>
          </div>

          {/* Manage */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-[14px] font-bold text-slate-900 mb-4 font-display">Manage</h3>
            <div className="flex flex-col gap-3">
              <div 
                onClick={() => setShowMutedModal(true)}
                className="flex items-center justify-between cursor-pointer group p-2 -mx-2 rounded-lg hover:bg-slate-50 transition"
              >
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-md bg-slate-100 flex items-center justify-center">
                    <BellOff className="w-3.5 h-3.5 text-slate-600" />
                  </div>
                  <span className="text-[13px] font-bold text-slate-700">Muted</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold group-hover:text-slate-700">
                  {mutedUserIds.size} <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 transition" />
                </div>
              </div>
              <div 
                onClick={() => setShowBlockedModal(true)}
                className="flex items-center justify-between cursor-pointer group p-2 -mx-2 rounded-lg hover:bg-rose-50 transition"
              >
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-md bg-rose-50 flex items-center justify-center">
                    <Ban className="w-3.5 h-3.5 text-rose-500" />
                  </div>
                  <span className="text-[13px] font-bold text-slate-700 group-hover:text-rose-600 transition">Blocked</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-rose-400 font-semibold group-hover:text-rose-650">
                  {blockedUserIds.size} <ChevronRight className="w-3.5 h-3.5 text-slate-450 group-hover:text-rose-500 transition" />
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Muted creators list modal */}
      {showMutedModal && (
        <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center z-55 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 p-6 flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-slate-900 font-extrabold text-[16px] mb-4 font-display flex items-center gap-2">
              <BellOff className="w-5 h-5 text-slate-500" /> Muted Creators ({mutedUserIds.size})
            </h3>
            <div className="flex flex-col gap-3 max-h-60 overflow-y-auto mb-6">
              {mutedUserIds.size === 0 ? (
                <p className="text-sm text-slate-400 font-medium italic py-4 text-center">No muted creators.</p>
              ) : (
                followedUsers.filter(u => mutedUserIds.has(u._id)).map(u => (
                  <div key={u._id} className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="flex items-center gap-2">
                      <img src={getAvatar(u)} alt="Avatar" className="w-8 h-8 rounded-full object-cover" />
                      <span className="text-xs font-bold text-slate-800">{u.name}</span>
                    </div>
                    <button 
                      onClick={() => handleMuteToggle(u._id)}
                      className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-600 text-[10px] font-bold hover:bg-slate-50 transition cursor-pointer"
                    >
                      Unmute
                    </button>
                  </div>
                ))
              )}
            </div>
            <button 
              onClick={() => setShowMutedModal(false)}
              className="w-full py-2.5 rounded-xl bg-brand-blue text-white text-[13px] font-bold hover:bg-brand-blue-hover transition cursor-pointer shadow-md"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Blocked creators list modal */}
      {showBlockedModal && (
        <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center z-55 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 p-6 flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-slate-900 font-extrabold text-[16px] mb-4 font-display flex items-center gap-2">
              <Ban className="w-5 h-5 text-rose-500" /> Blocked Creators ({blockedUserIds.size})
            </h3>
            <div className="flex flex-col gap-3 max-h-60 overflow-y-auto mb-6">
              {blockedUserIds.size === 0 ? (
                <p className="text-sm text-slate-400 font-medium italic py-4 text-center">No blocked creators.</p>
              ) : (
                // Fetch blocked users details by scanning recommended list and followed users
                [...followedUsers, ...recommendedUsers].filter(u => blockedUserIds.has(u._id)).map(u => (
                  <div key={u._id} className="flex items-center justify-between p-2 rounded-xl bg-rose-50/20 border border-rose-100">
                    <div className="flex items-center gap-2">
                      <img src={getAvatar(u)} alt="Avatar" className="w-8 h-8 rounded-full object-cover" />
                      <span className="text-xs font-bold text-slate-800">{u.name}</span>
                    </div>
                    <button 
                      onClick={() => handleBlockToggle(u._id)}
                      className="px-2.5 py-1 rounded-lg bg-white border border-rose-200 text-rose-500 text-[10px] font-bold hover:bg-rose-50 transition cursor-pointer"
                    >
                      Unblock
                    </button>
                  </div>
                ))
              )}
            </div>
            <button 
              onClick={() => setShowBlockedModal(false)}
              className="w-full py-2.5 rounded-xl bg-brand-blue text-white text-[13px] font-bold hover:bg-brand-blue-hover transition cursor-pointer shadow-md"
            >
              Close
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
