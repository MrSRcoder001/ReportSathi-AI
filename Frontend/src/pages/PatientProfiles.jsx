import React, { useContext, useState } from 'react';
import { ProfileContext } from '../context/ProfileContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { UserPlus, User, Trash2, Edit2 } from 'lucide-react';
import api from '../services/api';

const PatientProfiles = () => {
  const { profiles, fetchProfiles, activeProfile, changeActiveProfile } = useContext(ProfileContext);
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({ profileName: '', relation: 'Self', age: '', gender: 'Male', bloodGroup: 'Unknown', conditions: '', allergies: '', medications: '', doctorNotes: '' });

  const relations = ['Self', 'Father', 'Mother', 'Brother', 'Sister', 'Son', 'Daughter', 'Grandfather', 'Grandmother', 'Other'];
  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        conditions: formData.conditions.split(',').map(s => s.trim()).filter(Boolean),
        allergies: formData.allergies.split(',').map(s => s.trim()).filter(Boolean),
        medications: formData.medications.split(',').map(s => s.trim()).filter(Boolean)
      };
      await api.post('/profiles', payload);
      setIsAdding(false);
      setFormData({ profileName: '', relation: 'Self', age: '', gender: 'Male', bloodGroup: 'Unknown', conditions: '', allergies: '', medications: '', doctorNotes: '' });
      fetchProfiles();
    } catch (error) {
      console.error('Failed to create profile', error);
      alert('Error creating profile');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this profile and all its reports?')) {
      try {
        await api.delete(`/profiles/${id}`);
        fetchProfiles();
      } catch (error) {
        console.error('Failed to delete profile', error);
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Family Profiles</h1>
        <Button onClick={() => setIsAdding(!isAdding)} className="gap-2 w-full sm:w-auto">
          <UserPlus className="h-4 w-4" /> Add Profile
        </Button>
      </div>

      {isAdding && (
        <Card className="border-2 border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle>Add New Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Name</label>
                  <input required value={formData.profileName} onChange={e => setFormData({...formData, profileName: e.target.value})} className="w-full p-2 border rounded" placeholder="John Doe" />
                </div>
                <div>
                  <label className="text-sm font-medium">Relation</label>
                  <select value={formData.relation} onChange={e => setFormData({...formData, relation: e.target.value})} className="w-full p-2 border rounded">
                    {relations.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Age</label>
                  <input type="number" required value={formData.age} onChange={e => setFormData({...formData, age: e.target.value})} className="w-full p-2 border rounded" />
                </div>
                <div>
                  <label className="text-sm font-medium">Gender</label>
                  <select value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})} className="w-full p-2 border rounded">
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Blood Group</label>
                  <select value={formData.bloodGroup} onChange={e => setFormData({...formData, bloodGroup: e.target.value})} className="w-full p-2 border rounded">
                    {bloodGroups.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Allergies (comma-separated)</label>
                  <input value={formData.allergies} onChange={e => setFormData({...formData, allergies: e.target.value})} className="w-full p-2 border rounded" placeholder="e.g. Penicillin, Peanuts" />
                </div>
                <div>
                  <label className="text-sm font-medium">Chronic Conditions (comma-separated)</label>
                  <input value={formData.conditions} onChange={e => setFormData({...formData, conditions: e.target.value})} className="w-full p-2 border rounded" placeholder="e.g. Diabetes, Hypertension" />
                </div>
                <div>
                  <label className="text-sm font-medium">Current Medications (comma-separated)</label>
                  <input value={formData.medications} onChange={e => setFormData({...formData, medications: e.target.value})} className="w-full p-2 border rounded" placeholder="e.g. Metformin 500mg" />
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-medium">Personal Doctor Notes</label>
                  <textarea value={formData.doctorNotes} onChange={e => setFormData({...formData, doctorNotes: e.target.value})} className="w-full p-2 border rounded" placeholder="Specific notes from your physician or health concerns..." rows={2} />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsAdding(false)}>Cancel</Button>
                <Button type="submit">Save Profile</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {profiles.map(profile => (
          <Card key={profile._id} className={`cursor-pointer transition-all ${activeProfile?._id === profile._id ? 'ring-2 ring-primary border-primary' : 'hover:border-primary/50'}`} onClick={() => changeActiveProfile(profile._id)}>
            <CardContent className="p-6 space-y-4">
              <div className="flex justify-between items-start">
                <div className={`p-3 rounded-full ${activeProfile?._id === profile._id ? 'bg-primary text-white' : 'bg-slate-100 text-slate-500'}`}>
                  <User className="h-6 w-6" />
                </div>
                <div className="flex gap-2">
                  <button onClick={(e) => { e.stopPropagation(); handleDelete(profile._id); }} className="p-1 text-slate-400 hover:text-danger"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
              <div>
                <h3 className="font-bold text-lg text-slate-900">{profile.profileName}</h3>
                <p className="text-sm text-slate-500 font-medium">{profile.relation}</p>
              </div>
              
              <div className="grid grid-cols-3 gap-2 text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border">
                <div><span className="text-slate-400 text-[10px] block uppercase font-semibold">Age</span> {profile.age || '-'}</div>
                <div><span className="text-slate-400 text-[10px] block uppercase font-semibold">Gender</span> {profile.gender || '-'}</div>
                <div><span className="text-slate-400 text-[10px] block uppercase font-semibold">Blood</span> {profile.bloodGroup || '-'}</div>
              </div>

              {(profile.conditions?.length > 0 || profile.allergies?.length > 0) && (
                <div className="text-xs space-y-1">
                  {profile.conditions?.length > 0 && (
                    <div><span className="text-slate-400 block font-semibold">Chronic Conditions:</span> <span className="text-slate-700">{profile.conditions.join(', ')}</span></div>
                  )}
                  {profile.allergies?.length > 0 && (
                    <div><span className="text-slate-400 block font-semibold">Allergies:</span> <span className="text-slate-700">{profile.allergies.join(', ')}</span></div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
        
        {!isAdding && profiles.length === 0 && (
          <div className="col-span-full text-center p-12 text-slate-500 bg-slate-50 rounded-xl border-2 border-dashed">
            No profiles found. Create a "Self" profile to get started!
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientProfiles;
