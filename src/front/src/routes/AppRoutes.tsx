import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import { ProductsPage } from '../pages/ProductsPage';
import { MovementsPage } from '../pages/MovementsPage';

function PlaceholderModulePage({ name, endpointHint }: { name: string; endpointHint: string }) {
  return (
    <div className="sf-card p-4">
      <div className="d-flex align-items-center gap-2 mb-2">
        <i className="bi bi-tools text-primary fs-5" aria-hidden="true" />
        <h2 className="h6 mb-0 fw-semibold">{name}</h2>
      </div>
      <p className="text-secondary small mb-0">
        Estrutura de rota pronta para receber a implementação completa deste módulo ({endpointHint}).
      </p>
    </div>
  );
}

export function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<Navigate to="/produtos" replace />} />
          <Route path="produtos" element={<ProductsPage />} />
          <Route path="movimentacoes" element={<MovementsPage />} />
          <Route
            path="financeiro"
            element={
              <PlaceholderModulePage
                name="Módulo Financeiro"
                endpointHint="módulo previsto na Issue #14"
              />
            }
          />
          <Route
            path="dashboard"
            element={
              <PlaceholderModulePage
                name="Dashboard Operacional"
                endpointHint="módulo previsto na Issue #14"
              />
            }
          />
          <Route path="*" element={<Navigate to="/produtos" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}