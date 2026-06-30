import React, { useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { 
  Compass, Folder, Bookmark, Users, MessageSquare, Bell, 
  Plus, Settings, LogOut, ChevronDown
} from 'lucide-react';

export default function Sidebar({ isSidebarOpen }) {
  const { user, isAuthenticated, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();


  const navItems = [
    { name: 'Explore', icon: Compass, path: '/explore' },
    { name: user?.role === 'recruiter' ? 'Student Directory' : user?.role === 'lecturer' ? 'Project Approvals' : user?.role === 'admin' ? 'Administrator' : 'My Projects', icon: Folder, path: '/dashboard', authRequired: true },
    { name: 'Bookmarks', icon: Bookmark, path: '/bookmarks', authRequired: true },
    { name: 'Following', icon: Users, path: '/following', authRequired: true },
    { name: 'Notifications', icon: Bell, path: '/notifications', authRequired: true, badge: unreadCount > 0 ? unreadCount.toString() : null },
    { name: 'Settings', icon: Settings, path: '/settings', authRequired: true },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  if (!isSidebarOpen) return null;

  return (
    <aside className="w-[260px] border-r border-slate-200 bg-white h-[calc(100vh-76px)] flex flex-col p-5 fixed left-0 top-[76px] z-20 overflow-y-auto custom-scrollbar">
      
      {/* Primary Navigation */}
      <div className="flex flex-col gap-1 mb-8 flex-1">
        {navItems.map((item) => {
          if (item.studentOnly && user?.role !== 'student') return null;
          
          return (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-semibold transition ${
                  isActive
                    ? 'bg-blue-50 text-brand-blue'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                }`
              }
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-3">
                  <item.icon className="w-[18px] h-[18px]" />
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span className="w-5 h-5 rounded-full bg-brand-blue text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                    {item.badge}
                  </span>
                )}
              </div>
            </NavLink>
          );
        })}

      </div>

      {/* Simulator accounts */}
      <div className="flex flex-col gap-3 mt-auto pt-4 border-t border-slate-100">
        


        {isAuthenticated && user.role === 'student' && (
          <Link
            to="/submit-project"
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-brand-blue to-indigo-500 text-white font-semibold text-sm shadow-md hover:shadow-lg hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Project
          </Link>
        )}

        {/* Logout Button */}
        {isAuthenticated && (
          <button
            onClick={handleLogout}
            className="w-full mt-2 flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold text-white bg-[#D2042D] hover:bg-[#A80324] transition shadow-sm cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        )}
      </div>
    </aside>
  );
}
