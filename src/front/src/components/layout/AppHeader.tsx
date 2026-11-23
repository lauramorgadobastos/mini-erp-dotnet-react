import { NavLink, useLocation } from 'react-router-dom';

interface RouteMeta {
    kicker: string;
    title: string;
    subtitle: string;
}

const ROUTE_META: Record<string, RouteMeta> = {
    '/produtos': {
        kicker: 'Catálogo e Inventário',
        title: 'Produtos',
        subtitle: 'Gerencie itens, preços unitários, alertas de estoque mínimo e status do catálogo.',
    },
    '/movimentacoes': {
        kicker: 'Controle de Fluxo',
        title: 'Movimentações de Estoque',
        subtitle: 'Registre entradas, saídas e ajustes mantendo o saldo sempre rastreável.',
    },
    '/financeiro': {
        kicker: 'Fluxo e Contas',
        title: 'Financeiro',
        subtitle: 'Acompanhe lançamentos, receitas, despesas e o impacto nas operações.',
    },
    '/dashboard': {
        kicker: 'Indicadores',
        title: 'Dashboard Operacional',
        subtitle: 'Visualize métricas principais, alertas críticos e resumo do negócio.',
    },
};

const NAV_ITEMS = [
    { to: '/produtos', label: 'Produtos', icon: 'bi-box-seam' },
    { to: '/movimentacoes', label: 'Movimentações', icon: 'bi-arrow-left-right' },
    { to: '/financeiro', label: 'Financeiro', icon: 'bi-wallet2' },
    { to: '/dashboard', label: 'Dashboard', icon: 'bi-speedometer2' },
];

export function AppHeader() {
    const { pathname } = useLocation();
    const currentMeta = ROUTE_META[pathname] ?? {
        kicker: 'StockFlow',
        title: 'Gestão Operacional',
        subtitle: 'Controle integrado de catálogo, estoque e finanças.',
    };

    return (
        <header>
            <nav className="navbar navbar-expand-lg navbar-dark sf-topbar" aria-label="Navegação principal">
                <div className="container-xl d-flex align-items-center justify-content-between">
                    <NavLink
                        to="/produtos"
                        className="navbar-brand d-inline-flex align-items-center gap-3 py-0 me-0 text-decoration-none"
                    >
                        <span className="sf-brand-mark">
                            <i className="bi bi-boxes" aria-hidden="true" />
                        </span>
                        <span className="d-inline-flex flex-column justify-content-center text-start">
                            <span
                                className="fw-bold text-white"
                                style={{ fontSize: '1.05rem', lineHeight: 1.15 }}
                            >
                                StockFlow
                            </span>
                            <span
                                className="mt-1"
                                style={{ fontSize: '0.75rem', lineHeight: 1.15, color: '#9ab0aa' }}
                            >
                                Gestão de Estoque
                            </span>
                        </span>
                    </NavLink>

                    <button
                        className="navbar-toggler border-0 shadow-none px-2"
                        type="button"
                        data-bs-toggle="collapse"
                        data-bs-target="#stockflowMainNav"
                        aria-controls="stockflowMainNav"
                        aria-expanded="false"
                        aria-label="Alternar menu de navegação"
                    >
                        <span className="navbar-toggler-icon" />
                    </button>

                    <div className="collapse navbar-collapse justify-content-end" id="stockflowMainNav">
                        <ul className="sf-nav-list flex-column flex-lg-row align-items-stretch align-items-lg-center mt-3 mt-lg-0">
                            {NAV_ITEMS.map((item) => (
                                <li key={item.to}>
                                    <NavLink
                                        to={item.to}
                                        className={({ isActive }) => `sf-nav-link ${isActive ? 'active' : ''}`}
                                    >
                                        <i className={`bi ${item.icon}`} aria-hidden="true" />
                                        <span>{item.label}</span>
                                    </NavLink>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </nav>

            <div className="sf-context-bar">
                <div className="container-xl">
                    <div className="sf-kicker mb-1">{currentMeta.kicker}</div>
                    <h1 className="h4 fw-bold mb-1">{currentMeta.title}</h1>
                    <p className="text-secondary small mb-0">{currentMeta.subtitle}</p>
                </div>
            </div>
        </header>
    );
}