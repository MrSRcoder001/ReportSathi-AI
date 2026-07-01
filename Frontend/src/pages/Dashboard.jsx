import React, { useEffect, useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { FileText, Clock, AlertTriangle, HeartPulse, User, Plus, CheckCircle, Lightbulb, Stethoscope } from 'lucide-react';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { ProfileContext } from '../context/ProfileContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const { profiles, activeProfile, changeActiveProfile, loading: profileLoading } = useContext(ProfileContext);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [trends, setTrends] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      if (!activeProfile) {
        setReports([]);
        setTrends([]);
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const [reportsRes, trendsRes] = await Promise.all([
          api.get(`/reports?profileId=${activeProfile._id}`),
          api.get(`/profiles/${activeProfile._id}/trends`)
        ]);
        setReports(reportsRes.data);
        setTrends(trendsRes.data);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [activeProfile]);

  const pendingCount = reports.filter(r => r.status === 'pending' || r.status === 'processing').length;
  const completedCount = reports.filter(r => r.status === 'completed').length;

  // Prepare data for the health trend chart
  const trendData = [...reports].reverse().filter(r => r.healthScore !== undefined).map(r => ({
    name: new Date(r.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    score: r.healthScore
  }));

  if (profileLoading) return <div className="p-8 text-center text-slate-500">Loading profiles...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Welcome, {user?.name || 'User'}</h1>
        <Link to="/upload" className="w-full sm:w-auto">
          <Button className="w-full sm:w-auto">Upload New Report</Button>
        </Link>
      </div>

      {/* Profile Switcher */}
      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
        {profiles.map(p => (
          <button
            key={p._id}
            onClick={() => changeActiveProfile(p._id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all whitespace-nowrap ${activeProfile?._id === p._id ? 'bg-primary text-white border-primary shadow-md' : 'bg-white text-slate-600 border-slate-200 hover:border-primary/50'}`}
          >
            <User className="h-4 w-4" />
            {p.profileName}
          </button>
        ))}
        <Link to="/profiles" className="shrink-0">
          <button className="flex items-center gap-2 px-4 py-2 rounded-full border border-dashed border-slate-300 text-slate-500 hover:text-primary hover:border-primary transition-colors whitespace-nowrap bg-slate-50">
            <Plus className="h-4 w-4" /> Add Profile
          </button>
        </Link>
      </div>

      {!activeProfile ? (
        <Card className="border-2 border-dashed bg-amber-50">
          <CardContent className="p-8 sm:p-12 text-center flex flex-col items-center gap-4">
            <User className="h-12 w-12 text-amber-500" />
            <h2 className="text-xl font-bold text-amber-800">No Patient Profile Selected</h2>
            <p className="text-amber-700">You need to create a patient profile to start uploading and analyzing reports.</p>
            <Link to="/profiles">
              <Button>Create Profile Now</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Reports" value={reports.length} icon={FileText} color="text-blue-600" bg="bg-blue-100" />
        <StatCard title="Average Health Score" value={
          reports.length > 0 
            ? Math.round(reports.reduce((acc, r) => acc + (r.healthScore || 0), 0) / reports.length) + '/100' 
            : '--'
        } icon={HeartPulse} color="text-green-600" bg="bg-green-100" />
        <StatCard title="Abnormal Findings" value={
          reports.reduce((acc, r) => {
            if (!r.parameters) return acc;
            return acc + r.parameters.filter(p => p.status === 'LOW' || p.status === 'HIGH').length;
          }, 0)
        } icon={AlertTriangle} color="text-red-600" bg="bg-red-100" />
        <StatCard title="Pending Analysis" value={pendingCount} icon={Clock} color="text-amber-600" bg="bg-amber-100" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Health Score Trend</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
              {trendData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                    <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Line type="monotone" dataKey="score" stroke="#2563eb" strokeWidth={3} dot={{r: 4, fill: '#2563eb', strokeWidth: 2, stroke: '#fff'}} activeDot={{r: 6}} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400">
                  Not enough data for a health trend.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Recent Reports</CardTitle>
            </CardHeader>
            <div className="divide-y max-h-[300px] overflow-y-auto">
          {loading ? (
            <div className="p-8 text-center text-slate-500">Loading reports...</div>
          ) : reports.length === 0 ? (
            <div className="p-8 text-center text-slate-500">No reports found. Upload your first one!</div>
          ) : (
            reports.map((report) => (
              <div key={report._id} className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3 min-w-0 w-full sm:w-auto">
                  <div className="bg-slate-100 p-2 sm:p-3 rounded-lg shrink-0">
                    <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-slate-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-slate-900 truncate">{report.reportName}</p>
                    <p className="text-xs sm:text-sm text-slate-500 truncate">
                      {new Date(report.createdAt).toLocaleDateString()} • <span className="capitalize">{report.status}</span>
                    </p>
                  </div>
                </div>
                <Link to={`/analysis/${report._id}`} className="w-full sm:w-auto">
                  <Button variant="outline" size="sm" className="w-full sm:w-auto">View</Button>
                </Link>
              </div>
            ))
          )}
            </div>
          </Card>
        </div>
      </div>

      {/* AI Recommendation Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        <div className="lg:col-span-1">
          <Card className="h-full bg-blue-50/50 border-blue-100">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-700">
                <Lightbulb className="h-5 w-5" /> Today's Health Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              {reports[0]?.lifestyleGuidance?.length > 0 ? (
                <ul className="space-y-3">
                  {reports[0].lifestyleGuidance.map((item, i) => (
                    <li key={i} className="flex gap-2 text-sm text-slate-700">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-slate-500">Upload a report to see your personalized AI health insights here.</p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <Card className="h-full bg-emerald-50/50 border-emerald-100">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-emerald-700">
                <CheckCircle className="h-5 w-5" /> Action Plan
              </CardTitle>
            </CardHeader>
            <CardContent>
              {reports[0]?.actionPlan?.length > 0 ? (
                <div className="space-y-3">
                  {reports[0].actionPlan.map((step, i) => (
                    <div key={i} className="flex items-start gap-3 bg-white p-3 rounded-lg border border-emerald-100 shadow-sm">
                      <div className="bg-emerald-100 text-emerald-700 w-6 h-6 rounded flex items-center justify-center shrink-0 font-bold text-xs">{i+1}</div>
                      <p className="text-sm text-slate-700">{step}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500">Your actionable next steps will appear here after a report analysis.</p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <Card className="h-full bg-amber-50/50 border-amber-100">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-700">
                <Stethoscope className="h-5 w-5" /> AI Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              {reports[0]?.doctorQuestions?.length > 0 ? (
                <div className="space-y-4">
                  <div>
                    <h4 className="text-xs font-bold text-amber-800 uppercase mb-2">Questions for your doctor:</h4>
                    <ul className="space-y-2">
                      {reports[0].doctorQuestions.map((q, i) => (
                        <li key={i} className="text-sm text-slate-700 italic border-l-2 border-amber-300 pl-3">"{q}"</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-500">AI-generated questions for your doctor will appear here.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
        </>
      )}
    </div>
  );
};

const StatCard = ({ title, value, icon: Icon, color, bg }) => (
  <Card className="border-none shadow-md">
    <CardContent className="p-6 flex items-center gap-4">
      <div className={`${bg} p-4 rounded-xl shrink-0`}>
        <Icon className={`h-8 w-8 ${color}`} />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-500 truncate">{title}</p>
        <p className="text-2xl sm:text-3xl font-bold text-slate-900 truncate">{value}</p>
      </div>
    </CardContent>
  </Card>
);

export default Dashboard;
