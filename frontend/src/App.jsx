import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { BookmarkProvider } from './context/BookmarkContext';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';

// Pages
import Explore from './pages/Explore';
import ProjectDetails from './pages/ProjectDetails';
import ProjectForm from './pages/ProjectForm';

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