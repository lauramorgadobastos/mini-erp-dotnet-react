export type FinancialEntryType = 'RECEITA' | 'DESPESA';
export type FinancialEntryOrigin = 'ESTOQUE' | 'MANUAL' | string;

export interface FinancialEntry {
    id: number;
    tipo: FinancialEntryType;
    origem: FinancialEntryOrigin;
    movimentacaoId?: number | null;
    descricao: string;
    categoria?: string | null;
    valor: number;
    criadoEm: string;
}

export interface CreateFinancialEntryPayload {
    tipo: FinancialEntryType;
    descricao: string;
    categoria: string;
    valor: number;
    dataVencimento?: string;
    observacao?: string | null;
}

export interface DashboardSummary {
    totalProdutos: number;
    produtosComEstoqueBaixo: number;
    totalQuantidadeEstoque: number;
    valorTotalEstoque: number;
    totalReceitas: number;
    totalDespesas: number;
    saldoFinanceiro: number;
}

export interface LowStockAlertProduct {
    id: number;
    sku: string;
    nome: string;
    quantidadeEstoque: number;
    estoqueMinimo: number;
}