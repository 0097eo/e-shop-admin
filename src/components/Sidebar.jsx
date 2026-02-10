import {useContext} from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  LogOut,
  ShoppingBasket,
  ShoppingBag,
  TrendingUp,
  X
} from 'lucide-react';
import AuthContext from '../context/AuthContext';
import logoImage from '../assets/logo.png';

const Sidebar = ({ onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useContext(AuthContext);

  const handleClick = () => {
    logout()
    navigate('/login');
  };
  
  const menuItems = [
    { text: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { text: 'Product Performance', icon: TrendingUp, path: '/products' },
    { text: 'Orders', icon: ShoppingBag, path: '/orders' },
    { text: 'Products', icon: ShoppingBasket, path: '/product-management' },
  ];

  return (
    <div className="w-64 bg-gray-900 h-full flex flex-col">
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <div className="flex items-center">
          <img src={logoImage} alt="Logo" className="h-8 w-auto mr-2" />
          <div className="text-gray-200 font-semibold">Ideal Admin</div>
        </div>
        <button
          onClick={onClose}
          className="lg:hidden text-gray-400 hover:text-gray-200 p-1"
        >
          <X className="w-6 h-6" />
        </button>
      </div>
      
      <nav className="mt-6 flex-grow">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.text}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center px-4 py-3 text-sm ${
                isActive 
                  ? 'bg-teal-500/20 text-teal-500 rounded-md' 
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <item.icon className={`w-5 h-5 mr-3 ${isActive ? 'text-teal-500' : ''}`} />
              <span>{item.text}</span>
            </button>
          );
        })}
      </nav>
      
      <div className="mt-auto mb-6 px-4">
        <button
          onClick={handleClick}
          className="w-full flex items-center px-4 py-3 text-gray-400 hover:text-gray-200"
        >
          <LogOut className="w-5 h-5 mr-3" />
          <span>Signout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;