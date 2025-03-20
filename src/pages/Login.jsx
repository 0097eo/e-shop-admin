import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import discoverImage from '../assets/hero.jpg';
import { Link } from 'react-router-dom';
import { AlertCircle, Eye, EyeOff } from 'lucide-react';

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const result = await login(email, password);

            if (result.success) {
                // Check if the user has admin permissions
                const userData = JSON.parse(localStorage.getItem('user'));
                
                if (userData && userData.user_type === 'ADMIN') {
                    navigate('/');
                } else {
                    // Not an admin user - clear the data and show error
                    localStorage.removeItem('refresh');
                    localStorage.removeItem('access');
                    localStorage.removeItem('user');
                    setError('Access denied: Administrator privileges required');
                }
            } else {
                setError('Invalid administrator credentials');
            }
        } catch (err) {
            setError('An unexpected error occurred');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    return (
        <div className="min-h-screen flex flex-col md:flex-row">
            {/* Left Section - Background Image */}
            <div className="hidden md:flex w-full md:w-1/2 items-center justify-center bg-cover bg-center relative"
                style={{ backgroundImage: `url(${discoverImage})` }}
            >
                {/* Overlay to darken the image */}
                <div className="absolute inset-0 bg-black opacity-50 pointer-events-none"></div>

                {/* Text Content */}
                <div className="relative z-10 p-8 text-center text-white">
                    <h2 className="text-4xl font-bold">Administrator Portal</h2>
                    <p className="mt-4 text-lg">Access the administrative dashboard to manage your system.</p>
                </div>
            </div>

            {/* Right Section - Login Form */}
            <div className="w-full md:w-1/2 flex items-center justify-center px-4 sm:px-6 lg:px-8 bg-gray-50">
                <div className="max-w-md w-full space-y-8">
                    <div>
                        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                            Administrator Login
                        </h2>
                        <p className="mt-2 text-center text-sm text-gray-600">
                            Secure access for authorized administrators only
                        </p>
                    </div>
                    <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                        {/* Email Input */}
                        <div className="mb-4">
                            <label 
                                htmlFor="email-address" 
                                className="block text-sm font-medium text-gray-700 mb-2"
                            >
                                Admin Email
                            </label>
                            <input
                                id="email-address"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-amber-500 focus:border-amber-500 focus:z-10 sm:text-sm"
                                placeholder="Enter administrator email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                aria-describedby="email-error"
                            />
                        </div>

                        {/* Password Input with Toggle Visibility */}
                        <div className="mb-4">
                            <label 
                                htmlFor="password" 
                                className="block text-sm font-medium text-gray-700 mb-2"
                            >
                                Admin Password
                            </label>
                            <div className="relative">
                                <input
                                    id="password"
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    autoComplete="current-password"
                                    required
                                    className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-amber-500 focus:border-amber-500 focus:z-10 sm:text-sm pr-10"
                                    placeholder="Enter administrator password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    aria-describedby="password-error"
                                />
                                <button
                                    type="button"
                                    onClick={togglePasswordVisibility}
                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
                                >
                                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                            </div>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="mb-4 flex items-center p-4 text-red-700 bg-red-100 rounded-lg">
                            <AlertCircle className="w-5 h-5 mr-2" />
                            <div>
                                <span>{error}</span>
                            </div>
                            </div>
                        )}

                        {/* Sign In Button */}
                        <div>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 disabled:opacity-50"
                            >
                                {isLoading ? 'Authenticating...' : 'Access Admin Dashboard'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;