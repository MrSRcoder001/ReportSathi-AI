import React, { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Activity, LogOut, Menu, X } from 'lucide-react';
import { Button } from '../ui/button';
import { AuthContext } from '../../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setMobileMenuOpen(false);
    navigate('/');
  };

  const closeMenu = () => setMobileMenuOpen(false);

  return (
    <nav className="border-b glassmorphism sticky top-0 z-50 bg-white/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link to={user ? "/dashboard" : "/"} className="flex items-center gap-2" onClick={closeMenu}>
            <div className="bg-primary p-2 rounded-lg">
              <Activity className="h-6 w-6 text-white" />
            </div>
            <span className="font-bold text-xl text-slate-900 tracking-tight">MediExplain <span className="text-primary">AI</span></span>
          </Link>
          
          <div className="flex gap-4 items-center">
            {user ? (
              <>
                <div className="hidden md:flex items-center gap-6 mr-4">
                  <Link to="/dashboard" className="text-sm font-medium text-slate-600 hover:text-primary transition-colors">Dashboard</Link>
                  <Link to="/profiles" className="text-sm font-medium text-slate-600 hover:text-primary transition-colors">Profiles</Link>
                  <Link to="/comparison" className="text-sm font-medium text-slate-600 hover:text-primary transition-colors">Compare</Link>
                </div>
                <span className="text-sm font-medium text-slate-600 hidden lg:block border-l pl-4 border-slate-200">
                  {user.name}
                </span>
                <Button variant="ghost" onClick={handleLogout} className="text-slate-600 hover:text-red-600 gap-2 hidden md:flex">
                  <LogOut className="h-4 w-4" /> Logout
                </Button>
                
                {/* Mobile Menu Toggle */}
                <button 
                  className="md:hidden p-2 text-slate-600 hover:text-primary"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                >
                  {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="hidden sm:block">
                  <Button variant="ghost">Login</Button>
                </Link>
                <Link to="/register">
                  <Button>Get Started</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && user && (
        <div className="md:hidden bg-white border-b shadow-lg absolute w-full left-0 top-16 flex flex-col p-4 space-y-4 z-40">
          <div className="flex items-center justify-between px-2 pb-2 border-b text-slate-500 text-sm">
            <span>Signed in as</span>
            <span className="font-semibold text-slate-900">{user.name}</span>
          </div>
          <Link to="/dashboard" onClick={closeMenu} className="px-2 py-2 text-slate-600 hover:text-primary font-medium">Dashboard</Link>
          <Link to="/upload" onClick={closeMenu} className="px-2 py-2 text-slate-600 hover:text-primary font-medium">Upload Report</Link>
          <Link to="/knowledge" onClick={closeMenu} className="px-2 py-2 text-slate-600 hover:text-primary font-medium">Knowledge Hub</Link>
          <Link to="/profiles" onClick={closeMenu} className="px-2 py-2 text-slate-600 hover:text-primary font-medium">Profiles</Link>
          <Link to="/comparison" onClick={closeMenu} className="px-2 py-2 text-slate-600 hover:text-primary font-medium">Compare</Link>
          <Link to="/history" onClick={closeMenu} className="px-2 py-2 text-slate-600 hover:text-primary font-medium">History</Link>
          <Link to="/settings" onClick={closeMenu} className="px-2 py-2 text-slate-600 hover:text-primary font-medium">Settings</Link>
          <Button variant="ghost" onClick={handleLogout} className="text-slate-600 hover:text-red-600 justify-start px-2 mt-2">
            <LogOut className="h-4 w-4 mr-2" /> Logout
          </Button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
