import React, { useState, useMemo } from 'react';
import {
    Briefcase, Plus, Search, Calendar, DollarSign,
    ArrowRight, CheckCircle2, Clock, AlertCircle,
    ChevronRight, Filter, Building2, BarChart3, FileText
} from 'lucide-react';
import { formatMXN } from '../../utils/formatters';

const MasterContractsView = ({
    masterContracts = [],
    cotizaciones = [],
    clientes = [],
    onSaveMC,
    setMensaje
}) => {
    const [busqueda, setBusqueda] = useState('');
    const [filtroEstatus, setFiltroEstatus] = useState('todos');
    const [isCreating, setIsCreating] = useState(false);
    const [selectedMC, setSelectedMC] = useState(null);

    // Estado para nuevo/editar MC
    const [formData, setFormData] = useState({
        numero_mc: '',
        cliente_id: '',
        monto_aprobado: '',
        fecha_inicio: '',
        fecha_fin: '',
        notas: '',
        estatus: 'activo'
    });

    // Enriquecer MCs con datos de consumo
    const enrichedMCs = useMemo(() => {
        return (masterContracts || []).map(mc => {
            const cliente = clientes.find(c => String(c.id) === String(mc.cliente_id));
            const mcCotizaciones = cotizaciones.filter(q =>
                String(q.mc_id) === String(mc.id) && q.estatus === 'ganada'
            );

            const montoConsumido = mcCotizaciones.reduce((sum, q) =>
                sum + (parseFloat(q.subtotalGeneral || q.total / 1.16) || 0), 0
            );

            return {
                ...mc,
                cliente,
                cotizaciones: mcCotizaciones,
                montoConsumido,
                saldoDisponible: parseFloat(mc.monto_aprobado) - montoConsumido,
                porcentajeConsumo: (montoConsumido / parseFloat(mc.monto_aprobado)) * 100
            };
        });
    }, [masterContracts, cotizaciones, clientes]);

    const filtrados = enrichedMCs.filter(mc => {
        const matchesBusqueda =
            mc.numero_mc?.toLowerCase().includes(busqueda.toLowerCase()) ||
            mc.cliente?.nombre_empresa?.toLowerCase().includes(busqueda.toLowerCase());

        const matchesEstatus = filtroEstatus === 'todos' || mc.estatus === filtroEstatus;

        return matchesBusqueda && matchesEstatus;
    });

    const handleSave = async (e) => {
        e.preventDefault();
        const success = await onSaveMC('master_contracts', formData);
        if (success) {
            setMensaje({ tipo: 'exito', texto: 'Master Contract guardado correctamente' });
            setIsCreating(false);
            setFormData({
                numero_mc: '',
                cliente_id: '',
                monto_aprobado: '',
                fecha_inicio: '',
                fecha_fin: '',
                notas: '',
                estatus: 'activo'
            });
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-20 animate-in fade-in duration-500">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="bg-white rounded-[2rem] shadow-xl p-6 mb-6 border-b-4 border-slate-900">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-slate-200">
                                <Briefcase size={24} />
                            </div>
                            <div>
                                <h1 className="text-2xl font-black text-gray-800 tracking-tight">Master Contracts</h1>
                                <p className="text-gray-400 font-bold uppercase text-[9px] tracking-[0.3em] mt-0.5 italic">Control de Bolsas de Crédito y Saldos</p>
                            </div>
                        </div>

                        <button
                            onClick={() => setIsCreating(true)}
                            className="bg-red-600 hover:bg-slate-900 text-white px-6 py-3 rounded-xl font-black uppercase text-[9px] tracking-[0.2em] transition-all active:scale-95 shadow-xl flex items-center gap-2"
                        >
                            <Plus size={16} /> Nuevo Contrato Maestro
                        </button>
                    </div>
                </div>

                {/* Filtros */}
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                    <div className="flex-1 relative">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input
                            type="text"
                            placeholder="Buscar por cliente o folio MC..."
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                            className="w-full pl-14 pr-6 py-4 bg-white border-none rounded-2xl font-bold text-xs shadow-xl shadow-slate-100 outline-none focus:ring-2 focus:ring-red-500 transition-all placeholder:text-gray-300"
                        />
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 whitespace-nowrap">
                        {['todos', 'activo', 'agotado', 'vencido'].map(estatus => (
                            <button
                                key={estatus}
                                onClick={() => setFiltroEstatus(estatus)}
                                className={`px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all
                                    ${filtroEstatus === estatus
                                        ? 'bg-slate-900 text-white shadow-lg'
                                        : 'bg-white text-gray-400 hover:text-slate-900 shadow-sm border border-gray-100'}`}
                            >
                                {estatus}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Grid de MCs */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filtrados.map(mc => (
                        <div
                            key={mc.id}
                            onClick={() => setSelectedMC(mc)}
                            className="bg-white rounded-[2.5rem] shadow-xl border border-gray-100 p-8 hover:scale-[1.02] transition-all cursor-pointer group relative overflow-hidden"
                        >
                            {/* Decoración de fondo */}
                            <div className="absolute -right-4 -top-4 w-24 h-24 bg-slate-50 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-700"></div>

                            <div className="relative">
                                <div className="flex justify-between items-start mb-6">
                                    <div className={`px-4 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-widest flex items-center gap-2
                                        ${mc.estatus === 'activo' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                                        <CheckCircle2 size={12} /> {mc.estatus}
                                    </div>
                                    <div className="text-[10px] font-black text-slate-300 uppercase tracking-tighter">
                                        Vence: {mc.fecha_fin ? new Date(mc.fecha_fin).toLocaleDateString('es-MX', { month: 'short', year: 'numeric' }) : 'S/F'}
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-lg">
                                        <Building2 size={24} />
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="text-sm font-black text-slate-900 truncate uppercase tracking-tight">{mc.cliente?.nombre_empresa || 'Cliente Sin Nombre'}</h3>
                                        <p className="text-[10px] font-bold text-red-600 tracking-widest uppercase">MC: {mc.numero_mc}</p>
                                    </div>
                                </div>

                                <div className="space-y-4 mb-8">
                                    <div className="flex justify-between items-end">
                                        <div>
                                            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Inversión Aprobada</p>
                                            <p className="text-lg font-black text-slate-900 leading-none">{formatMXN(mc.monto_aprobado)}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1 font-italic">Saldo Disponible</p>
                                            <p className={`text-sm font-black leading-none ${mc.saldoDisponible < 100000 ? 'text-red-600' : 'text-emerald-600'}`}>
                                                {formatMXN(mc.saldoDisponible)}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner">
                                        <div
                                            className={`h-full transition-all duration-1000 ${mc.porcentajeConsumo > 90 ? 'bg-red-500' : mc.porcentajeConsumo > 70 ? 'bg-orange-500' : 'bg-emerald-500'}`}
                                            style={{ width: `${Math.min(mc.porcentajeConsumo, 100)}%` }}
                                        ></div>
                                    </div>

                                    <div className="flex justify-between items-center text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                        <span>Consumido: {mc.porcentajeConsumo.toFixed(1)}%</span>
                                        <span className="flex items-center gap-1"><FileText size={10} /> {mc.cotizaciones?.length || 0} Contr.</span>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-slate-50 flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                        <BarChart3 size={14} className="text-slate-400" />
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Monitor de Saldo</span>
                                    </div>
                                    <ChevronRight size={18} className="text-slate-300 group-hover:text-red-500 group-hover:translate-x-1 transition-all" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Empty State */}
                {filtrados.length === 0 && (
                    <div className="py-32 text-center bg-white rounded-[3rem] shadow-xl border border-dashed border-gray-200">
                        <Briefcase size={80} className="mx-auto text-gray-100 mb-6" />
                        <h2 className="text-xl font-black text-slate-400 uppercase tracking-[0.4em]">No hay Master Contracts</h2>
                        <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest mt-2">Empieza creando uno para controlar las inversiones de tus clientes</p>
                    </div>
                )}
            </div>

            {/* Modal: Nuevo Master Contract */}
            {isCreating && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-lg rounded-[3rem] p-10 shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="absolute top-0 left-0 w-full h-2 bg-red-600"></div>

                        <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter mb-8 flex items-center gap-3">
                            <Plus className="text-red-600" /> Crear Master Contract
                        </h2>

                        <form onSubmit={handleSave} className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2 space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Seleccionar Cliente</label>
                                    <select
                                        required
                                        value={formData.cliente_id}
                                        onChange={(e) => setFormData({ ...formData, cliente_id: e.target.value })}
                                        className="w-full p-4 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-red-500 outline-none appearance-none"
                                    >
                                        <option value="">Elegir empresa...</option>
                                        {clientes.map(c => (
                                            <option key={c.id} value={c.id}>{c.nombre_empresa}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Folio MC</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Ej: MC-2024-001"
                                        value={formData.numero_mc}
                                        onChange={(e) => setFormData({ ...formData, numero_mc: e.target.value })}
                                        className="w-full p-4 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-red-500 outline-none"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Inversión Aprobada</label>
                                    <input
                                        type="number"
                                        required
                                        placeholder="$0.00"
                                        value={formData.monto_aprobado}
                                        onChange={(e) => setFormData({ ...formData, monto_aprobado: e.target.value })}
                                        className="w-full p-4 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-red-500 outline-none font-mono"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Inicio Periodo</label>
                                    <input
                                        type="date"
                                        required
                                        value={formData.fecha_inicio}
                                        onChange={(e) => setFormData({ ...formData, fecha_inicio: e.target.value })}
                                        className="w-full p-4 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-red-500 outline-none"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Fin Periodo</label>
                                    <input
                                        type="date"
                                        required
                                        value={formData.fecha_fin}
                                        onChange={(e) => setFormData({ ...formData, fecha_fin: e.target.value })}
                                        className="w-full p-4 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-red-500 outline-none"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsCreating(false)}
                                    className="flex-1 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:bg-slate-50 rounded-2xl transition-all"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="flex-[2] py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] hover:bg-red-600 transition-all shadow-xl shadow-slate-200"
                                >
                                    Guardar Contrato
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal: Detalle de MC */}
            {selectedMC && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-10 bg-slate-900/80 backdrop-blur-xl animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-[3rem] shadow-2xl relative flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 duration-500">
                        <button
                            onClick={() => setSelectedMC(null)}
                            className="absolute right-8 top-8 w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 hover:bg-red-50 hover:text-red-600 transition-all z-10"
                        >
                            <ArrowRight className="rotate-180" size={20} />
                        </button>

                        <div className="p-12 pb-6 flex items-center gap-6 border-b border-slate-50">
                            <div className="w-20 h-20 bg-slate-900 rounded-[2rem] flex items-center justify-center text-white shadow-2xl shadow-slate-200">
                                <Briefcase size={36} />
                            </div>
                            <div>
                                <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">{selectedMC.cliente?.nombre_empresa}</h2>
                                <div className="flex items-center gap-4 mt-2">
                                    <span className="text-[10px] font-black text-red-600 uppercase tracking-[0.3em]">Master Contract: {selectedMC.numero_mc}</span>
                                    <span className="w-1 h-1 bg-slate-200 rounded-full"></span>
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">
                                        {new Date(selectedMC.fecha_inicio).toLocaleDateString()} - {new Date(selectedMC.fecha_fin).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-12 custom-scrollbar">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                                <div className="bg-slate-50 p-6 rounded-[2rem]">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Presupuesto Inicial</p>
                                    <p className="text-xl font-black text-slate-900">{formatMXN(selectedMC.monto_aprobado)}</p>
                                </div>
                                <div className="bg-slate-50 p-6 rounded-[2rem]">
                                    <p className="text-[9px] font-black text-red-600 uppercase tracking-widest mb-2">Total Consumido</p>
                                    <p className="text-xl font-black text-red-600">{formatMXN(selectedMC.montoConsumido)}</p>
                                </div>
                                <div className="bg-slate-50 p-6 rounded-[2rem] border-2 border-emerald-500/20">
                                    <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-2">Disponible Real</p>
                                    <p className="text-xl font-black text-emerald-600 font-mono tracking-tighter">{formatMXN(selectedMC.saldoDisponible)}</p>
                                </div>
                            </div>

                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                                <FileText size={14} /> Desglose de Contratos Asociados
                            </h4>

                            <div className="space-y-4">
                                {selectedMC.cotizaciones?.length > 0 ? selectedMC.cotizaciones.map(cotz => (
                                    <div key={cotz.id} className="bg-white border border-slate-100 p-6 rounded-3xl flex items-center justify-between hover:bg-slate-50 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-slate-900/5 rounded-xl flex items-center justify-center text-slate-900">
                                                <CheckCircle2 size={18} />
                                            </div>
                                            <div>
                                                <p className="text-xs font-black text-slate-900 uppercase">Contrato: {cotz.numero_contrato || 'S/N'}</p>
                                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Folio Cotización: {cotz.folio}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-black text-slate-900">{formatMXN(cotz.subtotalGeneral || cotz.total / 1.16)}</p>
                                            <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest mt-1">
                                                {new Date(cotz.created_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="text-center py-12 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">No hay consumos registrados aún</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-end">
                            <button
                                onClick={() => setSelectedMC(null)}
                                className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-red-600 transition-all"
                            >
                                Cerrar Detalle
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MasterContractsView;
