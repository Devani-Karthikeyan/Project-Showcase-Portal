import React, { useState, useEffect } from 'react';
import { useAuth, BACKEND_URL } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  User, Lock, Bell, Palette, ShieldAlert, Camera, 
  Github, Linkedin, Globe, CheckCircle2, ExternalLink,
  Mail, Eye, EyeOff, Activity, Users, MessageSquare, CalendarDays,
  Sun, Moon, Monitor, LogOut, Trash2, Loader2
} from 'lucide-react';

export default function Settings() {
  const { user, logout, setUser } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');
  const fileInputRef = React.useRef(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  // Profile Form State
  const [formData, setFormData] = useState({
    fullName: user?.name || '',
    headline: user?.title || '',
    bio: user?.bio || '',
    github: user?.github || '',
    linkedin: user?.linkedin || '',
    portfolio: user?.portfolio || '',
    university: user?.university || '',
    department: user?.department || '',
    graduationYear: user?.graduationYear || '',
    company: user?.company || ''
  });
  const [universities, setUniversities] = useState([]);
  const [degreePrograms, setDegreePrograms] = useState([]);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState('');

  // Notifications State
  const [notifications, setNotifications] = useState({
    email: user?.settings?.notifications?.email ?? true,
    activity: user?.settings?.notifications?.activity ?? true,
    followers: user?.settings?.notifications?.followers ?? true,
    messages: user?.settings?.notifications?.messages ?? true,
    summary: user?.settings?.notifications?.summary ?? false
  });

  // Appearance State
  const [appearance, setAppearance] = useState({
    theme: user?.settings?.appearance?.theme || 'light',
    accent: user?.settings?.appearance?.accent || 'indigo',
    fontSize: user?.settings?.appearance?.fontSize || 'medium'
  });

  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    async function loadMetadata() {
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
      } catch (err) {
        console.error('Error loading metadata:', err);
      }
    }
    loadMetadata();
  }, []);

  // Sync state if user changes
  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.name || '',
        headline: user.title || '',
        bio: user.bio || '',
        github: user.github || '',
        linkedin: user.linkedin || '',
        portfolio: user.portfolio || '',
        university: user.university || '',
        department: user.department || '',
        graduationYear: user.graduationYear || '',
        company: user.company || ''
      });
      if (user.settings) {
        if (user.settings.notifications) {
          setNotifications(user.settings.notifications);
        }
        if (user.settings.appearance) {
          setAppearance(user.settings.appearance);
        }
      }
    }
  }, [user]);

  const handleUpdate = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setProfileMessage('Error: Image size exceeds 2MB.');
      return;
    }

    const formDataPayload = new FormData();
    formDataPayload.append('avatar', file);

    setIsUploadingAvatar(true);
    setProfileMessage('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${BACKEND_URL}/api/users/avatar`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formDataPayload
      });
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          setUser(data.user);
        }
        setProfileMessage('Profile picture updated successfully!');
        setTimeout(() => setProfileMessage(''), 3000);
      } else {
        const errData = await res.json();
        setProfileMessage(errData.message || 'Failed to upload profile picture.');
      }
    } catch (err) {
      console.error(err);
      setProfileMessage('Error uploading profile picture.');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const saveProfile = async () => {
    setIsSavingProfile(true);
    setProfileMessage('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${BACKEND_URL}/api/users/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: formData.fullName,
          title: formData.headline,
          bio: formData.bio,
          github: formData.github,
          linkedin: formData.linkedin,
          portfolio: formData.portfolio,
          university: formData.university,
          department: formData.department,
          graduationYear: formData.graduationYear ? Number(formData.graduationYear) : undefined,
          company: formData.company
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          setUser(data.user);
        }
        setProfileMessage('Profile updated successfully!');
        setTimeout(() => setProfileMessage(''), 3000);
      } else {
        setProfileMessage('Failed to update profile.');
      }
    } catch (error) {
      console.error(error);
      setProfileMessage('An error occurred.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const saveSettings = async (newNotifications, newAppearance) => {
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
          appearance: newAppearance
        })
      });
      if (res.ok) {
        const data = await res.json();
        setUser(prev => ({ ...prev, settings: { ...prev.settings, notifications: data.settings.notifications, appearance: data.settings.appearance } }));
      }
    } catch (error) {
      console.error('Failed to update settings:', error);
    }
  };

  const toggleNotification = (key) => {
    const newNotifications = { ...notifications, [key]: !notifications[key] };
    setNotifications(newNotifications);
    saveSettings(newNotifications, appearance);
  };

  const updateAppearance = (updates) => {
    const newAppearance = { ...appearance, ...updates };
    setAppearance(newAppearance);
    saveSettings(notifications, newAppearance);
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') return;
    setIsDeleting(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${BACKEND_URL}/api/users/account`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        logout();
        navigate('/login');
      }
    } catch (error) {
      console.error('Failed to delete account', error);
      setIsDeleting(false);
    }
  };

  const getAvatar = () => {
    if (user?.avatarUrl && user.avatarUrl.startsWith('http')) return user.avatarUrl;
    if (user?.avatarUrl) return `${BACKEND_URL}${user.avatarUrl}`;
    return `https://api.dicebear.com/7.x/notionists/svg?seed=${user?.name || 'User'}`;
  };

  const accentColors = [
    { id: 'indigo', color: 'bg-[#6366f1]', hover: 'hover:bg-[#4f46e5]', ring: 'ring-[#6366f1]' },
    { id: 'blue', color: 'bg-[#3b82f6]', hover: 'hover:bg-[#2563eb]', ring: 'ring-[#3b82f6]' },
    { id: 'green', color: 'bg-[#10b981]', hover: 'hover:bg-[#059669]', ring: 'ring-[#10b981]' },
    { id: 'orange', color: 'bg-[#f97316]', hover: 'hover:bg-[#ea580c]', ring: 'ring-[#f97316]' },
    { id: 'red', color: 'bg-[#ef4444]', hover: 'hover:bg-[#dc2626]', ring: 'ring-[#ef4444]' }
  ];

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User, isDanger: false },
    { id: 'account', label: 'Account & Security', icon: Lock, isDanger: false },
    { id: 'notifications', label: 'Notifications', icon: Bell, isDanger: false },
    { id: 'appearance', label: 'Appearance', icon: Palette, isDanger: false },
    { id: 'danger', label: 'Danger Zone', icon: ShieldAlert, isDanger: true }
  ];

  return (
    <div className="flex flex-col h-full bg-slate-50 px-8 py-10 min-h-screen">
      
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-[26px] font-extrabold text-slate-900 font-display mb-1.5">Settings</h1>
        <p className="text-[14px] font-semibold text-slate-500">Manage your account settings and preferences</p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-8 border-b border-slate-200 mb-8 overflow-x-auto overflow-y-hidden scrollbar-hide">
        {tabs.map(tab => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 py-4 text-[13px] font-bold transition -mb-[1px] whitespace-nowrap ${
              activeTab === tab.id 
                ? tab.isDanger ? 'text-rose-600 border-b-2 border-rose-600' : 'text-brand-blue border-b-2 border-brand-blue'
                : tab.isDanger ? 'text-rose-400 hover:text-rose-600' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content Area */}
      {activeTab === 'profile' && (
        <div className="grid lg:grid-cols-[1fr_360px] gap-8">
          
          {/* Left Column: Form */}
          <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm h-fit">
            <h2 className="text-[16px] font-bold text-slate-900 mb-6">Profile Information</h2>
            
            <div className="flex flex-col md:flex-row gap-8 mb-8">
              {/* Avatar Upload */}
              <div className="flex flex-col items-center gap-3 shrink-0">
                <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                  <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-md bg-slate-100 flex items-center justify-center relative">
                    {isUploadingAvatar ? (
                      <Loader2 className="w-8 h-8 text-brand-blue animate-spin" />
                    ) : (
                      <img 
                        src={getAvatar()} 
                        alt="Avatar" 
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <button 
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                    className="absolute bottom-1 right-1 w-8 h-8 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center text-brand-blue hover:scale-110 transition cursor-pointer"
                  >
                    <Camera className="w-4 h-4" />
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleAvatarChange}
                    style={{ display: 'none' }}
                    accept="image/*"
                  />
                </div>
                <span className="text-[10px] font-medium text-slate-400">JPG, PNG or GIF. Max size 2MB.</span>
              </div>

              {/* Basic Fields */}
              <div className="flex-1 flex flex-col gap-5">
                <div className="flex flex-col gap-2">
                  <label className="text-[13px] font-bold text-slate-800">Full Name</label>
                  <input 
                    type="text" 
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleUpdate}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-[13px] font-medium text-slate-800 focus:outline-none focus:border-brand-blue transition"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[13px] font-bold text-slate-800">Headline</label>
                  <input 
                    type="text" 
                    name="headline"
                    value={formData.headline}
                    onChange={handleUpdate}
                    placeholder={
                      user?.role === 'lecturer' ? "e.g., Senior Lecturer | Department of CSE" :
                      user?.role === 'recruiter' ? "e.g., Talent Acquisition Manager | Tech Corp" :
                      "e.g., Full Stack Developer | CSE Student"
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-[13px] font-medium text-slate-800 focus:outline-none focus:border-brand-blue transition"
                  />
                </div>

                {/* Role-Specific Fields */}
                {user?.role === 'student' && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                    <div className="flex flex-col justify-end gap-2 h-full">
                      <label className="text-[13px] font-bold text-slate-800">University</label>
                      <select
                        name="university"
                        value={formData.university}
                        onChange={handleUpdate}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-[13px] font-medium text-slate-800 focus:outline-none focus:border-brand-blue transition cursor-pointer"
                      >
                        <option value="">Select University</option>
                        {universities.map(u => (
                          <option key={u._id} value={u.name}>{u.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex flex-col justify-end gap-2 h-full">
                      <label className="text-[13px] font-bold text-slate-800">Degree Program (Department)</label>
                      <select
                        name="department"
                        value={formData.department}
                        onChange={handleUpdate}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-[13px] font-medium text-slate-800 focus:outline-none focus:border-brand-blue transition cursor-pointer"
                      >
                        <option value="">Select Degree Program</option>
                        {degreePrograms.map(p => (
                          <option key={p._id} value={p.name}>{p.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex flex-col justify-end gap-2 h-full">
                      <label className="text-[13px] font-bold text-slate-800">Graduation Year</label>
                      <input
                        type="number"
                        name="graduationYear"
                        value={formData.graduationYear}
                        onChange={handleUpdate}
                        placeholder="e.g., 2026"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-[13px] font-medium text-slate-800 focus:outline-none focus:border-brand-blue transition"
                      />
                    </div>
                  </div>
                )}

                {user?.role === 'lecturer' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2">
                      <label className="text-[13px] font-bold text-slate-800">University</label>
                      <select
                        name="university"
                        value={formData.university}
                        onChange={handleUpdate}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-[13px] font-medium text-slate-800 focus:outline-none focus:border-brand-blue transition cursor-pointer"
                      >
                        <option value="">Select University</option>
                        {universities.map(u => (
                          <option key={u._id} value={u.name}>{u.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-[13px] font-bold text-slate-800">Department</label>
                      <input 
                        type="text"
                        name="department"
                        value={formData.department}
                        onChange={handleUpdate}
                        placeholder="e.g., Department of Software Engineering"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-[13px] font-medium text-slate-800 focus:outline-none focus:border-brand-blue transition"
                      />
                    </div>
                  </div>
                )}

                {user?.role === 'recruiter' && (
                  <div className="flex flex-col gap-2">
                    <label className="text-[13px] font-bold text-slate-800">Company / Organization</label>
                    <input 
                      type="text" 
                      name="company"
                      value={formData.company}
                      onChange={handleUpdate}
                      placeholder="e.g., Google APAC"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-[13px] font-medium text-slate-800 focus:outline-none focus:border-brand-blue transition"
                    />
                  </div>
                )}

                <div className="flex flex-col gap-2">
                  <label className="text-[13px] font-bold text-slate-800">Bio</label>
                  <div className="relative">
                    <textarea 
                      name="bio"
                      value={formData.bio}
                      onChange={handleUpdate}
                      rows="4"
                      maxLength="200"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-[13px] font-medium text-slate-800 focus:outline-none focus:border-brand-blue transition resize-none"
                    ></textarea>
                    <span className="absolute right-3 bottom-3 text-[10px] font-bold text-slate-400">
                      {formData.bio.length}/200
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Social Links - Recruiter and Student only */}
            {['student', 'recruiter'].includes(user?.role) && (
              <div className="flex flex-col gap-4 mb-8">
                <div className="flex items-center">
                  <div className="w-36 flex items-center gap-2 text-[13px] font-bold text-slate-800">
                    <Github className="w-4 h-4 text-slate-800" /> GitHub
                  </div>
                  <input 
                    type="text" 
                    name="github"
                    value={formData.github}
                    onChange={handleUpdate}
                    placeholder="github.com/username"
                    className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-[13px] font-medium text-slate-800 focus:outline-none focus:border-brand-blue transition"
                  />
                </div>
                <div className="flex items-center">
                  <div className="w-36 flex items-center gap-2 text-[13px] font-bold text-slate-800">
                    <Linkedin className="w-4 h-4 text-blue-600" /> LinkedIn
                  </div>
                  <input 
                    type="text" 
                    name="linkedin"
                    value={formData.linkedin}
                    onChange={handleUpdate}
                    placeholder="linkedin.com/in/username"
                    className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-[13px] font-medium text-slate-800 focus:outline-none focus:border-brand-blue transition"
                  />
                </div>
                <div className="flex items-center">
                  <div className="w-36 flex flex-col">
                    <span className="flex items-center gap-2 text-[13px] font-bold text-slate-800">
                      <Globe className="w-4 h-4 text-slate-400" /> Portfolio
                    </span>
                    <span className="text-[10px] font-medium text-slate-400 ml-6">(Optional)</span>
                  </div>
                  <input 
                    type="text" 
                    name="portfolio"
                    value={formData.portfolio}
                    onChange={handleUpdate}
                    placeholder="yourwebsite.com"
                    className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-[13px] font-medium text-slate-800 focus:outline-none focus:border-brand-blue transition"
                  />
                </div>
              </div>
            )}

            <div className="flex items-center gap-4 justify-center md:justify-start">
              <button 
                onClick={saveProfile}
                disabled={isSavingProfile}
                className="flex items-center justify-center min-w-[140px] px-8 py-2.5 rounded-xl bg-brand-blue text-white font-bold text-[13px] hover:bg-blue-700 transition shadow-sm cursor-pointer disabled:opacity-70"
              >
                {isSavingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Changes'}
              </button>
              {profileMessage && (
                <span className="text-[12px] font-bold text-emerald-600 animate-in fade-in">{profileMessage}</span>
              )}
            </div>
          </div>

          {/* Right Column: Cards */}
          <div className="flex flex-col gap-6">
            
            {/* Profile Preview Card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h3 className="text-[14px] font-bold text-slate-900 mb-5">Profile Preview</h3>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="w-16 h-16 rounded-full overflow-hidden shrink-0 bg-slate-100">
                  <img 
                    src={getAvatar()} 
                    alt="Preview Avatar" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex flex-col">
                  <h4 className="text-[15px] font-extrabold text-slate-900 font-display truncate max-w-[200px]">{formData.fullName || 'Your Name'}</h4>
                  <span className="text-[12px] font-bold text-brand-blue mb-3">{formData.headline || 'Your Headline'}</span>
                  <p className="text-[12px] font-medium text-slate-500 leading-relaxed mb-4">
                    {formData.bio || 'Write a short bio about yourself...'}
                  </p>
                  
                  <div className="flex items-center gap-3">
                    {formData.github && <a href={`https://${formData.github}`} target="_blank" rel="noreferrer" className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 hover:bg-slate-200 transition"><Github className="w-3.5 h-3.5" /></a>}
                    {formData.linkedin && <a href={`https://${formData.linkedin}`} target="_blank" rel="noreferrer" className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-blue-600 hover:bg-blue-100 transition"><Linkedin className="w-3.5 h-3.5" /></a>}
                    {formData.portfolio && <a href={`https://${formData.portfolio}`} target="_blank" rel="noreferrer" className="text-[12px] font-bold text-brand-blue hover:underline ml-1 truncate max-w-[100px]">{formData.portfolio}</a>}
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Tips Card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h3 className="text-[14px] font-bold text-slate-900 mb-4">Quick Tips</h3>
              <ul className="flex flex-col gap-3">
                <li className="flex items-start gap-2.5 text-[12px] font-medium text-slate-600">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  This information will be visible on your public profile.
                </li>
                <li className="flex items-start gap-2.5 text-[12px] font-medium text-slate-600">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  Add social links to help others connect with you.
                </li>
                <li className="flex items-start gap-2.5 text-[12px] font-medium text-slate-600">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  A good bio helps others know more about you.
                </li>
              </ul>
            </div>

          </div>
        </div>
      )}
      
      {activeTab === 'account' && (
        <div className="flex flex-col gap-6 max-w-4xl">
          
          {/* Email Address Block */}
          <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
            <h3 className="text-[15px] font-extrabold text-slate-900 flex items-center gap-2 mb-6">
              <Mail className="w-5 h-5 text-slate-800" /> Email Address
            </h3>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0">
                  <Mail className="w-4 h-4 text-slate-500" />
                </div>
                <span className="text-[13px] font-bold text-slate-800">{user?.email || ''}</span>
              </div>
              <button className="px-5 py-2.5 rounded-lg border border-slate-200 text-brand-blue font-bold text-[13px] hover:bg-slate-50 transition shadow-sm whitespace-nowrap cursor-not-allowed opacity-60">
                Change Email (Coming Soon)
              </button>
            </div>
          </div>

          {/* Change Password Block (Kept for future use, disabled for now) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm opacity-60">
            <h3 className="text-[15px] font-extrabold text-slate-900 flex items-center gap-2 mb-8">
              <div className="w-8 h-8 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0">
                <Lock className="w-4 h-4 text-slate-700" />
              </div>
              Change Password (Disabled for Google Auth)
            </h3>
            
            <div className="flex flex-col gap-6 max-w-2xl pointer-events-none">
              <div className="flex flex-col gap-2">
                <label className="text-[13px] font-bold text-slate-800">Current Password</label>
                <div className="relative">
                  <input 
                    type="password" 
                    placeholder="Enter current password"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-[13px] text-slate-800 placeholder-slate-400 focus:outline-none focus:border-brand-blue transition"
                    disabled
                  />
                  <EyeOff className="absolute right-4 top-3.5 w-4 h-4 text-slate-400" />
                </div>
              </div>
              
              <div className="flex flex-col gap-2">
                <label className="text-[13px] font-bold text-slate-800">New Password</label>
                <div className="relative">
                  <input 
                    type="password" 
                    placeholder="Enter new password"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-[13px] text-slate-800 placeholder-slate-400 focus:outline-none focus:border-brand-blue transition"
                    disabled
                  />
                  <EyeOff className="absolute right-4 top-3.5 w-4 h-4 text-slate-400" />
                </div>
              </div>
              
              <div className="flex flex-col gap-2">
                <label className="text-[13px] font-bold text-slate-800">Confirm New Password</label>
                <div className="relative">
                  <input 
                    type="password" 
                    placeholder="Confirm new password"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-[13px] text-slate-800 placeholder-slate-400 focus:outline-none focus:border-brand-blue transition"
                    disabled
                  />
                  <EyeOff className="absolute right-4 top-3.5 w-4 h-4 text-slate-400" />
                </div>
              </div>

              <div className="pt-2">
                <button disabled className="px-6 py-3 rounded-xl bg-slate-300 text-white font-bold text-[13px] transition shadow-sm w-fit">
                  Update Password
                </button>
              </div>
            </div>
          </div>

        </div>
      )}
      
      {activeTab === 'notifications' && (
        <div className="flex flex-col max-w-4xl">
          <div className="mb-6">
            <h2 className="text-[18px] font-extrabold text-slate-900 mb-1">Notification Preferences</h2>
            <p className="text-[13px] font-medium text-slate-500">Choose how you want to stay updated.</p>
          </div>

          <div className="flex flex-col gap-3 mb-6">
            
            {/* Email Notifications */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                  <Mail className="w-4 h-4 text-slate-700" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[14px] font-bold text-slate-900">Email Notifications</span>
                  <span className="text-[12px] font-medium text-slate-500">Receive emails about important updates.</span>
                </div>
              </div>
              <div 
                onClick={() => toggleNotification('email')}
                className={`w-11 h-6 rounded-full flex items-center px-1 cursor-pointer transition-colors ${notifications.email ? 'bg-brand-blue' : 'bg-slate-200'}`}
              >
                <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${notifications.email ? 'translate-x-5' : 'translate-x-0'}`} />
              </div>
            </div>

            {/* Project Activity */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                  <Activity className="w-4 h-4 text-slate-700" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[14px] font-bold text-slate-900">Project Activity</span>
                  <span className="text-[12px] font-medium text-slate-500">Get notified about likes, comments and saves on your projects.</span>
                </div>
              </div>
              <div 
                onClick={() => toggleNotification('activity')}
                className={`w-11 h-6 rounded-full flex items-center px-1 cursor-pointer transition-colors ${notifications.activity ? 'bg-brand-blue' : 'bg-slate-200'}`}
              >
                <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${notifications.activity ? 'translate-x-5' : 'translate-x-0'}`} />
              </div>
            </div>

            {/* New Followers */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                  <Users className="w-4 h-4 text-slate-700" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[14px] font-bold text-slate-900">New Followers</span>
                  <span className="text-[12px] font-medium text-slate-500">Get notified when someone follows you.</span>
                </div>
              </div>
              <div 
                onClick={() => toggleNotification('followers')}
                className={`w-11 h-6 rounded-full flex items-center px-1 cursor-pointer transition-colors ${notifications.followers ? 'bg-brand-blue' : 'bg-slate-200'}`}
              >
                <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${notifications.followers ? 'translate-x-5' : 'translate-x-0'}`} />
              </div>
            </div>

            {/* Messages */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                  <MessageSquare className="w-4 h-4 text-slate-700" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[14px] font-bold text-slate-900">Messages</span>
                  <span className="text-[12px] font-medium text-slate-500">Get notified about new messages.</span>
                </div>
              </div>
              <div 
                onClick={() => toggleNotification('messages')}
                className={`w-11 h-6 rounded-full flex items-center px-1 cursor-pointer transition-colors ${notifications.messages ? 'bg-brand-blue' : 'bg-slate-200'}`}
              >
                <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${notifications.messages ? 'translate-x-5' : 'translate-x-0'}`} />
              </div>
            </div>

            {/* Weekly Summary */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                  <CalendarDays className="w-4 h-4 text-slate-700" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[14px] font-bold text-slate-900">Weekly Summary</span>
                  <span className="text-[12px] font-medium text-slate-500">Receive a weekly summary of your activity.</span>
                </div>
              </div>
              <div 
                onClick={() => toggleNotification('summary')}
                className={`w-11 h-6 rounded-full flex items-center px-1 cursor-pointer transition-colors ${notifications.summary ? 'bg-brand-blue' : 'bg-slate-200'}`}
              >
                <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${notifications.summary ? 'translate-x-5' : 'translate-x-0'}`} />
              </div>
            </div>

          </div>

          <div className="bg-indigo-50/50 rounded-xl border border-indigo-100 p-4 text-[12px] font-medium text-indigo-900/70">
            Settings are saved automatically when toggled.
          </div>
        </div>
      )}
      
      {activeTab === 'appearance' && (
        <div className="flex flex-col max-w-4xl">
          <div className="mb-6">
            <h2 className="text-[18px] font-extrabold text-slate-900 mb-1">Appearance Settings</h2>
            <p className="text-[13px] font-medium text-slate-500">Customize how the application looks for you.</p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm flex flex-col gap-10">
            
            {/* Theme */}
            <div className="flex flex-col gap-4">
              <h3 className="text-[15px] font-extrabold text-slate-900">Theme</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                
                <div 
                  onClick={() => updateAppearance({ theme: 'light' })}
                  className={`flex flex-col items-center justify-center p-6 rounded-xl border-2 transition cursor-pointer ${
                    appearance.theme === 'light' ? 'border-brand-blue bg-indigo-50/30' : 'border-slate-100 bg-white hover:border-slate-200'
                  }`}
                >
                  <Sun className={`w-6 h-6 mb-3 ${appearance.theme === 'light' ? 'text-brand-blue' : 'text-slate-600'}`} />
                  <span className={`text-[14px] font-bold mb-1 ${appearance.theme === 'light' ? 'text-slate-900' : 'text-slate-700'}`}>Light</span>
                  <span className={`text-[12px] font-medium mb-4 ${appearance.theme === 'light' ? 'text-brand-blue' : 'text-slate-400'}`}>Light theme</span>
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${appearance.theme === 'light' ? 'border-brand-blue' : 'border-slate-300'}`}>
                    {appearance.theme === 'light' && <div className="w-2 h-2 rounded-full bg-brand-blue" />}
                  </div>
                </div>

                <div 
                  onClick={() => updateAppearance({ theme: 'dark' })}
                  className={`flex flex-col items-center justify-center p-6 rounded-xl border-2 transition cursor-pointer ${
                    appearance.theme === 'dark' ? 'border-brand-blue bg-indigo-50/30' : 'border-slate-100 bg-white hover:border-slate-200'
                  }`}
                >
                  <Moon className={`w-6 h-6 mb-3 ${appearance.theme === 'dark' ? 'text-brand-blue' : 'text-slate-600'}`} />
                  <span className={`text-[14px] font-bold mb-1 ${appearance.theme === 'dark' ? 'text-slate-900' : 'text-slate-700'}`}>Dark</span>
                  <span className={`text-[12px] font-medium mb-4 ${appearance.theme === 'dark' ? 'text-brand-blue' : 'text-slate-400'}`}>Dark theme</span>
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${appearance.theme === 'dark' ? 'border-brand-blue' : 'border-slate-300'}`}>
                    {appearance.theme === 'dark' && <div className="w-2 h-2 rounded-full bg-brand-blue" />}
                  </div>
                </div>

                <div 
                  onClick={() => updateAppearance({ theme: 'system' })}
                  className={`flex flex-col items-center justify-center p-6 rounded-xl border-2 transition cursor-pointer ${
                    appearance.theme === 'system' ? 'border-brand-blue bg-indigo-50/30' : 'border-slate-100 bg-white hover:border-slate-200'
                  }`}
                >
                  <Monitor className={`w-6 h-6 mb-3 ${appearance.theme === 'system' ? 'text-brand-blue' : 'text-slate-600'}`} />
                  <span className={`text-[14px] font-bold mb-1 ${appearance.theme === 'system' ? 'text-slate-900' : 'text-slate-700'}`}>System</span>
                  <span className={`text-[12px] font-medium mb-4 ${appearance.theme === 'system' ? 'text-brand-blue' : 'text-slate-400'}`}>Use system preference</span>
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${appearance.theme === 'system' ? 'border-brand-blue' : 'border-slate-300'}`}>
                    {appearance.theme === 'system' && <div className="w-2 h-2 rounded-full bg-brand-blue" />}
                  </div>
                </div>

              </div>
            </div>

            {/* Accent Color */}
            <div className="flex flex-col gap-2">
              <h3 className="text-[15px] font-extrabold text-slate-900">Accent Color</h3>
              <p className="text-[13px] font-medium text-slate-500 mb-2">Choose your preferred accent color.</p>
              <div className="flex items-center gap-4">
                {accentColors.map(color => (
                  <div 
                    key={color.id}
                    onClick={() => updateAppearance({ accent: color.id })}
                    className={`w-10 h-10 rounded-full cursor-pointer transition-all flex items-center justify-center ${
                      appearance.accent === color.id ? `ring-2 ring-offset-2 ${color.ring}` : 'hover:scale-110'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-full ${color.color}`} />
                  </div>
                ))}
              </div>
            </div>

            {/* Font Size */}
            <div className="flex flex-col gap-2">
              <h3 className="text-[15px] font-extrabold text-slate-900">Font Size</h3>
              <p className="text-[13px] font-medium text-slate-500 mb-2">Adjust the font size for better readability.</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {['Small', 'Medium', 'Large'].map((size) => {
                  const sizeId = size.toLowerCase();
                  const isSelected = appearance.fontSize === sizeId;
                  return (
                    <div 
                      key={sizeId}
                      onClick={() => updateAppearance({ fontSize: sizeId })}
                      className={`flex items-center gap-3 p-3.5 rounded-xl border transition cursor-pointer ${
                        isSelected ? 'border-brand-blue bg-indigo-50/50' : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${isSelected ? 'border-brand-blue' : 'border-slate-300'}`}>
                        {isSelected && <div className="w-2 h-2 rounded-full bg-brand-blue" />}
                      </div>
                      <span className={`text-[13px] font-bold ${isSelected ? 'text-brand-blue' : 'text-slate-700'}`}>{size}</span>
                    </div>
                  )
                })}
              </div>
            </div>

          </div>
        </div>
      )}
      
      {activeTab === 'danger' && (
        <div className="flex flex-col max-w-4xl">
          <div className="mb-6">
            <h2 className="text-[18px] font-extrabold text-slate-900 mb-1">Danger Zone</h2>
            <p className="text-[13px] font-medium text-slate-500">Actions here are permanent and cannot be undone.</p>
          </div>

          <div className="flex flex-col gap-6">
            
            {/* Logout Block */}
            <div className="bg-orange-50/50 rounded-2xl border border-orange-100 p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-orange-100 border border-orange-200 flex items-center justify-center shrink-0">
                  <LogOut className="w-5 h-5 text-orange-600" />
                </div>
                <div className="flex flex-col pt-1">
                  <span className="text-[15px] font-extrabold text-slate-900 mb-1">Logout</span>
                  <span className="text-[13px] font-medium text-slate-600">Sign out from your account on this device.</span>
                </div>
              </div>
              <button 
                onClick={() => {
                  logout();
                  navigate('/login');
                }}
                className="px-6 py-2.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-bold text-[13px] transition shadow-sm whitespace-nowrap self-start sm:self-center cursor-pointer"
              >
                Logout
              </button>
            </div>

            {/* Delete Account Block */}
            <div className="bg-rose-50/50 rounded-2xl border border-rose-100 p-8 flex flex-col shadow-sm gap-6">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-rose-100 border border-rose-200 flex items-center justify-center shrink-0">
                    <Trash2 className="w-5 h-5 text-rose-600" />
                  </div>
                  <div className="flex flex-col pt-1">
                    <span className="text-[15px] font-extrabold text-slate-900 mb-1">Delete Account</span>
                    <span className="text-[13px] font-medium text-rose-600 leading-relaxed">
                      Permanently delete your account and all of your data.<br/>
                      This action cannot be undone.
                    </span>
                  </div>
                </div>
                <button 
                  disabled={deleteConfirmText !== 'DELETE' || isDeleting}
                  onClick={handleDeleteAccount}
                  className={`flex items-center justify-center min-w-[120px] px-6 py-2.5 rounded-lg font-bold text-[13px] transition shadow-sm whitespace-nowrap self-start ${
                    deleteConfirmText === 'DELETE' 
                      ? 'bg-rose-500 hover:bg-rose-600 text-white cursor-pointer' 
                      : 'bg-rose-500/50 text-white cursor-not-allowed'
                  }`}
                >
                  {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Delete Account'}
                </button>
              </div>

              {/* Confirmation Input */}
              <div className="bg-white/80 rounded-xl border border-rose-100 p-5 mt-2">
                <label className="text-[13px] font-medium text-slate-700 block mb-3">
                  To confirm, type <span className="font-bold text-rose-500">DELETE</span> in the input below:
                </label>
                <input 
                  type="text" 
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="Type DELETE to confirm"
                  className="w-full sm:w-80 px-4 py-2.5 rounded-lg border border-slate-200 bg-white text-[13px] text-slate-800 placeholder-slate-400 focus:outline-none focus:border-rose-400 transition"
                />
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
