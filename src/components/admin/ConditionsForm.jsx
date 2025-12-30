import React, { useState, useEffect, useMemo } from 'react';
import { Save, Tag, RefreshCw, ChevronDown, MapPin, Zap, Tv, Clock, BarChart4 } from 'lucide-react';
import { formatMXN } from '../../utils/formatters';

const ConditionsForm = ({ clientes, productos, condicionesCliente, onSave, setMensaje }) => {
    const [clienteIdSeleccionado, setClienteIdSeleccionado] = useState('');
    const [filtroPlaza, setFiltroPlaza] = useState('');
    const [filtroCanal, setFiltroCanal] = useState('');
    const [filtroTipo, setFiltroTipo] = useState('');
    const [filtroHorario, setFiltroHorario] = useState('');
    const [loading, setLoading] = useState(false);

    // Matrix state: local copy of conditions for the selected client
    const [matrix, setMatrix] = useState([]);
    const [bulkValue, setBulkValue] = useState('');
    const [bulkType, setBulkType] = useState('FACTOR'); // 'FACTOR' or 'FIJO'

    // Load matrix when client changes
    useEffect(() => {
        if (!clienteIdSeleccionado) {
            setMatrix([]);
            return;
        }

        const clientConditions = condicionesCliente.filter(c => String(c.clienteId) === String(clienteIdSeleccionado));

        // Build matrix from all active products
        const initialMatrix = productos
            .filter(p => p.disponible)
            .map(p => {
                const existing = clientConditions.find(c => String(c.productoId) === String(p.id));
                return {
                    productId: p.id,
                    canal: p.canal,
                    plaza: p.plaza,
                    tipo: p.tipo,
                    duracion: p.duracion,
                    horario: p.horario,
                    costoBase: p.costoBase,
                    condicionId: existing?.id || null,
                    factor: existing?.factorDescuento || '',
                    costoFijo: existing?.costoFijo || '',
                    tipoAjuste: existing?.tipoAjuste || 'FACTOR',
                    dirty: false // To track changes
                };
            });

        setMatrix(initialMatrix);
    }, [clienteIdSeleccionado, productos, condicionesCliente]);

    const handleCellChange = (productId, field, value) => {
        setMatrix(prev => prev.map(row => {
            if (row.productId === productId) {
                const updatedRow = { ...row, [field]: value, dirty: true };
                // Logic to toggle typeAjuste based on which field was edited
                if (field === 'factor' && value !== '') updatedRow.tipoAjuste = 'FACTOR';
                if (field === 'costoFijo' && value !== '') updatedRow.tipoAjuste = 'FIJO';
                return updatedRow;
            }
            return row;
        }));
    };

    const applyBulkAction = () => {
        if (!bulkValue || isNaN(bulkValue)) {
            setMensaje({ tipo: 'error', texto: 'Ingresa un valor numérico válido para la carga masiva.' });
            return;
        }

        const val = parseFloat(bulkValue);
        setMatrix(prev => prev.map(row => {
            const matchesPlaza = !filtroPlaza || row.plaza === filtroPlaza;
            const matchesCanal = !filtroCanal || row.canal === filtroCanal;
            const matchesTipo = !filtroTipo || row.tipo === filtroTipo;
            const matchesHorario = !filtroHorario || row.horario === filtroHorario;

            if (matchesPlaza && matchesCanal && matchesTipo && matchesHorario) {
                return {
                    ...row,
                    [bulkType === 'FACTOR' ? 'factor' : 'costoFijo']: val,
                    tipoAjuste: bulkType,
                    dirty: true
                };
            }
            return row;
        }));
        setBulkValue('');
        setMensaje({ tipo: 'exito', texto: `Se aplicó ${bulkType} masivamente a la selección actual.` });
    };

    const handleSaveMatrix = async () => {
        const changedRows = matrix.filter(r => r.dirty);
        if (changedRows.length === 0) {
            setMensaje({ tipo: 'info', texto: 'No hay cambios pendientes para guardar.' });
            return;
        }

        setLoading(true);
        try {
            const updates = [];
            const inserts = [];

            changedRows.forEach(r => {
                const item = {
                    cliente_id: clienteIdSeleccionado,
                    producto_id: r.productId,
                    tipo_ajuste: r.tipoAjuste,
                    factor_descuento: r.tipoAjuste === 'FACTOR' ? (parseFloat(r.factor) || null) : null,
                    costo_fijo: r.tipoAjuste === 'FIJO' ? (parseFloat(r.costoFijo) || null) : null
                };

                if (r.condicionId) {
                    updates.push({ ...item, id: r.condicionId });
                } else {
                    inserts.push(item);
                }
            });

            if (updates.length > 0) {
                await onSave('condiciones_cliente', updates);
            }
            if (inserts.length > 0) {
                await onSave('condiciones_cliente', inserts);
            }

            setMensaje({ tipo: 'exito', texto: `¡Matriz actualizada! ${changedRows.length} registros procesados.` });
            // Reset dirty state after save
            setMatrix(prev => prev.map(r => ({ ...r, dirty: false })));
        } catch (error) {

            console.error(error);
            setMensaje({ tipo: 'error', texto: 'Error al actualizar la matriz.' });
        } finally {
            setLoading(false);
        }
    };

    const options = useMemo(() => ({
        plazas: [...new Set(productos.map(p => p.plaza))].sort(),
        canales: [...new Set(productos.map(p => p.canal))].sort(),
        tipos: [...new Set(productos.map(p => p.tipo))].sort(),
        horarios: [...new Set(productos.map(p => p.horario))].sort()
    }), [productos]);

    const filteredMatrix = useMemo(() => {
        return matrix.filter(row => {
            const matchesPlaza = !filtroPlaza || row.plaza === filtroPlaza;
            const matchesCanal = !filtroCanal || row.canal === filtroCanal;
            const matchesTipo = !filtroTipo || row.tipo === filtroTipo;
            const matchesHorario = !filtroHorario || row.horario === filtroHorario;
            return matchesPlaza && matchesCanal && matchesTipo && matchesHorario;
        });
    }, [matrix, filtroPlaza, filtroCanal, filtroTipo, filtroHorario]);

    return (
        <div className="bg-white rounded-2xl shadow-premium border border-enterprise-100 mt-6 overflow-hidden animate-premium-fade max-w-6xl mx-auto">
            {/* COMPACT HEADLINE BAR */}
            <div className="bg-enterprise-950 p-4 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-brand-orange/20 rounded-lg flex items-center justify-center text-brand-orange">
                        <Tag size={16} />
                    </div>
                    <div>
                        <h3 className="text-[10px] font-black text-white uppercase italic tracking-widest leading-none">Commercial Strategy Nexus</h3>
                        <div className="flex items-center gap-1.5 mt-1">
                            <Zap size={7} className="text-brand-orange fill-brand-orange" />
                            <p className="text-[6px] font-bold text-white/40 uppercase tracking-widest leading-none">Custom Yield Management Console</p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative">
                        <select
                            value={clienteIdSeleccionado}
                            onChange={(e) => setClienteIdSeleccionado(e.target.value)}
                            className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-[9px] font-black text-white outline-none focus:border-brand-orange/50 transition-all italic min-w-[240px] appearance-none"
                        >
                            <option value="" className="bg-enterprise-950">-- SELECT CORPORATE ACCOUNT --</option>
                            {clientes.map(c => <option key={c.id} value={c.id} className="bg-enterprise-950">{c.nombre_empresa.toUpperCase()}</option>)}
                        </select>
                        <ChevronDown size={8} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
                    </div>
                </div>
            </div>

            {clienteIdSeleccionado ? (
                <div className="flex flex-col flex-1">
                    {/* FULL FILTER SET - MATCHING COTIZADOR (Plaza, Canal, Tipo, Horario) */}
                    <div className="bg-enterprise-50/50 p-3 border-b border-enterprise-100 flex flex-wrap items-center justify-between gap-4">
                        <div className="flex flex-wrap items-center gap-2">
                            {/* PLAZA */}
                            <div className="relative">
                                <select
                                    value={filtroPlaza}
                                    onChange={(e) => setFiltroPlaza(e.target.value)}
                                    className="bg-enterprise-950 text-white border-none rounded px-7 py-1.5 text-[8px] font-black uppercase tracking-widest appearance-none outline-none focus:ring-1 focus:ring-brand-orange transition-all min-w-[120px]"
                                >
                                    <option value="">ALL REGIONS</option>
                                    {options.plazas.map(p => <option key={p} value={p}>{p}</option>)}
                                </select>
                                <MapPin size={9} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-brand-orange" />
                            </div>

                            {/* CANAL */}
                            <div className="relative">
                                <select
                                    value={filtroCanal}
                                    onChange={(e) => setFiltroCanal(e.target.value)}
                                    className="bg-enterprise-950 text-white border-none rounded px-7 py-1.5 text-[8px] font-black uppercase tracking-widest appearance-none outline-none focus:ring-1 focus:ring-brand-orange transition-all min-w-[100px]"
                                >
                                    <option value="">CHNL</option>
                                    {options.canales.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                                <Tv size={9} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-brand-orange" />
                            </div>

                            {/* TIPO */}
                            <div className="relative">
                                <select
                                    value={filtroTipo}
                                    onChange={(e) => setFiltroTipo(e.target.value)}
                                    className="bg-enterprise-950 text-white border-none rounded px-7 py-1.5 text-[8px] font-black uppercase tracking-widest appearance-none outline-none focus:ring-1 focus:ring-brand-orange transition-all min-w-[100px]"
                                >
                                    <option value="">TYPE</option>
                                    {options.tipos.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                                <BarChart4 size={9} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-brand-orange" />
                            </div>

                            {/* HORARIO */}
                            <div className="relative">
                                <select
                                    value={filtroHorario}
                                    onChange={(e) => setFiltroHorario(e.target.value)}
                                    className="bg-enterprise-950 text-white border-none rounded px-7 py-1.5 text-[8px] font-black uppercase tracking-widest appearance-none outline-none focus:ring-1 focus:ring-brand-orange transition-all min-w-[100px]"
                                >
                                    <option value="">TIME</option>
                                    {options.horarios.map(h => <option key={h} value={h}>{h}</option>)}
                                </select>
                                <Clock size={9} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-brand-orange" />
                            </div>
                        </div>

                        <div className="flex items-center gap-3 ml-auto">
                            <div className="flex bg-white rounded-md border border-enterprise-200 overflow-hidden shadow-sm">
                                <input
                                    type="number"
                                    value={bulkValue}
                                    onChange={(e) => setBulkValue(e.target.value)}
                                    placeholder="VAL..."
                                    className="w-14 px-2 py-1.5 text-[8px] font-black outline-none border-r border-enterprise-100 placeholder:text-enterprise-200"
                                />
                                <select
                                    value={bulkType}
                                    onChange={(e) => setBulkType(e.target.value)}
                                    className="bg-white px-1 py-1.5 text-[7px] font-black uppercase outline-none"
                                >
                                    <option value="FACTOR">FACTOR (%)</option>
                                    <option value="FIJO">NET ($)</option>
                                </select>
                                <button
                                    onClick={applyBulkAction}
                                    className="px-3 bg-enterprise-950 text-white text-[8px] font-black uppercase tracking-widest hover:bg-brand-orange transition-all"
                                >
                                    Apply
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Matrix Table - Compact & Sharp */}
                    <div className="overflow-x-auto max-h-[550px] custom-scrollbar">
                        <table className="w-full text-left border-collapse">
                            <thead className="sticky top-0 z-20">
                                <tr className="bg-enterprise-950">
                                    <th className="px-3 py-2 text-[7px] font-black text-white/40 uppercase tracking-widest border-r border-white/5">Network / Region</th>
                                    <th className="px-3 py-2 text-[7px] font-black text-white/40 uppercase tracking-widest border-r border-white/5">Matrix Specification</th>
                                    <th className="px-3 py-2 text-[7px] font-black text-white/40 uppercase tracking-widest border-r border-white/5 text-center">GCP List Price</th>
                                    <th className="px-3 py-2 text-[7px] font-black text-brand-orange uppercase tracking-widest border-r border-white/5 text-center bg-white/5">Adjustment Factor</th>
                                    <th className="px-3 py-2 text-[7px] font-black text-brand-orange uppercase tracking-widest text-center bg-white/5">Custom Net Price</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-enterprise-50">
                                {filteredMatrix.map((row) => (
                                    <tr key={row.productId} className={`hover:bg-enterprise-50/50 transition-all ${row.dirty ? 'bg-brand-orange/5' : ''}`}>
                                        <td className="px-3 py-1.5 border-r border-enterprise-50">
                                            <p className="text-[9px] font-black text-enterprise-950 leading-none uppercase italic">{row.canal}</p>
                                            <p className="text-[7px] font-bold text-enterprise-400 uppercase tracking-tighter mt-0.5">{row.plaza}</p>
                                        </td>
                                        <td className="px-3 py-1.5 border-r border-enterprise-50">
                                            <div className="flex items-center gap-1">
                                                <p className="text-[9px] font-black text-enterprise-700 leading-none uppercase">{row.tipo}</p>
                                                <span className="text-[7px] font-bold text-brand-orange bg-brand-orange/5 px-1 rounded">{row.duracion}</span>
                                            </div>
                                            <p className="text-[7px] font-bold text-enterprise-400 uppercase tracking-tighter mt-0.5">{row.horario}</p>
                                        </td>
                                        <td className="px-3 py-1.5 border-r border-enterprise-50 text-center font-black">
                                            <span className="text-[9px] text-enterprise-400">{formatMXN(row.costoBase)}</span>
                                        </td>
                                        <td className={`px-3 py-1.5 border-r border-enterprise-50 text-center ${row.tipoAjuste === 'FACTOR' ? 'bg-brand-orange/5' : ''}`}>
                                            <input
                                                type="number"
                                                value={row.factor}
                                                onFocus={(e) => e.target.select()}
                                                onChange={(e) => handleCellChange(row.productId, 'factor', e.target.value)}
                                                className="w-16 bg-transparent border-none focus:ring-1 focus:ring-brand-orange rounded outline-none text-[10px] font-black text-center text-enterprise-950 transition-all py-0.5"
                                                placeholder="1.00"
                                            />
                                        </td>
                                        <td className={`px-3 py-1.5 text-center ${row.tipoAjuste === 'FIJO' ? 'bg-brand-orange/5' : ''}`}>
                                            <input
                                                type="number"
                                                value={row.costoFijo}
                                                onFocus={(e) => e.target.select()}
                                                onChange={(e) => handleCellChange(row.productId, 'costoFijo', e.target.value)}
                                                className="w-20 bg-transparent border-none focus:ring-1 focus:ring-brand-orange rounded outline-none text-[10px] font-black text-center text-enterprise-950 transition-all py-0.5 placeholder:italic"
                                                placeholder="AUTO"
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* ACTIONS FOOTER - COMPACT */}
                    <div className="p-3 bg-enterprise-50 border-t border-enterprise-100 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${matrix.some(r => r.dirty) ? 'bg-brand-orange animate-pulse' : 'bg-enterprise-200'}`} />
                                <span className="text-[8px] font-black text-enterprise-400 uppercase tracking-widest">{matrix.filter(r => r.dirty).length} DIRTY ENTRIES</span>
                            </div>
                            <span className="text-[8px] font-black text-enterprise-400 uppercase">{filteredMatrix.length} SKU LISTED</span>
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={() => setClienteIdSeleccionado('')}
                                className="px-4 py-1.5 text-[8px] font-black text-enterprise-400 uppercase tracking-widest hover:text-enterprise-950 transition-all"
                            >
                                ABORT SESSION
                            </button>
                            <button
                                onClick={handleSaveMatrix}
                                disabled={loading || !matrix.some(r => r.dirty)}
                                className="px-6 py-2 bg-enterprise-950 text-white rounded-lg text-[8px] font-black uppercase tracking-widest hover:bg-brand-orange transition-all active:scale-95 shadow-lg flex items-center gap-2 disabled:opacity-20"
                            >
                                {loading ? <RefreshCw className="animate-spin" size={12} /> : <Save size={12} />}
                                DEPLOY STRATEGY
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="p-16 flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 bg-enterprise-50 rounded-2xl flex items-center justify-center mb-4">
                        <Tag size={32} className="text-enterprise-200" />
                    </div>
                    <h4 className="text-[11px] font-black text-enterprise-950 uppercase italic tracking-widest">Yield Management Engine</h4>
                    <p className="text-[8px] font-bold text-enterprise-400 uppercase tracking-[0.2em] mt-2 max-w-[280px]">Select a strategic partner to begin customized price matrix mapping.</p>
                </div>
            )}
        </div>
    );
};

export default ConditionsForm;
