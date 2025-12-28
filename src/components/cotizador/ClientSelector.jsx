import { Search, User, Briefcase, ShieldCheck, AlertCircle } from 'lucide-react';
import { FloatingSelect } from '../ui/FloatingInput';

const ClientSelector = ({ clientes = [], clienteSeleccionado, setClienteSeleccionado }) => {
    const selectedClient = clientes.find(c => String(c.id) === String(clienteSeleccionado));

    return (
        <div className="bg-white rounded-[2rem] shadow-premium border border-enterprise-100 overflow-hidden animate-premium-fade">
            <div className="bg-enterprise-950 px-6 sm:px-8 py-4 sm:py-5 flex items-center justify-between">
                <h2 className="text-white text-sm sm:text-base font-black flex items-center gap-3 uppercase tracking-tight">
                    <User size={18} className="text-brand-orange" />
                    Commercial Identity
                </h2>
                <div className="bg-white/10 px-3 py-1 rounded-full">
                    <span className="text-[9px] font-black text-white/50 uppercase tracking-widest leading-none">Unified Identity</span>
                </div>
            </div>

            <div className="p-8 space-y-6">
                <FloatingSelect
                    label="Selección de Entidad Legal"
                    value={clienteSeleccionado || ''}
                    onChange={(e) => setClienteSeleccionado(e.target.value)}
                    icon={Search}
                >
                    <option value="" disabled>Buscar Partner o Razón Social...</option>
                    {clientes.sort((a, b) => a.nombre_empresa.localeCompare(b.nombre_empresa)).map(c => (
                        <option key={c.id} value={c.id}>
                            {c.nombre_empresa?.toUpperCase()} {c.segmento ? `[${c.segmento}]` : ''}
                        </option>
                    ))}
                </FloatingSelect>

                {selectedClient && (
                    <div className="grid grid-cols-2 gap-4 animate-premium-fade">
                        <div className="p-5 bg-enterprise-50 rounded-2xl border border-enterprise-100 space-y-2 transition-all hover:border-brand-orange/20">
                            <div className="flex items-center gap-2 text-[10px] font-black text-enterprise-400 uppercase tracking-widest">
                                <Briefcase size={14} className="text-brand-orange" />
                                Agreement Level
                            </div>
                            <p className="text-sm font-black text-enterprise-900 uppercase tracking-tight">
                                {selectedClient.tipo_acuerdo?.replace(/_/g, ' ') || 'LIST PRICE'}
                            </p>
                        </div>
                        <div className="p-5 bg-enterprise-50 rounded-2xl border border-enterprise-100 space-y-2 transition-all hover:border-brand-orange/20">
                            <div className="flex items-center gap-2 text-[10px] font-black text-enterprise-400 uppercase tracking-widest">
                                <ShieldCheck size={14} className="text-brand-orange" />
                                Segmentation
                            </div>
                            <p className="text-sm font-black text-enterprise-900 uppercase tracking-tight">
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
