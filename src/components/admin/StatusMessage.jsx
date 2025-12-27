import React from 'react';
import { RefreshCw, X, CheckCircle } from 'lucide-react';

const StatusMessage = ({ tipo, texto, setMensaje }) => {
    if (!texto) return null;

    let bgColor, textColor, borderColor, icon;

    switch (tipo) {
        case 'exito':
            bgColor = 'bg-green-50';
            borderColor = 'border-green-200';
            textColor = 'text-green-800';
            icon = <CheckCircle size={20} className="text-green-500" />;
            break;
        case 'error':
            bgColor = 'bg-red-50';
            borderColor = 'border-red-200';
            textColor = 'text-red-800';
            icon = <X size={20} className="text-red-500" />;
            break;
        case 'cargando':
            bgColor = 'bg-blue-50';
            borderColor = 'border-blue-200';
            textColor = 'text-blue-800';
            icon = <RefreshCw className="animate-spin text-blue-500" size={20} />;
            break;
        default:
            return null;
    }

    return (
        <div className={`p-4 mb-6 border rounded-xl flex items-center justify-between gap-3 shadow-sm animate-in fade-in slide-in-from-top-4 duration-300 ${bgColor} ${borderColor} ${textColor}`}>
            <div className="flex items-center gap-3">
                {icon}
                <p className="font-bold text-sm tracking-tight">{texto}</p>
            </div>
            <button
                onClick={() => setMensaje({ tipo: '', texto: '' })}
                className="text-gray-400 hover:text-gray-600 transition-colors"
            >
                <X size={16} />
            </button>
        </div>
    );
};

export default StatusMessage;
