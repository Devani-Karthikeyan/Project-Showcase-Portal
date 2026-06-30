import React, { createContext, useContext, useState, useCallback } from 'react';
import { BACKEND_URL } from './AuthContext';
import SaveToCollectionOverlay from '../components/SaveToCollectionOverlay';

const BookmarkContext = createContext(null);

export function useBookmark() {
  return useContext(BookmarkContext);
}

export function BookmarkProvider({ children }) {
  const [modalProjectId, setModalProjectId] = useState(null);

  const handleBookmark = useCallback(async (e, projectId, currentlyBookmarked, onStateChange) => {
    e.preventDefault();
    e.stopPropagation();

    const token = localStorage.getItem('token');
    if (!token) {
      alert("Please log in to bookmark projects");
      return;
    }

    // Optimistically update the UI if callback provided
    if (onStateChange) {
      onStateChange(!currentlyBookmarked, currentlyBookmarked ? -1 : 1);
    }

    const endpoint = currentlyBookmarked ? 'unbookmark' : 'bookmark';
    try {
      const res = await fetch(`${BACKEND_URL}/api/projects/${projectId}/${endpoint}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.ok) {
        if (!currentlyBookmarked) {
          // Immediately show the save to collection modal
          setModalProjectId(projectId);
        }
      } else {
        // Revert on failure
        if (onStateChange) onStateChange(currentlyBookmarked, currentlyBookmarked ? 1 : -1);
      }
    } catch (err) {
      console.error(err);
      if (onStateChange) onStateChange(currentlyBookmarked, currentlyBookmarked ? 1 : -1);
    }
  }, []);

  return (
    <BookmarkContext.Provider value={{ handleBookmark, modalProjectId, setModalProjectId }}>
      {children}
      <SaveToCollectionOverlay 
        isOpen={!!modalProjectId} 
        projectId={modalProjectId} 
        onClose={() => setModalProjectId(null)} 
      />
    </BookmarkContext.Provider>
  );
}
