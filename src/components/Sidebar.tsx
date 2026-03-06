
import React from 'react';
import { Page } from '../App';
import { useAuth } from '../context/AuthContext';
import { NavItems, LogoutIcon, RegisterStudentIcon } from '../constants';

interface SidebarProps {
    activePage: Page;
    setActivePage: (page: Page) => void;
}

const vendedorNavItems: { name: Page; icon: React.FC<{ className?: string }> }[] = [
    { name: 'Classes', icon: NavItems.find(n => n.name === 'Classes')!.icon },
    { name: 'RegisterStudent', icon: RegisterStudentIcon },
];

const Sidebar: React.FC<SidebarProps> = ({ activePage, setActivePage }) => {
    const { user, logout, isVendedor } = useAuth();

    const navItemTranslations: Record<Page, string> = {
        Dashboard: 'Dashboard',
        Students: 'Alunos',
        Classes: 'Turmas',
        Financial: 'Financeiro',
        Onboarding: 'Onboarding',
        Reports: 'Relatorios',
        RegisterStudent: 'Registrar Aluno',
        Formulario: 'Formulario',
    };

    const items = isVendedor ? vendedorNavItems : NavItems;

    return (
        <aside className="w-64 flex-shrink-0 bg-brand-dark text-brand-text flex flex-col">
            <div className="h-20 flex items-center px-6 border-b border-brand-dark-secondary">
                <img
                    src="/assets/images/logo.svg"
                    alt="PM Certificacoes"
                    className="h-12 w-auto"
                />
            </div>
            <div className="p-4">
                <p className="text-xs text-gray-400">Logado como</p>
                <p className="font-semibold">{user?.nome || 'Usuario'}</p>
                {user?.cargo && (
                    <p className="text-xs text-gray-400 mt-0.5 capitalize">{user.cargo}</p>
                )}
            </div>
            <nav className="flex-1 px-4 py-4">
                <ul>
                    {items.map((item) => (
                        <li key={item.name}>
                            <a
                                href="#"
                                onClick={(e) => {
                                    e.preventDefault();
                                    setActivePage(item.name);
                                }}
                                className={`flex items-center px-4 py-3 my-1 rounded-lg transition-colors duration-200 ${
                                    activePage === item.name
                                        ? 'bg-brand-teal text-white'
                                        : 'hover:bg-brand-dark-secondary'
                                }`}
                            >
                                <item.icon className="w-5 h-5" />
                                <span className="ml-4 font-medium">{navItemTranslations[item.name]}</span>
                            </a>
                        </li>
                    ))}
                </ul>
            </nav>
            <div className="p-4 border-t border-brand-dark-secondary">
                 <a
                    href="#"
                    onClick={(e) => { e.preventDefault(); logout(); }}
                    className="flex items-center px-4 py-3 rounded-lg hover:bg-brand-dark-secondary"
                 >
                    <LogoutIcon className="w-5 h-5"/>
                    <span className="ml-4 font-medium">Sair</span>
                </a>
                <div className="text-center text-xs text-gray-500 mt-4">
                    <p>Sistema de Gestao</p>
                    <p>Versao 2.0.1</p>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
