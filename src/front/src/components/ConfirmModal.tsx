import { useEffect } from 'react';

export type ConfirmVariant = 'danger' | 'warning' | 'primary' | 'success';

export interface ConfirmModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: ConfirmVariant;
    iconClass?: string;
    isLoading?: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

export function ConfirmModal({
    isOpen,
    title,
    message,
    confirmLabel = 'Confirmar',
    cancelLabel = 'Cancelar',
    variant = 'danger',
    iconClass = 'bi-exclamation-triangle-fill',
    isLoading = false,
    onConfirm,
    onCancel,
}: ConfirmModalProps) {
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && !isLoading) {
                onCancel();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, isLoading, onCancel]);

    if (!isOpen) return null;

    return (
        <>
            <div
                className="modal fade show d-block"
                tabIndex={-1}
                role="dialog"
                aria-modal="true"
                aria-labelledby="confirmModalTitle"
            >
                <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content border-0 shadow">
                        <div className="modal-header border-bottom-0 pb-2">
                            <h5 className="modal-title d-flex align-items-center gap-2" id="confirmModalTitle">
                                <span className={`text-${variant}`}>
                                    <i className={`bi ${iconClass}`} aria-hidden="true" />
                                </span>
                                <span>{title}</span>
                            </h5>
                            <button
                                type="button"
                                className="btn-close"
                                aria-label="Fechar"
                                disabled={isLoading}
                                onClick={onCancel}
                            />
                        </div>

                        <div className="modal-body py-2">
                            <p className="mb-0 text-secondary">{message}</p>
                        </div>

                        <div className="modal-footer border-top-0 pt-3 gap-2">
                            <button
                                type="button"
                                className="btn btn-outline-secondary rounded-2"
                                disabled={isLoading}
                                onClick={onCancel}
                            >
                                {cancelLabel}
                            </button>
                            <button
                                type="button"
                                className={`btn btn-${variant} rounded-2 d-inline-flex align-items-center gap-2`}
                                disabled={isLoading}
                                onClick={onConfirm}
                            >
                                {isLoading && (
                                    <span
                                        className="spinner-border spinner-border-sm"
                                        role="status"
                                        aria-hidden="true"
                                    />
                                )}
                                <span>{confirmLabel}</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            <div className="modal-backdrop fade show" />
        </>
    );
}