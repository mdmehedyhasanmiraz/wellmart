"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { toast } from "react-hot-toast";

const LOCATIONS = [
  { value: "header", label: "Header (<head>)" },
  { value: "body", label: "Body (start of <body>)" },
  { value: "footer", label: "Footer (before </body>)" },
];

export default function CodeSnippetsPage() {
  const supabase = createClient();
  const [snippets, setSnippets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    id: '',
    name: '',
    location: 'header',
    code: '',
  });
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSnippets();
  }, []);

  const fetchSnippets = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('code_snippets').select('*').order('created_at', { ascending: false });
    if (data) setSnippets(data);
    setLoading(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleEdit = (snippet: any) => {
    setForm({
      id: snippet.id,
      name: snippet.name,
      location: snippet.location,
      code: snippet.code,
    });
    setIsEditing(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this code snippet?')) return;
    const { error } = await supabase.from('code_snippets').delete().eq('id', id);
    if (!error) {
      toast.success('Snippet deleted');
      fetchSnippets();
    } else {
      toast.error('Failed to delete');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (!form.name.trim() || !form.code.trim()) {
        toast.error('Name and code are required');
        setSaving(false);
        return;
      }
      if (isEditing) {
        const { error } = await supabase.from('code_snippets').update({
          name: form.name,
          location: form.location,
          code: form.code,
          updated_at: new Date().toISOString(),
        }).eq('id', form.id);
        if (error) throw error;
        toast.success('Snippet updated');
      } else {
        const { error } = await supabase.from('code_snippets').insert({
          name: form.name,
          location: form.location,
          code: form.code,
        });
        if (error) throw error;
        toast.success('Snippet added');
      }
      setForm({ id: '', name: '', location: 'header', code: '' });
      setIsEditing(false);
      fetchSnippets();
    } catch (error) {
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Code Snippets</h1>
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 mb-8 space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Name</label>
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleInputChange}
            className="w-full border border-gray-300 rounded px-3 py-2"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Location</label>
          <select
            name="location"
            value={form.location}
            onChange={handleInputChange}
            className="w-full border border-gray-300 rounded px-3 py-2"
          >
            {LOCATIONS.map(loc => (
              <option key={loc.value} value={loc.value}>{loc.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Code</label>
          <textarea
            name="code"
            value={form.code}
            onChange={handleInputChange}
            className="w-full border border-gray-300 rounded px-3 py-2 font-mono"
            rows={5}
            required
          />
        </div>
        <div className="flex gap-2">
          <button type="submit" disabled={saving} className="px-6 py-2 bg-lime-600 text-white font-semibold rounded shadow hover:bg-lime-700 disabled:opacity-50">
            {isEditing ? (saving ? 'Saving...' : 'Update') : (saving ? 'Saving...' : 'Add')}
          </button>
          {isEditing && (
            <button type="button" onClick={() => { setForm({ id: '', name: '', location: 'header', code: '' }); setIsEditing(false); }} className="px-4 py-2 bg-gray-200 rounded">Cancel</button>
          )}
        </div>
      </form>
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">All Snippets</h2>
        {loading ? <div>Loading...</div> : snippets.length === 0 ? <div>No snippets found.</div> : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="py-2 text-left">Name</th>
                <th className="py-2 text-left">Location</th>
                <th className="py-2 text-left">Code</th>
                <th className="py-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {snippets.map(snippet => (
                <tr key={snippet.id} className="border-b">
                  <td className="py-2 font-medium">{snippet.name}</td>
                  <td className="py-2">{snippet.location}</td>
                  <td className="py-2 max-w-xs truncate"><pre className="whitespace-pre-wrap break-words text-xs bg-gray-50 p-2 rounded">{snippet.code.slice(0, 200)}{snippet.code.length > 200 ? '...' : ''}</pre></td>
                  <td className="py-2">
                    <button onClick={() => handleEdit(snippet)} className="text-blue-600 hover:underline mr-2">Edit</button>
                    <button onClick={() => handleDelete(snippet.id)} className="text-red-600 hover:underline">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
} 