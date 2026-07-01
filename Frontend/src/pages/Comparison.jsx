import React, { useState, useEffect, useContext } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Activity, ArrowRight, ArrowUpRight, ArrowDownRight, User } from 'lucide-react';
import api from '../services/api';
import { ProfileContext } from '../context/ProfileContext';

const Comparison = () => {
  const { activeProfile } = useContext(ProfileContext);
  const [reports, setReports] = useState([]);
  const [selectedReport1, setSelectedReport1] = useState('');
  const [selectedReport2, setSelectedReport2] = useState('');
  const [comparisonData, setComparisonData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (activeProfile) {
      fetchReports();
    }
  }, [activeProfile]);

  const fetchReports = async () => {
    try {
      const { data } = await api.get(`/reports?profileId=${activeProfile._id}`);
      const completed = data.filter(r => r.status === 'completed');
      setReports(completed);
      if (completed.length >= 2) {
        setSelectedReport1(completed[1]._id); // Older
        setSelectedReport2(completed[0]._id); // Newer
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCompare = async () => {
    if (!selectedReport1 || !selectedReport2 || selectedReport1 === selectedReport2) {
      setError('Please select two different reports to compare.');
      return;
    }
    
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get(`/comparison/${selectedReport1}/${selectedReport2}`);
      setComparisonData(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Comparison failed');
    } finally {
      setLoading(false);
    }
  };

  if (!activeProfile) {
    return <div className="text-center p-8">Please select a Patient Profile first.</div>;
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Health Comparison</h1>
          <p className="text-slate-500">Compare reports for {activeProfile.profileName}</p>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1">
              <label className="text-sm font-medium text-slate-700 block mb-2">Older Report</label>
              <select value={selectedReport1} onChange={e => setSelectedReport1(e.target.value)} className="w-full p-2 border rounded">
                <option value="">Select Report</option>
                {reports.map(r => (
                  <option key={r._id} value={r._id}>{r.reportName} - {new Date(r.createdAt).toLocaleDateString()}</option>
                ))}
              </select>
            </div>
            <div className="text-slate-400 pb-2 hidden md:block">
              <ArrowRight className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium text-slate-700 block mb-2">Newer Report</label>
              <select value={selectedReport2} onChange={e => setSelectedReport2(e.target.value)} className="w-full p-2 border rounded">
                <option value="">Select Report</option>
                {reports.map(r => (
                  <option key={r._id} value={r._id}>{r.reportName} - {new Date(r.createdAt).toLocaleDateString()}</option>
                ))}
              </select>
            </div>
            <Button onClick={handleCompare} disabled={loading} className="w-full md:w-auto">
              {loading ? 'Comparing...' : 'Compare'}
            </Button>
          </div>
          {error && <p className="text-red-500 text-sm mt-4">{error}</p>}
        </CardContent>
      </Card>

      {comparisonData && (
        <div className="space-y-6">
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary">
                <Activity className="h-5 w-5" /> AI Clinical Insight
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-700 leading-relaxed">{comparisonData.aiInsight}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Parameter Changes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b text-slate-500">
                      <th className="pb-3 font-medium">Parameter</th>
                      <th className="pb-3 font-medium">Previous</th>
                      <th className="pb-3 font-medium">Current</th>
                      <th className="pb-3 font-medium">Change</th>
                      <th className="pb-3 font-medium">Status Shift</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {comparisonData.diffData.map((diff, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="py-4 font-medium">{diff.parameter}</td>
                        <td className="py-4 text-slate-500">{diff.previousValue}</td>
                        <td className="py-4 font-semibold">{diff.currentValue}</td>
                        <td className="py-4">
                          <span className={`flex items-center gap-1 ${parseFloat(diff.percentageChange) > 0 ? 'text-amber-600' : 'text-success'}`}>
                            {parseFloat(diff.percentageChange) > 0 ? <ArrowUpRight className="h-4 w-4"/> : <ArrowDownRight className="h-4 w-4"/>}
                            {Math.abs(parseFloat(diff.percentageChange))}%
                          </span>
                        </td>
                        <td className="py-4">
                          {diff.statusChange ? (
                            <span className={`px-2 py-1 rounded text-xs font-bold ${diff.statusChange.includes('NORMAL') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                              {diff.statusChange}
                            </span>
                          ) : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Comparison;
