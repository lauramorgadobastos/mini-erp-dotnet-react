import { api } from './api';
import type {
    CreateProductPayload,
    Product,
    UpdateProductPayload,
} from '../types/product';

const PRODUTOS_ENDPOINT = '/api/produtos';

export const productsService = {
    async list(search?: string, incluirInativos = true): Promise<Product[]> {
        const data = await api.get<Product[]>(PRODUTOS_ENDPOINT, { incluirInativos });
        const list = Array.isArray(data) ? data : [];

        const term = search?.trim().toLowerCase();
        if (!term) return list;

        return list.filter(
            (p) =>
                p.nome.toLowerCase().includes(term) ||
                p.sku.toLowerCase().includes(term) ||
                (p.descricao ?? '').toLowerCase().includes(term)
        );
    },

    async getById(id: number): Promise<Product> {
        return api.get<Product>(`${PRODUTOS_ENDPOINT}/${id}`);
    },

    async create(payload: CreateProductPayload): Promise<Product> {
        return api.post<Product>(PRODUTOS_ENDPOINT, {
            ...payload,
            sku: payload.sku.trim().toUpperCase(),
            nome: payload.nome.trim(),
            descricao: payload.descricao?.trim() || null,
        });
    },

    async update(id: number, payload: UpdateProductPayload): Promise<Product> {
        return api.put<Product>(`${PRODUTOS_ENDPOINT}/${id}`, {
            ...payload,
            nome: payload.nome.trim(),
            descricao: payload.descricao?.trim() || null,
        });
    },

    async setStatus(id: number, ativo: boolean): Promise<Product> {
        return api.patch<Product>(`${PRODUTOS_ENDPOINT}/${id}/status`, undefined, { ativo });
    },
};