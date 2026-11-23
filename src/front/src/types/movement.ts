export type MovementType = 'ENTRADA' | 'SAIDA';

export interface StockMovement {
    id: number;
    produtoId: number;
    tipo: MovementType;
    quantidade: number;
    valorUnitario: number;
    valorTotal: number;
    observacao?: string | null;
    criadoEm: string;
}

export interface CreateMovementPayload {
    produtoId: number;
    tipo: MovementType;
    quantidade: number;
    valorUnitario?: number | null;
    observacao?: string | null;
}