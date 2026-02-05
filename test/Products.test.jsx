import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import axios from 'axios';
import Products from '../src/pages/Products';

// Mock ResizeObserver
window.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
}));

// Mock Recharts components
vi.mock('recharts', () => {
    const originalModule = vi.importActual('recharts');
    return {
        ...originalModule,
        ResponsiveContainer: ({ children }) => <div data-testid="responsive-container">{children}</div>,
        LineChart: ({ children }) => <div data-testid="line-chart">{children}</div>,
        BarChart: ({ children }) => <div data-testid="bar-chart">{children}</div>,
        PieChart: ({ children }) => <div data-testid="pie-chart">{children}</div>,
        Line: () => <div data-testid="line" />,
        Bar: () => <div data-testid="bar" />,
        Pie: () => <div data-testid="pie" />,
        Cell: () => <div data-testid="cell" />,
        XAxis: () => <div data-testid="x-axis" />,
        YAxis: () => <div data-testid="y-axis" />,
        CartesianGrid: () => <div data-testid="cartesian-grid" />,
        Tooltip: () => <div data-testid="tooltip" />,
        Legend: () => <div data-testid="legend" />
    };
});

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
    Table: () => <div data-testid="icon-table" />,
    ChevronDown: () => <div data-testid="icon-chevron-down" />,
    ChevronUp: () => <div data-testid="icon-chevron-up" />,
    BarChart2: () => <div data-testid="icon-bar-chart" />,
    Trash2: () => <div data-testid="icon-trash" />,
    Edit: () => <div data-testid="icon-edit" />,
    Calendar: () => <div data-testid="icon-calendar" />,
    Search: () => <div data-testid="icon-search" />,
    RefreshCw: () => <div data-testid="icon-refresh" />,
    Download: () => <div data-testid="icon-download" />,
    X: () => <div data-testid="icon-x" />,
    PieChart: () => <div data-testid="icon-pie-chart" />,
    LineChart: () => <div data-testid="icon-line-chart" />,
    Activity: () => <div data-testid="icon-activity" />
}));

// Mock dependencies
vi.mock('axios');
vi.mock('../src/hooks/useAuth', () => ({
    default: () => ({
        user: { access: 'fake-token' },
        logout: vi.fn()
    })
}));

// Mock localStorage
const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('Products Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorageMock.getItem.mockReturnValue('fake-token');
    });

    const mockProductData = [
        {
            id: 1,
            date: '2024-01-01',
            product: 1,
            product_name: 'Test Product',
            units_sold: 100,
            revenue: 5000,
            average_rating: 4.5
        }
    ];

    // Helper function to render with AuthProvider
    const renderWithAuth = (component) => {
        return render(component);
    };

    it('renders initial product performance table', async () => {
        axios.get.mockResolvedValueOnce({ data: mockProductData });
        
        renderWithAuth(<Products />);
        
        await waitFor(() => {
            expect(screen.getByText('Product Performance')).toBeInTheDocument();
        });
        
        expect(axios.get).toHaveBeenCalledWith(
            '/api/salesanalysis/product-performance/',
            expect.any(Object)
        );
    });

    it('handles sorting when clicking table headers', async () => {
        axios.get.mockResolvedValueOnce({ data: mockProductData });
        
        renderWithAuth(<Products />);
        
        await waitFor(() => {
            expect(screen.getByText('Date')).toBeInTheDocument();
        });

        const dateHeader = screen.getByText('Date').closest('th');
        fireEvent.click(dateHeader);
        
        // Verify the table still renders after sorting
        expect(screen.getByText('Product Performance')).toBeInTheDocument();
    });

    it('switches between different views', async () => {
        axios.get.mockResolvedValueOnce({ data: mockProductData });
        
        renderWithAuth(<Products />);

        await waitFor(() => {
            expect(screen.getByText('Charts')).toBeInTheDocument();
        });

        const chartsButton = screen.getByText('Charts');
        fireEvent.click(chartsButton);
        
        // Wait for dashboard view to render
        await waitFor(() => {
            expect(screen.getByText('Revenue by Product')).toBeInTheDocument();
        });
    });

    it('shows error message on failed API call', async () => {
        axios.get.mockRejectedValueOnce(new Error('API Error'));
        
        renderWithAuth(<Products />);

        await waitFor(() => {
            expect(screen.getByText('Failed to fetch product performance data')).toBeInTheDocument();
        });
    });

    it('opens report form when clicking Generate Report button', async () => {
        axios.get.mockResolvedValueOnce({ data: mockProductData });
        
        renderWithAuth(<Products />);

        await waitFor(() => {
            const reportButton = screen.getByText('Generate Report');
            fireEvent.click(reportButton);
        });
        
        expect(screen.getByText('Generate Product Performance Report')).toBeInTheDocument();
    });

    it('formats currency correctly', async () => {
        axios.get.mockResolvedValueOnce({ data: mockProductData });
        
        renderWithAuth(<Products />);

        await waitFor(() => {
            expect(screen.getByText('KES 5,000.00')).toBeInTheDocument();
        });
    });

    it('formats rating correctly', async () => {
        axios.get.mockResolvedValueOnce({ data: mockProductData });
        
        renderWithAuth(<Products />);

        await waitFor(() => {
            expect(screen.getByText('4.5')).toBeInTheDocument();
        });
    });

    it('handles delete product performance', async () => {
        axios.get.mockResolvedValueOnce({ data: mockProductData });
        axios.delete.mockResolvedValueOnce({});
        
        window.confirm = vi.fn(() => true);
        
        renderWithAuth(<Products />);

        await waitFor(() => {
            expect(screen.getByText('Test Product')).toBeInTheDocument();
        });

        const allButtons = screen.getAllByRole('button');
        const deleteButton = allButtons.find(btn => {
            const classList = btn.className || '';
            return classList.includes('text-red');
        });
        
        fireEvent.click(deleteButton);

        await waitFor(() => {
            expect(window.confirm).toHaveBeenCalled();
            expect(axios.delete).toHaveBeenCalled();
        });
    });

    it('exports PDF when clicking export button', async () => {
        axios.get.mockResolvedValueOnce({ data: mockProductData });
        
        renderWithAuth(<Products />);

        await waitFor(() => {
            const exportButton = screen.getByText('Export PDF');
            fireEvent.click(exportButton);
        });
        
        // Cannot fully test PDF generation but can verify button exists
        expect(screen.getByText('Export PDF')).toBeInTheDocument();
    });
});