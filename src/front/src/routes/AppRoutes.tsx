import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import { DashboardPage } from '../pages/DashboardPage';
import { FinancePage } from '../pages/FinancePage';
import { MovementsPage } from '../pages/MovementsPage';
import { ProductsPage } from '../pages/ProductsPage';

export function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="produtos" element={<ProductsPage />} />
          <Route path="movimentacoes" element={<MovementsPage />} />
          <Route path="financeiro" element={<FinancePage />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}