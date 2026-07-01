import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { FileText, Clock, AlertTriangle, CheckCircle2 } from 'lucide-react';
import api from '../services/api';

const History = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const { data } = await api.get('/reports');
        setReports(data);
      } catch (error) {
        console.error('Error fetching reports:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, []);

  const getStatusIcon = (status) => {
    switch(status) {
      case 'completed': return <CheckCircle2 className="h-5 w-5 text-success" />;
      case 'pending':
      case 'processing': return <Clock className="h-5 w-5 text-warning" />;
      case 'failed': return <AlertTriangle className="h-5 w-5 text-danger" />;
      default: return <FileText className="h-5 w-5 text-slate-500" />;
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-slate-900">Report History</h1>
        <Link to="/upload">
          <Button>Upload New Report</Button>
        </Link>
      </div>

      <Card>
        <div className="divide-y">
          {loading ? (
            <div className="p-8 text-center text-slate-500">Loading your history...</div>
          ) : reports.length === 0 ? (
            <div className="p-12 text-center text-slate-500 flex flex-col items-center gap-4">
              <FileText className="h-12 w-12 text-slate-300" />
              <p>You haven't uploaded any reports yet.</p>
              <Link to="/upload"><Button variant="outline">Upload First Report</Button></Link>
            </div>
          ) : (
            reports.map((report) => (
              <div key={report._id} className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center hover:bg-slate-50 transition-colors gap-4">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-lg bg-slate-100`}>
                    {getStatusIcon(report.status)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 text-lg">{report.reportName}</h3>
                    <p className="text-sm text-slate-500 mt-1">
                      Analyzed on {new Date(report.createdAt).toLocaleDateString()} at {new Date(report.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize border
                    ${report.status === 'completed' ? 'bg-green-50 text-green-700 border-green-200' : 
                      report.status === 'failed' ? 'bg-red-50 text-red-700 border-red-200' : 
                      'bg-amber-50 text-amber-700 border-amber-200'}`}>
                    {report.status}
                  </span>
                  <Link to={`/analysis/${report._id}`}>
                    <Button variant="outline" size="sm">View Analysis</Button>
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
};

export default History;
