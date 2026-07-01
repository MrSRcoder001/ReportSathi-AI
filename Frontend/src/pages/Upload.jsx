import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { UploadCloud, FileType, CheckCircle2, User } from 'lucide-react';
import api from '../services/api';
import { ProfileContext } from '../context/ProfileContext';

const Upload = () => {
  const { profiles, activeProfile, changeActiveProfile } = useContext(ProfileContext);
  const [file, setFile] = useState(null);
  const [language, setLanguage] = useState('English');
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    if (!activeProfile) {
      setError('Please select or create a Patient Profile first.');
      return;
    }
    
    setIsUploading(true);
    setError('');
    
    const formData = new FormData();
    formData.append('report', file);
    formData.append('language', language);
    formData.append('patientProfileId', activeProfile._id);

    try {
      const { data } = await api.post('/reports/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      navigate(`/analysis/${data.reportId}`);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to upload report');
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Upload Report</h1>
        <p className="text-slate-500">Upload your medical report for AI analysis.</p>
      </div>

      {error && <div className="p-3 bg-red-100 text-red-700 rounded-lg text-sm">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
            <User className="h-4 w-4" /> Patient Profile
          </label>
          {profiles.length > 0 ? (
            <select 
              value={activeProfile?._id || ''}
              onChange={(e) => changeActiveProfile(e.target.value)}
              className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/50 focus:outline-none bg-white"
            >
              {profiles.map(p => (
                <option key={p._id} value={p._id}>{p.profileName} ({p.relation})</option>
              ))}
            </select>
          ) : (
            <div className="p-2.5 border border-amber-300 bg-amber-50 text-amber-700 rounded-lg text-sm">
              No profiles found. <a href="/profiles" className="font-bold underline">Create one first</a>.
            </div>
          )}
          <p className="text-xs text-slate-500">Select whose report this is.</p>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-slate-700">Preferred Summary Language</label>
          <select 
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/50 focus:outline-none bg-white"
          >
            <option value="English">English</option>
            <option value="Hindi">Hindi (हिंदी)</option>
            <option value="Marathi">Marathi (मराठी)</option>
            <option value="Tamil">Tamil (தமிழ்)</option>
            <option value="Telugu">Telugu (తెలుగు)</option>
            <option value="Kannada">Kannada (ಕನ್ನಡ)</option>
          </select>
          <p className="text-xs text-slate-500">The AI explanation will be generated in this language.</p>
        </div>
      </div>

      <Card className="border-2 border-dashed border-slate-300 bg-slate-50/50 hover:bg-slate-50 transition-colors">
        <CardContent 
          className="p-12 flex flex-col items-center justify-center text-center cursor-pointer"
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => document.getElementById('file-upload').click()}
        >
          <input 
            id="file-upload" 
            type="file" 
            className="hidden" 
            accept=".pdf,.png,.jpg,.jpeg"
            onChange={(e) => e.target.files && setFile(e.target.files[0])}
          />
          
          {file ? (
            <div className="flex flex-col items-center gap-4">
              <div className="bg-green-100 p-4 rounded-full">
                <CheckCircle2 className="h-12 w-12 text-success" />
              </div>
              <div>
                <p className="font-semibold text-slate-900 text-lg">{file.name}</p>
                <p className="text-sm text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <div className="bg-blue-100 p-4 rounded-full">
                <UploadCloud className="h-12 w-12 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-slate-900 text-lg">Drop PDF/Image Here</p>
                <p className="text-sm text-slate-500 mt-1">or Click to Upload</p>
              </div>
              <div className="flex gap-2 mt-4 text-xs font-medium text-slate-400">
                <span className="flex items-center gap-1"><FileType className="h-4 w-4"/> PDF</span>
                <span>•</span>
                <span className="flex items-center gap-1"><FileType className="h-4 w-4"/> PNG, JPG</span>
                <span>•</span>
                <span>Max 20MB</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Button variant="outline" onClick={() => setFile(null)}>Cancel</Button>
        <Button onClick={handleUpload} disabled={!file || isUploading} className="min-w-[120px]">
          {isUploading ? "Uploading..." : "Analyze Report"}
        </Button>
      </div>
    </div>
  );
};

export default Upload;
