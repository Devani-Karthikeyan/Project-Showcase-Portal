import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth, BACKEND_URL } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { useBookmark } from '../context/BookmarkContext';
import {
  Heart,
  Eye,
  Github,
  Link as LinkIcon,
  User,
  Star,
  Award,
  Lock,
  ArrowLeft,
  MessageSquare,
  CheckCircle,
  XCircle,
  Edit3,
  Trash2,
  Bookmark,
  MoreHorizontal,
  Calendar,
  ExternalLink,
  Twitter,
  Linkedin,
  Facebook,
  Flag,
  Check
} from 'lucide-react';

export default function ProjectDetails() {
  const { id } = useParams();
  const { user, isAuthenticated } = useAuth();
  const { addToast } = useNotifications();
  const { handleBookmark, modalProjectId, setModalProjectId } = useBookmark();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [userLiked, setUserLiked] = useState(false);
  const [userBookmarked, setUserBookmarked] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [feedbackRating, setFeedbackRating] = useState(5);

  const fetchProjectDetails = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${BACKEND_URL}/api/projects/${id}`, { headers });
      const data = await res.json();
      
      if (res.ok) {
        setProject(data.project);
        setUserLiked(data.userLiked);
        setUserBookmarked(data.userBookmarked);
        
        if (token && data.project.studentId) {
          const profileRes = await fetch(`${BACKEND_URL}/api/users/${data.project.studentId._id}/profile`, { headers });
          if (profileRes.ok) {
            const profileData = await profileRes.json();
            setIsFollowing(profileData.user.isFollowing);
          }
        }
      } else {
        addToast(data.message || 'Error fetching details', 'error');
        navigate('/');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectDetails();
  }, [id, user]);

  // Handle hash change scroll highlight
  useEffect(() => {
    if (!loading && project) {
      const handleHashCheck = () => {
        const hash = window.location.hash;
        if (hash && hash.startsWith('#review-')) {
          const element = document.getElementById(hash.substring(1));
          if (element) {
            setTimeout(() => {
              element.scrollIntoView({ behavior: 'smooth', block: 'center' });
              element.classList.add('highlight-review-glow');
              setTimeout(() => {
                element.classList.remove('highlight-review-glow');
              }, 3000);
            }, 100);
          }
        }
      };
      handleHashCheck();
      window.addEventListener('hashchange', handleHashCheck);
      return () => window.removeEventListener('hashchange', handleHashCheck);
    }
  }, [loading, project, window.location.hash]);

  const handleLikeToggle = async () => {
    if (!user) {
      addToast('Please log in to like projects.', 'info');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const endpoint = userLiked ? 'unlike' : 'like';
      
      const res = await fetch(`${BACKEND_URL}/api/projects/${id}/${endpoint}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await res.json();
      if (res.ok) {
        setUserLiked(!userLiked);
        setProject((prev) => ({ ...prev, likesCount: data.likesCount }));
        addToast(userLiked ? 'Project unliked.' : 'Project liked!', 'success');
      } else {
        addToast(data.message, 'error');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const onBookmarkStateChange = (projectId, newState, delta) => {
    setUserBookmarked(newState);
    setProject((prev) => ({ ...prev, bookmarksCount: Math.max(0, (prev.bookmarksCount || 0) + delta) }));
  };

  const handleFollowToggle = async () => {
    if (!user) {
      addToast('Please log in to follow students.', 'info');
      return;
    }
    try {
      const token = localStorage.getItem('token');
      const endpoint = isFollowing ? 'unfollow' : 'follow';
      const res = await fetch(`${BACKEND_URL}/api/users/${project.studentId._id}/${endpoint}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setIsFollowing(!isFollowing);
        addToast(data.message, 'success');
      } else {
        addToast(data.message, 'error');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddFeedback = async (e) => {
    e.preventDefault();
    if (!feedbackComment.trim()) return;
    setSubmittingFeedback(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${BACKEND_URL}/api/projects/${id}/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ comment: feedbackComment, rating: feedbackRating })
      });
      const data = await res.json();
      if (res.ok) {
        addToast('Feedback added successfully!', 'success');
        setFeedbackComment('');
        fetchProjectDetails();
      } else {
        addToast(data.message, 'error');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const handleApprove = async () => {
    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${BACKEND_URL}/api/projects/${id}/approve`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        addToast('Project approved and is now public!', 'success');
        fetchProjectDetails();
      } else {
        addToast(data.message, 'error');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${BACKEND_URL}/api/projects/${id}/reject`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        addToast('Project rejected.', 'info');
        fetchProjectDetails();
      } else {
        addToast(data.message, 'error');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you absolutely sure you want to delete this project post? This action is permanent.')) return;
    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${BACKEND_URL}/api/projects/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        addToast('Project deleted successfully.', 'success');
        navigate('/dashboard');
      } else {
        const data = await res.json();
        addToast(data.message, 'error');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 bg-white min-h-[calc(100vh-76px)]">
        <div className="w-8 h-8 border-3 border-slate-200 border-t-brand-blue rounded-full animate-spin"></div>
      </div>
    );
  }

  const isOwner = user && project.studentId?._id === user.id;
  const isAdmin = user?.role === 'admin';
  const isRecruiter = user?.role === 'recruiter';
  const isLecturer = user?.role === 'lecturer';
  const canApprove = (isLecturer && user.department === project.department) || isAdmin;

  const thumbnailSrc = project.thumbnail
    ? (project.thumbnail.startsWith('data:') ? project.thumbnail : `${BACKEND_URL}${project.thumbnail}`)
    : 'https://via.placeholder.com/1200x600?text=Project+Cover';

  const formatViews = (views) => {
    return views > 999 ? (views/1000).toFixed(1) + 'K' : views || 0;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  // Mock data to match screenshot aesthetics for missing backend fields
  const mockFeatures = [
    "User authentication and authorization",
    "Secure payments with Stripe",
    "Browse restaurants and menus",
    "Order history and re-order",
    "Add to cart and place orders",
    "Restaurant dashboard",
    "Real-time order tracking",
    "Responsive design for all devices"
  ];
  
  const mockScreenshots = [1, 2, 3, 4].map(n => `https://picsum.photos/seed/${project._id}${n}/400/300`);

  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-7xl mx-auto px-6 py-8">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* Main Content Area (Left Column) */}
          <div className="lg:col-span-8">
            
            {/* Hero Image */}
            <div className="w-full h-[450px] rounded-2xl overflow-hidden mb-8 relative border border-slate-100 shadow-sm bg-slate-50">
              <img src={thumbnailSrc} alt={project.title} className="w-full h-full object-cover" />
              
              {/* Floating Back Button */}
              <button 
                onClick={() => navigate(-1)}
                className="absolute top-5 left-5 w-10 h-10 rounded-full bg-white/80 backdrop-blur-md border border-white/50 flex items-center justify-center text-slate-800 hover:bg-white hover:text-brand-blue hover:shadow-md transition cursor-pointer"
                title="Go Back"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            </div>

            {/* Title & Description Header */}
            <div className="flex items-start justify-between mb-6">
              <div className="pr-4">
                <h1 className="text-[32px] font-extrabold text-slate-900 font-display leading-tight mb-2 tracking-tight">
                  {project.title}
                </h1>
                <p className="text-[16px] text-slate-500 leading-relaxed max-w-3xl">
                  A full-stack application that allows users to interact, build, and deploy in real-time.
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button 
                  onClick={handleLikeToggle}
                  className={`w-10 h-10 rounded-xl border flex items-center justify-center transition shadow-sm cursor-pointer ${userLiked ? 'border-rose-200 bg-rose-50 text-rose-500' : 'border-slate-200 bg-white text-slate-400 hover:text-rose-500 hover:border-slate-300'}`}
                >
                  <Heart className="w-[18px] h-[18px]" fill={userLiked ? 'currentColor' : 'none'} />
                </button>
                <button 
                  onClick={(e) => handleBookmark(e, project._id, userBookmarked, (ns, delta) => onBookmarkStateChange(project._id, ns, delta))}
                  className={`w-10 h-10 rounded-xl border flex items-center justify-center transition shadow-sm cursor-pointer ${userBookmarked ? 'border-brand-blue bg-blue-50 text-brand-blue' : 'border-slate-200 bg-white text-slate-400 hover:text-brand-blue hover:border-slate-300'}`}
                >
                  <Bookmark className="w-[18px] h-[18px]" fill={userBookmarked ? 'currentColor' : 'none'} />
                </button>
              </div>
            </div>

            {/* Tech Tags */}
            <div className="flex flex-wrap gap-2 mb-6">
              {project.modules?.length > 0 ? (
                project.modules.map((m, idx) => (
                  <span key={idx} className="px-3.5 py-1.5 rounded-full bg-slate-50 text-slate-600 font-bold text-[13px] border border-slate-100">
                    {m}
                  </span>
                ))
              ) : (
                <>
                  <span className="px-3.5 py-1.5 rounded-full bg-slate-50 text-slate-600 font-bold text-[13px] border border-slate-100">React</span>
                  <span className="px-3.5 py-1.5 rounded-full bg-slate-50 text-slate-600 font-bold text-[13px] border border-slate-100">Node.js</span>
                  <span className="px-3.5 py-1.5 rounded-full bg-slate-50 text-slate-600 font-bold text-[13px] border border-slate-100">Express.js</span>
                  <span className="px-3.5 py-1.5 rounded-full bg-slate-50 text-slate-600 font-bold text-[13px] border border-slate-100">MongoDB</span>
                </>
              )}
            </div>

            {/* Meta Stats Row */}
            <div className="flex items-center gap-6 pb-8 mb-10 border-b border-slate-100">
              <span className="flex items-center gap-1.5 text-[13px] font-bold text-slate-400">
                <Heart className="w-4 h-4 fill-brand-blue text-brand-blue" />
                <span className="text-slate-700">{project.likesCount || 0}</span> Likes
              </span>
              <span className="flex items-center gap-1.5 text-[13px] font-bold text-slate-400">
                <Eye className="w-4 h-4 text-slate-400" />
                <span className="text-slate-700">{formatViews(project.viewsCount)}</span> Views
              </span>
              <span className="flex items-center gap-1.5 text-[13px] font-bold text-slate-400">
                <Calendar className="w-4 h-4 text-slate-400" />
                Posted on {formatDate(project.createdAt)}
              </span>
            </div>

            {/* About Section */}
            <div className="mb-10">
              <h3 className="text-[19px] font-bold text-slate-900 font-display mb-4">About the Project</h3>
              <p className="text-[15px] leading-relaxed text-slate-600 font-medium whitespace-pre-line">
                {project.description}
              </p>
            </div>

            {/* Key Features Mock */}
            <div className="mb-10">
              <h3 className="text-[19px] font-bold text-slate-900 font-display mb-4">Key Features</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-3 gap-x-6">
                {mockFeatures.map((feature, idx) => (
                  <div key={idx} className="flex items-center gap-2.5">
                    <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span className="text-[14px] text-slate-600 font-medium">{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Screenshots */}
            {project.extraImages && project.extraImages.length > 0 && (
              <div className="mb-10">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[19px] font-bold text-slate-900 font-display">Screenshots</h3>
                  <span className="text-[13px] font-bold text-slate-400">
                    {project.extraImages.length} image{project.extraImages.length > 1 ? 's' : ''} uploaded
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {project.extraImages.map((src, idx) => (
                    <div key={idx} className="aspect-video rounded-xl border border-slate-200 overflow-hidden bg-slate-50 relative group cursor-pointer shadow-sm hover:shadow-md transition duration-300">
                      <img 
                        src={src.startsWith('data:') ? src : `${BACKEND_URL}${src}`} 
                        className="w-full h-full object-cover opacity-95 hover:opacity-100 hover:scale-105 transition-all duration-300" 
                        alt={`Screenshot ${idx + 1}`} 
                        onClick={() => window.open(src.startsWith('data:') ? src : `${BACKEND_URL}${src}`, '_blank')}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Lecturer Reviews Feedback log (Existing Functionality Retained) */}
            <div className="mt-12 p-8 rounded-2xl border border-slate-200 bg-white shadow-sm flex flex-col gap-6">
              <h3 className="text-slate-800 font-bold text-[17px] flex items-center gap-2 font-display">
                <MessageSquare className="w-5 h-5 text-brand-blue" />
                Academic Assessment Reviews ({project.feedback?.length || 0})
              </h3>

              <div className="flex flex-col gap-4">
                {project.feedback?.length === 0 ? (
                  <p className="text-slate-500 text-[14px] italic">No reviewer comments posted yet.</p>
                ) : (
                  project.feedback?.map((fb, idx) => (
                    <div 
                      key={idx} 
                      id={`review-${fb.lecturerId?._id}`}
                      className="p-5 rounded-xl border border-slate-100 bg-slate-50 flex flex-col gap-3 transition-all duration-300"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <img
                            src={fb.lecturerId?.avatarUrl ? (fb.lecturerId.avatarUrl.startsWith('http') ? fb.lecturerId.avatarUrl : `${BACKEND_URL}${fb.lecturerId.avatarUrl}`) : `https://api.dicebear.com/7.x/identicon/svg?seed=${fb.lecturerId?.name || 'Lecturer'}`}
                            alt={fb.lecturerId?.name}
                            className="w-8 h-8 rounded-full border border-slate-200 object-cover"
                          />
                          <div className="flex flex-col">
                            <span className="text-[14px] font-bold text-slate-900">{fb.lecturerId?.name}</span>
                            <span className="text-[11px] text-slate-500 font-semibold">{fb.lecturerId?.title || 'Faculty Member'}</span>
                          </div>
                        </div>
                        
                        {fb.rating && (
                          <div className="flex items-center gap-1 text-amber-500">
                            {Array.from({ length: fb.rating }).map((_, i) => (
                              <Star key={i} className="w-3.5 h-3.5 fill-current" />
                            ))}
                          </div>
                        )}
                      </div>
                      <p className="text-slate-700 text-[14px] leading-relaxed">"{fb.comment}"</p>
                      <span className="text-[11px] text-slate-400 font-bold self-end">
                        {new Date(fb.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Lecturer Add Review Form (Existing Functionality Retained) */}
            {isLecturer && (
              <div className="mt-8 p-8 rounded-2xl border border-slate-200 bg-white shadow-sm flex flex-col gap-4">
                <h4 className="text-[15px] font-bold text-slate-900 mb-2">Leave Academic Review</h4>
                <form onSubmit={handleAddFeedback} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Rating Score</label>
                    <select
                      value={feedbackRating}
                      onChange={(e) => setFeedbackRating(parseInt(e.target.value))}
                      className="w-32 px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-800 text-[13px] font-semibold focus:outline-none focus:border-brand-blue"
                    >
                      {[5, 4, 3, 2, 1].map((r) => (
                        <option key={r} value={r}>{r} / 5 Stars</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Review Comments</label>
                    <textarea
                      rows="3"
                      required
                      placeholder="Enter academic review comments, module assessment notes, or recommendations..."
                      value={feedbackComment}
                      onChange={(e) => setFeedbackComment(e.target.value)}
                      className="w-full px-4 py-3 rounded-lg border border-slate-200 bg-slate-50 text-slate-800 placeholder-slate-400 text-[14px] focus:outline-none focus:border-brand-blue resize-none"
                    ></textarea>
                  </div>

                  <button
                    type="submit"
                    disabled={submittingFeedback}
                    className="w-fit mt-2 px-6 py-2.5 rounded-lg bg-brand-blue hover:bg-brand-blue-hover text-white font-bold text-[13px] cursor-pointer transition disabled:opacity-50"
                  >
                    {submittingFeedback ? 'Posting comments...' : 'Submit Feedback Review'}
                  </button>
                </form>
              </div>
            )}

            {/* Lecturer/Admin Project Approval Box (Existing Functionality Retained) */}
            {project.status === 'pending_approval' && canApprove && (
              <div className="mt-8 p-6 rounded-xl border border-amber-200 bg-amber-50 shadow-sm flex flex-col gap-4">
                <h4 className="text-amber-800 font-bold text-[15px] flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-amber-600" />
                  Submission Approval Required
                </h4>
                <p className="text-[13px] text-amber-700 font-medium">
                  Review this submission. Projects require approval from department staff before they are publicly visible.
                </p>

                <div className="flex gap-3 mt-2">
                  <button
                    onClick={handleApprove}
                    disabled={actionLoading}
                    className="px-6 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[13px] flex items-center gap-2 transition cursor-pointer disabled:opacity-50 shadow-sm"
                  >
                    <CheckCircle className="w-4 h-4" /> Approve Project
                  </button>
                  <button
                    onClick={handleReject}
                    disabled={actionLoading}
                    className="px-6 py-2.5 rounded-lg border border-rose-200 bg-white hover:bg-rose-50 text-rose-600 font-bold text-[13px] flex items-center gap-2 transition cursor-pointer disabled:opacity-50"
                  >
                    <XCircle className="w-4 h-4" /> Reject
                  </button>
                </div>
              </div>
            )}

            {/* Owner controls & Lecturer Actions (Existing Functionality Retained) */}
            <div className="flex flex-col gap-4 mt-10 pt-8 border-t border-slate-100">
              {(isOwner || isAdmin) && (
                <button
                  onClick={handleDelete}
                  disabled={actionLoading}
                  className="w-fit px-5 py-2.5 rounded-lg border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 text-[13px] font-bold flex items-center gap-2 transition cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" /> Delete Project
                </button>
              )}
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="lg:col-span-4">
            <div className="sticky top-28 flex flex-col gap-6">
              
              {/* Project Author */}
              {!isOwner && (
                <div className="p-6 mt-[-80px] rounded-2xl border border-slate-200 bg-white shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)]">
                  <h4 className="text-[15px] font-bold text-slate-900 mb-5">Project Author</h4>
                  <div className="flex items-center gap-4 mb-6">
                    <img src={project.studentId?.avatarUrl ? (project.studentId.avatarUrl.startsWith('http') ? project.studentId.avatarUrl : `${BACKEND_URL}${project.studentId.avatarUrl}`) : `https://api.dicebear.com/7.x/notionists/svg?seed=${project.studentId?.name || 'Student'}`} alt="avatar" className="w-14 h-14 rounded-full border border-slate-200 object-cover bg-slate-50" />
                    <div>
                      <div className="flex items-center gap-1">
                        <span className="font-bold text-[16px] text-slate-900 leading-tight">
                          {project.studentId?.name || 'Anonymous'}
                        </span>
                        <CheckCircle className="w-4 h-4 fill-brand-blue text-white shrink-0" />
                      </div>
                      <span className="text-[12px] font-semibold text-slate-500 mt-0.5 block">
                        {project.studentId?.department || 'Computer Science'} @ {project.studentId?.university || 'ABC University'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex gap-3 mb-6">
                    <button 
                      onClick={handleFollowToggle}
                      className="flex-1 py-2.5 rounded-xl bg-brand-blue hover:bg-brand-blue-hover text-white font-semibold text-[13px] shadow-sm transition cursor-pointer flex items-center justify-center"
                    >
                      {isFollowing ? 'Following' : 'Follow'}
                    </button>
                    <button className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold text-[13px] hover:bg-slate-50 transition flex items-center justify-center gap-2 cursor-pointer shadow-sm">
                      <MessageSquare className="w-4 h-4" /> Message
                    </button>
                  </div>

                  <div className="flex justify-between border-t border-slate-100 pt-5 px-2">
                    <div className="text-center">
                      <span className="block font-extrabold text-[17px] text-slate-900">248</span>
                      <span className="text-[11px] text-slate-400 font-semibold mt-0.5 block">Followers</span>
                    </div>
                    <div className="text-center">
                      <span className="block font-extrabold text-[17px] text-slate-900">86</span>
                      <span className="text-[11px] text-slate-400 font-semibold mt-0.5 block">Following</span>
                    </div>
                    <div className="text-center">
                      <span className="block font-extrabold text-[17px] text-slate-900">12</span>
                      <span className="text-[11px] text-slate-400 font-semibold mt-0.5 block">Projects</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Project Links */}
              <div className={`p-6 rounded-2xl border border-slate-200 bg-white shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] ${isOwner ? 'mt-[-80px]' : ''}`}>
                <h4 className="text-[15px] font-bold text-slate-900 mb-5">Project Links</h4>
                <div className="flex flex-col gap-4">
                  
                  <div className="flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center bg-slate-50 text-slate-600">
                        <Eye className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[13px] font-bold text-slate-900">Live Demo</span>
                        <a href={project.demoUrl || '#'} target="_blank" rel="noreferrer" className="text-[11px] font-semibold text-brand-blue hover:underline line-clamp-1">
                          {project.demoUrl || 'https://demo.app.live'}
                        </a>
                      </div>
                    </div>
                    <ExternalLink className="w-4 h-4 text-slate-300 group-hover:text-brand-blue transition" />
                  </div>

                  <div className="flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center bg-slate-50 text-slate-600">
                        <Github className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[13px] font-bold text-slate-900">GitHub Repository</span>
                        <a href={project.githubUrl || '#'} target="_blank" rel="noreferrer" className="text-[11px] font-semibold text-brand-blue hover:underline line-clamp-1">
                          {project.githubUrl || 'https://github.com/project'}
                        </a>
                      </div>
                    </div>
                    <ExternalLink className="w-4 h-4 text-slate-300 group-hover:text-brand-blue transition" />
                  </div>

                  <div className="flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center bg-slate-50 text-slate-600">
                        <LinkIcon className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[13px] font-bold text-slate-900">Documentation</span>
                        <a href="#" className="text-[11px] font-semibold text-brand-blue hover:underline line-clamp-1">
                          https://docs.project.live
                        </a>
                      </div>
                    </div>
                    <ExternalLink className="w-4 h-4 text-slate-300 group-hover:text-brand-blue transition" />
                  </div>

                </div>
              </div>

              {/* Project Stats */}
              <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)]">
                <h4 className="text-[15px] font-bold text-slate-900 mb-5">Project Stats</h4>
                <div className="grid grid-cols-2 gap-y-5 gap-x-4">
                  <div>
                    <div className="flex items-center gap-1.5 text-[12px] font-semibold text-slate-500 mb-1">
                      <Eye className="w-3.5 h-3.5" /> Total Views
                    </div>
                    <span className="font-extrabold text-[16px] text-slate-900">{formatViews(project.viewsCount)}</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 text-[12px] font-semibold text-slate-500 mb-1">
                      <Heart className="w-3.5 h-3.5" /> Total Likes
                    </div>
                    <span className="font-extrabold text-[16px] text-slate-900">{project.likesCount || 0}</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 text-[12px] font-semibold text-slate-500 mb-1">
                      <MessageSquare className="w-3.5 h-3.5" /> Comments
                    </div>
                    <span className="font-extrabold text-[16px] text-slate-900">{project.feedback?.length || 18}</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 text-[12px] font-semibold text-slate-500 mb-1">
                      <Star className="w-3.5 h-3.5" /> Average Rating
                    </div>
                    <span className="font-extrabold text-[16px] text-slate-900 flex items-center gap-1.5">
                      4.8
                      <div className="flex gap-0.5">
                        {[1,2,3,4].map(n => <Star key={n} className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />)}
                        <Star className="w-2.5 h-2.5 fill-amber-400/30 text-amber-400/30" />
                      </div>
                    </span>
                  </div>
                </div>
              </div>

              {/* Share Project */}
              <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)]">
                <h4 className="text-[15px] font-bold text-slate-900 mb-4">Share Project</h4>
                <div className="flex items-center gap-3">
                  <button className="w-10 h-10 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-600 hover:text-brand-blue hover:border-brand-blue/30 transition shadow-sm cursor-pointer">
                    <LinkIcon className="w-4 h-4" />
                  </button>
                  <button className="w-10 h-10 rounded-full bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-500 hover:bg-sky-500 hover:text-white transition shadow-sm cursor-pointer">
                    <Twitter className="w-4 h-4" />
                  </button>
                  <button className="w-10 h-10 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 hover:bg-blue-600 hover:text-white transition shadow-sm cursor-pointer">
                    <Linkedin className="w-4 h-4" />
                  </button>
                  <button className="w-10 h-10 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 hover:bg-indigo-600 hover:text-white transition shadow-sm cursor-pointer">
                    <Facebook className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Report Project */}
              <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] flex items-center gap-3 cursor-pointer group">
                <Flag className="w-4 h-4 text-slate-400 group-hover:text-rose-500 transition" />
                <span className="text-[13px] font-bold text-slate-600 group-hover:text-rose-600 transition">Report Project</span>
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
