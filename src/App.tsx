
import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import ConnectionBanner from './components/ConnectionBanner';
import { useConnectionStatus } from './hooks/useConnectionStatus';
import Login from './components/pages/Login';
import Dashboard from './components/pages/Dashboard';
import Students from './components/pages/Students';
import Classes from './components/pages/Classes';
import Financial from './components/pages/Financial';
import Onboarding from './components/pages/Onboarding';
import Reports from './components/pages/Reports';
import RegisterStudent from './components/pages/RegisterStudent';
import Formulario from './components/pages/Formulario';

export type Page = 'Dashboard' | 'Students' | 'Classes' | 'Financial' | 'Onboarding' | 'Reports' | 'RegisterStudent' | 'Formulario';

const AuthenticatedApp: React.FC = () => {
    const { isVendedor } = useAuth();
    const [activePage, setActivePage] = useState<Page>(isVendedor ? 'Classes' : 'Dashboard');
    const { isConnected } = useConnectionStatus();

    useEffect(() => {
        if (isVendedor && !['Classes', 'RegisterStudent'].includes(activePage)) {
            setActivePage('Classes');
        }
    }, [isVendedor]);

    const renderPage = () => {
        switch (activePage) {
            case 'Dashboard':
                return <Dashboard />;
            case 'Students':
                return <Students />;
            case 'Classes':
                return <Classes />;
            case 'Financial':
                return <Financial />;
            case 'Onboarding':
                return <Onboarding />;
            case 'Reports':
                return <Reports />;
            case 'RegisterStudent':
                return <RegisterStudent />;
            case 'Formulario':
                return <Formulario />;
            default:
                return <Dashboard />;
        }
    };

    return (
        <div className="flex flex-col h-screen bg-brand-background text-gray-800">
            <ConnectionBanner isConnected={isConnected} />
            <div className="flex flex-1 overflow-hidden">
                <Sidebar activePage={activePage} setActivePage={setActivePage} />
                <main className="flex-1 overflow-y-auto">
                    {renderPage()}
                </main>
            </div>
        </div>
    );
};

const App: React.FC = () => {
    return (
        <AuthProvider>
            <AppContent />
        </AuthProvider>
    );
};

const AppContent: React.FC = () => {
    const { isAuthenticated } = useAuth();

    if (!isAuthenticated) {
        return <Login />;
    }

    return <AuthenticatedApp />;
};

export default App;
