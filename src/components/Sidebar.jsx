import {useContext} from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  LogOut,
  ShoppingBasket
} from 'lucide-react';
import AuthContext from '../context/AuthContext';


const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useContext(AuthContext);

  const handleClick = () => {
    logout()
    navigate('/login');
  };
  
  const menuItems = [
    { text: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { text: 'Products', icon: ShoppingBasket, path: '/products' },
    // { text: 'Leaderboard', icon: Trophy, path: '/leaderboard' },
    // { text: 'Order', icon: ShoppingBag, path: '/orders' },
    // { text: 'Product', icon: ShoppingCart, path: '/products' },
    // { text: 'Sales Report', icon: BarChart2, path: '/sales-report' },
    // { text: 'Message', icon: MessageSquare, path: '/messages' },
    // { text: 'Settings', icon: Settings, path: '/settings' },
    // { text: 'Favourite', icon: Star, path: '/favourites' },
    // { text: 'History', icon: History, path: '/history' },
  ];

  return (
    <div className="w-64 bg-gray-900 h-full flex flex-col">
      <div className="h-8 flex items-center px-4 pt-4">
        <div className="text-gray-200 font-semibold">EShop Admin</div>
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
                  ? 'bg-teal-500/20 text-teal-500 rounded-md mx-2' 
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <item.icon className={`w-5 h-5 mr-3 ${isActive ? 'text-teal-500' : ''}`} />
              <span>{item.text}</span>
            </button>
          );
        })}
      </nav>
      
      {/* Signout button at bottom */}
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