'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { ColumnDefinition, TrackerEntry, WeeklyReflection } from '@/types';
import { Save, Download, Image, Plus, Trash2, Edit2, Check, X } from 'lucide-react';
import html2canvas from 'html2canvas';
import { toast } from 'sonner';

interface TrackerProps {
  userId: string;
}

export default function Tracker({ userId }: TrackerProps) {
  const queryClient = useQueryClient();
  const [entries, setEntries] = useState<Map<number, TrackerEntry>>(new Map());
  const [columns, setColumns] = useState<ColumnDefinition[]>([]);
  const [editingColumnId, setEditingColumnId] = useState<string | null>(null);
  const [newColumnName, setNewColumnName] = useState('');
  const [reflections, setReflections] = useState<WeeklyReflection[]>([
    { week_number: 1, improved: '', failed: '', change_next_week: '' },
    { week_number: 2, improved: '', failed: '', change_next_week: '' },
    { week_number: 3, improved: '', failed: '', change_next_week: '' },
    { week_number: 4, improved: '', failed: '', change_next_week: '' },
  ]);

  // Fetch columns
  const { data: columnsData, isLoading: columnsLoading } = useQuery({
    queryKey: ['columns', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_column_definitions')
        .select('*')
        .eq('user_id', userId)
        .order('column_order', { ascending: true });
      if (error) throw error;
      if (data.length === 0) {
        // Insert default columns
        const defaults = [
          { column_key: 'coding', display_name: 'Code', column_order: 0 },
          { column_key: 'income_work', display_name: 'Income', column_order: 1 },
          { column_key: 'social_contact', display_name: 'Social', column_order: 2 },
          { column_key: 'left_house', display_name: 'Out', column_order: 3 },
          { column_key: 'exercise', display_name: 'Exercise', column_order: 4 },
          { column_key: 'cannabis', display_name: 'Cannabis', column_order: 5 },
        ];
        const { data: inserted, error: insertError } = await supabase
          .from('user_column_definitions')
          .insert(defaults.map(d => ({ ...d, user_id: userId })))
          .select();
        if (insertError) throw insertError;
        return inserted;
      }
      return data as ColumnDefinition[];
    },
  });

  // Fetch tracker entries
  const { data: entriesData, isLoading: entriesLoading } = useQuery({
    queryKey: ['trackerEntries', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tracker_entries')
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

  // Mutations
  const saveEntriesMutation = useMutation({
    mutationFn: async (entriesToSave: TrackerEntry[]) => {
      const { error } = await supabase
        .from('tracker_entries')
        .upsert(entriesToSave, { onConflict: 'user_id,day' });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trackerEntries', userId] });
      toast.success('Progress saved!');
    },
    onError: () => toast.error('Failed to save progress'),
  });

  const saveReflectionsMutation = useMutation({
    mutationFn: async (refs: WeeklyReflection[]) => {
      const { error } = await supabase
        .from('weekly_reflections')
        .upsert(refs, { onConflict: 'user_id,week_number' });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reflections', userId] });
      toast.success('Reflections saved!');
    },
    onError: () => toast.error('Failed to save reflections'),
  });

  const updateColumnMutation = useMutation({
    mutationFn: async (col: ColumnDefinition) => {
      const { error } = await supabase
        .from('user_column_definitions')
        .update({ display_name: col.display_name, column_order: col.column_order })
        .eq('id', col.id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['columns', userId] }),
  });

  const deleteColumnMutation = useMutation({
    mutationFn: async (colId: string) => {
      const { error } = await supabase.from('user_column_definitions').delete().eq('id', colId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['columns', userId] });
      toast.success('Column deleted');
    },
  });

  const addColumnMutation = useMutation({
    mutationFn: async (name: string) => {
      const newKey = `custom_${Date.now()}`;
      const newOrder = columns.length;
      const { error } = await supabase.from('user_column_definitions').insert({
        user_id: userId,
        column_key: newKey,
        display_name: name,
        column_order: newOrder,
        is_active: true,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['columns', userId] });
      toast.success('Column added');
    },
  });

  // Initialize entries map
  useEffect(() => {
    if (entriesData) {
      const map = new Map();
      entriesData.forEach(entry => map.set(entry.day, entry));
      for (let i = 1; i <= 30; i++) {
        if (!map.has(i)) {
          map.set(i, { day: i, column_values: {}, notes: '' });
        }
      }
      setEntries(map);
    } else if (!entriesLoading) {
      const map = new Map();
      for (let i = 1; i <= 30; i++) {
        map.set(i, { day: i, column_values: {}, notes: '' });
      }
      setEntries(map);
    }
  }, [entriesData, entriesLoading]);

  useEffect(() => {
    if (columnsData) setColumns(columnsData);
  }, [columnsData]);

  useEffect(() => {
    if (reflectionsData) {
      const updated = reflections.map(r => reflectionsData.find(rd => rd.week_number === r.week_number) || r);
      setReflections(updated);
    }
  }, [reflectionsData]);

  const updateEntryValue = (day: number, columnKey: string, value: boolean) => {
    const newEntries = new Map(entries);
    const entry = newEntries.get(day);
    if (entry) {
      newEntries.set(day, {
        ...entry,
        column_values: { ...entry.column_values, [columnKey]: value },
      });
      setEntries(newEntries);
    }
  };

  const updateEntryNotes = (day: number, notes: string) => {
    const newEntries = new Map(entries);
    const entry = newEntries.get(day);
    if (entry) {
      newEntries.set(day, { ...entry, notes });
      setEntries(newEntries);
    }
  };

  const handleSaveAll = () => {
    const entriesArray = Array.from(entries.values());
    saveEntriesMutation.mutate(entriesArray);
  };

  const handleSaveReflections = () => {
    saveReflectionsMutation.mutate(reflections);
  };

  const downloadImage = async () => {
    const element = document.getElementById('tracker-content');
    if (!element) return;
    try {
      const canvas = await html2canvas(element, { scale: 2, backgroundColor: '#ffffff' });
      const link = document.createElement('a');
      link.download = '30-day-tracker.png';
      link.href = canvas.toDataURL();
      link.click();
      toast.success('Image downloaded!');
    } catch {
      toast.error('Failed to generate image');
    }
  };

  const addColumn = () => {
    const name = prompt('Enter column name (e.g., Cigarettes, Porn, Meditation)');
    if (name && name.trim()) {
      addColumnMutation.mutate(name.trim());
    }
  };

  const renameColumn = (col: ColumnDefinition) => {
    const newName = prompt('New name:', col.display_name);
    if (newName && newName.trim() && newName !== col.display_name) {
      updateColumnMutation.mutate({ ...col, display_name: newName.trim() });
    }
  };

  const deleteColumn = (col: ColumnDefinition) => {
    if (confirm(`Delete column "${col.display_name}"? All data for this column will be lost.`)) {
      deleteColumnMutation.mutate(col.id!);
    }
  };

  const getStats = () => {
    const stats: Record<string, number> = {};
    columns.forEach(col => { stats[col.column_key] = 0; });
    entries.forEach(entry => {
      columns.forEach(col => {
        if (entry.column_values[col.column_key] === true) stats[col.column_key]++;
      });
    });
    return stats;
  };

  const stats = getStats();

  if (columnsLoading || entriesLoading || reflectionsLoading) {
    return <div className="text-center py-12">Loading tracker...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-wrap gap-3 mb-6 justify-between items-center">
        <div className="flex gap-3">
          <button onClick={handleSaveAll} disabled={saveEntriesMutation.isPending} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg">
            <Save size={18} /> Save All Progress
          </button>
          <button onClick={downloadImage} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg">
            <Image size={18} /> Download Image
          </button>
        </div>
        <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg">
          <Download size={18} /> Print/Save PDF
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
        {columns.map(col => (
          <div key={col.column_key} className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-3 text-white">
            <div className="text-xs opacity-90">{col.display_name}</div>
            <div className="text-2xl font-bold">{stats[col.column_key]}/30</div>
          </div>
        ))}
      </div>

      {/* Column Management */}
      <div className="mb-4 flex flex-wrap gap-2 items-center">
        <button onClick={addColumn} className="flex items-center gap-1 text-sm bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg">
          <Plus size={14} /> Add Column
        </button>
        <span className="text-xs text-gray-400">| Click column headers to rename/delete</span>
      </div>

      <div id="tracker-content" className="bg-white rounded-2xl p-6 overflow-x-auto">
        <h2 className="text-2xl font-bold mb-6 text-center">30-Day Progress Tracker</h2>
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b-2 border-gray-200">
              <th className="p-3 text-left font-semibold text-sm">Day</th>
              {columns.map(col => (
                <th key={col.column_key} className="p-3 text-center font-semibold text-sm group relative">
                  <div className="flex items-center justify-center gap-1">
                    {col.display_name}
                    <button onClick={() => renameColumn(col)} className="opacity-0 group-hover:opacity-100 transition p-1">
                      <Edit2 size={12} className="text-gray-400" />
                    </button>
                    <button onClick={() => deleteColumn(col)} className="opacity-0 group-hover:opacity-100 transition p-1">
                      <Trash2 size={12} className="text-red-400" />
                    </button>
                  </div>
                </th>
              ))}
              <th className="p-3 text-left font-semibold text-sm">Notes</th>
             </tr>
          </thead>
          <tbody>
            {Array.from({ length: 30 }, (_, i) => i + 1).map(day => {
              const entry = entries.get(day);
              if (!entry) return null;
              return (
                <tr key={day} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="p-3 font-medium">Day {day}</td>
                  {columns.map(col => (
                    <td key={col.column_key} className="p-3 text-center">
                      <button
                        onClick={() => updateEntryValue(day, col.column_key, !entry.column_values[col.column_key])}
                        className={`w-8 h-8 rounded-full transition ${entry.column_values[col.column_key] ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'}`}
                      >
                        {entry.column_values[col.column_key] ? '✓' : '○'}
                      </button>
                    </td>
                  ))}
                  <td className="p-3">
                    <input
                      type="text"
                      value={entry.notes}
                      onChange={(e) => updateEntryNotes(day, e.target.value)}
                      placeholder="..."
                      className="w-full px-2 py-1 text-sm border border-gray-200 rounded"
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Weekly Reflections (same as before) */}
        <div className="mt-12">
          <h3 className="text-xl font-bold mb-6">Weekly Reflections</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {reflections.map((ref, idx) => (
              <div key={idx} className="border border-gray-200 rounded-xl p-5">
                <h4 className="font-semibold text-lg mb-3 text-blue-600">Week {ref.week_number}</h4>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium">What improved?</label>
                    <textarea value={ref.improved} onChange={(e) => { const newRef = [...reflections]; newRef[idx].improved = e.target.value; setReflections(newRef); }} rows={2} className="w-full mt-1 px-3 py-2 border rounded-lg" />
                  </div>
                  <div>
                    <label className="text-sm font-medium">What failed?</label>
                    <textarea value={ref.failed} onChange={(e) => { const newRef = [...reflections]; newRef[idx].failed = e.target.value; setReflections(newRef); }} rows={2} className="w-full mt-1 px-3 py-2 border rounded-lg" />
                  </div>
                  <div>
                    <label className="text-sm font-medium">What to change next week?</label>
                    <textarea value={ref.change_next_week} onChange={(e) => { const newRef = [...reflections]; newRef[idx].change_next_week = e.target.value; setReflections(newRef); }} rows={2} className="w-full mt-1 px-3 py-2 border rounded-lg" />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <button onClick={handleSaveReflections} className="mt-6 flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg">
            <Save size={18} /> Save Reflections
          </button>
        </div>
      </div>
    </div>
  );
}