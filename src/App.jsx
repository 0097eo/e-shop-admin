import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from "react-router-dom"
import DashBoardLayout from "./pages/DashBoardLayout"
import DashBoard from "./pages/DashBoard"
import Products from "./pages/Products"
import LoginPage from "./pages/Login"
import { useEffect, useState } from "react"

const ProtectedRoute = ({ children }) => {
  const hasAccess = localStorage.getItem("access") !== null

  if (!hasAccess){
    return <Navigate to="/login" replace />;
  }
  return children
}

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(
    localStorage.getItem("access") !== null
  )

  useEffect(() => {
    const checkAuth = () => {
      setIsAuthenticated(localStorage.getItem("access") !== null);
    };
    
    window.addEventListener("storage", checkAuth);
    
    return () => {
      window.removeEventListener("storage", checkAuth);
    };
  }, []);

  return (
    <Router>
      <Routes>
        {/* Public route */}
        <Route path="/login" element={<LoginPage />} />
        
        {/* Protected dashboard layout with nested routes */}
        <Route 
          element={
            <ProtectedRoute>
              <DashBoardLayout>
                <Outlet />
              </DashBoardLayout>
            </ProtectedRoute>
          } 
        >
          {/* Dashboard home */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          
          {/* Dashboard pages */}
          <Route path="/dashboard" element={<DashBoard />} />
          <Route path="/products" element={<Products />} />
        </Route>
        
        {/* Catch-all redirect */}
        <Route 
          path="*" 
          element={
            isAuthenticated ? 
              <Navigate to="/dashboard" replace /> : 
              <Navigate to="/login" replace />
          } 
        />
      </Routes>
    </Router>
  );
};

export default App;