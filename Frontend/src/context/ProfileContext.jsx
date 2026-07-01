import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';
import { AuthContext } from './AuthContext';

export const ProfileContext = createContext();

export const ProfileProvider = ({ children }) => {
  const { user } = useContext(AuthContext);
  const [profiles, setProfiles] = useState([]);
  const [activeProfile, setActiveProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchProfiles();
    } else {
      setProfiles([]);
      setActiveProfile(null);
      setLoading(false);
    }
  }, [user]);

  const fetchProfiles = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/profiles');
      setProfiles(data);
      if (data.length > 0 && !activeProfile) {
        // Set the "Self" profile as default, or the first one
        const selfProfile = data.find(p => p.relation === 'Self');
        setActiveProfile(selfProfile || data[0]);
      }
    } catch (error) {
      console.error('Failed to fetch profiles:', error);
    } finally {
      setLoading(false);
    }
  };

  const changeActiveProfile = (profileId) => {
    const selected = profiles.find(p => p._id === profileId);
    if (selected) {
      setActiveProfile(selected);
    }
  };

  return (
    <ProfileContext.Provider value={{ profiles, activeProfile, loading, fetchProfiles, changeActiveProfile }}>
      {children}
    </ProfileContext.Provider>
  );
};
