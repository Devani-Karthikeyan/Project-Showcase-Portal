import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useAuth, BACKEND_URL } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { 
  ArrowLeft, Upload, CheckCircle2, ChevronRight, Check, Image as ImageIcon,
  Globe, LayoutTemplate, Smartphone, Cpu, BarChart2, Shield, Box, Activity, PenTool,
  Search, X, Edit3, Github, Link as LinkIcon, Youtube, FileText, ChevronDown, Plus
} from 'lucide-react';

const CATEGORIES = [
  { id: 'web', name: 'Web Development', desc: 'Websites, web apps, APIs, and more', icon: Globe, iconBg: 'bg-indigo-50', iconColor: 'text-indigo-600' },
  { id: 'mobile', name: 'Mobile Apps', desc: 'iOS, Android, cross-platform mobile apps', icon: Smartphone, iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600' },
  { id: 'ai', name: 'AI / ML', desc: 'Machine learning models, AI applications', icon: Cpu, iconBg: 'bg-amber-50', iconColor: 'text-amber-600' },
  { id: 'data', name: 'Data Science', desc: 'Data analysis, visualization, and insights', icon: BarChart2, iconBg: 'bg-purple-50', iconColor: 'text-purple-600' },
  { id: 'ui', name: 'UI / UX', desc: 'Design systems, prototypes, user research', icon: PenTool, iconBg: 'bg-rose-50', iconColor: 'text-rose-600' },
  { id: 'cyber', name: 'Cyber Security', desc: 'Security tools, privacy solutions, and more', icon: Shield, iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600' },
  { id: 'blockchain', name: 'Blockchain', desc: 'DApps, smart contracts, DeFi, and NFTs', icon: Box, iconBg: 'bg-blue-50', iconColor: 'text-blue-600' },
  { id: 'iot', name: 'IoT', desc: 'Internet of Things, hardware integrations', icon: Activity, iconBg: 'bg-cyan-50', iconColor: 'text-cyan-600' },
];

const TECH_LIST = [
  { id: 'react', name: 'React', type: 'Frontend', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/react/react-original.svg' },
  { id: 'node', name: 'Node.js', type: 'Backend', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/nodejs/nodejs-original.svg' },
  { id: 'mongo', name: 'MongoDB', type: 'Database', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/mongodb/mongodb-original.svg' },
  { id: 'tailwind', name: 'Tailwind CSS', type: 'Styling', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/tailwindcss/tailwindcss-original.svg' },
  { id: 'firebase', name: 'Firebase', type: 'Backend Service', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/firebase/firebase-original.svg' },
  { id: 'next', name: 'Next.js', type: 'Frontend', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/nextjs/nextjs-original.svg' },
  { id: 'vue', name: 'Vue.js', type: 'Frontend', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/vuejs/vuejs-original.svg' },
  { id: 'angular', name: 'Angular', type: 'Frontend', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/angularjs/angularjs-original.svg' },
  { id: 'ts', name: 'TypeScript', type: 'Frontend', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/typescript/typescript-original.svg' },
  { id: 'express', name: 'Express.js', type: 'Backend', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/express/express-original.svg' },
  { id: 'python', name: 'Python', type: 'Backend', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/python/python-original.svg' },
  { id: 'django', name: 'Django', type: 'Backend', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/django/django-plain.svg' },
  { id: 'flask', name: 'Flask', type: 'Backend', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/flask/flask-original.svg' },
  { id: 'ruby', name: 'Ruby on Rails', type: 'Backend', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/rails/rails-original-wordmark.svg' },
  { id: 'php', name: 'PHP', type: 'Backend', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/php/php-original.svg' },
  { id: 'postgres', name: 'PostgreSQL', type: 'Database', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/postgresql/postgresql-original.svg' },
  { id: 'mysql', name: 'MySQL', type: 'Database', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/mysql/mysql-original.svg' },
  { id: 'sqlite', name: 'SQLite', type: 'Database', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/sqlite/sqlite-original.svg' },
  { id: 'redis', name: 'Redis', type: 'Database', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/redis/redis-original.svg' },
  { id: 'supabase', name: 'Supabase', type: 'Backend Service', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/supabase/supabase-original.svg' },
  { id: 'aws', name: 'AWS', type: 'Cloud & DevOps', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/amazonwebservices/amazonwebservices-original-wordmark.svg' },
  { id: 'gcp', name: 'Google Cloud', type: 'Cloud & DevOps', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/googlecloud/googlecloud-original.svg' },
  { id: 'docker', name: 'Docker', type: 'Cloud & DevOps', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/docker/docker-original.svg' },
  { id: 'k8s', name: 'Kubernetes', type: 'Cloud & DevOps', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/kubernetes/kubernetes-plain.svg' },
  { id: 'git', name: 'Git', type: 'Tools', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/git/git-original.svg' },
  { id: 'github', name: 'GitHub', type: 'Tools', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/github/github-original.svg' },
  { id: 'figma', name: 'Figma', type: 'Tools', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/figma/figma-original.svg' },
  { id: 'postman', name: 'Postman', type: 'Tools', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/postman/postman-original.svg' },
  { id: 'jest', name: 'Jest', type: 'Tools', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/jest/jest-plain.svg' },
];

const TABS = ['All', 'Frontend', 'Backend', 'Database', 'Cloud & DevOps', 'Tools', 'Libraries', 'Other'];

export default function ProjectForm({ isSidebarOpen = true }) {
  const { id } = useParams();
  const isEditMode = !!id;
  
  const { user } = useAuth();
  const { addToast } = useNotifications();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    shortDesc: '',
    detailedDesc: '',
    category: '',
    visibility: 'Public',
    technologies: [],
    thumbnail: '',
    extraImages: [],
    demoUrl: '',
    githubUrl: '',
    youtubeUrl: '',
    docsUrl: ''
  });

  const [techSearch, setTechSearch] = useState('');
  const [techTab, setTechTab] = useState('All');

  // Load existing data if edit mode
  useEffect(() => {
    if (isEditMode) {
      async function loadProjectDetails() {
        setFetchingData(true);
        try {
          const res = await fetch(`${BACKEND_URL}/api/projects/${id}`);
          if (res.ok) {
            const data = await res.json();
            const project = data.project;
            
            if (project.studentId._id !== user?.id && user?.role !== 'admin') {
              addToast('Unauthorized modification access', 'error');
              navigate('/dashboard');
              return;
            }

            setFormData(prev => ({
              ...prev,
              title: project.title,
              shortDesc: project.description.substring(0, 200),
              detailedDesc: project.description,
              category: project.category || 'Web Development', // fallback to text match
              technologies: project.modules || [],
              thumbnail: project.thumbnail || '',
              extraImages: project.extraImages || [],
              demoUrl: project.demoUrl || '',
              githubUrl: project.githubUrl || '',
              visibility: project.restricted ? 'Private' : 'Public'
            }));
          }
        } catch (err) {
          console.error(err);
        } finally {
          setFetchingData(false);
        }
      }
      loadProjectDetails();
    }
  }, [id, isEditMode, user]);

  const handleUpdate = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      addToast('Image size exceeds 2MB limit.', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      handleUpdate('thumbnail', reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleExtraImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    
    if (formData.extraImages.length + files.length > 3) {
      addToast('You can add up to 3 extra images.', 'error');
      return;
    }

    files.forEach(file => {
      if (file.size > 2 * 1024 * 1024) {
        addToast(`${file.name} size exceeds 2MB limit.`, 'error');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          extraImages: [...prev.extraImages, reader.result]
        }));
      };
      reader.readAsDataURL(file);
    });
  };

  const removeExtraImage = (indexToRemove) => {
    setFormData(prev => ({
      ...prev,
      extraImages: prev.extraImages.filter((_, idx) => idx !== indexToRemove)
    }));
  };

  const toggleTech = (tech) => {
    const isSelected = formData.technologies.some(t => t.id === tech.id || t === tech.name);
    if (isSelected) {
      handleUpdate('technologies', formData.technologies.filter(t => t.id !== tech.id && t !== tech.name));
    } else {
      handleUpdate('technologies', [...formData.technologies, tech]);
    }
  };

  const removeTech = (techToRemove) => {
    handleUpdate('technologies', formData.technologies.filter(t => t.id !== techToRemove.id && t !== techToRemove.name));
  };

  const nextStep = () => {
    if (step === 1 && (!formData.title || !formData.shortDesc)) {
      addToast('Please fill in the required fields', 'error');
      return;
    }
    window.scrollTo(0, 0);
    setStep(s => Math.min(4, s + 1));
  };
  const prevStep = () => {
    window.scrollTo(0, 0);
    setStep(s => Math.max(1, s - 1));
  };

  const handleSubmit = async () => {
    setLoading(true);
    // Submit only what the backend currently supports to prevent breaking
    const payload = {
      title: formData.title,
      description: formData.detailedDesc || formData.shortDesc,
      demoUrl: formData.demoUrl,
      githubUrl: formData.githubUrl,
      modules: formData.technologies.map(t => typeof t === 'string' ? t : t.name),
      restricted: formData.visibility === 'Private',
      thumbnail: formData.thumbnail,
      extraImages: formData.extraImages,
      category: CATEGORIES.find(c => c.id === formData.category)?.name || 'Web Development'
    };

    try {
      const token = localStorage.getItem('token');
      const url = isEditMode ? `${BACKEND_URL}/api/projects/${id}` : `${BACKEND_URL}/api/projects`;
      const method = isEditMode ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('Failed to submit project.');
      
      addToast(isEditMode ? 'Project updated!' : 'Project published successfully!', 'success');
      navigate('/dashboard');
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // --- RENDERING HELPERS ---

  const renderStepHeader = () => {
    const steps = [
      { num: 1, label: 'Project Details' },
      { num: 2, label: 'Technologies' },
      { num: 3, label: 'Media & Links' },
      { num: 4, label: 'Review & Publish' }
    ];

    return (
      <div className="flex items-center justify-between max-w-4xl w-full mx-auto mb-10 px-4">
        {steps.map((s, i) => (
          <React.Fragment key={s.num}>
            <div className="flex items-center gap-2">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold ${
                step >= s.num ? 'bg-brand-blue text-white' : 'bg-slate-100 text-slate-400'
              }`}>
                {step > s.num ? <Check className="w-3.5 h-3.5" /> : s.num}
              </div>
              <span className={`text-[13px] font-bold hidden sm:block ${
                step >= s.num ? 'text-brand-blue' : 'text-slate-400'
              }`}>{s.label}</span>
            </div>
            {i < 3 && <div className={`flex-1 mx-4 h-[1px] border-t border-dashed ${step > s.num ? 'border-brand-blue' : 'border-slate-200'}`}></div>}
          </React.Fragment>
        ))}
      </div>
    );
  };

  const renderProjectSummaryCard = () => (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden sticky top-8">
      <div className="p-4 border-b border-slate-100 flex items-center justify-between">
        <h3 className="text-[14px] font-bold text-slate-900">Project Summary</h3>
        <button onClick={() => setStep(1)} className="text-[12px] font-bold text-brand-blue hover:underline">Edit</button>
      </div>
      <div className="p-5">
        <div className="w-full h-32 rounded-xl bg-slate-100 border border-slate-200 mb-4 overflow-hidden relative">
          {formData.thumbnail ? (
            <img src={formData.thumbnail.startsWith('data:') ? formData.thumbnail : `${BACKEND_URL}${formData.thumbnail}`} alt="Cover" className="w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-slate-400">
              <ImageIcon className="w-8 h-8 opacity-50" />
            </div>
          )}
        </div>
        <h4 className="text-[15px] font-extrabold text-slate-900 font-display mb-1">{formData.title || 'Project Name'}</h4>
        <p className="text-[12px] font-medium text-slate-500 mb-4 line-clamp-2">
          {formData.shortDesc || 'Short description of what your project does and the problem it solves.'}
        </p>
        <div className="flex items-center gap-2 mb-4">
          <Globe className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-[12px] font-medium text-slate-600">Category</span>
          <span className="ml-auto text-[12px] font-bold text-slate-800">{CATEGORIES.find(c => c.id === formData.category)?.name || 'Not selected'}</span>
        </div>
      </div>
      <div className="p-5 border-t border-slate-100 bg-slate-50/50">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-[12px] font-bold text-slate-700">Selected Technologies</h4>
          <span className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600">{formData.technologies.length}</span>
        </div>
        <div className="flex flex-col gap-2">
          {formData.technologies.slice(0, 5).map((t, i) => {
            const techObj = typeof t === 'string' ? { name: t, logo: null, type: 'Other' } : t;
            return (
              <div key={i} className="flex items-center justify-between text-[12px]">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded bg-white border border-slate-200 flex items-center justify-center overflow-hidden">
                    {techObj.logo ? <img src={techObj.logo} alt="" className="w-3.5 h-3.5 object-contain" /> : '💻'}
                  </span>
                  <span className="font-bold text-slate-700">{techObj.name}</span>
                </div>
                <span className="text-[10px] font-bold text-brand-blue bg-blue-50 px-2 py-0.5 rounded">{techObj.type}</span>
              </div>
            );
          })}
          {formData.technologies.length > 5 && (
            <div className="text-[11px] font-bold text-slate-500 text-center mt-2">+{formData.technologies.length - 5} more</div>
          )}
        </div>
      </div>
    </div>
  );

  // STEP 1 UI
  const renderStep1 = () => (
    <div className="grid lg:grid-cols-[1fr_320px] gap-8 max-w-6xl mx-auto w-full">
      <div className="flex flex-col gap-8">
        {/* Basic Info */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="text-[16px] font-bold text-slate-900 mb-6">Basic Information</h2>
          
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <label className="text-[13px] font-bold text-slate-700">Project Name <span className="text-rose-500">*</span></label>
              <div className="relative">
                <input type="text" value={formData.title} onChange={e => handleUpdate('title', e.target.value)} placeholder="Enter a catchy name for your project" className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-[14px] text-slate-800 placeholder-slate-400 focus:outline-none focus:border-brand-blue" />
                <span className="absolute right-3 top-3 text-[11px] font-medium text-slate-400">{formData.title.length}/100</span>
              </div>
            </div>
            
            <div className="flex flex-col gap-2">
              <label className="text-[13px] font-bold text-slate-700">Short Description <span className="text-rose-500">*</span></label>
              <div className="relative">
                <textarea rows="3" value={formData.shortDesc} onChange={e => handleUpdate('shortDesc', e.target.value)} placeholder="Briefly describe what your project does and the problem it solves" className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-[14px] text-slate-800 placeholder-slate-400 focus:outline-none focus:border-brand-blue resize-none"></textarea>
                <span className="absolute right-3 bottom-3 text-[11px] font-medium text-slate-400">{formData.shortDesc.length}/200</span>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[13px] font-bold text-slate-700">Detailed Description <span className="text-rose-500">*</span></label>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="bg-slate-50 border-b border-slate-200 px-3 py-2 flex items-center gap-4 text-slate-500">
                  <span className="font-serif font-bold cursor-pointer hover:text-slate-800">B</span>
                  <span className="font-serif italic cursor-pointer hover:text-slate-800">I</span>
                  <span className="font-serif underline cursor-pointer hover:text-slate-800">U</span>
                  <div className="w-[1px] h-4 bg-slate-300"></div>
                  <span className="font-bold cursor-pointer hover:text-slate-800">⋮=</span>
                  <span className="font-bold cursor-pointer hover:text-slate-800">1.</span>
                  <div className="w-[1px] h-4 bg-slate-300"></div>
                  <span className="text-[12px] font-bold cursor-pointer hover:text-slate-800">&lt;/&gt;</span>
                </div>
                <textarea rows="6" value={formData.detailedDesc} onChange={e => handleUpdate('detailedDesc', e.target.value)} placeholder="Describe your project in detail. What inspired you? How did you build it? What makes it unique?" className="w-full px-4 py-3 bg-white text-[14px] text-slate-800 placeholder-slate-400 focus:outline-none resize-none border-none"></textarea>
                <div className="bg-white px-3 py-2 text-right border-t border-slate-100">
                  <span className="text-[11px] font-medium text-slate-400">{formData.detailedDesc.length}/2000</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Categories */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="text-[16px] font-bold text-slate-900 mb-1">Project Category <span className="text-rose-500">*</span></h2>
          <p className="text-[13px] font-medium text-slate-500 mb-6">Choose the category that best describes your project</p>
          
          <div className="grid md:grid-cols-2 gap-4">
            {CATEGORIES.map(cat => (
              <div 
                key={cat.id} 
                onClick={() => handleUpdate('category', cat.id)}
                className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition ${
                  formData.category === cat.id ? 'border-brand-blue bg-blue-50/30 shadow-sm' : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${cat.iconBg} ${cat.iconColor}`}>
                  <cat.icon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-[13px] font-bold text-slate-800 mb-0.5">{cat.name}</h4>
                  <p className="text-[11px] font-medium text-slate-500 leading-tight">{cat.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Column */}
      <div className="flex flex-col gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h3 className="text-[14px] font-bold text-slate-900 mb-4 flex items-center gap-1.5">Project Preview <InfoIcon /></h3>
          <div className="relative w-full aspect-video rounded-xl border-2 border-dashed border-brand-blue/30 bg-blue-50/20 flex flex-col items-center justify-center cursor-pointer hover:bg-blue-50/50 transition overflow-hidden group">
            <input type="file" accept="image/*" onChange={handleImageChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
            {formData.thumbnail ? (
              <img src={formData.thumbnail.startsWith('data:') ? formData.thumbnail : `${BACKEND_URL}${formData.thumbnail}`} alt="Cover" className="w-full h-full object-cover" />
            ) : (
              <>
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-brand-blue mb-3 group-hover:scale-110 transition">
                  <ImageIcon className="w-5 h-5" />
                </div>
                <span className="text-[13px] font-bold text-slate-700">Add a cover image</span>
                <span className="text-[11px] font-medium text-slate-400 mt-1">Recommended: 1200x630px</span>
                <span className="mt-4 px-4 py-1.5 rounded-full bg-white border border-brand-blue/30 text-brand-blue text-[11px] font-bold shadow-sm">Upload Image</span>
              </>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h3 className="text-[14px] font-bold text-slate-900 mb-4">Visibility</h3>
          <div className="relative">
            <select 
              value={formData.visibility} 
              onChange={e => handleUpdate('visibility', e.target.value)}
              className="w-full px-10 py-3 rounded-xl border border-slate-200 bg-white text-[13px] font-bold text-slate-800 appearance-none focus:outline-none focus:border-brand-blue cursor-pointer"
            >
              <option value="Public">Public</option>
              <option value="Private">Restricted to University</option>
            </select>
            <Globe className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
            <ChevronDown className="absolute right-3.5 top-3.5 w-4 h-4 text-slate-400" />
          </div>
          <p className="text-[11px] font-medium text-slate-500 mt-2 ml-1">
            {formData.visibility === 'Public' ? 'Anyone can view your project' : 'Only university members can view'}
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h3 className="text-[14px] font-bold text-slate-900 mb-3">Publishing Tips</h3>
          <ul className="flex flex-col gap-2.5">
            {['Use a clear and descriptive title', 'Add a high-quality cover image', 'Write a detailed description', 'Add relevant technologies', 'Include live demo or source code'].map((tip, i) => (
              <li key={i} className="flex items-start gap-2 text-[12px] font-medium text-slate-600">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> {tip}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );

  // STEP 2 UI
  const renderStep2 = () => {
    const filteredTech = TECH_LIST.filter(t => 
      (techTab === 'All' || t.type === techTab || (techTab === 'Other' && !TABS.includes(t.type))) &&
      t.name.toLowerCase().includes(techSearch.toLowerCase())
    );

    return (
      <div className="grid lg:grid-cols-[1fr_320px] gap-8 max-w-6xl mx-auto w-full">
        <div className="flex flex-col gap-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-[16px] font-bold text-slate-900">Technologies</h2>
              <button className="text-[12px] font-bold text-brand-blue px-3 py-1.5 rounded-lg border border-brand-blue bg-blue-50/50 hover:bg-blue-50 transition">Suggest a Technology</button>
            </div>
            <p className="text-[13px] font-medium text-slate-500 mb-6">Select the technologies, frameworks, tools, and platforms used in your project.</p>
            
            <div className="relative mb-8">
              <Search className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
              <input type="text" value={techSearch} onChange={e => setTechSearch(e.target.value)} placeholder="Search technologies (e.g., React, Python, Firebase...)" className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-[13px] text-slate-800 placeholder-slate-400 focus:outline-none focus:border-brand-blue focus:bg-white transition" />
            </div>

            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[14px] font-bold text-slate-900">Selected Technologies <span className="ml-1 w-5 h-5 inline-flex items-center justify-center rounded-full bg-indigo-50 text-brand-blue text-[10px]">{formData.technologies.length}</span></h3>
                {formData.technologies.length > 0 && <button onClick={() => handleUpdate('technologies', [])} className="text-[12px] font-bold text-slate-500 hover:text-rose-500">Clear all</button>}
              </div>
              <div className="flex flex-wrap gap-3">
                {formData.technologies.length === 0 ? (
                  <p className="text-[13px] text-slate-400 italic">No technologies selected yet.</p>
                ) : (
                  formData.technologies.map((t, i) => {
                    const techObj = typeof t === 'string' ? { name: t, logo: null, type: 'Other' } : t;
                    return (
                      <div key={i} className="flex items-center gap-3 px-3 py-2 rounded-xl border border-slate-200 bg-white shadow-sm">
                        {techObj.logo ? <img src={techObj.logo} alt="" className="w-4 h-4 object-contain" /> : <span className="text-[14px]">💻</span>}
                        <div className="flex flex-col">
                          <span className="text-[13px] font-bold text-slate-800 leading-tight">{techObj.name}</span>
                          <span className="text-[9px] font-bold text-slate-400 uppercase">{techObj.type}</span>
                        </div>
                        <button onClick={() => removeTech(techObj)} className="ml-2 w-5 h-5 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700"><X className="w-3 h-3" /></button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div>
              <h3 className="text-[14px] font-bold text-slate-900 mb-4">Browse Technologies</h3>
              <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide mb-4 border-b border-slate-100">
                {TABS.map(tab => (
                  <button key={tab} onClick={() => setTechTab(tab)} className={`px-4 py-2.5 text-[12px] font-bold whitespace-nowrap -mb-[1px] transition ${techTab === tab ? 'text-brand-blue border-b-2 border-brand-blue' : 'text-slate-500 hover:text-slate-800'}`}>
                    {tab}
                  </button>
                ))}
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {filteredTech.map(tech => {
                  const isSelected = formData.technologies.some(t => t.id === tech.id || t === tech.name);
                  return (
                    <button key={tech.id} onClick={() => toggleTech(tech)} className={`flex items-center justify-between p-3 rounded-xl border transition ${isSelected ? 'border-brand-blue bg-blue-50/30' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 flex items-center justify-center">
                          <img src={tech.logo} alt={tech.name} className="max-w-full max-h-full object-contain" />
                        </div>
                        <span className={`text-[13px] font-bold ${isSelected ? 'text-brand-blue' : 'text-slate-700'}`}>{tech.name}</span>
                      </div>
                      <div className={`w-4 h-4 rounded flex items-center justify-center border ${isSelected ? 'bg-brand-blue border-brand-blue text-white' : 'border-slate-300 text-transparent'}`}>
                        {isSelected ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3 text-slate-400" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
        
        {/* Right Column */}
        <div className="flex flex-col gap-6">
          {renderProjectSummaryCard()}
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <h3 className="text-[14px] font-bold text-slate-900 mb-3">Tips</h3>
            <ul className="flex flex-col gap-2.5">
              {['Add all major technologies used in your project', 'Be specific (e.g., React.js instead of just React)', 'Include tools and services that were essential', 'This helps others understand your tech stack better'].map((tip, i) => (
                <li key={i} className="flex items-start gap-2 text-[12px] font-medium text-slate-600">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> {tip}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    );
  };

  // STEP 3 UI
  const renderStep3 = () => (
    <div className="grid lg:grid-cols-[1fr_320px] gap-8 max-w-6xl mx-auto w-full">
      <div className="flex flex-col gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="text-[16px] font-bold text-slate-900 mb-2">Media & Links</h2>
          <p className="text-[13px] font-medium text-slate-500 mb-6">Add screenshots, videos, and relevant links to showcase your project.</p>
          
          <div className="mb-8">
            <h3 className="text-[14px] font-bold text-slate-900 mb-4 flex items-center justify-between">Project Images (Up to 4)</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {/* Cover Image Slot */}
              <div className="aspect-square rounded-xl border border-slate-200 overflow-hidden relative group bg-slate-50">
                {formData.thumbnail ? (
                  <>
                    <img src={formData.thumbnail.startsWith('data:') ? formData.thumbnail : `${BACKEND_URL}${formData.thumbnail}`} alt="Cover" className="w-full h-full object-cover" />
                    <div className="absolute top-2 left-2 bg-brand-blue text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm">Cover</div>
                    <button
                      type="button"
                      onClick={() => handleUpdate('thumbnail', '')}
                      className="absolute top-2 right-2 p-1.5 rounded-lg bg-rose-500 text-white opacity-0 group-hover:opacity-100 transition cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 cursor-pointer hover:bg-slate-100 transition relative">
                    <input type="file" accept="image/*" onChange={handleImageChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                    <Upload className="w-6 h-6 mb-2" />
                    <span className="text-[11px] font-bold">Add Cover</span>
                  </div>
                )}
              </div>

              {/* Extra Images Uploaded */}
              {formData.extraImages.map((src, idx) => (
                <div key={idx} className="aspect-square rounded-xl border border-slate-200 overflow-hidden relative group bg-slate-50">
                  <img src={src.startsWith('data:') ? src : `${BACKEND_URL}${src}`} alt={`Extra ${idx + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeExtraImage(idx)}
                    className="absolute top-2 right-2 p-1.5 rounded-lg bg-rose-500 text-white opacity-0 group-hover:opacity-100 transition cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}

              {/* Add Extra Image Slots */}
              {Array.from({ length: 3 - formData.extraImages.length }).map((_, i) => (
                <div key={i} className="aspect-square rounded-xl border border-dashed border-slate-300 bg-slate-50/50 flex flex-col items-center justify-center text-slate-400 cursor-pointer hover:bg-slate-50 hover:border-slate-400 transition relative">
                  <input type="file" accept="image/*" onChange={handleExtraImageChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                  <Plus className="w-6 h-6 mb-1" />
                  <span className="text-[11px] font-bold text-slate-500">Add Image</span>
                </div>
              ))}
            </div>
          </div>

          <div className="h-[1px] bg-slate-100 mb-8 w-full"></div>

          <div>
            <h3 className="text-[14px] font-bold text-slate-900 mb-4">Project Links</h3>
            <div className="grid md:grid-cols-2 gap-5">
              <div className="flex flex-col gap-2">
                <label className="text-[13px] font-bold text-slate-700 flex items-center gap-2"><LinkIcon className="w-4 h-4 text-slate-400" /> Live Demo URL</label>
                <input type="url" value={formData.demoUrl} onChange={e => handleUpdate('demoUrl', e.target.value)} placeholder="https://..." className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-[13px] text-slate-800 placeholder-slate-400 focus:outline-none focus:border-brand-blue transition" />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[13px] font-bold text-slate-700 flex items-center gap-2"><Github className="w-4 h-4 text-slate-400" /> Source Code (GitHub)</label>
                <input type="url" value={formData.githubUrl} onChange={e => handleUpdate('githubUrl', e.target.value)} placeholder="https://github.com/..." className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-[13px] text-slate-800 placeholder-slate-400 focus:outline-none focus:border-brand-blue transition" />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[13px] font-bold text-slate-700 flex items-center gap-2"><Youtube className="w-4 h-4 text-slate-400" /> YouTube Demo</label>
                <input type="url" value={formData.youtubeUrl} onChange={e => handleUpdate('youtubeUrl', e.target.value)} placeholder="https://youtube.com/..." className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-[13px] text-slate-800 placeholder-slate-400 focus:outline-none focus:border-brand-blue transition" />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[13px] font-bold text-slate-700 flex items-center gap-2"><FileText className="w-4 h-4 text-slate-400" /> Documentation</label>
                <input type="url" value={formData.docsUrl} onChange={e => handleUpdate('docsUrl', e.target.value)} placeholder="https://docs..." className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-[13px] text-slate-800 placeholder-slate-400 focus:outline-none focus:border-brand-blue transition" />
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Right Column */}
      <div className="flex flex-col gap-6">
        {renderProjectSummaryCard()}
      </div>
    </div>
  );

  // STEP 4 UI
  const renderStep4 = () => (
    <div className="grid lg:grid-cols-[1fr_320px] gap-8 max-w-6xl mx-auto w-full">
      <div className="flex flex-col gap-6">
        
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[20px] font-extrabold text-slate-900 font-display">Review Your Project</h2>
            <p className="text-[13px] font-medium text-slate-500 mt-1">Review all the details below before publishing your project.</p>
          </div>
          <button onClick={() => setStep(1)} className="flex items-center gap-2 text-[12px] font-bold text-brand-blue bg-blue-50/50 hover:bg-blue-50 px-4 py-2 rounded-lg border border-brand-blue transition"><Edit3 className="w-3.5 h-3.5" /> Edit</button>
        </div>

        {/* Basic Info Block */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="bg-slate-50/50 px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-[14px] font-bold text-slate-900 flex items-center gap-2"><Globe className="w-4 h-4 text-brand-blue" /> Basic Information</h3>
            <button onClick={() => setStep(1)} className="text-[12px] font-bold text-brand-blue hover:underline">Edit</button>
          </div>
          <div className="p-6 grid grid-cols-[120px_1fr] gap-y-4 gap-x-6 text-[13px]">
            <span className="font-bold text-slate-500">Project Name</span>
            <span className="font-bold text-slate-900">{formData.title || '-'}</span>
            
            <span className="font-bold text-slate-500">Short Description</span>
            <span className="font-medium text-slate-700">{formData.shortDesc || '-'}</span>
            
            <span className="font-bold text-slate-500">Category</span>
            <span className="font-bold text-slate-900 flex items-center gap-2">
              {CATEGORIES.find(c => c.id === formData.category)?.icon && React.createElement(CATEGORIES.find(c => c.id === formData.category).icon, { className: "w-4 h-4 text-emerald-500" })}
              {CATEGORIES.find(c => c.id === formData.category)?.name || '-'}
            </span>
            
            <span className="font-bold text-slate-500">Visibility</span>
            <span className="font-medium text-slate-700 flex flex-col">
              <span className="font-bold text-slate-900 flex items-center gap-1.5"><Globe className="w-3.5 h-3.5 text-slate-400" /> {formData.visibility}</span>
              <span className="text-[11px] text-slate-500 mt-0.5">{formData.visibility === 'Public' ? 'Anyone can view your project' : 'Restricted visibility'}</span>
            </span>
          </div>
        </div>

        {/* Technologies Block */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="bg-slate-50/50 px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-[14px] font-bold text-slate-900 flex items-center gap-2"><Cpu className="w-4 h-4 text-brand-blue" /> Technologies</h3>
            <button onClick={() => setStep(2)} className="text-[12px] font-bold text-brand-blue hover:underline">Edit</button>
          </div>
          <div className="p-6">
            <p className="text-[12px] font-bold text-slate-500 mb-3">Selected Technologies ({formData.technologies.length})</p>
            <div className="flex flex-wrap gap-3">
              {formData.technologies.map((t, i) => {
                const techObj = typeof t === 'string' ? { name: t, logo: null, type: 'Other' } : t;
                return (
                  <div key={i} className="flex items-center gap-3 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50">
                    {techObj.logo ? <img src={techObj.logo} alt="" className="w-4 h-4 object-contain" /> : <span className="text-[14px]">💻</span>}
                    <div className="flex flex-col">
                      <span className="text-[13px] font-bold text-slate-800 leading-tight">{techObj.name}</span>
                      <span className="text-[9px] font-bold text-slate-400 uppercase">{techObj.type}</span>
                    </div>
                  </div>
                );
              })}
              {formData.technologies.length === 0 && <span className="text-[13px] text-slate-400 italic">None selected</span>}
            </div>
          </div>
        </div>

        {/* Media Block */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="bg-slate-50/50 px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-[14px] font-bold text-slate-900 flex items-center gap-2"><ImageIcon className="w-4 h-4 text-brand-blue" /> Media</h3>
            <button onClick={() => setStep(3)} className="text-[12px] font-bold text-brand-blue hover:underline">Edit</button>
          </div>
          <div className="p-6 grid sm:grid-cols-2 gap-8">
            <div>
              <p className="text-[12px] font-bold text-slate-500 mb-3">Project Images ({formData.thumbnail ? 1 : 0} cover + {formData.extraImages.length} extra)</p>
              <div className="flex flex-wrap gap-2">
                {formData.thumbnail ? (
                  <div className="relative">
                    <img src={formData.thumbnail.startsWith('data:') ? formData.thumbnail : `${BACKEND_URL}${formData.thumbnail}`} alt="Cover" className="w-20 h-20 rounded-lg object-cover border border-slate-200" />
                    <span className="absolute bottom-1 left-1 bg-brand-blue text-white text-[8px] font-bold px-1 py-0.5 rounded shadow-sm">Cover</span>
                  </div>
                ) : (
                  <div className="w-20 h-20 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-center text-slate-400"><ImageIcon className="w-6 h-6" /></div>
                )}
                {formData.extraImages.map((src, idx) => (
                  <img key={idx} src={src.startsWith('data:') ? src : `${BACKEND_URL}${src}`} alt={`Extra ${idx + 1}`} className="w-20 h-20 rounded-lg object-cover border border-slate-200" />
                ))}
              </div>
            </div>
            <div>
              <p className="text-[12px] font-bold text-slate-500 mb-3">Links</p>
              <div className="flex flex-col gap-2.5 text-[12px]">
                {formData.demoUrl && <a href={formData.demoUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 font-bold text-slate-700 hover:text-brand-blue"><Globe className="w-4 h-4 text-slate-400" /> Live Demo</a>}
                {formData.githubUrl && <a href={formData.githubUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 font-bold text-slate-700 hover:text-brand-blue"><Github className="w-4 h-4 text-slate-400" /> Source Code</a>}
                {formData.youtubeUrl && <a href={formData.youtubeUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 font-bold text-slate-700 hover:text-brand-blue"><Youtube className="w-4 h-4 text-slate-400" /> YouTube Demo</a>}
                {formData.docsUrl && <a href={formData.docsUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 font-bold text-slate-700 hover:text-brand-blue"><FileText className="w-4 h-4 text-slate-400" /> Documentation</a>}
                {!formData.demoUrl && !formData.githubUrl && !formData.youtubeUrl && !formData.docsUrl && <span className="text-slate-400 italic">No links added</span>}
              </div>
            </div>
          </div>
        </div>

      </div>
      
      {/* Right Column */}
      <div className="flex flex-col gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden sticky top-8">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-[14px] font-bold text-slate-900">Project Preview</h3>
            <button className="text-[12px] font-bold text-brand-blue hover:underline">View Full</button>
          </div>
          <div className="p-5">
            <div className="w-full h-36 rounded-xl bg-green-50 border border-slate-200 mb-4 overflow-hidden">
              {formData.thumbnail ? (
                <img src={formData.thumbnail.startsWith('data:') ? formData.thumbnail : `${BACKEND_URL}${formData.thumbnail}`} alt="Cover" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-emerald-600/50">
                  <ImageIcon className="w-8 h-8 mb-2" />
                  <span className="text-[12px] font-bold">Cover Preview</span>
                </div>
              )}
            </div>
            <h4 className="text-[16px] font-extrabold text-slate-900 font-display mb-1">{formData.title || 'Project Name'}</h4>
            <p className="text-[12px] font-medium text-slate-500 mb-4 line-clamp-2">
              {formData.shortDesc || 'Mobile app to identify plants and get care tips.'}
            </p>
            <div className="flex flex-wrap gap-2 mb-6">
              {formData.technologies.slice(0, 4).map((t, i) => {
                const techObj = typeof t === 'string' ? { logo: null } : t;
                return <span key={i} className="w-6 h-6 rounded-md bg-white border border-slate-200 flex items-center justify-center overflow-hidden p-1">
                  {techObj.logo ? <img src={techObj.logo} alt="" className="w-full h-full object-contain" /> : <span className="text-[12px]">💻</span>}
                </span>;
              })}
            </div>

            <h5 className="text-[12px] font-bold text-slate-900 mb-3 border-b border-slate-100 pb-2">Project Summary</h5>
            <div className="flex flex-col gap-2.5 text-[12px]">
              <div className="flex justify-between"><span className="text-slate-500 font-medium">Technologies</span><span className="font-bold text-slate-700">{formData.technologies.length}</span></div>
              <div className="flex justify-between"><span className="text-slate-500 font-medium">Images</span><span className="font-bold text-slate-700">{formData.thumbnail ? 1 : 0}</span></div>
              <div className="flex justify-between"><span className="text-slate-500 font-medium">Links</span><span className="font-bold text-slate-700">{[formData.demoUrl, formData.githubUrl, formData.youtubeUrl, formData.docsUrl].filter(Boolean).length}</span></div>
              <div className="flex justify-between"><span className="text-slate-500 font-medium">Visibility</span><span className="font-bold text-slate-700">{formData.visibility}</span></div>
              <div className="flex justify-between"><span className="text-slate-500 font-medium">Category</span><span className="font-bold text-slate-700 truncate max-w-[120px] text-right">{CATEGORIES.find(c => c.id === formData.category)?.name || '-'}</span></div>
            </div>
          </div>
          
          <div className="p-5 border-t border-slate-100 bg-slate-50/50">
            <h5 className="text-[12px] font-bold text-slate-900 mb-3">Publishing Checklist</h5>
            <ul className="flex flex-col gap-2.5">
              <li className={`flex items-start gap-2 text-[12px] font-medium ${formData.title && formData.shortDesc ? 'text-emerald-600' : 'text-slate-400'}`}><CheckCircle2 className="w-4 h-4 shrink-0" /> Project details look good</li>
              <li className={`flex items-start gap-2 text-[12px] font-medium ${formData.technologies.length > 0 ? 'text-emerald-600' : 'text-slate-400'}`}><CheckCircle2 className="w-4 h-4 shrink-0" /> At least one technology selected</li>
              <li className={`flex items-start gap-2 text-[12px] font-medium ${formData.thumbnail ? 'text-emerald-600' : 'text-slate-400'}`}><CheckCircle2 className="w-4 h-4 shrink-0" /> Added project images</li>
              <li className={`flex items-start gap-2 text-[12px] font-medium ${[formData.demoUrl, formData.githubUrl, formData.youtubeUrl, formData.docsUrl].filter(Boolean).length > 0 ? 'text-emerald-600' : 'text-slate-400'}`}><CheckCircle2 className="w-4 h-4 shrink-0" /> Added at least one important link</li>
              <li className={`flex items-start gap-2 text-[12px] font-medium ${formData.category ? 'text-emerald-600' : 'text-slate-400'}`}><CheckCircle2 className="w-4 h-4 shrink-0" /> Project is in the right category</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );

  // Handle rendering loading state before actual UI
  if (fetchingData) {
    return (
      <div className="flex flex-col items-center justify-center py-32 bg-white min-h-screen">
        <div className="w-8 h-8 border-3 border-slate-200 border-t-brand-blue rounded-full animate-spin"></div>
        <span className="text-slate-400 text-[12px] font-bold mt-4">Loading project details...</span>
      </div>
    );
  }

  // Helper component for Icon
  function InfoIcon() {
    return <span className="w-4 h-4 inline-flex items-center justify-center rounded-full border border-slate-300 text-slate-400 text-[10px] font-serif cursor-help">i</span>;
  }

  const isProfileIncomplete = user?.role === 'student' && (!user?.department || !user?.university || !user?.graduationYear);

  if (isProfileIncomplete) {
    return (
      <div className="flex flex-col min-h-screen bg-slate-50/50">
        {/* Top Bar Nav (Blurred out) */}
        <div className="bg-white px-8 py-6 border-b border-slate-200 sticky top-0 z-20 flex flex-col items-start gap-4 shadow-sm blur-sm pointer-events-none">
          <div className="flex items-center gap-2 text-[12px] font-bold text-slate-500">
            <ArrowLeft className="w-4 h-4" /> Back to My Projects
          </div>
          <div>
            <h1 className="text-[26px] font-extrabold text-slate-900 font-display leading-tight">{isEditMode ? 'Edit Project' : 'Create Project'}</h1>
            <p className="text-[14px] font-medium text-slate-500">Share your amazing project with the community</p>
          </div>
        </div>

        {/* Modal Overlay */}
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 flex flex-col items-center text-center animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mb-5">
              <Shield className="w-8 h-8 text-rose-500" />
            </div>
            <h2 className="text-[22px] font-extrabold text-slate-900 font-display mb-3">Complete Profile Required</h2>
            <p className="text-[14px] font-medium text-slate-500 mb-8 leading-relaxed">
              To ensure projects are correctly routed to your lecturers for approval, you must specify your University, Department, and Graduation Year in your profile settings before publishing a project.
            </p>
            <div className="flex flex-col w-full gap-3">
              <Link to="/settings" className="w-full py-3 rounded-xl bg-brand-blue hover:bg-brand-blue-hover text-white font-bold transition shadow-sm flex justify-center">
                Go to Profile Settings
              </Link>
              <button onClick={() => navigate(-1)} className="w-full py-3 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold transition shadow-sm cursor-pointer">
                Go Back
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50/50 pb-24">
      
      {/* Top Bar Nav */}
      <div className="bg-white px-8 py-6 border-b border-slate-200 sticky top-0 z-20 flex flex-col items-start gap-4 shadow-sm">
        <Link to="/dashboard" className="flex items-center gap-2 text-[12px] font-bold text-slate-500 hover:text-brand-blue transition">
          <ArrowLeft className="w-4 h-4" /> Back to My Projects
        </Link>
        <div>
          <h1 className="text-[26px] font-extrabold text-slate-900 font-display leading-tight">{isEditMode ? 'Edit Project' : 'Create Project'}</h1>
          <p className="text-[14px] font-medium text-slate-500">Share your amazing project with the community</p>
        </div>
      </div>

      <div className="px-8 py-8">
        {renderStepHeader()}

        {/* Form Body Rendering */}
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
        {step === 4 && renderStep4()}
      </div>

      {/* Fixed Footer Bar */}
      <div className={`fixed bottom-0 right-0 ${isSidebarOpen ? 'left-[260px]' : 'left-0'} bg-white border-t border-slate-200 p-4 px-8 z-30 shadow-[0_-4px_20px_rgba(0,0,0,0.03)] flex items-center justify-between transition-all`}>
        <button 
          onClick={handleSubmit} 
          disabled={loading}
          className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-[13px] font-bold hover:bg-slate-50 transition cursor-pointer"
        >
          Save as Draft
        </button>

        <div className="flex items-center gap-4">
          {step > 1 ? (
            <button onClick={prevStep} className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-[13px] font-bold hover:bg-slate-50 transition cursor-pointer">
              <ArrowLeft className="w-4 h-4" /> Previous
            </button>
          ) : (
            <button onClick={() => navigate(-1)} className="px-5 py-2.5 text-[13px] font-bold text-slate-500 hover:text-slate-800 transition cursor-pointer">
              Cancel
            </button>
          )}

          {step < 4 ? (
            <button onClick={nextStep} className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-brand-blue hover:bg-blue-700 text-white text-[13px] font-bold transition shadow-sm cursor-pointer">
              Next: {step === 1 ? 'Technologies' : step === 2 ? 'Media & Links' : 'Review & Publish'} <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={loading} className="flex items-center gap-2 px-8 py-2.5 rounded-xl bg-brand-blue hover:bg-blue-700 text-white text-[13px] font-bold transition shadow-sm cursor-pointer disabled:opacity-50">
              <Upload className="w-4 h-4" /> {loading ? 'Publishing...' : 'Publish Project'}
            </button>
          )}
        </div>
      </div>
      
    </div>
  );
}
