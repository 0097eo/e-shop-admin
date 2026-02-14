import React, { useState, useEffect, useCallback } from 'react';
import { Table, ChevronDown, ChevronUp, BarChart2, Trash2, Edit, Calendar, Search, RefreshCw, Download, X, PieChart, LineChart, Activity } from 'lucide-react';
import { LineChart as RechartsLineChart, Line, BarChart, Bar, PieChart as RechartsPieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import axios from 'axios';
import useAuth from '../hooks/useAuth';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const Products = () => {
  const [productPerformance, setProductPerformance] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentView, setCurrentView] = useState('list');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [formData, setFormData] = useState({
    date: '',
    product: '',
    units_sold: 0,
    revenue: 0,
    average_rating: 0
  });
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });
  const [reportParams, setReportParams] = useState({
    start_date: '',
    end_date: ''
  });
  const [activeChart, setActiveChart] = useState('revenue');
  const {user, logout} = useAuth();
  
  const COLORS = ['#00C49F', '#0088FE', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];
  
  const getAuthConfig = useCallback(() => {
    return {
      headers: {
        'Authorization': `Bearer ${user.access}`
      }
    };
  }, [user]);

  const exportToPDF = () => {
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(18);
    doc.text('Product Performance Report', 14, 22);
    
    // Add current date
    const currentDate = new Date().toLocaleDateString();
    doc.setFontSize(10);
    doc.text(`Generated on: ${currentDate}`, 14, 30);

    // Prepare table data
    const tableData = sortedData.map(item => [
      new Date(item.date).toLocaleDateString(),
      item.product_name || `Product ID: ${item.product}`,
      item.units_sold.toLocaleString(),
      formatCurrency(item.revenue),
      formatRating(item.average_rating)
    ]);

    // Generate table
    autoTable(doc, {
      startY: 40,
      head: [['Date', 'Product', 'Units Sold', 'Revenue', 'Avg. Rating']],
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

    // Save the PDF
    doc.save(`orders_report_${new Date().toISOString().split('T')[0]}.pdf`);
  };
  
  const fetchProductPerformance = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get('/api/salesanalysis/product-performance/', getAuthConfig());
      const data = response?.data ?? [];
      setProductPerformance(Array.isArray(data) ? data : []);
    } catch (err) {
      if (err.response && err.response.status === 401) {
        logout();
      }
      setError('Failed to fetch product performance data');
      setProductPerformance([]);
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [logout, getAuthConfig]);

  const fetchProductDetail = async (id) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`/api/salesanalysis/product-performance/${id}/`, getAuthConfig());
      const data = response?.data ?? {};
      setSelectedProduct(data);
      setFormData(data);
    } catch (err) {
      if (err.response && err.response.status === 401) {
        logout();
      }
      setError('Failed to fetch product detail');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async () => {
    if (!reportParams.start_date || !reportParams.end_date) {
      setError('Both start date and end date are required');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await axios.get('/api/salesanalysis/product-performance/report/', {
        params: reportParams,
        ...getAuthConfig()
      });
      const data = response?.data ?? [];
      setProductPerformance(Array.isArray(data) ? data : []);
      setCurrentView('dashboard');
    } catch (err) {
      if (err.response && err.response.status === 401) {
        logout();
      }
      setError('Failed to generate report');
      setProductPerformance([]);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const updateProductPerformance = async () => {
    setLoading(true);
    setError(null);
    try {
      await axios.put(`/api/salesanalysis/product-performance/${selectedProduct.id}/`, formData, getAuthConfig());
      fetchProductPerformance();
      setCurrentView('list');
    } catch (err) {
      if (err.response && err.response.status === 401) {
        logout();
      }
      setError('Failed to update product performance entry');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const deleteProductPerformance = async (id) => {
    if (!window.confirm('Are you sure you want to delete this entry?')) {
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await axios.delete(`/api/salesanalysis/product-performance/${id}/`, getAuthConfig());
      fetchProductPerformance();
    } catch (err) {
      if (err.response && err.response.status === 401) {
        logout();
      }
      setError('Failed to delete product performance entry');
      console.error(err);
    } finally {
      setLoading(false);
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
    let sortableItems = Array.isArray(productPerformance) ? [...productPerformance] : [];
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
  }, [productPerformance, sortConfig]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'date' ? value : Number(value)
    });
  };

  const handleReportParamChange = (e) => {
    const { name, value } = e.target;
    setReportParams({
      ...reportParams,
      [name]: value
    });
  };

  useEffect(() => {
    if (user && user.access) {
      fetchProductPerformance();
    }
  }, [user, fetchProductPerformance]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'KES'
    }).format(amount);
  };

  const formatRating = (rating) => {
    if (rating === null || rating === undefined || isNaN(rating)) {
      return 'N/A';
    }
    return parseFloat(rating).toFixed(1);
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const prepareChartData = () => {
    return sortedData.map(item => ({
      name: formatDate(item.date),
      revenue: item.revenue,
      units: item.units_sold,
      rating: item.average_rating || 0,
      productName: item.product_name || 'Unknown Product'
    }));
  };

  const preparePieChartData = () => {
    const productGroups = {};
    
    sortedData.forEach(item => {
      const productKey = item.product_name || `Product ID ${item.product}`;
      
      if (!productGroups[productKey]) {
        productGroups[productKey] = {
          name: productKey,
          revenue: 0,
          units: 0
        };
      }
      
      productGroups[productKey].revenue += Number(item.revenue) || 0;
      productGroups[productKey].units += Number(item.units_sold) || 0;
    });
    
    const result = Object.values(productGroups);
    
    result.sort((a, b) => b.revenue - a.revenue);
    
    if (result.length === 0) {
      return [
        { name: 'Sample Product A', revenue: 5000, units: 100 },
        { name: 'Sample Product B', revenue: 3000, units: 75 }
      ];
    }
    
    return result.slice(0, 5);
  };

  const renderForm = () => {
    return (
      <div className="bg-gray-900 rounded-lg shadow p-4 sm:p-6 border border-gray-700">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-2">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-200">Edit Product Performance</h2>
        </div>

        {error && (
          <div className="bg-red-900/30 border border-red-700 text-red-300 px-3 py-2 sm:px-4 sm:py-3 rounded mb-4 text-sm sm:text-base">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Date</label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleInputChange}
              className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 text-gray-200 text-sm sm:text-base"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Product ID</label>
            <input
              type="number"
              name="product"
              value={formData.product}
              onChange={handleInputChange}
              className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 text-gray-200 text-sm sm:text-base"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Units Sold</label>
            <input
              type="number"
              name="units_sold"
              value={formData.units_sold}
              onChange={handleInputChange}
              className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 text-gray-200 text-sm sm:text-base"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Revenue</label>
            <input
              type="number"
              name="revenue"
              value={formData.revenue}
              onChange={handleInputChange}
              className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 text-gray-200 text-sm sm:text-base"
              required
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-300 mb-1">Average Rating</label>
            <input
              type="number"
              name="average_rating"
              value={formData.average_rating || 0}
              onChange={handleInputChange}
              step="0.1"
              min="0"
              max="5"
              className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 text-gray-200 text-sm sm:text-base"
            />
          </div>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row sm:justify-end gap-3">
          <button
            className="w-full sm:w-auto px-4 py-2 border border-gray-600 text-gray-300 rounded-md hover:bg-gray-900 text-sm sm:text-base"
            onClick={() => setCurrentView('list')}
          >
            Cancel
          </button>
          <button
            className="w-full sm:w-auto px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 text-sm sm:text-base"
            onClick={updateProductPerformance}
            disabled={loading}
          >
            {loading ? 'Processing...' : 'Update'}
          </button>
        </div>
      </div>
    );
  };

  const renderReportForm = () => {
    return (
      <div className="bg-gray-900 rounded-lg shadow p-4 sm:p-6 border border-gray-700">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-200 mb-4">Generate Product Performance Report</h2>

        {error && (
          <div className="bg-red-900/30 border border-red-700 text-red-300 px-3 py-2 sm:px-4 sm:py-3 rounded mb-4 text-sm sm:text-base">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Start Date</label>
            <input
              type="date"
              name="start_date"
              value={reportParams.start_date}
              onChange={handleReportParamChange}
              className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 text-gray-200 text-sm sm:text-base"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">End Date</label>
            <input
              type="date"
              name="end_date"
              value={reportParams.end_date}
              onChange={handleReportParamChange}
              className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 text-gray-200 text-sm sm:text-base"
              required
            />
          </div>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row sm:justify-end gap-3">
          <button
            className="w-full sm:w-auto px-4 py-2 border border-gray-600 text-gray-300 rounded-md hover:bg-gray-900 text-sm sm:text-base"
            onClick={() => setCurrentView('list')}
          >
            Cancel
          </button>
          <button
            className="w-full sm:w-auto px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 flex items-center justify-center text-sm sm:text-base"
            onClick={generateReport}
            disabled={loading}
          >
            {loading ? 'Generating...' : (
              <>
                <BarChart2 size={16} className="mr-2" />
                Generate Report
              </>
            )}
          </button>
        </div>
      </div>
    );
  };

  const renderDashboard = () => {
    const chartData = prepareChartData();
    const pieData = preparePieChartData();
    
    const getRevenueMaxDomain = () => {
      if (chartData.length === 0) return 1000;
      
      const values = chartData.map(item => item.revenue);
      const max = Math.max(...values);
      return Math.ceil(max * 1.2);
    };
    
    return (
      <div className="space-y-4 sm:space-y-6">
        <div className="bg-gray-900 rounded-lg shadow p-4 sm:p-6 border border-gray-700">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-3">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-200">Performance Trend</h2>
            <div className="flex flex-wrap gap-2">
              <button
                className={`px-3 py-1 rounded-md text-xs sm:text-sm ${activeChart === 'revenue' ? 'bg-teal-600 text-white' : 'border border-gray-600 text-gray-300'}`}
                onClick={() => setActiveChart('revenue')}
              >
                Revenue
              </button>
              <button
                className={`px-3 py-1 rounded-md text-xs sm:text-sm ${activeChart === 'units' ? 'bg-teal-600 text-white' : 'border border-gray-600 text-gray-300'}`}
                onClick={() => setActiveChart('units')}
              >
                Units Sold
              </button>
              <button
                className={`px-3 py-1 rounded-md text-xs sm:text-sm ${activeChart === 'rating' ? 'bg-teal-600 text-white' : 'border border-gray-600 text-gray-300'}`}
                onClick={() => setActiveChart('rating')}
              >
                Ratings
              </button>
            </div>
          </div>
          
          <div className="h-64 sm:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsLineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                <XAxis 
                  dataKey="name" 
                  stroke="#999" 
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis 
                  stroke="#999"
                  tick={{ fontSize: 12 }}
                  domain={activeChart === 'revenue' ? [0, getRevenueMaxDomain()] : activeChart === 'rating' ? [0, 5] : [0, 'auto']}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#f3f4f6', fontSize: 12 }}
                  labelStyle={{ color: '#f3f4f6' }}
                  formatter={(value, name) => {
                    if (name === "Revenue (KES)") return formatCurrency(value);
                    return value;
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                {activeChart === 'revenue' && (
                  <Line 
                    type="monotone" 
                    dataKey="revenue" 
                    name="Revenue (KES)" 
                    stroke="#00C49F" 
                    activeDot={{ r: 8 }} 
                    strokeWidth={2}
                  />
                )}
                {activeChart === 'units' && (
                  <Line 
                    type="monotone" 
                    dataKey="units" 
                    name="Units Sold" 
                    stroke="#0088FE" 
                    activeDot={{ r: 8 }} 
                    strokeWidth={2}
                  />
                )}
                {activeChart === 'rating' && (
                  <Line 
                    type="monotone" 
                    dataKey="rating" 
                    name="Average Rating" 
                    stroke="#FFBB28" 
                    activeDot={{ r: 8 }} 
                    strokeWidth={2}
                  />
                )}
              </RechartsLineChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <div className="bg-gray-900 rounded-lg shadow p-4 sm:p-6 border border-gray-700">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-200 mb-4">Revenue by Product</h2>
            <div className="h-64 sm:h-80">
              <ResponsiveContainer width="100%" height="100%">
              <RechartsPieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  outerRadius={window.innerWidth < 640 ? 60 : 80}
                  fill="#8884d8"
                  dataKey="revenue"
                  nameKey="name"
                  label={({ name, percent }) => {
                    return `${name}: ${(percent * 100).toFixed(0)}%`;
                  }}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value) => formatCurrency(value)}
                  contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#f3f4f6', fontSize: 12 }}
                />
              </RechartsPieChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div className="bg-gray-900 rounded-lg shadow p-4 sm:p-6 border border-gray-700">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-200 mb-4">Units Sold by Product</h2>
            <div className="h-64 sm:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={pieData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                  <XAxis 
                    dataKey="name" 
                    stroke="#999" 
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis stroke="#999" tick={{ fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#f3f4f6', fontSize: 12 }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="units" name="Units Sold" fill="#8884d8">
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        
        <div className="flex justify-center sm:justify-end">
          <button
            className="w-full sm:w-auto px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 flex items-center justify-center text-sm sm:text-base"
            onClick={() => setCurrentView('list')}
          >
            <Table size={16} className="mr-2" />
            View Table Data
          </button>
        </div>
      </div>
    );
  };

  const renderProductPerformanceTable = () => {
    return (
      <div className="overflow-x-auto -mx-4 sm:mx-0">
        <div className="inline-block min-w-full align-middle">
          <div className="overflow-hidden">
            <table className="min-w-full bg-gray-900 sm:rounded-lg shadow border-y sm:border border-gray-700">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer" onClick={() => requestSort('date')}>
                    <div className="flex items-center">
                      Date
                      {sortConfig.key === 'date' && (
                        sortConfig.direction === 'asc' ? <ChevronUp size={14} className="sm:w-4 sm:h-4" /> : <ChevronDown size={14} className="sm:w-4 sm:h-4" />
                      )}
                    </div>
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer" onClick={() => requestSort('product')}>
                    <div className="flex items-center">
                      Product Name
                      {sortConfig.key === 'product' && (
                        sortConfig.direction === 'asc' ? <ChevronUp size={14} className="sm:w-4 sm:h-4" /> : <ChevronDown size={14} className="sm:w-4 sm:h-4" />
                      )}
                    </div>
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer" onClick={() => requestSort('units_sold')}>
                    <div className="flex items-center">
                      Units Sold
                      {sortConfig.key === 'units_sold' && (
                        sortConfig.direction === 'asc' ? <ChevronUp size={14} className="sm:w-4 sm:h-4" /> : <ChevronDown size={14} className="sm:w-4 sm:h-4" />
                      )}
                    </div>
                  </th>
                  <th className="hidden md:table-cell px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer" onClick={() => requestSort('revenue')}>
                    <div className="flex items-center">
                      Revenue
                      {sortConfig.key === 'revenue' && (
                        sortConfig.direction === 'asc' ? <ChevronUp size={14} className="sm:w-4 sm:h-4" /> : <ChevronDown size={14} className="sm:w-4 sm:h-4" />
                      )}
                    </div>
                  </th>
                  <th className="hidden lg:table-cell px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer" onClick={() => requestSort('average_rating')}>
                    <div className="flex items-center">
                      Avg. Rating
                      {sortConfig.key === 'average_rating' && (
                        sortConfig.direction === 'asc' ? <ChevronUp size={14} className="sm:w-4 sm:h-4" /> : <ChevronDown size={14} className="sm:w-4 sm:h-4" />
                      )}
                    </div>
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {sortedData.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-800">
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-300">
                      <div className="hidden sm:block">{new Date(item.date).toLocaleDateString()}</div>
                      <div className="sm:hidden">{new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-300 max-w-[120px] sm:max-w-none truncate">
                      {item.product_name || `Product ID: ${item.product}`}
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-300">{item.units_sold.toLocaleString()}</td>
                    <td className="hidden md:table-cell px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-300">{formatCurrency(item.revenue)}</td>
                    <td className="hidden lg:table-cell px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-300">{formatRating(item.average_rating)}</td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      <div className="flex space-x-2">
                        <button
                          className="text-teal-400 hover:text-teal-300"
                          onClick={() => {
                            fetchProductDetail(item.id);
                            setCurrentView('detail');
                          }}
                        >
                          <Edit size={16} className="sm:w-[18px] sm:h-[18px]" />
                        </button>
                        <button
                          className="text-red-400 hover:text-red-300"
                          onClick={() => deleteProductPerformance(item.id)}
                        >
                          <Trash2 size={16} className="sm:w-[18px] sm:h-[18px]" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {sortedData.length === 0 && !loading && (
                  <tr>
                    <td colSpan="6" className="px-3 sm:px-6 py-4 text-center text-gray-400 text-sm">
                      No product performance data available
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
          <h1 className="text-xl sm:text-2xl font-bold text-gray-200 mb-1 sm:mb-2">Product Performance</h1>
          <p className="text-sm sm:text-base text-gray-400">Track and analyze product sales and performance metrics</p>
        </div>

        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center mb-4 sm:mb-6 gap-3">
          <div className="flex flex-wrap gap-2">
            <button
              className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm ${currentView === 'list' ? 'bg-teal-600 text-white' : 'border border-gray-600 text-gray-300 hover:bg-gray-900'}`}
              onClick={() => {
                setCurrentView('list');
                fetchProductPerformance();
              }}
            >
              <Table size={14} className="inline mr-1 sm:mr-2 sm:w-4 sm:h-4" />
              Table View
            </button>
            <button
              className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm ${currentView === 'dashboard' ? 'bg-teal-600 text-white' : 'border border-gray-600 text-gray-300 hover:bg-gray-900'}`}
              onClick={() => {
                if (productPerformance.length > 0) {
                  setCurrentView('dashboard');
                } else {
                  setError('No data available for visualization');
                }
              }}
            >
              <BarChart2 size={14} className="inline mr-1 sm:mr-2 sm:w-4 sm:h-4" />
              Charts
            </button>
            <button
              className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm ${currentView === 'report' ? 'bg-teal-600 text-white' : 'border border-gray-600 text-gray-300 hover:bg-gray-900'}`}
              onClick={() => setCurrentView('report')}
            >
              <Activity size={14} className="inline mr-1 sm:mr-2 sm:w-4 sm:h-4" />
              Generate Report
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              className="flex-1 sm:flex-none px-3 sm:px-4 py-2 border border-gray-600 text-gray-300 rounded-md hover:bg-gray-900 flex items-center justify-center text-xs sm:text-sm"
              onClick={fetchProductPerformance}
            >
              <RefreshCw size={14} className="mr-1 sm:mr-2 sm:w-4 sm:h-4" />
              Refresh
            </button>
            {productPerformance.length > 0 && (
              <button
                className="flex-1 sm:flex-none px-3 sm:px-4 py-2 border border-gray-600 text-gray-300 rounded-md hover:bg-gray-900 flex items-center justify-center text-xs sm:text-sm"
                onClick={exportToPDF}
              >
                <Download size={14} className="mr-1 sm:mr-2 sm:w-4 sm:h-4" />
                Export PDF
              </button>
            )}
          </div>
        </div>

        {error && currentView !== 'report' && currentView !== 'detail' && (
          <div className="bg-red-900/30 border border-red-700 text-red-300 px-3 py-2 sm:px-4 sm:py-3 rounded mb-4 text-sm">
            {error}
          </div>
        )}

        {loading && (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 sm:h-10 sm:w-10 border-t-2 border-b-2 border-teal-500"></div>
          </div>
        )}

        {!loading && (
          <>
            {currentView === 'list' && renderProductPerformanceTable()}
            {currentView === 'dashboard' && renderDashboard()}
            {currentView === 'report' && renderReportForm()}
            {currentView === 'detail' && renderForm()}
          </>
        )}
      </div>
    </div>
  );
};

export default Products;