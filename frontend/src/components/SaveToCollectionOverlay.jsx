import React, { useState, useEffect, useRef } from 'react';
import { Bookmark, Plus, Check } from 'lucide-react';
import { BACKEND_URL } from '../context/AuthContext';
import CreateCollectionModal from './CreateCollectionModal';

export default function SaveToCollectionModal({ isOpen, onClose, projectId }) {
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [projectDetails, setProjectDetails] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const thumbnailSrc = (project) => project?.thumbnail
    ? (project.thumbnail.startsWith('data:') ? project.thumbnail : `${BACKEND_URL}${project.thumbnail}`)
    : 'https://via.placeholder.com/150';

  useEffect(() => {
    if (isOpen) {
      fetchCollections();
      fetchProjectDetails();
    }
  }, [isOpen]);

  const fetchProjectDetails = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/projects/${projectId}`);
      if (res.ok) {
        const data = await res.json();
        setProjectDetails(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCollections = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${BACKEND_URL}/api/collections`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCollections(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToCollection = async (collection) => {
    if (savingId) return;
    
    const currentProjectIds = collection.projects.map(p => p._id || p);
    const isSaved = currentProjectIds.includes(projectId);
    
    if (isSaved) {
      // Remove from collection
      const index = currentProjectIds.indexOf(projectId);
      currentProjectIds.splice(index, 1);
    } else {
      currentProjectIds.push(projectId);
    }

    setSavingId(collection._id);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${BACKEND_URL}/api/collections/${collection._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ projects: currentProjectIds })
      });
      
      if (res.ok) {
        onClose();
      }
    } catch (err) {
      console.error(err);
      alert('Failed to save to collection');
    } finally {
      setSavingId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-[2px]" onClick={onClose}>
      <div 
        className="relative w-full max-w-[360px] bg-white rounded-[24px] flex flex-col shadow-2xl border border-slate-200 animate-in zoom-in-95 fade-in duration-200 ease-out overflow-hidden"
        onClick={e => e.stopPropagation()}
        style={{ maxHeight: '85vh' }}
      >

      {/* Saved Project Info */}
      <div className="flex items-center justify-between px-4 py-2 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-[10px] bg-slate-100 overflow-hidden shrink-0 border border-slate-200/60">
            {projectDetails ? (
              <img src={thumbnailSrc(projectDetails)} className="w-full h-full object-cover" alt="Saved project" />
            ) : (
              <div className="w-full h-full animate-pulse bg-slate-200"></div>
            )}
          </div>
          <div className="flex flex-col">
            <span className="text-[14px] font-bold text-slate-900 leading-tight">Saved</span>
            <span className="text-[11px] text-slate-500 font-medium tracking-wide">Private</span>
          </div>
        </div>
        <Bookmark className="w-6 h-6 text-slate-900 shrink-0 cursor-pointer hover:text-slate-700" fill="currentColor" onClick={onClose} />
      </div>

      <div className="w-full h-px bg-slate-100 shrink-0"></div>

      {/* Collections Header */}
      <div className="flex items-center justify-between px-4 py-2.5 shrink-0">
        <h2 className="text-[14px] font-bold text-slate-900">Collections</h2>
        <button 
          onClick={() => setIsCreateModalOpen(true)}
          className="text-[12px] font-bold text-blue-600 hover:text-blue-700 transition cursor-pointer"
        >
          New collection
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar px-2 pb-4">
        {loading ? (
          <div className="py-6 flex justify-center">
            <div className="w-5 h-5 border-2 border-slate-200 border-t-brand-blue rounded-full animate-spin"></div>
          </div>
        ) : collections.length === 0 ? (
          <div className="py-6 flex flex-col items-center justify-center px-4 text-center">
            <Bookmark className="w-6 h-6 text-slate-300 mb-2" />
            <h3 className="text-[13px] font-bold text-slate-700 mb-1">No collections yet</h3>
            <p className="text-[11px] text-slate-500">Click New collection to organize your saved projects.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            {collections.map(col => {
              const isSaved = col.projects.some(p => (p._id || p) === projectId);
              
              return (
                <button 
                  key={col._id}
                  onClick={() => handleSaveToCollection(col)}
                  className="flex items-center justify-between px-3 py-2 hover:bg-slate-50 transition cursor-pointer rounded-[14px] text-left group w-full"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-[12px] overflow-hidden flex items-center justify-center shrink-0 border border-slate-200/50 ${!col.projects?.length ? (col.colorTheme === 'indigo' ? 'bg-indigo-50 text-brand-blue' : `bg-${col.colorTheme}-50 text-${col.colorTheme}-500`) : ''}`}>
                      {col.projects && col.projects[0] && col.projects[0].thumbnail ? (
                         <img src={thumbnailSrc(col.projects[0])} className="w-full h-full object-cover" alt="Collection preview" />
                      ) : (
                         <Bookmark className="w-5 h-5" />
                      )}
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[14px] font-bold text-slate-900 line-clamp-1">{col.name}</span>
                      <span className="text-[11px] text-slate-500 font-medium tracking-wide">
                        {col.visibility === 'public' ? 'Public' : 'Private'}
                      </span>
                    </div>
                  </div>
                  
                  {savingId === col._id ? (
                    <div className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
                  ) : isSaved ? (
                    <Check className="w-5 h-5 text-slate-900" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border-[1.5px] border-slate-400 flex items-center justify-center text-slate-500 group-hover:border-slate-900 group-hover:text-slate-900 transition">
                      <Plus className="w-3.5 h-3.5" />
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
    
    <CreateCollectionModal 
      isOpen={isCreateModalOpen} 
      onClose={() => setIsCreateModalOpen(false)} 
      initialSelectedProjects={[projectId]}
      onSuccess={() => {
        setIsCreateModalOpen(false);
        fetchCollections();
        onClose(); // Optional: close the overlay entirely, but maybe just fetchCollections is better
      }} 
    />
    </div>
  );
}
