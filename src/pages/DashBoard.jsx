import React, { useState, useEffect, useMemo } from 'react';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell 
} from 'recharts';
import { 
  DollarSign, ShoppingBag, Users, TrendingUp, 
  Package, Grid, Calendar, RefreshCw
} from 'lucide-react';

const calculateMetric = (data, metricKey, parseFunc = parseFloat, decimals = 2) => {
  const value = data && data.length > 0 
    ? data.reduce((sum, item) => sum + (parseFunc(item[metricKey]) || 0), 0)
    : 0;
  return Number(value.toFixed(decimals));
};

const formatNumber = (value, decimals = 2) => {
  if (value === null || value === undefined) return '0';
  return Number(value).toLocaleString('en-US', { 
    minimumFractionDigits: decimals, 
    maximumFractionDigits: decimals 
  });
};

const Dashboard = () => {
  const [dailySales, setDailySales] = useState([]);
  const [productPerformance, setProductPerformance] = useState([]);
  const [categoryPerformance, setCategoryPerformance] = useState([]);
  const [customerInsights, setCustomerInsights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('access');
        if (!token) {
          throw new Error('Authentication token not found');
        }

        const headers = {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        };

        const endpoints = [
          `/api/salesanalysis/daily-sales/?start_date=${dateRange.startDate}&end_date=${dateRange.endDate}`,
          `/api/salesanalysis/product-performance/?start_date=${dateRange.startDate}&end_date=${dateRange.endDate}`,
          `/api/salesanalysis/category-performance/?start_date=${dateRange.startDate}&end_date=${dateRange.endDate}`,
          `/api/salesanalysis/customer-insights/`
        ];

        const responses = await Promise.all(
          endpoints.map(url => 
            fetch(url, { headers }).then(response => {
              if (!response.ok) {
                throw new Error(`Failed to fetch data from ${url}`);
              }
              return response.json();
            })
          )
        );

        const [salesData, productData, categoryData, customerData] = responses;

        setDailySales(salesData);
        setProductPerformance(productData);
        setCategoryPerformance(categoryData);
        setCustomerInsights(customerData);
      } catch (err) {
        setError(err.message);
        console.error('Dashboard data fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [dateRange]);

  const updateMetrics = async () => {
    setUpdating(true);
    try {
      const token = localStorage.getItem('access');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      const response = await fetch('/api/salesanalysis/update-metrics/', {
        method: 'POST',
        headers
      });

      if (!response.ok) {
        throw new Error('Failed to update metrics');
      }

      const newDateRange = { ...dateRange };
      setDateRange(newDateRange);
      
    } catch (err) {
      setError(err.message);
      console.error('Update metrics error:', err);
    } finally {
      setUpdating(false);
    }
  };

  const dashboardMetrics = useMemo(() => {
    const totalSales = calculateMetric(dailySales, 'total_sales');
    const totalOrders = calculateMetric(dailySales, 'order_count', parseInt);
    const uniqueCustomers = calculateMetric(dailySales, 'unique_customers', parseInt);
    const avgOrderValue = totalOrders > 0 ? calculateMetric(dailySales, 'total_sales') / totalOrders : 0;

    return {
      totalSales,
      totalOrders,
      uniqueCustomers,
      avgOrderValue: calculateMetric([{avgOrderValue}], 'avgOrderValue')
    };
  }, [dailySales]);

  const topProducts = useMemo(() => {
    return productPerformance
      .reduce((acc, curr) => {
        const existingProduct = acc.find(p => p.product_id === curr.product);
        if (existingProduct) {
          existingProduct.revenue += parseFloat(curr.revenue) || 0;
          existingProduct.units_sold += parseInt(curr.units_sold) || 0;
        } else {
          acc.push({
            product_id: curr.product,
            name: curr.product_name,
            revenue: parseFloat(curr.revenue) || 0,
            units_sold: parseInt(curr.units_sold) || 0
          });
        }
        return acc;
      }, [])
      .filter(p => p.revenue > 0)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [productPerformance]);

  const categoryData = useMemo(() => {
    return categoryPerformance
      .reduce((acc, curr) => {
        const existingCategory = acc.find(c => c.category_id === curr.category);
        if (existingCategory) {
          existingCategory.revenue += parseFloat(curr.revenue) || 0;
          existingCategory.products_sold += parseInt(curr.products_sold) || 0;
        } else {
          acc.push({
            category_id: curr.category,
            name: curr.category_name,
            revenue: parseFloat(curr.revenue) || 0,
            products_sold: parseInt(curr.products_sold) || 0
          });
        }
        return acc;
      }, [])
      .filter(c => c.revenue > 0)
      .sort((a, b) => b.revenue - a.revenue);
  }, [categoryPerformance]);

  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4 bg-gray-900">
        <div className="text-xl text-center text-gray-300 md:text-2xl">Loading dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4 bg-gray-900">
        <div className="w-full max-w-md p-6 bg-gray-800 rounded-lg shadow-lg">
          <h2 className="mb-4 text-lg text-red-400 md:text-xl">Error</h2>
          <p className="text-sm text-gray-300 md:text-base">{error}</p>
          <button 
            className="w-full px-4 py-2 mt-4 text-sm text-white transition-colors bg-blue-600 rounded md:text-base hover:bg-blue-700"
            onClick={() => window.location.reload()}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 shadow">
        <div className="flex flex-col items-start justify-between gap-4 px-4 py-4 mx-auto max-w-7xl sm:flex-row sm:items-center sm:px-6 lg:px-8">
          <h1 className="text-xl font-bold text-white sm:text-2xl">Sales Analytics Dashboard</h1>
          <button
            onClick={updateMetrics}
            disabled={updating}
            className="flex items-center justify-center w-full px-4 py-2 text-sm text-white transition-colors bg-blue-600 rounded-md sm:w-auto hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50"
          >
            <RefreshCw size={16} className={`mr-2 ${updating ? 'animate-spin' : ''}`} />
            {updating ? 'Updating...' : 'Update Metrics'}
          </button>
        </div>
      </header>

      <main className="px-4 py-6 mx-auto max-w-7xl sm:px-6 lg:px-8">
        {/* Date Range Selector */}
        <div className="p-4 mb-6 bg-gray-800 border border-gray-700 rounded-lg shadow">
          <div className="flex flex-col space-y-4">
            <div className="flex items-center">
              <Calendar size={20} className="mr-2 text-gray-400" />
              <h2 className="text-base font-medium text-gray-300 sm:text-lg">Date Range</h2>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor='start-date' className="block text-xs font-medium text-gray-400 sm:text-sm">Start Date</label>
                <input
                  id='start-date'
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) => setDateRange({...dateRange, startDate: e.target.value})}
                  className="block w-full px-3 py-2 mt-1 text-sm text-gray-300 bg-gray-700 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label htmlFor="end-date" className="block text-xs font-medium text-gray-400 sm:text-sm">End Date</label>
                <input
                  id='end-date'
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) => setDateRange({...dateRange, endDate: e.target.value})}
                  className="block w-full px-3 py-2 mt-1 text-sm text-gray-300 bg-gray-700 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 gap-4 mb-8 sm:grid-cols-2 lg:grid-cols-4">
          <div className="p-4 bg-gray-800 border border-gray-700 rounded-lg shadow sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 p-2 mr-3 text-white bg-blue-600 rounded-full sm:p-3 sm:mr-4">
                <DollarSign size={20} className="sm:w-6 sm:h-6" />
              </div>
              <div className="min-w-0">
                <p className="mb-1 text-xs font-medium text-gray-400 sm:text-sm sm:mb-2">Total Sales</p>
                <p className="text-lg font-semibold text-white truncate sm:text-2xl">KES {formatNumber(dashboardMetrics.totalSales)}</p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-gray-800 border border-gray-700 rounded-lg shadow sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 p-2 mr-3 text-white bg-green-600 rounded-full sm:p-3 sm:mr-4">
                <ShoppingBag size={20} className="sm:w-6 sm:h-6" />
              </div>
              <div className="min-w-0">
                <p className="mb-1 text-xs font-medium text-gray-400 sm:text-sm sm:mb-2">Total Orders</p>
                <p className="text-lg font-semibold text-white truncate sm:text-2xl">{formatNumber(dashboardMetrics.totalOrders, 0)}</p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-gray-800 border border-gray-700 rounded-lg shadow sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 p-2 mr-3 text-white bg-purple-600 rounded-full sm:p-3 sm:mr-4">
                <TrendingUp size={20} className="sm:w-6 sm:h-6" />
              </div>
              <div className="min-w-0">
                <p className="mb-1 text-xs font-medium text-gray-400 sm:text-sm sm:mb-2">Avg. Order Value</p>
                <p className="text-lg font-semibold text-white truncate sm:text-2xl">KES {formatNumber(dashboardMetrics.avgOrderValue)}</p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-gray-800 border border-gray-700 rounded-lg shadow sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 p-2 mr-3 text-white bg-yellow-600 rounded-full sm:p-3 sm:mr-4">
                <Users size={20} className="sm:w-6 sm:h-6" />
              </div>
              <div className="min-w-0">
                <p className="mb-1 text-xs font-medium text-gray-400 sm:text-sm sm:mb-2">Unique Customers</p>
                <p className="text-lg font-semibold text-white truncate sm:text-2xl">{formatNumber(dashboardMetrics.uniqueCustomers, 0)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 gap-4 mb-8 lg:gap-6 lg:grid-cols-2">
          {/* Daily Sales Chart */}
          <div className="p-4 bg-gray-800 border border-gray-700 rounded-lg shadow sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-medium text-gray-300 sm:text-lg">Daily Sales</h2>
            </div>
            <div className="h-64 sm:h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={dailySales}
                  margin={{ top: 5, right: 10, left: -20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#4B5563" />
                  <XAxis 
                    dataKey="date" 
                    stroke="#D1D5DB" 
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis 
                    stroke="#D1D5DB" 
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip 
                    formatter={(value) => [`KES ${formatNumber(value)}`, '']} 
                    contentStyle={{ backgroundColor: '#1F2937', border: 'none', color: '#fff', fontSize: '12px' }} 
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Line 
                    type="monotone" 
                    dataKey="total_sales" 
                    stroke="#0088FE" 
                    name="Sales (KES)" 
                    activeDot={{ r: 6 }} 
                    strokeWidth={2}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="order_count" 
                    stroke="#00C49F" 
                    name="Orders" 
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top Products Chart */}
          <div className="p-4 bg-gray-800 border border-gray-700 rounded-lg shadow sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-medium text-gray-300 sm:text-lg">Top Products by Revenue</h2>
              <Package size={20} className="text-gray-400" />
            </div>
            <div className="h-64 sm:h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={topProducts}
                  margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
                  layout="vertical"
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#4B5563" />
                  <XAxis 
                    type="number" 
                    stroke="#D1D5DB" 
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => `${formatNumber(value / 1000)}k`}
                  />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    width={80} 
                    stroke="#D1D5DB" 
                    tick={{ fontSize: 10 }}
                  />
                  <Tooltip 
                    formatter={(value) => [`KES ${formatNumber(value)}`, '']} 
                    contentStyle={{ backgroundColor: '#1F2937', border: 'none', color: '#fff', fontSize: '12px' }} 
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Bar dataKey="revenue" name="Revenue (KES)" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Category Distribution Pie Chart */}
          <div className="p-4 bg-gray-800 border border-gray-700 rounded-lg shadow sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-medium text-gray-300 sm:text-lg">Category Revenue Distribution</h2>
              <Grid size={20} className="text-gray-400" />
            </div>
            <div className="h-64 sm:h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={window.innerWidth < 640 ? 60 : 80}
                    fill="#8884d8"
                    dataKey="revenue"
                    nameKey="name"
                    label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => [`KES ${formatNumber(value)}`, '']} 
                    contentStyle={{ backgroundColor: '#1F2937', border: 'none', color: '#fff', fontSize: '12px' }} 
                  />
                  <Legend wrapperStyle={{ color: '#D1D5DB', fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Customer Insights Table */}
          <div className="p-4 bg-gray-800 border border-gray-700 rounded-lg shadow sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-medium text-gray-300 sm:text-lg">Top Customers</h2>
              <Users size={20} className="text-gray-400" />
            </div>
            <div className="h-64 overflow-x-auto sm:h-72">
              <table className="min-w-full divide-y divide-gray-700">
                <thead className="bg-gray-700">
                  <tr>
                    <th className="px-3 py-2 text-xs font-medium tracking-wider text-left text-gray-400 uppercase sm:px-4 sm:py-3">
                      Customer
                    </th>
                    <th className="px-3 py-2 text-xs font-medium tracking-wider text-left text-gray-400 uppercase sm:px-4 sm:py-3">
                      Total
                    </th>
                    <th className="hidden px-3 py-2 text-xs font-medium tracking-wider text-left text-gray-400 uppercase sm:table-cell sm:px-4 sm:py-3">
                      Orders
                    </th>
                    <th className="hidden px-3 py-2 text-xs font-medium tracking-wider text-left text-gray-400 uppercase md:table-cell sm:px-4 sm:py-3">
                      Avg. Order
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-gray-800 divide-y divide-gray-700">
                  {customerInsights.slice(0, 10).map((customer) => (
                    <tr key={customer.id}>
                      <td className="px-3 py-2 text-xs whitespace-nowrap sm:px-4 sm:py-3 sm:text-sm">
                        <div className="text-gray-300 truncate max-w-[150px]">{customer.user_email}</div>
                      </td>
                      <td className="px-3 py-2 text-xs whitespace-nowrap sm:px-4 sm:py-3 sm:text-sm">
                        <div className="text-gray-300">{formatNumber(customer.total_spent)}</div>
                      </td>
                      <td className="hidden px-3 py-2 text-xs whitespace-nowrap sm:table-cell sm:px-4 sm:py-3 sm:text-sm">
                        <div className="text-gray-300">{formatNumber(customer.orders_count, 0)}</div>
                      </td>
                      <td className="hidden px-3 py-2 text-xs whitespace-nowrap md:table-cell sm:px-4 sm:py-3 sm:text-sm">
                        <div className="text-gray-300">{formatNumber(customer.average_order_value)}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;