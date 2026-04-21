import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import { AccountLayout } from "./components/layout/AccountLayout";
import { AdminLayout } from "./components/layout/AdminLayout";
import { RootLayout } from "./components/layout/RootLayout";
import { AdminRoute, ProtectedRoute, SuperAdminRoute } from "./components/layout/RouteGuards";
import { AdminBlogPage } from "./pages/admin/AdminBlogPage";
import { AdminCouponsPage } from "./pages/admin/AdminCouponsPage";
import { AdminDashboardPage } from "./pages/admin/AdminDashboardPage";
import { AdminOrdersPage } from "./pages/admin/AdminOrdersPage";
import { AdminProductFormPage } from "./pages/admin/AdminProductFormPage";
import { AdminProductsPage } from "./pages/admin/AdminProductsPage";
import { AdminReportedReviewsPage } from "./pages/admin/AdminReportedReviewsPage";
import { AdminReviewsPage } from "./pages/admin/AdminReviewsPage";
import { AdminSubAdminsPage } from "./pages/admin/AdminSubAdminsPage";
import { AdminTagsPage } from "./pages/admin/AdminTagsPage";
import { AdminUsersPage } from "./pages/admin/AdminUsersPage";
import { ForgotPasswordPage } from "./pages/auth/ForgotPasswordPage";
import { LoginPage } from "./pages/auth/LoginPage";
import { RegisterPage } from "./pages/auth/RegisterPage";
import { ResetPasswordPage } from "./pages/auth/ResetPasswordPage";
import { TokenExpiredPage } from "./pages/auth/TokenExpiredPage";
import { VerificationPendingPage } from "./pages/auth/VerificationPendingPage";
import { VerifyEmailPage } from "./pages/auth/VerifyEmailPage";
import { AddressesPage } from "./pages/client/AddressesPage";
import { CartPage } from "./pages/client/CartPage";
import { CheckoutPage } from "./pages/client/CheckoutPage";
import { ClientDashboardPage } from "./pages/client/ClientDashboardPage";
import { OrderConfirmedPage } from "./pages/client/OrderConfirmedPage";
import { OrdersPage } from "./pages/client/OrdersPage";
import { ProfilePage } from "./pages/client/ProfilePage";
import { WishlistPage } from "./pages/client/WishlistPage";
import { BlogPage } from "./pages/public/BlogPage";
import { BlogPostPage } from "./pages/public/BlogPostPage";
import { BrandPage } from "./pages/public/BrandPage";
import { CatalogPage } from "./pages/public/CatalogPage";
import { CategoryPage } from "./pages/public/CategoryPage";
import { ContactPage } from "./pages/public/ContactPage";
import { HomePage } from "./pages/public/HomePage";
import { LookbookPage } from "./pages/public/LookbookPage";
import { ProductDetailsPage } from "./pages/public/ProductDetailsPage";
import { SearchPage } from "./pages/public/SearchPage";
import { SizeGuidePage } from "./pages/public/SizeGuidePage";

const App = () => (
  <BrowserRouter>
    <Routes>
      <Route element={<RootLayout />}>
        <Route index element={<HomePage />} />
        <Route path="productos" element={<CatalogPage />} />
        <Route path="productos/:id" element={<ProductDetailsPage />} />
        <Route path="marca/:nombre" element={<BrandPage />} />
        <Route path="categoria/:nombre" element={<CategoryPage />} />
        <Route path="buscar" element={<SearchPage />} />
        <Route path="ofertas" element={<Navigate to="/productos?etiqueta=OFERTA" replace />} />
        <Route path="lookbook" element={<LookbookPage />} />
        <Route path="guia-de-tallas" element={<SizeGuidePage />} />
        <Route path="blog" element={<BlogPage />} />
        <Route path="blog/:id" element={<BlogPostPage />} />
        <Route path="contacto" element={<ContactPage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="registro" element={<RegisterPage />} />
        <Route path="verificar-email" element={<VerifyEmailPage />} />
        <Route path="verificacion-pendiente" element={<VerificationPendingPage />} />
        <Route path="recuperar-contrasena" element={<ForgotPasswordPage />} />
        <Route path="nueva-contrasena" element={<ResetPasswordPage />} />
        <Route path="token-expirado" element={<TokenExpiredPage />} />
        <Route
          path="cuenta"
          element={
            <ProtectedRoute>
              <AccountLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<ClientDashboardPage />} />
          <Route path="pedidos" element={<OrdersPage />} />
          <Route path="wishlist" element={<WishlistPage />} />
          <Route path="perfil" element={<ProfilePage />} />
          <Route path="direcciones" element={<AddressesPage />} />
        </Route>
        <Route
          path="carrito"
          element={
            <ProtectedRoute>
              <CartPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="checkout"
          element={
            <ProtectedRoute>
              <CheckoutPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="pedido-confirmado/:id"
          element={
            <ProtectedRoute>
              <OrderConfirmedPage />
            </ProtectedRoute>
          }
        />
      </Route>
      <Route
        path="admin"
        element={
          <AdminRoute>
            <AdminLayout />
          </AdminRoute>
        }
      >
        <Route index element={<AdminDashboardPage />} />
        <Route path="productos" element={<AdminProductsPage />} />
        <Route path="productos/nuevo" element={<AdminProductFormPage />} />
        <Route path="productos/editar/:id" element={<AdminProductFormPage />} />
        <Route path="ordenes" element={<AdminOrdersPage />} />
        <Route
          path="usuarios"
          element={
            <SuperAdminRoute>
              <AdminUsersPage />
            </SuperAdminRoute>
          }
        />
        <Route
          path="sub-admins"
          element={
            <SuperAdminRoute>
              <AdminSubAdminsPage />
            </SuperAdminRoute>
          }
        />
        <Route path="etiquetas" element={<AdminTagsPage />} />
        <Route path="cupones" element={<AdminCouponsPage />} />
        <Route path="resenas" element={<AdminReviewsPage />} />
        <Route path="resenas/reportadas" element={<AdminReportedReviewsPage />} />
        <Route path="blog" element={<AdminBlogPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </BrowserRouter>
);

export default App;
