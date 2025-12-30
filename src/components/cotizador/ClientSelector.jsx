import { Search, User, Briefcase, ShieldCheck, ChevronDown } from 'lucide-react';

const ClientSelector = ({ clientes = [], clienteSeleccionado, setClienteSeleccionado, compactRow }) => {
    const selectedClient = clientes.find(c => String(c.id) === String(clienteSeleccionado));

    if (compactRow) {
        return (
            <div className="bg-white rounded-2xl border border-enterprise-100 shadow-premium overflow-hidden flex flex-col h-[75px] group hover:border-brand-orange transition-all">
                <div className="bg-enterprise-950 px-4 py-1.5 flex items-center justify-between">
                    <span className="text-[7.5px] font-black text-white uppercase tracking-[0.3em] italic">Identidad Comercial</span>
                    <ShieldCheck size={10} className="text-brand-orange" />
                </div>
                <div className="px-4 flex-1 flex items-center bg-white relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-orange">
                        <User size={14} />
                    </div>
                    <select
                        value={clienteSeleccionado || ''}
                        onChange={(e) => setClienteSeleccionado(e.target.value)}
                        className="w-full bg-transparent pl-7 pr-4 py-2 text-[10px] font-black text-enterprise-950 outline-none appearance-none cursor-pointer uppercase truncate tracking-tight"
                    >
                        <option value="" disabled>SELECCIONAR CLIENTE CORPORATIVO...</option>
                        {clientes
                            .filter(c => c.estatus !== 'inactivo')
                            .sort((a, b) => a.nombre_empresa.localeCompare(b.nombre_empresa))
                            .map(c => (
                                <option key={c.id} value={c.id}>
                                    {c.nombre_empresa?.toUpperCase()}
                                </option>
                            ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-enterprise-300 pointer-events-none group-hover:text-brand-orange transition-colors">
                        <ChevronDown size={14} />
                    </div>
                </div>
            </div>
        );
    }

    // Default view
    return (
        <div className="bg-white rounded-3xl shadow-premium border border-enterprise-100 overflow-hidden animate-premium-fade h-full">
            <div className="bg-enterprise-950 px-6 py-4 flex items-center justify-between">
                <h2 className="text-white text-[10px] font-black flex items-center gap-2 uppercase tracking-tight italic">
                    <User size={14} className="text-brand-orange" />
                    Identidad Comercial
                </h2>
                <div className="bg-white/10 px-2 py-0.5 rounded-full">
                    <span className="text-[8px] font-black text-white/70 uppercase tracking-widest leading-none">Identidad Unificada</span>
                </div>
            </div>

            <div className="p-6 space-y-5">
                <div className="relative">
                    <label className="text-[8px] font-black text-brand-orange uppercase tracking-widest mb-1 block ml-1">Selección de Entidad Legal</label>
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-enterprise-600 group-focus-within:text-brand-orange" size={12} />
                        <select
                            value={clienteSeleccionado || ''}
                            onChange={(e) => setClienteSeleccionado(e.target.value)}
                            className="w-full h-10 bg-enterprise-50 border border-enterprise-100 rounded-xl pl-8 pr-4 text-[10px] font-black text-enterprise-950 focus:border-brand-orange focus:ring-0 outline-none appearance-none cursor-pointer shadow-sm"
                        >
                            <option value="" disabled>Buscar Partner o Razón Social...</option>
                            {clientes
                                .filter(c => c.estatus !== 'inactivo')
                                .sort((a, b) => a.nombre_empresa.localeCompare(b.nombre_empresa))
                                .map(c => (
                                    <option key={c.id} value={c.id}>
                                        {c.nombre_empresa?.toUpperCase()}
                                    </option>
                                ))}
                        </select>
                    </div>
                </div>

                {selectedClient && (
                    <div className="grid grid-cols-2 gap-3 animate-premium-fade">
                        <div className="p-3 bg-enterprise-50 rounded-xl border border-enterprise-100 space-y-1">
                            <div className="flex items-center gap-2 text-[8px] font-black text-enterprise-600 uppercase tracking-widest">
                                <Briefcase size={10} className="text-brand-orange" />
                                Acuerdo
                            </div>
                            <p className="text-[10px] font-black text-enterprise-950 uppercase tracking-tight truncate">
                                {selectedClient.tipo_acuerdo?.replace(/_/g, ' ') || 'PRECIO LISTA'}
                            </p>
                        </div>
                        <div className="p-3 bg-enterprise-50 rounded-xl border border-enterprise-100 space-y-1">
                            <div className="flex items-center gap-2 text-[8px] font-black text-enterprise-600 uppercase tracking-widest">
                                <ShieldCheck size={10} className="text-brand-orange" />
                                Segmento
                            </div>
                            <p className="text-[10px] font-black text-enterprise-950 uppercase tracking-tight truncate">
                                {selectedClient.segmento || 'GENERAL'}
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ClientSelector;
