import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import Sidebar from './components/layout/Sidebar';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Upload from './pages/Upload';
import Analysis from './pages/Analysis';
import Profile from './pages/Profile';
import PatientProfiles from './pages/PatientProfiles';
import Comparison from './pages/Comparison';
import History from './pages/History';
import KnowledgeHub from './pages/KnowledgeHub';
import Settings from './pages/Settings';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { ProfileProvider } from './context/ProfileContext';

const DashboardLayout = ({ children }) => (
  <div className="flex bg-slate-50 min-h-[calc(100vh-4rem)]">
    <div className="hidden md:block">
      <Sidebar />
    </div>
    <main className="flex-1 p-4 md:p-8 overflow-y-auto min-w-0">
      {children}
    </main>
  </div>
);

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);
  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  return <DashboardLayout>{children}</DashboardLayout>;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <ProfileProvider>
          <div className="min-h-screen bg-slate-50 flex flex-col font-inter">
            <Navbar />
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/upload" element={<ProtectedRoute><Upload /></ProtectedRoute>} />
              <Route path="/analysis/:id" element={<ProtectedRoute><Analysis /></ProtectedRoute>} />
              <Route path="/comparison" element={<ProtectedRoute><Comparison /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              <Route path="/profiles" element={<ProtectedRoute><PatientProfiles /></ProtectedRoute>} />
              <Route path="/knowledge" element={<ProtectedRoute><KnowledgeHub /></ProtectedRoute>} />
              <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            </Routes>
          </div>
        </ProfileProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
