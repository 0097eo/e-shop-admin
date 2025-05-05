import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Orders from '../src/pages/Orders';
import axios from 'axios';
import useAuth from '../src/hooks/useAuth';

// Mock dependencies
vi.mock('axios');
vi.mock('../src/hooks/useAuth');
vi.mock('jspdf', () => ({ default: vi.fn() }));
vi.mock('jspdf-autotable');

describe('Orders Component', () => {
  const mockUser = {
    access: 'mock-token'
  };
  
  const mockOrders = [
    { id: 1, user_email: 'user1@test.com', total_price: 100, status: 'PENDING' },
    { id: 2, user_email: 'user2@test.com', total_price: 200, status: 'DELIVERED' }
  ];
  
  beforeEach(() => {
    useAuth.mockReturnValue({ user: mockUser });
    axios.get.mockResolvedValue({ data: mockOrders });
    axios.put.mockResolvedValue({ data: { ...mockOrders[0], status: 'PROCESSING' } });
    axios.delete.mockResolvedValue({ data: { success: true } });
    window.confirm = vi.fn(() => true);
    vi.clearAllMocks(); // Clear mock calls between tests
  });
  
  it('renders loading state initially', () => {
    render(<Orders />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });
  
  it('fetches and displays orders', async () => {
    render(<Orders />);
    
    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });
    
    expect(screen.getByText('user1@test.com')).toBeInTheDocument();
    expect(screen.getByText('user2@test.com')).toBeInTheDocument();
  });
  
  it('handles fetch error', async () => {
    axios.get.mockRejectedValueOnce(new Error());
    
    render(<Orders />);
    
    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toHaveTextContent('Failed to fetch orders');
    });
  });
  
  
  it('sorts orders when clicking column headers', async () => {
    render(<Orders />);
    
    // Wait for orders to load
    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });
    
    // Click on Order ID header to sort
    const idHeader = screen.getByText('Order ID');
    fireEvent.click(idHeader);
    
    // Verify sorting
    await waitFor(() => {
      const rows = screen.getAllByRole('row');
      expect(rows[1]).toHaveTextContent('1'); // First row after header
    });
  });
});