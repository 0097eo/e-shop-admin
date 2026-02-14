import { describe, test, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import App from "../src/App";

// Mock pages
vi.mock("../src/pages/Login", () => ({
  default: () => <div>Login Page</div>,
}));

vi.mock("../src/pages/DashBoardLayout", () => ({
  default: ({ children }) => (
    <div>
      <div>Dashboard Layout</div>
      {children}
    </div>
  ),
}));

vi.mock("../src/pages/DashBoard", () => ({
  default: () => <div>Dashboard Page</div>,
}));

vi.mock("../src/pages/Products", () => ({
  default: () => <div>Products Page</div>,
}));

vi.mock("../src/pages/Orders", () => ({
  default: () => <div>Orders Page</div>,
}));

vi.mock("../src/pages/ProductManangement", () => ({
  default: () => <div>Product Management Page</div>,
}));

const renderAtRoute = (route) => {
  window.history.pushState({}, "Test", route);
  return render(<App />);
};

describe("App routing & authentication", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("renders login page on /login", () => {
    renderAtRoute("/login");
    expect(screen.getByText("Login Page")).toBeInTheDocument();
  });

  test("redirects unauthenticated user to /login", () => {
    renderAtRoute("/dashboard");

    expect(screen.getByText("Login Page")).toBeInTheDocument();
  });

  test("allows authenticated user to access dashboard", () => {
    localStorage.setItem("access", "token");

    renderAtRoute("/dashboard");

    expect(screen.getByText("Dashboard Layout")).toBeInTheDocument();
  });

  test("renders products page for authenticated user", () => {
    localStorage.setItem("access", "token");

    renderAtRoute("/products");

    expect(screen.getByText("Products Page")).toBeInTheDocument();
  });

  test("renders orders page for authenticated user", () => {
    localStorage.setItem("access", "token");

    renderAtRoute("/orders");

    expect(screen.getByText("Orders Page")).toBeInTheDocument();
  });

  test("renders product management page for authenticated user", () => {
    localStorage.setItem("access", "token");

    renderAtRoute("/product-management");

    expect(
      screen.getByText("Product Management Page")
    ).toBeInTheDocument();
  });

  test("redirects / to /dashboard when authenticated", () => {
    localStorage.setItem("access", "token");

    renderAtRoute("/");

    expect(screen.getByText("Dashboard Page")).toBeInTheDocument();
  });

  test("catch-all redirects unauthenticated user to /login", () => {
    renderAtRoute("/some-random-route");

    expect(screen.getByText("Login Page")).toBeInTheDocument();
  });

  test("catch-all redirects authenticated user to /dashboard", () => {
    localStorage.setItem("access", "token");

    renderAtRoute("/some-random-route");

    expect(screen.getByText("Dashboard Page")).toBeInTheDocument();
  });

  test("updates authentication state when storage event fires", () => {
    renderAtRoute("/dashboard");

    // Initially unauthenticated
    expect(screen.getByText("Login Page")).toBeInTheDocument();

    // Simulate login in another tab
    localStorage.setItem("access", "token");
    fireEvent(
      window,
      new StorageEvent("storage", {
        key: "access",
        newValue: "token",
      })
    );


  });
});
