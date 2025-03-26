import React, { useContext } from 'react';
import AuthContext from '../context/AuthContext';


const Header = () => {
  const { user } = useContext(AuthContext);
  
  return (
    <header className="bg-gray-900 shadow-sm p-4 flex justify-between items-center border-b border-gray-800">
      <div className="flex items-center">
      </div>
      {user && (
        <div className="flex items-center space-x-4">
          <span className="text-gray-400">Welcome, {user.email}</span>
        </div>
      )}
    </header>
  );
};

export default Header;