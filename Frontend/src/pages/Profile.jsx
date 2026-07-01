import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { User, Mail, Calendar, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Profile = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold text-slate-900">User Profile</h1>

      <Card className="shadow-md border-none">
        <CardHeader className="bg-slate-50/50 border-b pb-6 pt-6">
          <CardTitle className="text-xl flex items-center gap-3">
            <div className="bg-primary/10 p-3 rounded-full">
              <User className="h-6 w-6 text-primary" />
            </div>
            Personal Information
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <p className="text-sm font-medium text-slate-500 flex items-center gap-2">
                <User className="h-4 w-4" /> Full Name
              </p>
              <p className="text-lg font-medium text-slate-900">{user?.name || 'N/A'}</p>
            </div>
            
            <div className="space-y-1">
              <p className="text-sm font-medium text-slate-500 flex items-center gap-2">
                <Mail className="h-4 w-4" /> Email Address
              </p>
              <p className="text-lg font-medium text-slate-900">{user?.email || 'N/A'}</p>
            </div>

            <div className="space-y-1">
              <p className="text-sm font-medium text-slate-500 flex items-center gap-2">
                <Calendar className="h-4 w-4" /> Member Since
              </p>
              <p className="text-lg font-medium text-slate-900">
                {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
              </p>
            </div>
          </div>

          <div className="pt-6 border-t">
            <Button variant="outline" className="text-danger border-danger/30 hover:bg-danger/10 gap-2" onClick={handleLogout}>
              <LogOut className="h-4 w-4" /> Sign Out
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Profile;
