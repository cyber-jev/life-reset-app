'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { User } from '@supabase/supabase-js';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster, toast } from 'sonner';
import Auth from '@/components/ui/Auth';
import LifeResetPlan from '@/components/ui/LifeResetPlan';
import Tracker from '@/components/ui/Tracker';
import { LogOut, FileText, Calendar, User as UserIcon, Info } from 'lucide-react';
import Image from 'next/image';

const queryClient = new QueryClient();

function AppContent() {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'plan' | 'tracker'>('plan');
  const [showAuth, setShowAuth] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success('Logged out');
  };

  // Landing page when not logged in
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="container mx-auto px-4 py-12">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
              Life Reset System
            </h1>
            <p className="text-gray-600 text-lg">Your 12-week journey to rebuild momentum and independence</p>
          </div>

          {/* GIF Demo */}
          <div className="max-w-3xl mx-auto mb-12">
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <img
                src="/demo.gif"
                alt="App demo"
                className="w-full h-auto"
                onError={(e) => { e.currentTarget.src = 'https://placehold.co/800x400?text=Demo+GIF'; }}
              />
              <div className="p-4 bg-gray-50 flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-500 mt-0.5" />
                <p className="text-sm text-gray-600">
                  Track daily habits, reflect weekly, and follow the 12-week life reset plan. 
                  All data is saved securely and accessible across devices.
                </p>
              </div>
            </div>
          </div>

          <div className="max-w-md mx-auto space-y-4">
            <button
              onClick={() => setShowAuth(true)}
              className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition"
            >
              Get Started - Sign In / Sign Up
            </button>
            <p className="text-center text-xs text-gray-500">
              Free personal tool – build momentum, reduce dependency, track income work.
            </p>
          </div>
        </div>
        {showAuth && <Auth onClose={() => setShowAuth(false)} />}
        <Toaster position="top-right" />
      </div>
    );
  }

  // Logged-in view
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Life Reset System
          </h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-gray-600">
              <UserIcon size={18} />
              <span className="text-sm hidden sm:inline">{user.email?.split('@')[0]}</span>
            </div>
            <button onClick={handleLogout} className="flex items-center gap-2 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg">
              <LogOut size={16} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      <div className="border-b bg-white">
        <div className="container mx-auto px-4">
          <div className="flex gap-1">
            <button onClick={() => setActiveTab('plan')} className={`flex items-center gap-2 px-5 py-3 font-medium transition ${activeTab === 'plan' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}>
              <FileText size={18} /> Life Reset Plan
            </button>
            <button onClick={() => setActiveTab('tracker')} className={`flex items-center gap-2 px-5 py-3 font-medium transition ${activeTab === 'tracker' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}>
              <Calendar size={18} /> 30-Day Tracker
            </button>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-8">
        {activeTab === 'plan' && <LifeResetPlan />}
        {activeTab === 'tracker' && <Tracker userId={user.id} />}
      </main>
      <Toaster position="top-right" />
    </div>
  );
}

export default function Home() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}