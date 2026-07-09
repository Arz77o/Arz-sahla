import React, { lazy, Suspense, useEffect } from "react";
import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { Toaster } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthInit } from "./hooks/useAuthInit";
import { PageLoader } from "./components/shared/PageLoader";
import { supabase } from "./lib/supabase";

// Store Components
import { Header } from "./components/store/Header";
import { Footer } from "./components/store/Footer";

// Admin Components
import { AdminSidebar } from "./components/admin/AdminSidebar";

// Shared Components
import { ProtectedRoute } from "./components/shared/ProtectedRoute";
import { AdminRoute } from "./components/shared/AdminRoute";
import { GoogleTagManager } from "./components/shared/GoogleTagManager";
import { TopBanner } from "./components/shared/TopBanner";
import { FloatingWhatsApp } from "./components/shared/FloatingWhatsApp";

// Eagerly Loaded Critical Pages (Fixes LCP Delay!)
import Home from "./pages/Home";

// Lazy Loaded Secondary Pages
const Products = lazy(() => import("./pages/Products"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const Cart = lazy(() => import("./pages/Cart"));
const Checkout = lazy(() => import("./pages/Checkout"));
const OrderSuccess = lazy(() => import("./pages/OrderSuccess"));
const OrderTracking = lazy(() => import("./pages/OrderTracking"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const Account = lazy(() => import("./pages/Account"));
const FAQ = lazy(() => import("./pages/FAQ"));
const Terms = lazy(() => import("./pages/Terms"));

// Admin Pages
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminOrders = lazy(() => import("./pages/admin/AdminOrders"));
const AdminOrderDetail = lazy(() => import("./pages/admin/AdminOrderDetail"));
const AdminProducts = lazy(() => import("./pages/admin/AdminProducts"));
const AdminProductForm = lazy(() => import("./pages/admin/AdminProductForm"));
const AdminCategories = lazy(() => import("./pages/admin/AdminCategories"));
const AdminCustomers = lazy(() => import("./pages/admin/AdminCustomers"));
const AdminCustomerDetail = lazy(
  () => import("./pages/admin/AdminCustomerDetail"),
);
const AdminSettings = lazy(() => import("./pages/admin/AdminSettings"));
const AdminReviews = lazy(() => import("./pages/admin/AdminReviews"));
const PricingCalculator = lazy(() => import("./pages/admin/PricingCalculator"));

const StoreLayout = () => (
  <div className="min-h-screen flex flex-col font-sans bg-gray-50">
    <TopBanner />
    <Header />
    <main className="grow">
      <Suspense fallback={<PageLoader />}>
        <Outlet />
      </Suspense>
    </main>
    <Footer />
    <FloatingWhatsApp />
  </div>
);

const AdminLayout = () => (
  <div
    className="min-h-screen flex flex-col lg:flex-row font-sans bg-surface-low"
    dir="rtl"
  >
    <AdminSidebar />
    <main className="grow overflow-x-hidden p-4 md:p-8 lg:p-10">
      <Suspense fallback={<PageLoader />}>
        <Outlet />
      </Suspense>
    </main>
  </div>
);

function App() {
  // Bootstrap auth: reads existing session + listens for auth changes
  useAuthInit();

  const queryClient = useQueryClient();

  // Prefetch products & categories on app load to speed up /products page
  // Defer fetching until browser is idle to avoid bandwidth competition with critical initial page requests
  useEffect(() => {
    const prefetchData = async () => {
      try {
        // Prefetch categories
        queryClient.prefetchQuery({
          queryKey: ["categories"],
          queryFn: async () => {
            const { data } = await supabase
              .from("categories")
              .select("*")
              .order("name_ar");
            return data || [];
          },
          staleTime: 1000 * 60 * 10, // 10 minutes
        });

        // Prefetch products (no category filter = all products)
        queryClient.prefetchQuery({
          queryKey: ["products", undefined],
          queryFn: async () => {
            const { data } = await (supabase
              .from("products")
              .select("*") as any)
              .eq("is_published", true)
              .order("created_at", { ascending: false });
            return data || [];
          },
          staleTime: 1000 * 60 * 5, // 5 minutes
        });
      } catch (err) {
        console.warn("Prefetch failed:", err);
      }
    };

    // Use requestIdleCallback with a setTimeout fallback to defer execution until main thread is free
    const idleCallback = (window as any).requestIdleCallback || ((cb: any) => setTimeout(cb, 4000));
    const handle = idleCallback(() => prefetchData());

    return () => {
      if ((window as any).cancelIdleCallback) {
        (window as any).cancelIdleCallback(handle);
      } else {
        clearTimeout(handle);
      }
    };
  }, [queryClient]);

  return (
    <HelmetProvider>
      <BrowserRouter>
        <GoogleTagManager />
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

            {/* Public/Guest Accessible Routes */}
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/order/success" element={<OrderSuccess />} />

            {/* Protected Store Routes */}
            <Route
              path="/account"
              element={
                <ProtectedRoute>
                  <Account />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Admin Routes */}
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminLayout />
              </AdminRoute>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="orders/:id" element={<AdminOrderDetail />} />
            <Route path="products" element={<AdminProducts />} />
            <Route path="products/new" element={<AdminProductForm />} />
            <Route path="products/:id/edit" element={<AdminProductForm />} />
            <Route path="categories" element={<AdminCategories />} />
            <Route path="customers" element={<AdminCustomers />} />
            <Route path="customers/:id" element={<AdminCustomerDetail />} />
            <Route path="reviews" element={<AdminReviews />} />
            <Route path="settings" element={<AdminSettings />} />
            <Route path="pricing-calculator" element={<PricingCalculator />} />
          </Route>
        </Routes>
        <Toaster position="bottom-right" richColors />
      </BrowserRouter>
    </HelmetProvider>
  );
}

export default App;
