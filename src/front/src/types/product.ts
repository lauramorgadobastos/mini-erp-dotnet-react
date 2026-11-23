export interface Product {
    id: number;
    sku: string;
    nome: string;
    descricao?: string | null;
    precoUnitario: number;
    custoUnitario: number;
    quantidadeEstoque: number;
    estoqueMinimo: number;
    ativo: boolean;
    criadoEm?: string;
    atualizadoEm?: string;
}

export interface CreateProductPayload {
    sku: string;
    nome: string;
    descricao?: string | null;
    precoUnitario: number;
    custoUnitario: number;
    quantidadeEstoque: number;
    estoqueMinimo: number;
}

export interface UpdateProductPayload {
    nome: string;
    descricao?: string | null;
    precoUnitario: number;
    custoUnitario: number;
    estoqueMinimo: number;
    ativo: boolean;
}

export function isLowStock(product: Product): boolean {
    return product.estoqueMinimo > 0
        ? product.quantidadeEstoque <= product.estoqueMinimo
        : product.quantidadeEstoque <= 5;
}