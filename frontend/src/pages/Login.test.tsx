import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi, describe, it, expect } from 'vitest';
import Login from './Login';

// Mock the AuthContext
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    login: vi.fn(),
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// Mock useNavigate
const mockedUsedNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockedUsedNavigate,
  };
});

describe('Login Component', () => {
  it('renders login form correctly', () => {
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    expect(screen.getByRole('heading', { level: 1, name: /Welcome back/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/admin@ehr.local/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/••••••••/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sign in securely/i })).toBeInTheDocument();
  });

  it('updates email and password fields on change', () => {
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    const emailInput = screen.getByPlaceholderText(/admin@ehr.local/i) as HTMLInputElement;
    const passwordInput = screen.getByPlaceholderText(/••••••••/i) as HTMLInputElement;

    fireEvent.change(emailInput, { target: { value: 'test@ehr.local' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });

    expect(emailInput.value).toBe('test@ehr.local');
    expect(passwordInput.value).toBe('password123');
  });

  it('shows emulation buttons for quick access after clicking developer bypass', () => {
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    // Expand dev panel
    const toggle = screen.getByText(/Demo accounts/i);
    fireEvent.click(toggle);

    expect(screen.getByRole('button', { name: /Admin/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Doctor/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Patient/i })).toBeInTheDocument();
  });
});
