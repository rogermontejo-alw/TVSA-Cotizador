import React, { useMemo } from 'react';
import { Calendar, DollarSign, MapPin, TrendingUp, Trash2 } from 'lucide-react';
import { formatMXN } from '../../utils/formatters';

const ParametersPanel = ({
    productos,
    plazaSeleccionada,
    setPlazaSeleccionada,
    presupuesto,
    setPresupuesto,
    duracionDias,
    setDuracionDias,
    paqueteVIX,
    setPaqueteVIX,
    paquetesVIX,
    sugerirDistribucion,
    clienteSeleccionado
}) => {

    const plazasDisponibles = useMemo(() => {
        const plazas = productos.map(p => p.plaza).filter(Boolean);
        return [...new Set(plazas)].sort();
    }, [productos]);

    const vixSeleccionado = paquetesVIX.find(p => p.id === paqueteVIX);

    return (
        <div className="bg-white rounded-lg shadow-lg p-6 border-t-4 border-red-700 space-y-5">
            <h2 className="text-xl font-bold text-gray-800 mb-2 flex items-center">
                <DollarSign className="mr-2 text-red-700" size={22} />
                Parámetros de Campaña
            </h2>

            {/* Selector de Plaza */}
            <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Seleccionar Plaza
                </label>
                <div className="relative">
                    <select
                        value={plazaSeleccionada}
                        onChange={(e) => setPlazaSeleccionada(e.target.value)}
                        className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 appearance-none bg-white font-medium text-gray-700"
                    >
                        <option value="">Todas las Plazas</option>
                        {plazasDisponibles.map(plaza => (
                            <option key={plaza} value={plaza}>{plaza}</option>
                        ))}
                    </select>
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                        <MapPin size={18} />
                    </div>
                </div>
            </div>

            {/* Presupuesto */}
            <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Presupuesto (SIN IVA)
                </label>
                <div className="relative">
                    <input
                        type="number"
                        inputMode="decimal"
                        value={presupuesto}
                        onChange={(e) => setPresupuesto(e.target.value)}
                        onFocus={(e) => e.target.select()}
                        placeholder="Ej: 50000"
                        className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 font-bold text-gray-800"
                    />
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none font-bold">
                        $
                    </div>
                </div>
            </div>

            {/* Duración */}
            <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Duración (días)
                </label>
                <div className="relative">
                    <input
                        type="number"
                        inputMode="numeric"
                        value={duracionDias}
                        onChange={(e) => setDuracionDias(e.target.value)}
                        onFocus={(e) => e.target.select()}
                        className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 font-bold text-gray-800"
                    />
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                        <Calendar size={18} />
                    </div>
                </div>
            </div>

            {/* Paquete VIX */}
            <div className="space-y-1.5 pt-2 border-t border-gray-100">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Paquete VIX (Opcional)
                </label>
                <div className="flex gap-2">
                    <select
                        value={paqueteVIX}
                        onChange={(e) => setPaqueteVIX(e.target.value)}
                        className="flex-grow p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 bg-white font-medium text-gray-700"
                    >
                        <option value="">Sin paquete VIX</option>
                        {paquetesVIX.map(p => (
                            <option key={p.id} value={p.id}>
                                {p.nombre} - {formatMXN(p.inversion)}
                            </option>
                        ))}
                    </select>
                    {paqueteVIX && (
                        <button
                            onClick={() => setPaqueteVIX('')}
                            className="bg-red-50 text-red-600 p-3 rounded-lg hover:bg-red-100 transition-colors"
                            title="Quitar Paquete VIX"
                        >
                            <Trash2 size={18} />
                        </button>
                    )}
                </div>
                {vixSeleccionado && (
                    <div className="p-3 bg-red-50 rounded-lg border border-red-100 animate-in fade-in duration-300">
                        <p className="text-xs font-bold text-red-800">
                            {vixSeleccionado.impresiones.toLocaleString()} impresiones | {vixSeleccionado.dias} días
                        </p>
                    </div>
                )}
            </div>

            {/* Botón Sugerir */}
            <button
                onClick={sugerirDistribucion}
                disabled={!clienteSeleccionado || !presupuesto}
                className="w-full mt-2 bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700 transition-all flex items-center justify-center shadow-md disabled:bg-gray-300 disabled:shadow-none"
            >
                <TrendingUp className="mr-2" size={18} />
                Sugerir Distribución
            </button>
        </div>
    );
};

export default ParametersPanel;
