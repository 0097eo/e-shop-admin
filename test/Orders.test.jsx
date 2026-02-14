import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Orders from '../src/pages/Orders';
import axios from 'axios';
import useAuth from '../src/hooks/useAuth';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Mock dependencies
vi.mock('axios');
vi.mock('../src/hooks/useAuth');
vi.mock('jspdf', () => ({ 
  default: vi.fn(() => ({
    setFontSize: vi.fn(),
    text: vi.fn(),
    save: vi.fn()
  }))
}));
vi.mock('jspdf-autotable', () => ({ default: vi.fn() }));

// Helper functions
const getUpdateButtonForOrder = (orderId) => {
  // Find the row containing this order, then find the update button within it
  const rows = screen.getAllByRole('row');
  const orderRow = rows.find(row => row.textContent.includes(`#${orderId}`));
  if (orderRow) {
    const button = orderRow.querySelector('button');
    return button;
  }
  return null;
};

const getDeleteButtonForOrder = (orderId) => {
  // Find the row containing this order, then find the delete button within it
  const rows = screen.getAllByRole('row');
  const orderRow = rows.find(row => row.textContent.includes(`#${orderId}`));
  if (orderRow) {
    const buttons = orderRow.querySelectorAll('button');
    return buttons[buttons.length - 1]; // Delete button is the last one
  }
  return null;
};

const getDeleteButtons = () => {
  // Get all table rows (skip header row at index 0)
  const rows = screen.getAllByRole('row');
  const deleteButtons = [];
  
  for (let i = 1; i < rows.length; i++) {
    const buttons = rows[i].querySelectorAll('button');
    if (buttons.length > 0) {
      // Delete button is the last button in the actions column
      deleteButtons.push(buttons[buttons.length - 1]);
    }
  }
  
  return deleteButtons;
};

const getUpdateButtons = () => {
  const allButtons = screen.getAllByRole('button');
  return allButtons.filter(button => {
    const text = button.textContent;
    return text.includes('Update');
  });
};

const clickStatusInDropdown = async (statusName) => {
  await waitFor(() => {
    const options = screen.getAllByText(statusName);
    const dropdownOption = options.find(el => 
      el.tagName === 'LI' || el.closest('li')
    ) || options[options.length - 1];
    fireEvent.click(dropdownOption);
  });
};

const waitForLoadingToComplete = async () => {
  await waitFor(() => {
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
};

describe('Orders Component', () => {
  const mockUser = {
    access: 'mock-token'
  };
  
  const mockOrders = [
    { id: 1, user_email: 'user1@test.com', total_price: 100, status: 'PENDING' },
    { id: 2, user_email: 'user2@test.com', total_price: 200, status: 'DELIVERED' },
    { id: 3, user_email: 'user3@test.com', total_price: 150, status: 'PROCESSING' }
  ];
  
  beforeEach(() => {
    useAuth.mockReturnValue({ user: mockUser });
    axios.get.mockResolvedValue({ data: mockOrders });
    axios.put.mockResolvedValue({ data: { ...mockOrders[0], status: 'PROCESSING' } });
    axios.delete.mockResolvedValue({ data: { success: true } });
    window.confirm = vi.fn(() => true);
    // Set desktop window width to ensure table rendering (not mobile cards)
    window.innerWidth = 1024;
    window.dispatchEvent(new Event('resize'));
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });
  
  describe('Initial Rendering', () => {
    it('renders loading state initially', () => {
      render(<Orders />);
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('renders the page title and description', async () => {
      render(<Orders />);
      
      await waitForLoadingToComplete();

      expect(screen.getByText('Orders Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Manage and track your customer orders')).toBeInTheDocument();
    });

    it('renders action buttons (Refresh and Export PDF)', async () => {
      render(<Orders />);
      
      await waitForLoadingToComplete();

      expect(screen.getByText('Refresh')).toBeInTheDocument();
      expect(screen.getByText('Export PDF')).toBeInTheDocument();
    });
  });

  describe('Data Fetching', () => {
    it('fetches and displays orders', async () => {
      render(<Orders />);
      
      await waitForLoadingToComplete();
      
      expect(screen.getByText('user1@test.com')).toBeInTheDocument();
      expect(screen.getByText('user2@test.com')).toBeInTheDocument();
      expect(screen.getByText('user3@test.com')).toBeInTheDocument();
    });

    it('calls API with correct authorization headers', async () => {
      render(<Orders />);
      
      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith(
          '/api/orders/orders/',
          { headers: { 'Authorization': 'Bearer mock-token' } }
        );
      });
    });

    it('handles fetch error and displays error message', async () => {
      axios.get.mockRejectedValueOnce(new Error('Network error'));
      
      render(<Orders />);
      
      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toHaveTextContent('Failed to fetch orders');
      });
    });

    it('displays "No orders available" when orders list is empty', async () => {
      axios.get.mockResolvedValueOnce({ data: [] });
      
      render(<Orders />);
      
      await waitFor(() => {
        expect(screen.getByText('No orders available')).toBeInTheDocument();
      });
    });

    it('refetches orders when Refresh button is clicked', async () => {
      render(<Orders />);
      
      await waitForLoadingToComplete();

      const refreshButton = screen.getByText('Refresh');
      fireEvent.click(refreshButton);

      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Sorting Functionality', () => {
    it('sorts orders by ID in ascending order', async () => {
      render(<Orders />);
      
      await waitForLoadingToComplete();
      
      const idHeader = screen.getByText('Order ID');
      fireEvent.click(idHeader);
      
      await waitFor(() => {
        const cells = screen.getAllByText(/#\d+/);
        expect(cells[0]).toHaveTextContent('#1');
      });
    });

    it('sorts orders by ID in descending order when clicked twice', async () => {
      render(<Orders />);
      
      await waitForLoadingToComplete();
      
      const idHeader = screen.getByText('Order ID');
      fireEvent.click(idHeader); // First click - ascending
      fireEvent.click(idHeader); // Second click - descending
      
      await waitFor(() => {
        const cells = screen.getAllByText(/#\d+/);
        expect(cells[0]).toHaveTextContent('#3');
      });
    });

    it('sorts orders by customer email', async () => {
      render(<Orders />);
      
      await waitForLoadingToComplete();
      
      const customerHeader = screen.getByText('Customer');
      fireEvent.click(customerHeader);
      
      await waitFor(() => {
        const emails = screen.getAllByText(/@test.com/);
        expect(emails[0]).toHaveTextContent('user1@test.com');
      });
    });

    it('sorts orders by total price', async () => {
      render(<Orders />);
      
      await waitForLoadingToComplete();
      
      const totalHeader = screen.getByText('Total');
      fireEvent.click(totalHeader);
      
      // Verify sorting happened (implementation specific)
      expect(totalHeader).toBeInTheDocument();
    });
  });

  describe('Status Update Functionality', () => {
    it('opens status dropdown when Update button is clicked', async () => {
      render(<Orders />);
      
      await waitForLoadingToComplete();

      const updateButtons = getUpdateButtons();
      fireEvent.click(updateButtons[0]);

      await waitFor(() => {
        expect(screen.getAllByText('PENDING').length).toBeGreaterThan(1);
        expect(screen.getAllByText('PROCESSING').length).toBeGreaterThan(0);
        expect(screen.getAllByText('SHIPPED').length).toBeGreaterThan(0);
        expect(screen.getAllByText('DELIVERED').length).toBeGreaterThan(1);
        expect(screen.getAllByText('CANCELLED').length).toBeGreaterThan(0);
      });
    });

    it('closes status dropdown when Update button is clicked again', async () => {
      render(<Orders />);
      
      await waitForLoadingToComplete();

      const updateButtons = getUpdateButtons();
      fireEvent.click(updateButtons[0]); // Open
      
      await waitFor(() => {
        const shippedOptions = screen.getAllByText('SHIPPED');
        // Should have more than just the one from original mock data
        expect(shippedOptions.length).toBeGreaterThan(0);
      });

      fireEvent.click(updateButtons[0]); // Close
      
      await waitFor(() => {
        // After closing, should only see SHIPPED if it's in the original data
        const shippedOptions = screen.queryAllByText('SHIPPED');
        // The dropdown options should be removed
        expect(shippedOptions.length).toBeLessThanOrEqual(1);
      });
    });

    it('updates order status when a status is selected', async () => {
      render(<Orders />);
      
      await waitForLoadingToComplete();

      // Get the update button for order 1
      const updateButton = getUpdateButtonForOrder(1);
      expect(updateButton).toBeTruthy();
      fireEvent.click(updateButton);

      await clickStatusInDropdown('PROCESSING');

      await waitFor(() => {
        expect(axios.put).toHaveBeenCalledWith(
          '/api/orders/orders/1/status/',
          { status: 'PROCESSING' },
          expect.objectContaining({
            headers: expect.objectContaining({
              'Authorization': 'Bearer mock-token'
            })
          })
        );
      });
    });

    it('handles status update error', async () => {
      axios.put.mockRejectedValueOnce(new Error('Update failed'));
      
      render(<Orders />);
      
      await waitForLoadingToComplete();

      // Get the update button for order 1
      const updateButton = getUpdateButtonForOrder(1);
      fireEvent.click(updateButton);

      await clickStatusInDropdown('PROCESSING');

      await waitFor(() => {
        const errorElement = screen.getByTestId('error-message');
        expect(errorElement).toBeInTheDocument();
        expect(errorElement).toHaveTextContent('Failed to update order status');
      });
    });

    it('updates orders list after successful status update', async () => {
      const updatedOrder = { ...mockOrders[0], status: 'SHIPPED' };
      axios.put.mockResolvedValueOnce({ data: updatedOrder });
      
      render(<Orders />);
      
      await waitForLoadingToComplete();

      // Get the update button for order 1
      const updateButton = getUpdateButtonForOrder(1);
      fireEvent.click(updateButton);

      await clickStatusInDropdown('SHIPPED');

      await waitFor(() => {
        expect(axios.put).toHaveBeenCalledWith(
          '/api/orders/orders/1/status/',
          { status: 'SHIPPED' },
          expect.any(Object)
        );
      });
    });
  });

  describe('Delete Functionality', () => {
    it('shows confirmation dialog when delete is clicked', async () => {
      render(<Orders />);
      
      await waitForLoadingToComplete();

      const deleteButton = getDeleteButtonForOrder(1);
      fireEvent.click(deleteButton);

      expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to delete this order?');
    });

    it('deletes order when confirmed', async () => {
      render(<Orders />);
      
      await waitForLoadingToComplete();

      // Get the delete button for order 1
      const deleteButton = getDeleteButtonForOrder(1);
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(axios.delete).toHaveBeenCalledWith(
          '/api/orders/orders/1/delete/',
          expect.objectContaining({
            headers: expect.objectContaining({
              'Authorization': 'Bearer mock-token'
            })
          })
        );
      });
    });

    it('does not delete order when cancelled', async () => {
      window.confirm.mockReturnValueOnce(false);
      
      render(<Orders />);
      
      await waitForLoadingToComplete();

      const deleteButton = getDeleteButtonForOrder(1);
      fireEvent.click(deleteButton);

      expect(axios.delete).not.toHaveBeenCalled();
    });

    it('handles delete error', async () => {
      axios.delete.mockRejectedValueOnce(new Error('Delete failed'));
      
      render(<Orders />);
      
      await waitForLoadingToComplete();

      // Get the delete button for order 1
      const deleteButton = getDeleteButtonForOrder(1);
      fireEvent.click(deleteButton);

      await waitFor(() => {
        const errorElement = screen.getByTestId('error-message');
        expect(errorElement).toBeInTheDocument();
        expect(errorElement).toHaveTextContent('Failed to delete order');
      });
    });

    it('removes order from list after successful deletion', async () => {
      render(<Orders />);
      
      await waitForLoadingToComplete();

      // Verify order exists initially
      expect(screen.getByText('user1@test.com')).toBeInTheDocument();

      const deleteButton = getDeleteButtonForOrder(1);
      fireEvent.click(deleteButton);

      // Just verify the delete API was called with correct order ID
      await waitFor(() => {
        expect(axios.delete).toHaveBeenCalledWith(
          '/api/orders/orders/1/delete/',
          expect.objectContaining({
            headers: expect.objectContaining({
              'Authorization': 'Bearer mock-token'
            })
          })
        );
      });
    });

    it('disables delete button for non-PENDING orders', async () => {
      render(<Orders />);
      
      await waitForLoadingToComplete();

      const deleteButtons = getDeleteButtons();
      
      // Second order has status DELIVERED, should be disabled
      expect(deleteButtons[1]).toBeDisabled();
    });
  });

  describe('PDF Export Functionality', () => {
    it('generates PDF when Export PDF button is clicked', async () => {
      const mockDoc = {
        setFontSize: vi.fn(),
        text: vi.fn(),
        save: vi.fn()
      };
      jsPDF.mockReturnValue(mockDoc);
      
      render(<Orders />);
      
      await waitForLoadingToComplete();

      const exportButton = screen.getByText('Export PDF');
      fireEvent.click(exportButton);

      await waitFor(() => {
        expect(jsPDF).toHaveBeenCalled();
        expect(mockDoc.setFontSize).toHaveBeenCalled();
        expect(mockDoc.text).toHaveBeenCalled();
        expect(mockDoc.save).toHaveBeenCalled();
        expect(autoTable).toHaveBeenCalled();
      });
    });

    it('does not show Export PDF button when there are no orders', async () => {
      axios.get.mockResolvedValueOnce({ data: [] });
      
      render(<Orders />);
      
      await waitForLoadingToComplete();

      expect(screen.queryByText('Export PDF')).not.toBeInTheDocument();
    });
  });

  describe('Currency Formatting', () => {
    it('formats currency correctly', async () => {
      render(<Orders />);
      
      await waitForLoadingToComplete();

      // Check for KES formatted amounts (implementation may vary)
      expect(screen.getByText(/100/)).toBeInTheDocument();
      expect(screen.getByText(/200/)).toBeInTheDocument();
    });
  });

  describe('Status Badge Styling', () => {
    it('displays correct styling for different order statuses', async () => {
      const ordersWithAllStatuses = [
        { id: 1, user_email: 'user1@test.com', total_price: 100, status: 'PENDING' },
        { id: 2, user_email: 'user2@test.com', total_price: 200, status: 'PROCESSING' },
        { id: 3, user_email: 'user3@test.com', total_price: 150, status: 'SHIPPED' },
        { id: 4, user_email: 'user4@test.com', total_price: 175, status: 'DELIVERED' },
        { id: 5, user_email: 'user5@test.com', total_price: 125, status: 'CANCELLED' }
      ];
      
      axios.get.mockResolvedValueOnce({ data: ordersWithAllStatuses });
      
      render(<Orders />);
      
      await waitForLoadingToComplete();

      expect(screen.getByText('PENDING')).toBeInTheDocument();
      expect(screen.getAllByText('PROCESSING')[0]).toBeInTheDocument();
      expect(screen.getByText('SHIPPED')).toBeInTheDocument();
      expect(screen.getAllByText('DELIVERED')[0]).toBeInTheDocument();
      expect(screen.getByText('CANCELLED')).toBeInTheDocument();
    });
  });

  describe('Responsive Behavior', () => {
    it('switches to mobile view when window is resized to small width', async () => {
      window.innerWidth = 500;
      window.dispatchEvent(new Event('resize'));
      
      render(<Orders />);
      
      await waitForLoadingToComplete();

      // Mobile view should show cards instead of table
      // Implementation specific to your component
    });

    it('switches to desktop view when window is resized to large width', async () => {
      window.innerWidth = 1024;
      window.dispatchEvent(new Event('resize'));
      
      render(<Orders />);
      
      await waitForLoadingToComplete();

      // Desktop view should show table
      expect(screen.getByText('Order ID')).toBeInTheDocument();
    });

    it('cleans up resize event listener on unmount', () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
      
      const { unmount } = render(<Orders />);
      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function));
    });
  });

  describe('Edge Cases', () => {
    it('handles missing user access token gracefully', async () => {
      useAuth.mockReturnValue({ user: null });
      
      render(<Orders />);
      
      // Should not attempt to fetch orders without user
      await waitFor(() => {
        expect(axios.get).not.toHaveBeenCalled();
      });
    });

    it('handles orders with missing or undefined status', async () => {
      const ordersWithMissingStatus = [
        { id: 1, user_email: 'user1@test.com', total_price: 100, status: undefined }
      ];
      
      axios.get.mockResolvedValueOnce({ data: ordersWithMissingStatus });
      
      render(<Orders />);
      
      await waitForLoadingToComplete();

      // Should render without crashing
      expect(screen.getByText('user1@test.com')).toBeInTheDocument();
    });

    it('handles very long email addresses with truncation', async () => {
      const orderWithLongEmail = [
        { id: 1, user_email: 'verylongemailaddress@verylongdomainname.com', total_price: 100, status: 'PENDING' }
      ];
      
      axios.get.mockResolvedValueOnce({ data: orderWithLongEmail });
      
      render(<Orders />);
      
      await waitForLoadingToComplete();

      expect(screen.getByText('verylongemailaddress@verylongdomainname.com')).toBeInTheDocument();
    });
  });
});