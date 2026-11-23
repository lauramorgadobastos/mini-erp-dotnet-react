export function AppFooter() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="sf-footer py-3 mt-4">
            <div className="container-xl d-flex flex-column flex-sm-row align-items-center justify-content-between gap-2">
                <div className="d-flex align-items-center gap-2">
                    <i className="bi bi-layers text-primary" aria-hidden="true" />
                    <span>
                        <strong>StockFlow</strong> — Mini-ERP de Estoque e Finanças
                    </span>
                </div>
                <div className="text-secondary small">
                    <span>React + TypeScript + .NET + MySQL</span>
                    <span className="mx-2">•</span>
                    <span>{currentYear}</span>
                </div>
            </div>
        </footer>
    );
}