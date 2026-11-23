import { api } from './api';
import type { CreateMovementPayload, StockMovement } from '../types/movement';

const MOVIMENTACOES_ENDPOINT = '/api/movimentacoes';

export const movementsService = {
    async list(): Promise<StockMovement[]> {
        const data = await api.get<StockMovement[]>(MOVIMENTACOES_ENDPOINT);
        return Array.isArray(data) ? data : [];
    },

    async create(payload: CreateMovementPayload): Promise<StockMovement> {
        return api.post<StockMovement>(MOVIMENTACOES_ENDPOINT, {
            produtoId: payload.produtoId,
            tipo: payload.tipo,
            quantidade: payload.quantidade,
            valorUnitario:
                typeof payload.valorUnitario === 'number' && !Number.isNaN(payload.valorUnitario)
                    ? payload.valorUnitario
                    : null,
            observacao: payload.observacao?.trim() || null,
        });
    },
};