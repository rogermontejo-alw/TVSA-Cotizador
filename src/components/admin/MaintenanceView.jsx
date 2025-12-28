import React, { useState } from 'react';
import { Trash2, AlertTriangle, ShieldCheck, RefreshCw, Database, Users, Target, DollarSign } from 'lucide-react';
import { formatMXN } from '../../utils/formatters';

const MaintenanceView = ({
    limpiarTabla,
    historial,
    clientes,
    masterContracts,
    metasComerciales,
    cobranza,
    setMensaje
}) => {
    const [password, setPassword] = useState('');
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [showConfirm, setShowConfirm] = useState(null); // 'COTZ', 'CLIENTS', 'MC', 'GOALS', 'ALL'

    const ADMIN_PASSWORD = 'TVSA_ADMIN_2025'; // Password simple por ahora

    const handleAuthorize = (e) => {
        e.preventDefault();
        if (password === ADMIN_PASSWORD) {
            setIsAuthorized(true);
            setMensaje({ tipo: 'exito', texto: 'Acceso administrativo concedido.' });
        } else {
            setMensaje({ tipo: 'error', texto: 'Contraseña incorrecta.' });
        }
    };

    const handleCleanup = async (type) => {
        if (!isAuthorized) return;

        try {
            switch (type) {
                case 'COTZ':
                    await limpiarTabla('cotizaciones');
                    break;
                case 'CLIENTS':
                    await limpiarTabla('clientes'); // CASCADE borra cotizes y contratos vinculados
                    break;
                case 'MC':
                    await limpiarTabla('master_contracts');
                    break;
                case 'GOALS':
                    await limpiarTabla('metas_comerciales');
                    break;
                case 'BILLING':
                    await limpiarTabla('cobranza');
                    break;
                case 'ALL':
                    // Borrado secuencial respetando integridad
                    await limpiarTabla('cobranza');
                    await limpiarTabla('cotizaciones');
                    await limpiarTabla('condiciones_cliente');
                    await limpiarTabla('master_contracts');
                    await limpiarTabla('clientes');
                    await limpiarTabla('metas_comerciales');
                    break;
                default:
                    break;
            }
            setShowConfirm(null);
        } catch (err) {
            console.error("Error en limpieza:", err);
        }
    };

    if (!isAuthorized) {
        return (
            <div className="max-w-md mx-auto mt-24 p-10 bg-white rounded-[3rem] shadow-2xl border border-enterprise-100 text-center animate-premium-fade relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-brand-orange"></div>
                <div className="w-20 h-20 bg-enterprise-50 text-brand-orange rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-inner">
                    <ShieldCheck size={40} />
                </div>
                <h2 className="text-2xl font-black text-enterprise-950 uppercase italic italic-brand tracking-tighter mb-2">Seguridad de Infraestructura</h2>
                <p className="text-enterprise-400 text-[10px] font-black uppercase tracking-[0.2em] mb-10 leading-relaxed max-w-xs mx-auto">
                    Zona restringida para mantenimiento crítico. Ingrese la clave de autorización corporativa.
                </p>
                <form onSubmit={handleAuthorize} className="space-y-6">
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="TERMINAL CODE"
                        className="w-full bg-enterprise-50 border border-enterprise-100 p-5 rounded-2xl text-center font-black tracking-[0.8em] focus:ring-1 focus:ring-brand-orange/20 outline-none transition-all placeholder:tracking-normal placeholder:opacity-30 text-enterprise-950"
                    />
                    <button
                        type="submit"
                        className="w-full bg-enterprise-950 text-white font-black uppercase tracking-[0.3em] py-5 rounded-2xl hover:bg-brand-orange transition-all active:scale-95 shadow-xl shadow-enterprise-900/10 text-[10px]"
                    >
                        Validar Acceso
                    </button>
                </form>
            </div>
        );
    }

    const categories = [
        {
            id: 'COTZ',
            label: 'Historial de Cotizaciones',
            desc: 'Borra todas las propuestas (ganadas, perdidas, borradores).',
            count: historial?.length || 0,
            icon: RefreshCw,
            color: 'blue'
        },
        {
            id: 'MC',
            label: 'Master Contracts',
            desc: 'Vacia las bolsas de inversión de todos los clientes.',
            count: masterContracts?.length || 0,
            icon: Database,
            color: 'amber'
        },
        {
            id: 'CLIENTS',
            label: 'Catálogo de Clientes',
            desc: 'Borra empresas y TODA su información vinculada (CASCADE).',
            count: clientes?.length || 0,
            icon: Users,
            color: 'red'
        },
        {
            id: 'GOALS',
            label: 'Metas Comerciales',
            desc: 'Vacia el histórico de metas mensuales.',
            count: metasComerciales?.length || 0,
            icon: Target,
            color: 'purple'
        },
        {
            id: 'BILLING',
            label: 'Control de Cobranza',
            desc: 'Limpia el registro de facturas y pagos.',
            count: cobranza?.length || 0,
            icon: DollarSign,
            color: 'emerald'
        }
    ];

    return (
        <div className="max-w-4xl mx-auto py-8 animate-premium-fade">
            <div className="bg-enterprise-950 p-6 rounded-2xl md:rounded-b-none flex flex-col md:flex-row justify-between items-center gap-4 transition-all duration-300 mb-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-brand-orange/10 blur-[80px] -mr-32 -mt-32"></div>
                <div className="flex items-center gap-4 relative z-10">
                    <Database size={20} className="text-brand-orange" />
                    <h3 className="text-sm font-black text-white uppercase italic italic-brand flex items-center gap-3 tracking-widest">
                        Mantenimiento Transaccional
                    </h3>
                </div>
                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-brand-magenta/10 rounded-lg text-brand-magenta text-[9px] font-black uppercase tracking-[0.2em] border border-brand-magenta/20 relative z-10 shadow-lg">
                    <AlertTriangle size={14} /> Modo Depuración
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {categories.map((cat) => (
                    <div key={cat.id} className="bg-white p-8 rounded-[2.5rem] border border-enterprise-100 shadow-sm flex items-center justify-between group hover:border-brand-orange/20 transition-all hover:shadow-xl">
                        <div className="flex items-center gap-6">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center bg-enterprise-50 text-enterprise-950 group-hover:bg-enterprise-950 group-hover:text-white transition-all shadow-inner`}>
                                <cat.icon size={24} className="group-hover:text-brand-orange transition-colors" />
                            </div>
                            <div>
                                <h3 className="font-black text-enterprise-950 text-xs uppercase italic italic-brand tracking-widest">{cat.label}</h3>
                                <p className="text-[10px] font-bold text-enterprise-400 max-w-[180px] leading-tight mt-1">{cat.desc}</p>
                                <span className="inline-block mt-3 px-3 py-1 bg-enterprise-50 rounded-full text-[8px] font-black text-enterprise-500 uppercase tracking-widest shadow-sm">
                                    {cat.count} registros vinculados
                                </span>
                            </div>
                        </div>
                        <button
                            onClick={() => setShowConfirm(cat.id)}
                            className="p-4 bg-enterprise-50 text-enterprise-300 hover:bg-brand-orange/10 hover:text-brand-orange rounded-2xl transition-all border border-transparent hover:border-brand-orange/20"
                        >
                            <Trash2 size={20} />
                        </button>
                    </div>
                ))}

                <button
                    onClick={() => setShowConfirm('ALL')}
                    className="md:col-span-2 bg-brand-magenta text-white p-10 rounded-[3rem] font-black uppercase tracking-[0.4em] flex flex-col items-center justify-center gap-4 hover:bg-enterprise-950 transition-all shadow-2xl shadow-brand-magenta/20 active:scale-[0.98] group"
                >
                    <AlertTriangle size={32} className="group-hover:scale-110 transition-transform" />
                    <span className="text-[12px]">Restablecimiento Global de Infraestructura</span>
                    <span className="text-[8px] opacity-60 tracking-[0.1em] font-bold">Resetea todas las tablas de producción (Irreversible)</span>
                </button>
            </div>

            {/* Modal de Confirmación */}
            {showConfirm && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-enterprise-950/70 backdrop-blur-md animate-premium-fade">
                    <div className="bg-white w-full max-w-sm rounded-[4rem] p-12 text-center shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-2 bg-brand-magenta"></div>
                        <div className="w-24 h-24 bg-brand-magenta/5 text-brand-magenta rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 animate-pulse shadow-inner border border-brand-magenta/10">
                            <Trash2 size={48} />
                        </div>
                        <h2 className="text-2xl font-black text-enterprise-950 uppercase italic italic-brand tracking-tighter mb-4">Confirmación Final</h2>
                        <p className="text-enterprise-400 text-[10px] font-black uppercase tracking-[0.2em] mb-10 leading-relaxed mx-auto max-w-[240px]">
                            Los datos serán purgados de forma permanente de la infraestructura. No existe método de recuperación.
                            <span className="block mt-2 text-brand-magenta">{showConfirm === 'ALL' ? 'RESET TOTAL DEL SISTEMA' : `LIMPIEZA DE ${showConfirm}`}</span>
                        </p>
                        <div className="flex flex-col gap-4">
                            <button
                                onClick={() => handleCleanup(showConfirm)}
                                className="w-full bg-brand-magenta text-white font-black uppercase tracking-[0.3em] py-5 rounded-2xl hover:bg-enterprise-950 transition-all shadow-xl shadow-brand-magenta/20 text-[10px]"
                            >
                                Confirmar Purgado de Datos
                            </button>
                            <button
                                onClick={() => setShowConfirm(null)}
                                className="w-full bg-enterprise-50 text-enterprise-400 font-black uppercase tracking-[0.3em] py-5 rounded-2xl hover:bg-enterprise-100 transition-all text-[10px]"
                            >
                                Cancelar Operación
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MaintenanceView;
