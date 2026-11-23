import { useEffect, useId, useMemo, useState } from 'react';
import { ConfirmModal, type ConfirmVariant } from '../components/ConfirmModal';
import { FeedbackToastContainer, type FeedbackMessage } from '../components/FeedbackToast';
import { movementsService } from '../services/movementsService';
import { productsService } from '../services/productsService';
import type { MovementType, StockMovement } from '../types/movement';
import type { Product } from '../types/product';

function formatBRL(value: number): string {
    return value.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    });
}

function formatDateTime(isoString: string): string {
    const date = new Date(isoString);
    if (Number.isNaN(date.getTime())) return isoString;
    return date.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function toInputDateLocal(isoString: string): string {
    const date = new Date(isoString);
    if (Number.isNaN(date.getTime())) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

export function MovementsPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [movements, setMovements] = useState<StockMovement[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [submitting, setSubmitting] = useState<boolean>(false);

    // Campos do formulário de movimentação
    const [selectedProductId, setSelectedProductId] = useState<string>('');
    const [tipo, setTipo] = useState<MovementType>('ENTRADA');
    const [quantidade, setQuantidade] = useState<number>(1);
    const [valorUnitarioInput, setValorUnitarioInput] = useState<string>('');
    const [observacao, setObservacao] = useState<string>('');

    // Filtros do histórico
    const [dateFrom, setDateFrom] = useState<string>('');
    const [dateTo, setDateTo] = useState<string>('');
    const [typeFilter, setTypeFilter] = useState<'TODOS' | MovementType>('TODOS');
    const [searchTerm, setSearchTerm] = useState<string>('');

    // Feedbacks (Toasts) e ConfirmModal
    const [toasts, setToasts] = useState<FeedbackMessage[]>([]);
    const [actionLoading, setActionLoading] = useState<boolean>(false);
    const [confirmState, setConfirmState] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        confirmLabel: string;
        variant: ConfirmVariant;
        iconClass: string;
        onConfirm: () => Promise<void>;
    }>({
        isOpen: false,
        title: '',
        message: '',
        confirmLabel: 'Confirmar',
        variant: 'warning',
        iconClass: 'bi-exclamation-triangle-fill',
        onConfirm: async () => { },
    });

    const produtoSelectId = useId();
    const tipoSelectId = useId();
    const quantidadeInputId = useId();
    const valorUnitarioId = useId();
    const observacaoId = useId();
    const dateFromId = useId();
    const dateToId = useId();

    const addToast = (type: FeedbackMessage['type'], message: string, title?: string) => {
        const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        setToasts((prev) => [...prev, { id, type, message, title }]);
    };

    const removeToast = (id: string) => {
        setToasts((prev) => prev.filter((item) => item.id !== id));
    };

    const loadData = async () => {
        setLoading(true);
        try {
            const [productsData, movementsData] = await Promise.all([
                productsService.list(undefined, true),
                movementsService.list(),
            ]);
            setProducts(productsData);
            setMovements(movementsData);

            if (!selectedProductId && productsData.length > 0) {
                const firstActive = productsData.find((p) => p.ativo) ?? productsData[0];
                setSelectedProductId(String(firstActive.id));
            }
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Falha ao carregar dados de estoque.';
            addToast('danger', msg, 'Erro na API');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const productMap = useMemo(() => {
        const map = new Map<number, Product>();
        for (const product of products) {
            map.set(product.id, product);
        }
        return map;
    }, [products]);

    const selectedProduct = useMemo(() => {
        const idNum = Number(selectedProductId);
        if (!idNum) return undefined;
        return productMap.get(idNum);
    }, [selectedProductId, productMap]);

    const suggestedUnitValue = useMemo(() => {
        if (!selectedProduct) return 0;
        return tipo === 'ENTRADA' ? selectedProduct.custoUnitario : selectedProduct.precoUnitario;
    }, [selectedProduct, tipo]);

    const effectiveUnitValue = useMemo(() => {
        if (valorUnitarioInput.trim() === '') return suggestedUnitValue;
        const parsed = Number.parseFloat(valorUnitarioInput);
        return Number.isNaN(parsed) ? 0 : Math.max(0, parsed);
    }, [valorUnitarioInput, suggestedUnitValue]);

    const projectedStock = useMemo(() => {
        if (!selectedProduct) return null;
        const qty = Math.max(0, quantidade || 0);
        return tipo === 'ENTRADA'
            ? selectedProduct.quantidadeEstoque + qty
            : selectedProduct.quantidadeEstoque - qty;
    }, [selectedProduct, quantidade, tipo]);

    const isInsufficientStockForExit =
        selectedProduct !== undefined &&
        tipo === 'SAIDA' &&
        quantidade > 0 &&
        quantidade > selectedProduct.quantidadeEstoque;

    const executeRegistration = async () => {
        if (!selectedProduct) {
            addToast('warning', 'Selecione um produto válido.');
            return;
        }

        setSubmitting(true);
        try {
            const customValue =
                valorUnitarioInput.trim() === '' ? null : Number.parseFloat(valorUnitarioInput);

            await movementsService.create({
                produtoId: selectedProduct.id,
                tipo,
                quantidade,
                valorUnitario: customValue,
                observacao,
            });

            addToast(
                'success',
                `${tipo === 'ENTRADA' ? 'Entrada' : 'Saída'} de ${quantidade} un. registrada para "${selectedProduct.nome}".`
            );

            setQuantidade(1);
            setValorUnitarioInput('');
            setObservacao('');
            await loadData();
        } catch (err) {
            const msg =
                err instanceof Error
                    ? err.message
                    : 'Não foi possível registrar a movimentação de estoque.';
            addToast('danger', msg, 'Falha na Movimentação');
        } finally {
            setSubmitting(false);
        }
    };

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedProduct) {
            addToast('warning', 'Selecione um produto antes de registrar.');
            return;
        }

        if (!selectedProduct.ativo) {
            addToast(
                'warning',
                `O produto "${selectedProduct.nome}" está inativo. Ative-o no catálogo antes de movimentar.`
            );
            return;
        }

        if (!quantidade || quantidade <= 0) {
            addToast('warning', 'Informe uma quantidade maior que zero.');
            return;
        }

        if (tipo === 'SAIDA') {
            setConfirmState({
                isOpen: true,
                title: 'Confirmar Saída de Estoque',
                message: `Confirma a saída de ${quantidade} un. de "${selectedProduct.nome}" (${selectedProduct.sku})? Saldo atual: ${selectedProduct.quantidadeEstoque} un.`,
                confirmLabel: 'Confirmar Saída',
                variant: 'warning',
                iconClass: 'bi-box-arrow-up-right',
                onConfirm: async () => {
                    setActionLoading(true);
                    try {
                        await executeRegistration();
                    } finally {
                        setActionLoading(false);
                        setConfirmState((prev) => ({ ...prev, isOpen: false }));
                    }
                },
            });
            return;
        }

        await executeRegistration();
    };

    const filteredMovements = useMemo(() => {
        const term = searchTerm.trim().toLowerCase();

        return movements.filter((mov) => {
            if (typeFilter !== 'TODOS' && mov.tipo !== typeFilter) {
                return false;
            }

            const movDate = toInputDateLocal(mov.criadoEm);
            if (dateFrom && movDate && movDate < dateFrom) {
                return false;
            }
            if (dateTo && movDate && movDate > dateTo) {
                return false;
            }

            if (term) {
                const prod = productMap.get(mov.produtoId);
                const matchesProduct =
                    prod?.nome.toLowerCase().includes(term) || prod?.sku.toLowerCase().includes(term);
                const matchesObs = (mov.observacao ?? '').toLowerCase().includes(term);
                const matchesId = String(mov.produtoId).includes(term);
                if (!matchesProduct && !matchesObs && !matchesId) {
                    return false;
                }
            }

            return true;
        });
    }, [movements, typeFilter, dateFrom, dateTo, searchTerm, productMap]);

    const clearDateFilters = () => {
        setDateFrom('');
        setDateTo('');
        setTypeFilter('TODOS');
        setSearchTerm('');
    };

    return (
        <div className="d-flex flex-column gap-4">
            <FeedbackToastContainer items={toasts} onDismiss={removeToast} />

            {/* Formulário de Registro de Movimentação */}
            <div className="sf-card p-3 p-md-4">
                <div className="d-flex align-items-center justify-content-between mb-3">
                    <h2 className="h6 fw-bold mb-0 d-flex align-items-center gap-2">
                        <i className="bi bi-arrow-left-right text-success" aria-hidden="true" />
                        <span>Registrar Movimentação</span>
                    </h2>
                </div>

                <form onSubmit={handleFormSubmit}>
                    <div className="row g-3">
                        <div className="col-12 col-md-6">
                            <label htmlFor={produtoSelectId} className="form-label small fw-semibold">
                                Produto *
                            </label>
                            <select
                                id={produtoSelectId}
                                className="form-select"
                                value={selectedProductId}
                                onChange={(e) => {
                                    setSelectedProductId(e.target.value);
                                    setValorUnitarioInput('');
                                }}
                                disabled={loading || submitting || products.length === 0}
                            >
                                {products.length === 0 ? (
                                    <option value="">Nenhum produto disponível</option>
                                ) : (
                                    products.map((p) => (
                                        <option key={p.id} value={p.id}>
                                            [{p.sku}] {p.nome} {!p.ativo ? '(Inativo)' : ''}
                                        </option>
                                    ))
                                )}
                            </select>
                        </div>

                        <div className="col-6 col-md-3">
                            <label htmlFor={tipoSelectId} className="form-label small fw-semibold">
                                Tipo *
                            </label>
                            <select
                                id={tipoSelectId}
                                className="form-select"
                                value={tipo}
                                onChange={(e) => {
                                    setTipo(e.target.value as MovementType);
                                    setValorUnitarioInput('');
                                }}
                                disabled={submitting}
                            >
                                <option value="ENTRADA">ENTRADA</option>
                                <option value="SAIDA">SAIDA</option>
                            </select>
                        </div>

                        <div className="col-6 col-md-3">
                            <label htmlFor={quantidadeInputId} className="form-label small fw-semibold">
                                Quantidade *
                            </label>
                            <input
                                id={quantidadeInputId}
                                type="number"
                                min={1}
                                className="form-control"
                                value={quantidade}
                                onChange={(e) => setQuantidade(Number.parseInt(e.target.value, 10) || 0)}
                                disabled={submitting}
                                required
                            />
                        </div>

                        {/* Painel Dinâmico de Saldo do Produto Selecionado */}
                        <div className="col-12">
                            <div className="p-3 rounded-2 border bg-light-subtle d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-2">
                                {selectedProduct ? (
                                    <>
                                        <div className="d-flex flex-wrap align-items-center gap-3">
                                            <div>
                                                <span className="text-secondary small d-block">Saldo Atual</span>
                                                <span className="fw-bold fs-6 text-dark">
                                                    {selectedProduct.quantidadeEstoque} un.
                                                </span>
                                            </div>
                                            <div className="vr d-none d-sm-block" />
                                            <div>
                                                <span className="text-secondary small d-block">Estoque Mínimo</span>
                                                <span className="fw-semibold text-secondary">
                                                    {selectedProduct.estoqueMinimo} un.
                                                </span>
                                            </div>
                                            <div className="vr d-none d-sm-block" />
                                            <div>
                                                <span className="text-secondary small d-block">Saldo Projetado</span>
                                                <span
                                                    className={`fw-bold fs-6 ${projectedStock !== null && projectedStock < 0
                                                            ? 'text-danger'
                                                            : projectedStock !== null &&
                                                                projectedStock <= selectedProduct.estoqueMinimo
                                                                ? 'text-warning-emphasis'
                                                                : 'text-success'
                                                        }`}
                                                >
                                                    {projectedStock !== null ? `${projectedStock} un.` : '-'}
                                                </span>
                                            </div>
                                            <div className="vr d-none d-sm-block" />
                                            <div>
                                                <span className="text-secondary small d-block">Total Estimado</span>
                                                <span className="fw-semibold text-dark">
                                                    {formatBRL(effectiveUnitValue * Math.max(0, quantidade || 0))}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="d-flex align-items-center gap-2">
                                            {!selectedProduct.ativo && (
                                                <span className="badge bg-secondary-subtle text-secondary border border-secondary-subtle rounded-2">
                                                    Produto Inativo
                                                </span>
                                            )}
                                            {isInsufficientStockForExit && (
                                                <span className="badge bg-danger-subtle text-danger border border-danger-subtle rounded-2">
                                                    <i className="bi bi-exclamation-triangle-fill me-1" />
                                                    Saldo insuficiente para saída
                                                </span>
                                            )}
                                        </div>
                                    </>
                                ) : (
                                    <span className="text-secondary small">
                                        Selecione um produto para visualizar o saldo atual.
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="col-12 col-md-4">
                            <label htmlFor={valorUnitarioId} className="form-label small fw-semibold">
                                Valor Unitário (R$)
                            </label>
                            <input
                                id={valorUnitarioId}
                                type="number"
                                step="0.01"
                                min="0"
                                className="form-control"
                                placeholder={`Padrão: ${formatBRL(suggestedUnitValue)}`}
                                value={valorUnitarioInput}
                                onChange={(e) => setValorUnitarioInput(e.target.value)}
                                disabled={submitting}
                            />
                            <div className="form-text small">
                                Se vazio, utiliza {tipo === 'ENTRADA' ? 'o custo unitário' : 'o preço unitário'} do produto.
                            </div>
                        </div>

                        <div className="col-12 col-md-8">
                            <label htmlFor={observacaoId} className="form-label small fw-semibold">
                                Observação
                            </label>
                            <input
                                id={observacaoId}
                                type="text"
                                maxLength={300}
                                className="form-control"
                                placeholder="Ex.: Reposição de fornecedor, venda direta, ajuste de inventário..."
                                value={observacao}
                                onChange={(e) => setObservacao(e.target.value)}
                                disabled={submitting}
                            />
                        </div>

                        <div className="col-12 d-flex justify-content-end gap-2 pt-1">
                            <button
                                type="submit"
                                className="btn sf-btn-primary rounded-2 d-inline-flex align-items-center gap-2"
                                disabled={submitting || loading || !selectedProduct}
                            >
                                {submitting && (
                                    <span className="spinner-border spinner-border-sm" role="status" />
                                )}
                                <i className="bi bi-check-lg" aria-hidden="true" />
                                <span>Registrar {tipo === 'ENTRADA' ? 'Entrada' : 'Saída'}</span>
                            </button>
                        </div>
                    </div>
                </form>
            </div>

            {/* Filtros do Histórico */}
            <div className="sf-card p-3 p-md-4">
                <div className="row g-3 align-items-end">
                    <div className="col-12 col-md-4">
                        <label className="form-label small fw-semibold">Buscar no Histórico</label>
                        <div className="input-group">
                            <span className="input-group-text bg-white border-end-0 text-secondary">
                                <i className="bi bi-search" aria-hidden="true" />
                            </span>
                            <input
                                type="text"
                                className="form-control border-start-0"
                                placeholder="Produto, código ou observação..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="col-6 col-md-2">
                        <label className="form-label small fw-semibold">Tipo</label>
                        <select
                            className="form-select"
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value as 'TODOS' | MovementType)}
                        >
                            <option value="TODOS">Todos</option>
                            <option value="ENTRADA">ENTRADA</option>
                            <option value="SAIDA">SAIDA</option>
                        </select>
                    </div>

                    <div className="col-6 col-md-2">
                        <label htmlFor={dateFromId} className="form-label small fw-semibold">
                            Data Inicial
                        </label>
                        <input
                            id={dateFromId}
                            type="date"
                            className="form-control"
                            value={dateFrom}
                            onChange={(e) => setDateFrom(e.target.value)}
                        />
                    </div>

                    <div className="col-6 col-md-2">
                        <label htmlFor={dateToId} className="form-label small fw-semibold">
                            Data Final
                        </label>
                        <input
                            id={dateToId}
                            type="date"
                            className="form-control"
                            value={dateTo}
                            onChange={(e) => setDateTo(e.target.value)}
                        />
                    </div>

                    <div className="col-6 col-md-2 d-grid">
                        <button
                            type="button"
                            className="btn btn-outline-secondary rounded-2"
                            onClick={clearDateFilters}
                        >
                            Limpar Filtros
                        </button>
                    </div>
                </div>
            </div>

            {/* Tabela de Histórico de Movimentações */}
            <div className="sf-card p-0 overflow-hidden">
                <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0 sf-table">
                        <thead>
                            <tr>
                                <th className="ps-4">Data / Hora</th>
                                <th>Tipo</th>
                                <th>Produto</th>
                                <th>Qtd.</th>
                                <th>Valor Un.</th>
                                <th>Valor Total</th>
                                <th className="pe-4">Observação</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="text-center py-5 text-secondary">
                                        <div className="spinner-border spinner-border-sm me-2" role="status" />
                                        Carregando histórico de movimentações...
                                    </td>
                                </tr>
                            ) : filteredMovements.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="text-center py-5 text-secondary">
                                        <i className="bi bi-clock-history fs-3 d-block mb-2" aria-hidden="true" />
                                        Nenhuma movimentação encontrada para os filtros selecionados.
                                    </td>
                                </tr>
                            ) : (
                                filteredMovements.map((mov) => {
                                    const prod = productMap.get(mov.produtoId);
                                    const isEntry = mov.tipo === 'ENTRADA';

                                    return (
                                        <tr key={mov.id}>
                                            <td className="ps-4 text-secondary small">{formatDateTime(mov.criadoEm)}</td>
                                            <td>
                                                <span
                                                    className={`badge rounded-2 ${isEntry
                                                            ? 'bg-success-subtle text-success border border-success-subtle'
                                                            : 'bg-warning-subtle text-warning-emphasis border border-warning-subtle'
                                                        }`}
                                                >
                                                    <i
                                                        className={`bi ${isEntry ? 'bi-arrow-down-left' : 'bi-arrow-up-right'
                                                            } me-1`}
                                                        aria-hidden="true"
                                                    />
                                                    {mov.tipo}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="fw-semibold text-dark">
                                                    {prod ? prod.nome : `Produto #${mov.produtoId}`}
                                                </div>
                                                {prod && <div className="text-secondary small">{prod.sku}</div>}
                                            </td>
                                            <td className="fw-bold">{mov.quantidade} un.</td>
                                            <td>{formatBRL(mov.valorUnitario)}</td>
                                            <td className="fw-semibold">{formatBRL(mov.valorTotal)}</td>
                                            <td className="pe-4 text-secondary small">{mov.observacao || '-'}</td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <ConfirmModal
                isOpen={confirmState.isOpen}
                title={confirmState.title}
                message={confirmState.message}
                confirmLabel={confirmState.confirmLabel}
                variant={confirmState.variant}
                iconClass={confirmState.iconClass}
                isLoading={actionLoading}
                onConfirm={confirmState.onConfirm}
                onCancel={() => setConfirmState((prev) => ({ ...prev, isOpen: false }))}
            />
        </div>
    );
}