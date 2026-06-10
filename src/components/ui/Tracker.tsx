'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { TrackerEntry, WeeklyReflection } from '@/types';
import { Save, Download, Image, TrendingUp, CheckCircle, XCircle, Calendar } from 'lucide-react';
import html2canvas from 'html2canvas';
import { toast } from 'sonner';

interface TrackerProps {
  userId: string;
}

export default function Tracker({ userId }: TrackerProps) {
  const queryClient = useQueryClient();
  const [entries, setEntries] = useState<Map<number, TrackerEntry>>(new Map());
  const [reflections, setReflections] = useState<WeeklyReflection[]>([
    { week_number: 1, improved: '', failed: '', change_next_week: '' },
    { week_number: 2, improved: '', failed: '', change_next_week: '' },
    { week_number: 3, improved: '', failed: '', change_next_week: '' },
    { week_number: 4, improved: '', failed: '', change_next_week: '' },
  ]);

  // Fetch tracker entries
  const { data: trackerData, isLoading: trackerLoading } = useQuery({
    queryKey: ['tracker', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('daily_tracker')
        .select('*')
        .eq('user_id', userId);
      if (error) throw error;
      return data as TrackerEntry[];
    },
  });

  // Fetch reflections
  const { data: reflectionsData, isLoading: reflectionsLoading } = useQuery({
    queryKey: ['reflections', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('weekly_reflections')
        .select('*')
        .eq('user_id', userId);
      if (error) throw error;
      return data as WeeklyReflection[];
    },
  });

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async (entriesToSave: TrackerEntry[]) => {
      const { error } = await supabase
        .from('daily_tracker')
        .upsert(entriesToSave, { onConflict: 'user_id,day' });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tracker', userId] });
      toast.success('Progress saved!');
    },
    onError: () => toast.error('Failed to save progress'),
  });

  // Save reflections mutation
  const saveReflectionsMutation = useMutation({
    mutationFn: async (reflectionsToSave: WeeklyReflection[]) => {
      const { error } = await supabase
        .from('weekly_reflections')
        .upsert(reflectionsToSave, { onConflict: 'user_id,week_number' });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reflections', userId] });
      toast.success('Reflections saved!');
    },
    onError: () => toast.error('Failed to save reflections'),
  });

  useEffect(() => {
    if (trackerData) {
      const map = new Map();
      trackerData.forEach(entry => map.set(entry.day, entry));
      // Initialize missing days
      for (let i = 1; i <= 30; i++) {
        if (!map.has(i)) {
          map.set(i, {
            day: i,
            coding: false,
            income_work: false,
            social_contact: false,
            left_house: false,
            exercise: false,
            cannabis: false,
            notes: '',
          });
        }
      }
      setEntries(map);
    }
  }, [trackerData]);

  useEffect(() => {
    if (reflectionsData) {
      const updated = reflections.map(r => {
        const existing = reflectionsData.find(rd => rd.week_number === r.week_number);
        return existing || r;
      });
      setReflections(updated);
    }
  }, [reflectionsData]);

  const updateEntry = (day: number, field: keyof TrackerEntry, value: any) => {
    const newEntries = new Map(entries);
    const entry = newEntries.get(day);
    if (entry) {
      newEntries.set(day, { ...entry, [field]: value });
      setEntries(newEntries);
    }
  };

  const handleSaveAll = () => {
    const entriesArray = Array.from(entries.values());
    saveMutation.mutate(entriesArray);
  };

  const handleSaveReflections = () => {
    saveReflectionsMutation.mutate(reflections);
  };

  const downloadImage = async () => {
    const element = document.getElementById('tracker-content');
    if (!element) return;
    
    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: '#ffffff',
      });
      const link = document.createElement('a');
      link.download = '30-day-tracker.png';
      link.href = canvas.toDataURL();
      link.click();
      toast.success('Image downloaded!');
    } catch (error) {
      toast.error('Failed to generate image');
    }
  };

  const getStats = () => {
    let coding = 0, income = 0, social = 0, leftHouse = 0, exercise = 0, noCannabis = 0;
    entries.forEach(entry => {
      if (entry.coding) coding++;
      if (entry.income_work) income++;
      if (entry.social_contact) social++;
      if (entry.left_house) leftHouse++;
      if (entry.exercise) exercise++;
      if (!entry.cannabis) noCannabis++;
    });
    return { coding, income, social, leftHouse, exercise, noCannabis };
  };

  const stats = getStats();

  if (trackerLoading || reflectionsLoading) {
    return <div className="text-center py-12">Loading tracker...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-wrap gap-3 mb-6 justify-between items-center">
        <div className="flex gap-3">
          <button
            onClick={handleSaveAll}
            disabled={saveMutation.isPending}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
          >
            <Save size={18} />
            Save All Progress
          </button>
          <button
            onClick={downloadImage}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
          >
            <Image size={18} />
            Download Image
          </button>
        </div>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
        >
          <Download size={18} />
          Print/Save PDF
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-3 text-white">
          <div className="text-xs opacity-90">Coding Days</div>
          <div className="text-2xl font-bold">{stats.coding}/30</div>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-3 text-white">
          <div className="text-xs opacity-90">Income Work</div>
          <div className="text-2xl font-bold">{stats.income}/30</div>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-3 text-white">
          <div className="text-xs opacity-90">Social Contact</div>
          <div className="text-2xl font-bold">{stats.social}/30</div>
        </div>
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-3 text-white">
          <div className="text-xs opacity-90">Left House</div>
          <div className="text-2xl font-bold">{stats.leftHouse}/30</div>
        </div>
        <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl p-3 text-white">
          <div className="text-xs opacity-90">Exercise</div>
          <div className="text-2xl font-bold">{stats.exercise}/30</div>
        </div>
        <div className="bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl p-3 text-white">
          <div className="text-xs opacity-90">Cannabis-Free</div>
          <div className="text-2xl font-bold">{stats.noCannabis}/30</div>
        </div>
      </div>

      <div id="tracker-content" className="bg-white rounded-2xl p-6 overflow-x-auto">
        <h2 className="text-2xl font-bold mb-6 text-center">30-Day Progress Tracker</h2>
        
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b-2 border-gray-200">
              <th className="p-3 text-left font-semibold text-sm">Day</th>
              <th className="p-3 text-center font-semibold text-sm">Code</th>
              <th className="p-3 text-center font-semibold text-sm">Income</th>
              <th className="p-3 text-center font-semibold text-sm">Social</th>
              <th className="p-3 text-center font-semibold text-sm">Out</th>
              <th className="p-3 text-center font-semibold text-sm">Exercise</th>
              <th className="p-3 text-center font-semibold text-sm">Cannabis</th>
              <th className="p-3 text-left font-semibold text-sm">Notes</th>
             </tr>
          </thead>
          <tbody>
            {Array.from({ length: 30 }, (_, i) => i + 1).map(day => {
              const entry = entries.get(day);
              if (!entry) return null;
              return (
                <tr key={day} className="border-b border-gray-100 hover:bg-gray-50 transition">
                  <td className="p-3 font-medium">Day {day}</td>
                  <td className="p-3 text-center">
                    <button
                      onClick={() => updateEntry(day, 'coding', !entry.coding)}
                      className={`w-8 h-8 rounded-full transition ${entry.coding ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'}`}
                    >
                      {entry.coding ? '✓' : '○'}
                    </button>
                  </td>
                  <td className="p-3 text-center">
                    <button
                      onClick={() => updateEntry(day, 'income_work', !entry.income_work)}
                      className={`w-8 h-8 rounded-full transition ${entry.income_work ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'}`}
                    >
                      {entry.income_work ? '✓' : '○'}
                    </button>
                  </td>
                  <td className="p-3 text-center">
                    <button
                      onClick={() => updateEntry(day, 'social_contact', !entry.social_contact)}
                      className={`w-8 h-8 rounded-full transition ${entry.social_contact ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'}`}
                    >
                      {entry.social_contact ? '✓' : '○'}
                    </button>
                  </td>
                  <td className="p-3 text-center">
                    <button
                      onClick={() => updateEntry(day, 'left_house', !entry.left_house)}
                      className={`w-8 h-8 rounded-full transition ${entry.left_house ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'}`}
                    >
                      {entry.left_house ? '✓' : '○'}
                    </button>
                  </td>
                  <td className="p-3 text-center">
                    <button
                      onClick={() => updateEntry(day, 'exercise', !entry.exercise)}
                      className={`w-8 h-8 rounded-full transition ${entry.exercise ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'}`}
                    >
                      {entry.exercise ? '✓' : '○'}
                    </button>
                  </td>
                  <td className="p-3 text-center">
                    <button
                      onClick={() => updateEntry(day, 'cannabis', !entry.cannabis)}
                      className={`w-8 h-8 rounded-full transition ${entry.cannabis ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-600'}`}
                    >
                      {entry.cannabis ? '⚠' : '○'}
                    </button>
                  </td>
                  <td className="p-3">
                    <input
                      type="text"
                      value={entry.notes}
                      onChange={(e) => updateEntry(day, 'notes', e.target.value)}
                      placeholder="..."
                      className="w-full px-2 py-1 text-sm border border-gray-200 rounded focus:outline-none focus:border-blue-400"
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Weekly Reflections */}
        <div className="mt-12">
          <h3 className="text-xl font-bold mb-6">Weekly Reflections</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {reflections.map((ref, idx) => (
              <div key={idx} className="border border-gray-200 rounded-xl p-5">
                <h4 className="font-semibold text-lg mb-3 text-blue-600">Week {ref.week_number}</h4>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium">What improved?</label>
                    <textarea
                      value={ref.improved}
                      onChange={(e) => {
                        const newRef = [...reflections];
                        newRef[idx].improved = e.target.value;
                        setReflections(newRef);
                      }}
                      rows={2}
                      className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-400"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">What failed?</label>
                    <textarea
                      value={ref.failed}
                      onChange={(e) => {
                        const newRef = [...reflections];
                        newRef[idx].failed = e.target.value;
                        setReflections(newRef);
                      }}
                      rows={2}
                      className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-400"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">What to change next week?</label>
                    <textarea
                      value={ref.change_next_week}
                      onChange={(e) => {
                        const newRef = [...reflections];
                        newRef[idx].change_next_week = e.target.value;
                        setReflections(newRef);
                      }}
                      rows={2}
                      className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-400"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={handleSaveReflections}
            disabled={saveReflectionsMutation.isPending}
            className="mt-6 flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
          >
            <Save size={18} />
            Save Reflections
          </button>
        </div>
      </div>
    </div>
  );
}