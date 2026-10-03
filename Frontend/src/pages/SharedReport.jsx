import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { 
  FileText, Activity, HeartPulse, Sparkles, CheckCircle2, 
  AlertCircle, AlertTriangle, Printer, Stethoscope, Info
} from 'lucide-react';
import axios from 'axios';

// Since this is a public page, we bypass the standard api client that enforces auth headers,
// and make requests to a public shared endpoint.
const SharedReport = () => {
  const { shareToken } = useParams();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const fetchSharedReport = async () => {
      try {
        const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
        const { data } = await axios.get(`${backendUrl}/reports/shared/${shareToken}`);
        setReport(data);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setError('This shared link has expired or is invalid.');
        setLoading(false);
      }
    };
    fetchSharedReport();
  }, [shareToken]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 gap-4 min-h-screen bg-slate-50">
        <Activity className="h-8 w-8 animate-spin text-primary" />
        <p className="text-slate-500 font-medium">Retrieving shared report records...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-20 gap-4 min-h-screen bg-slate-50 text-center">
        <AlertTriangle className="h-12 w-12 text-red-500" />
        <h2 className="text-xl font-bold text-slate-800">Link Inactive</h2>
        <p className="text-slate-500 max-w-sm">{error}</p>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'parameters', label: 'Parameters', icon: HeartPulse },
    { id: 'summary', label: 'AI Summary', icon: Sparkles },
    { id: 'action', label: 'Action Plan', icon: CheckCircle2 },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Branding header */}
        <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border">
          <div className="flex items-center gap-2">
            <HeartPulse className="h-6 w-6 text-primary" />
            <span className="font-bold text-slate-900 text-lg">ReportSathi-AI</span>
            <span className="text-[10px] bg-blue-100 text-primary px-2 py-0.5 rounded-full font-bold">SHARED SHEET</span>
          </div>
          <Button onClick={() => window.print()} size="sm" className="gap-1.5 bg-slate-900 text-white">
            <Printer className="h-4 w-4" /> Print
          </Button>
        </div>

        {/* Critical Alert Banner */}
        {report.criticalAlert && (
          <div className="bg-red-600 text-white p-4 rounded-xl shadow-md border border-red-500 flex items-center gap-4">
            <AlertTriangle className="h-8 w-8 text-white shrink-0" />
            <div>
              <h3 className="font-bold">Critical Health Indicators Flagged</h3>
              <p className="text-sm text-red-100">{report.criticalAlertDetails}</p>
            </div>
          </div>
        )}

        {/* Patient Context Block */}
        <div className="bg-white p-6 rounded-xl shadow-md border space-y-4">
          <div className="flex items-center gap-2 text-primary font-bold text-lg border-b pb-2">
            <Stethoscope className="h-5 w-5" />
            <span>Clinical Information Sheet</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-slate-700">
            <div>
              <span className="text-slate-400 block text-xs">PATIENT NAME</span>
              <span className="font-bold">{report.patientProfileId?.profileName || 'Patient'}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-xs">AGE / GENDER</span>
              <span className="font-semibold">{report.patientProfileId?.age || '-'} yrs / {report.patientProfileId?.gender || '-'}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-xs">BLOOD GROUP</span>
              <span className="font-semibold">{report.patientProfileId?.bloodGroup || 'Unknown'}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-xs">REPORT SOURCE</span>
              <span className="font-semibold truncate block">{report.patientDetails?.laboratory || report.reportName}</span>
            </div>
          </div>

          {(report.symptoms?.length > 0 || report.medications?.length > 0) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border text-sm">
              {report.symptoms?.length > 0 && (
                <div>
                  <span className="text-slate-400 block text-xs">REPORTED SYMPTOMS</span>
                  <span className="font-semibold text-slate-800">{report.symptoms.join(', ')}</span>
                </div>
              )}
              {report.medications?.length > 0 && (
                <div>
                  <span className="text-slate-400 block text-xs">CURRENT MEDICATIONS</span>
                  <span className="font-semibold text-slate-800">{report.medications.join(', ')}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 bg-slate-200/50 p-1 rounded-xl max-w-md overflow-x-auto scrollbar-hide">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 min-w-[80px] flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold transition-all duration-200 whitespace-nowrap ${
                  isActive ? 'bg-white text-primary shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/30'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Contents */}
        <div>
          {/* OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex flex-col gap-6 md:col-span-1">
                <Card className="border-none shadow-lg bg-gradient-to-br from-primary to-blue-800 text-white">
                  <CardContent className="p-6 flex flex-col items-center justify-center text-center h-full">
                    <h3 className="text-blue-100 font-medium text-xs mb-1">Health Score</h3>
                    <div className="text-5xl font-bold mb-1">
                      {report.healthScore ?? '--'}
                      <span className="text-xl text-blue-200">/100</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-slate-200 shadow-sm">
                  <CardHeader className="bg-slate-50 pb-2 border-b">
                    <CardTitle className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1">
                      <Info className="h-3.5 w-3.5 text-slate-400" /> Confidence Metrics
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3.5 space-y-3 text-xs">
                    <div className="flex justify-between items-center border-b pb-1.5">
                      <span className="text-slate-500">Document Scan</span>
                      <span className="font-semibold text-slate-800">{report.confidenceMetrics?.documentDetection || 'Valid'}</span>
                    </div>
                    <div className="flex justify-between items-center border-b pb-1.5">
                      <span className="text-slate-500">Scan Quality</span>
                      <span className="font-semibold text-slate-800">{report.confidenceMetrics?.ocrQuality || 'High'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">AI Logic Conf</span>
                      <span className="font-semibold text-slate-800">{report.confidenceMetrics?.analysisConfidence ?? 90}%</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="md:col-span-2 border-slate-200 shadow-md">
                <CardHeader>
                  <CardTitle className="text-base text-slate-800 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-slate-400" /> Extracted Document Text
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-slate-50 p-4 rounded-lg whitespace-pre-wrap font-mono text-xs text-slate-700 max-h-[300px] overflow-y-auto border">
                    {report.extractedText || 'No text extracted.'}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* PARAMETERS TAB */}
          {activeTab === 'parameters' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {report.parameters?.map((param, idx) => (
                <Card key={idx} className={`shadow-sm border-l-4 ${
                  param.status === 'LOW' ? 'border-l-warning' : 
                  param.status === 'HIGH' ? 'border-l-danger' : 
                  param.status === 'CRITICAL' ? 'border-l-red-600 bg-red-50/10' : 
                  param.status === 'NORMAL' ? 'border-l-success' : 'border-l-slate-300'
                }`}>
                  <CardContent className="p-4 space-y-2">
                    <div className="flex justify-between items-start">
                      <h3 className="font-bold text-slate-800 text-sm">{param.parameter}</h3>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                        param.status === 'LOW' ? 'bg-warning/10 text-warning-700' : 
                        param.status === 'HIGH' ? 'bg-danger/10 text-danger-700' : 
                        param.status === 'CRITICAL' ? 'bg-red-200 text-red-800' : 
                        param.status === 'NORMAL' ? 'bg-success/10 text-success-700' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {param.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-1 text-xs border-b pb-1.5">
                      <div>
                        <span className="text-slate-400 block text-[10px]">Value</span>
                        <span className="font-bold text-slate-800">{param.value} {param.unit}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Normal Range</span>
                        <span className="font-semibold text-slate-600">{param.normalRange}</span>
                      </div>
                    </div>

                    {param.insight && (
                      <div className="text-[11px] text-slate-500 bg-slate-50 p-2 rounded border italic">
                        {param.insight}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* AI SUMMARY TAB */}
          {activeTab === 'summary' && (
            <Card className="border-slate-200 shadow-md">
              <CardHeader className="bg-primary/5 border-b pb-3">
                <CardTitle className="text-base text-primary flex items-center gap-2">
                  <Sparkles className="h-4 w-4" /> Patient-Friendly Analysis Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="whitespace-pre-wrap text-slate-700 leading-relaxed text-sm">
                  {/* Since shared report has a mixed summary object, let's display the first language string available */}
                  {report.aiSummary ? (typeof report.aiSummary === 'string' ? report.aiSummary : Object.values(report.aiSummary)[0]) : "No summary available."}
                </div>
              </CardContent>
            </Card>
          )}

          {/* ACTION PLAN TAB */}
          {activeTab === 'action' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="border-emerald-200 bg-emerald-50/30">
                  <CardHeader className="pb-1">
                    <CardTitle className="flex items-center gap-1.5 text-emerald-700 text-sm">
                      <CheckCircle2 className="h-4 w-4" /> Recommended Action Plan
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {report.actionPlan?.map((step, i) => (
                        <li key={i} className="flex gap-2 text-slate-700 items-start text-xs">
                          <div className="bg-emerald-100 text-emerald-700 w-5 h-5 rounded flex items-center justify-center shrink-0 font-bold">{i+1}</div>
                          <span className="font-medium mt-0.5">{step}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card className="border-amber-200 bg-amber-50/30">
                  <CardHeader className="pb-1">
                    <CardTitle className="flex items-center gap-1.5 text-amber-700 text-sm">
                      <AlertCircle className="h-4 w-4" /> General Precautions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 list-disc pl-4 text-xs">
                      {report.precautions?.map((step, i) => (
                        <li key={i} className="text-slate-700">{step}</li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>

              {report.doctorQuestions?.length > 0 && (
                <Card className="border-blue-200 bg-blue-50/30">
                  <CardHeader className="pb-1">
                    <CardTitle className="text-blue-700 flex items-center gap-1.5 text-sm">Doctor Consultation Questions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-1.5 text-xs">
                      {report.doctorQuestions.map((q, i) => (
                        <li key={i} className="text-slate-700 italic border-l-2 border-blue-300 pl-2">"{q}"</li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>

        {/* Footer Medical Disclaimer */}
        <div className="p-4 bg-slate-100 rounded-xl text-center border text-[11px] text-slate-400">
          Disclaimer: This sheet is for educational/informational purposes only. It is not medical advice, diagnosis, or treatment. Seek professional clinical consultation before making any healthcare decisions.
        </div>
      </div>
    </div>
  );
};

export default SharedReport;
