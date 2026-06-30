import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useAuth, BACKEND_URL } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { useBookmark } from '../context/BookmarkContext';
import {
  ArrowLeft,
  Mail,
  Github,
  Linkedin,
  BookOpen,
  Eye,
  Heart,
  User,
  CheckCircle,
  XCircle,
  Plus,
  Shield,
  Layers,
  Award,
  Lock,
  MessageSquare,
  GraduationCap,
  Users,
  Calendar,
  Bookmark,
  Search,
  ChevronDown,
  LayoutGrid,
  List,
  MoreVertical,
  Edit3,
  Trash2,
  Folder
} from 'lucide-react';

export default function Dashboard() {
  const { user, isAuthenticated } = useAuth();
  const { addToast } = useNotifications();
  const { handleBookmark, modalProjectId, setModalProjectId } = useBookmark();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const querySearch = searchParams.get('search') || '';

  const [myProjects, setMyProjects] = useState([]);
  const [activeMyProjectsTab, setActiveMyProjectsTab] = useState('All Projects');
  const [loading, setLoading] = useState(true);
  const [openDropdownId, setOpenDropdownId] = useState(null);

  // Recruiter Dashboard States
  const [followedStudents, setFollowedStudents] = useState([]);
  const [likedProjects, setLikedProjects] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [filterProgram, setFilterProgram] = useState('All');
  const [filterUniversity, setFilterUniversity] = useState('All');
  const [filterTitle, setFilterTitle] = useState('All');
  const [selectedStudent, setSelectedStudent] = useState(() => {
    try {
      const saved = sessionStorage.getItem('selected_recruiter_student');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });
  const [selectedStudentProjects, setSelectedStudentProjects] = useState([]);
  const [loadingStudentProjects, setLoadingStudentProjects] = useState(false);

  // Lecturer Dashboard States
  const [pendingProjects, setPendingProjects] = useState([]);
  const [reviewedProjects, setReviewedProjects] = useState([]);

  // Admin Dashboard States
  const [adminUsers, setAdminUsers] = useState([]);
  const [adminStats, setAdminStats] = useState(null);
  const [allProjects, setAllProjects] = useState([]);
  const [viewMode, setViewMode] = useState('grid');
  const [sortOrder, setSortOrder] = useState('newest');
  const [universities, setUniversities] = useState([]);
  const [degreePrograms, setDegreePrograms] = useState([]);
  const [newUnivName, setNewUnivName] = useState('');
  const [newUnivLoc, setNewUnivLoc] = useState('');
  const [newProgName, setNewProgName] = useState('');
  const [newProgCode, setNewProgCode] = useState('');

  // Pro Admin Dashboard Expanded States
  const [adminTab, setAdminTab] = useState('users'); // users, universities, degree-programs, projects
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('All');
  const [projectSearch, setProjectSearch] = useState('');
  const [projectStatusFilter, setProjectStatusFilter] = useState('All');
  const [editingUnivId, setEditingUnivId] = useState(null);
  const [editUnivName, setEditUnivName] = useState('');
  const [editUnivLoc, setEditUnivLoc] = useState('');
  const [editingProgId, setEditingProgId] = useState(null);
  const [editProgName, setEditProgName] = useState('');
  const [editProgCode, setEditProgCode] = useState('');
  const [editProgUniversities, setEditProgUniversities] = useState([]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    async function loadDashboardData() {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };

      try {
        const univRes = await fetch(`${BACKEND_URL}/api/metadata/universities`);
        if (univRes.ok) {
          const univData = await univRes.json();
          setUniversities(univData);
        }

        const progRes = await fetch(`${BACKEND_URL}/api/metadata/degree-programs`);
        if (progRes.ok) {
          const progData = await progRes.json();
          setDegreePrograms(progData);
        }

        // Load data based on Role
        if (user.role === 'student') {
          // Fetch student's own projects
          const res = await fetch(`${BACKEND_URL}/api/projects?studentId=${user.id}`, { headers });
          if (res.ok) {
            const data = await res.json();
            setMyProjects(data);
          }
        } 
        
        else if (user.role === 'recruiter') {
          // 1. Fetch all students for the student directory
          const studentsRes = await fetch(`${BACKEND_URL}/api/users/students`, { headers });
          if (studentsRes.ok) {
            const studentsData = await studentsRes.json();
            setAllStudents(studentsData);
          }

          // 2. Fetch list of followed students
          const followedRes = await fetch(`${BACKEND_URL}/api/users/following`, { headers });
          if (followedRes.ok) {
            const followedData = await followedRes.json();
            setFollowedStudents(followedData);
          }

          // 3. Fetch recruiter's bookmarks / liked projects
          const projectsRes = await fetch(`${BACKEND_URL}/api/projects`, { headers });
          if (projectsRes.ok) {
            const projectsData = await projectsRes.json();
            setLikedProjects(projectsData.filter(p => p.userBookmarked || p.userLiked));
          }
        } 
        
        else if (user.role === 'lecturer') {
          // Fetch pending projects within lecturer's department
          const pendingRes = await fetch(`${BACKEND_URL}/api/projects?status=pending_approval`, { headers });
          if (pendingRes.ok) {
            const data = await pendingRes.json();
            setPendingProjects(data);
          }

          // Fetch reviewed projects in department
          const allRes = await fetch(`${BACKEND_URL}/api/projects?department=${user.department}`, { headers });
          if (allRes.ok) {
            const data = await allRes.json();
            setReviewedProjects(data.filter(p => p.status !== 'pending_approval'));
          }
        } 
        
        else if (user.role === 'admin') {
          // Fetch all users
          const usersRes = await fetch(`${BACKEND_URL}/api/admin/users`, { headers });
          if (usersRes.ok) {
            const data = await usersRes.json();
            setAdminUsers(data);
          }

          // Fetch system metrics
          const statsRes = await fetch(`${BACKEND_URL}/api/admin/stats`, { headers });
          if (statsRes.ok) {
            const data = await statsRes.json();
            setAdminStats(data);
          }

          // Fetch all projects for moderation
          const projectsRes = await fetch(`${BACKEND_URL}/api/projects?status=all`, { headers });
          if (projectsRes.ok) {
            const data = await projectsRes.json();
            setAllProjects(data);
          }
        }
      } catch (err) {
        console.error('Error loading dashboard:', err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, [user, isAuthenticated]);

  useEffect(() => {
    if (!selectedStudent) {
      setSelectedStudentProjects([]);
      sessionStorage.removeItem('selected_recruiter_student');
      return;
    }

    sessionStorage.setItem('selected_recruiter_student', JSON.stringify(selectedStudent));

    async function fetchCandidateProjects() {
      setLoadingStudentProjects(true);
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${BACKEND_URL}/api/projects?studentId=${selectedStudent._id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setSelectedStudentProjects(data);
        }
      } catch (err) {
        console.error('Error fetching candidate projects:', err);
      } finally {
        setLoadingStudentProjects(false);
      }
    }

    fetchCandidateProjects();
  }, [selectedStudent]);

  // Restore scroll position after loading completes
  useEffect(() => {
    if (!loading) {
      const savedScroll = sessionStorage.getItem('dash_scroll');
      if (savedScroll) {
        window.scrollTo(0, parseInt(savedScroll, 10));
      }
    }
  }, [loading]);

  // Save scroll position
  useEffect(() => {
    const handleScroll = () => {
      sessionStorage.setItem('dash_scroll', window.scrollY.toString());
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleFollowToggle = async (creatorId, isFollowing) => {
    try {
      const token = localStorage.getItem('token');
      const url = `${BACKEND_URL}/api/users/${creatorId}/${isFollowing ? 'unfollow' : 'follow'}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        addToast(isFollowing ? 'Unfollowed creator.' : 'Following creator!', 'success');
        
        if (selectedStudent && selectedStudent._id === creatorId) {
          setSelectedStudent(prev => ({
            ...prev,
            isFollowing: !isFollowing,
            followersCount: isFollowing ? Math.max(0, prev.followersCount - 1) : (prev.followersCount + 1)
          }));
        }

        const headers = { 'Authorization': `Bearer ${token}` };
        const studentsRes = await fetch(`${BACKEND_URL}/api/users/students`, { headers });
        if (studentsRes.ok) {
          const studentsData = await studentsRes.json();
          setAllStudents(studentsData);
        }
        const followedRes = await fetch(`${BACKEND_URL}/api/users/following`, { headers });
        if (followedRes.ok) {
          const followedData = await followedRes.json();
          setFollowedStudents(followedData);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Admin Change User Role Action
  const handleRoleChange = async (userId, newRole) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ role: newRole })
      });

      const data = await res.json();
      if (res.ok) {
        addToast(`User role successfully changed to ${newRole}!`, 'success');
        setAdminUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
      } else {
        addToast(data.message, 'error');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Admin Metadata Operations
  const handleAddUniversity = async (e) => {
    e.preventDefault();
    if (!newUnivName.trim()) return;

    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/universities`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: newUnivName, location: newUnivLoc })
      });
      const data = await res.json();
      if (res.ok) {
        addToast('University added successfully!', 'success');
        setUniversities(prev => [...prev, data.university].sort((a, b) => a.name.localeCompare(b.name)));
        setNewUnivName('');
        setNewUnivLoc('');
      } else {
        addToast(data.message, 'error');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteUniversity = async (id) => {
    if (!window.confirm('Delete this university? This could affect registered users.')) return;

    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/universities/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        addToast('University deleted successfully.', 'success');
        setUniversities(prev => prev.filter(u => u._id !== id));
      } else {
        const data = await res.json();
        addToast(data.message, 'error');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddDegreeProgram = async (e) => {
    e.preventDefault();
    if (!newProgName.trim()) return;

    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/degree-programs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: newProgName, code: newProgCode })
      });
      const data = await res.json();
      if (res.ok) {
        addToast('Degree program added successfully!', 'success');
        setDegreePrograms(prev => [...prev, data.program].sort((a, b) => a.name.localeCompare(b.name)));
        setNewProgName('');
        setNewProgCode('');
      } else {
        addToast(data.message, 'error');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteDegreeProgram = async (id) => {
    if (!window.confirm('Delete this degree program? This could affect registered projects.')) return;

    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/degree-programs/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        addToast('Degree program deleted successfully.', 'success');
        setDegreePrograms(prev => prev.filter(p => p._id !== id));
      } else {
        const data = await res.json();
        addToast(data.message, 'error');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleUserActive = async (userId, currentActive) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${BACKEND_URL}/api/admin/users/${userId}/active`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ isActive: !currentActive })
      });
      if (res.ok) {
        addToast(currentActive ? 'Account deactivated.' : 'Account activated!', 'success');
        setAdminUsers(prev => prev.map(u => u.id === userId ? { ...u, isActive: !currentActive } : u));
        
        const statsRes = await fetch(`${BACKEND_URL}/api/admin/stats`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setAdminStats(statsData);
        }
      } else {
        const errorData = await res.json();
        addToast(errorData.message || 'Failed to update user status.', 'error');
      }
    } catch (err) {
      console.error(err);
      addToast('Error updating account status.', 'error');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user? This will also remove all their submissions and cannot be undone.')) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${BACKEND_URL}/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        addToast('User account successfully deleted.', 'success');
        setAdminUsers(prev => prev.filter(u => u.id !== userId));
        
        const statsRes = await fetch(`${BACKEND_URL}/api/admin/stats`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setAdminStats(statsData);
        }
      } else {
        const errorData = await res.json();
        addToast(errorData.message || 'Failed to delete user account.', 'error');
      }
    } catch (err) {
      console.error(err);
      addToast('Error deleting user account.', 'error');
    }
  };

  const handleEditUniversity = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${BACKEND_URL}/api/admin/universities/${editingUnivId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: editUnivName, location: editUnivLoc })
      });
      if (res.ok) {
        addToast('University updated successfully.', 'success');
        setEditingUnivId(null);
        const univRes = await fetch(`${BACKEND_URL}/api/metadata/universities`);
        if (univRes.ok) {
          const data = await univRes.json();
          setUniversities(data);
        }
      } else {
        const errorData = await res.json();
        addToast(errorData.message || 'Failed to update university.', 'error');
      }
    } catch (err) {
      console.error(err);
      addToast('Error updating university.', 'error');
    }
  };

  const handleEditDegreeProgram = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${BACKEND_URL}/api/admin/degree-programs/${editingProgId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: editProgName, code: editProgCode, universities: editProgUniversities })
      });
      if (res.ok) {
        addToast('Degree program updated successfully.', 'success');
        setEditingProgId(null);
        const progRes = await fetch(`${BACKEND_URL}/api/metadata/degree-programs`);
        if (progRes.ok) {
          const data = await progRes.json();
          setDegreePrograms(data);
        }
      } else {
        const errorData = await res.json();
        addToast(errorData.message || 'Failed to update degree program.', 'error');
      }
    } catch (err) {
      console.error(err);
      addToast('Error updating degree program.', 'error');
    }
  };

  const handleDeleteProjectModerator = async (projectId) => {
    if (!window.confirm('Are you sure you want to remove this project? This action will permanently delete the project from the platform.')) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${BACKEND_URL}/api/projects/${projectId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        addToast('Project removed from platform.', 'success');
        setAllProjects(prev => prev.filter(p => p._id !== projectId));
        const statsRes = await fetch(`${BACKEND_URL}/api/admin/stats`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setAdminStats(statsData);
        }
      } else {
        addToast('Failed to remove project.', 'error');
      }
    } catch (err) {
      console.error(err);
      addToast('Error removing project.', 'error');
    }
  };

  const handleModerateApproveProject = async (projectId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${BACKEND_URL}/api/projects/${projectId}/approve`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        addToast('Project approved successfully.', 'success');
        setAllProjects(prev => prev.map(p => p._id === projectId ? { ...p, status: 'approved' } : p));
      } else {
        addToast('Failed to approve project.', 'error');
      }
    } catch (err) {
      console.error(err);
      addToast('Error approving project.', 'error');
    }
  };

  const handleModerateRejectProject = async (projectId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${BACKEND_URL}/api/projects/${projectId}/reject`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        addToast('Project status set to rejected.', 'success');
        setAllProjects(prev => prev.map(p => p._id === projectId ? { ...p, status: 'rejected' } : p));
      } else {
        addToast('Failed to reject project.', 'error');
      }
    } catch (err) {
      console.error(err);
      addToast('Error rejecting project.', 'error');
    }
  };

  const updateProjectState = (projectId, updater) => {
    setMyProjects(prev => prev.map(p => p._id === projectId ? updater(p) : p));
    setLikedProjects(prev => prev.map(p => p._id === projectId ? updater(p) : p));
    setPendingProjects(prev => prev.map(p => p._id === projectId ? updater(p) : p));
    setReviewedProjects(prev => prev.map(p => p._id === projectId ? updater(p) : p));
    setAllProjects(prev => prev.map(p => p._id === projectId ? updater(p) : p));
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
        updateProjectState(projectId, p => ({ ...p, userLiked: !currentlyLiked, likesCount: data.likesCount }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const onBookmarkStateChange = (projectId, newState, delta) => {
    updateProjectState(projectId, p => ({ ...p, userBookmarked: newState, bookmarksCount: Math.max(0, (p.bookmarksCount || 0) + delta) }));
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 bg-behance-gray-bg">
        <div className="w-8 h-8 border-3 border-slate-200 border-t-brand-blue rounded-full animate-spin"></div>
        <span className="text-slate-400 text-[10px] font-bold mt-4">Loading your workspace...</span>
      </div>
    );
  }

  // --- SUB-DASHBOARD: STUDENT ---
  const renderStudentDashboard = () => {
    const thumbnailSrc = (project) => project.thumbnail
      ? (project.thumbnail.startsWith('data:') ? project.thumbnail : `${BACKEND_URL}${project.thumbnail}`)
      : 'https://via.placeholder.com/600x400?text=Project+Cover';

    const handleArchive = async (projectId) => {
      const token = localStorage.getItem('token');
      try {
        const res = await fetch(`${BACKEND_URL}/api/projects/${projectId}/archive`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          addToast('Project archived successfully', 'success');
          setMyProjects(prev => prev.map(p => p._id === projectId ? { ...p, status: 'rejected' } : p));
        } else {
          addToast('Failed to archive project', 'error');
        }
      } catch (err) {
        addToast('Error archiving project', 'error');
      }
      setOpenDropdownId(null);
    };

    const handleUnarchive = async (projectId) => {
      const token = localStorage.getItem('token');
      try {
        const res = await fetch(`${BACKEND_URL}/api/projects/${projectId}/unarchive`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          addToast('Project unarchived successfully', 'success');
          // Move back to previous state when unarchived
          setMyProjects(prev => prev.map(p => p._id === projectId ? { ...p, status: data.project.status } : p));
        } else {
          addToast('Failed to unarchive project', 'error');
        }
      } catch (err) {
        addToast('Error unarchiving project', 'error');
      }
      setOpenDropdownId(null);
    };

    const toggleDropdown = (e, projectId) => {
      e.stopPropagation();
      setOpenDropdownId(prev => prev === projectId ? null : projectId);
    };

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

    const filteredProjects = myProjects.filter(p => {
      if (activeMyProjectsTab === 'Published' && p.status !== 'approved') return false;
      if (activeMyProjectsTab === 'Drafts' && p.status !== 'pending_approval') return false;
      if (activeMyProjectsTab === 'Archived' && p.status !== 'rejected') return false;
      
      if (querySearch) {
        const text = `${p.title || ''} ${p.description || ''} ${p.modules?.join(' ') || ''}`.toLowerCase();
        if (!text.includes(querySearch.toLowerCase())) return false;
      }
      
      return true;
    }).sort((a, b) => {
      if (sortOrder === 'newest') return new Date(b.createdAt) - new Date(a.createdAt);
      if (sortOrder === 'oldest') return new Date(a.createdAt) - new Date(b.createdAt);
      if (sortOrder === 'popular') return (b.likesCount || 0) - (a.likesCount || 0);
      return 0;
    });

    const totalViews = filteredProjects.reduce((sum, p) => sum + (p.viewsCount || 0), 0);
    const totalLikes = filteredProjects.reduce((sum, p) => sum + (p.likesCount || 0), 0);
    const totalSaves = filteredProjects.reduce((sum, p) => sum + (p.bookmarksCount || 0), 0);

    return (
      <div className="flex flex-col h-full bg-white px-8 py-10 min-h-screen">
        
        {/* Header Area */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-[26px] font-extrabold text-slate-900 font-display mb-1.5">My Projects</h1>
            <p className="text-[14px] font-semibold text-slate-500">Manage and track all your project submissions</p>
          </div>
          <Link
            to="/submit-project"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-blue hover:bg-brand-blue-hover text-white font-bold text-[14px] transition cursor-pointer shadow-sm"
          >
            <Plus className="w-4 h-4" /> Create New Project
          </Link>
        </div>

        {/* Filter & Stats Row */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8 border-b border-slate-100 pb-8">
          <div className="flex items-center gap-2">
            {['All Projects', 'Published', 'Drafts', 'Archived'].map(tab => (
              <button 
                key={tab}
                onClick={() => setActiveMyProjectsTab(tab)}
                className={`px-5 py-2.5 rounded-xl text-[13px] font-bold cursor-pointer transition shadow-sm ${
                  activeMyProjectsTab === tab 
                    ? 'bg-brand-blue text-white' 
                    : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-4 px-5 py-2.5 rounded-xl border border-slate-200 bg-white shadow-sm min-w-[140px]">
              <Calendar className="w-5 h-5 text-brand-blue" />
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-bold text-slate-400">Total Projects</span>
                <span className="text-[16px] font-extrabold text-slate-900 leading-tight">{filteredProjects.length}</span>
              </div>
            </div>
            <div className="flex items-center gap-4 px-5 py-2.5 rounded-xl border border-slate-200 bg-white shadow-sm min-w-[140px]">
              <Eye className="w-5 h-5 text-cyan-500" />
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-bold text-slate-400">Total Views</span>
                <span className="text-[16px] font-extrabold text-slate-900 leading-tight">{totalViews > 999 ? (totalViews/1000).toFixed(1)+'K' : totalViews}</span>
              </div>
            </div>
            <div className="flex items-center gap-4 px-5 py-2.5 rounded-xl border border-slate-200 bg-white shadow-sm min-w-[140px]">
              <Heart className="w-5 h-5 text-rose-500" />
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-bold text-slate-400">Total Likes</span>
                <span className="text-[16px] font-extrabold text-slate-900 leading-tight">{totalLikes}</span>
              </div>
            </div>
            <div className="flex items-center gap-4 px-5 py-2.5 rounded-xl border border-slate-200 bg-white shadow-sm min-w-[140px]">
              <Bookmark className="w-5 h-5 text-fuchsia-500" />
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-bold text-slate-400">Total Saves</span>
                <span className="text-[16px] font-extrabold text-slate-900 leading-tight">{totalSaves}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Search & Toolbar Row */}
        <div className="flex items-center justify-between mb-8">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-4 top-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search your projects..."
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
          <div className="flex items-center gap-3">
            <div className="relative">
              <select 
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="flex items-center gap-2 pl-4 pr-10 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-[13px] font-bold hover:bg-slate-50 transition cursor-pointer appearance-none outline-none"
              >
                <option value="newest">Sort by: Newest First</option>
                <option value="oldest">Sort by: Oldest First</option>
                <option value="popular">Sort by: Popular</option>
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
            </div>
            <div className="flex items-center p-1 rounded-xl bg-slate-100 border border-slate-200/60">
              <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-lg transition cursor-pointer ${viewMode === 'grid' ? 'bg-white shadow-sm text-brand-blue' : 'text-slate-400 hover:text-slate-700'}`}>
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-lg transition cursor-pointer ${viewMode === 'list' ? 'bg-white shadow-sm text-brand-blue' : 'text-slate-400 hover:text-slate-700'}`}>
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Project Grid */}
        <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "flex flex-col gap-4"}>
          {filteredProjects.length === 0 ? (
            <div className="col-span-full py-20 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50">
              <BookOpen className="w-10 h-10 text-slate-300 mb-4" />
              <h3 className="text-[16px] font-bold text-slate-700 mb-2">No projects found</h3>
              <p className="text-[13px] text-slate-500 font-medium max-w-md text-center">
                {myProjects.length === 0 
                  ? "You haven't submitted any projects yet. Start building your portfolio by creating your first project."
                  : `No ${activeMyProjectsTab.toLowerCase()} projects found.`}
              </p>
              {myProjects.length === 0 && (
                <Link to="/submit-project" className="mt-6 px-6 py-2.5 rounded-xl bg-brand-blue text-white font-bold text-[13px] hover:bg-brand-blue-hover transition shadow-sm">
                  Create First Project
                </Link>
              )}
            </div>
          ) : (
            filteredProjects.map((project) => (
              <div key={project._id} className={`relative bg-white border border-slate-200 rounded-2xl overflow-hidden hover:shadow-lg transition-all duration-300 group cursor-pointer ${viewMode === 'list' ? 'flex flex-col sm:flex-row min-h-[220px] items-stretch' : 'flex flex-col'}`} onClick={() => navigate(`/projects/${project._id}`)}>
                
                {/* Card Image Area */}
                <div className={`relative bg-slate-50 border-slate-100 ${viewMode === 'list' ? 'w-full sm:w-[300px] shrink-0 sm:border-r border-b sm:border-b-0 h-48 sm:h-auto' : 'w-full h-48 border-b'}`}>
                  <img src={thumbnailSrc(project)} alt={project.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  
                  {/* Status Badge */}
                  <div className="absolute top-4 left-4">
                    <span className={`px-3 py-1 rounded text-[11px] font-bold ${getStatusStyle(project.status)}`}>
                      {getStatusText(project.status)}
                    </span>
                  </div>

                  {/* Menu Button */}
                  <div className="absolute top-4 right-4">
                    <button 
                      onClick={(e) => toggleDropdown(e, project._id)} 
                      className="w-8 h-8 rounded bg-white shadow-sm flex items-center justify-center text-slate-600 hover:text-brand-blue transition cursor-pointer"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                    {openDropdownId === project._id && (
                      <div className="absolute right-0 mt-2 w-40 bg-white rounded-xl shadow-lg border border-slate-100 z-50 overflow-hidden">
                        <div className="flex flex-col py-1">
                          {project.status !== 'rejected' ? (
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleArchive(project._id); }}
                              className="w-full text-left px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 font-semibold cursor-pointer transition"
                            >
                              Add to Archive
                            </button>
                          ) : (
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleUnarchive(project._id); }}
                              className="w-full text-left px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 font-semibold cursor-pointer transition"
                            >
                              Remove Archive
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Content Area */}
                <div className="flex flex-col flex-grow min-w-0">
                  {/* Card Body */}
                  <div className="p-5 flex flex-col flex-grow">
                    <h3 className="text-[16px] font-extrabold text-slate-900 font-display mb-1.5 line-clamp-1">{project.title}</h3>
                    <p className="text-[13px] font-medium text-slate-500 leading-relaxed line-clamp-2 mb-4">
                      {project.description}
                    </p>

                    <div className="flex flex-wrap gap-2 mb-auto">
                      {project.modules?.slice(0, 3).map((m, idx) => (
                        <span key={idx} className="px-2.5 py-1 rounded bg-slate-100/80 border border-slate-200/60 text-[11px] font-bold text-slate-700">
                          {m}
                        </span>
                      ))}
                      {project.modules?.length > 3 && (
                        <span className="px-2.5 py-1 rounded bg-slate-100/80 border border-slate-200/60 text-[11px] font-bold text-slate-700">
                          +{project.modules.length - 3}
                        </span>
                      )}
                    </div>
                  </div>

                {/* Card Footer */}
                <div className="px-5 py-4 border-t border-slate-100 flex items-center justify-between bg-white group-hover:bg-slate-50/50 transition">
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
                      onClick={(e) => handleBookmark(e, project._id, project.userBookmarked, (ns, delta) => onBookmarkStateChange(project._id, ns, delta))}
                      className={`flex items-center gap-1.5 transition cursor-pointer ${project.userBookmarked ? 'text-brand-blue' : 'hover:text-brand-blue'}`}
                    >
                      <Bookmark className={`w-3.5 h-3.5 transition-colors ${project.userBookmarked ? 'fill-current text-brand-blue' : 'text-slate-400 hover:fill-brand-blue hover:text-brand-blue'}`} /> 
                      {project.bookmarksCount || 0}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-slate-400 group-hover:hidden block">
                      {new Date(project.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                    <div className="hidden group-hover:flex items-center gap-2">
                      <Link to={`/projects/${project._id}/edit`} onClick={(e) => e.stopPropagation()} className="flex items-center gap-1 text-[11px] font-bold text-slate-500 hover:text-brand-blue transition">
                        <Edit3 className="w-3.5 h-3.5" /> Edit
                      </Link>
                      <button onClick={(e) => { e.stopPropagation(); /* delete logic */ }} className="flex items-center gap-1 text-[11px] font-bold text-slate-500 hover:text-rose-600 transition cursor-pointer">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
                </div>{/* End Content Area */}

              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  const renderCandidatePortfolioView = () => {
    const student = selectedStudent;
    if (!student) return null;

    const getAvatar = (creator) => {
      if (creator?.avatarUrl && creator.avatarUrl.startsWith('http')) return creator.avatarUrl;
      if (creator?.avatarUrl) return `${BACKEND_URL}${creator.avatarUrl}`;
      return `https://api.dicebear.com/7.x/notionists/svg?seed=${creator?.name || 'User'}`;
    };

    const getProjectThumbnail = (project) => {
      if (project.thumbnail && project.thumbnail.startsWith('data:')) return project.thumbnail;
      if (project.thumbnail) return `${BACKEND_URL}${project.thumbnail}`;
      return 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=300&auto=format&fit=crop';
    };

    return (
      <div className="flex flex-col bg-slate-50 min-h-screen px-8 py-10">

        {/* Portfolio Banner & Header Area */}
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm mb-8">
          {/* Cover Image - Solid White */}
          <div className="h-32 bg-white border-b border-slate-200 relative">
            {/* Floating Back Button (Same design as Project Details page) */}
            <button 
              onClick={() => setSelectedStudent(null)}
              className="absolute top-5 left-5 w-10 h-10 rounded-full bg-white/80 backdrop-blur-md border border-white/50 flex items-center justify-center text-slate-800 hover:bg-white hover:text-brand-blue hover:shadow-md transition cursor-pointer z-10"
              title="Go Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            {/* Floating Social Icons on the Right */}
            <div className="absolute top-5 right-5 flex items-center gap-2.5 z-10">
              {student.github && (
                <a href={`https://${student.github}`} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-white/80 backdrop-blur-md border border-white/50 flex items-center justify-center text-slate-700 hover:bg-white hover:text-brand-blue hover:shadow-md transition cursor-pointer shadow-sm" title="GitHub">
                  <Github className="w-5 h-5" />
                </a>
              )}
              {student.linkedin && (
                <a href={`https://${student.linkedin}`} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-white/80 backdrop-blur-md border border-white/50 flex items-center justify-center text-blue-600 hover:bg-white hover:text-brand-blue hover:shadow-md transition shadow-sm" title="LinkedIn">
                  <Linkedin className="w-5 h-5" />
                </a>
              )}
              {student.portfolio && (
                <a href={`https://${student.portfolio}`} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-white/80 backdrop-blur-md border border-white/50 flex items-center justify-center text-indigo-650 hover:bg-white hover:text-brand-blue hover:shadow-md transition shadow-sm" title="Portfolio">
                  <BookOpen className="w-5 h-5" />
                </a>
              )}
            </div>
          </div>
          
          {/* Bio Header */}
          <div className="px-8 pb-8 relative flex flex-col md:flex-row md:items-end gap-6 -mt-20">
            <img 
              src={getAvatar(student)} 
              alt={student.name} 
              className="w-40 h-40 rounded-3xl object-cover bg-white border-4 border-white shadow-lg shrink-0"
            />
            <div className="flex-grow min-w-0 pb-2">
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-[30px] font-extrabold text-slate-900 font-display leading-tight">{student.name}</h2>
                <span className="px-3 py-1 rounded-full text-[11.5px] font-extrabold bg-indigo-50 border border-indigo-100 text-brand-blue uppercase">
                  {student.graduationYear} • {student.isAlumni ? 'Alumni' : 'Undergraduate'}
                </span>
              </div>
              <p className="text-[17px] font-bold text-brand-blue mt-10">{student.title || 'Computing Portfolio Creator'}</p>
              <p className="text-[14.5px] font-medium text-slate-500 mt-2">{student.department} • {student.university}</p>
            </div>
          </div>
        </div>

        {/* Dynamic Details Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Stats & Bio Info */}
          <div className="flex flex-col gap-6 lg:col-span-1">

            {/* Actions Card (Follow and Contact Candidate) */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm font-sans flex flex-col gap-3">
              <button 
                onClick={() => handleFollowToggle(student._id, student.isFollowing)}
                className={`w-full py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer border ${
                  student.isFollowing 
                    ? 'bg-blue-50/50 border-brand-blue/30 text-brand-blue hover:bg-blue-100/50' 
                    : 'bg-brand-blue border-brand-blue text-white hover:bg-brand-blue-hover shadow-sm'
                }`}
              >
                {student.isFollowing ? (
                  <><CheckCircle className="w-4 h-4" /> Following</>
                ) : (
                  'Follow Candidate'
                )}
              </button>
              <a 
                href={`mailto:${student.email}`}
                className="w-full py-2.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 flex items-center justify-center gap-1.5 shadow-sm transition text-center"
              >
                <Mail className="w-4 h-4 text-slate-400" />
                Contact Candidate
              </a>
            </div>
            
            {/* Stats Card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm font-sans">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Portfolio Statistics</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-center shadow-sm">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Submissions</span>
                  <span className="block text-[22px] font-extrabold text-slate-900 mt-1">{student.projectsCount || 0}</span>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-center shadow-sm">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Followers</span>
                  <span className="block text-[22px] font-extrabold text-slate-900 mt-1">{student.followersCount || 0}</span>
                </div>
              </div>
            </div>

            {/* Profile Overview (Bio Card) */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm font-sans">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">About Creator</h3>
              <p className="text-[13px] font-medium text-slate-600 leading-relaxed">
                {student.bio || 'Candidate has not provided a summary statement yet.'}
              </p>
            </div>
          </div>

          {/* Right Column: Projects Showcase List */}
          <div className="flex flex-col gap-6 lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm font-sans">
            <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider mb-1 flex items-center gap-2">
              <Folder className="w-5 h-5 text-brand-blue" />
              Showcase Projects ({selectedStudentProjects.length})
            </h3>
            <p className="text-[13px] font-medium text-slate-500 mb-6">Review candidate projects, source code repositories, and live demonstration builds.</p>

            {loadingStudentProjects ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="w-8 h-8 border-3 border-slate-200 border-t-brand-blue rounded-full animate-spin"></div>
                <span className="text-slate-400 text-xs mt-3 font-semibold">Loading submissions...</span>
              </div>
            ) : selectedStudentProjects.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                <Folder className="w-12 h-12 text-slate-350 mb-3" />
                <h4 className="font-bold text-[14px] text-slate-900">No Showcase Submissions</h4>
                <p className="text-slate-500 text-[12px] font-medium mt-0.5">This candidate hasn\'t published any approved projects yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {selectedStudentProjects.map((p) => (
                  <div 
                    key={p._id}
                    onClick={() => navigate(`/projects/${p._id}`, { state: { fromStudentPortfolio: student } })}
                    className="group flex flex-col bg-white rounded-2xl border border-slate-200 overflow-hidden hover:border-slate-350 hover:shadow-xl transition-all duration-300 cursor-pointer"
                  >
                    {/* Cover image */}
                    <div className="relative aspect-[16/10] overflow-hidden bg-slate-100 border-b border-slate-100">
                      <img src={getProjectThumbnail(p)} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                    </div>

                    {/* Content */}
                    <div className="p-4 flex flex-col flex-grow">
                      <h4 className="text-[14px] font-extrabold text-slate-900 group-hover:text-brand-blue transition line-clamp-1">{p.title}</h4>
                      <p className="text-[12.5px] font-medium text-slate-500 line-clamp-2 mt-1.5 leading-relaxed flex-grow">{p.description}</p>
                      
                      {/* Tech badges */}
                      <div className="flex flex-wrap gap-1.5 mt-4">
                        {(p.modules || []).slice(0, 3).map((m, idx) => (
                          <span key={idx} className="px-2 py-0.5 rounded bg-slate-50 border border-slate-150 text-[10px] font-bold text-slate-655 whitespace-nowrap">
                            {m}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>
    );
  };

  // --- SUB-DASHBOARD: RECRUITER ---
  const renderRecruiterDashboard = () => {
    if (selectedStudent) {
      return renderCandidatePortfolioView();
    }
    const activeTab = activeMyProjectsTab === 'All Projects' ? 'All Students' : activeMyProjectsTab;

    const filteredStudents = allStudents.filter(student => {
      if (activeTab === 'Followed Candidates' && !student.isFollowing) return false;

      if (querySearch) {
        const text = `${student.name || ''} ${student.title || ''} ${student.department || ''}`.toLowerCase();
        if (!text.includes(querySearch.toLowerCase())) return false;
      }

      if (filterProgram !== 'All' && student.department !== filterProgram) return false;

      if (filterUniversity !== 'All' && student.university !== filterUniversity) return false;

      if (filterTitle !== 'All') {
        const match = student.title?.toLowerCase() || '';
        if (filterTitle === 'Software Engineer' && !match.includes('software')) return false;
        if (filterTitle === 'AI / Machine Learning' && !match.includes('ai') && !match.includes('machine') && !match.includes('deep')) return false;
        if (filterTitle === 'Cloud / DevOps' && !match.includes('cloud') && !match.includes('devops') && !match.includes('full-stack')) return false;
      }

      return true;
    });

    const getAvatar = (creator) => {
      if (creator?.avatarUrl && creator.avatarUrl.startsWith('http')) return creator.avatarUrl;
      if (creator?.avatarUrl) return `${BACKEND_URL}${creator.avatarUrl}`;
      return `https://api.dicebear.com/7.x/notionists/svg?seed=${creator?.name || 'User'}`;
    };

    return (
      <div className="flex flex-col h-full bg-white px-8 py-10 min-h-screen">
        
        {/* Header Area */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-[26px] font-extrabold text-slate-900 font-display mb-1.5">Student Directory</h1>
            <p className="text-[14px] font-semibold text-slate-500 font-medium">Discover talent, evaluate candidates, and explore student profiles</p>
          </div>
        </div>

        {/* Filter & Stats Row */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8 border-b border-slate-100 pb-8">
          <div className="flex flex-wrap gap-2">
            {['All Students', 'Followed Candidates'].map(tab => (
              <button 
                key={tab}
                onClick={() => setActiveMyProjectsTab(tab)}
                className={`px-5 py-2.5 rounded-xl text-[13px] font-bold cursor-pointer transition shadow-sm ${
                  (activeTab === tab || (tab === 'All Students' && activeMyProjectsTab === 'All Projects'))
                    ? 'bg-brand-blue text-white' 
                    : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-4 px-5 py-2.5 rounded-xl border border-slate-200 bg-white shadow-sm min-w-[140px]">
              <Users className="w-5 h-5 text-brand-blue" />
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-bold text-slate-400">Total Students</span>
                <span className="text-[16px] font-extrabold text-slate-900 leading-tight">{allStudents.length}</span>
              </div>
            </div>
            <div className="flex items-center gap-4 px-5 py-2.5 rounded-xl border border-slate-200 bg-white shadow-sm min-w-[140px]">
              <Heart className="w-5 h-5 text-rose-500" />
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-bold text-slate-400">Followed</span>
                <span className="text-[16px] font-extrabold text-slate-900 leading-tight">{followedStudents.length}</span>
              </div>
            </div>
            <div className="flex items-center gap-4 px-5 py-2.5 rounded-xl border border-slate-200 bg-white shadow-sm min-w-[140px]">
              <Bookmark className="w-5 h-5 text-indigo-500" />
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-bold text-slate-400">Saved Projects</span>
                <span className="text-[16px] font-extrabold text-slate-900 leading-tight">{likedProjects.length}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Multi-Filter Controls row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 bg-slate-50 p-5 rounded-2xl border border-slate-200/60 shadow-sm">
          
          {/* Search Input */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-bold text-slate-400 uppercase">Search Name / Skill</span>
            <div className="relative">
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Type keywords..."
                value={querySearch}
                onChange={(e) => {
                  if (e.target.value) {
                    setSearchParams({ search: e.target.value }, { replace: true });
                  } else {
                    setSearchParams({}, { replace: true });
                  }
                }}
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 bg-white text-[12px] text-slate-800 focus:outline-none focus:border-brand-blue"
              />
            </div>
          </div>

          {/* Skill Filter Select */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-bold text-slate-400 uppercase">Skill Domain</span>
            <div className="relative">
              <select 
                value={filterTitle}
                onChange={(e) => setFilterTitle(e.target.value)}
                className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-slate-200 bg-white text-[12px] text-slate-700 font-bold outline-none appearance-none cursor-pointer"
              >
                <option value="All">All Skill Domains</option>
                <option value="Software Engineer">Software Engineering</option>
                <option value="AI / Machine Learning">AI & Machine Learning</option>
                <option value="Cloud / DevOps">Cloud & Systems</option>
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-3 pointer-events-none" />
            </div>
          </div>

          {/* Program Filter Select */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-bold text-slate-400 uppercase">Degree Program</span>
            <div className="relative">
              <select 
                value={filterProgram}
                onChange={(e) => setFilterProgram(e.target.value)}
                className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-slate-200 bg-white text-[12px] text-slate-700 font-bold outline-none appearance-none cursor-pointer"
              >
                <option value="All">All Degree Programs</option>
                {degreePrograms.map(p => (
                  <option key={p._id} value={p.name}>{p.name}</option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-3 pointer-events-none" />
            </div>
          </div>

          {/* University Filter Select */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-bold text-slate-400 uppercase">University</span>
            <div className="relative">
              <select 
                value={filterUniversity}
                onChange={(e) => setFilterUniversity(e.target.value)}
                className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-slate-200 bg-white text-[12px] text-slate-700 font-bold outline-none appearance-none cursor-pointer"
              >
                <option value="All">All Universities</option>
                {universities.map(u => (
                  <option key={u._id} value={u.name}>{u.name}</option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-3 pointer-events-none" />
            </div>
          </div>

        </div>

        {/* Directory Grid */}
        {filteredStudents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
            <Users className="w-12 h-12 text-slate-300 mb-4" />
            <h3 className="font-extrabold text-[16px] text-slate-900 font-display mb-1">No Candidates Found</h3>
            <p className="text-slate-500 text-[13px] font-medium">Try broadening your search or filter inputs.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredStudents.map((student) => (
              <div 
                key={student._id} 
                onClick={() => setSelectedStudent(student)}
                className="group flex flex-col bg-white rounded-2xl border border-slate-200 p-5 hover:border-slate-350 hover:shadow-xl transition-all duration-300 cursor-pointer relative animate-in fade-in-50 duration-200"
              >
                {/* Avatar and Info */}
                <div className="flex items-start gap-4 mb-4">
                  <img 
                    src={getAvatar(student)} 
                    alt={student.name} 
                    className="w-14 h-14 rounded-full object-cover bg-slate-100 border border-slate-100 shadow-sm"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[15px] font-extrabold text-slate-900 font-display truncate leading-tight group-hover:text-brand-blue transition">
                      {student.name}
                    </h3>
                    <p className="text-[11px] font-bold text-slate-400 mt-0.5">
                      @{student.name.replace(/\s+/g, '').toLowerCase()}
                    </p>
                    <span className="inline-block mt-2 px-2 py-0.5 rounded text-[9px] font-extrabold uppercase bg-slate-50 border border-slate-150 text-slate-655 font-display">
                      {student.graduationYear} • {student.isAlumni ? 'Alumni' : 'Undergraduate'}
                    </span>
                  </div>
                </div>

                {/* Subtitles & Bio */}
                <span className="text-[12px] font-extrabold text-slate-800 leading-none">
                  {student.title || 'Computing Creator'}
                </span>
                <p className="text-[12px] font-semibold text-slate-500 mt-1 leading-relaxed">
                  {student.department} • {student.university}
                </p>

                <p className="text-[12.5px] font-medium text-slate-550 leading-relaxed mt-3 mb-5 line-clamp-2">
                  {student.bio || 'Building future-proof tech systems and studying computing technologies.'}
                </p>

                {/* Followers count row */}
                <div className="flex items-center gap-4 mb-5 border-t border-slate-100 pt-3 text-[11px] font-bold text-slate-600">
                  <span className="flex items-center gap-1.5"><Folder className="w-3.5 h-3.5 text-slate-400" /> {student.projectsCount || 0} Projects</span>
                  <span className="flex items-center gap-1.5"><Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-50" /> {student.followersCount || 0} Followers</span>
                </div>

                {/* Card Actions Footer */}
                <div className="flex items-center gap-3 mt-auto">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleFollowToggle(student._id, student.isFollowing);
                    }}
                    className={`flex-1 py-2 rounded-xl text-[11px] font-bold transition flex items-center justify-center gap-1 cursor-pointer border ${
                      student.isFollowing 
                        ? 'bg-blue-50/50 border-brand-blue/30 text-brand-blue hover:bg-blue-100/50' 
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {student.isFollowing ? (
                      <><CheckCircle className="w-3.5 h-3.5" /> Following</>
                    ) : (
                      'Follow'
                    )}
                  </button>
                  <button 
                    onClick={() => setSelectedStudent(student)}
                    className="flex-1 py-2 rounded-xl bg-brand-blue hover:bg-brand-blue-hover text-white text-[11px] font-bold transition shadow-sm cursor-pointer"
                  >
                    View Profile
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // --- SUB-DASHBOARD: LECTURER ---
  const renderLecturerDashboard = () => {
    const allDepartmentProjects = [...pendingProjects, ...reviewedProjects];

    const pendingCount = pendingProjects.length;
    const approvedCount = reviewedProjects.filter(p => p.status === 'approved').length;
    const rejectedCount = reviewedProjects.filter(p => p.status === 'rejected').length;

    const activeTab = activeMyProjectsTab === 'All Projects' ? 'All Submissions' : activeMyProjectsTab;

    const filteredLecturerProjects = allDepartmentProjects.filter(p => {
      if (activeTab === 'Pending Reviews' && p.status !== 'pending_approval') return false;
      if (activeTab === 'Approved Showcase' && p.status !== 'approved') return false;
      if (activeTab === 'Rejected' && p.status !== 'rejected') return false;

      if (querySearch) {
        const text = `${p.title || ''} ${p.description || ''} ${p.studentId?.name || ''}`.toLowerCase();
        if (!text.includes(querySearch.toLowerCase())) return false;
      }
      return true;
    }).sort((a, b) => {
      if (sortOrder === 'newest') return new Date(b.createdAt) - new Date(a.createdAt);
      if (sortOrder === 'oldest') return new Date(a.createdAt) - new Date(b.createdAt);
      if (sortOrder === 'popular') return (b.likesCount || 0) - (a.likesCount || 0);
      return 0;
    });

    const getStatusStyle = (status) => {
      if (status === 'approved') return 'bg-emerald-600 text-white';
      if (status === 'pending_approval') return 'bg-amber-400 text-amber-950';
      if (status === 'rejected') return 'bg-rose-500 text-white';
      return 'bg-slate-800 text-white';
    };

    const getStatusText = (status) => {
      if (status === 'approved') return 'Approved';
      if (status === 'pending_approval') return 'Pending Review';
      return 'Rejected';
    };

    const getProjectThumbnail = (project) => {
      if (project.thumbnail && project.thumbnail.startsWith('data:')) return project.thumbnail;
      if (project.thumbnail) return `${BACKEND_URL}${project.thumbnail}`;
      return 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=300&auto=format&fit=crop';
    };

    return (
      <div className="flex flex-col h-full bg-white px-8 py-10 min-h-screen">
        
        {/* Header Area */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-[26px] font-extrabold text-slate-900 font-display mb-1.5">Project Approvals</h1>
            <p className="text-[14px] font-semibold text-slate-500 font-medium">Review and manage student computing project submissions in {user.department}</p>
          </div>
        </div>

        {/* Filter & Stats Row */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8 border-b border-slate-100 pb-8">
          <div className="flex flex-wrap gap-2">
            {['All Submissions', 'Pending Reviews', 'Approved Showcase', 'Rejected'].map(tab => (
              <button 
                key={tab}
                onClick={() => setActiveMyProjectsTab(tab)}
                className={`px-5 py-2.5 rounded-xl text-[13px] font-bold cursor-pointer transition shadow-sm ${
                  (activeTab === tab || (tab === 'All Submissions' && activeMyProjectsTab === 'All Projects'))
                    ? 'bg-brand-blue text-white' 
                    : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-4 px-5 py-2.5 rounded-xl border border-slate-200 bg-white shadow-sm min-w-[140px]">
              <Folder className="w-5 h-5 text-brand-blue" />
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-bold text-slate-400">Total</span>
                <span className="text-[16px] font-extrabold text-slate-900 leading-tight">{allDepartmentProjects.length}</span>
              </div>
            </div>
            <div className="flex items-center gap-4 px-5 py-2.5 rounded-xl border border-slate-200 bg-white shadow-sm min-w-[140px]">
              <Bookmark className="w-5 h-5 text-amber-500" />
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-bold text-slate-400">Pending</span>
                <span className="text-[16px] font-extrabold text-slate-900 leading-tight">{pendingCount}</span>
              </div>
            </div>
            <div className="flex items-center gap-4 px-5 py-2.5 rounded-xl border border-slate-200 bg-white shadow-sm min-w-[140px]">
              <CheckCircle className="w-5 h-5 text-emerald-500" />
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-bold text-slate-400">Approved</span>
                <span className="text-[16px] font-extrabold text-slate-900 leading-tight">{approvedCount}</span>
              </div>
            </div>
            <div className="flex items-center gap-4 px-5 py-2.5 rounded-xl border border-slate-200 bg-white shadow-sm min-w-[140px]">
              <XCircle className="w-5 h-5 text-rose-555" />
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-bold text-slate-400">Rejected</span>
                <span className="text-[16px] font-extrabold text-slate-900 leading-tight">{rejectedCount}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Search & Toolbar Row */}
        <div className="flex items-center justify-between mb-8">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-4 top-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search student submissions..."
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
          <div className="flex items-center gap-3">
            <div className="relative">
              <select 
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="flex items-center gap-2 pl-4 pr-10 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-[13px] font-bold hover:bg-slate-50 transition cursor-pointer appearance-none outline-none"
              >
                <option value="newest">Sort by: Newest First</option>
                <option value="oldest">Sort by: Oldest First</option>
                <option value="popular">Sort by: Popular</option>
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
            </div>
            <div className="flex items-center p-1 rounded-xl bg-slate-100 border border-slate-200/60">
              <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-lg transition cursor-pointer ${viewMode === 'grid' ? 'bg-white shadow-sm text-brand-blue' : 'text-slate-400 hover:text-slate-700'}`}>
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-lg transition cursor-pointer ${viewMode === 'list' ? 'bg-white shadow-sm text-brand-blue' : 'text-slate-400 hover:text-slate-700'}`}>
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Project Approvals Grid/List */}
        {filteredLecturerProjects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
            <Folder className="w-12 h-12 text-slate-300 mb-4" />
            <h3 className="font-extrabold text-[16px] text-slate-900 font-display mb-1">No Projects Found</h3>
            <p className="text-slate-500 text-[13px] font-medium">There are no submissions matching the selected filters.</p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredLecturerProjects.map((project) => (
              <div 
                key={project._id} 
                onClick={() => navigate(`/projects/${project._id}`)}
                className="group flex flex-col bg-white rounded-2xl border border-slate-200 overflow-hidden hover:border-slate-350 hover:shadow-xl transition-all duration-305 cursor-pointer"
              >
                {/* Cover Image & Badge */}
                <div className="relative aspect-[16/10] overflow-hidden bg-slate-100 shrink-0 border-b border-slate-100">
                  <img 
                    src={getProjectThumbnail(project)} 
                    alt={project.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                  />
                  <div className="absolute top-4 left-4 flex gap-2">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-extrabold tracking-wider uppercase shadow-md ${getStatusStyle(project.status)}`}>
                      {getStatusText(project.status)}
                    </span>
                  </div>
                </div>

                {/* Body Content */}
                <div className="p-5 flex flex-col flex-grow">
                  <h3 className="text-[16px] font-extrabold text-slate-900 font-display mb-2 line-clamp-1 group-hover:text-brand-blue transition">
                    {project.title}
                  </h3>
                  <p className="text-[12px] font-bold text-slate-400 mb-3">
                    Submitted by: {project.studentId?.name || 'Unknown student'}
                  </p>
                  <p className="text-[13px] font-medium text-slate-500 leading-relaxed line-clamp-2 mb-4 flex-grow">
                    {project.description}
                  </p>

                  <div className="flex flex-wrap gap-2 mb-5">
                    {project.modules?.slice(0, 3).map((m, idx) => (
                      <span key={idx} className="px-2.5 py-1 rounded bg-slate-50 border border-slate-100 text-[11px] font-bold text-slate-655">
                        {m}
                      </span>
                    ))}
                    {project.modules?.length > 3 && (
                      <span className="px-2.5 py-1 rounded bg-slate-50 border border-slate-100 text-[11px] font-bold text-slate-655">
                        +{project.modules.length - 3}
                      </span>
                    )}
                  </div>
                </div>

                {/* Footer details */}
                <div className="px-5 py-4 border-t border-slate-100 flex items-center justify-between bg-white group-hover:bg-slate-50/50 transition">
                  <div className="flex items-center gap-4 text-[12px] font-bold text-slate-500">
                    <span className="flex items-center gap-1.5"><Eye className="w-3.5 h-3.5 text-slate-400" /> {project.viewsCount || 0}</span>
                    <span className="flex items-center gap-1.5"><Heart className="w-3.5 h-3.5 text-slate-400" /> {project.likesCount || 0}</span>
                  </div>
                  
                  <Link
                    to={`/projects/${project._id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="px-3.5 py-1.5 bg-brand-blue hover:bg-brand-blue-hover text-white rounded-xl text-[11px] font-bold transition shadow-sm"
                  >
                    {project.status === 'pending_approval' ? 'Review Submission' : 'View Details'}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* List Mode */
          <div className="flex flex-col bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            {filteredLecturerProjects.map((project, idx) => (
              <div 
                key={project._id}
                onClick={() => navigate(`/projects/${project._id}`)}
                className={`flex flex-col sm:flex-row sm:items-center gap-4 p-5 transition hover:bg-slate-50 cursor-pointer ${
                  idx !== filteredLecturerProjects.length - 1 ? 'border-b border-slate-100' : ''
                }`}
              >
                <img src={getProjectThumbnail(project)} alt={project.title} className="w-20 h-12 rounded-lg object-cover border border-slate-200 shrink-0 shadow-sm" />
                
                <div className="flex-grow min-w-0">
                  <div className="flex items-center gap-3">
                    <h3 className="text-[14px] font-extrabold text-slate-900 font-display truncate">{project.title}</h3>
                    <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase ${getStatusStyle(project.status)}`}>
                      {getStatusText(project.status)}
                    </span>
                  </div>
                  <p className="text-[11px] font-bold text-slate-400 mt-0.5">
                    Submitted by: {project.studentId?.name} • {new Date(project.createdAt).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex items-center gap-4 shrink-0 mt-2 sm:mt-0">
                  <div className="flex items-center gap-3 text-slate-400 text-xs font-semibold">
                    <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" /> {project.viewsCount || 0}</span>
                    <span className="flex items-center gap-1"><Heart className="w-3.5 h-3.5" /> {project.likesCount || 0}</span>
                  </div>
                  
                  <Link
                    to={`/projects/${project._id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="px-4 py-2 border border-brand-blue/30 text-brand-blue rounded-xl text-xs font-bold hover:bg-blue-50 transition shadow-sm whitespace-nowrap"
                  >
                    {project.status === 'pending_approval' ? 'Review Submission' : 'View Details'}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // --- SUB-DASHBOARD: ADMIN ---
  const renderAdminDashboard = () => {
    const getStudentCountForUniv = (univName) => {
      return adminUsers.filter(u => u.role === 'student' && u.university === univName).length;
    };

    return (
      <div className="flex flex-col gap-8 py-8 font-sans">
        
        {/* Administrator Header */}
        <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-[26px] font-extrabold text-slate-900 tracking-tight leading-none">Administrator Console</h1>
            <p className="text-[13px] font-medium text-slate-500 mt-2">Manage user directories, system metadata configurations, and global showcase submissions.</p>
          </div>
          <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
            <button 
              onClick={() => setAdminTab('users')} 
              className={`px-4 py-2 rounded-xl text-xs font-bold transition ${adminTab === 'users' ? 'bg-white text-slate-900 shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Users
            </button>
            <button 
              onClick={() => setAdminTab('universities')} 
              className={`px-4 py-2 rounded-xl text-xs font-bold transition ${adminTab === 'universities' ? 'bg-white text-slate-900 shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Universities
            </button>
            <button 
              onClick={() => setAdminTab('degree-programs')} 
              className={`px-4 py-2 rounded-xl text-xs font-bold transition ${adminTab === 'degree-programs' ? 'bg-white text-slate-900 shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Programs
            </button>
            <button 
              onClick={() => setAdminTab('projects')} 
              className={`px-4 py-2 rounded-xl text-xs font-bold transition ${adminTab === 'projects' ? 'bg-white text-slate-900 shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Moderator
            </button>
          </div>
        </div>

        {/* Global Statistics Cards */}
        {adminStats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition">
              <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Total Students</span>
              <span className="text-2xl font-extrabold text-slate-900 mt-1.5 block leading-none">{adminStats.totalStudents || 0}</span>
            </div>
            <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition">
              <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Total Lecturers</span>
              <span className="text-2xl font-extrabold text-slate-900 mt-1.5 block leading-none">{adminStats.totalLecturers || 0}</span>
            </div>
            <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition">
              <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Total Recruiters</span>
              <span className="text-2xl font-extrabold text-slate-900 mt-1.5 block leading-none">{adminStats.totalRecruiters || 0}</span>
            </div>
            <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition">
              <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Total Projects</span>
              <span className="text-2xl font-extrabold text-brand-blue mt-1.5 block leading-none">{adminStats.totalProjects || 0}</span>
            </div>
            <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition">
              <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Approved Submissions</span>
              <span className="text-2xl font-extrabold text-emerald-600 mt-1.5 block leading-none">{adminStats.approvedProjects || 0}</span>
            </div>
            <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition">
              <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Pending Review</span>
              <span className="text-2xl font-extrabold text-amber-500 mt-1.5 block leading-none">{adminStats.pendingProjects || 0}</span>
            </div>
            <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition">
              <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Total Universities</span>
              <span className="text-2xl font-extrabold text-indigo-600 mt-1.5 block leading-none">{adminStats.totalUniversities || 0}</span>
            </div>
            <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition">
              <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Degree Programs</span>
              <span className="text-2xl font-extrabold text-purple-600 mt-1.5 block leading-none">{adminStats.totalDegreePrograms || 0}</span>
            </div>
          </div>
        )}

        {/* Tab 1: Users Manager */}
        {adminTab === 'users' && (
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col gap-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <h3 className="font-extrabold text-slate-900 text-base uppercase tracking-wider flex items-center gap-2">
                <Users className="w-5 h-5 text-brand-blue" />
                Registered Accounts Directory
              </h3>
              
              {/* Search & Filters */}
              <div className="flex items-center gap-3 flex-wrap">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-brand-blue w-48 md:w-60 transition"
                  />
                </div>
                <select
                  value={userRoleFilter}
                  onChange={(e) => setUserRoleFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 font-bold focus:outline-none cursor-pointer"
                >
                  <option value="All">All Roles</option>
                  <option value="student">Students</option>
                  <option value="lecturer">Lecturers</option>
                  <option value="recruiter">Recruiters</option>
                  <option value="admin">Administrators</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 uppercase font-bold text-[10px] tracking-wider">
                    <th className="pb-3 pl-2">Name / Profile</th>
                    <th className="pb-3">Email Address</th>
                    <th className="pb-3">Role Authority</th>
                    <th className="pb-3 text-center">Status</th>
                    <th className="pb-3 text-right pr-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {adminUsers
                    .filter(u => {
                      const matchSearch = u.name.toLowerCase().includes(userSearch.toLowerCase()) || u.email.toLowerCase().includes(userSearch.toLowerCase());
                      const matchRole = userRoleFilter === 'All' || u.role === userRoleFilter;
                      return matchSearch && matchRole;
                    })
                    .map((u) => (
                      <tr key={u.id} className="border-b border-slate-100 text-slate-650 hover:bg-slate-50/50 transition">
                        <td className="py-4 pl-2 flex items-center gap-3">
                          <img
                            src={u.avatarUrl ? (u.avatarUrl.startsWith('http') ? u.avatarUrl : `${BACKEND_URL}${u.avatarUrl}`) : `https://api.dicebear.com/7.x/shapes/svg?seed=${u.name}`}
                            alt={u.name}
                            className="w-8 h-8 rounded-full border border-slate-100 object-cover shadow-sm bg-white"
                          />
                          <div className="flex flex-col">
                            <span className="font-extrabold text-slate-900">{u.name}</span>
                            <span className="text-[10px] text-slate-400 capitalize font-semibold">{u.role}</span>
                          </div>
                        </td>
                        <td className="py-4 font-medium text-slate-600">{u.email}</td>
                        <td className="py-4">
                          <select
                            value={u.role}
                            onChange={(e) => handleRoleChange(u.id, e.target.value)}
                            className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-[11px] text-slate-700 font-bold focus:outline-none cursor-pointer"
                          >
                            <option value="student">Student</option>
                            <option value="lecturer">Lecturer</option>
                            <option value="recruiter">Recruiter</option>
                            <option value="admin">Admin</option>
                          </select>
                        </td>
                        <td className="py-4 text-center">
                          <button
                            onClick={() => handleToggleUserActive(u.id, u.isActive !== false)}
                            className={`px-3 py-1 rounded-full text-[10px] font-bold transition border cursor-pointer ${
                              u.isActive !== false
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-600 hover:bg-emerald-100'
                                : 'bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100'
                            }`}
                          >
                            {u.isActive !== false ? 'Active' : 'Inactive'}
                          </button>
                        </td>
                        <td className="py-4 text-right pr-2">
                          <button
                            onClick={() => handleDeleteUser(u.id)}
                            className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                            title="Delete User"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: Universities Manager */}
        {adminTab === 'universities' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Add / Edit University panel */}
            <div className="lg:col-span-1 p-6 rounded-3xl border border-slate-200 bg-white flex flex-col gap-6 shadow-sm h-fit">
              <h3 className="font-extrabold text-slate-900 text-sm uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
                <Award className="w-5 h-5 text-brand-blue" />
                {editingUnivId ? 'Edit University' : 'Add University'}
              </h3>
              
              <form onSubmit={editingUnivId ? handleEditUniversity : handleAddUniversity} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">University Name</label>
                  <input
                    type="text"
                    placeholder="e.g. University of Colombo"
                    value={editingUnivId ? editUnivName : newUnivName}
                    onChange={(e) => editingUnivId ? setEditUnivName(e.target.value) : setNewUnivName(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-brand-blue focus:bg-white transition"
                    required
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Location / City</label>
                  <input
                    type="text"
                    placeholder="e.g. Colombo, Sri Lanka"
                    value={editingUnivId ? editUnivLoc : newUnivLoc}
                    onChange={(e) => editingUnivId ? setEditUnivLoc(e.target.value) : setNewUnivLoc(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-brand-blue focus:bg-white transition"
                  />
                </div>
                <div className="flex gap-2.5 mt-2">
                  <button
                    type="submit"
                    className="flex-grow py-2.5 bg-brand-blue hover:bg-brand-blue-hover text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
                  >
                    {editingUnivId ? 'Save Changes' : 'Register University'}
                  </button>
                  {editingUnivId && (
                    <button
                      type="button"
                      onClick={() => setEditingUnivId(null)}
                      className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition cursor-pointer"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* Universities List */}
            <div className="lg:col-span-2 p-6 rounded-3xl border border-slate-200 bg-white flex flex-col gap-6 shadow-sm">
              <h3 className="font-extrabold text-slate-900 text-sm uppercase tracking-wider border-b border-slate-100 pb-3">
                Registered Institutions ({universities.length})
              </h3>
              
              <div className="flex flex-col gap-3.5 max-h-[500px] overflow-y-auto pr-1">
                {universities.length === 0 ? (
                  <p className="text-slate-400 text-xs italic">No universities registered yet.</p>
                ) : (
                  universities.map((u) => (
                    <div key={u._id} className="p-4 rounded-2xl border border-slate-150 bg-slate-50/50 flex items-center justify-between shadow-sm hover:shadow transition">
                      <div className="flex flex-col gap-1">
                        <span className="text-[13px] font-extrabold text-slate-900">{u.name}</span>
                        <div className="flex items-center gap-3">
                          {u.location && <span className="text-[10px] text-slate-400 font-bold uppercase">{u.location}</span>}
                          <span className="px-2 py-0.5 rounded bg-blue-50 text-brand-blue border border-blue-100 text-[9.5px] font-extrabold">
                            {getStudentCountForUniv(u.name)} Students Registered
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setEditingUnivId(u._id);
                            setEditUnivName(u.name);
                            setEditUnivLoc(u.location || '');
                          }}
                          className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-800 rounded-lg text-[10px] font-extrabold transition shadow-sm cursor-pointer"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteUniversity(u._id)}
                          className="px-3 py-1.5 bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-600 rounded-lg text-[10px] font-extrabold transition cursor-pointer"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Degree Programs Manager */}
        {adminTab === 'degree-programs' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Add / Edit Degree Program Panel */}
            <div className="lg:col-span-1 p-6 rounded-3xl border border-slate-200 bg-white flex flex-col gap-6 shadow-sm h-fit">
              <h3 className="font-extrabold text-slate-900 text-sm uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
                <Layers className="w-5 h-5 text-brand-blue" />
                {editingProgId ? 'Edit Degree Program' : 'Add Degree Program'}
              </h3>
              
              <form onSubmit={editingProgId ? handleEditDegreeProgram : handleAddDegreeProgram} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Program Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Software Engineering"
                    value={editingProgId ? editProgName : newProgName}
                    onChange={(e) => editingProgId ? setEditProgName(e.target.value) : setNewProgName(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-brand-blue focus:bg-white transition"
                    required
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Program Code</label>
                  <input
                    type="text"
                    placeholder="e.g. B.Sc. SE"
                    value={editingProgId ? editProgCode : newProgCode}
                    onChange={(e) => editingProgId ? setEditProgCode(e.target.value) : setNewProgCode(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-brand-blue focus:bg-white transition"
                  />
                </div>

                {/* Assign to University - Multiselect */}
                {editingProgId && (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Assign to University</label>
                    <div className="flex flex-col gap-2 max-h-[150px] overflow-y-auto border border-slate-200 rounded-xl p-3 bg-slate-50/50">
                      {universities.map((univ) => {
                        const isAssigned = editProgUniversities.includes(univ._id);
                        return (
                          <label key={univ._id} className="flex items-center gap-2 text-xs font-semibold text-slate-650 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={isAssigned}
                              onChange={() => {
                                if (isAssigned) {
                                  setEditProgUniversities(prev => prev.filter(id => id !== univ._id));
                                } else {
                                  setEditProgUniversities(prev => [...prev, univ._id]);
                                }
                              }}
                              className="rounded border-slate-350 text-brand-blue focus:ring-brand-blue cursor-pointer"
                            />
                            {univ.name}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="flex gap-2.5 mt-2">
                  <button
                    type="submit"
                    className="flex-grow py-2.5 bg-brand-blue hover:bg-brand-blue-hover text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
                  >
                    {editingProgId ? 'Save Changes' : 'Register Program'}
                  </button>
                  {editingProgId && (
                    <button
                      type="button"
                      onClick={() => setEditingProgId(null)}
                      className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition cursor-pointer"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* Degree Programs List */}
            <div className="lg:col-span-2 p-6 rounded-3xl border border-slate-200 bg-white flex flex-col gap-6 shadow-sm">
              <h3 className="font-extrabold text-slate-900 text-sm uppercase tracking-wider border-b border-slate-100 pb-3">
                Registered Degree Programs ({degreePrograms.length})
              </h3>
              
              <div className="flex flex-col gap-3.5 max-h-[500px] overflow-y-auto pr-1">
                {degreePrograms.length === 0 ? (
                  <p className="text-slate-400 text-xs italic">No degree programs registered yet.</p>
                ) : (
                  degreePrograms.map((p) => (
                    <div key={p._id} className="p-4 rounded-2xl border border-slate-150 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm hover:shadow transition">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[13px] font-extrabold text-slate-900">{p.name}</span>
                          {p.code && <span className="text-[10px] text-slate-450 font-bold bg-slate-100 px-1.5 py-0.5 rounded">Code: {p.code}</span>}
                        </div>
                        {p.universities && p.universities.length > 0 ? (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            <span className="text-[9.5px] text-slate-400 font-extrabold uppercase mr-1">Offered By:</span>
                            {p.universities.map((univ) => (
                              <span key={univ._id} className="px-2 py-0.5 rounded bg-indigo-50 border border-indigo-100 text-indigo-600 text-[9.5px] font-bold">
                                {univ.name}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic mt-0.5">Offered universally or unassigned.</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <button
                          onClick={() => {
                            setEditingProgId(p._id);
                            setEditProgName(p.name);
                            setEditProgCode(p.code || '');
                            setEditProgUniversities(p.universities ? p.universities.map(u => u._id || u) : []);
                          }}
                          className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-800 rounded-lg text-[10px] font-extrabold transition shadow-sm cursor-pointer"
                        >
                          Edit / Assign
                        </button>
                        <button
                          onClick={() => handleDeleteDegreeProgram(p._id)}
                          className="px-3 py-1.5 bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-600 rounded-lg text-[10px] font-extrabold transition cursor-pointer"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Project Moderator */}
        {adminTab === 'projects' && (
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col gap-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <h3 className="font-extrabold text-slate-900 text-base uppercase tracking-wider flex items-center gap-2">
                <Folder className="w-5 h-5 text-brand-blue" />
                Inquiry & Submission Moderator
              </h3>
              
              {/* Search & Filters */}
              <div className="flex items-center gap-3 flex-wrap">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search projects..."
                    value={projectSearch}
                    onChange={(e) => setProjectSearch(e.target.value)}
                    className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-brand-blue w-48 md:w-60 transition"
                  />
                </div>
                <select
                  value={projectStatusFilter}
                  onChange={(e) => setProjectStatusFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 font-bold focus:outline-none cursor-pointer"
                >
                  <option value="All">All Statuses</option>
                  <option value="pending_approval">Pending Review</option>
                  <option value="approved">Approved Showcase</option>
                  <option value="rejected">Rejected Submissions</option>
                </select>
              </div>
            </div>

            {/* Moderator projects grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {allProjects
                .filter(p => {
                  const matchSearch = p.title.toLowerCase().includes(projectSearch.toLowerCase()) || (p.studentName || '').toLowerCase().includes(projectSearch.toLowerCase());
                  const matchStatus = projectStatusFilter === 'All' || p.status === projectStatusFilter;
                  return matchSearch && matchStatus;
                })
                .map((p) => {
                  const thumbnail = p.thumbnail
                    ? (p.thumbnail.startsWith('data:') ? p.thumbnail : `${BACKEND_URL}${p.thumbnail}`)
                    : 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=300&auto=format&fit=crop';
                  return (
                    <div key={p._id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm flex flex-col">
                      <div className="relative aspect-[16/10] bg-slate-100 border-b border-slate-100">
                        <img src={thumbnail} alt={p.title} className="w-full h-full object-cover" />
                        <span className={`absolute top-3 right-3 px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase border shadow-sm ${
                          p.status === 'approved'
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
                            : p.status === 'pending_approval'
                            ? 'bg-amber-50 border-amber-200 text-amber-600'
                            : 'bg-rose-50 border-rose-200 text-rose-600'
                        }`}>
                          {p.status === 'pending_approval' ? 'Pending Review' : p.status}
                        </span>
                      </div>
                      <div className="p-4 flex flex-col flex-grow gap-2">
                        <h4 className="text-[13.5px] font-extrabold text-slate-900 line-clamp-1">{p.title}</h4>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Author: {p.studentName || 'Student Submitter'}</span>
                        <p className="text-[12px] font-medium text-slate-500 line-clamp-2 mt-1 leading-relaxed">{p.description}</p>
                        
                        <div className="flex items-center justify-between border-t border-slate-100 pt-3 mt-2">
                          <span className="text-[11px] font-bold text-slate-400">{p.category || 'Computing'}</span>
                          <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                            <Eye className="w-3.5 h-3.5 text-slate-400" /> {p.viewsCount || 0}
                          </span>
                        </div>

                        {/* Mod Panel controls */}
                        <div className="flex gap-2 mt-3 pt-3 border-t border-slate-100">
                          {p.status !== 'approved' && (
                            <button
                              onClick={() => handleModerateApproveProject(p._id)}
                              className="flex-1 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-lg text-[10px] font-extrabold transition cursor-pointer"
                            >
                              Approve
                            </button>
                          )}
                          {p.status !== 'rejected' && (
                            <button
                              onClick={() => handleModerateRejectProject(p._id)}
                              className="flex-1 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-600 rounded-lg text-[10px] font-extrabold transition cursor-pointer"
                            >
                              Reject
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteProjectModerator(p._id)}
                            className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition cursor-pointer"
                            title="Remove Inappropriate Project"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4">

      {/* Render Dynamic Role Specific Panel */}
      {user.role === 'student' && renderStudentDashboard()}
      {user.role === 'recruiter' && renderRecruiterDashboard()}
      {user.role === 'lecturer' && renderLecturerDashboard()}
      {user.role === 'admin' && renderAdminDashboard()}

    </div>
  );
}

