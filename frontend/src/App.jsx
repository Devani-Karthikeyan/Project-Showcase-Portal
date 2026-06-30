import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { BookmarkProvider } from './context/BookmarkContext';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';

// Pages
import Explore from './pages/Explore';
import Login from './pages/Login';
import ProjectDetails from './pages/ProjectDetails';
import ProjectForm from './pages/ProjectForm';
import Settings from './pages/Settings';
import Notifications from './pages/Notifications';
import Following from './pages/Following';


// Secure Route Gate for logged in users
function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 bg-behance-gray-bg">
        <div className="w-10 h-10 border-4 border-slate-200 border-t-brand-blue rounded-full animate-spin"></div>
        <span className="text-slate-400 text-xs mt-4">Validating session...</span>
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function MainAppLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);

  return (
    <BookmarkProvider>
      <div className="min-h-screen bg-behance-gray-bg flex flex-col relative pt-[76px]">
        {/* Top Header */}
      <Navbar isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />

      {/* Side-by-side Layout Container */}
      <div className="flex flex-1">
        {/* Left Navigation Panel */}
        <Sidebar isSidebarOpen={isSidebarOpen} />

        {/* Right Main Panel */}
        <main className={`flex-1 w-full overflow-x-hidden bg-slate-50 transition-all ${isSidebarOpen ? 'ml-[260px]' : 'ml-0'}`}>
          <Routes>
            <Route path="/explore" element={<Explore isSidebarOpen={isSidebarOpen} />} />
            <Route path="/projects/:id" element={<ProjectDetails />} />
              
              {/* Protected Routes */}
              <Route
                path="/submit-project"
                element={
                  <ProtectedRoute>
                    <ProjectForm isSidebarOpen={isSidebarOpen} />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/projects/:id/edit"
                element={
                  <ProtectedRoute>
                    <ProjectForm isSidebarOpen={isSidebarOpen} />
                  </ProtectedRoute>
                }
              />
               <Route
                path="/notifications"
                element={
                  <ProtectedRoute>
                    <Notifications />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/following"
                element={
                  <ProtectedRoute>
                    <Following />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings"
                element={
                  <ProtectedRoute>
                    <Settings />
                  </ProtectedRoute>
                }
              />

              {/* Fallback Catch */}
              <Route path="*" element={<Navigate to="/explore" replace />} />
            </Routes>
          </main>
        </div>
      </div>
    </BookmarkProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <Router>
          <Routes>
            
            {/* The rest of the app */}
            <Route path="/*" element={<MainAppLayout />} />
          </Routes>
        </Router>
      </NotificationProvider>
    </AuthProvider>
  );
}