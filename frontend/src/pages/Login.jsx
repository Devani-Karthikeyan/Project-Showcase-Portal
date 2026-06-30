import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, BACKEND_URL } from '../context/AuthContext';
import { X } from 'lucide-react';

export default function Login() {
  const { loginWithGoogleOAuth } = useAuth();
  const navigate = useNavigate();

  const [clientId, setClientId] = useState('336110271991-cmeqben5o90fo0ff3dh4gd0uajcsv49s.apps.googleusercontent.com');
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/auth/config`);
        if (res.ok) {
          const data = await res.json();
          if (data.clientId) {
            setClientId(data.clientId);
          }
        }
      } catch (err) {
        console.error('Failed to load Google Client Config:', err);
      }
    };
    fetchConfig();
  }, []);

  useEffect(() => {
    if (!clientId) return;

    if (window.google?.accounts?.id) {
      try {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: async (response) => {
            try {
              await loginWithGoogleOAuth(response.credential, false);
              navigate('/');
            } catch (err) {
              console.error('Google OAuth Login failed:', err);
              setError(err.message || 'Login failed');
            }
          }
        });

        setTimeout(() => {
          const btnDiv = document.getElementById('googleSignInDiv');
          if (btnDiv) {
            window.google.accounts.id.renderButton(
              btnDiv,
              { theme: 'outline', size: 'large', width: '380', text: 'continue_with' }
            );
          }
        }, 100);
      } catch (err) {
        console.error('Failed to initialize Google GSI:', err);
      }
    }
  }, [clientId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/45 backdrop-blur-[3px] animate-fade-in">
      {/* Center Modal Card */}
      <div className="bg-white rounded-xl shadow-[0_24px_50px_-12px_rgba(0,0,0,0.15)] w-full max-w-[480px] flex flex-col border border-slate-200 overflow-hidden relative z-10 p-10 pt-12 pb-10 font-sans">
        
        <button 
          onClick={() => navigate('/')}
          className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-650 hover:bg-slate-50 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Block */}
        <div className="flex flex-col text-left w-full mb-8">
          <h2 className="text-[28px] font-bold text-slate-900 tracking-tight leading-tight">
            Welcome back!<br/>
            Login to your account
          </h2>
          <p className="text-[14px] text-slate-600 mt-3">
            It's nice to see you again. Ready to showcase?
          </p>
        </div>

        {error && (
          <div className="p-3 mb-5 rounded bg-rose-50 border border-rose-100 text-rose-600 text-sm flex items-center gap-2">
            {error}
          </div>
        )}

        <div className="w-full flex justify-center mb-4 mt-2">
          <div id="googleSignInDiv"></div>
        </div>

        <div className="text-center mt-8 pt-6 border-t border-slate-100">
          <p className="text-[14px] text-slate-600">
            Don't have an account?{' '}
            <button 
              onClick={() => navigate('/?register=true')} 
              className="text-blue-600 hover:underline font-medium bg-transparent border-none cursor-pointer p-0"
            >
              Sign up
            </button>
          </p>
        </div>

      </div>
    </div>
  );
}
