import { describe, test, expect} from 'vitest';
import { render, screen } from '@testing-library/react';
import Header from '../src/components/Header';
import AuthContext from '../src/context/AuthContext';

describe('Header', () => {
    test('renders user avatar with first letter when user is logged in', () => {
        const mockUser = {
            email: 'test@example.com'
        };

        render(
            <AuthContext.Provider value={{ user: mockUser }}>
                <Header />
            </AuthContext.Provider>
        );

        const avatar = screen.getByTestId('user-avatar');
        expect(avatar).toBeInTheDocument();
        expect(avatar).toHaveTextContent('T');
        expect(avatar).toHaveAttribute('title', mockUser.email);
    });

    test('does not render user avatar when user is not logged in', () => {
        render(
            <AuthContext.Provider value={{ user: null }}>
                <Header />
            </AuthContext.Provider>
        );

        expect(screen.queryByTestId('user-avatar')).not.toBeInTheDocument();
    });

    test('displays correct initial for different email addresses', () => {
        const mockUser = {
            email: 'alice@example.com'
        };

        render(
            <AuthContext.Provider value={{ user: mockUser }}>
                <Header />
            </AuthContext.Provider>
        );

        const avatar = screen.getByTestId('user-avatar');
        expect(avatar).toHaveTextContent('A');
    });
});