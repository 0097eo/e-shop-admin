import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import LoginPage from '../src/pages/Login';
import useAuth from '../src/hooks/useAuth';

// Mock the useAuth hook
vi.mock('../src/hooks/useAuth');

// Mock the useNavigate hook
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate
  };
});


describe('LoginPage', () => {
  const mockLogin = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    useAuth.mockReturnValue({ login: mockLogin });
  });

  it('renders login form elements', () => {
    render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>
    );
    
    expect(screen.getByLabelText(/admin email/i)).toBeInTheDocument();
    expect(screen.getByLabelText('Admin Password', { selector: 'input#password' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^access admin dashboard$/i })).toBeInTheDocument();
  });


  it('handles successful login for admin users', async () => {
    // Mock a successful login
    mockLogin.mockResolvedValueOnce({ success: true });
    
    // Mock localStorage for user data after login
    const mockSetItem = vi.spyOn(Storage.prototype, 'setItem');
    const mockGetItem = vi.spyOn(Storage.prototype, 'getItem');
    mockGetItem.mockReturnValue(JSON.stringify({ user_type: 'ADMIN' }));
    
    render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>
    );
    
    // Fill out the form
    fireEvent.change(screen.getByLabelText(/admin email/i), {
      target: { value: 'test@example.com' }
    });
    
    fireEvent.change(screen.getByLabelText('Admin Password', { selector: 'input#password' }), {
      target: { value: 'password123' }
    });
    
    // Submit form with the correct button text
    fireEvent.click(screen.getByRole('button', { name: /Access Admin Dashboard/i }));
    
    // Verify login was called with correct params
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123');
    });
    
    // Verify navigation occurred after successful login
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });

    // Clean up mock
    mockSetItem.mockRestore();
    mockGetItem.mockRestore();
  });

  it('shows error for non-admin users', async () => {
    // Mock a successful login but with non-admin user data
    mockLogin.mockResolvedValueOnce({ success: true });
    
    // Mock localStorage returning non-admin user data
    const mockGetItem = vi.spyOn(Storage.prototype, 'getItem');
    mockGetItem.mockReturnValue(JSON.stringify({ user_type: 'USER' }));
    
    const mockRemoveItem = vi.spyOn(Storage.prototype, 'removeItem');
    
    render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>
    );
    
    // Fill out the form
    fireEvent.change(screen.getByLabelText(/admin email/i), {
      target: { value: 'user@example.com' }
    });
    
    fireEvent.change(screen.getByLabelText('Admin Password', { selector: 'input#password' }), {
      target: { value: 'password123' }
    });
    
    // Submit form
    fireEvent.click(screen.getByRole('button', { name: /Access Admin Dashboard/i }));
    
    // Check for error message
    await waitFor(() => {
      expect(screen.getByText('Access denied: Administrator privileges required')).toBeInTheDocument();
    });
    
    // Verify localStorage items were removed
    await waitFor(() => {
      expect(mockRemoveItem).toHaveBeenCalledWith('refresh');
      expect(mockRemoveItem).toHaveBeenCalledWith('access');
      expect(mockRemoveItem).toHaveBeenCalledWith('user');
    });
    
    // Verify navigation did not occur
    expect(mockNavigate).not.toHaveBeenCalled();

    // Clean up mock
    mockGetItem.mockRestore();
    mockRemoveItem.mockRestore();
  });

  it('handles login failure', async () => {
    mockLogin.mockResolvedValueOnce({ success: false });
    
    render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>
    );

    fireEvent.change(screen.getByLabelText(/admin email/i), { 
      target: { value: 'test@example.com' } 
    });
    
    fireEvent.change(screen.getByLabelText('Admin Password', { selector: 'input#password' }), { 
      target: { value: 'wrongpassword' } 
    });


    fireEvent.click(screen.getByRole('button', { name: /^access admin dashboard$/i }));

    await waitFor(() => {
      expect(screen.getByText('Invalid administrator credentials')).toBeInTheDocument();
    });
  });

  it('handles unexpected errors', async () => {
    mockLogin.mockRejectedValueOnce(new Error('An unexpected error occurred'));
    
    render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>
    );

    fireEvent.change(screen.getByLabelText(/admin email/i), { 
      target: { value: 'test@example.com' } 
    });
    
    fireEvent.change(screen.getByLabelText('Admin Password', { selector: 'input#password' }), { 
      target: { value: 'password123' } 
    });

    fireEvent.click(screen.getByRole('button', { name: /^access admin dashboard$/i }));

    // Verify unexpected error message appears
    await waitFor(() => {
      expect(screen.getByText('An unexpected error occurred')).toBeInTheDocument();
    });
  });

  it('toggles password visibility', () => {
    render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>
    );
    
    // Get password input with more specific selector
    const passwordInput = screen.getByLabelText('Admin Password', { selector: 'input#password' });
    
    // Find the toggle button with the correct aria-label
    const toggleButton = screen.getByRole('button', { 
      name: /show password|hide password/i 
    });

    // Password should initially be hidden
    expect(passwordInput).toHaveAttribute('type', 'password');
    
    // Click to show password
    fireEvent.click(toggleButton);
    expect(passwordInput).toHaveAttribute('type', 'text');
    
    // Click to hide password again
    fireEvent.click(toggleButton);
    expect(passwordInput).toHaveAttribute('type', 'password');
  });

  it('displays loading state during login attempt', async () => {
    // Create a promise that won't resolve immediately
    let resolveLogin;
    const loginPromise = new Promise(resolve => {
      resolveLogin = resolve;
    });
    
    mockLogin.mockReturnValueOnce(loginPromise);
    
    render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>
    );

    // Fill in form
    fireEvent.change(screen.getByLabelText(/admin email/i), { 
      target: { value: 'test@example.com' } 
    });
    
    fireEvent.change(screen.getByLabelText('Admin Password', { selector: 'input#password' }), { 
      target: { value: 'password123' } 
    });

    // Submit form
    fireEvent.click(screen.getByRole('button', { name: /^access admin dashboard$/i }));

    // Check for loading state
    expect(screen.getByText('Authenticating...')).toBeInTheDocument();
    
    // Resolve the login promise
    resolveLogin({ success: true });
    
    // Verify button text returns to normal
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /^access admin dashboard$/i })).toBeInTheDocument();
    });
  });
});