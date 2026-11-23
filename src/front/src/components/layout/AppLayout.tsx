import { Outlet } from 'react-router-dom';
import { AppHeader } from './AppHeader';
import { AppFooter } from './AppFooter';

export function AppLayout() {
    return (
        <div className="sf-shell">
            <AppHeader />
            <main className="sf-main py-4">
                <div className="container-xl">
                    <Outlet />
                </div>
            </main>
            <AppFooter />
        </div>
    );
}