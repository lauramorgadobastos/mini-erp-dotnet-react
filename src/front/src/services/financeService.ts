import { api } from './api';
import type {
    CreateFinancialEntryPayload,
    DashboardSummary,
    FinancialEntry,
    FinancialEntryType,
    LowStockAlertProduct,
} from '../types/finance';

const FINANCEIRO_ENDPOINT = '/api/financeiro';
const DASHBOARD_RESUMO_ENDPOINT = '/api/dashboard/resumo';
const DASHBOARD_ALERTAS_ENDPOINT = '/api/dashboard/alertas-estoque';

export const financeService = {
    async listEntries(tipo?: FinancialEntryType): Promise<FinancialEntry[]> {
        const query = tipo ? { tipo } : undefined;
        const data = await api.get<FinancialEntry[]>(FINANCEIRO_ENDPOINT, query);
        return Array.isArray(data) ? data : [];
    },

    async createEntry(payload: CreateFinancialEntryPayload): Promise<FinancialEntry> {
        return api.post<FinancialEntry>(FINANCEIRO_ENDPOINT, {
            tipo: payload.tipo,
            origem: 'MANUAL',
            descricao: payload.descricao.trim(),
            categoria: payload.categoria.trim() || 'Geral',
            valor: payload.valor,
            dataVencimento: payload.dataVencimento || undefined,
            observacao: payload.observacao?.trim() || null,
        });
    },

    async getDashboardSummary(): Promise<DashboardSummary> {
        return api.get<DashboardSummary>(DASHBOARD_RESUMO_ENDPOINT);
    },

    async getLowStockAlerts(): Promise<LowStockAlertProduct[]> {
        const data = await api.get<LowStockAlertProduct[]>(DASHBOARD_ALERTAS_ENDPOINT);
        return Array.isArray(data) ? data : [];
    },
};