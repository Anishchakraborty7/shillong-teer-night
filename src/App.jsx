import React, { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import HomePage from "./pages/HomePage";

// Lazy load admin routes to optimize public visitor bundle size
const AdminLoginPage = lazy(() => import("./pages/AdminLoginPage"));
const AdminPanelPage = lazy(() => import("./pages/AdminPanelPage"));

function AdminLoadingFallback() {
  return (
    <div className="admin-page-container">
      <div className="admin-card auth-card">
        <p className="admin-status-text">Loading...</p>
      </div>
    </div>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<AdminLoadingFallback />}>
        <Routes>
          {/* Public Homepage: Today's Result, Common Numbers, Past Results */}
          <Route path="/" element={<HomePage />} />

          {/* Private Admin Login */}
          <Route path="/admin/login" element={<AdminLoginPage />} />

          {/* Protected Admin Panel */}
          <Route path="/admin" element={<AdminPanelPage />} />

          {/* Catch-all redirect to public homepage */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
