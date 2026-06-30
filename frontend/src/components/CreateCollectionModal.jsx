import React, { useState, useEffect } from 'react';
import { 
  X, Image as ImageIcon, Monitor, ChevronDown, Check, Lock, Globe, Search, Plus,
  Folder, Laptop, Cpu, Book, Bookmark, Code, Heart, Activity, Briefcase, Coffee, Lightbulb, Link as LinkIcon
} from 'lucide-react';
import { BACKEND_URL } from '../context/AuthContext';

const ICONS = [
  { name: 'Folder', component: Folder },
  { name: 'Laptop', component: Laptop },
  { name: 'Monitor', component: Monitor },
  { name: 'Cpu', component: Cpu },
  { name: 'Book', component: Book },
  { name: 'Bookmark', component: Bookmark },
  { name: 'Code', component: Code },
  { name: 'Heart', component: Heart },
  { name: 'Activity', component: Activity },
  { name: 'Briefcase', component: Briefcase },
  { name: 'Coffee', component: Coffee },
  { name: 'Lightbulb', component: Lightbulb },
];

export default function CreateCollectionModal({ isOpen, onClose, bookmarkedProjects = [], onSuccess, initialSelectedProjects = [], editCollection = null }) {
  if (!isOpen) return null;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState('private');
  const [colorTheme, setColorTheme] = useState('indigo');
  const [icon, setIcon] = useState('Folder');
  const [isIconDropdownOpen, setIsIconDropdownOpen] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState(['React', 'Next.js', 'UI/UX']);
  const [selectedProjects, setSelectedProjects] = useState(initialSelectedProjects);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Clean up state when modal opens
  useEffect(() => {
    if (isOpen) {
      if (editCollection) {
        setName(editCollection.title || '');
        setDescription(editCollection.description || '');
        setVisibility(editCollection.visibility || 'private');
        setColorTheme(editCollection.colorTheme || 'indigo');
        setIcon(editCollection.icon || 'Folder');
        setTags(editCollection.tags || []);
        setSelectedProjects(editCollection.projectIds || []);
      } else {
        setName('');
        setDescription('');
        setVisibility('private');
        setColorTheme('indigo');
        setIcon('Folder');
        setTags(['React', 'Next.js', 'UI/UX']);
        setSelectedProjects(initialSelectedProjects);
      }
      setSearchQuery('');
      setIsSubmitting(false);
      setIsIconDropdownOpen(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const colors = [
    { id: 'indigo', hex: 'bg-[#6366f1]' },
    { id: 'blue', hex: 'bg-[#60a5fa]' },
    { id: 'teal', hex: 'bg-[#2dd4bf]' },
    { id: 'orange', hex: 'bg-[#fb923c]' },
    { id: 'red', hex: 'bg-[#f87171]' },
    { id: 'purple', hex: 'bg-[#818cf8]' }
  ];

  const removeTag = (tagToRemove) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const handleAddTag = (e) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!tags.includes(tagInput.trim())) {
        setTags([...tags, tagInput.trim()]);
      }
      setTagInput('');
    }
  };

  const toggleProject = (projectId) => {
    if (selectedProjects.includes(projectId)) {
      setSelectedProjects(selectedProjects.filter(id => id !== projectId));
    } else {
      setSelectedProjects([...selectedProjects, projectId]);
    }
  };

  const handleSubmit = async () => {
    if (!name.trim() || !description.trim()) {
      alert("Name and description are required");
      return;
    }
    
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const isEdit = !!editCollection;
      const url = isEdit 
        ? `${BACKEND_URL}/api/collections/${editCollection.id}` 
        : `${BACKEND_URL}/api/collections`;
        
      const res = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name,
          description,
          visibility,
          colorTheme,
          icon,
          tags,
          projects: selectedProjects
        })
      });

      if (res.ok) {
        if (onSuccess) onSuccess();
        onClose();
      } else {
        const errData = await res.json();
        alert(errData.message || `Failed to ${isEdit ? 'update' : 'create'} collection`);
      }
    } catch (error) {
      console.error(error);
      alert("An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredBookmarks = bookmarkedProjects.filter(p => 
    p.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-[2px]">
      <div 
        className="bg-white rounded-2xl shadow-xl w-full max-w-[840px] max-h-[90vh] flex flex-col relative overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header (Sticky) */}
        <div className="flex items-start justify-between px-8 py-6 border-b border-slate-100 shrink-0">
          <div>
            <h2 className="text-[22px] font-extrabold text-slate-900 font-display mb-1">
              {editCollection ? 'Edit Collection' : 'Create New Collection'}
            </h2>
            <p className="text-[13px] font-medium text-slate-500">
              {editCollection ? 'Update your collection details and add or remove bookmarks.' : 'Organize your bookmarks by creating a new collection.'}
            </p>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full border border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="grid md:grid-cols-[1fr_340px] gap-8">
            
            {/* Left Column */}
            <div className="flex flex-col gap-6">
              
              {/* Collection Name */}
              <div className="flex flex-col gap-2">
                <label className="text-[13px] font-bold text-slate-800">
                  Collection Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input 
                    type="text" 
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="e.g. Web Development Inspiration"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-[13px] text-slate-800 placeholder-slate-400 focus:outline-none focus:border-brand-blue"
                  />
                  <div className="text-right mt-1.5">
                    <span className="text-[11px] font-bold text-slate-400">{name.length}/80</span>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="flex flex-col gap-2">
                <label className="text-[13px] font-bold text-slate-800">
                  Description <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <textarea 
                    rows="3"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="Describe what this collection is about..."
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-[13px] text-slate-800 placeholder-slate-400 focus:outline-none focus:border-brand-blue resize-none"
                  ></textarea>
                  <div className="text-right mt-1.5">
                    <span className="text-[11px] font-bold text-slate-400">{description.length}/300</span>
                  </div>
                </div>
              </div>

              {/* Icon Selector */}
              <div className="flex flex-col gap-2">
                <label className="text-[13px] font-bold text-slate-800">Icon</label>
                <div className="flex items-center gap-3 relative">
                  <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-brand-blue shrink-0">
                    {(() => {
                      const IconComp = ICONS.find(i => i.name === icon)?.component || Monitor;
                      return <IconComp className="w-6 h-6" />;
                    })()}
                  </div>
                  
                  <div className="relative flex-1">
                    <button 
                      onClick={() => setIsIconDropdownOpen(!isIconDropdownOpen)}
                      className="w-full sm:w-auto flex items-center justify-between gap-2 px-5 py-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition cursor-pointer text-[13px] font-bold text-slate-700"
                    >
                      Choose Icon <ChevronDown className="w-4 h-4 text-slate-400" />
                    </button>

                    {isIconDropdownOpen && (
                      <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-slate-200 rounded-xl shadow-lg p-3 grid grid-cols-4 gap-2 z-50">
                        {ICONS.map(ic => (
                          <button
                            key={ic.name}
                            onClick={() => {
                              setIcon(ic.name);
                              setIsIconDropdownOpen(false);
                            }}
                            className={`w-12 h-12 flex items-center justify-center rounded-lg transition cursor-pointer ${
                              icon === ic.name ? 'bg-indigo-50 text-brand-blue' : 'text-slate-500 hover:bg-slate-100'
                            }`}
                            title={ic.name}
                          >
                            <ic.component className="w-5 h-5" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Tags */}
              <div className="flex flex-col gap-2 mt-2">
                <label className="text-[13px] font-bold text-slate-800">Tags <span className="text-slate-400 font-medium">(Optional)</span></label>
                <input 
                  type="text"
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  onKeyDown={handleAddTag}
                  placeholder="Add tags and press Enter..."
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-[13px] text-slate-800 placeholder-slate-400 focus:outline-none focus:border-brand-blue mb-2"
                />
                <div className="flex flex-wrap items-center gap-2">
                  {tags.map(tag => (
                    <div key={tag} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 text-brand-blue text-[12px] font-bold">
                      {tag}
                      <button onClick={() => removeTag(tag)} className="text-brand-blue/60 hover:text-brand-blue"><X className="w-3 h-3" /></button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Visibility */}
              <div className="flex flex-col gap-2">
                <label className="text-[13px] font-bold text-slate-800">Visibility</label>
                <div className="flex flex-col gap-3">
                  <div 
                    onClick={() => setVisibility('private')}
                    className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition ${
                      visibility === 'private' ? 'border-brand-blue bg-indigo-50/50' : 'border-slate-200 bg-white'
                    }`}
                  >
                    <div className={`w-4 h-4 mt-0.5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                      visibility === 'private' ? 'border-brand-blue' : 'border-slate-300'
                    }`}>
                      {visibility === 'private' && <div className="w-2 h-2 rounded-full bg-brand-blue" />}
                    </div>
                    <div>
                      <h4 className={`text-[13px] font-bold flex items-center gap-2 ${visibility === 'private' ? 'text-slate-900' : 'text-slate-700'}`}>
                        <Lock className={`w-4 h-4 ${visibility === 'private' ? 'text-brand-blue' : 'text-slate-400'}`} /> Private
                      </h4>
                      <p className="text-[12px] font-medium text-slate-500 mt-0.5">Only you can view this collection</p>
                    </div>
                  </div>

                  <div 
                    onClick={() => setVisibility('public')}
                    className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition ${
                      visibility === 'public' ? 'border-brand-blue bg-indigo-50/50' : 'border-slate-200 bg-white'
                    }`}
                  >
                    <div className={`w-4 h-4 mt-0.5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                      visibility === 'public' ? 'border-brand-blue' : 'border-slate-300'
                    }`}>
                      {visibility === 'public' && <div className="w-2 h-2 rounded-full bg-brand-blue" />}
                    </div>
                    <div>
                      <h4 className={`text-[13px] font-bold flex items-center gap-2 ${visibility === 'public' ? 'text-slate-900' : 'text-slate-700'}`}>
                        <Globe className={`w-4 h-4 ${visibility === 'public' ? 'text-brand-blue' : 'text-slate-400'}`} /> Public
                      </h4>
                      <p className="text-[12px] font-medium text-slate-500 mt-0.5">Anyone can view this collection</p>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* Right Column */}
            <div className="flex flex-col gap-6">
              
              {/* Color Theme */}
              <div className="flex flex-col gap-2 mt-2">
                <label className="text-[13px] font-bold text-slate-800">Color Theme</label>
                <div className="flex items-center gap-3">
                  {colors.map(color => (
                    <div 
                      key={color.id}
                      onClick={() => setColorTheme(color.id)}
                      className={`w-9 h-9 rounded-lg flex items-center justify-center cursor-pointer transition ${color.hex} ${
                        colorTheme === color.id ? 'ring-2 ring-brand-blue ring-offset-2' : 'hover:scale-110'
                      }`}
                    >
                      {colorTheme === color.id && <Check className="w-5 h-5 text-white" />}
                    </div>
                  ))}
                </div>
              </div>

              {/* Add Existing Bookmarks */}
              <div className="flex flex-col gap-3 mt-4">
                <label className="text-[13px] font-bold text-slate-800">Add Existing Bookmarks <span className="text-slate-400 font-medium">(Optional)</span></label>
                <div className="relative">
                  <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                  <input 
                    type="text" 
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search bookmarks..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-[13px] text-slate-800 placeholder-slate-400 focus:outline-none focus:border-brand-blue"
                  />
                </div>
                
                <div className="flex flex-col gap-1 border border-slate-100 rounded-xl p-2 bg-slate-50/30 max-h-[300px] overflow-y-auto custom-scrollbar">
                  {filteredBookmarks.length === 0 ? (
                     <p className="text-[12px] text-slate-400 p-2 text-center">No bookmarks found.</p>
                  ) : filteredBookmarks.map(bm => {
                    const isSelected = selectedProjects.includes(bm._id);
                    const thumbnail = bm.thumbnail ? (bm.thumbnail.startsWith('data:') ? bm.thumbnail : `${BACKEND_URL}${bm.thumbnail}`) : 'https://via.placeholder.com/40';
                    return (
                      <div key={bm._id} onClick={() => toggleProject(bm._id)} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition cursor-pointer">
                        <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                          isSelected ? 'bg-brand-blue border-brand-blue text-white' : 'border-slate-300 text-transparent'
                        }`}>
                          <Check className="w-3 h-3" />
                        </div>
                        <img src={thumbnail} alt="" className="w-9 h-9 rounded bg-slate-200 object-cover shrink-0" />
                        <div className="flex flex-col min-w-0">
                          <span className="text-[13px] font-bold text-slate-800 truncate">{bm.title}</span>
                          <span className="text-[11px] font-medium text-slate-500 truncate">{bm.department}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

            </div>

          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-5 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50/50 shrink-0">
          <button 
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 font-bold text-[13px] hover:bg-slate-50 transition shadow-sm cursor-pointer"
          >
            Cancel
          </button>
          <button 
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-brand-blue text-white font-bold text-[13px] hover:bg-blue-700 transition shadow-sm cursor-pointer disabled:opacity-50"
          >
            {editCollection ? null : <Plus className="w-4 h-4" />} 
            {isSubmitting ? 'Saving...' : (editCollection ? 'Save Changes' : 'Create Collection')}
          </button>
        </div>

      </div>
    </div>
  );
}
