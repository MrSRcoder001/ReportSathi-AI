import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Loader2, Plus, Trash2, Check, ArrowRight, AlertTriangle, HelpCircle } from 'lucide-react';
import api from '../services/api';

const Alert = ({ children, variant }) => (
  <div className={`p-4 rounded-lg flex gap-3 ${variant === 'destructive' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-blue-50 text-blue-700 border border-blue-200'}`}>
    {children}
  </div>
);

const AlertTitle = ({ children }) => (
  <h5 className="font-bold text-sm leading-none tracking-tight mb-1">{children}</h5>
);

const AlertDescription = ({ children }) => (
  <div className="text-xs opacity-90">{children}</div>
);

const Review = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Form fields
  const [patientDetails, setPatientDetails] = useState({ name: '', age: '', gender: '', laboratory: '', date: '' });
  const [parameters, setParameters] = useState([]);
  const [symptoms, setSymptoms] = useState('');
  const [medications, setMedications] = useState('');

  useEffect(() => {
    let pollInterval;

    const fetchReport = async () => {
      try {
        const { data } = await api.get(`/reports/${id}`);
        setReport(data);

        if (data.status === 'review_pending') {
          setLoading(false);
          clearInterval(pollInterval);
          setPatientDetails(data.patientDetails || { name: '', age: '', gender: '', laboratory: '', date: '' });
          setParameters(data.parameters || []);
          setSymptoms(data.symptoms?.join(', ') || '');
          setMedications(data.medications?.join(', ') || '');
        } else if (data.status === 'completed') {
          // Already completed, navigate directly to analysis
          navigate(`/analysis/${id}`);
          clearInterval(pollInterval);
        } else if (data.status === 'failed') {
          setLoading(false);
          clearInterval(pollInterval);
        }
      } catch (err) {
        console.error(err);
        setError('Failed to fetch report.');
        setLoading(false);
        clearInterval(pollInterval);
      }
    };

    fetchReport();
    pollInterval = setInterval(fetchReport, 3000); // Poll every 3 seconds for OCR completion

    return () => clearInterval(pollInterval);
  }, [id, navigate]);

  const handlePatientDetailChange = (e) => {
    setPatientDetails({ ...patientDetails, [e.target.name]: e.target.value });
  };

  const handleParamChange = (index, field, value) => {
    const updated = [...parameters];
    updated[index][field] = value;
    setParameters(updated);
  };

  const addParameter = () => {
    setParameters([...parameters, { parameter: '', value: '', unit: '', normalRange: '', confidence: 100, referenceRangeSource: 'Manual Entry' }]);
  };

  const deleteParameter = (index) => {
    setParameters(parameters.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const payload = {
        parameters,
        patientDetails,
        symptoms: symptoms.split(',').map(s => s.trim()).filter(Boolean),
        medications: medications.split(',').map(m => m.trim()).filter(Boolean),
      };

      await api.post(`/reports/${id}/confirm`, payload);
      navigate(`/analysis/${id}`);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to submit review.');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 gap-6 max-w-lg mx-auto text-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <div>
          <h2 className="text-2xl font-bold text-slate-900 font-inter">OCR Extracting Text...</h2>
          <p className="text-slate-500 mt-2">
            We are performing high-fidelity OCR scanning and structuring the text. This will take a few seconds...
          </p>
        </div>
      </div>
    );
  }

  if (report && report.status === 'failed') {
    return (
      <div className="max-w-md mx-auto p-8 text-center space-y-4">
        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900">OCR Extraction Failed</h2>
        <p className="text-slate-500">
          The document could not be read or was not recognized as a valid medical report.
        </p>
        <Button onClick={() => navigate('/upload')}>Try Another Upload</Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Review & Correct Extractions</h1>
          <p className="text-slate-500">Double-check OCR results before running AI medical analysis.</p>
        </div>
        <Button onClick={handleSubmit} disabled={submitting} className="gap-2 bg-success hover:bg-success/90">
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          Confirm & Analyze
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Patient Details */}
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="text-lg">Extracted Patient & Lab Information</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-600">Patient Name</label>
              <input
                type="text"
                name="name"
                value={patientDetails.name}
                onChange={handlePatientDetailChange}
                className="w-full border rounded-lg p-2 bg-slate-50 focus:bg-white transition-all text-sm outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-600">Age</label>
              <input
                type="text"
                name="age"
                value={patientDetails.age}
                onChange={handlePatientDetailChange}
                className="w-full border rounded-lg p-2 bg-slate-50 focus:bg-white transition-all text-sm outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-600">Gender</label>
              <input
                type="text"
                name="gender"
                value={patientDetails.gender}
                onChange={handlePatientDetailChange}
                className="w-full border rounded-lg p-2 bg-slate-50 focus:bg-white transition-all text-sm outline-none"
              />
            </div>
            <div className="space-y-1 md:col-span-2">
              <label className="text-sm font-medium text-slate-600">Laboratory / Clinic</label>
              <input
                type="text"
                name="laboratory"
                value={patientDetails.laboratory}
                onChange={handlePatientDetailChange}
                className="w-full border rounded-lg p-2 bg-slate-50 focus:bg-white transition-all text-sm outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-600">Report Date</label>
              <input
                type="text"
                name="date"
                value={patientDetails.date}
                onChange={handlePatientDetailChange}
                className="w-full border rounded-lg p-2 bg-slate-50 focus:bg-white transition-all text-sm outline-none"
              />
            </div>
          </CardContent>
        </Card>

        {/* Symptoms & Medications Context */}
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="text-lg">Additional Clinical Context (Recommended)</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-600 flex items-center gap-1">
                Current Symptoms
                <span className="text-xs text-slate-400 font-normal">(Comma separated, e.g. fatigue, dry cough)</span>
              </label>
              <textarea
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                placeholder="Describe what you are currently feeling..."
                rows={3}
                className="w-full border rounded-lg p-2.5 bg-slate-50 focus:bg-white transition-all text-sm outline-none resize-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-600 flex items-center gap-1">
                Current Medications
                <span className="text-xs text-slate-400 font-normal">(Comma separated, e.g. Metformin 500mg)</span>
              </label>
              <textarea
                value={medications}
                onChange={(e) => setMedications(e.target.value)}
                placeholder="List medicines you are currently taking..."
                rows={3}
                className="w-full border rounded-lg p-2.5 bg-slate-50 focus:bg-white transition-all text-sm outline-none resize-none"
              />
            </div>
          </CardContent>
        </Card>

        {/* Extracted Parameters */}
        <Card className="border-slate-200">
          <CardHeader className="flex flex-row justify-between items-center pb-2">
            <CardTitle className="text-lg">Biomarker & Lab Parameters</CardTitle>
            <Button type="button" variant="outline" size="sm" onClick={addParameter} className="gap-1 text-primary border-primary/30 hover:bg-primary/5">
              <Plus className="h-4 w-4" /> Add Parameter
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {parameters.length === 0 ? (
              <div className="text-center py-6 text-slate-400 border border-dashed rounded-xl">
                No parameters extracted yet. Click "Add Parameter" to input manually.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[700px] text-sm text-left text-slate-600">
                  <thead className="bg-slate-50 text-slate-700 font-medium uppercase text-xs">
                    <tr>
                      <th className="p-3">Test Parameter</th>
                      <th className="p-3 w-28">Value</th>
                      <th className="p-3 w-28">Unit</th>
                      <th className="p-3 w-36">Reference Range</th>
                      <th className="p-3 w-32">OCR Confidence</th>
                      <th className="p-3 text-center w-16">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {parameters.map((param, index) => (
                      <tr key={index} className="hover:bg-slate-50/50">
                        <td className="p-3">
                          <input
                            type="text"
                            value={param.parameter}
                            onChange={(e) => handleParamChange(index, 'parameter', e.target.value)}
                            className="w-full border border-slate-200 rounded p-1.5 outline-none focus:border-primary text-sm font-semibold"
                            required
                          />
                        </td>
                        <td className="p-3">
                          <input
                            type="text"
                            value={param.value}
                            onChange={(e) => handleParamChange(index, 'value', e.target.value)}
                            className="w-full border border-slate-200 rounded p-1.5 outline-none focus:border-primary text-sm font-medium"
                            required
                          />
                        </td>
                        <td className="p-3">
                          <input
                            type="text"
                            value={param.unit}
                            onChange={(e) => handleParamChange(index, 'unit', e.target.value)}
                            className="w-full border border-slate-200 rounded p-1.5 outline-none focus:border-primary text-sm"
                          />
                        </td>
                        <td className="p-3">
                          <input
                            type="text"
                            value={param.normalRange}
                            onChange={(e) => handleParamChange(index, 'normalRange', e.target.value)}
                            className="w-full border border-slate-200 rounded p-1.5 outline-none focus:border-primary text-sm"
                            placeholder="e.g. 12-16"
                          />
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={param.confidence || 100}
                              onChange={(e) => handleParamChange(index, 'confidence', Number(e.target.value))}
                              className="w-16 border border-slate-200 rounded p-1.5 outline-none text-sm text-center"
                            />
                            <span className="text-xs text-slate-400">%</span>
                          </div>
                        </td>
                        <td className="p-3 text-center">
                          <button
                            type="button"
                            onClick={() => deleteParameter(index)}
                            className="text-danger hover:bg-danger/10 p-1.5 rounded transition-all"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex justify-end gap-4">
          <Button type="button" variant="ghost" onClick={() => navigate('/dashboard')}>
            Cancel
          </Button>
          <Button type="submit" disabled={submitting} className="gap-2 bg-primary">
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
            {submitting ? 'Analyzing...' : 'Confirm & Run AI Analysis'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default Review;
