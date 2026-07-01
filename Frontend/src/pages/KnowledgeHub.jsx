import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { BookOpen, Droplet, Heart, Activity, Thermometer } from 'lucide-react';

const KnowledgeHub = () => {
  const topics = [
    {
      title: "Understanding Complete Blood Count (CBC)",
      icon: Droplet,
      color: "text-red-500",
      bg: "bg-red-50",
      content: "A CBC test measures different parts of your blood, including red blood cells (which carry oxygen), white blood cells (which fight infection), and platelets (which help blood clot). Abnormalities can indicate anemia, infection, or other conditions."
    },
    {
      title: "Cholesterol & Lipid Profile",
      icon: Heart,
      color: "text-rose-500",
      bg: "bg-rose-50",
      content: "This measures the amount of cholesterol and triglycerides in your blood. High levels of LDL (bad cholesterol) and low levels of HDL (good cholesterol) can increase your risk of heart disease."
    },
    {
      title: "Diabetes Markers (HbA1c & Fasting Sugar)",
      icon: Activity,
      color: "text-blue-500",
      bg: "bg-blue-50",
      content: "Fasting blood sugar measures glucose at a single point in time, while HbA1c provides an average of your blood sugar levels over the past 2-3 months. Both are crucial for diagnosing and managing diabetes."
    },
    {
      title: "Liver Function Test (LFT)",
      icon: BookOpen,
      color: "text-amber-500",
      bg: "bg-amber-50",
      content: "LFTs measure various proteins, enzymes, and substances, including bilirubin, SGOT, and SGPT. Elevated liver enzymes often indicate inflammation or damage to the liver."
    },
    {
      title: "Kidney Function (KFT)",
      icon: Thermometer,
      color: "text-emerald-500",
      bg: "bg-emerald-50",
      content: "Tests like Creatinine, Blood Urea Nitrogen (BUN), and eGFR assess how well your kidneys are filtering waste from your blood."
    }
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-slate-900">Health Knowledge Hub</h1>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
          Empower yourself with knowledge. Learn about common medical tests, what they measure, and why they are important for your overall health.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
        {topics.map((topic, i) => {
          const Icon = topic.icon;
          return (
            <Card key={i} className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center gap-4 pb-2">
                <div className={`${topic.bg} p-3 rounded-xl`}>
                  <Icon className={`h-6 w-6 ${topic.color}`} />
                </div>
                <CardTitle className="text-xl">{topic.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 leading-relaxed">{topic.content}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="mt-12 p-6 bg-slate-100 rounded-2xl text-center border border-slate-200">
        <h3 className="font-bold text-slate-800 mb-2">Medical Disclaimer</h3>
        <p className="text-slate-500 text-sm max-w-3xl mx-auto">
          The information provided in the Knowledge Hub is for educational purposes only and does not substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition.
        </p>
      </div>
    </div>
  );
};

export default KnowledgeHub;
