import React, { useState, useEffect } from 'react';
import {
    LayoutDashboard,
    Users,
    Calculator,
    History,
    Briefcase,
    DollarSign,
    BarChart3,
    LogOut,
    Settings,
    Menu,
    X,
    User,
    ChevronRight,
    Bell
} from 'lucide-react';
import { APP_CONFIG } from '../../appConfig';

const Navbar = ({ session, perfil, vistaActual, setVistaActual, onLogout, onViewBriefing }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const userEmail = session?.user?.email || 'N/A';

    // Bloquear scroll del body cuando el menú móvil está abierto
    useEffect(() => {
        if (isMenuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isMenuOpen]);

    // Enlaces operativos centrales filtrados por rol
    // Nota: Default a 'Gerencia' si no existe el campo rol para evitar bloqueos iniciales tras migración
    const userRole = perfil?.rol || 'Gerencia';
    const middleLinks = [
        { id: 'crm', label: 'Clientes', icon: Users, roles: ['Gerencia', 'ventas', 'admon'] },
        { id: 'cotizador', label: 'Cotizar', icon: Calculator, roles: ['Gerencia', 'ventas'] },
        { id: 'historial', label: 'Cotizaciones', icon: History, roles: ['Gerencia', 'ventas', 'admon'] },
        { id: 'master-contracts', label: 'Convenios', icon: Briefcase, roles: ['Gerencia', 'admon'] },
        { id: 'cobranza', label: 'Cobranza', icon: DollarSign, roles: ['Gerencia', 'admon'] },
    ].filter(link => !link.roles || link.roles.includes(userRole));

    const handleLogout = async () => {
        if (onLogout) {
            await onLogout();
        }
    };

    const isActive = (id) => vistaActual === id;

    // Botones de icono especializados (Dashboard, Reportes, Admin, Logout)
    const IconButton = ({ id, icon: Icon, label, onClick, className = "" }) => (
        <button
            onClick={onClick || (() => setVistaActual(id))}
            className={`w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center rounded-xl transition-all relative group
                ${isActive(id) ? 'bg-enterprise-50' : 'hover:bg-enterprise-50'} ${className}`}
            title={label}
        >
            <Icon size={19} className={isActive(id) ? 'text-brand-orange' : 'text-enterprise-400 group-hover:text-enterprise-950'} />
            {isActive(id) && (
                <div className="absolute -bottom-1 left-2 right-2 h-[3px] bg-brand-orange rounded-full" />
            )}
        </button>
    );

    return (
        <>
            {/* Navbar Híbrida Optimizada */}
            <nav className="fixed top-0 left-0 right-0 z-[60] bg-white border-b border-enterprise-100 shadow-sm h-16 sm:h-20 flex items-center px-4 sm:px-6">
                {/* Línea de acento visual */}
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-brand-orange" />

                <div className="max-w-[1600px] mx-auto w-full flex items-center gap-2 sm:gap-6">
                    {/* LOGO DE MARCA (Izquierda) */}
                    <div
                        className="flex items-center gap-2 sm:gap-4 cursor-pointer group flex-shrink-0"
                        onClick={() => setVistaActual('dashboard')}
                    >
                        <div className="w-10 h-10 sm:w-11 sm:h-11 bg-white rounded-full flex items-center justify-center p-1.5 shadow-lg group-hover:scale-105 transition-transform border border-enterprise-100">
                            <img src="/logo-tvsa.png" alt="TU" className="w-full h-full object-contain" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-enterprise-950 font-black text-[14px] sm:text-[16px] tracking-tighter leading-none uppercase italic italic-brand">
                                Media <span className="text-brand-orange not-italic">Intelligence</span>
                            </span>
                            <span className="text-enterprise-500 text-[8px] font-black uppercase tracking-widest hidden lg:block">TelevisaUnivision MID</span>
                        </div>
                    </div>

                    {/* NAVEGACIÓN OPERATIVA (Icono + Texto) - Solo Desktop */}
                    <div className="hidden lg:flex items-center gap-1 xl:gap-2 ml-4">
                        {middleLinks.map((link) => (
                            <button
                                key={link.id}
                                onClick={() => setVistaActual(link.id)}
                                className={`px-2 xl:px-3 h-10 rounded-xl text-[10px] font-black uppercase tracking-tight transition-all flex items-center gap-2 group whitespace-nowrap
                                    ${isActive(link.id)
                                        ? 'text-enterprise-950 bg-enterprise-50/80 shadow-sm'
                                        : 'text-enterprise-500 hover:text-enterprise-950 hover:bg-enterprise-50/50'}`}
                            >
                                <link.icon size={15} className={isActive(link.id) ? 'text-brand-orange' : 'text-enterprise-400 group-hover:text-brand-orange transition-colors'} />
                                <span>{link.label}</span>
                            </button>
                        ))}
                    </div>

                    {/* CONTROLES EJECUTIVOS (Solo Iconos) - Área Derecha (Solo Desktop) */}
                    <div className="flex items-center gap-1 sm:gap-2 ml-auto">
                        {/* Briefing Access (Campanita) */}
                        <button
                            onClick={onViewBriefing}
                            className="w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center bg-white text-enterprise-950 rounded-xl shadow-sm border border-enterprise-100 hover:bg-enterprise-950 hover:text-white transition-all active:scale-95 group"
                            title="Ver Briefing Comercial"
                        >
                            <Bell size={20} className="group-hover:animate-bounce" />
                        </button>

                        <div className="hidden lg:flex items-center gap-1 xl:gap-2 bg-enterprise-50/40 p-1 rounded-2xl border border-enterprise-100/50">
                            <IconButton id="dashboard" icon={LayoutDashboard} label="Dashboard" />
                            {userRole === 'Gerencia' && <IconButton id="reportes" icon={BarChart3} label="Reportes" />}
                            {(userRole === 'Gerencia' || userRole === 'admon') && <IconButton id="administracion" icon={Settings} label="Administración" />}
                            <IconButton id="logout" icon={LogOut} label="Log Out" onClick={handleLogout} />
                        </div>

                        {/* Hamburguesa Trigger (Solo Móvil/Tablet) */}
                        <button
                            onClick={() => setIsMenuOpen(true)}
                            className="lg:hidden w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center bg-enterprise-950 text-white rounded-xl shadow-lg hover:shadow-brand-orange/30 active:scale-95 transition-all"
                        >
                            <Menu size={22} />
                        </button>
                    </div>
                </div>
            </nav>

            {/* MENÚ HAMBURGUESA ULTRA-COMPACTO (Cero Scroll en 100vh) */}
            {isMenuOpen && (
                <div className="fixed inset-0 z-[100] bg-[#111111] text-white flex flex-col h-[100dvh] w-screen animate-in fade-in duration-300">
                    {/* Header: Iconos Ejecutivos Puros */}
                    <header className="h-14 flex items-center justify-between px-6 border-b border-white/5 bg-black/40 backdrop-blur-xl flex-shrink-0">
                        <div className="flex items-center gap-2 sm:gap-3">
                            <IconButton id="dashboard" icon={LayoutDashboard} label="D" onClick={() => { setVistaActual('dashboard'); setIsMenuOpen(false); }} className="bg-white/5 w-9 h-9" />
                            {userRole === 'Gerencia' && <IconButton id="reportes" icon={BarChart3} label="R" onClick={() => { setVistaActual('reportes'); setIsMenuOpen(false); }} className="bg-white/5 w-9 h-9" />}
                            {(userRole === 'Gerencia' || userRole === 'admon') && <IconButton id="administracion" icon={Settings} label="A" onClick={() => { setVistaActual('administracion'); setIsMenuOpen(false); }} className="bg-white/5 w-9 h-9" />}
                            <IconButton id="logout" icon={LogOut} label="E" onClick={() => { handleLogout(); setIsMenuOpen(false); }} className="bg-white/5 w-9 h-9" />
                        </div>
                        <button
                            onClick={() => setIsMenuOpen(false)}
                            className="w-10 h-10 flex items-center justify-center bg-brand-orange rounded-xl shadow-lg"
                        >
                            <X size={20} />
                        </button>
                    </header>

                    {/* Lista de Navegación Compacta */}
                    <main className="flex-1 flex flex-col justify-center px-6 py-4 space-y-1.5 overflow-hidden">
                        <p className="text-[8px] font-black text-white/20 uppercase tracking-[0.4em] mb-2 text-center">Executive Intelligence Menu</p>

                        {[
                            { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
                            ...middleLinks,
                            userRole === 'Gerencia' ? { id: 'reportes', label: 'Reportes', icon: BarChart3 } : null
                        ].filter(Boolean).map((link) => (
                            <button
                                key={link.id}
                                onClick={() => { setVistaActual(link.id); setIsMenuOpen(false); }}
                                className={`w-full flex items-center justify-between px-5 py-2.5 rounded-xl transition-all border group
                                    ${isActive(link.id)
                                        ? 'bg-brand-orange border-brand-orange text-white'
                                        : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10'}`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`p-1.5 rounded-lg ${isActive(link.id) ? 'bg-white/20' : 'bg-brand-orange/10'}`}>
                                        <link.icon size={18} className={isActive(link.id) ? 'text-white' : 'text-brand-orange'} />
                                    </div>
                                    <span className="font-black uppercase tracking-[0.1em] text-[10px] sm:text-[11px]">{link.label}</span>
                                </div>
                                <ChevronRight size={14} className="opacity-20" />
                            </button>
                        ))}
                    </main>

                    {/* Footer Minimalista */}
                    <footer className="p-4 border-t border-white/5 bg-black/20 flex items-center justify-between flex-shrink-0">
                        <div className="flex flex-col items-end">
                            <span className="text-[9px] font-black text-brand-orange uppercase tracking-[0.3em] mb-1">{userRole}</span>
                            <p className="text-[10px] font-black text-white/70 uppercase tracking-widest leading-none">
                                {perfil?.nombre_completo || userEmail.split('@')[0]}
                            </p>
                        </div>
                        <span className="text-[7px] font-bold text-white/20 uppercase tracking-widest italic">{APP_CONFIG.FULL_VERSION_LABEL}</span>
                    </footer>
                </div>
            )}
        </>
    );
};

export default Navbar;
