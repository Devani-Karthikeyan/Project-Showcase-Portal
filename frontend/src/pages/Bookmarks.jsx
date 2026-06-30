import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth, BACKEND_URL } from '../context/AuthContext';
import {
  Bookmark,
  Plus,
  Search,
  ChevronDown,
  LayoutGrid,
  List,
  MoreVertical,
  Eye,
  Heart,
  Edit3,
  Trash2,
  Monitor,
  Leaf,
  Cpu,
  Shield,
  Box,
  Info,
  Folder,
  Laptop,
  Book,
  Code,
  Activity
} from 'lucide-react';

import CreateCollectionModal from '../components/CreateCollectionModal';
import { useBookmark } from '../context/BookmarkContext';

export default function Bookmarks() {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const querySearch = searchParams.get('search') || '';
  
  const [activeTab, setActiveTab] = useState('bookmarks'); // 'bookmarks' | 'collections'
  const [bookmarkedProjects, setBookmarkedProjects] = useState([]);
  const [dynamicCollections, setDynamicCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sortBy, setSortBy] = useState('newest'); // 'newest' | 'oldest'
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [selectedCollectionId, setSelectedCollectionId] = useState(null);
  const [editCollectionData, setEditCollectionData] = useState(null);

  const { handleBookmark, modalProjectId, setModalProjectId } = useBookmark();

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      // Fetch bookmarked projects
      const projRes = await fetch(`${BACKEND_URL}/api/projects`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (projRes.ok) {
        const allProjects = await projRes.json();
        setBookmarkedProjects(allProjects.filter(p => p.userBookmarked));
      }

      // Fetch collections
      const colRes = await fetch(`${BACKEND_URL}/api/collections`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (colRes.ok) {
        const collections = await colRes.json();
        
        // Define ICONS lookup mapping
        const IconsMap = {
          Folder, Laptop, Monitor, Cpu, Book, Bookmark, Code, Heart, Activity, Box, Shield, Info
        };
        
        const mappedCollections = collections.map(col => {
          const count = col.projects?.length || 0;
          const images = (col.projects || []).slice(0, 3).map(p => p.thumbnail ? (p.thumbnail.startsWith('data:') ? p.thumbnail : `${BACKEND_URL}${p.thumbnail}`) : 'https://via.placeholder.com/150');
          while(images.length < 3) images.push('https://via.placeholder.com/150?text=Empty');
          
          return {
            id: col._id,
            title: col.name,
            description: col.description,
            count,
            updatedAt: col.updatedAt,
            meta: `Updated ${new Date(col.updatedAt).toLocaleDateString()} • ${count} bookmarks`,
            images,
            moreCount: count > 3 ? `+${count - 3}` : "+0",
            iconBg: col.colorTheme === 'indigo' ? 'bg-indigo-50' : `bg-${col.colorTheme}-50`,
            iconColor: col.colorTheme === 'indigo' ? 'text-brand-blue' : `text-${col.colorTheme}-500`,
            icon: col.icon && IconsMap[col.icon] ? IconsMap[col.icon] : Folder,
            rawIcon: col.icon,
            colorTheme: col.colorTheme,
            tags: col.tags,
            projectIds: (col.projects || []).map(p => p._id || p)
          };
        });
        setDynamicCollections(mappedCollections);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchData();
  }, [isAuthenticated, navigate]);

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
        setBookmarkedProjects(prev => prev.map(p => 
          p._id === projectId ? { ...p, userLiked: !currentlyLiked, likesCount: data.likesCount } : p
        ));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const onBookmarkStateChange = (projectId, newState) => {
    // If we unbookmarked it on this page, immediately remove it from the list
    if (!newState) {
      setBookmarkedProjects(prev => prev.filter(p => p._id !== projectId));
    }
  };

  const thumbnailSrc = (project) => project.thumbnail
    ? (project.thumbnail.startsWith('data:') ? project.thumbnail : `${BACKEND_URL}${project.thumbnail}`)
    : 'https://via.placeholder.com/600x400?text=Project+Cover';

  const getStatusStyle = (status) => {
    if (status === 'approved') return 'bg-emerald-600 text-white';
    if (status === 'pending_approval') return 'bg-amber-400 text-amber-950';
    if (status === 'rejected') return 'bg-rose-500 text-white';
    return 'bg-slate-800 text-white';
  };

  const getStatusText = (status) => {
    if (status === 'approved') return 'Published';
    if (status === 'pending_approval') return 'Draft';
    return 'Archived';
  };

  return (
    <div className="flex flex-col h-full bg-white px-8 py-10 min-h-screen">
      
      {/* Header Area */}
      <div className="flex items-start justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center">
            <Bookmark className="w-6 h-6 text-brand-blue" fill={activeTab === 'bookmarks' && !selectedCollectionId ? "currentColor" : "none"} />
          </div>
          <div>
            <h1 className="text-[26px] font-extrabold text-slate-900 font-display mb-1.5">
              {selectedCollectionId 
                ? dynamicCollections.find(c => c.id === selectedCollectionId)?.title || 'Collection'
                : activeTab === 'bookmarks' ? 'Bookmarks' : 'Collections'}
            </h1>
            <p className="text-[14px] font-semibold text-slate-500">
              {selectedCollectionId 
                ? "Projects saved in this collection"
                : activeTab === 'bookmarks' 
                  ? "Projects you've saved for later" 
                  : "Organize your bookmarks into collections"}
            </p>
          </div>
        </div>
        {selectedCollectionId ? (
          <button 
            onClick={() => setEditCollectionData(dynamicCollections.find(c => c.id === selectedCollectionId))}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-brand-blue text-brand-blue font-bold text-[13px] hover:bg-blue-50 transition cursor-pointer shadow-sm"
          >
            <Edit3 className="w-4 h-4" /> Edit Collection
          </button>
        ) : (
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-brand-blue text-brand-blue font-bold text-[13px] hover:bg-blue-50 transition cursor-pointer shadow-sm"
          >
            <Plus className="w-4 h-4" /> New Collection
          </button>
        )}
      </div>

      {/* Tabs & Toolbar Row */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-6 border-b border-slate-200">
        <div className="flex items-center gap-8 px-2">
          {selectedCollectionId ? (
            <button 
              onClick={() => setSelectedCollectionId(null)}
              className="py-4 text-[14px] font-bold text-slate-500 hover:text-slate-800 transition cursor-pointer flex items-center gap-2 -mb-[1px]"
            >
              &larr; Back to Collections
            </button>
          ) : (
            <>
              <button 
                onClick={() => setActiveTab('bookmarks')}
                className={`py-4 text-[14px] font-bold transition -mb-[1px] cursor-pointer ${
                  activeTab === 'bookmarks' 
                    ? 'text-brand-blue border-b-2 border-brand-blue' 
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                All Bookmarks
              </button>
              <button 
                onClick={() => setActiveTab('collections')}
                className={`py-4 text-[14px] font-bold transition -mb-[1px] cursor-pointer ${
                  activeTab === 'collections' 
                    ? 'text-brand-blue border-b-2 border-brand-blue' 
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Collections
              </button>
            </>
          )}
        </div>

        <div className="flex items-center gap-4 pb-2">
          <div className="flex items-center p-1 rounded-xl bg-slate-50 border border-slate-200/60">
            <button 
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition cursor-pointer ${viewMode === 'grid' ? 'bg-white shadow-sm text-brand-blue' : 'text-slate-400 hover:text-slate-700'}`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition cursor-pointer ${viewMode === 'list' ? 'bg-white shadow-sm text-brand-blue' : 'text-slate-400 hover:text-slate-700'}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
          
          <div className="relative">
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="appearance-none flex items-center justify-between min-w-[200px] gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-[13px] font-bold hover:bg-slate-50 transition cursor-pointer outline-none focus:border-brand-blue"
            >
              <option value="newest">{activeTab === 'collections' ? 'Recently Updated' : 'Recently Added'}</option>
              <option value="oldest">Oldest First</option>
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-4 top-3 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Advanced Filter Row */}
      <div className="flex flex-col lg:flex-row lg:items-center gap-4 mb-8">
        <div className="relative flex-grow max-w-[320px]">
          <Search className="absolute left-4 top-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder={activeTab === 'bookmarks' ? "Search bookmarks..." : "Search collections..."}
            value={querySearch}
            onChange={(e) => {
              if (e.target.value) {
                setSearchParams({ search: e.target.value }, { replace: true });
              } else {
                setSearchParams({}, { replace: true });
              }
            }}
            className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-[13px] text-slate-800 placeholder-slate-400 focus:outline-none focus:border-brand-blue"
          />
        </div>
        
        {/* Conditional Dropdowns based on Tab */}
        {(activeTab === 'bookmarks' || selectedCollectionId) && (
          <div className="flex items-center gap-3">
            <div className="relative min-w-[160px]">
              <select 
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="appearance-none flex items-center justify-between min-w-[160px] gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 text-[13px] font-bold hover:bg-slate-50 transition cursor-pointer outline-none focus:border-brand-blue"
              >
                <option value="All">All Categories</option>
                <option value="Computer Science">Computer Science</option>
                <option value="Information Systems">Information Systems</option>
                <option value="Software Engineering">Software Engineering</option>
                <option value="Business Administration">Business</option>
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-4 top-3 pointer-events-none" />
            </div>
          </div>
        )}
      </div>

      {/* Dynamic Content Body based on Tab */}
      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center min-h-[400px]">
          <div className="w-10 h-10 border-4 border-slate-200 border-t-brand-blue rounded-full animate-spin mb-4"></div>
          <p className="text-slate-500 font-medium">Loading your saved projects...</p>
        </div>
      ) : activeTab === 'bookmarks' || selectedCollectionId ? (
        <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "flex flex-col gap-4"}>
          {bookmarkedProjects.length === 0 ? (
            <div className="col-span-full py-20 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50">
              <Bookmark className="w-10 h-10 text-slate-300 mb-4" />
              <h3 className="text-[16px] font-bold text-slate-700 mb-2">No bookmarks found</h3>
              <p className="text-[13px] text-slate-500 font-medium max-w-md text-center">You haven't saved any projects yet. Browse the Explore page and click the bookmark icon to save projects here.</p>
              <Link to="/" className="mt-6 px-6 py-2.5 rounded-xl bg-brand-blue text-white font-bold text-[13px] hover:bg-brand-blue-hover transition shadow-sm">
                Explore Projects
              </Link>
            </div>
          ) : (() => {
            let filteredBookmarks = bookmarkedProjects;
            
            if (selectedCollectionId) {
              const currentCollection = dynamicCollections.find(c => c.id === selectedCollectionId);
              if (currentCollection) {
                filteredBookmarks = filteredBookmarks.filter(p => currentCollection.projectIds.includes(p._id));
              }
            }
            
            filteredBookmarks = filteredBookmarks.filter(p => {
              const matchesSearch = !querySearch || `${p.title || ''} ${p.description || ''} ${p.modules?.join(' ') || ''}`.toLowerCase().includes(querySearch.toLowerCase());
              const matchesCategory = categoryFilter === 'All' || p.department === categoryFilter;
              return matchesSearch && matchesCategory;
            }).sort((a, b) => {
              if (sortBy === 'newest') return new Date(b.createdAt) - new Date(a.createdAt);
              if (sortBy === 'oldest') return new Date(a.createdAt) - new Date(b.createdAt);
              return 0;
            });

            if (filteredBookmarks.length === 0) {
              return (
                <div className="col-span-full py-20 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50">
                  <Bookmark className="w-10 h-10 text-slate-300 mb-4" />
                  <h3 className="text-[16px] font-bold text-slate-700 mb-2">No matching bookmarks</h3>
                  <p className="text-[13px] text-slate-500 font-medium max-w-md text-center">Try adjusting your search query.</p>
                </div>
              );
            }

            return filteredBookmarks.map((project) => (
              <div 
                key={project._id} 
                className={`relative bg-white border border-slate-200 rounded-2xl overflow-hidden hover:shadow-lg transition-all duration-300 group cursor-pointer ${
                  viewMode === 'list' ? 'flex flex-row items-stretch min-h-[200px]' : 'flex flex-col'
                }`} 
                onClick={() => navigate(`/projects/${project._id}`)}
              >
                
                {/* Card Image Area */}
                <div className={`relative bg-slate-50 border-slate-100 shrink-0 ${viewMode === 'list' ? 'w-72 border-r' : 'h-48 w-full border-b'}`}>
                  <img src={thumbnailSrc(project)} alt={project.title} className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ${viewMode === 'list' ? 'absolute inset-0' : ''}`} />
                  
                  {/* Status Badge */}
                  <div className="absolute top-4 left-4">
                    <span className={`px-3 py-1 rounded text-[11px] font-bold ${getStatusStyle(project.status)}`}>
                      {getStatusText(project.status)}
                    </span>
                  </div>

                  {/* Menu Button */}
                  <div className="absolute top-4 right-4">
                    <button onClick={(e) => e.stopPropagation()} className="w-8 h-8 rounded bg-white shadow-sm flex items-center justify-center text-slate-600 hover:text-brand-blue transition cursor-pointer">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Card Body & Footer Wrapper for List View */}
                <div className={`flex flex-col flex-grow ${viewMode === 'list' ? 'justify-between' : ''}`}>
                  {/* Card Body */}
                  <div className="p-5 flex flex-col flex-grow relative">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <h3 className="text-[16px] font-extrabold text-slate-900 font-display line-clamp-1">{project.title}</h3>
                      <button onClick={(e) => handleBookmark(e, project._id, project.userBookmarked, (ns) => onBookmarkStateChange(project._id, ns))} className="cursor-pointer hover:scale-110 transition-transform">
                        <Bookmark className="w-5 h-5 text-brand-blue shrink-0" fill="currentColor" />
                      </button>
                    </div>
                    
                    <p className="text-[13px] font-medium text-slate-500 leading-relaxed line-clamp-2 mb-4 flex-grow">
                      {project.description}
                    </p>

                    <div className="flex flex-wrap gap-2 mb-2">
                      {project.modules?.slice(0, 3).map((m, idx) => (
                        <span key={idx} className="px-2.5 py-1 rounded bg-slate-50 border border-slate-100 text-[11px] font-bold text-slate-600">
                          {m}
                        </span>
                      ))}
                      {project.modules?.length > 3 && (
                        <span className="px-2.5 py-1 rounded bg-slate-50 border border-slate-100 text-[11px] font-bold text-slate-600">
                          +{project.modules.length - 3}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className={`px-5 py-4 border-slate-100 flex items-center justify-between bg-white group-hover:bg-slate-50/50 transition ${viewMode === 'grid' ? 'border-t' : 'border-t mt-auto'}`}>
                  <div className="flex items-center gap-4 text-[12px] font-bold text-slate-500">
                    <span className="flex items-center gap-1.5"><Eye className="w-3.5 h-3.5 text-slate-400" /> {project.viewsCount > 999 ? (project.viewsCount/1000).toFixed(1)+'K' : (project.viewsCount||0)}</span>
                    <span 
                      onClick={(e) => handleLike(e, project._id, project.userLiked)}
                      className={`flex items-center gap-1.5 transition cursor-pointer ${project.userLiked ? 'text-rose-500' : 'hover:text-rose-500'}`}
                    >
                      <Heart className={`w-3.5 h-3.5 transition-colors ${project.userLiked ? 'fill-current' : 'fill-slate-200 hover:fill-rose-500'}`} /> 
                      {project.likesCount || 0}
                    </span>
                    <span 
                      onClick={(e) => handleBookmark(e, project._id, project.userBookmarked, (ns) => onBookmarkStateChange(project._id, ns))}
                      className={`flex items-center gap-1.5 transition cursor-pointer text-brand-blue`}
                    >
                      <Bookmark className={`w-3.5 h-3.5 transition-colors fill-current text-brand-blue`} /> 
                      {project.bookmarksCount || 0}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-slate-400 group-hover:hidden block">
                      {new Date(project.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                    
                    {user && project.studentId?._id === user.id && (
                      <div className="hidden group-hover:flex items-center gap-2">
                        <Link to={`/projects/${project._id}/edit`} onClick={(e) => e.stopPropagation()} className="flex items-center gap-1 text-[11px] font-bold text-slate-500 hover:text-brand-blue transition">
                          <Edit3 className="w-3.5 h-3.5" /> Edit
                        </Link>
                        <button onClick={(e) => { e.stopPropagation(); }} className="flex items-center gap-1 text-[11px] font-bold text-slate-500 hover:text-rose-600 transition cursor-pointer">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              </div>
            ))
          })()}
        </div>
      ) : (
        /* Collections Grid/List View */
        <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-12 relative h-full flex-grow" : "flex flex-col gap-4 pb-12 relative h-full flex-grow"}>
          {dynamicCollections.filter(col => 
            !querySearch || col.title.toLowerCase().includes(querySearch.toLowerCase()) || col.description.toLowerCase().includes(querySearch.toLowerCase())
          ).sort((a, b) => {
            if (sortBy === 'newest') return new Date(b.updatedAt) - new Date(a.updatedAt);
            if (sortBy === 'oldest') return new Date(a.updatedAt) - new Date(b.updatedAt);
            return 0;
          }).map((col) => (
            viewMode === 'grid' ? (
              <div 
                key={col.id} 
                onClick={() => setSelectedCollectionId(col.id)}
                className="group flex flex-col bg-white rounded-[24px] border border-slate-200 hover:border-brand-blue/30 hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden relative"
              >
                {/* Images Area */}
                <div className="h-[160px] w-full bg-slate-50 flex p-3 gap-2 shrink-0">
                  {/* Left large image */}
                  <div className="flex-1 rounded-xl overflow-hidden bg-slate-200 relative">
                    {col.images[0] && col.images[0] !== 'https://via.placeholder.com/150?text=Empty' ? (
                      <img src={col.images[0]} className="w-full h-full object-cover" alt="Preview" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300 bg-slate-100">
                        <col.icon className="w-10 h-10 opacity-20" />
                      </div>
                    )}
                  </div>
                  {/* Right column with 2 smaller images */}
                  <div className="w-[100px] flex flex-col gap-2">
                    <div className="flex-1 rounded-xl overflow-hidden bg-slate-200 relative">
                      {col.images[1] && col.images[1] !== 'https://via.placeholder.com/150?text=Empty' ? (
                        <img src={col.images[1]} className="w-full h-full object-cover" alt="Preview" />
                      ) : (
                        <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                          <div className="w-4 h-4 rounded-full bg-slate-200/50"></div>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 rounded-xl overflow-hidden bg-slate-200 relative">
                      {col.images[2] && col.images[2] !== 'https://via.placeholder.com/150?text=Empty' ? (
                        <img src={col.images[2]} className="w-full h-full object-cover" alt="Preview" />
                      ) : (
                        <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                          <div className="w-4 h-4 rounded-full bg-slate-200/50"></div>
                        </div>
                      )}
                      {col.count > 3 && (
                        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center">
                          <span className="text-white text-[13px] font-bold">+{col.count - 3}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Info Area */}
                <div className="p-5 flex flex-col flex-1">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-[12px] flex items-center justify-center shrink-0 ${col.iconBg} ${col.iconColor}`}>
                        <col.icon className="w-5 h-5" />
                      </div>
                      <h3 className="text-[16px] font-bold text-slate-900 leading-tight truncate">{col.title}</h3>
                    </div>
                    <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-50 text-slate-400 hover:text-slate-700 transition opacity-0 group-hover:opacity-100 border border-transparent hover:border-slate-200">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <p className="text-[13px] font-medium text-slate-500 mb-4 line-clamp-2 leading-relaxed min-h-[40px]">
                    {col.description}
                  </p>
                  
                  <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-auto">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">
                      {col.meta}
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-indigo-50 text-brand-blue text-[11px] font-bold border border-indigo-100/50">
                      {col.count} items
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div 
                key={col.id} 
                onClick={() => setSelectedCollectionId(col.id)}
                className="group flex flex-col md:flex-row md:items-center justify-between gap-6 py-6 border-b border-slate-100 hover:bg-slate-50/50 transition cursor-pointer px-4 -mx-4 rounded-xl"
              >
                <div className="flex items-start gap-5 max-w-xl">
                  {/* Icon Block */}
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${col.iconBg} ${col.iconColor}`}>
                    <col.icon className="w-6 h-6" />
                  </div>
                  
                  {/* Text Content */}
                  <div className="flex flex-col pt-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-[15px] font-bold text-slate-900 leading-tight">{col.title}</h3>
                      <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-brand-blue text-[11px] font-bold">
                        {col.count}
                      </span>
                    </div>
                    <p className="text-[13px] font-medium text-slate-500 mb-2 leading-relaxed">
                      {col.description}
                    </p>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">
                      {col.meta}
                    </span>
                  </div>
                </div>

                {/* Thumbnails Row */}
                <div className="flex items-center justify-end gap-3 md:pl-6">
                  <div className="flex gap-2">
                    {col.images.map((img, i) => (
                      <img key={i} src={img} alt="Preview" className="w-16 h-16 rounded-xl object-cover border border-slate-200 bg-slate-100" />
                    ))}
                    <div className="w-16 h-16 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center">
                      <span className="text-[13px] font-bold text-slate-600">{col.moreCount}</span>
                    </div>
                  </div>
                  <button className="ml-2 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white text-slate-400 hover:text-slate-700 transition opacity-0 group-hover:opacity-100 shadow-sm border border-transparent hover:border-slate-200">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )
          ))}

          {/* Footer Info text exactly matching screenshot */}
          <div className="absolute bottom-0 left-0 w-full flex items-center justify-center gap-2 pt-6 mt-6">
            <Info className="w-4 h-4 text-slate-400" />
            <span className="text-[12px] font-medium text-slate-500">You can drag & drop bookmarks to add them to collections</span>
          </div>
        </div>
      )}

      {/* New/Edit Collection Modal */}
      <CreateCollectionModal 
        isOpen={isModalOpen || !!editCollectionData} 
        onClose={() => {
          setIsModalOpen(false);
          setEditCollectionData(null);
        }} 
        bookmarkedProjects={bookmarkedProjects}
        onSuccess={fetchData}
        editCollection={editCollectionData}
      />
    </div>
  );
}
