import React, { useContext } from 'react';
import AuthContext from '../context/AuthContext';
import { Menu } from 'lucide-react';


const Header = ({ onMenuClick }) => {
  const { user } = useContext(AuthContext);
  
  const getInitial = (email) => {
    return email ? email.charAt(0).toUpperCase() : '';
  };
  
  return (
    <header className="bg-gray-900 shadow-sm p-4 flex justify-between items-center border-b border-gray-800">
      <div className="flex items-center">
        <button
          onClick={onMenuClick}
          className="md:hidden text-gray-400 hover:text-gray-200 mr-4"
        >
          <Menu className="w-6 h-6" />
        </button>
      </div>
      {user && (
        <div className="flex items-center space-x-4">
          <div 
            className="w-8 h-8 rounded-full bg-teal-600 flex items-center justify-center text-white font-semibold text-lg"
            title={user.email}
            data-testid="user-avatar"
          >
            {getInitial(user.email)}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;