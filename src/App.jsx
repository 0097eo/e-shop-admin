import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
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
    localStorage.getItem("access")!== null
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
        
        {/* Protected routes */}
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <DashBoardLayout />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <DashBoard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/products-admin" 
          element={
            <ProtectedRoute>
              <Products />
            </ProtectedRoute>
          } 
        />
        
        {/* Catch-all redirect to login if not authenticated, otherwise to dashboard */}
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