import { render, screen, waitFor, fireEvent, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import Dashboard from "../src/pages/DashBoard";

// Mock Recharts components
vi.mock("recharts", () => {
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
});

vi.mock('lucide-react', () => ({
    DollarSign: () => <div data-testid="icon-dollar" />,
    ShoppingBag: () => <div data-testid="icon-shopping-bag" />,
    Users: () => <div data-testid="icon-users" />,
    TrendingUp: () => <div data-testid="icon-trending-up" />,
    Package: () => <div data-testid="icon-package" />,
    Grid: () => <div data-testid="icon-grid" />,
    Calendar: () => <div data-testid="icon-calendar" />,
    RefreshCw: () => <div data-testid="icon-refresh" />
}));

// Mock localStorage
const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe("Dashboard Component", () => {
    // Sample data
    const mockDailySales = [
        { date: '2025-04-20', total_sales: '1000.50', order_count: '5', unique_customers: '3' },
        { date: '2025-04-21', total_sales: '1200.25', order_count: '7', unique_customers: '4' }
    ];

    const mockProductPerformance = [
        { product: '1', product_name: 'Product A', revenue: '800.30', units_sold: '12' },
        { product: '2', product_name: 'Product B', revenue: '650.20', units_sold: '8' }
    ];

    const mockCategoryPerformance = [
        { category: '1', category_name: 'Category A', revenue: '500.00', products_sold: '10' },
        { category: '2', category_name: 'Category B', revenue: '300.00', products_sold: '20' },
    ];

    const mockCustomerInsights = [
        { id: '1', user_email: 'user1@example.com', total_spent: '2500.75', orders_count: '12', average_order_value: '208.40' },
        { id: '2', user_email: 'user2@example.com', total_spent: '1800.25', orders_count: '8', average_order_value: '225.03' }
    ];

    // Fetch mock before each test
    beforeEach(() => {
        vi.resetAllMocks();

        // Mock localStorage.getItem to get token
        localStorageMock.getItem.mockReturnValue("fake-token");

        // Mock fetch
        window.fetch = vi.fn();

        // Configure fetch mock to return different data for different endpoints
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
            if (url.includes("update-metrics")) {
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({ success: true })
                });
            }
            return Promise.reject(new Error("Unknown endpoint"));
        });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('renders loading state initially', () => {
        render(<Dashboard />);
        const loading = screen.getByText(/Loading dashboard/i);
        expect(loading).toBeInTheDocument();
    });

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
      
        render(<Dashboard />);
      
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
      
        // Wait for loading to finish
        await waitFor(() => expect(screen.getByText('Sales Analytics Dashboard')).toBeInTheDocument());
      
        // Check header and basic structure
        expect(screen.getByText('Date Range')).toBeInTheDocument();
        expect(screen.getByLabelText('Start Date')).toBeInTheDocument();
        expect(screen.getByLabelText('End Date')).toBeInTheDocument();
      
        // Check summary cards
        expect(screen.getByText('Total Sales')).toBeInTheDocument();
        // Total from mockDailySales: 1000.50 + 1200.25 = 2200.75
        expect(screen.getByText('KES 2,200.75')).toBeInTheDocument();
      
        expect(screen.getByText('Total Orders')).toBeInTheDocument();
        // Total orders: 5 + 7 = 12
        const ordersElements = screen.getAllByText('12');
        expect(ordersElements.length).toBeGreaterThan(0);
      
        expect(screen.getByText('Unique Customers')).toBeInTheDocument();
        // Total unique customers: 3 + 4 = 7
        expect(screen.getByText('7')).toBeInTheDocument();
      
        expect(screen.getByText('Avg. Order Value')).toBeInTheDocument();
        // 2200.75 / 12 = 183.40
        expect(screen.getByText('KES 183.40')).toBeInTheDocument();
      
        // Check chart sections
        expect(screen.getByText('Daily Sales')).toBeInTheDocument();
        expect(screen.getByText('Top Products by Revenue')).toBeInTheDocument();
        expect(screen.getByText('Category Revenue Distribution')).toBeInTheDocument();
        expect(screen.getByText('Top Customers')).toBeInTheDocument();
      
        // Check customer table data
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
            // We need to check that at least one fetch call contains these date parameters
            const fetchCalls = window.fetch.mock.calls;
            const hasStartDate = fetchCalls.some(call => 
                call[0].includes('start_date=2025-04-15')
            );
            const hasEndDate = fetchCalls.some(call => 
                call[0].includes('end_date=2025-04-25')
            );
            
            expect(hasStartDate).toBe(true);
            expect(hasEndDate).toBe(true);
        });
    });

    it('handles the Update Metrics button click', async () => {
        render(<Dashboard />);
        
        await waitFor(() => {
            expect(screen.getByText('Sales Analytics Dashboard')).toBeInTheDocument();
        });
        
        // Find and click the update metrics button
        const updateButton = screen.getByText('Update Metrics');
        fireEvent.click(updateButton);
        
        // Check if the button text changes during updating
        expect(screen.getByText('Updating...')).toBeInTheDocument();
        
        await waitFor(() => {
            // Verify the POST request was made to the correct endpoint
            expect(fetch).toHaveBeenCalledWith(
                '/api/salesanalysis/update-metrics/',
                expect.objectContaining({
                    method: 'POST',
                    headers: expect.objectContaining({
                        'Authorization': 'Bearer fake-token'
                    })
                })
            );
            
            // Verify button text changes back after update completes
            expect(screen.getByText('Update Metrics')).toBeInTheDocument();
        });
    });

    it('renders charts correctly', async () => {
        render(<Dashboard />);

        await waitFor(() => {
            expect(screen.getByText('Sales Analytics Dashboard')).toBeInTheDocument();
        });

        // Check if charts are rendered
        const containers = screen.getAllByTestId('responsive-container');
        expect(containers.length).toBe(3);
        expect(screen.getByTestId("line-chart")).toBeInTheDocument();
        expect(screen.getByTestId("bar-chart")).toBeInTheDocument();
        expect(screen.getByTestId("pie-chart")).toBeInTheDocument();
    });

    it('verifies authentication headers are sent with requests', async () => {
        render(<Dashboard />);
        
        await waitFor(() => {
            // At least one fetch call should have the authorization header
            const fetchCalls = window.fetch.mock.calls;
            const hasAuthHeader = fetchCalls.some(call => 
                call[1]?.headers?.Authorization === 'Bearer fake-token'
            );
            
            expect(hasAuthHeader).toBe(true);
        });
    });

    it('handles try again button in error state', async () => {
        // First render with error
        window.fetch.mockRejectedValueOnce(new Error('Network error'));
        
        // Mock window.location.reload
        const reloadMock = vi.fn();
        const originalLocation = window.location;
        delete window.location;
        window.location = { reload: reloadMock };
        
        render(<Dashboard />);
        
        await waitFor(() => {
            expect(screen.getByText('Error')).toBeInTheDocument();
        });
        
        // Click try again button
        fireEvent.click(screen.getByText('Try Again'));
        
        // Check if reload was called
        expect(reloadMock).toHaveBeenCalledTimes(1);
        
        // Restore original window.location
        window.location = originalLocation;
    });
});

describe('Dashboard Utility Functions', () => {
    it('calculates metrics correctly with valid data', async () => {
        const mockData = [
            { date: '2025-04-20', total_sales: '1000.50', order_count: '5', unique_customers: '3' },
            { date: '2025-04-21', total_sales: '1200.25', order_count: '7', unique_customers: '4' }
        ];
        
        window.fetch = vi.fn().mockImplementation((url) => {
            if (url.includes("daily-sales")) {
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve(mockData)
                });
            }
            return Promise.resolve({
                ok: true,
                json: () => Promise.resolve([])
            });
        });
        
        localStorageMock.getItem.mockReturnValue('fake-token');
        
        render(<Dashboard />);
        
        await waitFor(() => {
            // Total sales: 1000.50 + 1200.25 = 2200.75
            expect(screen.getByText('KES 2,200.75')).toBeInTheDocument();
            
            // Total orders: 5 + 7 = 12
            const ordersElements = screen.getAllByText('12');
            expect(ordersElements.length).toBeGreaterThan(0);
            
            // Unique customers: 3 + 4 = 7
            expect(screen.getByText('7')).toBeInTheDocument();
            
            // Average order value: 2200.75 / 12 = 183.40
            expect(screen.getByText('KES 183.40')).toBeInTheDocument();
        });
    });
    
    it('handles missing or invalid data gracefully', async () => {
        const mockDataWithErrors = [
            { date: '2025-04-20', total_sales: null, order_count: 'not-a-number', unique_customers: null },
            { date: '2025-04-21', total_sales: '1200.25', order_count: '7', unique_customers: '4' }
        ];
        
        window.fetch = vi.fn().mockImplementation((url) => {
            if (url.includes("daily-sales")) {
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve(mockDataWithErrors)
                });
            }
            return Promise.resolve({
                ok: true,
                json: () => Promise.resolve([])
            });
        });
        
        localStorageMock.getItem.mockReturnValue('fake-token');
        
        render(<Dashboard />);
        
        await waitFor(() => {
            // Only valid total_sales should be summed: 0 + 1200.25 = 1200.25
            expect(screen.getByText('KES 1,200.25')).toBeInTheDocument();

            // Unique customers: 0 + 4 = 4
            expect(screen.getByText('4')).toBeInTheDocument();
            
            // Average order value calculated with valid values
            // 1200.25 / 7 = 171.46...
            expect(screen.getByText('KES 171.46')).toBeInTheDocument();
        });
    });
});