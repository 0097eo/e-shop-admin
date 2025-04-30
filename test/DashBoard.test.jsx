//import React from "react";
import { render, screen, waitFor, fireEvent, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import Dashboard from "../src/pages/DashBoard";
import { LineChart, ResponsiveContainer } from "recharts";


//mock recharts components
vi.mock("recharts", ()=> {
    const originalModule = vi.importActual("recharts");
    return {
        ...originalModule,
        ResponsiveContainer: ({ children }) => <div data-testid="responsive-container">{children}</div>,
        LineChart: ({ children }) => <div data-testid="line-chart">{children}</div>,
        BarChart: ({ children }) => <div data-testid="bar-chart">{children}</div>,
        PieChart: ({ children }) => <div data-testid="pie-chart">{children}</div>,
        Line: () => <div data-testid="line" />,
        Bar: () => <div data-testid="bar" />,
        Pie: () => <div data-testid="pie" />,
        XAxis: () => <div data-testid="x-axis" />,
        YAxis: () => <div data-testid="y-axis" />,
        CartesianGrid: () => <div data-testid="cartesian-grid" />,
        Tooltip: () => <div data-testid="tooltip" />,
        Legend: () => <div data-testid="legend" />,
        Cell: () => <div data-testid="cell" />
        }
})

vi.mock('lucide-react', () => ({
    DollarSign: () => <div data-testid="icon-dollar" />,
    ShoppingBag: () => <div data-testid="icon-shopping-bag" />,
    Users: () => <div data-testid="icon-users" />,
    TrendingUp: () => <div data-testid="icon-trending-up" />,
    Package: () => <div data-testid="icon-package" />,
    Grid: () => <div data-testid="icon-grid" />,
    Calendar: () => <div data-testid="icon-calendar" />
  }));


  //mock localstrorage
  const localStorageMock  = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  }

Object.defineProperty(window, 'localStorage', {value: localStorageMock});

describe("Dashboard Component", () => {
    //sample data
    const mockDailySales = [
        { date: '2025-04-20', total_sales: '1000.50', order_count: '5', unique_customers: '3' },
        { date: '2025-04-21', total_sales: '1200.25', order_count: '7', unique_customers: '4' }
    ];

    const mockProductPerformance = [
        { product: '1', product_name: 'Product A', revenue: '800.30', units_sold: '12' },
        { product: '2', product_name: 'Product B', revenue: '650.20', units_sold: '8' }
    ]

    const mockCategoryPerformance = [
        {category: '1', category_name: 'Category A', revenue: '500.00', units_sold: '10'},
        {category: '2', category_name: 'Category B', revenue: '300.00', units_sold: '20'},
    ]

    const mockCustomerInsights = [
        { id: '1', user_email: 'user1@example.com', total_spent: '2500.75', orders_count: '12', average_order_value: '208.40' },
        { id: '2', user_email: 'user2@example.com', total_spent: '1800.25', orders_count: '8', average_order_value: '225.03' }
      ];
    

    //fetch mock before each test
    beforeEach(()=> {
        vi.resetAllMocks()

        //mock localStorage.getItem to get token
        localStorageMock.getItem.mockReturnValue("fake-token")

        //mock fetch
        global.fetch = vi.fn()

        // configure fetch mock to return different data for different endpoints
        fetch.mockImplementation((url) => {
            if (url.includes("daily-sales")) {
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve(mockDailySales)
                });
            }
            if (url.includes("product-performance")) {
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve(mockProductPerformance)
                });
            }
            if (url.includes("category-performance")) {
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve(mockCategoryPerformance)
                });
            }
            if (url.includes("customer-insights")) {
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve(mockCustomerInsights)
                });
            }
            return Promise.reject(new Error("Unknown endpoint"));
        });
    })

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('renders loading state initially', () => {
        render(<Dashboard />);
        const loading = screen.getByText(/Loading.../i);
        expect(loading).toBeInTheDocument();
    })

    it('renders error state if fetch fails', async () => {
        fetch.mockRejectedValueOnce(new Error('Failed to fetch data'));
        
        render(<Dashboard />);
        
        await waitFor(() => {
          expect(screen.getByText('Error')).toBeInTheDocument();
          expect(screen.getByText('Failed to fetch data')).toBeInTheDocument();
        });
      });

    it('renders error state if API returns non-ok response', async () => {
        fetch.mockImplementationOnce(() => 
          Promise.resolve({
            ok: false,
            status: 403,
            statusText: 'Forbidden'
          })
        );
      
        await act(async () => {
          render(<Dashboard />);
        });
      
        await waitFor(() => {
          expect(screen.getByText('Error')).toBeInTheDocument();
        });
      });

    it('renders error state when localStorage has no token', async () => {
        localStorageMock.getItem.mockReturnValueOnce(null);
        
        render(<Dashboard />);
        
        await waitFor(() => {
          expect(screen.getByText('Error')).toBeInTheDocument();
          expect(screen.getByText('Authentication token not found')).toBeInTheDocument();
        });
    });

    it('renders dashboard with metrics after successful data fetch', async () => {
        render(<Dashboard />);
      
        // Wait for something that only appears *after* fetch completes
        await waitFor(() => expect(screen.getByText('Sales Analytics Dashboard')).toBeInTheDocument());
      
        // Then do the rest of your checks directly — no need to nest inside `waitFor` anymore
        expect(screen.getByText('Date Range')).toBeInTheDocument();
        expect(screen.getByText('Start Date')).toBeInTheDocument();
        expect(screen.getByText('End Date')).toBeInTheDocument();
      
        expect(screen.getByText('Total Sales')).toBeInTheDocument();
        expect(screen.getByText('KES 2,200.75')).toBeInTheDocument();
      
        expect(screen.getByText('Total Orders')).toBeInTheDocument();
        expect(screen.getAllByText('12').length).toBeGreaterThan(0);
      
        expect(screen.getByText('Unique Customers')).toBeInTheDocument();
        expect(screen.getByText('7')).toBeInTheDocument();
      
        expect(screen.getByText('Avg. Order Value')).toBeInTheDocument();
        expect(screen.getByText('KES 183.40')).toBeInTheDocument();
      
        expect(screen.getByText('Daily Sales')).toBeInTheDocument();
        expect(screen.getByText('Top Products by Revenue')).toBeInTheDocument();
        expect(screen.getByText('Category Revenue Distribution')).toBeInTheDocument();
        expect(screen.getByText('Top Customers')).toBeInTheDocument();
      
        expect(screen.getByText('user1@example.com')).toBeInTheDocument();
        expect(screen.getByText('user2@example.com')).toBeInTheDocument();
      });

      it('handles date range selection', async () => {
        render(<Dashboard />);
        
        await waitFor(() => {
          expect(screen.getByText('Sales Analytics Dashboard')).toBeInTheDocument();
        });
        
        // Get date inputs
        const startDateInput = screen.getByLabelText('Start Date');
        const endDateInput = screen.getByLabelText('End Date');
        
        // Change dates
        await act(async () => {
          fireEvent.change(startDateInput, { target: { value: '2025-04-15' } });
          fireEvent.change(endDateInput, { target: { value: '2025-04-25' } });
        });
        
        // Verify fetch was called with new date range
        await waitFor(() => {
          expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining('start_date=2025-04-15'),
            expect.any(Object)
          );
          expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining('end_date=2025-04-25'),
            expect.any(Object)
          );
        });
      });

      it('verifies formatNumber utility function works correctly', async () => {
        render(<Dashboard />);
        
        await waitFor(() => {
          expect(screen.getByText('KES 2,200.75')).toBeInTheDocument();
          expect(screen.getAllByText('12').length).toBeGreaterThan(0);
        });
      });

      it("renders charts correctly", async () => {
        render(<Dashboard />);

        await waitFor(() => {
            expect(screen.getByText('Sales Analytics Dashboard')).toBeInTheDocument();
        });

        // Check if charts are rendered
        expect(screen.getAllByTestId('responsive-container').length).toBe(3);
        expect(screen.getByTestId("line-chart")).toBeInTheDocument();
        expect(screen.getByTestId("bar-chart")).toBeInTheDocument();
        expect(screen.getByTestId("pie-chart")).toBeInTheDocument();

      })

      it('verifies authentication headers are sent with requests', async () => {
        render(<Dashboard />);
        
        await waitFor(() => {
          // Verify the token from localStorage was used in fetch calls
          expect(global.fetch).toHaveBeenCalledWith(
            expect.any(String),
            expect.objectContaining({
              headers: expect.objectContaining({
                'Authorization': 'Bearer fake-token'
              })
            })
          );
        });
      });

      it('handles try again button in error state', async () => {
        // First render with error
        global.fetch.mockRejectedValueOnce(new Error('Network error'));
        
        // Mock window.location.reload
        const reloadMock = vi.fn();
        Object.defineProperty(window, 'location', {
          value: { reload: reloadMock },
          writable: true
        });
        
        render(<Dashboard />);
        
        await waitFor(() => {
          expect(screen.getByText('Error')).toBeInTheDocument();
        });
        
        // Click try again button
        fireEvent.click(screen.getByText('Try Again'));
        
        // Check if reload was called
        expect(reloadMock).toHaveBeenCalledTimes(1);
      });
})

describe('Dashboard Utility Functions', () => {
    
    it('calculateMetric calculates sums correctly', async () => {
      const mockDailySales = [
        { date: '2025-04-20', total_sales: '1000.50', order_count: '5' },
        { date: '2025-04-21', total_sales: '1200.25', order_count: '7' }
      ];
      
      global.fetch = vi.fn().mockImplementation(() => {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockDailySales)
        });
      });
      
      localStorageMock.getItem.mockReturnValue('fake-token');
      
      render(<Dashboard />);
      
      await waitFor(() => {
        // Total sales sum: 1000.50 + 1200.25 = 2200.75
        expect(screen.getByText('KES 2,200.75')).toBeInTheDocument();
        
        // Total orders sum: 5 + 7 = 12
        expect(screen.getByText('12')).toBeInTheDocument();
      });
    });
    
    it('handles missing or invalid data gracefully', async () => {
      const mockDailySalesWithErrors = [
        { date: '2025-04-20', total_sales: null, order_count: 'not-a-number' },
        { date: '2025-04-21', total_sales: '1200.25', order_count: '7' }
      ];
      
      global.fetch = vi.fn().mockImplementation(() => {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockDailySalesWithErrors)
        });
      });
      
      localStorageMock.getItem.mockReturnValue('fake-token');
      
      render(<Dashboard />);
      
      await waitFor(() => {
        // Only valid total_sales should be summed: 0 + 1200.25 = 1200.25
        expect(screen.getByText('KES 1,200.25')).toBeInTheDocument();
        
        // Invalid order count should be treated as 0: 0 + 7 = 7
        expect(screen.getByText('7')).toBeInTheDocument();
      });
    });
})