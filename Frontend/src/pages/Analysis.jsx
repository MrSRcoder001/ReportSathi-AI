import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { ArrowLeft, Loader2, FileText, Activity, HeartPulse, Sparkles, MessageSquare, AlertTriangle, Download, Volume2, CheckCircle2, AlertCircle } from 'lucide-react';
import ChatPanel from '../components/ui/ChatPanel';
import VoiceAssistant from '../components/VoiceAssistant';
import api from '../services/api';
import html2pdf from 'html2pdf.js';

const Analysis = () => {
  const { id } = useParams();
  const [report, setReport] = useState(null);
  const [error, setError] = useState('');
  const [isPolling, setIsPolling] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  useEffect(() => {
    let pollInterval;

    const fetchReport = async () => {
      try {
        const { data } = await api.get(`/reports/${id}`);
        setReport(data);

        if (data.status === 'completed' || data.status === 'failed') {
          setIsPolling(false);
          clearInterval(pollInterval);
        }
      } catch (err) {
        console.error(err);
        setError('Failed to fetch report analysis.');
        setIsPolling(false);
        clearInterval(pollInterval);
      }
    };

    fetchReport();

    if (isPolling) {
      pollInterval = setInterval(fetchReport, 3000);
    }

    return () => clearInterval(pollInterval);
  }, [id, isPolling]);

  const handleTTS = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      window.speechSynthesis.speak(utterance);
    } else {
      alert("Text-to-speech is not supported in your browser.");
    }
  };

  const handleExportPdf = () => {
    setIsGeneratingPdf(true);
    
    // Temporarily switch to overview to ensure we capture the whole report structure
    const originalTab = activeTab;
    setActiveTab('overview');
    
    setTimeout(() => {
      const element = document.getElementById('report-content');
      const opt = {
        margin:       0.5,
        filename:     `${report.patientProfileId?.profileName || 'Patient'}_Report_${new Date().toLocaleDateString()}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true },
        jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
      };

      html2pdf().set(opt).from(element).save().then(() => {
        setIsGeneratingPdf(false);
        setActiveTab(originalTab);
      });
    }, 500); // Wait for tab render
  };

  if (error) {
    return <div className="p-8 text-center text-red-600 font-medium">{error}</div>;
  }

  if (!report) {
    return (
      <div className="flex flex-col items-center justify-center p-20 gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-slate-500">Loading your report...</p>
      </div>
    );
  }

  if (report.status === 'pending' || report.status === 'processing') {
    return (
      <div className="flex flex-col items-center justify-center p-20 gap-6 max-w-lg mx-auto text-center">
        <div className="bg-blue-100 p-6 rounded-full">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">AI is Analyzing Your Report</h2>
          <p className="text-slate-500 mt-2">
            Our multi-agent pipeline is extracting parameters, cross-referencing medical knowledge, and generating insights...
          </p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'parameters', label: 'Parameters', icon: HeartPulse },
    { id: 'summary', label: 'AI Summary', icon: Sparkles },
    { id: 'action', label: 'Action Plan', icon: CheckCircle2 },
    { id: 'chat', label: 'Ask AI', icon: MessageSquare },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <Link to="/dashboard">
            <Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Intelligence Report</h1>
            <p className="text-slate-500">{report.reportName}</p>
          </div>
        </div>
        {report.status === 'completed' && (
          <Button onClick={handleExportPdf} disabled={isGeneratingPdf} className="gap-2 bg-slate-900 hover:bg-slate-800">
            {isGeneratingPdf ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            {isGeneratingPdf ? 'Generating...' : 'Export PDF'}
          </Button>
        )}
      </div>

      <div id="report-content">
        {report.patientProfileId && (
          <div className="mb-6 space-y-3">
            <div className="p-4 bg-primary/5 rounded-xl border border-primary/20 flex flex-wrap gap-4 md:gap-6 items-center text-sm md:text-base">
              <div><span className="text-slate-500">Profile Patient:</span> <span className="font-bold text-slate-900">{report.patientProfileId.profileName}</span></div>
              <div><span className="text-slate-500">Relation:</span> <span className="font-bold text-slate-900">{report.patientProfileId.relation}</span></div>
              <div><span className="text-slate-500">Age/Gender:</span> <span className="font-bold text-slate-900">{report.patientProfileId.age || '-'} / {report.patientProfileId.gender || '-'}</span></div>
            </div>
            
            {report.patientDetails && (report.patientDetails.name || report.patientDetails.laboratory) && (
              <div className="px-4 py-3 bg-slate-50 rounded-xl border flex flex-wrap gap-4 md:gap-6 items-center text-sm">
                <div><span className="text-slate-500">Extracted Name:</span> <span className="font-medium text-slate-900">{report.patientDetails.name || '-'}</span></div>
                <div><span className="text-slate-500">Extracted Age/Gender:</span> <span className="font-medium text-slate-900">{report.patientDetails.age || '-'} / {report.patientDetails.gender || '-'}</span></div>
                <div><span className="text-slate-500">Lab:</span> <span className="font-medium text-slate-900">{report.patientDetails.laboratory || '-'}</span></div>
                <div><span className="text-slate-500">Date:</span> <span className="font-medium text-slate-900">{report.patientDetails.date || '-'}</span></div>
              </div>
            )}
          </div>
        )}

        {/* Tabs */}
        <div className="flex space-x-1 bg-slate-100 p-1 rounded-xl max-w-2xl overflow-x-auto scrollbar-hide" data-html2canvas-ignore>
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 min-w-[120px] flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                isActive ? 'bg-white text-primary shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {report.status === 'failed' ? (
           <Card className="border-danger/30 shadow-sm">
             <CardContent className="p-6">
               <div className="text-danger bg-danger/10 p-4 rounded-lg flex items-center gap-3">
                 <AlertTriangle className="h-5 w-5" />
                 Analysis Pipeline Failed. Ensure Ollama is running and the report is readable.
               </div>
             </CardContent>
           </Card>
        ) : (
          <>
            {/* OVERVIEW TAB */}
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex flex-col gap-6 md:col-span-1">
                  <Card className="border-none shadow-lg bg-gradient-to-br from-primary to-blue-800 text-white">
                    <CardContent className="p-8 flex flex-col items-center justify-center text-center h-full">
                      <h3 className="text-blue-100 font-medium mb-2">Health Score</h3>
                      <div className="text-6xl font-bold mb-2">
                        {report.healthScore ?? '--'}
                        <span className="text-2xl text-blue-200">/100</span>
                      </div>
                      <p className="text-sm text-blue-100 mt-4">
                        Based on the proportion of parameters within normal reference ranges.
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border-slate-200 shadow-sm">
                    <CardHeader className="bg-slate-50 pb-3 border-b">
                      <CardTitle className="text-sm font-semibold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                        Trust & Transparency
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 space-y-4 text-sm">
                      <div className="flex justify-between items-center border-b pb-2">
                        <span className="text-slate-500">Document Type</span>
                        <span className={`font-medium ${report.confidenceMetrics?.documentDetection === 'Invalid' ? 'text-danger-600' : 'text-success-600'}`}>
                          {report.confidenceMetrics?.documentDetection || 'Unknown'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center border-b pb-2">
                        <span className="text-slate-500">Scan Quality</span>
                        <span className={`font-medium ${report.confidenceMetrics?.ocrQuality === 'Low' ? 'text-warning-600' : 'text-slate-800'}`}>
                          {report.confidenceMetrics?.ocrQuality || 'Unknown'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500">Analysis Confidence</span>
                        <span className="font-medium text-slate-800">
                          {report.confidenceMetrics?.analysisConfidence ?? 0}%
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 mt-4 text-center">
                        Evidence Used: {report.confidenceMetrics?.evidenceUsed?.length || 0} parameters
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card className="md:col-span-2 border-slate-200 shadow-md flex flex-col">
                  <CardHeader>
                    <CardTitle className="text-lg text-slate-800 flex items-center gap-2">
                      <FileText className="h-5 w-5 text-slate-500" /> Original Extracted Text
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col">
                    <div className="bg-slate-50 p-4 rounded-lg whitespace-pre-wrap font-mono text-xs text-slate-700 flex-1 overflow-y-auto border h-full min-h-[300px]">
                      {report.extractedText || 'No text could be extracted.'}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* PARAMETERS TAB */}
            {activeTab === 'parameters' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {report.parameters && report.parameters.length > 0 ? (
                  report.parameters.map((param, idx) => (
                    <Card key={idx} className={`shadow-sm border-l-4 ${
                      param.status === 'LOW' ? 'border-l-warning' : 
                      param.status === 'HIGH' ? 'border-l-danger' : 
                      param.status === 'NORMAL' ? 'border-l-success' : 'border-l-slate-300'
                    }`}>
                      <CardContent className="p-5">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-semibold text-slate-800 text-lg">{param.parameter}</h3>
                          <span className={`text-[10px] px-2 py-1 rounded-full font-bold tracking-wider ${
                            param.status === 'LOW' ? 'bg-warning/10 text-warning-700' : 
                            param.status === 'HIGH' ? 'bg-danger/10 text-danger-700' : 
                            param.status === 'NORMAL' ? 'bg-success/10 text-success-700' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {param.status}
                          </span>
                        </div>
                        <div className="space-y-1 mb-3">
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-500">Current:</span>
                            <span className="font-medium text-slate-900">{param.value}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-500">Normal Range:</span>
                            <span className="font-medium text-slate-900">{param.normalRange}</span>
                          </div>
                        </div>
                        {param.insight && (
                          <div className="text-sm text-slate-600 pt-3 border-t bg-slate-50 p-3 rounded mt-2">
                            <span className="font-semibold block mb-1">AI Insight:</span>
                            {param.insight}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="col-span-full p-8 text-center text-slate-500 bg-slate-50 rounded-xl border border-dashed">
                    No measurable parameters were extracted from this report.
                  </div>
                )}
              </div>
            )}

            {/* AI SUMMARY TAB */}
            {activeTab === 'summary' && (
              <Card className="border-slate-200 shadow-md">
                <CardHeader className="bg-primary/5 border-b pb-4 flex flex-row justify-between items-center">
                  <CardTitle className="text-lg text-primary flex items-center gap-2">
                    <Sparkles className="h-5 w-5" /> Patient-Friendly Analysis
                  </CardTitle>
                  <Button variant="ghost" size="icon" onClick={() => handleTTS(report.aiSummary)} className="text-primary hover:bg-primary/20">
                    <Volume2 className="h-5 w-5" />
                  </Button>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="prose prose-blue max-w-none">
                    <div className="whitespace-pre-wrap text-slate-700 leading-relaxed text-lg">
                      {report.aiSummary || "No summary available."}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* ACTION PLAN TAB */}
            {activeTab === 'action' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="border-emerald-200 bg-emerald-50/30">
                    <CardHeader className="flex flex-row justify-between items-center pb-2">
                      <CardTitle className="flex items-center gap-2 text-emerald-700">
                        <CheckCircle2 className="h-5 w-5" /> Recommended Action Plan
                      </CardTitle>
                      <Button variant="ghost" size="icon" onClick={() => handleTTS(report.actionPlan?.join('. '))} className="text-emerald-700 hover:bg-emerald-100">
                        <Volume2 className="h-5 w-5" />
                      </Button>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-3">
                        {report.actionPlan?.map((step, i) => (
                          <li key={i} className="flex gap-3 text-slate-700 items-start">
                            <div className="bg-emerald-100 text-emerald-700 w-6 h-6 rounded flex items-center justify-center shrink-0 font-bold text-xs">{i+1}</div>
                            {step}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>

                  <Card className="border-amber-200 bg-amber-50/30">
                    <CardHeader className="flex flex-row justify-between items-center pb-2">
                      <CardTitle className="flex items-center gap-2 text-amber-700">
                        <AlertCircle className="h-5 w-5" /> General Precautions
                      </CardTitle>
                      <Button variant="ghost" size="icon" onClick={() => handleTTS(report.precautions?.join('. '))} className="text-amber-700 hover:bg-amber-100">
                        <Volume2 className="h-5 w-5" />
                      </Button>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-3 list-disc pl-5">
                        {report.precautions?.map((step, i) => (
                          <li key={i} className="text-slate-700">{step}</li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </div>
                
                <Card className="border-blue-200 bg-blue-50/30">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-blue-700 flex items-center gap-2">Questions for Your Doctor</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {report.doctorQuestions?.map((q, i) => (
                        <li key={i} className="text-slate-700 italic border-l-4 border-blue-300 pl-3">"{q}"</li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* ASK AI TAB */}
            {activeTab === 'chat' && (
              <div className="max-w-3xl mx-auto" data-html2canvas-ignore>
                <ChatPanel reportId={report._id} />
              </div>
            )}
          </>
        )}
        </div>
      </div>
      {/* Voice Assistant Floating Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <VoiceAssistant onResult={(text) => {
          setActiveTab('chat');
          // We will rely on ChatPanel to have a way to receive this, or just focus.
          // For a robust STT injection, we'd pass it via state to ChatPanel.
          window.dispatchEvent(new CustomEvent('voice-input', { detail: text }));
        }} />
      </div>
    </div>
  );
};

export default Analysis;
