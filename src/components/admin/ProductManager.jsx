import React, { useState } from 'react';
import {
    Search,
    Package,
    Power,
    PowerOff,
    Edit3,
    Save,
    X,
    Tv,
    Layers,
    Tag,
    AlertCircle,
    CheckCircle2,
    Activity,
    Plus,
    Copy,
    Trash2,
    CheckSquare,
    Square,
    MapPin,
    ArrowRight,
    RefreshCw,
    Wand2,
    Sparkles
} from 'lucide-react';
import { formatMXN } from '../../utils/formatters';
import ProductForm from './ProductForm';
import { APP_CONFIG } from '../../appConfig';

const ProductManager = ({
    productos = [],
    onSave,
    eliminarRegistro,
    setMensaje,
    historial = [],
    condicionesCliente = [],
    configuracion = {}
}) => {
    const [busqueda, setBusqueda] = useState('');
    const [productoEditando, setProductoEditando] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [selectedIds, setSelectedIds] = useState([]);
    const [showReplica, setShowReplica] = useState(false);
    const [replicaPlaza, setReplicaPlaza] = useState('');
    const [showConfirmAction, setShowConfirmAction] = useState(null); // { type, title, message, onConfirm, isDanger }
    const [filtroPlaza, setFiltroPlaza] = useState('TODAS');

    const openConfirm = (type, title, message, onConfirm, isDanger = false) => {
        setShowConfirmAction({ type, title, message, onConfirm, isDanger });
    };

    // Obtener plazas dinámicas del catálogo maestro
    const PLAZA_BASE_DEFAULT = 'MERIDA YUCATAN';
    const plazasOficiales = (configuracion.LISTA_PLAZAS || 'MERIDA YUCATAN,CANCUN,CAMPECHE,CHETUMAL,PLAYA DEL CARMEN,COZUMEL,CORPORATIVO')
        .split(',').map(p => p.trim()).filter(Boolean);

    const productosFiltrados = (productos || []).filter(p => {
        const matchesBusqueda =
            p.canal?.toLowerCase().includes(busqueda.toLowerCase()) ||
            p.tipo?.toLowerCase().includes(busqueda.toLowerCase()) ||
            p.plaza?.toLowerCase().includes(busqueda.toLowerCase());

        const matchesPlaza = filtroPlaza === 'TODAS' || p.plaza === filtroPlaza;

        return matchesBusqueda && matchesPlaza;
    });

    const plazasUnicas = [...new Set(productos.map(p => p.plaza))].filter(Boolean).sort();

    const toggleSelection = (id) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const selectByPlaza = (plaza) => {
        const idsPlaza = productosFiltrados.filter(p => p.plaza === plaza).map(p => p.id);
        const allAlreadySelected = idsPlaza.every(id => selectedIds.includes(id));

        if (allAlreadySelected) {
            setSelectedIds(prev => prev.filter(id => !idsPlaza.includes(id)));
        } else {
            setSelectedIds(prev => [...new Set([...prev, ...idsPlaza])]);
        }
    };

    const toggleAll = () => {
        if (selectedIds.length === productosFiltrados.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(productosFiltrados.map(p => p.id));
        }
    };

    const handleToggleActivo = async (producto) => {
        const nuevoEstatus = !producto.activo;
        const actionLabel = nuevoEstatus ? 'reactivar' : 'suspender';

        openConfirm(
            'toggle',
            'Cambio de Estatus',
            `¿Deseas ${actionLabel} la disponibilidad de "${producto.canal} - ${producto.tipo}" para nuevas cotizaciones?`,
            async () => {
                const saneado = {
                    id: producto.id,
                    canal: producto.canal,
                    plaza: producto.plaza,
                    tipo: producto.tipo,
                    duracion: producto.duracion,
                    horario: producto.horario,
                    costo_base: producto.costo_base,
                    activo: nuevoEstatus
                };
                const result = await onSave('productos', saneado);
                if (result) {
                    setMensaje({ tipo: 'exito', texto: `Inventario ${nuevoEstatus ? 'habilitado' : 'congelado'}.` });
                }
            }
        );
    };

    const handleSavePrecio = async () => {
        const saneado = {
            id: productoEditando.id,
            canal: productoEditando.canal,
            plaza: productoEditando.plaza,
            tipo: productoEditando.tipo,
            duracion: productoEditando.duracion,
            horario: productoEditando.horario,
            costo_base: parseFloat(productoEditando.costo_base),
            activo: productoEditando.activo
        };
        const result = await onSave('productos', saneado);
        if (result) {
            setMensaje({ tipo: 'exito', texto: 'Tarifa base actualizada en el motor de cálculo.' });
            setProductoEditando(null);
        }
    };

    const handleEdit = (p) => {
        setProductoEditando(p);
        setShowForm(true);
    };

    const handleReplica = async () => {
        if (!replicaPlaza.trim()) {
            setMensaje({ tipo: 'error', texto: 'Debe especificar una plaza destino.' });
            return;
        }

        openConfirm(
            'replica',
            'Confirmar Réplica',
            `¿Deseas replicar los ${selectedIds.length} productos seleccionados a la plaza "${replicaPlaza.toUpperCase()}"?`,
            async () => {
                setMensaje({ tipo: 'cargando', texto: 'Analizando integridad y replicando productos...' });
                try {
                    const itemsToReplica = productos.filter(p => selectedIds.includes(p.id));
                    const news = [];
                    let omitidos = 0;

                    for (const p of itemsToReplica) {
                        // Buscar si ya existe un producto idéntico en la plaza destino
                        const existe = productos.find(existente =>
                            existente.plaza === replicaPlaza &&
                            existente.canal === p.canal &&
                            existente.tipo === p.tipo &&
                            existente.duracion === p.duracion &&
                            existente.horario === p.horario
                        );

                        if (existe) {
                            omitidos++;
                        } else {
                            // Saneamiento estricto: solo columnas reales de la DB
                            news.push({
                                canal: p.canal,
                                plaza: replicaPlaza.toUpperCase(),
                                tipo: p.tipo,
                                duracion: p.duracion,
                                horario: p.horario,
                                costo_base: parseFloat(p.costo_base) || 0,
                                activo: true
                            });
                        }
                    }

                    if (news.length > 0) {
                        const result = await onSave('productos', news);
                        if (!result) throw new Error("Error al persistir réplicas");
                    }

                    let mensajeExito = `Operación finalizada. `;
                    if (news.length > 0) mensajeExito += `${news.length} productos nuevos en ${replicaPlaza}. `;
                    if (omitidos > 0) mensajeExito += `${omitidos} ya existían y fueron protegidos contra duplicidad.`;

                    setMensaje({
                        tipo: news.length > 0 ? 'exito' : 'info',
                        texto: mensajeExito
                    });

                    setShowReplica(false);
                    setReplicaPlaza('');
                    setSelectedIds([]);
                } catch (err) {
                    setMensaje({ tipo: 'error', texto: 'Fallo crítico en el proceso de réplica.' });
                }
            }
        );
    };

    const checkMovement = (id) => {
        // Verificar en historial (dentro del JSONB de cada cotizacion)
        const hasHistorial = historial.some(h => {
            const items = h.json_detalles?.items || h.items || [];
            return items.some(item => (item.producto?.id === id) || (item.id === id));
        });

        // Verificar en condiciones especiales
        const hasCondiciones = condicionesCliente.some(c => c.producto_id === id);

        return hasHistorial || hasCondiciones;
    };

    const handleBulkDelete = async () => {
        const itemsToDelete = productos.filter(p => selectedIds.includes(p.id));
        const withMovement = itemsToDelete.filter(p => checkMovement(p.id));
        const withoutMovement = itemsToDelete.filter(p => !checkMovement(p.id));

        let message = `Vas a procesar ${itemsToDelete.length} activos del inventario.`;
        let details = [];

        if (withMovement.length > 0) {
            details.push(`${withMovement.length} tienen historial y serán SUSPENDIDOS para preservar reportes.`);
        }
        if (withoutMovement.length > 0) {
            details.push(`${withoutMovement.length} no tienen historial y se ELIMINARÁN permanentemente.`);
        }

        openConfirm(
            'bulk',
            'Procesar Baja Masiva',
            message + "\n\n" + details.join("\n"),
            async () => {
                setMensaje({ tipo: 'cargando', texto: 'Procesando baja masiva...' });
                try {
                    if (withMovement.length > 0) {
                        for (const product of withMovement) {
                            const saneado = {
                                id: product.id,
                                canal: product.canal,
                                plaza: product.plaza,
                                tipo: product.tipo,
                                duracion: product.duracion,
                                horario: product.horario,
                                costo_base: product.costo_base,
                                activo: false
                            };
                            await onSave('productos', saneado);
                        }
                    }
                    if (withoutMovement.length > 0) {
                        for (const p of withoutMovement) {
                            await eliminarRegistro('productos', 'id', p.id);
                        }
                    }
                    setMensaje({ tipo: 'exito', texto: 'Operación masiva completada.' });
                    setSelectedIds([]);
                } catch (err) {
                    setMensaje({ tipo: 'error', texto: 'Error en procesamiento masivo.' });
                }
            },
            true
        );
    };

    const handleNormalizeMerida = async () => {
        const meridaProducts = productos.filter(p => p.plaza === 'MERIDA YUCATAN' || p.plaza === 'TODAS');
        const updates = [];

        meridaProducts.forEach(p => {
            // Intentar detectar patrón "TIPO DURACION" (ej: "SPOT 20S" o "SPOT 20\"")
            const match = p.tipo?.match(/^(.+?)\s+(\d+["Ss])$/);
            if (match) {
                updates.push({
                    id: p.id,
                    canal: p.canal,
                    plaza: p.plaza,
                    tipo: match[1].trim().toUpperCase(),
                    duracion: match[2].trim().toUpperCase(),
                    horario: p.horario,
                    costo_base: p.costo_base,
                    activo: p.activo
                });
            }
        });

        if (updates.length === 0) {
            setMensaje({ tipo: 'info', texto: 'No se detectaron registros mezclados en Mérida.' });
            return;
        }

        openConfirm(
            'normalize',
            'Normalización Automática',
            `Se detectaron ${updates.length} activos con datos mezclados. El sistema separará automáticamente el Tipo del Tiempo (ej: "SPOT 20S" → "SPOT" | "20S").\n\n¿Deseas proceder con la limpieza masiva?`,
            async () => {
                setMensaje({ tipo: 'cargando', texto: 'Normalizando catálogo maestro...' });
                try {
                    const result = await onSave('productos', updates);
                    if (result) {
                        setMensaje({ tipo: 'exito', texto: `Mérida ha sido normalizada: ${updates.length} registros corregidos.` });
                    }
                } catch (err) {
                    setMensaje({ tipo: 'error', texto: 'Fallo al normalizar datos.' });
                }
            }
        );
    };

    const handleDelete = async (p) => {
        const movement = checkMovement(p.id);

        if (movement) {
            openConfirm(
                'suspend',
                'Restricción de Integridad',
                `Este producto tiene historial transaccional. Por seguridad, no se puede eliminar físicamente.\n\n¿Deseas SUSPENDERLO para que no aparezca en nuevas cotizaciones?`,
                async () => {
                    const saneado = {
                        id: p.id,
                        canal: p.canal,
                        plaza: p.plaza,
                        tipo: p.tipo,
                        duracion: p.duracion,
                        horario: p.horario,
                        costo_base: p.costo_base,
                        activo: false
                    };
                    await onSave('productos', saneado);
                    setMensaje({ tipo: 'exito', texto: 'Producto suspendido correctamente.' });
                }
            );
        } else {
            openConfirm(
                'delete',
                'Confirmación de Eliminación',
                `¿Deseas eliminar permanentemente "${p.canal} - ${p.tipo}"? Esta acción no se puede deshacer.`,
                async () => {
                    const result = await eliminarRegistro('productos', 'id', p.id);
                    if (result) {
                        setMensaje({ tipo: 'exito', texto: 'Producto eliminado del catálogo.' });
                    }
                },
                true
            );
        }
    };

    return (
        <div className="space-y-6 animate-premium-fade px-4 md:px-0">
            {/* Header / Engine Controls */}
            <div className="bg-enterprise-950 border border-white/10 rounded-[2rem] p-4 md:p-6 shadow-2xl relative overflow-hidden group mb-8">
                <div className="absolute top-0 right-0 w-96 h-full bg-gradient-to-l from-brand-orange/10 via-transparent to-transparent pointer-events-none" />
                <div className="absolute -left-10 -top-10 w-48 h-48 bg-brand-orange/5 blur-3xl rounded-full" />

                <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                    <div className="flex items-center gap-4 md:gap-5 w-full lg:w-auto">
                        <div className="w-12 h-12 md:w-14 md:h-14 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-brand-orange shadow-inner group-hover:scale-105 transition-transform duration-500 flex-shrink-0">
                            <Layers size={24} className="md:w-7 md:h-7" strokeWidth={2.5} />
                        </div>
                        <div className="min-w-0">
                            <h2 className="text-lg md:text-2xl font-black text-white tracking-tighter uppercase italic italic-brand leading-none flex flex-wrap items-center gap-2 md:gap-3">
                                <span className="whitespace-nowrap italic italic-brand capitalize">Catálogo de</span>
                                <span className="text-brand-orange whitespace-nowrap italic italic-brand capitalize">Activos</span>
                            </h2>
                            <p className="text-[7.5px] md:text-[10px] font-black text-white/40 uppercase tracking-[0.2em] md:tracking-[0.3em] flex items-center gap-2 mt-1.5 md:mt-2">
                                <Activity size={12} className="text-brand-orange" />
                                Motor de Tarifas de Inventario
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row items-center gap-4 w-full lg:w-auto">
                        <div className="relative flex-1 w-full md:w-64 group">
                            <input
                                type="text"
                                placeholder="Buscar medio o región..."
                                value={busqueda}
                                onChange={(e) => setBusqueda(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-[9px] md:text-[10px] font-black text-white uppercase tracking-widest outline-none focus:bg-white/10 focus:border-brand-orange transition-all placeholder:text-white/20"
                            />
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-brand-orange transition-colors" size={14} />
                        </div>

                        <div className="flex bg-enterprise-950 rounded-xl p-1 w-full md:w-fit shadow-xl border border-white/5 overflow-x-auto no-scrollbar">
                            <button
                                onClick={() => setFiltroPlaza('TODAS')}
                                className={`flex-1 md:flex-none px-4 md:px-5 py-2 rounded-lg text-[8px] md:text-[9px] font-black uppercase tracking-[0.1em] whitespace-nowrap transition-all duration-300
                                    ${filtroPlaza === 'TODAS'
                                        ? 'bg-brand-orange text-white shadow-lg'
                                        : 'text-white/30 hover:text-white'}`}
                            >
                                Todas
                            </button>
                            {plazasUnicas.slice(0, 2).map(p => (
                                <button
                                    key={p}
                                    onClick={() => setFiltroPlaza(p)}
                                    className={`flex-1 md:flex-none px-4 md:px-5 py-2 rounded-lg text-[8px] md:text-[9px] font-black uppercase tracking-[0.1em] whitespace-nowrap transition-all duration-300
                                        ${filtroPlaza === p
                                            ? 'bg-brand-orange text-white shadow-lg'
                                            : 'text-white/30 hover:text-white'}`}
                                >
                                    {p}
                                </button>
                            ))}
                            {plazasUnicas.length > 2 && (
                                <select
                                    value={plazasUnicas.includes(filtroPlaza) && plazasUnicas.indexOf(filtroPlaza) >= 2 ? filtroPlaza : ''}
                                    onChange={(e) => setFiltroPlaza(e.target.value)}
                                    className="bg-transparent text-white/30 text-[8px] md:text-[9px] font-black uppercase tracking-widest px-2 outline-none cursor-pointer hover:text-white"
                                >
                                    <option value="" disabled>Más...</option>
                                    {plazasUnicas.slice(2).map(p => (
                                        <option key={p} value={p} className="bg-enterprise-950 text-white">{p}</option>
                                    ))}
                                </select>
                            )}
                        </div>

                        <div className="flex items-center gap-2 w-full md:w-auto">
                            <button
                                onClick={() => { setProductoEditando(null); setShowForm(true); }}
                                className="flex-1 md:flex-none h-11 px-6 bg-brand-orange text-white rounded-xl font-black uppercase tracking-widest text-[9px] flex items-center justify-center gap-3 hover:bg-brand-orange/90 transition-all shadow-xl active:scale-95"
                            >
                                <Plus size={16} /> Activo
                            </button>

                            <button
                                onClick={handleNormalizeMerida}
                                className="h-11 w-11 bg-white/5 border border-white/10 text-brand-orange rounded-xl flex items-center justify-center hover:bg-white/10 transition-all shadow-lg group relative flex-shrink-0"
                                title="Normalizar Mérida"
                            >
                                <Wand2 size={16} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Selección Rápida por Plaza */}
            <div className="flex flex-wrap items-center gap-2 md:gap-3 bg-white p-4 rounded-2xl md:rounded-3xl border border-enterprise-100 shadow-premium overflow-x-auto no-scrollbar">
                <span className="text-[7px] md:text-[9px] font-black text-enterprise-400 uppercase tracking-widest mr-2 whitespace-nowrap">Rápida:</span>
                <div className="flex flex-wrap gap-2">
                    {plazasUnicas.map(plaza => {
                        const idsThisPlaza = productosFiltrados.filter(p => p.plaza === plaza).map(p => p.id);
                        const isSelected = idsThisPlaza.length > 0 && idsThisPlaza.every(id => selectedIds.includes(id));

                        return (
                            <button
                                key={plaza}
                                onClick={() => selectByPlaza(plaza)}
                                className={`px-3 md:px-4 py-1.5 md:py-2 rounded-lg md:rounded-xl text-[7px] md:text-[9px] font-black uppercase tracking-widest transition-all border whitespace-nowrap ${isSelected
                                    ? 'bg-brand-orange text-white border-brand-orange shadow-lg'
                                    : 'bg-enterprise-50 text-enterprise-400 border-enterprise-100 hover:border-brand-orange hover:text-brand-orange shadow-sm'
                                    }`}
                            >
                                <MapPin size={9} className="inline mr-1 md:mr-2" /> {plaza}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Acciones Masivas */}
            {selectedIds.length > 0 && (
                <div className="bg-brand-orange p-4 rounded-2xl flex items-center justify-between text-white shadow-xl shadow-brand-orange/20 animate-in slide-in-from-top-4">
                    <div className="flex items-center gap-4 px-4">
                        <CheckSquare size={20} />
                        <span className="text-[11px] font-black uppercase tracking-widest">
                            {selectedIds.length} Activos seleccionados
                        </span>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setShowReplica(true)}
                            className="px-6 py-2 bg-white text-brand-orange rounded-xl font-black uppercase tracking-widest text-[9px] flex items-center gap-2 hover:bg-enterprise-950 hover:text-white transition-all shadow-lg"
                        >
                            <Copy size={14} /> Replicar
                        </button>
                        <button
                            onClick={handleBulkDelete}
                            className="px-6 py-2 bg-brand-magenta text-white rounded-xl font-black uppercase tracking-widest text-[9px] flex items-center gap-2 hover:bg-enterprise-950 transition-all shadow-lg"
                        >
                            <Trash2 size={14} /> Eliminar
                        </button>
                        <button
                            onClick={() => setSelectedIds([])}
                            className="p-2 hover:bg-brand-magenta rounded-xl transition-all"
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-[2.5rem] shadow-xl border border-enterprise-100 overflow-hidden relative">
                {/* Desktop view */}
                <div className="hidden lg:block overflow-x-auto custom-scrollbar">
                    <table className="enterprise-table w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-enterprise-950 text-white font-black uppercase text-[9px] tracking-[0.2em]">
                                <th className="px-6 py-6 w-14 text-center sticky left-0 bg-enterprise-950 z-10">
                                    <button onClick={toggleAll} className="p-1 hover:text-brand-orange transition-colors">
                                        {selectedIds.length === productosFiltrados.length ? <CheckSquare size={16} /> : <Square size={16} />}
                                    </button>
                                </th>
                                <th className="px-6 py-6 opacity-80 w-28 text-center">Estado</th>
                                <th className="px-8 py-6 opacity-80 min-w-[180px]">Canal</th>
                                <th className="px-4 py-6 opacity-80 w-20">Tipo</th>
                                <th className="px-4 py-6 opacity-80 w-24 text-center">Tiempo</th>
                                <th className="px-6 py-6 opacity-80 w-36">Horario</th>
                                <th className="px-8 py-6 opacity-80 w-44 text-center">Región</th>
                                <th className="px-8 py-6 text-right opacity-80 min-w-[140px]">Tarifa Base</th>
                                <th className="px-8 py-6 text-center opacity-80 w-32 sticky right-0 bg-enterprise-950 z-10">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-enterprise-50">
                            {productosFiltrados.length > 0 ? productosFiltrados.map((p) => (
                                <tr key={p.id} className={`group hover:bg-enterprise-50/50 transition-all ${!p.activo ? 'bg-enterprise-50/30' : ''} ${selectedIds.includes(p.id) ? 'bg-brand-orange/5' : ''}`}>
                                    <td className="px-6 py-6 text-center sticky left-0 bg-white group-hover:bg-enterprise-50 transition-colors z-10 border-r border-enterprise-50/50">
                                        <button
                                            onClick={() => toggleSelection(p.id)}
                                            className={`transition-colors ${selectedIds.includes(p.id) ? 'text-brand-orange' : 'text-enterprise-200 group-hover:text-enterprise-400'}`}
                                        >
                                            {selectedIds.includes(p.id) ? <CheckSquare size={16} /> : <Square size={16} />}
                                        </button>
                                    </td>
                                    <td className="px-6 py-6 text-center">
                                        <button
                                            onClick={() => handleToggleActivo(p)}
                                            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shadow-sm ${p.activo
                                                ? 'bg-emerald-50 text-emerald-600 border border-emerald-500/20 hover:bg-brand-orange hover:text-white hover:border-brand-orange'
                                                : 'bg-enterprise-50 text-enterprise-400 border border-enterprise-200 hover:bg-emerald-500 hover:text-white hover:border-emerald-500'
                                                }`}
                                        >
                                            {p.activo ? <><CheckCircle2 size={12} /> Activo</> : <><PowerOff size={12} /> Pausa</>}
                                        </button>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-3 min-w-[150px]">
                                            <div className="w-8 h-8 bg-enterprise-950 rounded-lg flex items-center justify-center text-white shadow-sm flex-shrink-0">
                                                <Tv size={14} className="text-brand-orange" />
                                            </div>
                                            <span className="text-[11px] font-black text-enterprise-950 uppercase truncate">{p.canal}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-6">
                                        <span className="px-3 py-1 bg-enterprise-100 text-[9px] font-black text-enterprise-700 rounded-lg uppercase tracking-wider border border-enterprise-200/50 whitespace-nowrap">
                                            {p.tipo || '---'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-6 text-center font-bold text-[11px] text-enterprise-900">
                                        {p.duracion || '--'}
                                    </td>
                                    <td className="px-6 py-6">
                                        <span className="text-[10px] font-black text-brand-orange uppercase tracking-widest whitespace-nowrap">{p.horario || '---'}</span>
                                    </td>
                                    <td className="px-8 py-6 text-center">
                                        <div className="flex items-center justify-center gap-2 whitespace-nowrap">
                                            <MapPin size={10} className="text-enterprise-300" />
                                            <span className="text-[9px] font-black text-enterprise-500 uppercase tracking-widest">{p.plaza}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <span className="text-sm font-black text-enterprise-950 tabular-nums whitespace-nowrap">
                                            {formatMXN(p.costo_base)}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6 sticky right-0 bg-white group-hover:bg-enterprise-50 transition-colors z-10 border-l border-enterprise-50/50">
                                        <div className="flex items-center justify-center gap-3">
                                            <button
                                                onClick={() => handleEdit(p)}
                                                className="w-10 h-10 flex items-center justify-center bg-enterprise-50 text-enterprise-400 hover:bg-enterprise-950 hover:text-white rounded-xl transition-all border border-enterprise-100 hover:border-enterprise-950 shadow-sm"
                                            >
                                                <Edit3 size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(p)}
                                                className="w-10 h-10 flex items-center justify-center bg-enterprise-50 text-enterprise-300 hover:bg-brand-magenta hover:text-white rounded-xl transition-all border border-enterprise-100 hover:border-brand-magenta shadow-sm"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="9" className="py-24 text-center">
                                        <AlertCircle size={40} className="mx-auto text-enterprise-200 mb-4" />
                                        <p className="text-xs font-black text-enterprise-300 uppercase tracking-widest italic">
                                            No se han detectado activos bajo estos parámetros.
                                        </p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Mobile view */}
                <div className="lg:hidden divide-y divide-enterprise-50">
                    {productosFiltrados.length > 0 ? productosFiltrados.map((p) => (
                        <div key={p.id} className={`p-5 space-y-4 ${!p.activo ? 'bg-enterprise-50/30 grayscale opacity-60' : ''} ${selectedIds.includes(p.id) ? 'bg-brand-orange/5' : ''}`}>
                            <div className="flex justify-between items-start gap-4">
                                <div className="flex items-center gap-3 min-w-0">
                                    <button onClick={() => toggleSelection(p.id)} className={`flex-shrink-0 ${selectedIds.includes(p.id) ? 'text-brand-orange' : 'text-enterprise-200'}`}>
                                        {selectedIds.includes(p.id) ? <CheckSquare size={18} /> : <Square size={18} />}
                                    </button>
                                    <div className="w-10 h-10 bg-enterprise-950 rounded-xl flex items-center justify-center text-white shadow-lg flex-shrink-0">
                                        <Tv size={18} className="text-brand-orange" />
                                    </div>
                                    <div className="min-w-0">
                                        <h4 className="text-[11px] font-black text-enterprise-950 uppercase truncate">{p.canal}</h4>
                                        <p className="text-[8px] font-bold text-enterprise-500 uppercase tracking-widest mt-0.5">{p.tipo} • {p.plaza}</p>
                                    </div>
                                </div>
                                <div className="flex gap-1.5 flex-shrink-0">
                                    <button onClick={() => handleEdit(p)} className="w-9 h-9 flex items-center justify-center bg-enterprise-50 text-enterprise-400 hover:bg-enterprise-950 hover:text-white rounded-lg transition-all border border-enterprise-100"><Edit3 size={14} /></button>
                                    <button onClick={() => handleDelete(p)} className="w-9 h-9 flex items-center justify-center bg-enterprise-50 text-enterprise-300 hover:bg-brand-magenta hover:text-white rounded-lg transition-all border border-enterprise-100"><Trash2 size={14} /></button>
                                </div>
                            </div>

                            <div className="flex items-center justify-between bg-enterprise-50/50 p-3 rounded-xl border border-enterprise-100/50">
                                <div className="flex flex-col gap-1.5 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[9px] font-black text-enterprise-950 truncate">{p.duracion}</span>
                                        <span className="text-enterprise-300">|</span>
                                        <span className="text-[8px] font-bold text-brand-orange uppercase truncate">{p.horario}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <div className={`w-1.5 h-1.5 rounded-full ${p.activo ? 'bg-emerald-500' : 'bg-enterprise-300'}`} />
                                        <span className="text-[7.5px] font-black text-enterprise-400 uppercase tracking-widest">{p.activo ? 'Activo' : 'En Pausa'}</span>
                                    </div>
                                </div>
                                <div className="text-right flex-shrink-0">
                                    <span className="text-sm font-black text-enterprise-950 tabular-nums tracking-tighter">
                                        {formatMXN(p.costo_base, 0)}
                                    </span>
                                    <p className="text-[7.5px] font-black text-enterprise-300 uppercase italic tracking-widest mt-0.5">Base</p>
                                </div>
                            </div>
                        </div>
                    )) : (
                        <div className="py-20 text-center">
                            <AlertCircle size={32} className="mx-auto text-enterprise-100 mb-4" />
                            <p className="text-[10px] font-black text-enterprise-300 uppercase tracking-widest italic tracking-[0.3em]">No se hallaron activos</p>
                        </div>
                    )}
                </div>

                {/* Performance Insight Footer */}
                <div className="bg-enterprise-50 px-8 py-6 border-t border-enterprise-100 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-enterprise-950 shadow-lg">
                            <Activity size={16} className="text-brand-orange" />
                        </div>
                        <p className="text-[10px] font-black text-enterprise-400 uppercase tracking-[0.2em]">
                            <span className="text-enterprise-700">{productos.filter(p => p.activo).length}</span> Activos disponibles en el motor de cálculo nacional
                        </p>
                    </div>
                </div>
            </div>

            {/* Modal de Formulario (Alta/Edición) */}
            {showForm && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 md:px-8 py-10 bg-enterprise-950/60 backdrop-blur-md overflow-y-auto">
                    <div className="w-full max-w-4xl my-auto">
                        <ProductForm
                            productoEdicion={productoEditando}
                            onCancel={() => { setShowForm(false); setProductoEditando(null); }}
                            plazasOficiales={plazasOficiales}
                            onSave={async (tabla, payload) => {
                                const result = await onSave(tabla, payload);
                                if (result) {
                                    setShowForm(false);
                                    setProductoEditando(null);
                                    setMensaje({ tipo: 'exito', texto: 'Producto actualizado en el master ledger.' });
                                }
                                return result;
                            }}
                        />
                    </div>
                </div>
            )}

            {/* Modal de Réplica */}
            {showReplica && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center px-4 bg-enterprise-950/80 backdrop-blur-xl animate-premium-fade">
                    <div className="bg-white w-full max-w-md rounded-[3.5rem] p-10 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-2 bg-brand-orange"></div>
                        <div className="flex flex-col items-center text-center">
                            <div className="w-20 h-20 bg-brand-orange/10 text-brand-orange rounded-3xl flex items-center justify-center mb-6">
                                <Copy size={40} />
                            </div>
                            <h3 className="text-xl font-black text-enterprise-950 uppercase italic italic-brand tracking-tighter mb-2">Clonación de Inventario</h3>
                            <p className="text-[10px] font-bold text-enterprise-400 uppercase tracking-widest mb-8 max-w-[250px]">
                                Vas a replicar {selectedIds.length} activos seleccionados hacia una nueva región operativa.
                            </p>

                            <div className="w-full space-y-4 mb-8">
                                <label className="flex items-center gap-2 text-[9px] font-black text-enterprise-400 uppercase tracking-widest ml-1">
                                    <MapPin size={12} className="text-brand-orange" /> Plaza Destino
                                </label>
                                <select
                                    required
                                    value={replicaPlaza}
                                    onChange={(e) => setReplicaPlaza(e.target.value)}
                                    className="premium-input h-14 bg-enterprise-50 border-none font-black uppercase text-center focus:ring-2 focus:ring-brand-orange/20 appearance-none"
                                >
                                    <option value="" disabled>Seleccionar Plaza...</option>
                                    {plazasOficiales.map(p => (
                                        <option key={p} value={p}>{p}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex flex-col w-full gap-3">
                                <button
                                    onClick={handleReplica}
                                    className="h-14 bg-enterprise-950 text-white font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-brand-orange transition-all shadow-xl active:scale-95 text-[10px] flex items-center justify-center gap-3"
                                >
                                    Ejecutar Réplica <ArrowRight size={16} />
                                </button>
                                <button
                                    onClick={() => setShowReplica(false)}
                                    className="h-14 bg-enterprise-50 text-enterprise-400 font-black uppercase tracking-widest rounded-2xl hover:bg-enterprise-100 transition-all text-[9px]"
                                >
                                    Abortar Operación
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Confirmación Premium */}
            {showConfirmAction && (
                <div className="fixed inset-0 z-[300] flex items-center justify-center px-4 bg-enterprise-950/80 backdrop-blur-md animate-premium-fade">
                    <div className="bg-white w-full max-w-sm rounded-[3.5rem] p-10 text-center shadow-2xl relative overflow-hidden">
                        <div className={`absolute top-0 left-0 w-full h-2 ${showConfirmAction.isDanger ? 'bg-brand-magenta' : 'bg-brand-orange'}`}></div>

                        <div className={`w-20 h-20 mx-auto mb-6 rounded-3xl flex items-center justify-center shadow-inner border
                            ${showConfirmAction.isDanger
                                ? 'bg-brand-magenta/5 text-brand-magenta border-brand-magenta/10'
                                : 'bg-brand-orange/5 text-brand-orange border-brand-orange/10'}`}>
                            {showConfirmAction.isDanger ? <Trash2 size={32} /> : <RefreshCw size={32} />}
                        </div>

                        <h3 className="text-xl font-black text-enterprise-950 uppercase italic italic-brand tracking-tighter mb-4">
                            {showConfirmAction.title}
                        </h3>

                        <p className="text-[10px] font-bold text-enterprise-400 uppercase tracking-widest leading-relaxed mb-10 whitespace-pre-line">
                            {showConfirmAction.message}
                        </p>

                        <div className="flex flex-col gap-3">
                            <button
                                onClick={async () => {
                                    const action = showConfirmAction.onConfirm;
                                    setShowConfirmAction(null);
                                    await action();
                                }}
                                className={`h-14 w-full rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] text-white shadow-xl transition-all active:scale-95 
                                    ${showConfirmAction.isDanger ? 'bg-brand-magenta hover:bg-enterprise-950' : 'bg-brand-orange hover:bg-brand-magenta'}`}
                            >
                                Aceptar
                            </button>
                            <button
                                onClick={() => setShowConfirmAction(null)}
                                className="h-14 w-full rounded-2xl font-black uppercase tracking-widest text-[10px] text-enterprise-400 bg-enterprise-50 hover:bg-enterprise-100 transition-all"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProductManager;
