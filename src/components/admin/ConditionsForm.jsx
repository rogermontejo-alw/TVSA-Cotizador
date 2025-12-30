import React, { useState, useEffect, useMemo } from 'react';
import { Save, Search, Plus, X, Tag, RefreshCw } from 'lucide-react';
import { formatMXN } from '../../utils/formatters';

const ConditionsForm = ({ clientes, productos, condicionesCliente, onSave, setMensaje }) => {
    const [clienteIdSeleccionado, setClienteIdSeleccionado] = useState('');
    const [busqueda, setBusqueda] = useState('');
    const [filtroPlaza, setFiltroPlaza] = useState('');
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
            // Apply only to filtered/visible rows in a real app, 
            // but here we'll apply to rows matching current filters for simplicity
            const matchesSearch = !busqueda ||
                row.canal.toLowerCase().includes(busqueda.toLowerCase()) ||
                row.tipo.toLowerCase().includes(busqueda.toLowerCase());
            const matchesPlaza = !filtroPlaza || row.plaza === filtroPlaza;

            if (matchesSearch && matchesPlaza) {
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
        setMensaje({ tipo: 'exito', texto: `Se aplicó ${bulkType} masivamente a las filas filtradas.` });
    };

    const handleSaveMatrix = async () => {
        const changedRows = matrix.filter(r => r.dirty);
        if (changedRows.length === 0) {
            setMensaje({ tipo: 'info', texto: 'No hay cambios pendientes para guardar.' });
            return;
        }

        setLoading(true);
        try {
            const payload = changedRows.map(r => ({
                ...(r.condicionId ? { id: r.condicionId } : {}),
                cliente_id: clienteIdSeleccionado,
                producto_id: r.productId,
                tipo_ajuste: r.tipoAjuste,
                factor_descuento: r.tipoAjuste === 'FACTOR' ? (parseFloat(r.factor) || null) : null,
                costo_fijo: r.tipoAjuste === 'FIJO' ? (parseFloat(r.costoFijo) || null) : null
            }));

            const result = await onSave('condiciones_cliente', payload);
            if (result) {
                setMensaje({ tipo: 'exito', texto: `¡Matriz actualizada! ${changedRows.length} registros guardados.` });
                // Reset dirty state after save
                setMatrix(prev => prev.map(r => ({ ...r, dirty: false })));
            }
        } catch (error) {
            console.error(error);
            setMensaje({ tipo: 'error', texto: 'Error al actualizar la matriz.' });
        } finally {
            setLoading(false);
        }
    };

    const plazas = useMemo(() => [...new Set(productos.map(p => p.plaza))].sort(), [productos]);

    const filteredMatrix = useMemo(() => {
        return matrix.filter(row => {
            const matchesSearch = !busqueda ||
                row.canal.toLowerCase().includes(busqueda.toLowerCase()) ||
                row.tipo.toLowerCase().includes(busqueda.toLowerCase()) ||
                row.horario.toLowerCase().includes(busqueda.toLowerCase());
            const matchesPlaza = !filtroPlaza || row.plaza === filtroPlaza;
            return matchesSearch && matchesPlaza;
        });
    }, [matrix, busqueda, filtroPlaza]);

    return (
        <div className="bg-white rounded-3xl shadow-premium border border-enterprise-100 mt-8 overflow-hidden animate-premium-fade">
            <div className="bg-enterprise-950 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-brand-orange/20 rounded-xl flex items-center justify-center">
                        <Tag size={20} className="text-brand-orange" />
                    </div>
                    <div>
                        <h3 className="text-sm font-black text-white uppercase italic tracking-tight">Estrategia de Precios Especiales</h3>
                        <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest mt-0.5 italic">Gestión de tarifario por cuenta comercial</p>
                    </div>
                </div>

                <div className="w-full md:w-72">
                    <select
                        value={clienteIdSeleccionado}
                        onChange={(e) => setClienteIdSeleccionado(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-[11px] font-black text-white focus:border-brand-orange-light transition-all outline-none italic"
                    >
                        <option value="" className="bg-enterprise-950">-- SELECCIONAR CLIENTE CORPORATIVO --</option>
                        {clientes.map(c => <option key={c.id} value={c.id} className="bg-enterprise-950">{c.nombre_empresa.toUpperCase()}</option>)}
                    </select>
                </div>
            </div>

            {clienteIdSeleccionado ? (
                <div className="p-6">
                    {/* Bulk Matrix Controls */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
                        <div className="lg:col-span-12 flex flex-wrap items-center gap-4 p-4 bg-enterprise-50 rounded-2xl border border-enterprise-100">
                            <div className="flex items-center gap-3 pr-4 border-r border-enterprise-200">
                                <Search size={14} className="text-enterprise-400" />
                                <input
                                    type="text"
                                    value={busqueda}
                                    onChange={(e) => setBusqueda(e.target.value)}
                                    placeholder="FILTRAR MATRIZ (CANAL, TIPO...)"
                                    className="bg-transparent border-none outline-none text-[10px] font-black uppercase tracking-widest w-48 placeholder:text-enterprise-300"
                                />
                            </div>

                            <select
                                value={filtroPlaza}
                                onChange={(e) => setFiltroPlaza(e.target.value)}
                                className="bg-transparent border-none outline-none text-[10px] font-black uppercase tracking-widest text-enterprise-600 focus:text-brand-orange transition-all"
                            >
                                <option value="">TODAS LAS PLAZAS</option>
                                {plazas.map(p => <option key={p} value={p}>{p}</option>)}
                            </select>

                            <div className="ml-auto flex items-center gap-3">
                                <span className="text-[9px] font-black text-enterprise-400 uppercase">Aplicación Masiva:</span>
                                <div className="flex bg-white rounded-lg border border-enterprise-200 overflow-hidden">
                                    <input
                                        type="number"
                                        value={bulkValue}
                                        onChange={(e) => setBulkValue(e.target.value)}
                                        placeholder="VALOR..."
                                        className="w-20 px-3 py-1.5 text-[10px] font-black outline-none border-r border-enterprise-200"
                                    />
                                    <select
                                        value={bulkType}
                                        onChange={(e) => setBulkType(e.target.value)}
                                        className="bg-white px-2 py-1.5 text-[9px] font-black uppercase outline-none"
                                    >
                                        <option value="FACTOR">FACTOR (%)</option>
                                        <option value="FIJO">NETO ($)</option>
                                    </select>
                                    <button
                                        onClick={applyBulkAction}
                                        className="px-4 py-1.5 bg-enterprise-950 text-white text-[9px] font-black uppercase tracking-widest hover:bg-brand-orange transition-all active:scale-95"
                                    >
                                        Aplicar
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Matrix Table */}
                    <div className="border border-enterprise-100 rounded-2xl overflow-hidden shadow-sm">
                        <div className="overflow-x-auto max-h-[500px] custom-scrollbar">
                            <table className="w-full text-left border-collapse">
                                <thead className="sticky top-0 z-20">
                                    <tr className="bg-enterprise-950">
                                        <th className="px-4 py-3 text-[9px] font-black text-white/50 uppercase tracking-widest border-r border-white/5">Canal / Plaza</th>
                                        <th className="px-4 py-3 text-[9px] font-black text-white/50 uppercase tracking-widest border-r border-white/5">Especificación</th>
                                        <th className="px-4 py-3 text-[9px] font-black text-white/50 uppercase tracking-widest border-r border-white/5 text-center">Costo Base</th>
                                        <th className="px-4 py-3 text-[9px] font-black text-brand-orange uppercase tracking-widest border-r border-white/5 text-center bg-white/5">Factor Ajuste</th>
                                        <th className="px-4 py-3 text-[9px] font-black text-brand-orange uppercase tracking-widest text-center bg-white/5">Precio Neto Especial</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-enterprise-50">
                                    {filteredMatrix.map((row) => (
                                        <tr key={row.productId} className={`hover:bg-enterprise-50/50 transition-all ${row.dirty ? 'bg-brand-orange/5' : ''}`}>
                                            <td className="px-4 py-2 border-r border-enterprise-50">
                                                <p className="text-[10px] font-black text-enterprise-900 leading-tight uppercase italic">{row.canal}</p>
                                                <p className="text-[8px] font-bold text-enterprise-400 uppercase tracking-tighter">{row.plaza}</p>
                                            </td>
                                            <td className="px-4 py-2 border-r border-enterprise-50">
                                                <p className="text-[10px] font-black text-enterprise-700 leading-tight uppercase">{row.tipo} <span className="text-[9px] text-enterprise-400 ml-1">{row.duracion}</span></p>
                                                <p className="text-[8px] font-bold text-enterprise-400 uppercase tracking-tighter">{row.horario}</p>
                                            </td>
                                            <td className="px-4 py-2 border-r border-enterprise-50 text-center">
                                                <span className="text-[10px] font-black text-enterprise-400">{formatMXN(row.costoBase)}</span>
                                            </td>
                                            <td className={`px-4 py-2 border-r border-enterprise-50 text-center ${row.tipoAjuste === 'FACTOR' ? 'bg-brand-orange/5' : ''}`}>
                                                <input
                                                    type="number"
                                                    value={row.factor}
                                                    onChange={(e) => handleCellChange(row.productId, 'factor', e.target.value)}
                                                    className="w-20 bg-transparent border-b border-enterprise-200 focus:border-brand-orange outline-none text-[11px] font-black text-center text-enterprise-900 transition-all py-1"
                                                    placeholder="1.00"
                                                />
                                            </td>
                                            <td className={`px-4 py-2 text-center ${row.tipoAjuste === 'FIJO' ? 'bg-brand-orange/5' : ''}`}>
                                                <input
                                                    type="number"
                                                    value={row.costoFijo}
                                                    onChange={(e) => handleCellChange(row.productId, 'costoFijo', e.target.value)}
                                                    className="w-24 bg-transparent border-b border-enterprise-200 focus:border-brand-orange outline-none text-[11px] font-black text-center text-enterprise-900 transition-all py-1 placeholder:italic"
                                                    placeholder="AUTO"
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="mt-8 flex items-center justify-between border-t border-enterprise-100 pt-6">
                        <div className="flex gap-4 items-center">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded bg-brand-orange/20 border border-brand-orange/40" />
                                <span className="text-[9px] font-black text-enterprise-400 uppercase italic">Modificado</span>
                            </div>
                            <span className="text-[10px] font-black text-enterprise-900 uppercase">
                                {matrix.filter(r => r.dirty).length} cambios pendientes
                            </span>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setClienteIdSeleccionado('')}
                                className="px-6 py-3 text-[10px] font-black text-enterprise-400 uppercase tracking-widest hover:text-enterprise-950 transition-all"
                            >
                                Cancelar Estrategia
                            </button>
                            <button
                                onClick={handleSaveMatrix}
                                disabled={loading}
                                className="px-8 py-3 bg-enterprise-950 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-brand-orange transition-all active:scale-95 shadow-xl shadow-enterprise-100 flex items-center gap-3"
                            >
                                {loading ? <RefreshCw className="animate-spin" size={14} /> : <Save size={14} />}
                                Persistir Cambios en Estrategia
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="p-20 flex flex-col items-center justify-center text-center space-y-4">
                    <div className="w-20 h-20 bg-enterprise-50 rounded-full flex items-center justify-center animate-pulse">
                        <Tag size={40} className="text-enterprise-200" />
                    </div>
                    <div className="max-w-xs">
                        <h4 className="text-sm font-black text-enterprise-950 uppercase italic leading-tight">Configuración de Estrategia Comercial</h4>
                        <p className="text-[10px] font-bold text-enterprise-400 uppercase tracking-widest mt-2">Selecciona un cliente para desplegar la matriz de ajustes de precios personalizados.</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ConditionsForm;
