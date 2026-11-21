import { useEffect } from 'react';

export type FeedbackType = 'success' | 'danger' | 'warning' | 'info';

export interface FeedbackMessage {
    id: string;
    type: FeedbackType;
    title?: string;
    message: string;
    durationMs?: number;
}

interface FeedbackToastProps {
    item: FeedbackMessage;
    onDismiss: (id: string) => void;
}

const TYPE_CONFIG: Record<FeedbackType, { icon: string; defaultTitle: string }> = {
    success: { icon: 'bi-check-circle-fill', defaultTitle: 'Sucesso' },
    danger: { icon: 'bi-x-circle-fill', defaultTitle: 'Erro' },
    warning: { icon: 'bi-exclamation-triangle-fill', defaultTitle: 'Atenção' },
    info: { icon: 'bi-info-circle-fill', defaultTitle: 'Informação' },
};

export function FeedbackToast({ item, onDismiss }: FeedbackToastProps) {
    const duration = item.durationMs ?? 4000;
    const config = TYPE_CONFIG[item.type];

    useEffect(() => {
        if (duration <= 0) return;

        const timer = window.setTimeout(() => {
            onDismiss(item.id);
        }, duration);

        return () => window.clearTimeout(timer);
    }, [item.id, duration, onDismiss]);

    return (
        <div
            className={`toast show align-items-center text-bg-${item.type} border-0 shadow mb-2`}
            role="alert"
            aria-live="assertive"
            aria-atomic="true"
        >
            <div className="d-flex">
                <div className="toast-body d-flex align-items-start gap-2">
                    <i className={`bi ${config.icon} fs-5 mt-0.5`} aria-hidden="true" />
                    <div>
                        <div className="fw-semibold">{item.title ?? config.defaultTitle}</div>
                        <div className="small">{item.message}</div>
                    </div>
                </div>
                <button
                    type="button"
                    className="btn-close btn-close-white me-2 m-auto"
                    aria-label="Fechar notificação"
                    onClick={() => onDismiss(item.id)}
                />
            </div>
        </div>
    );
}

interface FeedbackToastContainerProps {
    items: FeedbackMessage[];
    onDismiss: (id: string) => void;
}

export function FeedbackToastContainer({ items, onDismiss }: FeedbackToastContainerProps) {
    if (items.length === 0) return null;

    return (
        <div
            className="toast-container position-fixed top-0 end-0 p-3"
            style={{ zIndex: 1090 }}
        >
            {items.map((item) => (
                <FeedbackToast key={item.id} item={item} onDismiss={onDismiss} />
            ))}
        </div>
    );
}