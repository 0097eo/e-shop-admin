import React, { useContext } from 'react';
import AuthContext from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Header = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleClick = () => {
    logout()
    navigate('/login');
  };

  return (
    <header className="bg-gray-900 shadow-sm p-4 flex justify-between items-center border-b border-gray-800">
      <div className="flex items-center">
      </div>
      {user && (
        <div className="flex items-center space-x-4">
          <span className="text-gray-400">Welcome, {user.email}</span>
          <button
            onClick={handleClick}
            className="px-4 py-2 bg-gray-800 text-gray-300 rounded hover:bg-gray-700 transition-colors"
          >
            Logout
          </button>
        </div>
      )}
    </header>
  );
};

export default Header;