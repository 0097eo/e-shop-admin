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
  const { user } = useAuth();

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

  const renderOrdersTable = () => {
    return (
      <div className="overflow-x-auto">
        <table className="min-w-full bg-gray-900 rounded-lg shadow border border-gray-700">
          <thead>
            <tr className="border-b border-gray-700">
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer" 
                onClick={() => requestSort('id')}
              >
                <div className="flex items-center">
                  Order ID
                  {sortConfig.key === 'id' && (
                    sortConfig.direction === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />
                  )}
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer" 
                onClick={() => requestSort('user_email')}
              >
                <div className="flex items-center">
                  Customer
                  {sortConfig.key === 'user_email' && (
                    sortConfig.direction === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />
                  )}
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer" 
                onClick={() => requestSort('total_price')}
              >
                <div className="flex items-center">
                  Total
                  {sortConfig.key === 'total_price' && (
                    sortConfig.direction === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />
                  )}
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {sortedData.map((order) => (
              <tr key={order.id} className="hover:bg-gray-800">
                <td className="px-6 py-4 whitespace-nowrap text-gray-300">{order.id}</td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-300">{order.user_email}</td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-300">{formatCurrency(order.total_price)}</td>
                <td className="px-6 py-4 whitespace-nowrap">
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
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex space-x-2">
                    <div className="relative">
                      <button
                        onClick={() => setStatusUpdateOrder(order)}
                        className="text-teal-400 hover:text-teal-300 flex items-center"
                      >
                        <Edit size={18} className="mr-1" /> Update
                      </button>
                      {statusUpdateOrder?.id === order.id && (
                        <div className="absolute z-10 right-0 mt-2 w-48 bg-gray-900 border border-gray-700 rounded-md shadow-lg">
                          <ul className="py-1">
                            {['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'].map((status) => (
                              <li 
                                key={status}
                                onClick={() => handleStatusUpdate(status)}
                                className="px-4 py-2 hover:bg-gray-800 cursor-pointer text-gray-300"
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
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {sortedData.length === 0 && !loading && (
              <tr>
                <td colSpan="5" className="px-6 py-4 text-center text-gray-400">
                  No orders available
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="bg-gray-900 min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-200 mb-2">Orders Dashboard</h1>
          <p className="text-gray-400">Manage and track your customer orders</p>
        </div>

        <div className="flex flex-wrap justify-between items-center mb-6 gap-3">
          <div className="flex flex-wrap gap-2">
            <button
              className="px-4 py-2 border border-gray-600 text-gray-300 rounded-md hover:bg-gray-900 flex items-center"
              onClick={fetchOrders}
            >
              <RefreshCw size={16} className="mr-2" />
              Refresh
            </button>
            {orders.length > 0 && (
              <button
                className="px-4 py-2 border border-gray-600 text-gray-300 rounded-md hover:bg-gray-900 flex items-center"
                onClick={handleExportPDF}
              >
                <Download size={16} className="mr-2" />
                Export PDF
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="bg-red-900/30 border border-red-700 text-red-300 px-4 py-3 rounded mb-4" data-testid="error-message">
            {error}
          </div>
        )}

        {loading && (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-teal-500" role='status'>
              <span className="sr-only">Loading...</span>
            </div>
          </div>
        )}

        {!loading && renderOrdersTable()}
      </div>
    </div>
  );
};

export default Orders;