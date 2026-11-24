import { useEffect, useId, useMemo, useState } from 'react';
import { ConfirmModal, type ConfirmVariant } from '../components/ConfirmModal';
import { FeedbackToastContainer, type FeedbackMessage } from '../components/FeedbackToast';
import { financeService } from '../services/financeService';
import type {
    DashboardSummary,
    FinancialEntry,
    FinancialEntryType,
} from '../types/finance';

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

interface FormErrors {
    descricao?: string;
    categoria?: string;
    valor?: string;
}

export function FinancePage() {
    const [entries, setEntries] = useState<FinancialEntry[]>([]);
    const [summary, setSummary] = useState<DashboardSummary | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [submitting, setSubmitting] = useState<boolean>(false);

    // Campos do formulário de novo lançamento
    const [tipo, setTipo] = useState<FinancialEntryType>('RECEITA');
    const [descricao, setDescricao] = useState<string>('');
    const [categoria, setCategoria] = useState<string>('Vendas');
    const [valorInput, setValorInput] = useState<string>('');
    const [observacao, setObservacao] = useState<string>('');
    const [formErrors, setFormErrors] = useState<FormErrors>({});

    // Filtros da tabela
    const [categoryFilter, setCategoryFilter] = useState<string>('TODAS');
    const [typeFilter, setTypeFilter] = useState<'TODOS' | FinancialEntryType>('TODOS');
    const [dateFrom, setDateFrom] = useState<string>('');
    const [dateTo, setDateTo] = useState<string>('');
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

    const tipoId = useId();
    const descricaoId = useId();
    const categoriaId = useId();
    const valorId = useId();
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

    const loadFinanceData = async () => {
        setLoading(true);
        try {
            const [entriesData, summaryData] = await Promise.all([
                financeService.listEntries(),
                financeService.getDashboardSummary().catch(() => null),
            ]);
            setEntries(entriesData);
            if (summaryData) {
                setSummary(summaryData);
            }
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Falha ao carregar dados financeiros.';
            addToast('danger', msg, 'Erro na API');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadFinanceData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const totals = useMemo(() => {
        if (summary) {
            return {
                receitas: summary.totalReceitas,
                despesas: summary.totalDespesas,
                saldo: summary.saldoFinanceiro,
            };
        }

        let receitas = 0;
        let despesas = 0;
        for (const item of entries) {
            if (item.tipo === 'RECEITA') receitas += item.valor;
            if (item.tipo === 'DESPESA') despesas += item.valor;
        }
        return {
            receitas,
            despesas,
            saldo: receitas - despesas,
        };
    }, [summary, entries]);

    const availableCategories = useMemo(() => {
        const set = new Set<string>(['Vendas', 'Fornecedores', 'Infraestrutura', 'Estoque', 'Geral']);
        for (const item of entries) {
            const cat = item.categoria?.trim() || (item.origem === 'ESTOQUE' ? 'Estoque' : 'Geral');
            set.add(cat);
        }
        return Array.from(set).sort((a, b) => a.localeCompare(b, 'pt-BR'));
    }, [entries]);

    const filteredEntries = useMemo(() => {
        const term = searchTerm.trim().toLowerCase();

        return entries.filter((item) => {
            if (typeFilter !== 'TODOS' && item.tipo !== typeFilter) {
                return false;
            }

            const itemCategory =
                item.categoria?.trim() || (item.origem === 'ESTOQUE' ? 'Estoque' : 'Geral');
            if (categoryFilter !== 'TODAS' && itemCategory !== categoryFilter) {
                return false;
            }

            const itemDate = toInputDateLocal(item.criadoEm);
            if (dateFrom && itemDate && itemDate < dateFrom) {
                return false;
            }
            if (dateTo && itemDate && itemDate > dateTo) {
                return false;
            }

            if (term) {
                const matchesDesc = item.descricao.toLowerCase().includes(term);
                const matchesOrigin = (item.origem ?? '').toLowerCase().includes(term);
                const matchesCat = itemCategory.toLowerCase().includes(term);
                if (!matchesDesc && !matchesOrigin && !matchesCat) {
                    return false;
                }
            }

            return true;
        });
    }, [entries, typeFilter, categoryFilter, dateFrom, dateTo, searchTerm]);

    const validateForm = (): boolean => {
        const errors: FormErrors = {};
        const trimmedDesc = descricao.trim();
        const trimmedCat = categoria.trim();
        const parsedValor = Number.parseFloat(valorInput);

        if (!trimmedDesc) {
            errors.descricao = 'Informe uma descrição para o lançamento.';
        } else if (trimmedDesc.length > 150) {
            errors.descricao = 'A descrição deve ter no máximo 150 caracteres.';
        }

        if (!trimmedCat) {
            errors.categoria = 'Informe ou selecione uma categoria.';
        }

        if (!valorInput.trim() || Number.isNaN(parsedValor) || parsedValor <= 0) {
            errors.valor = 'Informe um valor maior que zero.';
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const executeCreateEntry = async () => {
        const parsedValor = Number.parseFloat(valorInput);
        setSubmitting(true);
        try {
            await financeService.createEntry({
                tipo,
                descricao,
                categoria,
                valor: parsedValor,
                observacao,
            });

            addToast(
                'success',
                `${tipo === 'RECEITA' ? 'Receita' : 'Despesa'} de ${formatBRL(parsedValor)} registrada com sucesso.`
            );
            setDescricao('');
            setValorInput('');
            setObservacao('');
            setFormErrors({});
            await loadFinanceData();
        } catch (err) {
            const msg =
                err instanceof Error
                    ? err.message
                    : 'Não foi possível registrar o lançamento financeiro.';
            addToast('danger', msg, 'Falha ao Salvar Lançamento');
        } finally {
            setSubmitting(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) {
            addToast('warning', 'Revise os campos destacados antes de salvar.', 'Validação do Formulário');
            return;
        }

        const parsedValor = Number.parseFloat(valorInput);
        if (tipo === 'DESPESA' && parsedValor >= 1000) {
            setConfirmState({
                isOpen: true,
                title: 'Confirmar Despesa de Alto Valor',
                message: `Confirma o lançamento de DESPESA de ${formatBRL(parsedValor)} para "${descricao.trim()}"?`,
                confirmLabel: 'Confirmar Despesa',
                variant: 'warning',
                iconClass: 'bi-cash-stack',
                onConfirm: async () => {
                    setActionLoading(true);
                    try {
                        await executeCreateEntry();
                    } finally {
                        setActionLoading(false);
                        setConfirmState((prev) => ({ ...prev, isOpen: false }));
                    }
                },
            });
            return;
        }

        await executeCreateEntry();
    };

    const clearFilters = () => {
        setCategoryFilter('TODAS');
        setTypeFilter('TODOS');
        setDateFrom('');
        setDateTo('');
        setSearchTerm('');
    };

    return (
        <div className="d-flex flex-column gap-4">
            <FeedbackToastContainer items={toasts} onDismiss={removeToast} />

            {/* Cartões Estatísticos */}
            <div className="row g-3">
                <div className="col-12 col-md-4">
                    <div className="sf-card p-3 p-md-4 h-100">
                        <div className="d-flex align-items-center justify-content-between mb-2">
                            <span className="text-secondary small fw-semibold">Saldo Financeiro</span>
                            <i className="bi bi-wallet2 text-primary fs-5" aria-hidden="true" />
                        </div>
                        <div
                            className={`h4 fw-bold mb-0 ${totals.saldo >= 0 ? 'text-dark' : 'text-danger'
                                }`}
                        >
                            {formatBRL(totals.saldo)}
                        </div>
                        <div className="text-secondary small mt-1">Receitas menos despesas acumuladas</div>
                    </div>
                </div>

                <div className="col-12 col-md-4">
                    <div className="sf-card p-3 p-md-4 h-100">
                        <div className="d-flex align-items-center justify-content-between mb-2">
                            <span className="text-secondary small fw-semibold">Receitas Acumuladas</span>
                            <i className="bi bi-arrow-up-circle-fill text-success fs-5" aria-hidden="true" />
                        </div>
                        <div className="h4 fw-bold mb-0 text-success">{formatBRL(totals.receitas)}</div>
                        <div className="text-secondary small mt-1">Entradas de estoque e lançamentos manuais</div>
                    </div>
                </div>

                <div className="col-12 col-md-4">
                    <div className="sf-card p-3 p-md-4 h-100">
                        <div className="d-flex align-items-center justify-content-between mb-2">
                            <span className="text-secondary small fw-semibold">Despesas Acumuladas</span>
                            <i className="bi bi-arrow-down-circle-fill text-danger fs-5" aria-hidden="true" />
                        </div>
                        <div className="h4 fw-bold mb-0 text-danger">{formatBRL(totals.despesas)}</div>
                        <div className="text-secondary small mt-1">Compras de estoque e custos operacionais</div>
                    </div>
                </div>
            </div>

            {/* Formulário de Novo Lançamento com Validações Visuais */}
            <div className="sf-card p-3 p-md-4">
                <div className="d-flex align-items-center justify-content-between mb-3">
                    <h2 className="h6 fw-bold mb-0 d-flex align-items-center gap-2">
                        <i className="bi bi-plus-circle text-success" aria-hidden="true" />
                        <span>Novo Lançamento Financeiro</span>
                    </h2>
                </div>

                <form onSubmit={handleSubmit} noValidate>
                    <div className="row g-3">
                        <div className="col-12 col-md-3">
                            <label htmlFor={tipoId} className="form-label small fw-semibold">
                                Tipo *
                            </label>
                            <select
                                id={tipoId}
                                className="form-select"
                                value={tipo}
                                onChange={(e) => setTipo(e.target.value as FinancialEntryType)}
                                disabled={submitting}
                            >
                                <option value="RECEITA">RECEITA</option>
                                <option value="DESPESA">DESPESA</option>
                            </select>
                        </div>

                        <div className="col-12 col-md-5">
                            <label htmlFor={descricaoId} className="form-label small fw-semibold">
                                Descrição *
                            </label>
                            <input
                                id={descricaoId}
                                type="text"
                                maxLength={150}
                                className={`form-control ${formErrors.descricao ? 'is-invalid' : ''}`}
                                placeholder="Ex.: Venda de serviço, manutenção, consultoria..."
                                value={descricao}
                                onChange={(e) => {
                                    setDescricao(e.target.value);
                                    if (formErrors.descricao) {
                                        setFormErrors((prev) => ({ ...prev, descricao: undefined }));
                                    }
                                }}
                                disabled={submitting}
                            />
                            {formErrors.descricao && (
                                <div className="invalid-feedback">{formErrors.descricao}</div>
                            )}
                        </div>

                        <div className="col-6 col-md-2">
                            <label htmlFor={categoriaId} className="form-label small fw-semibold">
                                Categoria *
                            </label>
                            <input
                                id={categoriaId}
                                type="text"
                                list="stockflow-categorias-list"
                                maxLength={60}
                                className={`form-control ${formErrors.categoria ? 'is-invalid' : ''}`}
                                value={categoria}
                                onChange={(e) => {
                                    setCategoria(e.target.value);
                                    if (formErrors.categoria) {
                                        setFormErrors((prev) => ({ ...prev, categoria: undefined }));
                                    }
                                }}
                                disabled={submitting}
                            />
                            <datalist id="stockflow-categorias-list">
                                {availableCategories.map((cat) => (
                                    <option key={cat} value={cat} />
                                ))}
                            </datalist>
                            {formErrors.categoria && (
                                <div className="invalid-feedback">{formErrors.categoria}</div>
                            )}
                        </div>

                        <div className="col-6 col-md-2">
                            <label htmlFor={valorId} className="form-label small fw-semibold">
                                Valor (R$) *
                            </label>
                            <input
                                id={valorId}
                                type="number"
                                step="0.01"
                                min="0.01"
                                className={`form-control ${formErrors.valor ? 'is-invalid' : ''}`}
                                placeholder="0,00"
                                value={valorInput}
                                onChange={(e) => {
                                    setValorInput(e.target.value);
                                    if (formErrors.valor) {
                                        setFormErrors((prev) => ({ ...prev, valor: undefined }));
                                    }
                                }}
                                disabled={submitting}
                            />
                            {formErrors.valor && <div className="invalid-feedback">{formErrors.valor}</div>}
                        </div>

                        <div className="col-12 col-md-9">
                            <label htmlFor={observacaoId} className="form-label small fw-semibold">
                                Observação
                            </label>
                            <input
                                id={observacaoId}
                                type="text"
                                maxLength={255}
                                className="form-control"
                                placeholder="Detalhes adicionais do lançamento (opcional)"
                                value={observacao}
                                onChange={(e) => setObservacao(e.target.value)}
                                disabled={submitting}
                            />
                        </div>

                        <div className="col-12 col-md-3 d-flex align-items-end justify-content-md-end">
                            <button
                                type="submit"
                                className="btn sf-btn-primary rounded-2 w-100 d-inline-flex align-items-center justify-content-center gap-2"
                                disabled={submitting || loading}
                            >
                                {submitting && <span className="spinner-border spinner-border-sm" role="status" />}
                                <i className="bi bi-check-lg" aria-hidden="true" />
                                <span>Salvar Lançamento</span>
                            </button>
                        </div>
                    </div>
                </form>
            </div>

            {/* Filtros por Período e Categoria */}
            <div className="sf-card p-3 p-md-4">
                <div className="row g-3 align-items-end">
                    <div className="col-12 col-md-3">
                        <label className="form-label small fw-semibold">Buscar</label>
                        <div className="input-group">
                            <span className="input-group-text bg-white border-end-0 text-secondary">
                                <i className="bi bi-search" aria-hidden="true" />
                            </span>
                            <input
                                type="text"
                                className="form-control border-start-0"
                                placeholder="Descrição ou origem..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="col-6 col-md-2">
                        <label className="form-label small fw-semibold">Categoria</label>
                        <select
                            className="form-select"
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value)}
                        >
                            <option value="TODAS">Todas</option>
                            {availableCategories.map((cat) => (
                                <option key={cat} value={cat}>
                                    {cat}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="col-6 col-md-2">
                        <label className="form-label small fw-semibold">Tipo</label>
                        <select
                            className="form-select"
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value as 'TODOS' | FinancialEntryType)}
                        >
                            <option value="TODOS">Todos</option>
                            <option value="RECEITA">RECEITA</option>
                            <option value="DESPESA">DESPESA</option>
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

                    <div className="col-12 col-md-1 d-grid">
                        <button
                            type="button"
                            className="btn btn-outline-secondary rounded-2"
                            onClick={clearFilters}
                            title="Limpar filtros"
                        >
                            <i className="bi bi-x-lg" aria-hidden="true" />
                            <span className="d-md-none ms-1">Limpar</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Tabela de Lançamentos Financeiros */}
            <div className="sf-card p-0 overflow-hidden">
                <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0 sf-table">
                        <thead>
                            <tr>
                                <th className="ps-4">Data / Hora</th>
                                <th>Tipo</th>
                                <th>Descrição</th>
                                <th>Categoria</th>
                                <th>Origem</th>
                                <th className="text-end pe-4">Valor</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="text-center py-5 text-secondary">
                                        <div className="spinner-border spinner-border-sm me-2" role="status" />
                                        Carregando lançamentos financeiros...
                                    </td>
                                </tr>
                            ) : filteredEntries.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="text-center py-5 text-secondary">
                                        <i className="bi bi-receipt fs-3 d-block mb-2" aria-hidden="true" />
                                        Nenhum lançamento encontrado para os filtros selecionados.
                                    </td>
                                </tr>
                            ) : (
                                filteredEntries.map((item) => {
                                    const isReceita = item.tipo === 'RECEITA';
                                    const displayCategory =
                                        item.categoria?.trim() || (item.origem === 'ESTOQUE' ? 'Estoque' : 'Geral');

                                    return (
                                        <tr key={item.id}>
                                            <td className="ps-4 text-secondary small">{formatDateTime(item.criadoEm)}</td>
                                            <td>
                                                <span
                                                    className={`badge rounded-2 ${isReceita
                                                            ? 'bg-success-subtle text-success border border-success-subtle'
                                                            : 'bg-danger-subtle text-danger border border-danger-subtle'
                                                        }`}
                                                >
                                                    {item.tipo}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="fw-semibold text-dark">{item.descricao}</div>
                                                {item.movimentacaoId && (
                                                    <div className="text-secondary small">
                                                        Movimentação #{item.movimentacaoId}
                                                    </div>
                                                )}
                                            </td>
                                            <td>
                                                <span className="badge bg-light text-dark border rounded-2">
                                                    {displayCategory}
                                                </span>
                                            </td>
                                            <td className="text-secondary small">{item.origem || '-'}</td>
                                            <td
                                                className={`text-end pe-4 fw-bold ${isReceita ? 'text-success' : 'text-danger'
                                                    }`}
                                            >
                                                {isReceita ? '+' : '-'} {formatBRL(item.valor)}
                                            </td>
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