import React, { useState, useEffect, useMemo } from 'react';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell 
} from 'recharts';
import { 
  DollarSign, ShoppingBag, Users, TrendingUp, 
  Package, Grid, Calendar 
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

  // Memoized calculations to prevent unnecessary re-renders
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

  // Process top products with memoization
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

  // Process category data for pie chart
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
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="text-2xl text-gray-300">Loading dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="p-6 bg-gray-900 rounded-lg shadow-lg">
          <h2 className="mb-4 text-xl text-red-400">Error</h2>
          <p className="text-gray-300">{error}</p>
          <button 
            className="px-4 py-2 mt-4 text-white bg-blue-600 rounded hover:bg-blue-700"
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
      <header className="bg-gray-900 shadow">
        <div className="flex items-center justify-between px-4 py-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <h1 className="text-2xl font-bold text-white">Sales Analytics Dashboard</h1>
        </div>
      </header>

      <main className="px-4 py-6 mx-auto max-w-7xl sm:px-6 lg:px-8 bg-gray-900">
        {/* Date Range Selector */}
        <div className="p-4 mb-6 bg-gray-900 rounded-lg shadow">
          <div className="flex flex-col items-start space-y-4 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center">
              <Calendar size={20} className="mr-2 text-gray-400" />
              <h2 className="text-lg font-medium text-gray-300">Date Range</h2>
            </div>
            <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-4">
              <div>
                <label htmlFor='start-date' className="block text-sm font-medium text-gray-400">Start Date</label>
                <input
                  id='start-date'
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) => setDateRange({...dateRange, startDate: e.target.value})}
                  className="block w-full px-3 py-2 mt-1 text-gray-300 bg-gray-700 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
              <div>
                <label htmlFor="end-date" className="block text-sm font-medium text-gray-400">End Date</label>
                <input
                  id='end-date'
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) => setDateRange({...dateRange, endDate: e.target.value})}
                  className="block w-full px-3 py-2 mt-1 text-gray-300 bg-gray-700 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-6 mb-8 md:grid-cols-2 lg:grid-cols-4 border border-gray-700 rounded-lg">
          <div className="p-6 bg-gray-900 shadow">
            <div className="flex items-center">
              <div className="p-3 mr-4 text-white bg-blue-600 rounded-full">
                <DollarSign size={24} />
              </div>
              <div>
                <p className="mb-2 text-sm font-medium text-gray-400">Total Sales</p>
                <p className="text-2xl font-semibold text-white">KES {formatNumber(dashboardMetrics.totalSales)}</p>
              </div>
            </div>
          </div>

          <div className="p-6 bg-gray-900 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-3 mr-4 text-white bg-green-600 rounded-full">
                <ShoppingBag size={24} />
              </div>
              <div>
                <p className="mb-2 text-sm font-medium text-gray-400">Total Orders</p>
                <p className="text-2xl font-semibold text-white">{formatNumber(dashboardMetrics.totalOrders, 0)}</p>
              </div>
            </div>
          </div>

          <div className="p-6 bg-gray-900 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-3 mr-4 text-white bg-purple-600 rounded-full">
                <TrendingUp size={24} />
              </div>
              <div>
                <p className="mb-2 text-sm font-medium text-gray-400">Avg. Order Value</p>
                <p className="text-2xl font-semibold text-white">KES {formatNumber(dashboardMetrics.avgOrderValue)}</p>
              </div>
            </div>
          </div>

          <div className="p-6 bg-gray-900 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-3 mr-4 text-white bg-yellow-600 rounded-full">
                <Users size={24} />
              </div>
              <div>
                <p className="mb-2 text-sm font-medium text-gray-400">Unique Customers</p>
                <p className="text-2xl font-semibold text-white">{formatNumber(dashboardMetrics.uniqueCustomers, 0)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid gap-6 mb-8 lg:grid-cols-2">
          {/* Daily Sales Chart */}
          <div className="p-6 bg-gray-900 rounded-lg shadow border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-gray-300">Daily Sales</h2>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={dailySales}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#4B5563" />
                  <XAxis dataKey="date" stroke="#D1D5DB" />
                  <YAxis stroke="#D1D5DB" />
                  <Tooltip 
                    formatter={(value) => [`KES ${formatNumber(value)}`, '']} 
                    contentStyle={{ backgroundColor: '#1F2937', border: 'none', color: '#fff' }} 
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="total_sales" 
                    stroke="#0088FE" 
                    name="Sales (KES)" 
                    activeDot={{ r: 8 }} 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="order_count" 
                    stroke="#00C49F" 
                    name="Orders" 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top Products Chart */}
          <div className="p-6 bg-gray-900 rounded-lg shadow border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-gray-300">Top Products by Revenue</h2>
              <Package size={20} className="text-gray-400" />
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={topProducts}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  layout="vertical"
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#4B5563" />
                  <XAxis 
                    type="number" 
                    stroke="#D1D5DB" 
                    tickFormatter={(value) => `KES ${formatNumber(value)}`}
                  />
                  <YAxis dataKey="name" type="category" width={120} stroke="#D1D5DB" />
                  <Tooltip 
                    formatter={(value) => [`KES ${formatNumber(value)}`, '']} 
                    contentStyle={{ backgroundColor: '#1F2937', border: 'none', color: '#fff' }} 
                  />
                  <Legend />
                  <Bar dataKey="revenue" name="Revenue (KES)" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Category Distribution Pie Chart */}
          <div className="p-6 bg-gray-900 rounded-lg shadow border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-gray-300">Category Revenue Distribution</h2>
              <Grid size={20} className="text-gray-400" />
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="revenue"
                    nameKey="name"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => [`KES ${formatNumber(value)}`, '']} 
                    contentStyle={{ backgroundColor: '#1F2937', border: 'none', color: '#fff' }} 
                  />
                  <Legend wrapperStyle={{ color: '#D1D5DB' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Customer Insights Table */}
          <div className="p-6 bg-gray-900 rounded-lg shadow border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-gray-300">Top Customers</h2>
              <Users size={20} className="text-gray-400" />
            </div>
            <div className="h-64 overflow-auto">
              <table className="w-full min-w-full divide-y divide-gray-700">
                <thead className="bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-400 uppercase">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-400 uppercase">
                      Total Spent
                    </th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-400 uppercase">
                      Orders
                    </th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-400 uppercase">
                      Avg. Order
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-gray-900 divide-y divide-gray-700">
                  {customerInsights.slice(0, 10).map((customer) => (
                    <tr key={customer.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-300">{customer.user_email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-300">KES {formatNumber(customer.total_spent)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-300">{formatNumber(customer.orders_count, 0)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-300">KES {formatNumber(customer.average_order_value)}</div>
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