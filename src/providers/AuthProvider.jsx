import { useState, useEffect } from "react";
import PropTypes from 'prop-types';
import AuthContext from "../context/AuthContext";
import { loginUser, storeUserData, getUserData, clearUserData } from '../services/authService';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userData = getUserData();
    if (userData) {
      setUser(userData);
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const { success, data } = await loginUser(email, password);
    
    if (success) {
      storeUserData(data);
      setUser({ ...data.user, refresh: data.refresh, access: data.access });
      return { success: true, user: data.user };
    }
    
    return { success: false };
  };

  const logout = () => {
    clearUserData();
    setUser(null);
  };

  const value = {
    user,
    login,
    logout,
    loading,
    isAuthenticated: !!user
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired
};

export default AuthProvider;