import { useEffect, useId, useState } from 'react';
import { ConfirmModal, type ConfirmVariant } from '../components/ConfirmModal';
import { FeedbackToastContainer, type FeedbackMessage } from '../components/FeedbackToast';
import { productsService } from '../services/productsService';
import {
    isLowStock,
    type CreateProductPayload,
    type Product,
    type UpdateProductPayload,
} from '../types/product';

interface ProductFormState {
    sku: string;
    nome: string;
    descricao: string;
    precoUnitario: number;
    custoUnitario: number;
    quantidadeEstoque: number;
    estoqueMinimo: number;
    ativo: boolean;
}

const INITIAL_FORM: ProductFormState = {
    sku: '',
    nome: '',
    descricao: '',
    precoUnitario: 0,
    custoUnitario: 0,
    quantidadeEstoque: 0,
    estoqueMinimo: 5,
    ativo: true,
};

function formatBRL(value: number): string {
    return value.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    });
}

export function ProductsPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [search, setSearch] = useState<string>('');
    const [filterLowStockOnly, setFilterLowStockOnly] = useState<boolean>(false);

    const [toasts, setToasts] = useState<FeedbackMessage[]>([]);

    const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [saving, setSaving] = useState<boolean>(false);
    const [formData, setFormData] = useState<ProductFormState>(INITIAL_FORM);

    const [confirmModalState, setConfirmModalState] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        confirmLabel: string;
        variant: ConfirmVariant;
        iconClass: string;
        action: () => Promise<void>;
    }>({
        isOpen: false,
        title: '',
        message: '',
        confirmLabel: 'Confirmar',
        variant: 'warning',
        iconClass: 'bi-exclamation-triangle-fill',
        action: async () => { },
    });
    const [actionLoading, setActionLoading] = useState<boolean>(false);

    const skuInputId = useId();
    const nomeInputId = useId();
    const descricaoInputId = useId();
    const precoInputId = useId();
    const custoInputId = useId();
    const estoqueInputId = useId();
    const minimoInputId = useId();
    const ativoInputId = useId();

    const addToast = (type: FeedbackMessage['type'], message: string, title?: string) => {
        const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        setToasts((prev) => [...prev, { id, type, message, title }]);
    };

    const removeToast = (id: string) => {
        setToasts((prev) => prev.filter((item) => item.id !== id));
    };

    const fetchProducts = async (searchTerm = search) => {
        setLoading(true);
        try {
            const data = await productsService.list(searchTerm, true);
            setProducts(data);
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Falha ao carregar a lista de produtos.';
            addToast('danger', msg, 'Erro na API');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = window.setTimeout(() => {
            fetchProducts(search);
        }, 250);
        return () => window.clearTimeout(timer);
    }, [search]);

    const handleOpenForm = (product?: Product) => {
        if (product) {
            setEditingProduct(product);
            setFormData({
                sku: product.sku,
                nome: product.nome,
                descricao: product.descricao ?? '',
                precoUnitario: product.precoUnitario,
                custoUnitario: product.custoUnitario,
                quantidadeEstoque: product.quantidadeEstoque,
                estoqueMinimo: product.estoqueMinimo,
                ativo: product.ativo,
            });
        } else {
            setEditingProduct(null);
            setFormData(INITIAL_FORM);
        }
        setIsFormOpen(true);
    };

    const handleCloseForm = () => {
        if (saving) return;
        setIsFormOpen(false);
        setEditingProduct(null);
    };

    const handleSaveProduct = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.nome.trim()) {
            addToast('warning', 'O nome do produto é obrigatório.');
            return;
        }

        if (!editingProduct && !formData.sku.trim()) {
            addToast('warning', 'O código do produto (SKU) é obrigatório.');
            return;
        }

        setSaving(true);
        try {
            if (editingProduct) {
                const updatePayload: UpdateProductPayload = {
                    nome: formData.nome,
                    descricao: formData.descricao,
                    precoUnitario: formData.precoUnitario,
                    custoUnitario: formData.custoUnitario,
                    estoqueMinimo: formData.estoqueMinimo,
                    ativo: formData.ativo,
                };
                await productsService.update(editingProduct.id, updatePayload);
                addToast('success', `Produto "${formData.nome.trim()}" atualizado com sucesso!`);
            } else {
                const createPayload: CreateProductPayload = {
                    sku: formData.sku,
                    nome: formData.nome,
                    descricao: formData.descricao,
                    precoUnitario: formData.precoUnitario,
                    custoUnitario: formData.custoUnitario,
                    quantidadeEstoque: formData.quantidadeEstoque,
                    estoqueMinimo: formData.estoqueMinimo,
                };
                await productsService.create(createPayload);
                addToast('success', `Produto "${formData.nome.trim()}" cadastrado com sucesso!`);
            }
            handleCloseForm();
            await fetchProducts();
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Não foi possível salvar o produto.';
            addToast('danger', msg, 'Erro ao Salvar');
        } finally {
            setSaving(false);
        }
    };

    const handlePromptToggleStatus = (product: Product) => {
        const proximoAtivo = !product.ativo;
        setConfirmModalState({
            isOpen: true,
            title: proximoAtivo ? 'Ativar Produto' : 'Inativar Produto',
            message: proximoAtivo
                ? `Deseja reativar o produto "${product.nome}" (${product.sku}) no catálogo?`
                : `Deseja inativar o produto "${product.nome}" (${product.sku}) no catálogo?`,
            confirmLabel: proximoAtivo ? 'Ativar' : 'Inativar',
            variant: proximoAtivo ? 'success' : 'warning',
            iconClass: proximoAtivo ? 'bi-check-circle-fill' : 'bi-dash-circle-fill',
            action: async () => {
                setActionLoading(true);
                try {
                    await productsService.setStatus(product.id, proximoAtivo);
                    addToast(
                        'success',
                        `Produto "${product.nome}" ${proximoAtivo ? 'ativado' : 'inativado'} com sucesso.`
                    );
                    await fetchProducts();
                } catch (err) {
                    const msg = err instanceof Error ? err.message : 'Erro ao alterar o status do produto.';
                    addToast('danger', msg);
                } finally {
                    setActionLoading(false);
                    setConfirmModalState((prev) => ({ ...prev, isOpen: false }));
                }
            },
        });
    };

    const filteredProducts = products.filter((p) => (filterLowStockOnly ? isLowStock(p) : true));
    const lowStockCount = products.filter(isLowStock).length;

    return (
        <div className="d-flex flex-column gap-4">
            <FeedbackToastContainer items={toasts} onDismiss={removeToast} />

            <div className="sf-card p-3 p-md-4">
                <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">
                    <div className="d-flex flex-grow-1 align-items-center gap-2">
                        <div className="input-group">
                            <span className="input-group-text bg-white border-end-0 text-secondary">
                                <i className="bi bi-search" aria-hidden="true" />
                            </span>
                            <input
                                type="text"
                                className="form-control border-start-0"
                                placeholder="Buscar por nome, código ou descrição..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                            {search && (
                                <button
                                    className="btn btn-outline-secondary"
                                    type="button"
                                    aria-label="Limpar busca"
                                    onClick={() => setSearch('')}
                                >
                                    <i className="bi bi-x-lg" aria-hidden="true" />
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="d-flex align-items-center gap-2">
                        <button
                            type="button"
                            className={`btn ${filterLowStockOnly ? 'btn-warning' : 'btn-outline-warning'} rounded-2 d-inline-flex align-items-center gap-2`}
                            onClick={() => setFilterLowStockOnly((prev) => !prev)}
                        >
                            <i className="bi bi-exclamation-triangle-fill" aria-hidden="true" />
                            <span>Estoque Baixo</span>
                            {lowStockCount > 0 && (
                                <span className="badge text-bg-dark rounded-pill ms-1">{lowStockCount}</span>
                            )}
                        </button>

                        <button
                            type="button"
                            className="btn sf-btn-primary rounded-2 d-inline-flex align-items-center gap-2"
                            onClick={() => handleOpenForm()}
                        >
                            <i className="bi bi-plus-lg" aria-hidden="true" />
                            <span>Novo Produto</span>
                        </button>
                    </div>
                </div>
            </div>

            <div className="sf-card p-0 overflow-hidden">
                <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0 sf-table">
                        <thead>
                            <tr>
                                <th className="ps-4">Código (SKU)</th>
                                <th>Produto</th>
                                <th>Preço Un.</th>
                                <th>Custo Un.</th>
                                <th>Estoque Atual</th>
                                <th>Status</th>
                                <th className="text-end pe-4">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="text-center py-5 text-secondary">
                                        <div className="spinner-border spinner-border-sm me-2" role="status" />
                                        Carregando catálogo de produtos...
                                    </td>
                                </tr>
                            ) : filteredProducts.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="text-center py-5 text-secondary">
                                        <i className="bi bi-inbox fs-3 d-block mb-2" aria-hidden="true" />
                                        Nenhum produto encontrado.
                                    </td>
                                </tr>
                            ) : (
                                filteredProducts.map((p) => {
                                    const hasLowStock = isLowStock(p);

                                    return (
                                        <tr key={p.id} className={hasLowStock ? 'table-warning-subtle' : undefined}>
                                            <td className="ps-4 fw-semibold text-secondary small">{p.sku}</td>
                                            <td>
                                                <div className="fw-semibold text-dark">{p.nome}</div>
                                                {p.descricao && (
                                                    <div className="text-secondary small">{p.descricao}</div>
                                                )}
                                            </td>
                                            <td className="fw-semibold">{formatBRL(p.precoUnitario)}</td>
                                            <td className="text-secondary">{formatBRL(p.custoUnitario)}</td>
                                            <td>
                                                <div className="d-flex align-items-center gap-2">
                                                    <span className={`fw-bold ${hasLowStock ? 'text-danger' : 'text-dark'}`}>
                                                        {p.quantidadeEstoque} un.
                                                    </span>
                                                    {hasLowStock && (
                                                        <span
                                                            className="badge bg-danger-subtle text-danger border border-danger-subtle rounded-2 small"
                                                            title={`Estoque mínimo: ${p.estoqueMinimo} un.`}
                                                        >
                                                            <i className="bi bi-exclamation-triangle-fill me-1" />
                                                            Mín. ({p.estoqueMinimo})
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td>
                                                <span
                                                    className={`badge ${p.ativo
                                                            ? 'bg-success-subtle text-success border border-success-subtle'
                                                            : 'bg-secondary-subtle text-secondary border border-secondary-subtle'
                                                        } rounded-2`}
                                                >
                                                    {p.ativo ? 'Ativo' : 'Inativo'}
                                                </span>
                                            </td>
                                            <td className="text-end pe-4">
                                                <div className="btn-group btn-group-sm">
                                                    <button
                                                        type="button"
                                                        className="btn btn-outline-secondary"
                                                        title="Editar produto"
                                                        onClick={() => handleOpenForm(p)}
                                                    >
                                                        <i className="bi bi-pencil-fill" aria-hidden="true" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className={`btn ${p.ativo ? 'btn-outline-warning' : 'btn-outline-success'}`}
                                                        title={p.ativo ? 'Inativar produto' : 'Ativar produto'}
                                                        onClick={() => handlePromptToggleStatus(p)}
                                                    >
                                                        <i
                                                            className={`bi ${p.ativo ? 'bi-dash-circle-fill' : 'bi-check-circle-fill'}`}
                                                            aria-hidden="true"
                                                        />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {isFormOpen && (
                <>
                    <div className="modal fade show d-block" tabIndex={-1} role="dialog" aria-modal="true">
                        <div className="modal-dialog modal-dialog-centered">
                            <div className="modal-content border-0 shadow">
                                <form onSubmit={handleSaveProduct}>
                                    <div className="modal-header">
                                        <h5 className="modal-title d-flex align-items-center gap-2">
                                            <i
                                                className={`bi ${editingProduct ? 'bi-pencil-square text-primary' : 'bi-plus-circle-fill'
                                                    }`}
                                            />
                                            <span>{editingProduct ? 'Editar Produto' : 'Novo Produto'}</span>
                                        </h5>
                                        <button
                                            type="button"
                                            className="btn-close"
                                            disabled={saving}
                                            onClick={handleCloseForm}
                                        />
                                    </div>

                                    <div className="modal-body d-flex flex-column gap-3">
                                        <div className="row g-2">
                                            <div className={editingProduct ? 'col-12' : 'col-6'}>
                                                <label htmlFor={nomeInputId} className="form-label small fw-semibold">
                                                    Nome *
                                                </label>
                                                <input
                                                    id={nomeInputId}
                                                    type="text"
                                                    className="form-control"
                                                    maxLength={120}
                                                    required
                                                    value={formData.nome}
                                                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                                                />
                                            </div>

                                            {!editingProduct && (
                                                <div className="col-6">
                                                    <label htmlFor={skuInputId} className="form-label small fw-semibold">
                                                        Código (SKU) *
                                                    </label>
                                                    <input
                                                        id={skuInputId}
                                                        type="text"
                                                        className="form-control text-uppercase"
                                                        placeholder="Ex.: PROD-006"
                                                        maxLength={40}
                                                        required
                                                        value={formData.sku}
                                                        onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                                                    />
                                                </div>
                                            )}
                                        </div>

                                        <div>
                                            <label htmlFor={descricaoInputId} className="form-label small fw-semibold">
                                                Descrição
                                            </label>
                                            <textarea
                                                id={descricaoInputId}
                                                className="form-control"
                                                rows={2}
                                                maxLength={500}
                                                value={formData.descricao}
                                                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                                            />
                                        </div>

                                        <div className="row g-2">
                                            <div className="col-6">
                                                <label htmlFor={precoInputId} className="form-label small fw-semibold">
                                                    Preço Unitário (R$)
                                                </label>
                                                <input
                                                    id={precoInputId}
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    className="form-control"
                                                    value={formData.precoUnitario}
                                                    onChange={(e) =>
                                                        setFormData({
                                                            ...formData,
                                                            precoUnitario: Number.parseFloat(e.target.value) || 0,
                                                        })
                                                    }
                                                />
                                            </div>

                                            <div className="col-6">
                                                <label htmlFor={custoInputId} className="form-label small fw-semibold">
                                                    Custo Unitário (R$)
                                                </label>
                                                <input
                                                    id={custoInputId}
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    className="form-control"
                                                    value={formData.custoUnitario}
                                                    onChange={(e) =>
                                                        setFormData({
                                                            ...formData,
                                                            custoUnitario: Number.parseFloat(e.target.value) || 0,
                                                        })
                                                    }
                                                />
                                            </div>
                                        </div>

                                        <div className="row g-2">
                                            {!editingProduct && (
                                                <div className="col-6">
                                                    <label htmlFor={estoqueInputId} className="form-label small fw-semibold">
                                                        Estoque Inicial
                                                    </label>
                                                    <input
                                                        id={estoqueInputId}
                                                        type="number"
                                                        min="0"
                                                        className="form-control"
                                                        value={formData.quantidadeEstoque}
                                                        onChange={(e) =>
                                                            setFormData({
                                                                ...formData,
                                                                quantidadeEstoque: Number.parseInt(e.target.value, 10) || 0,
                                                            })
                                                        }
                                                    />
                                                </div>
                                            )}

                                            <div className={editingProduct ? 'col-12' : 'col-6'}>
                                                <label htmlFor={minimoInputId} className="form-label small fw-semibold">
                                                    Estoque Mínimo
                                                </label>
                                                <input
                                                    id={minimoInputId}
                                                    type="number"
                                                    min="0"
                                                    className="form-control"
                                                    value={formData.estoqueMinimo}
                                                    onChange={(e) =>
                                                        setFormData({
                                                            ...formData,
                                                            estoqueMinimo: Number.parseInt(e.target.value, 10) || 0,
                                                        })
                                                    }
                                                />
                                            </div>
                                        </div>

                                        {editingProduct && (
                                            <div className="form-check mt-1">
                                                <input
                                                    id={ativoInputId}
                                                    className="form-check-input"
                                                    type="checkbox"
                                                    checked={formData.ativo}
                                                    onChange={(e) => setFormData({ ...formData, ativo: e.target.checked })}
                                                />
                                                <label htmlFor={ativoInputId} className="form-check-label small fw-medium">
                                                    Produto ativo no catálogo
                                                </label>
                                            </div>
                                        )}
                                    </div>

                                    <div className="modal-footer border-top-0 pt-0">
                                        <button
                                            type="button"
                                            className="btn btn-outline-secondary rounded-2"
                                            disabled={saving}
                                            onClick={handleCloseForm}
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            type="submit"
                                            className="btn sf-btn-primary rounded-2 d-inline-flex align-items-center gap-2"
                                            disabled={saving}
                                        >
                                            {saving && (
                                                <span className="spinner-border spinner-border-sm" role="status" />
                                            )}
                                            <span>{editingProduct ? 'Atualizar' : 'Cadastrar'}</span>
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                    <div className="modal-backdrop fade show" />
                </>
            )}

            <ConfirmModal
                isOpen={confirmModalState.isOpen}
                title={confirmModalState.title}
                message={confirmModalState.message}
                confirmLabel={confirmModalState.confirmLabel}
                variant={confirmModalState.variant}
                iconClass={confirmModalState.iconClass}
                isLoading={actionLoading}
                onConfirm={confirmModalState.action}
                onCancel={() => setConfirmModalState((prev) => ({ ...prev, isOpen: false }))}
            />
        </div>
    );
}