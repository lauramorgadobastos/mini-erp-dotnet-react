import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FeedbackToastContainer, type FeedbackMessage } from '../components/FeedbackToast';
import { financeService } from '../services/financeService';
import type { DashboardSummary, LowStockAlertProduct } from '../types/finance';

function formatBRL(value: number): string {
    return value.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    });
}

export function DashboardPage() {
    const [summary, setSummary] = useState<DashboardSummary | null>(null);
    const [alerts, setAlerts] = useState<LowStockAlertProduct[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [toasts, setToasts] = useState<FeedbackMessage[]>([]);

    const addToast = (type: FeedbackMessage['type'], message: string, title?: string) => {
        const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        setToasts((prev) => [...prev, { id, type, message, title }]);
    };

    const removeToast = (id: string) => {
        setToasts((prev) => prev.filter((item) => item.id !== id));
    };

    const loadDashboard = async () => {
        setLoading(true);
        try {
            const [summaryData, alertsData] = await Promise.all([
                financeService.getDashboardSummary(),
                financeService.getLowStockAlerts(),
            ]);
            setSummary(summaryData);
            setAlerts(alertsData);
        } catch (err) {
            const msg =
                err instanceof Error ? err.message : 'Falha ao carregar os indicadores do dashboard.';
            addToast('danger', msg, 'Erro na API');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadDashboard();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const totalProdutos = summary?.totalProdutos ?? 0;
    const produtosEstoqueBaixo = summary?.produtosComEstoqueBaixo ?? alerts.length;
    const totalQuantidadeEstoque = summary?.totalQuantidadeEstoque ?? 0;
    const valorTotalEstoque = summary?.valorTotalEstoque ?? 0;
    const totalReceitas = summary?.totalReceitas ?? 0;
    const totalDespesas = summary?.totalDespesas ?? 0;
    const saldoFinanceiro = summary?.saldoFinanceiro ?? totalReceitas - totalDespesas;

    return (
        <div className="d-flex flex-column gap-4">
            <FeedbackToastContainer items={toasts} onDismiss={removeToast} />

            {/* Ações Rápidas */}
            <div className="sf-card p-3 p-md-4 d-flex flex-wrap align-items-center justify-content-between gap-2">
                <div>
                    <h2 className="h6 fw-bold mb-1">Visão Geral Operacional e Financeira</h2>
                    <p className="text-secondary small mb-0">
                        Acompanhe o saldo em estoque, alertas de reposição e desempenho financeiro.
                    </p>
                </div>
                <div className="d-flex flex-wrap gap-2">
                    <Link to="/movimentacoes" className="btn sf-btn-primary btn-sm rounded-2">
                        <i className="bi bi-arrow-left-right me-1" aria-hidden="true" />
                        Nova Movimentação
                    </Link>
                    <Link to="/financeiro" className="btn btn-outline-secondary btn-sm rounded-2">
                        <i className="bi bi-wallet2 me-1" aria-hidden="true" />
                        Ver Financeiro
                    </Link>
                    <button
                        type="button"
                        className="btn btn-outline-secondary btn-sm rounded-2"
                        onClick={loadDashboard}
                        disabled={loading}
                    >
                        <i className="bi bi-arrow-clockwise me-1" aria-hidden="true" />
                        Atualizar
                    </button>
                </div>
            </div>

            {/* Cards de Métricas */}
            <div className="row g-3">
                <div className="col-12 col-sm-6 col-xl-3">
                    <div className="sf-card p-3 p-md-4 h-100">
                        <div className="d-flex align-items-center justify-content-between mb-2">
                            <span className="text-secondary small fw-semibold">Saldo Financeiro</span>
                            <i className="bi bi-cash-coin text-primary fs-5" aria-hidden="true" />
                        </div>
                        <div className={`h4 fw-bold mb-1 ${saldoFinanceiro >= 0 ? 'text-dark' : 'text-danger'}`}>
                            {loading ? '...' : formatBRL(saldoFinanceiro)}
                        </div>
                        <div className="text-secondary small">
                            Receitas: {formatBRL(totalReceitas)} · Despesas: {formatBRL(totalDespesas)}
                        </div>
                    </div>
                </div>

                <div className="col-12 col-sm-6 col-xl-3">
                    <div className="sf-card p-3 p-md-4 h-100">
                        <div className="d-flex align-items-center justify-content-between mb-2">
                            <span className="text-secondary small fw-semibold">Valor Total em Estoque</span>
                            <i className="bi bi-box-seam text-success fs-5" aria-hidden="true" />
                        </div>
                        <div className="h4 fw-bold mb-1 text-dark">
                            {loading ? '...' : formatBRL(valorTotalEstoque)}
                        </div>
                        <div className="text-secondary small">
                            {totalQuantidadeEstoque} un. em {totalProdutos} produto(s)
                        </div>
                    </div>
                </div>

                <div className="col-12 col-sm-6 col-xl-3">
                    <div className="sf-card p-3 p-md-4 h-100">
                        <div className="d-flex align-items-center justify-content-between mb-2">
                            <span className="text-secondary small fw-semibold">Receitas Acumuladas</span>
                            <i className="bi bi-graph-up-arrow text-success fs-5" aria-hidden="true" />
                        </div>
                        <div className="h4 fw-bold mb-1 text-success">
                            {loading ? '...' : formatBRL(totalReceitas)}
                        </div>
                        <div className="text-secondary small">Entradas registradas no sistema</div>
                    </div>
                </div>

                <div className="col-12 col-sm-6 col-xl-3">
                    <div className="sf-card p-3 p-md-4 h-100">
                        <div className="d-flex align-items-center justify-content-between mb-2">
                            <span className="text-secondary small fw-semibold">Alertas de Estoque Baixo</span>
                            <i className="bi bi-exclamation-triangle-fill text-warning fs-5" aria-hidden="true" />
                        </div>
                        <div className="h4 fw-bold mb-1 text-warning-emphasis">
                            {loading ? '...' : produtosEstoqueBaixo}
                        </div>
                        <div className="text-secondary small">Itens abaixo ou no estoque mínimo</div>
                    </div>
                </div>
            </div>

            {/* Tabela de Alertas de Estoque Baixo */}
            <div className="sf-card p-0 overflow-hidden">
                <div className="p-3 p-md-4 border-bottom d-flex align-items-center justify-content-between">
                    <h3 className="h6 fw-bold mb-0 d-flex align-items-center gap-2">
                        <i className="bi bi-bell-fill text-warning" aria-hidden="true" />
                        <span>Produtos com Estoque Baixo</span>
                    </h3>
                    <Link to="/produtos" className="small text-decoration-none fw-semibold">
                        Gerenciar catálogo
                    </Link>
                </div>

                <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0 sf-table">
                        <thead>
                            <tr>
                                <th className="ps-4">SKU</th>
                                <th>Produto</th>
                                <th>Saldo Atual</th>
                                <th>Estoque Mínimo</th>
                                <th className="pe-4">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="text-center py-5 text-secondary">
                                        <div className="spinner-border spinner-border-sm me-2" role="status" />
                                        Carregando alertas de estoque...
                                    </td>
                                </tr>
                            ) : alerts.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="text-center py-5 text-secondary">
                                        <i className="bi bi-check-circle fs-3 d-block mb-2 text-success" aria-hidden="true" />
                                        Nenhum produto com estoque baixo no momento.
                                    </td>
                                </tr>
                            ) : (
                                alerts.map((item) => (
                                    <tr key={item.id}>
                                        <td className="ps-4 fw-semibold text-secondary">{item.sku}</td>
                                        <td className="fw-semibold text-dark">{item.nome}</td>
                                        <td className="fw-bold text-danger">{item.quantidadeEstoque} un.</td>
                                        <td>{item.estoqueMinimo} un.</td>
                                        <td className="pe-4">
                                            <span className="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle rounded-2">
                                                Reposição necessária
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}