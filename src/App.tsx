import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { Toaster } from 'sonner';
import { useAuthInit } from './hooks/useAuthInit';
import { PageLoader } from './components/shared/PageLoader';

// Store Components
import { Header } from './components/store/Header';
import { Footer } from './components/store/Footer';

// Admin Components
import { AdminSidebar } from './components/admin/AdminSidebar';

// Shared Components
import { ProtectedRoute } from './components/shared/ProtectedRoute';
import { AdminRoute } from './components/shared/AdminRoute';

// Lazy Loaded Pages
const Home = lazy(() => import('./pages/Home'));
const Products = lazy(() => import('./pages/Products'));
const ProductDetail = lazy(() => import('./pages/ProductDetail'));
const Cart = lazy(() => import('./pages/Cart'));
const Checkout = lazy(() => import('./pages/Checkout'));
const OrderSuccess = lazy(() => import('./pages/OrderSuccess'));
const OrderTracking = lazy(() => import('./pages/OrderTracking'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Account = lazy(() => import('./pages/Account'));
const FAQ = lazy(() => import('./pages/FAQ'));
const Terms = lazy(() => import('./pages/Terms'));

// Admin Pages
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminOrders = lazy(() => import('./pages/admin/AdminOrders'));
const AdminOrderDetail = lazy(() => import('./pages/admin/AdminOrderDetail'));
const AdminProducts = lazy(() => import('./pages/admin/AdminProducts'));
const AdminProductForm = lazy(() => import('./pages/admin/AdminProductForm'));
const AdminCategories = lazy(() => import('./pages/admin/AdminCategories'));
const AdminCustomers = lazy(() => import('./pages/admin/AdminCustomers'));
const AdminCustomerDetail = lazy(() => import('./pages/admin/AdminCustomerDetail'));
const AdminSettings = lazy(() => import('./pages/admin/AdminSettings'));

const StoreLayout = () => (
  <div className="min-h-screen flex flex-col font-sans bg-gray-50">
    <Header />
    <main className="flex-grow">
      <Suspense fallback={<PageLoader />}>
        <Outlet />
      </Suspense>
    </main>
    <Footer />
  </div>
);

const AdminLayout = () => (
  <div className="min-h-screen flex flex-col lg:flex-row font-sans bg-gray-100" dir="rtl">
    <AdminSidebar />
    <main className="flex-grow overflow-x-hidden p-4 md:p-8">
      <Suspense fallback={<PageLoader />}>
        <Outlet />
      </Suspense>
    </main>
  </div>
);

function App() {
  // Bootstrap auth: reads existing session + listens for auth changes
  useAuthInit();

  return (
    <HelmetProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Store Routes */}
          <Route element={<StoreLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/products" element={<Products />} />
            <Route path="/products/:slug" element={<ProductDetail />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/order/track" element={<OrderTracking />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/terms" element={<Terms />} />
            
            {/* Protected Store Routes */}
            <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
            <Route path="/order/success" element={<ProtectedRoute><OrderSuccess /></ProtectedRoute>} />
            <Route path="/account" element={<ProtectedRoute><Account /></ProtectedRoute>} />
          </Route>

          {/* Admin Routes */}
          <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
            <Route index element={<AdminDashboard />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="orders/:id" element={<AdminOrderDetail />} />
            <Route path="products" element={<AdminProducts />} />
            <Route path="products/new" element={<AdminProductForm />} />
            <Route path="products/:id/edit" element={<AdminProductForm />} />
            <Route path="categories" element={<AdminCategories />} />
            <Route path="customers" element={<AdminCustomers />} />
            <Route path="customers/:id" element={<AdminCustomerDetail />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>
        </Routes>
        <Toaster position="top-center" richColors />
      </BrowserRouter>
    </HelmetProvider>
  );
}

export default App;
