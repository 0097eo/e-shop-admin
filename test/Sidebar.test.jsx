import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import AuthContext from '../src/context/AuthContext';
import Sidebar from '../src/components/Sidebar';

const mockNavigate = vi.fn();
const mockLocation = { pathname: '/dashboard' };

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useLocation: () => mockLocation,
  BrowserRouter: ({ children }) => <div>{children}</div>
}));

describe('Sidebar', () => {
  const mockLogout = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderWithRouter = (ui) => {
    return render(
      <AuthContext.Provider value={{ logout: mockLogout }}>
        {ui}
      </AuthContext.Provider>
    );
  };

  it('renders the sidebar with logo and title', () => {
    renderWithRouter(<Sidebar />);
    expect(screen.getByAltText('Logo')).toBeInTheDocument();
    expect(screen.getByText('Ideal Admin')).toBeInTheDocument();
  });

  it('renders all menu items', () => {
    renderWithRouter(<Sidebar />);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Product Performance')).toBeInTheDocument();
    expect(screen.getByText('Orders')).toBeInTheDocument();
    expect(screen.getByText('Products')).toBeInTheDocument();
  });

  it('highlights active menu item', () => {
    renderWithRouter(<Sidebar />);
    const dashboardButton = screen.getByText('Dashboard').closest('button');
    expect(dashboardButton).toHaveClass('bg-teal-500/20');
  });

  it('navigates when menu item is clicked', () => {
    renderWithRouter(<Sidebar />);
    fireEvent.click(screen.getByText('Orders'));
    expect(mockNavigate).toHaveBeenCalledWith('/orders');
  });

  it('handles logout correctly', () => {
    renderWithRouter(<Sidebar />);
    fireEvent.click(screen.getByText('Signout'));
    expect(mockLogout).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });
});