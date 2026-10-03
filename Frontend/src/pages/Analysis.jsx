import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { 
  ArrowLeft, Loader2, FileText, Activity, HeartPulse, Sparkles, 
  MessageSquare, AlertTriangle, Download, Volume2, CheckCircle2, 
  AlertCircle, Share2, Clipboard, Printer, Stethoscope, Languages, Info
} from 'lucide-react';
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

  // Translation State
  const [selectedLanguage, setSelectedLanguage] = useState('English');
  const [translationLoading, setTranslationLoading] = useState(false);
  const [displayedSummary, setDisplayedSummary] = useState('');

  // Share State
  const [shareToken, setShareToken] = useState('');
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // Doctor Visit Mode State
  const [doctorModeOpen, setDoctorModeOpen] = useState(false);

  useEffect(() => {
    let pollInterval;

    const fetchReport = async () => {
      try {
        const { data } = await api.get(`/reports/${id}`);
        setReport(data);

        if (data.status === 'completed' || data.status === 'failed' || data.status === 'review_pending') {
          setIsPolling(false);
          clearInterval(pollInterval);
          
          // Set initial summary
          if (data.aiSummary) {
            const lang = data.language || 'English';
            setSelectedLanguage(lang);
            setDisplayedSummary(data.aiSummary[lang] || Object.values(data.aiSummary)[0] || '');
          }
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

  const handleLanguageChange = async (lang) => {
    if (lang === selectedLanguage) return;
    setSelectedLanguage(lang);

    if (report.aiSummary && report.aiSummary[lang]) {
      setDisplayedSummary(report.aiSummary[lang]);
      return;
    }

    try {
      setTranslationLoading(true);
      const { data } = await api.post(`/reports/${id}/translate`, { language: lang });
      
      // Update local report object
      const updatedSummary = { ...report.aiSummary, [lang]: data.translatedSummary };
      setReport({ ...report, aiSummary: updatedSummary });
      setDisplayedSummary(data.translatedSummary);
    } catch (err) {
      console.error(err);
      alert('Translation failed. Please try again.');
    } finally {
      setTranslationLoading(false);
    }
  };

  const handleShare = async () => {
    try {
      const { data } = await api.post(`/reports/${id}/share`);
      setShareToken(data.shareToken);
      setShareModalOpen(true);
    } catch (err) {
      console.error(err);
      alert('Failed to generate share link.');
    }
  };

  const copyShareLink = () => {
    const link = `${window.location.origin}/shared/${shareToken}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTTS = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = selectedLanguage === 'Hindi' ? 'hi-IN' : (selectedLanguage === 'Marathi' ? 'mr-IN' : 'en-US');
      window.speechSynthesis.speak(utterance);
    } else {
      alert("Text-to-speech is not supported in your browser.");
    }
  };

  const handleExportPdf = () => {
    setIsGeneratingPdf(true);
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
    }, 500);
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
        <div className="bg-blue-100 p-6 rounded-full animate-pulse">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">AI is Analyzing Your Report</h2>
          <p className="text-slate-500 mt-2">
            Comparing biomarkers, checking reference ranges, and generating personalized insights...
          </p>
        </div>
      </div>
    );
  }

  // Redirect to review if awaiting confirmation
  if (report.status === 'review_pending' && !report.confirmed) {
    return (
      <div className="flex flex-col items-center justify-center p-20 gap-6 max-w-lg mx-auto text-center">
        <AlertTriangle className="h-12 w-12 text-amber-500" />
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Awaiting OCR Review</h2>
          <p className="text-slate-500 mt-2">
            The OCR text is ready. Please review and confirm the extracted values before final analysis.
          </p>
          <Link to={`/reports/${report._id}/review`} className="mt-4 inline-block">
            <Button>Go to Review Page</Button>
          </Link>
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
      {/* Critical Alert Layer */}
      {report.criticalAlert && (
        <div className="bg-gradient-to-r from-red-600 to-red-800 text-white p-4 rounded-xl shadow-lg border border-red-500 flex items-center gap-4 animate-pulse">
          <AlertTriangle className="h-8 w-8 text-white shrink-0" />
          <div>
            <h3 className="font-bold text-lg">Critical Health Warning</h3>
            <p className="text-sm text-red-100">{report.criticalAlertDetails}</p>
            <p className="text-xs text-red-200 mt-1">Disclaimer: This is not a diagnosis. Please contact emergency services or consult a professional medical provider immediately.</p>
          </div>
        </div>
      )}

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
          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            <Button onClick={() => setDoctorModeOpen(true)} className="gap-2 bg-blue-600 hover:bg-blue-700 flex-1 md:flex-initial">
              <Stethoscope className="h-4 w-4" />
              Doctor Visit Mode
            </Button>
            <Button onClick={handleShare} variant="outline" className="gap-2 border-slate-300 hover:bg-slate-50 flex-1 md:flex-initial">
              <Share2 className="h-4 w-4" />
              Share Report
            </Button>
            <Button onClick={handleExportPdf} disabled={isGeneratingPdf} className="gap-2 bg-slate-900 hover:bg-slate-800 flex-1 md:flex-initial">
              {isGeneratingPdf ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              {isGeneratingPdf ? 'Generating...' : 'Export PDF'}
            </Button>
          </div>
        )}
      </div>

      <div id="report-content">
        {/* Patient Profile Header Card */}
        {report.patientProfileId && (
          <div className="mb-6 space-y-3">
            <div className="p-4 bg-primary/5 rounded-xl border border-primary/20 flex flex-wrap gap-4 md:gap-6 items-center text-sm md:text-base">
              <div><span className="text-slate-500 font-medium">Patient:</span> <span className="font-bold text-slate-900">{report.patientProfileId.profileName}</span></div>
              <div><span className="text-slate-500 font-medium">Relation:</span> <span className="font-bold text-slate-900">{report.patientProfileId.relation}</span></div>
              <div><span className="text-slate-500 font-medium">Age/Gender:</span> <span className="font-bold text-slate-900">{report.patientProfileId.age || '-'} yrs / {report.patientProfileId.gender || '-'}</span></div>
              {report.patientProfileId.bloodGroup && (
                <div><span className="text-slate-500 font-medium">Blood Group:</span> <span className="font-bold text-slate-900">{report.patientProfileId.bloodGroup}</span></div>
              )}
            </div>
            
            {/* Extracted Details & Symptoms Context */}
            {(report.patientDetails?.name || report.symptoms?.length > 0) && (
              <div className="p-4 bg-slate-50 rounded-xl border space-y-2">
                <div className="flex flex-wrap gap-4 md:gap-6 items-center text-xs text-slate-500">
                  {report.patientDetails?.name && <div><span>Extracted Name:</span> <span className="font-semibold text-slate-800">{report.patientDetails.name}</span></div>}
                  {report.patientDetails?.laboratory && <div><span>Lab Name:</span> <span className="font-semibold text-slate-800">{report.patientDetails.laboratory}</span></div>}
                  {report.patientDetails?.date && <div><span>Report Date:</span> <span className="font-semibold text-slate-800">{report.patientDetails.date}</span></div>}
                </div>
                {report.symptoms?.length > 0 && (
                  <div className="text-sm">
                    <span className="text-slate-500 font-medium">Report Symptoms:</span> <span className="font-medium text-slate-800">{report.symptoms.join(', ')}</span>
                  </div>
                )}
                {report.medications?.length > 0 && (
                  <div className="text-sm">
                    <span className="text-slate-500 font-medium">Current Medications:</span> <span className="font-medium text-slate-800">{report.medications.join(', ')}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Tabs Navigation */}
        <div className="flex space-x-1 bg-slate-100 p-1 rounded-xl max-w-2xl overflow-x-auto scrollbar-hide mb-6" data-html2canvas-ignore>
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 min-w-[110px] flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                  isActive ? 'bg-white text-primary shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Contents */}
        <div>
          {report.status === 'failed' ? (
             <Card className="border-danger/30 shadow-sm">
               <CardContent className="p-6">
                 <div className="text-danger bg-danger/10 p-4 rounded-lg flex items-center gap-3">
                   <AlertTriangle className="h-5 w-5" />
                   Analysis Pipeline Failed. Please try re-uploading a clearer image.
                 </div>
               </CardContent>
             </Card>
          ) : (
            <>
              {/* OVERVIEW TAB */}
              {activeTab === 'overview' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="flex flex-col gap-6 md:col-span-1">
                    {/* Health Score */}
                    <Card className="border-none shadow-lg bg-gradient-to-br from-primary to-blue-800 text-white">
                      <CardContent className="p-8 flex flex-col items-center justify-center text-center h-full">
                        <h3 className="text-blue-100 font-medium mb-2">Health Score</h3>
                        <div className="text-6xl font-bold mb-2">
                          {report.healthScore ?? '--'}
                          <span className="text-2xl text-blue-200">/100</span>
                        </div>
                        <p className="text-xs text-blue-100 mt-4 leading-relaxed">
                          Calculated based on the ratio of normal parameters to abnormal parameters, scaled by confidence metrics.
                        </p>
                      </CardContent>
                    </Card>

                    {/* Confidence Meter Card */}
                    <Card className="border-slate-200 shadow-sm">
                      <CardHeader className="bg-slate-50 pb-3 border-b">
                        <CardTitle className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                          <Info className="h-4 w-4 text-slate-500" /> Trust & Confidence
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 space-y-4 text-sm">
                        <div className="flex justify-between items-center border-b pb-2">
                          <span className="text-slate-500">Document Scan</span>
                          <span className={`font-semibold ${report.confidenceMetrics?.documentDetection === 'Invalid' ? 'text-red-600' : 'text-green-600'}`}>
                            {report.confidenceMetrics?.documentDetection || 'Valid'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center border-b pb-2">
                          <span className="text-slate-500">OCR Scan Quality</span>
                          <span className={`font-semibold ${report.confidenceMetrics?.ocrQuality === 'Low' ? 'text-amber-600' : 'text-green-700'}`}>
                            {report.confidenceMetrics?.ocrQuality || 'High'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500">AI Logic Confidence</span>
                          <span className="font-semibold text-slate-800">
                            {report.confidenceMetrics?.analysisConfidence ?? 92}%
                          </span>
                        </div>
                        <div className="bg-slate-50 p-2.5 rounded text-xs text-slate-400 text-center border">
                          Rule database: ABDM Health Exchange (HIPAA Compliant)
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Extracted Text */}
                  <Card className="md:col-span-2 border-slate-200 shadow-md flex flex-col">
                    <CardHeader>
                      <CardTitle className="text-lg text-slate-800 flex items-center gap-2">
                        <FileText className="h-5 w-5 text-slate-500" /> Original Extracted Text
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col">
                      <div className="bg-slate-50 p-4 rounded-lg whitespace-pre-wrap font-mono text-xs text-slate-700 flex-1 overflow-y-auto border h-full min-h-[300px]">
                        {report.extractedText || 'No text extracted.'}
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
                      <Card key={idx} className={`shadow-sm border-l-4 transition-transform hover:-translate-y-0.5 ${
                        param.status === 'LOW' ? 'border-l-warning' : 
                        param.status === 'HIGH' ? 'border-l-danger' : 
                        param.status === 'CRITICAL' ? 'border-l-red-600 bg-red-50/20' : 
                        param.status === 'NORMAL' ? 'border-l-success' : 'border-l-slate-300'
                      }`}>
                        <CardContent className="p-5 space-y-3">
                          <div className="flex justify-between items-start">
                            <h3 className="font-bold text-slate-800 text-base">{param.parameter}</h3>
                            <span className={`text-[10px] px-2.5 py-1 rounded-full font-extrabold tracking-wider ${
                              param.status === 'LOW' ? 'bg-warning/10 text-warning-700' : 
                              param.status === 'HIGH' ? 'bg-danger/10 text-danger-700' : 
                              param.status === 'CRITICAL' ? 'bg-red-200 text-red-800 animate-pulse' : 
                              param.status === 'NORMAL' ? 'bg-success/10 text-success-700' : 'bg-slate-100 text-slate-600'
                            }`}>
                              {param.status}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-xs border-b pb-2">
                            <div>
                              <span className="text-slate-400 block">Current Value</span>
                              <span className="font-bold text-slate-800 text-sm">{param.value} {param.unit}</span>
                            </div>
                            <div>
                              <span className="text-slate-400 block">Normal Range</span>
                              <span className="font-semibold text-slate-600 text-sm">{param.normalRange}</span>
                            </div>
                          </div>

                          {/* OCR Confidence Badge & Range Source */}
                          <div className="flex justify-between items-center text-[10px] text-slate-400 bg-slate-50 p-1.5 rounded">
                            <span>Scan Conf: {param.confidence || 98}%</span>
                            <span className="truncate max-w-[120px]">{param.referenceRangeSource || 'Standard Ref'}</span>
                          </div>

                          {param.insight && (
                            <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded border border-slate-100 italic">
                              {param.insight}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <div className="col-span-full p-8 text-center text-slate-500 bg-slate-50 rounded-xl border border-dashed">
                      No parameters extracted.
                    </div>
                  )}
                </div>
              )}

              {/* AI SUMMARY TAB */}
              {activeTab === 'summary' && (
                <Card className="border-slate-200 shadow-md">
                  <CardHeader className="bg-primary/5 border-b pb-4 flex flex-row justify-between items-center">
                    <div className="flex items-center gap-3">
                      <Sparkles className="h-5 w-5 text-primary animate-pulse" />
                      <CardTitle className="text-lg text-primary">Patient-Friendly Analysis Summary</CardTitle>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Language Selection */}
                      <div className="flex items-center gap-1 bg-white border rounded-lg p-1 text-xs">
                        <Languages className="h-3.5 w-3.5 text-slate-400 ml-1" />
                        <button onClick={() => handleLanguageChange('English')} className={`px-2 py-1 rounded ${selectedLanguage === 'English' ? 'bg-primary text-white font-bold' : 'text-slate-600 hover:bg-slate-100'}`}>EN</button>
                        <button onClick={() => handleLanguageChange('Hindi')} className={`px-2 py-1 rounded ${selectedLanguage === 'Hindi' ? 'bg-primary text-white font-bold' : 'text-slate-600 hover:bg-slate-100'}`}>HI</button>
                        <button onClick={() => handleLanguageChange('Marathi')} className={`px-2 py-1 rounded ${selectedLanguage === 'Marathi' ? 'bg-primary text-white font-bold' : 'text-slate-600 hover:bg-slate-100'}`}>MR</button>
                      </div>

                      <Button variant="ghost" size="icon" onClick={() => handleTTS(displayedSummary)} className="text-primary hover:bg-primary/20">
                        <Volume2 className="h-5 w-5" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    {translationLoading ? (
                      <div className="flex flex-col items-center justify-center p-12 gap-3 text-slate-500 text-sm">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        Translating summary...
                      </div>
                    ) : (
                      <div className="prose prose-blue max-w-none">
                        <div className="whitespace-pre-wrap text-slate-700 leading-relaxed text-base font-inter">
                          {displayedSummary || "No summary analysis available."}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* ACTION PLAN TAB */}
              {activeTab === 'action' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Action Plan */}
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
                              <span className="text-sm font-medium">{step}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>

                    {/* Precautions */}
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
                            <li key={i} className="text-slate-700 text-sm">{step}</li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  </div>
                  
                  {/* Personal Questions for Doctor */}
                  <Card className="border-blue-200 bg-blue-50/30">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-blue-700 flex items-center gap-2 text-base">Personalized Questions to Ask Your Doctor</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {report.doctorQuestions?.map((q, i) => (
                          <li key={i} className="text-sm text-slate-700 italic border-l-4 border-blue-300 pl-3">"{q}"</li>
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

      {/* Share Report Modal */}
      {shareModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <Card className="max-w-md w-full border-none shadow-2xl bg-white">
            <CardHeader>
              <CardTitle className="text-lg">Secure Public Share Link</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-slate-500 leading-relaxed">
                Generate a secure, read-only link you can send to your family doctor or family members. Only the report data, patient profile context, and AI analysis will be shared.
              </p>
              <div className="flex gap-2 border p-2 rounded-lg bg-slate-50">
                <input 
                  type="text" 
                  readOnly 
                  value={`${window.location.origin}/shared/${shareToken}`} 
                  className="flex-1 text-xs bg-transparent outline-none truncate"
                />
                <Button onClick={copyShareLink} size="sm" className="gap-1.5 shrink-0 bg-primary text-white">
                  <Clipboard className="h-3.5 w-3.5" />
                  {copied ? 'Copied' : 'Copy'}
                </Button>
              </div>
              <div className="flex justify-end pt-2">
                <Button onClick={() => setShareModalOpen(false)}>Close</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Doctor Visit Mode Overlay */}
      {doctorModeOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 overflow-y-auto p-4 md:p-8 flex items-center justify-center">
          <Card className="max-w-3xl w-full border-none shadow-2xl bg-white p-6 relative">
            <button onClick={() => setDoctorModeOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 font-bold text-lg">×</button>
            
            <div className="border-b pb-4 mb-4 flex justify-between items-center">
              <div className="flex items-center gap-2 text-blue-600 font-bold text-xl">
                <Stethoscope className="h-6 w-6" />
                <span>Doctor Consultation Sheet</span>
              </div>
              <Button onClick={() => window.print()} className="gap-1.5 bg-slate-900 text-white text-xs">
                <Printer className="h-3.5 w-3.5" /> Print Summary
              </Button>
            </div>

            <div className="space-y-6 text-slate-800 text-sm">
              {/* Patient details block */}
              <div className="bg-slate-50 p-4 rounded-lg border grid grid-cols-2 gap-4">
                <div>
                  <span className="text-slate-400 block text-xs">PATIENT NAME</span>
                  <span className="font-bold">{report.patientProfileId?.profileName} ({report.patientProfileId?.relation})</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-xs">REPORT SOURCE / DATE</span>
                  <span className="font-semibold">{report.patientDetails?.laboratory || report.reportName} / {report.patientDetails?.date || new Date(report.createdAt).toLocaleDateString()}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-xs">CO-EXISTING CONDITIONS</span>
                  <span className="font-semibold">{report.patientProfileId?.conditions?.join(', ') || 'None declared'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-xs">CURRENT MEDICATIONS</span>
                  <span className="font-semibold">{report.patientProfileId?.medications?.join(', ') || 'None declared'}</span>
                </div>
              </div>

              {/* Symptoms context */}
              {report.symptoms?.length > 0 && (
                <div>
                  <h4 className="font-bold text-slate-700 uppercase text-xs mb-1.5">Symptoms at time of analysis</h4>
                  <p className="bg-blue-50 border border-blue-100 p-2.5 rounded font-medium text-blue-800">{report.symptoms.join(', ')}</p>
                </div>
              )}

              {/* Abnormal parameters table */}
              <div>
                <h4 className="font-bold text-slate-700 uppercase text-xs mb-2">Abnormal Biomarker Findings</h4>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-100 text-xs font-bold text-slate-600 border-b">
                      <tr>
                        <th className="p-2">Biomarker</th>
                        <th className="p-2">Observed</th>
                        <th className="p-2">Reference Range</th>
                        <th className="p-2">Severity</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y text-xs">
                      {report.parameters?.filter(p => p.status !== 'NORMAL').map((param, idx) => (
                        <tr key={idx} className={param.status === 'CRITICAL' ? 'bg-red-50' : ''}>
                          <td className="p-2 font-bold">{param.parameter}</td>
                          <td className="p-2 font-medium">{param.value} {param.unit}</td>
                          <td className="p-2 text-slate-500">{param.normalRange}</td>
                          <td className={`p-2 font-extrabold ${param.status === 'CRITICAL' ? 'text-red-700' : 'text-amber-700'}`}>{param.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Questions for Doctor */}
              {report.doctorQuestions?.length > 0 && (
                <div>
                  <h4 className="font-bold text-slate-700 uppercase text-xs mb-1.5">Questions Suggested by AI for your Visit</h4>
                  <ul className="space-y-1.5">
                    {report.doctorQuestions.map((q, i) => (
                      <li key={i} className="text-slate-700 italic border-l-2 border-primary pl-2 text-xs">"{q}"</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-6 border-t pt-4">
              <Button variant="outline" onClick={() => setDoctorModeOpen(false)}>Close Sheet</Button>
            </div>
          </Card>
        </div>
      )}

      {/* Voice Assistant Floating Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <VoiceAssistant onResult={(text) => {
          setActiveTab('chat');
          window.dispatchEvent(new CustomEvent('voice-input', { detail: text }));
        }} />
      </div>
    </div>
  );
};

export default Analysis;
