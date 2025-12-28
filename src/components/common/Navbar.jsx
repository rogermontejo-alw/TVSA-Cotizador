import React, { useState } from 'react';
import {
    Menu,
    X,
    History,
    Settings,
    LogOut,
    Eye,
    Calculator,
    LayoutDashboard,
    DollarSign,
    Briefcase,
    BarChart3
} from 'lucide-react';

const Navbar = ({ vistaActual, setVistaActual, session, onLogout }) => {
    const [isOpen, setIsOpen] = useState(false);

    const navLinks = [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'crm', label: 'Clientes', icon: Briefcase },
        { id: 'reportes', label: 'Reportes', icon: BarChart3 },
        { id: 'cobranza', label: 'Cobranza', icon: DollarSign },
        { id: 'historial', label: 'Historial', icon: History },
        { id: 'administracion', label: 'Admin', icon: Settings },
    ];

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-900 text-white shadow-2xl border-b border-white/5">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo */}
                    <div
                        className="flex items-center gap-3 cursor-pointer group"
                        onClick={() => setVistaActual('dashboard')}
                    >
                        <div className="w-9 h-9 bg-red-600 rounded-xl flex items-center justify-center shadow-lg shadow-red-900/50 group-hover:scale-105 transition-transform">
                            <span className="font-black text-sm tracking-tighter">TV</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="font-black text-base leading-none tracking-tighter">
                                COTIZADOR<span className="text-red-600">MID</span>
                            </span>
                            <span className="text-[8px] font-bold text-gray-500 uppercase tracking-widest mt-0.5">Televisa Univision</span>
                        </div>
                    </div>

                    {/* Desktop Menu */}
                    <div className="hidden lg:flex items-center gap-1">
                        {navLinks.map((link) => {
                            const Icon = link.icon;
                            const isActive = vistaActual === link.id;
                            return (
                                <button
                                    key={link.id}
                                    onClick={() => setVistaActual(link.id)}
                                    className={`
                                        px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all
                                        ${isActive
                                            ? 'bg-red-600 text-white shadow-lg shadow-red-900/40'
                                            : 'text-gray-400 hover:text-white hover:bg-white/5'}
                                    `}
                                >
                                    <Icon size={14} />
                                    {link.label}
                                </button>
                            );
                        })}

                        <div className="h-6 w-px bg-white/10 mx-4"></div>

                        <div className="flex items-center gap-4">
                            <div className="text-right hidden xl:block">
                                <p className="text-[9px] font-black uppercase tracking-widest text-white/40 leading-none">Usuario</p>
                                <p className="text-[10px] font-bold text-gray-300">{session?.user?.email?.split('@')[0]}</p>
                            </div>
                            <button
                                onClick={onLogout}
                                className="p-2.5 rounded-xl bg-white/5 text-gray-400 hover:text-red-500 hover:bg-red-500/10 transition-all border border-white/5"
                                title="Cerrar Sesión"
                            >
                                <LogOut size={18} />
                            </button>
                        </div>
                    </div>

                    {/* Mobile Button */}
                    <div className="lg:hidden flex items-center gap-3">
                        <button
                            onClick={onLogout}
                            className="p-2 text-gray-400"
                        >
                            <LogOut size={20} />
                        </button>
                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            className="p-2 rounded-xl bg-white/5 text-gray-400"
                        >
                            {isOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            {isOpen && (
                <div className="lg:hidden bg-slate-800 border-t border-white/5 animate-in slide-in-from-top duration-300">
                    <div className="px-4 pt-2 pb-6 space-y-1">
                        {navLinks.map((link) => {
                            const Icon = link.icon;
                            const isActive = vistaActual === link.id;
                            return (
                                <button
                                    key={link.id}
                                    onClick={() => {
                                        setVistaActual(link.id);
                                        setIsOpen(false);
                                    }}
                                    className={`
                                        w-full p-4 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-3 transition-all
                                        ${isActive
                                            ? 'bg-red-600 text-white shadow-lg'
                                            : 'text-gray-400 hover:text-white hover:bg-white/5'}
                                    `}
                                >
                                    <Icon size={18} />
                                    {link.label}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </nav>
    );
};

export default Navbar;
