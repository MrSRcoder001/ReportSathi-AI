import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { FileText, HeartPulse, ShieldCheck, History } from 'lucide-react';

const Landing = () => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-slate-50 p-8">
      <div className="max-w-4xl text-center space-y-8">
        <h1 className="text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
          Understand Your Medical Reports <br/>
          <span className="text-primary text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">
            in Simple Language
          </span>
        </h1>
        <p className="text-xl text-slate-600 max-w-2xl mx-auto">
          Upload your report and receive easy-to-understand explanations of your health metrics. No medical jargon, just clarity.
        </p>
        <div className="flex gap-4 justify-center pt-4">
          <Link to="/upload">
            <Button size="lg" className="text-lg px-8 shadow-lg shadow-blue-200 hover:shadow-xl transition-all">
              Upload Report
            </Button>
          </Link>
          <Link to="/login">
            <Button variant="outline" size="lg" className="text-lg px-8">
              Learn More
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-24 max-w-6xl w-full">
        <FeatureCard icon={FileText} title="OCR Extraction" desc="Accurately reads text from your uploaded PDFs or images." />
        <FeatureCard icon={HeartPulse} title="Medical Explanation" desc="Simplifies complex medical terms using advanced AI." />
        <FeatureCard icon={History} title="Report History" desc="Keep track of all your past reports in one secure place." />
        <FeatureCard icon={ShieldCheck} title="Secure Storage" desc="Your health data is encrypted and securely stored." />
      </div>
    </div>
  );
};

const FeatureCard = ({ icon: Icon, title, desc }) => (
  <Card className="hover:scale-105 transition-transform duration-300 border-none bg-white/60 shadow-xl shadow-blue-900/5">
    <CardHeader>
      <div className="bg-blue-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
        <Icon className="text-primary w-6 h-6" />
      </div>
      <CardTitle className="text-xl">{title}</CardTitle>
    </CardHeader>
    <CardContent>
      <p className="text-slate-600">{desc}</p>
    </CardContent>
  </Card>
);

export default Landing;
