import React, { useState, useEffect } from 'react';
import { Trash2, Edit, Plus, Search, X, Filter, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';

const ProductManagement = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentProduct, setCurrentProduct] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    primary_material: '',
    condition: 'new',
    is_available: true,
    image: null,
    stock: 1
  });
  const [newCategory, setNewCategory] = useState({ name: '' });
  const [mode, setMode] = useState('view'); // 'view', 'edit', 'create'
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    category: '',
    material: '',
    minPrice: '',
    maxPrice: '',
    condition: '',
    available: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  
  const token = localStorage.getItem('access');

  const getHeaders = (includeMultipart = false) => {
    const headers = {
      Authorization: `Bearer ${token}`
    };
    
    if (!includeMultipart) {
      headers['Content-Type'] = 'application/json';
    }
    
    return headers;
  };
  
  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);
  
  const fetchProducts = async () => {
    setLoading(true);
    try {
      let url = `/api/products/products/?`;
      
      if (searchQuery) url += `search=${searchQuery}&`;
      if (filters.category) url += `category=${filters.category}&`;
      if (filters.material) url += `material=${filters.material}&`;
      if (filters.minPrice) url += `min_price=${filters.minPrice}&`;
      if (filters.maxPrice) url += `max_price=${filters.maxPrice}&`;
      if (filters.condition) url += `condition=${filters.condition}&`;
      if (filters.available) url += `available=${filters.available}&`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: getHeaders()
      });
      
      if (!response.ok) throw new Error('Failed to fetch products');
      
      const data = await response.json();
      setProducts(data.results || []);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  };
  
  const fetchCategories = async () => {
    try {
      const response = await fetch(`/api/products/categories/`, {
        method: 'GET',
        headers: getHeaders()
      });
      
      if (!response.ok) throw new Error('Failed to fetch categories');
      
      const data = await response.json();
      setCategories(data);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };
  
  const createProduct = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      Object.keys(currentProduct).forEach(key => {
        if (key === 'image' && currentProduct.image) {
          formData.append('image', currentProduct.image);
        } else if (currentProduct[key] !== null && currentProduct[key] !== undefined) {
          formData.append(key, currentProduct[key]);
        }
      });
      
      const response = await fetch(`/api/products/products/`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });
      
      if (!response.ok) {
        throw new Error('Failed to create product');
      }
      
      await fetchProducts();
      resetForm();
      setMode('view');
    } catch (err) {
      setError(err.message);
      console.error('Error creating product:', err);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const updateProduct = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      Object.keys(currentProduct).forEach(key => {
        if (key === 'image' && currentProduct.image && typeof currentProduct.image !== 'string') {
          formData.append('image', currentProduct.image);
        } else if (currentProduct[key] !== null && currentProduct[key] !== undefined && key !== 'image') {
          formData.append(key, currentProduct[key]);
        }
      });
      
      const response = await fetch(`/api/products/products/${currentProduct.id}/`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });
      
      if (!response.ok) throw new Error('Failed to update product');
      
      await fetchProducts();
      resetForm();
      setMode('view');
    } catch (err) {
      setError(err.message);
      console.error('Error updating product:', err);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const deleteProduct = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/products/products/${productToDelete}/`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      
      if (!response.ok) throw new Error('Failed to delete product');
      
      await fetchProducts();
      setShowDeleteModal(false);
      setProductToDelete(null);
    } catch (err) {
      setError(err.message);
      console.error('Error deleting product:', err);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const createCategory = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`/api/products/categories/`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(newCategory)
      });
      
      if (!response.ok) throw new Error('Failed to create category');
      
      await fetchCategories();
      setNewCategory({ name: '' });
      setShowCategoryForm(false);
    } catch (err) {
      setError(err.message);
      console.error('Error creating category:', err);
    }
  };

  const handleProductChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    
    if (type === 'file') {
      setCurrentProduct({
        ...currentProduct,
        [name]: files[0]
      });
    } else if (type === 'checkbox') {
      setCurrentProduct({
        ...currentProduct,
        [name]: checked
      });
    } else {
      setCurrentProduct({
        ...currentProduct,
        [name]: value
      });
    }
  };

  const editProduct = (product) => {
    setCurrentProduct(product);
    setMode('edit');
  };

  const resetForm = () => {
    setCurrentProduct({
      name: '',
      description: '',
      price: '',
      category: '',
      primary_material: '',
      condition: 'new',
      is_available: true,
      image: null,
      stock: 1
    });
    setMode('view');
    setError(null);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({
      ...filters,
      [name]: value
    });
  };

  const applyFilters = (e) => {
    e.preventDefault();
    fetchProducts();
  };
  
  const resetFilters = () => {
    setFilters({
      category: '',
      material: '',
      minPrice: '',
      maxPrice: '',
      condition: '',
      available: ''
    });
    setSearchQuery('');
    fetchProducts();
  };
  
  const renderProductForm = () => (
    <div className="bg-gray-800 p-6 rounded-lg shadow-md mb-6 text-white">
      <h2 className="text-xl font-semibold mb-4 text-white">
        {mode === 'create' ? 'Create New Product' : 'Edit Product'}
      </h2>
      
      <form onSubmit={mode === 'create' ? createProduct : updateProduct}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-200">Name</label>
            <input
              type="text"
              name="name"
              value={currentProduct.name}
              onChange={handleProductChange}
              required
              className="mt-1 block w-full border border-gray-600 rounded-md shadow-sm py-2 px-3 bg-gray-700 text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-200">Price</label>
            <input
              type="number"
              name="price"
              value={currentProduct.price}
              onChange={handleProductChange}
              required
              min="0"
              step="0.01"
              className="mt-1 block w-full border border-gray-600 rounded-md shadow-sm py-2 px-3 bg-gray-700 text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-200">Category</label>
            <div className="flex space-x-2">
              <select
                name="category"
                value={currentProduct.category}
                onChange={handleProductChange}
                required
                className="mt-1 block w-full border border-gray-600 rounded-md shadow-sm py-2 px-3 bg-gray-700 text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Select a category</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setShowCategoryForm(!showCategoryForm)}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-200">Primary Material</label>
            <select
              name="primary_material"
              value={currentProduct.primary_material}
              onChange={handleProductChange}
              required
              className="mt-1 block w-full border border-gray-600 rounded-md shadow-sm py-2 px-3 bg-gray-700 text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">Select a material</option>
              <option value="WOOD">Wood</option>
              <option value="METAL">Metal</option>
              <option value="FABRIC">Fabric</option>
              <option value="LEATHER">Leather</option>
              <option value="GLASS">Glass</option>
              <option value="PLASTIC">Plastic</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-200">Stock</label>
            <input
              type="number"
              name="stock"
              value={currentProduct.stock}
              onChange={handleProductChange}
              required
              min="0"
              className="mt-1 block w-full border border-gray-600 rounded-md shadow-sm py-2 px-3 bg-gray-700 text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-200">Condition</label>
            <select
              name="condition"
              value={currentProduct.condition}
              onChange={handleProductChange}
              className="mt-1 block w-full border border-gray-600 rounded-md shadow-sm py-2 px-3 bg-gray-700 text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">Select a condition</option>
              <option value="NEW">New</option>
              <option value="USED">Used</option>
              <option value="REFURBISHED">Refurbished</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-200">Image</label>
            <input
              type="file"
              name="image"
              onChange={handleProductChange}
              className="mt-1 block w-full py-2 px-3 text-white"
            />
          </div>
          
          <div className="flex items-center h-10 mt-6">
            <input
              type="checkbox"
              name="is_available"
              checked={currentProduct.is_available}
              onChange={handleProductChange}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-600 rounded"
            />
            <label className="ml-2 block text-sm text-gray-200">Available for purchase</label>
          </div>
        </div>
        
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-200">Description</label>
          <textarea
            name="description"
            value={currentProduct.description}
            onChange={handleProductChange}
            required
            rows="4"
            className="mt-1 block w-full border border-gray-600 rounded-md shadow-sm py-2 px-3 bg-gray-700 text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          ></textarea>
        </div>
        
        {error && (
          <div className="mt-4 text-red-400 text-sm">{error}</div>
        )}
        
        <div className="mt-6 flex justify-end space-x-3">
          <button
            type="button"
            onClick={resetForm}
            className="inline-flex items-center px-4 py-2 border border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-200 bg-gray-700 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className={`inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
              isSubmitting ? 'opacity-75 cursor-not-allowed' : ''
            }`}
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Loading...
              </>
            ) : (
              mode === 'create' ? 'Create Product' : 'Update Product'
            )}
          </button>
        </div>
      </form>
    </div>
  );

  const renderCategoryForm = () => (
    <div className="bg-gray-800 p-6 rounded-lg shadow-md mb-6 text-white">
      <h2 className="text-xl font-semibold mb-4 text-white">Create New Category</h2>
      
      <form onSubmit={createCategory}>
        <div>
          <label className="block text-sm font-medium text-gray-200">Category Name</label>
          <input
            type="text"
            value={newCategory.name}
            onChange={(e) => setNewCategory({ name: e.target.value })}
            required
            className="mt-1 block w-full border border-gray-600 rounded-md shadow-sm py-2 px-3 bg-gray-700 text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        
        <div className="mt-6 flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => setShowCategoryForm(false)}
            className="inline-flex items-center px-4 py-2 border border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-200 bg-gray-700 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Create Category
          </button>
        </div>
      </form>
    </div>
  );

  const renderDeleteModal = () => (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 p-6 rounded-lg shadow-xl max-w-sm w-full">
        <h3 className="text-lg font-semibold text-white mb-4">Confirm Delete</h3>
        <p className="text-gray-300 mb-6">Are you sure you want to delete this product? This action cannot be undone.</p>
        <div className="flex justify-end space-x-3">
          <button
            onClick={() => setShowDeleteModal(false)}
            className="inline-flex items-center px-4 py-2 border border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-200 bg-gray-700 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Cancel
          </button>
          <button
            onClick={deleteProduct}
            disabled={isSubmitting}
            className={`inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 ${
              isSubmitting ? 'opacity-75 cursor-not-allowed' : ''
            }`}
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Deleting...
              </>
            ) : (
              'Delete'
            )}
          </button>
        </div>
      </div>
    </div>
  );

  const renderProductsList = () => (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-center mb-6">
        <h2 className="text-2xl font-bold mb-4 md:mb-0 text-white">Product Management</h2>
        
        <div className="flex space-x-2">
          <button
            onClick={() => setMode('create')}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <Plus size={16} className="mr-2" /> New Product
          </button>
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center px-4 py-2 border border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-200 bg-gray-700 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <Filter size={16} className="mr-2" /> 
            Filters
            {showFilters ? <ChevronUp size={16} className="ml-2" /> : <ChevronDown size={16} className="ml-2" />}
          </button>
          
          <button
            onClick={() => fetchProducts()}
            className="inline-flex items-center px-4 py-2 border border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-200 bg-gray-700 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>
      
      <div className="mb-6">
        <div className="flex w-full">
          <div className="relative flex-grow">
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full border border-gray-600 rounded-l-md shadow-sm py-2 px-3 pr-10 bg-gray-700 text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  fetchProducts();
                }}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-200"
              >
                <X size={16} />
              </button>
            )}
          </div>
          <button
            onClick={fetchProducts}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 rounded-r-md flex items-center"
          >
            <Search size={16} />
          </button>
        </div>
        
        {showFilters && (
          <div className="mt-4 bg-gray-800 p-4 rounded-md border border-gray-700">
            <form onSubmit={applyFilters}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-200">Category</label>
                  <select
                    name="category"
                    value={filters.category}
                    onChange={handleFilterChange}
                    className="mt-1 block w-full border border-gray-600 rounded-md shadow-sm py-2 px-3 bg-gray-700 text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">All Categories</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>{category.name}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-200">Material</label>
                  <input
                    type="text"
                    name="material"
                    value={filters.material}
                    onChange={handleFilterChange}
                    className="mt-1 block w-full border border-gray-600 rounded-md shadow-sm py-2 px-3 bg-gray-700 text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-200">Condition</label>
                  <select
                    name="condition"
                    value={filters.condition}
                    onChange={handleFilterChange}
                    className="mt-1 block w-full border border-gray-600 rounded-md shadow-sm py-2 px-3 bg-gray-700 text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">All Conditions</option>
                    <option value="new">New</option>
                    <option value="like_new">Like New</option>
                    <option value="good">Good</option>
                    <option value="fair">Fair</option>
                    <option value="poor">Poor</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-200">Min Price</label>
                  <input
                    type="number"
                    name="minPrice"
                    value={filters.minPrice}
                    onChange={handleFilterChange}
                    min="0"
                    className="mt-1 block w-full border border-gray-600 rounded-md shadow-sm py-2 px-3 bg-gray-700 text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-200">Max Price</label>
                  <input
                    type="number"
                    name="maxPrice"
                    value={filters.maxPrice}
                    onChange={handleFilterChange}
                    min="0"
                    className="mt-1 block w-full border border-gray-600 rounded-md shadow-sm py-2 px-3 bg-gray-700 text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-200">Availability</label>
                  <select
                    name="available"
                    value={filters.available}
                    onChange={handleFilterChange}
                    className="mt-1 block w-full border border-gray-600 rounded-md shadow-sm py-2 px-3 bg-gray-700 text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">All</option>
                    <option value="true">Available</option>
                    <option value="false">Not Available</option>
                  </select>
                </div>
              </div>
              
              <div className="mt-4 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={resetFilters}
                  className="inline-flex items-center px-3 py-2 border border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-200 bg-gray-700 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Reset
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Apply Filters
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
      
      {loading ? (
        <div className="flex justify-center py-10">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-400"></div>
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-10 text-gray-400">
          No products found. Try adjusting your filters or create a new product.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map(product => (
            <div key={product.id} className="bg-gray-800 rounded-lg shadow-md overflow-hidden border border-gray-700">
              <div className="h-48 bg-gray-700 relative">
                {product.image ? (
                  <img 
                    src={product.image} 
                    alt={product.name} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    No Image
                  </div>
                )}
                <div className="absolute top-2 right-2 flex space-x-2">
                  <button
                    onClick={() => editProduct(product)}
                    className="bg-gray-800 p-2 rounded-full shadow hover:bg-gray-700"
                  >
                    <Edit size={16} className="text-indigo-400" />
                  </button>
                  <button
                    onClick={() => {
                      setProductToDelete(product.id);
                      setShowDeleteModal(true);
                    }}
                    className="bg-gray-800 p-2 rounded-full shadow hover:bg-gray-700"
                  >
                    <Trash2 size={16} className="text-red-400" />
                  </button>
                </div>
              </div>
              
              <div className="p-4">
                <div className="flex justify-between items-start">
                  <h3 className="text-lg font-semibold text-white truncate">{product.name}</h3>
                  <span className="bg-indigo-900 text-indigo-200 text-xs px-2 py-1 rounded-full">
                    KES {parseFloat(product.price).toFixed(2)}
                  </span>
                </div>
                
                <p className="mt-2 text-sm text-gray-300 line-clamp-2">{product.description}</p>
                
                <div className="mt-3 flex flex-wrap gap-2">
                  {product.category && (
                    <span className="text-xs bg-blue-900 text-blue-200 px-2 py-1 rounded">
                      {categories.find(cat => cat.id === product.category)?.name || 'Unknown Category'}
                    </span>
                  )}
                  
                  {product.primary_material && (
                    <span className="text-xs bg-green-900 text-green-200 px-2 py-1 rounded">
                      {product.primary_material}
                    </span>
                  )}
                  
                  <span className="text-xs bg-purple-900 text-purple-200 px-2 py-1 rounded">
                    {product.condition.replace('_', ' ')}
                  </span>
                  
                  <span className={`text-xs px-2 py-1 rounded ${
                    product.is_available 
                      ? 'bg-green-900 text-green-200' 
                      : 'bg-red-900 text-red-200'
                  }`}>
                    {product.is_available ? 'Available' : 'Not Available'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderCategoriesList = () => (
    <div className="mt-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-white">Categories</h2>
        <button
          onClick={() => setShowCategoryForm(!showCategoryForm)}
          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <Plus size={16} className="mr-1" /> Add Category
        </button>
      </div>
      
      <div className="bg-gray-800 rounded-lg shadow overflow-hidden border border-gray-700">
        <ul className="divide-y divide-gray-700">
          {categories.length === 0 ? (
            <li className="px-6 py-4 text-center text-gray-400">
              No categories found. Create a category to get started.
            </li>
          ) : (
            categories.map(category => (
              <li key={category.id} className="px-6 py-4 flex items-center justify-between">
                <span className="text-white">{category.name}</span>
                <span className="text-gray-400 text-sm">
                  {products.filter(p => p.category === category.id).length} products
                </span>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
  
  return (
    <div className="container mx-auto px-4 py-8">
      {!token && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                You need to be logged in to manage products.
              </p>
            </div>
          </div>
        </div>
      )}
      
      {error && !mode.includes('edit') && !mode.includes('create') && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}
      
      {showCategoryForm && renderCategoryForm()}
      
      {mode === 'view' ? (
        <div>
          {renderProductsList()}
          {renderCategoriesList()}
        </div>
      ) : (
        renderProductForm()
      )}
      
      {showDeleteModal && renderDeleteModal()}
    </div>
  );
};

export default ProductManagement;