import React, { useState, useEffect, useCallback } from 'react';
import { 
  Edit, 
  Trash2, 
  ChevronUp, 
  ChevronDown, 
  RefreshCw, 
  Download, 
} from 'lucide-react';
import axios from 'axios';
import useAuth from '../hooks/useAuth';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusUpdateOrder, setStatusUpdateOrder] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: 'id', direction: 'desc' });
  const [isMobile, setIsMobile] = useState(false);
  const { user } = useAuth();

  // Media query hook for responsive rendering
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const getAuthConfig = useCallback(() => {
    return {
      headers: {
        'Authorization': `Bearer ${user.access}`
      }
    };
  }, [user]);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get('/api/orders/orders/', getAuthConfig());
      setOrders(response.data);
    } catch (err) {
      setError('Failed to fetch orders');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [getAuthConfig]);

  const handleStatusUpdate = async (newStatus) => {
    if (!statusUpdateOrder) return;

    try {
      const response = await axios.put(
        `/api/orders/orders/${statusUpdateOrder.id}/status/`, 
        { status: newStatus },
        getAuthConfig()
      );
      
      setOrders(orders.map(order => 
        order.id === response.data.id ? response.data : order
      ));
      
      setStatusUpdateOrder(null);
    } catch (err) {
      setError('Failed to update order status');
      console.error(err);
    }
  };

  const handleDeleteOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to delete this order?')) {
      return;
    }

    try {
      await axios.delete(`/api/orders/orders/${orderId}/delete/`, getAuthConfig());
      setOrders(orders.filter(order => order.id !== orderId));
    } catch (err) {
      setError('Failed to delete order');
      console.error(err);
    }
  };

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedData = React.useMemo(() => {
    let sortableItems = [...orders];
    if (sortConfig.key) {
      sortableItems.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [orders, sortConfig]);

  useEffect(() => {
    if (user && user.access) {
      fetchOrders();
    }
  }, [user, fetchOrders]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'KES'
    }).format(amount);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    
    // Set the title of the document
    doc.setFontSize(18);
    doc.text('Orders Report', 14, 22);
    
    // Add current date
    const currentDate = new Date().toLocaleDateString();
    doc.setFontSize(10);
    doc.text(`Generated on: ${currentDate}`, 14, 30);
    
    // Prepare table data
    const tableData = sortedData.map(order => [
      order.id,
      order.user_email,
      formatCurrency(order.total_price),
      order.status
    ]);

    // Use autoTable directly as a function
    autoTable(doc, {
      startY: 40,
      head: [['Order ID', 'Customer', 'Total', 'Status']],
      body: tableData,
      theme: 'striped',
      styles: {
        fontSize: 10,
      },
      headStyles: {
        fillColor: [40, 40, 40],
        textColor: 200,
      },
      alternateRowStyles: {
        fillColor: [250, 250, 250]
      },
      columnStyles: {
        0: { cellWidth: 30 },
        1: { cellWidth: 60 },
        2: { cellWidth: 40 },
        3: { cellWidth: 40 }
      }
    });

    doc.save(`orders_report_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  // Mobile card view for orders
  const renderMobileCards = () => {
    return (
      <div className="space-y-4">
        {sortedData.map((order) => (
          <div key={order.id} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <div className="flex justify-between items-start mb-3">
              <div>
                <div className="text-xs text-gray-400 mb-1">Order ID</div>
                <div className="text-lg font-semibold text-gray-200">#{order.id}</div>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                {
                  'PENDING': 'bg-yellow-900/30 text-yellow-400',
                  'PROCESSING': 'bg-blue-900/30 text-blue-400',
                  'SHIPPED': 'bg-green-900/30 text-green-400',
                  'DELIVERED': 'bg-purple-900/30 text-purple-400',
                  'CANCELLED': 'bg-red-900/30 text-red-400'
                }[order.status] || 'bg-gray-900/30 text-gray-400'
              }`}>
                {order.status}
              </span>
            </div>
            
            <div className="space-y-2 mb-4">
              <div>
                <div className="text-xs text-gray-400">Customer</div>
                <div className="text-sm text-gray-200 truncate">{order.user_email}</div>
              </div>
              <div>
                <div className="text-xs text-gray-400">Total</div>
                <div className="text-sm font-medium text-gray-200">{formatCurrency(order.total_price)}</div>
              </div>
            </div>
            
            <div className="flex gap-2 pt-3 border-t border-gray-700">
              <div className="relative flex-1">
                <button
                  onClick={() => setStatusUpdateOrder(statusUpdateOrder?.id === order.id ? null : order)}
                  className="w-full px-3 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 flex items-center justify-center text-sm"
                >
                  <Edit size={16} className="mr-1" /> Update Status
                </button>
                {statusUpdateOrder?.id === order.id && (
                  <div className="absolute z-10 left-0 right-0 mt-2 bg-gray-900 border border-gray-700 rounded-md shadow-lg">
                    <ul className="py-1">
                      {['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'].map((status) => (
                        <li 
                          key={status}
                          onClick={() => handleStatusUpdate(status)}
                          className="px-4 py-2 hover:bg-gray-800 cursor-pointer text-gray-300 text-sm"
                        >
                          {status}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              <button
                onClick={() => handleDeleteOrder(order.id)}
                disabled={order.status !== 'PENDING'}
                className="px-3 py-2 bg-red-900/30 text-red-400 rounded-md hover:bg-red-900/50 disabled:bg-gray-800 disabled:text-gray-600 disabled:cursor-not-allowed"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
        {sortedData.length === 0 && !loading && (
          <div className="text-center py-8 text-gray-400">
            No orders available
          </div>
        )}
      </div>
    );
  };

  const renderOrdersTable = () => {
    return (
      <div className="overflow-x-auto -mx-4 sm:mx-0">
        <div className="inline-block min-w-full align-middle">
          <div className="overflow-hidden">
            <table className="min-w-full bg-gray-900 sm:rounded-lg shadow border-y sm:border border-gray-700">
              <thead>
                <tr className="border-b border-gray-700">
                  <th 
                    className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer" 
                    onClick={() => requestSort('id')}
                  >
                    <div className="flex items-center">
                      Order ID
                      {sortConfig.key === 'id' && (
                        sortConfig.direction === 'asc' ? <ChevronUp size={14} className="sm:w-4 sm:h-4" /> : <ChevronDown size={14} className="sm:w-4 sm:h-4" />
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer" 
                    onClick={() => requestSort('user_email')}
                  >
                    <div className="flex items-center">
                      Customer
                      {sortConfig.key === 'user_email' && (
                        sortConfig.direction === 'asc' ? <ChevronUp size={14} className="sm:w-4 sm:h-4" /> : <ChevronDown size={14} className="sm:w-4 sm:h-4" />
                      )}
                    </div>
                  </th>
                  <th 
                    className="hidden md:table-cell px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer" 
                    onClick={() => requestSort('total_price')}
                  >
                    <div className="flex items-center">
                      Total
                      {sortConfig.key === 'total_price' && (
                        sortConfig.direction === 'asc' ? <ChevronUp size={14} className="sm:w-4 sm:h-4" /> : <ChevronDown size={14} className="sm:w-4 sm:h-4" />
                      )}
                    </div>
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {sortedData.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-800">
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-300">
                      #{order.id}
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-300 max-w-[120px] sm:max-w-[200px] truncate">
                      {order.user_email}
                    </td>
                    <td className="hidden md:table-cell px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-300">
                      {formatCurrency(order.total_price)}
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        {
                          'PENDING': 'bg-yellow-900/30 text-yellow-400',
                          'PROCESSING': 'bg-blue-900/30 text-blue-400',
                          'SHIPPED': 'bg-green-900/30 text-green-400',
                          'DELIVERED': 'bg-purple-900/30 text-purple-400',
                          'CANCELLED': 'bg-red-900/30 text-red-400'
                        }[order.status] || 'bg-gray-900/30 text-gray-400'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      <div className="flex space-x-2">
                        <div className="relative">
                          <button
                            onClick={() => setStatusUpdateOrder(statusUpdateOrder?.id === order.id ? null : order)}
                            className="text-teal-400 hover:text-teal-300 flex items-center text-xs sm:text-sm"
                          >
                            <Edit size={16} className="sm:w-[18px] sm:h-[18px] mr-1" />
                            <span className="hidden sm:inline">Update</span>
                          </button>
                          {statusUpdateOrder?.id === order.id && (
                            <div className="absolute z-10 right-0 mt-2 w-40 sm:w-48 bg-gray-900 border border-gray-700 rounded-md shadow-lg">
                              <ul className="py-1">
                                {['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'].map((status) => (
                                  <li 
                                    key={status}
                                    onClick={() => handleStatusUpdate(status)}
                                    className="px-4 py-2 hover:bg-gray-800 cursor-pointer text-gray-300 text-xs sm:text-sm"
                                  >
                                    {status}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => handleDeleteOrder(order.id)}
                          disabled={order.status !== 'PENDING'}
                          className="text-red-400 hover:text-red-300 disabled:text-gray-600 disabled:cursor-not-allowed"
                        >
                          <Trash2 size={16} className="sm:w-[18px] sm:h-[18px]" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {sortedData.length === 0 && !loading && (
                  <tr>
                    <td colSpan="5" className="px-3 sm:px-6 py-4 text-center text-gray-400 text-sm">
                      No orders available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-gray-900 min-h-screen">
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        <div className="mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-200 mb-1 sm:mb-2">Orders Dashboard</h1>
          <p className="text-sm sm:text-base text-gray-400">Manage and track your customer orders</p>
        </div>

        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 sm:mb-6 gap-3">
          <div className="flex flex-wrap gap-2">
            <button
              className="flex-1 sm:flex-none px-3 sm:px-4 py-2 border border-gray-600 text-gray-300 rounded-md hover:bg-gray-900 flex items-center justify-center text-xs sm:text-sm"
              onClick={fetchOrders}
            >
              <RefreshCw size={14} className="mr-1 sm:mr-2 sm:w-4 sm:h-4" />
              Refresh
            </button>
            {orders.length > 0 && (
              <button
                className="flex-1 sm:flex-none px-3 sm:px-4 py-2 border border-gray-600 text-gray-300 rounded-md hover:bg-gray-900 flex items-center justify-center text-xs sm:text-sm"
                onClick={handleExportPDF}
              >
                <Download size={14} className="mr-1 sm:mr-2 sm:w-4 sm:h-4" />
                Export PDF
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="bg-red-900/30 border border-red-700 text-red-300 px-3 py-2 sm:px-4 sm:py-3 rounded mb-4 text-sm" data-testid="error-message">
            {error}
          </div>
        )}

        {loading && (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 sm:h-10 sm:w-10 border-t-2 border-b-2 border-teal-500" role='status'>
              <span className="sr-only">Loading...</span>
            </div>
          </div>
        )}

        {!loading && (
          isMobile ? renderMobileCards() : renderOrdersTable()
        )}
      </div>
    </div>
  );
};

export default Orders;