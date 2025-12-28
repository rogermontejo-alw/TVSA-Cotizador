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
            <div className="max-w-md mx-auto mt-20 p-8 bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 text-center animate-in zoom-in duration-500">
                <div className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <ShieldCheck size={32} />
                </div>
                <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter mb-2">Área Restringida</h2>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-8 leading-relaxed">
                    Esta sección permite el borrado masivo de datos. Ingrese la clave maestra para continuar.
                </p>
                <form onSubmit={handleAuthorize} className="space-y-4">
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl text-center font-black tracking-[0.5em] focus:border-red-500 outline-none transition-all"
                    />
                    <button
                        type="submit"
                        className="w-full bg-slate-900 text-white font-black uppercase tracking-widest py-4 rounded-2xl hover:bg-red-600 transition-all active:scale-95 shadow-lg shadow-slate-200"
                    >
                        Validar Credenciales
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
        <div className="max-w-4xl mx-auto py-8 animate-in fade-in duration-500">
            <div className="mb-12 text-center">
                <div className="inline-flex items-center gap-3 px-4 py-2 bg-red-100/50 rounded-full text-red-600 text-[10px] font-black uppercase tracking-widest mb-4">
                    <AlertTriangle size={14} /> Modo Mantenimiento Activo
                </div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Limpieza de Sistema</h1>
                <p className="text-slate-400 font-bold uppercase text-[9px] tracking-widest mt-2">
                    Selecciona los módulos que deseas resetear a cero. Los productos no se verán afectados.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {categories.map((cat) => (
                    <div key={cat.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between group hover:border-slate-200 transition-all">
                        <div className="flex items-center gap-5">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center bg-${cat.color}-50 text-${cat.color}-600 group-hover:scale-110 transition-transform`}>
                                <cat.icon size={20} />
                            </div>
                            <div>
                                <h3 className="font-black text-slate-900 text-sm uppercase">{cat.label}</h3>
                                <p className="text-[10px] font-bold text-slate-400 max-w-[180px] leading-tight mt-0.5">{cat.desc}</p>
                                <span className="inline-block mt-2 px-2 py-0.5 bg-slate-50 rounded-md text-[9px] font-black text-slate-500">{cat.count} registros activos</span>
                            </div>
                        </div>
                        <button
                            onClick={() => setShowConfirm(cat.id)}
                            className="p-3 bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all"
                        >
                            <Trash2 size={18} />
                        </button>
                    </div>
                ))}

                <button
                    onClick={() => setShowConfirm('ALL')}
                    className="md:col-span-2 bg-red-600 text-white p-8 rounded-[2.5rem] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-4 hover:bg-red-700 transition-all shadow-xl shadow-red-200 active:scale-[0.98]"
                >
                    <AlertTriangle size={24} />
                    Reiniciar Todo el Sistema (Reset de Fábrica)
                </button>
            </div>

            {/* Modal de Confirmación */}
            {showConfirm && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-sm rounded-[3rem] p-10 text-center shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-2 bg-red-600"></div>
                        <div className="w-20 h-20 bg-red-50 text-red-600 rounded-[2rem] flex items-center justify-center mx-auto mb-6 animate-bounce">
                            <Trash2 size={40} />
                        </div>
                        <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter mb-4">¿Estás totalmente seguro?</h2>
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-8 leading-relaxed">
                            Esta acción es irreversible y los datos borrados no podrán recuperarse.
                            {showConfirm === 'ALL' ? ' Se borrarán clientes, ventas y contratos.' : ` Se limpiará el módulo de ${showConfirm}.`}
                        </p>
                        <div className="flex flex-col gap-3">
                            <button
                                onClick={() => handleCleanup(showConfirm)}
                                className="w-full bg-red-600 text-white font-black uppercase tracking-widest py-4 rounded-2xl hover:bg-red-700 transition-all shadow-lg"
                            >
                                Sí, Proceder al Borrado
                            </button>
                            <button
                                onClick={() => setShowConfirm(null)}
                                className="w-full bg-slate-50 text-slate-400 font-black uppercase tracking-widest py-4 rounded-2xl hover:bg-slate-100 transition-all"
                            >
                                Cancelar acción
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MaintenanceView;
