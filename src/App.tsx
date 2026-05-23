import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { CartProvider } from './context/CartContext';
import { ToastProvider } from './context/ToastContext';
import Layout from './components/Layout';
import ScrollToTop from './components/ScrollToTop';
import Home from './pages/Home';
import Lessons from './pages/Lessons';
import Shop from './pages/Shop';
import Subscribe from './pages/Subscribe';
import About from './pages/About';
import Login from './pages/Login';
import Orders from './pages/Orders';
import Cart from './pages/Cart';
import Success from './pages/Success';
import Dashboard from './pages/Dashboard';
import Activities from './pages/Activities';
import ForgotPassword from './pages/ForgotPassword';
import NotFound from './pages/NotFound';
import Admin from './pages/Admin';
import AdminLogin from './pages/AdminLogin';
import Stories from './pages/Stories';
import Calendar from './pages/Calendar';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';

function App() {
  return (
    <ThemeProvider>
    <AuthProvider>
      <CartProvider>
        <ToastProvider>
          <Router>
            <ScrollToTop />
            <Routes>
              {/* Admin routes — no main Layout wrapper */}
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin" element={<Admin />} />

              {/* Main site routes */}
              <Route path="/*" element={
                <Layout>
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/episodes" element={<Lessons />} />
                    <Route path="/lessons" element={<Lessons />} />
                    <Route path="/shop" element={<Shop />} />
                    <Route path="/cart" element={<Cart />} />
                    <Route path="/orders" element={<Orders />} />
                    <Route path="/success" element={<Success />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/activities" element={<Activities />} />
                    <Route path="/subscribe" element={<Subscribe />} />
                    <Route path="/about" element={<About />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/stories" element={<Stories />} />
                    <Route path="/calendar" element={<Calendar />} />
                    <Route path="/terms" element={<Terms />} />
                    <Route path="/privacy" element={<Privacy />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Layout>
              } />
            </Routes>
          </Router>
        </ToastProvider>
      </CartProvider>
    </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
