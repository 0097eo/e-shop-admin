import { describe, test, expect} from 'vitest';
import { render, screen } from '@testing-library/react';
import Header from '../src/components/Header';
import AuthContext from '../src/context/AuthContext';

describe('Header', () => {
    test('renders welcome message when user is logged in', () => {
        const mockUser = {
            email: 'test@example.com'
        };

        render(
            <AuthContext.Provider value={{ user: mockUser }}>
                <Header />
            </AuthContext.Provider>
        );

        expect(screen.getByText(`Welcome, ${mockUser.email}`)).toBeInTheDocument();
    });

    test('does not render welcome message when user is not logged in', () => {
        render(
            <AuthContext.Provider value={{ user: null }}>
                <Header />
            </AuthContext.Provider>
        );

        expect(screen.queryByText(/Welcome/)).not.toBeInTheDocument();
    });
});