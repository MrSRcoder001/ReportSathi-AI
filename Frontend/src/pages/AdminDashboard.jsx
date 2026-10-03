import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { 
  Users, FileText, AlertTriangle, ShieldCheck, 
  Terminal, ShieldAlert, CheckCircle2, Loader2, RefreshCw
} from 'lucide-react';
import api from '../services/api';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, PieChart, Pie } from 'recharts';

const AdminDashboard = () => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      setError('');
      const { data } = await api.get('/admin/metrics');
      setMetrics(data);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to fetch admin metrics. You must be an administrator.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-slate-500 font-medium">Fetching administrative telemetry...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto p-8 text-center space-y-4">
        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto animate-bounce" />
        <h2 className="text-xl font-bold text-slate-900">Access Restricted</h2>
        <p className="text-slate-500">{error}</p>
        <Button onClick={() => window.location.href = '/dashboard'}>Return to User Dashboard</Button>
      </div>
    );
  }

  // Formatting chart data
  const statusData = metrics?.statusDistribution?.map(item => ({
    name: item._id.toUpperCase(),
    value: item.count
  })) || [];

  const ocrData = metrics?.ocrQualityDistribution?.map(item => ({
    name: item._id || 'Unknown',
    value: item.count
  })) || [];

  const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#64748b'];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">System Telemetry</h1>
          <p className="text-slate-500">Global API usage, OCR fidelity metrics, and audit logs.</p>
        </div>
        <Button onClick={fetchMetrics} className="gap-1.5" variant="outline">
          <RefreshCw className="h-4 w-4" /> Refresh
        </Button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard title="Total Accounts" value={metrics?.summary.users} icon={Users} color="text-blue-600" bg="bg-blue-50" />
        <KpiCard title="Reports Uploaded" value={metrics?.summary.reports} icon={FileText} color="text-indigo-600" bg="bg-indigo-50" />
        <KpiCard title="Avg AI Confidence" value={`${metrics?.summary.averageConfidence ?? 90}%`} icon={ShieldCheck} color="text-emerald-600" bg="bg-emerald-50" />
        <KpiCard title="Local Ollama Savings" value={`$${metrics?.apiUsage.costSaved}`} icon={Terminal} color="text-amber-600" bg="bg-amber-50" />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base text-slate-800">Job Status Distribution</CardTitle>
          </CardHeader>
          <CardContent className="h-[250px] flex items-center justify-center">
            {statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statusData}>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                  <Tooltip cursor={{ fill: 'rgba(0, 0, 0, 0.03)' }} />
                  <Bar dataKey="value" fill="#2563eb" radius={[4, 4, 0, 0]}>
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <span className="text-slate-400 text-sm">No status metrics available</span>
            )}
          </CardContent>
        </Card>

        {/* OCR Scan Quality */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base text-slate-800">OCR Scan Quality breakdown</CardTitle>
          </CardHeader>
          <CardContent className="h-[250px] flex items-center justify-center">
            {ocrData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={ocrData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {ocrData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <span className="text-slate-400 text-sm">No OCR metrics available</span>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Flagged Scan Failures */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base text-slate-800 flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-red-500" />
            Flagged OCR / Parsing Failures (Low Scan Quality)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {metrics?.flaggedFailures.length === 0 ? (
            <div className="text-center py-6 text-slate-400 text-sm">
              No low-quality scans flagged. System performing nominally.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600 border-collapse">
                <thead className="bg-slate-50 text-slate-700 text-xs font-semibold uppercase border-b">
                  <tr>
                    <th className="p-3">User</th>
                    <th className="p-3">File Name</th>
                    <th className="p-3">OCR Quality</th>
                    <th className="p-3">Upload Date</th>
                    <th className="p-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-xs">
                  {metrics?.flaggedFailures.map((rep) => (
                    <tr key={rep._id} className="hover:bg-slate-50/50">
                      <td className="p-3">
                        <span className="font-bold block text-slate-800">{rep.userId?.name}</span>
                        <span className="text-[10px] text-slate-400">{rep.userId?.email}</span>
                      </td>
                      <td className="p-3 font-semibold text-slate-700">{rep.reportName}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-full font-bold ${rep.confidenceMetrics?.ocrQuality === 'Low' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                          {rep.confidenceMetrics?.ocrQuality}
                        </span>
                      </td>
                      <td className="p-3 text-slate-400">{new Date(rep.createdAt).toLocaleDateString()}</td>
                      <td className="p-3 text-center">
                        <span className="capitalize px-2 py-0.5 rounded bg-slate-100 font-medium text-slate-600">{rep.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Security Consent Audit Log */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base text-slate-800 flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            Consent-Managed Access Audit Trail
          </CardTitle>
        </CardHeader>
        <CardContent>
          {metrics?.auditLogs.length === 0 ? (
            <div className="text-center py-6 text-slate-400 text-sm">
              No audit logs captured.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600 border-collapse">
                <thead className="bg-slate-50 text-slate-700 text-xs font-semibold uppercase border-b">
                  <tr>
                    <th className="p-3">Timestamp</th>
                    <th className="p-3">Account</th>
                    <th className="p-3">Consent Event</th>
                    <th className="p-3">Resource Type</th>
                    <th className="p-3">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-xs font-mono">
                  {metrics?.auditLogs.map((log) => (
                    <tr key={log._id} className="hover:bg-slate-50/50">
                      <td className="p-3 text-slate-400">{new Date(log.createdAt).toLocaleString()}</td>
                      <td className="p-3 text-slate-800 font-sans font-semibold">{log.userId?.email || 'System'}</td>
                      <td className="p-3"><span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-bold">{log.action}</span></td>
                      <td className="p-3 text-slate-500 font-sans">{log.resourceType}</td>
                      <td className="p-3 text-slate-500 font-sans">{log.details}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

const KpiCard = ({ title, value, icon: Icon, color, bg }) => (
  <Card className="border-slate-200">
    <CardContent className="p-6 flex items-center gap-4">
      <div className={`${bg} p-4 rounded-xl shrink-0`}>
        <Icon className={`h-6 w-6 ${color}`} />
      </div>
      <div>
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{title}</p>
        <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
      </div>
    </CardContent>
  </Card>
);

export default AdminDashboard;
