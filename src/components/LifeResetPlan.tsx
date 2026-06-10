// src/components/LifeResetPlan.tsx
'use client';

import { useRef } from 'react';
import html2canvas from 'html2canvas';
import { Download, Image, Target, Shield, Users, DollarSign, Brain, Activity, Clock } from 'lucide-react';
import { toast } from 'sonner';

export default function LifeResetPlan() {
  const contentRef = useRef<HTMLDivElement>(null);

  const downloadPDF = () => {
    window.print();
  };

  const downloadImage = async () => {
    if (!contentRef.current) return;
    
    try {
      const canvas = await html2canvas(contentRef.current, {
        scale: 2,
        backgroundColor: '#ffffff',
        logging: false,
      });
      
      const link = document.createElement('a');
      link.download = 'life-reset-plan.png';
      link.href = canvas.toDataURL();
      link.click();
      toast.success('Image downloaded successfully!');
    } catch (error) {
      toast.error('Failed to generate image');
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex gap-3 mb-6 justify-end print:hidden">
        <button
          onClick={downloadPDF}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          <Download size={18} />
          Download PDF
        </button>
        <button
          onClick={downloadImage}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
        >
          <Image size={18} />
          Download Image
        </button>
      </div>

      <div ref={contentRef} className="bg-white rounded-2xl p-6 md:p-8 print:p-0">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-3">
            Life Reset Plan
          </h1>
          <p className="text-gray-500">12 Weeks to Rebuild Your Life</p>
          <div className="w-24 h-1 bg-gradient-to-r from-blue-600 to-purple-600 mx-auto mt-4 rounded-full"></div>
        </div>

        {/* Core Situation */}
        <div className="mb-8 bg-red-50 rounded-xl p-6 border border-red-100">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-red-800">
            <Target size={24} />
            Core Situation
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {['Loneliness loops', 'Financial stress', 'Cannabis dependency pattern', 'Low structure and inconsistency'].map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-gray-700">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Objective */}
        <div className="mb-8 bg-green-50 rounded-xl p-6 border border-green-100">
          <h2 className="text-xl font-semibold mb-3 flex items-center gap-2 text-green-800">
            <Target size={24} />
            Objective
          </h2>
          <p className="text-gray-700 text-lg">
            Rebuild daily momentum that leads to income, independence, and reduced dependence on cannabis.
          </p>
        </div>

        {/* Rules */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-5 flex items-center gap-2">
            <Shield size={28} />
            The Rules
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="bg-gray-50 rounded-xl p-5">
              <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                <span className="text-purple-600">🌿</span> Cannabis Control
              </h3>
              <ul className="space-y-2 text-gray-600">
                <li>• No smoking cannabis</li>
                <li>• If used: rare edible only</li>
                <li>• Goal: reduce dependency</li>
              </ul>
            </div>

            <div className="bg-gray-50 rounded-xl p-5">
              <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                <Users size={20} /> Daily Human Contact
              </h3>
              <ul className="space-y-2 text-gray-600">
                <li>• Talk to at least 1 person daily</li>
                <li>• Leave the house once daily</li>
              </ul>
            </div>

            <div className="bg-gray-50 rounded-xl p-5">
              <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                <DollarSign size={20} /> Income Focus (Priority)
              </h3>
              <ul className="space-y-2 text-gray-600">
                <li>• 2–4 hours daily focused work</li>
                <li>• ONE project only</li>
                <li>• Must lead to income (freelance, AI tools, coding projects)</li>
              </ul>
            </div>

            <div className="bg-gray-50 rounded-xl p-5">
              <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                <Brain size={20} /> Break Escape Loops
              </h3>
              <ul className="space-y-2 text-gray-600">
                <li>• When urges hit (weed/porn/scrolling):</li>
                <li>• Wait 20 minutes</li>
                <li>• Go outside OR contact someone</li>
                <li>• Then decide</li>
              </ul>
            </div>

            <div className="bg-gray-50 rounded-xl p-5">
              <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                <Activity size={20} /> Physical Stability
              </h3>
              <ul className="space-y-2 text-gray-600">
                <li>• 20–30 min walk daily</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Daily Rule */}
        <div className="mb-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-6 text-white">
          <h2 className="text-xl font-semibold mb-2 flex items-center gap-2">
            <Clock size={24} />
            Daily Rule
          </h2>
          <p className="text-lg">
            No day is valid without progress OR human connection.
          </p>
        </div>

        {/* Weekly Focus Areas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8">
          {[
            { week: 'Weeks 1-3', focus: 'Build Structure & Reduce Dependency' },
            { week: 'Weeks 4-6', focus: 'Income Generation & Consistency' },
            { week: 'Weeks 7-9', focus: 'Social Integration & Habits' },
            { week: 'Weeks 10-12', focus: 'Sustainability & Growth' },
          ].map((week, i) => (
            <div key={i} className="border border-gray-200 rounded-lg p-4 text-center">
              <div className="font-bold text-blue-600 mb-2">{week.week}</div>
              <div className="text-sm text-gray-600">{week.focus}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}