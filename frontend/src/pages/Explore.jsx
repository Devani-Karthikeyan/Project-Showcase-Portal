import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth, BACKEND_URL } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { useBookmark } from '../context/BookmarkContext';
import { Search, Heart, Eye, Bookmark, CheckCircle2, ChevronDown, LayoutGrid, List, Sparkles, Filter } from 'lucide-react';

export default function Explore({ isSidebarOpen }) {
  const { user, isAuthenticated } = useAuth();
  const { addToast } = useNotifications();
  const { handleBookmark, modalProjectId, setModalProjectId } = useBookmark();
  const [searchParams, setSearchParams] = useSearchParams();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(12);
  const navigate = useNavigate();
  
  // Filters State with sessionStorage persistence to restore previous position on back navigation
  const [search, setSearch] = useState(() => sessionStorage.getItem('exp_search') ?? (searchParams.get('search') || ''));
  const [activeTab, setActiveTab] = useState(() => sessionStorage.getItem('exp_tab') || 'Popular');
  const [viewMode, setViewMode] = useState(() => sessionStorage.getItem('exp_view') || 'grid');
  const [selectedCategories, setSelectedCategories] = useState(() => {
    const saved = sessionStorage.getItem('exp_categories');
    return saved ? JSON.parse(saved) : [];
  });
  const [selectedTech, setSelectedTech] = useState(() => sessionStorage.getItem('exp_tech') || '');
  
  const categoriesList = [
    'All Categories', 'Web Development', 'Mobile Apps', 'AI / ML', 
    'Data Science', 'UI / UX', 'Cyber Security', 'Blockchain', 'IoT'
  ];

  // Persist state to sessionStorage
  useEffect(() => {
    sessionStorage.setItem('exp_search', search);
    sessionStorage.setItem('exp_tab', activeTab);
    sessionStorage.setItem('exp_view', viewMode);
    sessionStorage.setItem('exp_categories', JSON.stringify(selectedCategories));
    sessionStorage.setItem('exp_tech', selectedTech);
  }, [search, activeTab, viewMode, selectedCategories, selectedTech]);

  // Save scroll position on scroll
  useEffect(() => {
    const handleScroll = () => {
      sessionStorage.setItem('exp_scroll', window.scrollY.toString());
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Sync search state if URL parameters change from Navbar
  useEffect(() => {
    const querySearch = searchParams.get('search');
    if (querySearch !== null && querySearch !== search) {
      setSearch(querySearch);
      fetchProjects({ search: querySearch });
    }
  }, [searchParams]);

  const fetchProjects = async (options = {}) => {
    setLoading(true);
    setVisibleCount(12);
    try {
      const token = localStorage.getItem('token');
      
      const queryParams = new URLSearchParams();
      const currentSearch = options.clear ? '' : (options.search !== undefined ? options.search : search);
      const currentCats = options.clear ? [] : selectedCategories;
      const currentTech = options.clear ? '' : selectedTech;

      if (currentSearch) queryParams.append('search', currentSearch);
      if (currentTech) queryParams.append('module', currentTech);

      const headers = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${BACKEND_URL}/api/projects?${queryParams.toString()}`, { headers });
      
      if (res.ok) {
        let data = await res.json();
        
        // Filter by categories on the frontend so it perfectly matches the UI badges
        if (currentCats.length > 0) {
          data = data.filter(project => {
            const cat = getProjectCategory(project);
            return currentCats.includes(cat);
          });
        }
        
        const currentTab = options.tab || activeTab;

        // Sorting logic based on active tab
        if (currentTab === 'Latest') {
          data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        } else if (currentTab === 'Most Liked') {
          data.sort((a, b) => b.likesCount - a.likesCount);
        } else if (currentTab === 'Most Viewed') {
          data.sort((a, b) => b.viewsCount - a.viewsCount);
        } else {
          // Popular (complex weight: likes + views)
          data.sort((a, b) => (b.likesCount * 10 + b.viewsCount) - (a.likesCount * 10 + a.viewsCount));
        }

        setProjects(data);
      }
    } catch (err) {
      console.error('Error loading projects:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (e, projectId, currentlyLiked) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) return addToast('Please log in to like projects', 'info');

    const token = localStorage.getItem('token');
    const endpoint = currentlyLiked ? 'unlike' : 'like';
    try {
      const res = await fetch(`${BACKEND_URL}/api/projects/${projectId}/${endpoint}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setProjects(prev => prev.map(p => 
          p._id === projectId ? { ...p, userLiked: !currentlyLiked, likesCount: data.likesCount } : p
        ));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const onBookmarkStateChange = (projectId, newState, delta) => {
    setProjects(prev => prev.map(p => 
      p._id === projectId ? { ...p, userBookmarked: newState, bookmarksCount: Math.max(0, (p.bookmarksCount || 0) + delta) } : p
    ));
  };

  // Initial fetch on mount or user change
  useEffect(() => {
    fetchProjects();
  }, [user]);

  // Restore scroll position after loading completes
  useEffect(() => {
    if (!loading && projects.length > 0) {
      const savedScroll = sessionStorage.getItem('exp_scroll');
      if (savedScroll) {
        window.scrollTo(0, parseInt(savedScroll, 10));
      }
    }
  }, [loading, projects]);

  // Helper for generating dynamic tech stack pills (since backend uses modules)
  const getTechTags = (project) => {
    const defaultTags = ['React', 'Node.js', 'MongoDB'];
    if (project.technologies && project.technologies.length > 0) return project.technologies;
    if (project.modules && project.modules.length > 0) return project.modules;
    return ['React', 'Node.js', 'MongoDB']; // fallback
  };

  // Helper to derive a consistent category for UI badge and filtering
  const getProjectCategory = (project) => {
    if (project.department === 'Computer Science') return "AI / ML";
    if (project.department === 'Information Systems') return "Data Science";
    
    const text = `${project.title || ''} ${project.description || ''} ${project.modules?.join(' ') || ''}`.toLowerCase();
    if (text.includes('mobile') || text.includes('app') || text.includes('flutter') || text.includes('react native')) return 'Mobile Apps';
    if (text.includes('cyber') || text.includes('security')) return 'Cyber Security';
    if (text.includes('blockchain') || text.includes('crypto') || text.includes('web3') || text.includes('ethereum')) return 'Blockchain';
    if (text.includes('iot') || text.includes('hardware') || text.includes('arduino') || text.includes('sensor')) return 'IoT';
    if (text.includes('ui') || text.includes('ux') || text.includes('design') || text.includes('figma')) return 'UI / UX';
    if (text.includes('data') || text.includes('analytics') || text.includes('machine learning')) return 'Data Science';
    if (text.includes('ai ') || text.includes('artificial intelligence')) return 'AI / ML';
    
    return "Web Development";
  };

  const timeAgo = (dateStr) => {
    const diff = new Date() - new Date(dateStr);
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Today';
    if (days === 1) return '1 day ago';
    if (days < 30) return `${days} days ago`;
    return '1 month ago';
  };

  // Determine grid classes based on sidebar visibility
  const gridClasses = isSidebarOpen 
    ? "grid md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-5" 
    : "grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5";

  return (
    <div className="flex flex-col xl:flex-row w-full h-full min-h-[calc(100vh-76px)] items-start p-8 gap-8">
      
      {/* Left Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Header Area */}
        <div className="mb-6">
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight font-display mb-1.5">Explore Projects</h1>
          <p className="text-[14px] text-slate-500 font-medium">Discover amazing projects built by students</p>
        </div>

        {/* Tabs & View Toggles Area */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="flex flex-wrap gap-2">
            {['Popular', 'Latest', 'Most Liked', 'Most Viewed'].map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab);
                  fetchProjects({ tab });
                }}
                className={`px-5 py-1.5 rounded-full text-[14px] font-semibold transition-all ${
                  activeTab === tab 
                    ? 'bg-brand-blue text-white shadow-md' 
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[15px] font-semibold text-slate-500 mr-2">View</span>
            <div className="flex items-center bg-white border border-slate-200 rounded-lg p-1">
              <button 
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded transition ${viewMode === 'grid' ? 'bg-blue-50 text-brand-blue' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <LayoutGrid className="w-5 h-5" />
              </button>
              <button 
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded transition ${viewMode === 'list' ? 'bg-blue-50 text-brand-blue' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <List className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Projects Grid Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 bg-white rounded-2xl border border-slate-200">
            <div className="w-10 h-10 border-4 border-slate-200 border-t-brand-blue rounded-full animate-spin"></div>
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-32 border border-slate-200 rounded-2xl bg-white shadow-sm flex flex-col items-center justify-center">
            <Search className="w-12 h-12 text-slate-300 mb-4" />
            <h3 className="text-xl font-bold text-slate-800">No projects found</h3>
            <p className="text-slate-500 text-[15px] mt-1">Try widening your filters or refining your search parameters.</p>
          </div>
        ) : (
          <div className={viewMode === 'grid' ? gridClasses : "flex flex-col gap-6"}>
            {projects.slice(0, visibleCount).map((project) => {
              const techTags = getTechTags(project);
              const visibleTags = techTags.slice(0, 3);
              const remainingTagsCount = techTags.length > 3 ? techTags.length - 3 : 0;
              const displayCategory = getProjectCategory(project);

              return (
                <div
                  key={project._id}
                  onClick={() => navigate(`/projects/${project._id}`)}
                  className={`relative group flex rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer ${
                    viewMode === 'grid' ? 'flex-col' : 'flex-row h-64'
                  }`}
                >
                  {/* Thumbnail Area */}
                  <div className={`relative block overflow-hidden bg-slate-100 ${viewMode === 'grid' ? 'h-44' : 'w-72 h-full shrink-0 border-r border-slate-200'}`}>
                    
                    {project.thumbnail ? (
                      <img
                        src={project.thumbnail.startsWith('data:') ? project.thumbnail : `${BACKEND_URL}${project.thumbnail}`}
                        alt={project.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-slate-100 to-indigo-50 flex items-center justify-center">
                        <Sparkles className="w-10 h-10 text-brand-blue opacity-50" />
                      </div>
                    )}

                    {/* Top Overlay Badges */}
                    <div className="absolute top-3 left-3 flex gap-2 z-10 pointer-events-none">
                      <span className="px-3 py-1.5 rounded-full bg-white/95 backdrop-blur text-[12px] font-bold text-slate-700 shadow-sm">
                        {displayCategory}
                      </span>
                    </div>
                    
                    <button 
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleBookmark(e, project._id, project.userBookmarked, (ns, delta) => onBookmarkStateChange(project._id, ns, delta)); }}
                      className={`absolute top-3 right-3 p-2.5 rounded-xl shadow-sm hover:scale-110 transition-all z-20 cursor-pointer ${project.userBookmarked ? 'bg-brand-blue text-white' : 'bg-white/95 backdrop-blur text-brand-blue hover:bg-brand-blue hover:text-white'}`}
                    >
                      <Bookmark className="w-4 h-4" fill={project.userBookmarked ? 'currentColor' : 'none'} />
                    </button>
                  </div>

                  {/* Content Area */}
                  <div className="p-4 flex-1 flex flex-col justify-between min-w-0">
                    <div>
                      {/* Title & Verified */}
                      <div className="flex items-center gap-2 group-hover:text-brand-blue transition-colors">
                        <h3 className="font-bold text-[18px] text-slate-900 truncate font-display leading-tight">{project.title}</h3>
                        <CheckCircle2 className="w-4 h-4 text-brand-blue shrink-0 fill-blue-50" />
                      </div>

                      {/* Author Info */}
                      <div className="flex items-center gap-3 mt-3 mb-3">
                        <img 
                          src={project.studentId?.avatarUrl ? (project.studentId.avatarUrl.startsWith('http') ? project.studentId.avatarUrl : `${BACKEND_URL}${project.studentId.avatarUrl}`) : `https://api.dicebear.com/7.x/notionists/svg?seed=${project.studentId?.name || 'Student'}`} 
                          alt="avatar" 
                          className="w-6 h-6 rounded-full bg-slate-100 border border-slate-200 object-cover"
                        />
                        <span className="text-[14px] text-slate-500 font-semibold truncate">
                          {project.studentId?.name || "Anonymous Student"}
                        </span>
                      </div>

                      {/* Description */}
                      <p className="text-slate-500 text-[14px] leading-relaxed line-clamp-2">
                        {project.description}
                      </p>
                    </div>

                    <div className="mt-4">
                      {/* Tech Pills */}
                      <div className="flex flex-wrap items-center gap-2 mb-4">
                        {visibleTags.map((tag, idx) => (
                          <span key={idx} className="px-3 py-1.5 rounded-full bg-slate-50 border border-slate-100 text-[11px] font-bold text-slate-600">
                            {tag}
                          </span>
                        ))}
                        {remainingTagsCount > 0 && (
                          <span className="px-2 py-1.5 rounded-full bg-slate-50 border border-slate-100 text-[11px] font-bold text-slate-600">
                            +{remainingTagsCount}
                          </span>
                        )}
                      </div>

                      {/* Footer Stats */}
                      <div className="flex items-center justify-between text-[13px] font-bold text-slate-400">
                        <div className="flex items-center gap-4.5">
                          <span 
                            onClick={(e) => handleLike(e, project._id, project.userLiked)}
                            className={`flex items-center gap-1.5 transition cursor-pointer ${project.userLiked ? 'text-rose-500' : 'hover:text-rose-500'}`}
                          >
                            <Heart className={`w-4.5 h-4.5 transition-colors ${project.userLiked ? 'fill-current' : 'fill-slate-200 hover:fill-rose-500'}`} />
                            {project.likesCount || 0}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Eye className="w-4.5 h-4.5" />
                            {project.viewsCount > 1000 ? (project.viewsCount / 1000).toFixed(1) + 'K' : project.viewsCount}
                          </span>
                        </div>
                        <span className="font-semibold text-slate-500">{timeAgo(project.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        
        {/* See More Projects Button */}
        {!loading && projects.length > visibleCount && (
          <div className="flex justify-center mt-10 mb-6">
            <button
              onClick={() => setVisibleCount(prev => prev + 12)}
              className="px-8 py-3.5 bg-gradient-to-r from-brand-blue to-blue-600 hover:from-brand-blue-hover hover:to-blue-700 text-white font-semibold text-[15px] rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 cursor-pointer flex items-center gap-2"
            >
              See More Projects <ChevronDown className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Right Sidebar Placeholder to maintain flex layout */}
      <div className="hidden xl:block w-[280px] shrink-0"></div>

      {/* Right Sidebar: Filters Area */}
      <aside className="hidden xl:flex w-[280px] shrink-0 flex-col bg-white border border-slate-200 rounded-2xl h-fit fixed top-[130px] right-8 p-4 z-20 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[15px] font-bold text-slate-900 font-display">Filters</h2>
          <button 
            onClick={() => { setSelectedCategories([]); setSearch(''); setSelectedTech(''); fetchProjects({ clear: true }); }}
            className="text-xs font-semibold text-brand-blue hover:text-brand-blue-hover cursor-pointer"
          >
            Clear all
          </button>
        </div>

        <div className="flex flex-col gap-3">
          
          {/* Search filter */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search projects..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchProjects()}
                className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-800 placeholder-slate-400 text-[13px] focus:outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue transition"
              />
            </div>
          </div>

          {/* Categories filter */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Categories</label>
            <div className="flex flex-col gap-0.5">
              {categoriesList.map((cat) => {
                const isSelected = cat === 'All Categories' ? selectedCategories.length === 0 : selectedCategories.includes(cat);
                return (
                  <label 
                    key={cat} 
                    onClick={(e) => {
                      e.preventDefault();
                      if (cat === 'All Categories') {
                        setSelectedCategories([]);
                      } else {
                        setSelectedCategories(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]);
                      }
                    }}
                    className="flex items-center justify-between cursor-pointer group py-0.5"
                  >
                    <span className={`text-[12.5px] transition ${isSelected ? 'font-bold text-slate-900' : 'font-medium text-slate-500 group-hover:text-slate-800'}`}>
                      {cat}
                    </span>
                    <div className={`w-3.5 h-3.5 rounded border-2 flex items-center justify-center transition ${isSelected ? 'border-brand-blue bg-brand-blue' : 'border-slate-300'}`}>
                      {isSelected && <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Technologies dropdown */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Technologies</label>
            <div className="relative">
              <select 
                value={selectedTech}
                onChange={(e) => setSelectedTech(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-500 text-[13px] focus:outline-none appearance-none cursor-pointer"
              >
                <option value="">Select technologies</option>
                <option value="react">React</option>
                <option value="node.js">Node.js</option>
                <option value="python">Python</option>
                <option value="mongodb">MongoDB</option>
                <option value="firebase">Firebase</option>
                <option value="flutter">Flutter</option>
                <option value="tensorflow">TensorFlow</option>
              </select>
              <ChevronDown className="absolute right-3 top-2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Sort By dropdown */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Sort By</label>
            <div className="relative">
              <select 
                value={activeTab}
                onChange={(e) => setActiveTab(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-900 font-medium text-[13px] focus:outline-none appearance-none cursor-pointer"
              >
                <option value="Popular">Popular</option>
                <option value="Latest">Latest</option>
                <option value="Most Liked">Most Liked</option>
                <option value="Most Viewed">Most Viewed</option>
              </select>
              <ChevronDown className="absolute right-3 top-2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Apply Button */}
          <button 
            onClick={fetchProjects}
            className="w-full py-2 rounded-lg bg-brand-blue hover:bg-brand-blue-hover text-white font-semibold text-[13px] shadow-sm hover:shadow transition flex items-center justify-center gap-2 mt-1 cursor-pointer"
          >
            <Filter className="w-3.5 h-3.5" /> Apply Filters
          </button>
        </div>
      </aside>
    </div>
  );
}
