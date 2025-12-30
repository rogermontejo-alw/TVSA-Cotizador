import React from 'react';

const FloatingInput = ({
    label,
    type = 'text',
    value,
    onChange,
    icon: Icon,
    required = false,
    placeholder = ' ',
    className = "",
    ...props
}) => {
    return (
        <div className={`relative group w-full ${className}`}>
            <div className="relative">
                {Icon && (
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-enterprise-400 group-focus-within:text-brand-orange transition-colors z-10">
                        <Icon size={14} />
                    </div>
                )}
                <input
                    type={type}
                    value={value}
                    onChange={onChange}
                    required={required}
                    placeholder={placeholder}
                    className={`
                        peer w-full h-11 bg-white border border-enterprise-200 rounded-xl 
                        ${Icon ? 'pl-10' : 'pl-3.5'} pr-3.5 pt-3 pb-1
                        font-black text-xs text-enterprise-950 focus:border-brand-orange focus:ring-2 
                        focus:ring-brand-orange/5 outline-none transition-all duration-300
                    `}
                    {...props}
                />
                <label className={`
                    absolute left-10 top-1/2 -translate-y-1/2 
                    ${!Icon && 'left-3.5'}
                    text-enterprise-400 text-[9px] font-black uppercase tracking-widest pointer-events-none 
                    transition-all duration-300
                    peer-focus:top-2.5 peer-focus:text-[7px] peer-focus:text-brand-orange 
                    ${value && value.toString().length > 0 ? 'top-2.5 text-[7px] text-enterprise-400' : ''}
                `}>
                    {label}
                </label>
            </div>
        </div>
    );
};

export const FloatingSelect = ({
    label,
    value,
    onChange,
    icon: Icon,
    children,
    className = "",
    ...props
}) => {
    return (
        <div className={`relative group w-full ${className}`}>
            <div className="relative">
                {Icon && (
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-enterprise-400 group-focus-within:text-brand-orange transition-colors z-10 pointer-events-none">
                        <Icon size={14} />
                    </div>
                )}
                <select
                    value={value}
                    onChange={onChange}
                    className={`
                        peer w-full h-11 bg-white border border-enterprise-200 rounded-xl 
                        ${Icon ? 'pl-10' : 'pl-3.5'} pr-8 pt-3 pb-1
                        font-black text-xs text-enterprise-950 focus:border-brand-orange focus:ring-2 
                        focus:ring-brand-orange/5 outline-none transition-all duration-300
                        appearance-none
                    `}
                    {...props}
                >
                    {children}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-enterprise-400 pointer-events-none group-focus-within:text-brand-orange transition-all">
                    <svg width="8" height="5" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </div>
                <label className={`
                    absolute left-10 top-2.5 text-[7px] font-black uppercase tracking-[0.2em] transition-all duration-300 pointer-events-none
                    ${value && value.toString().length > 0 ? 'text-enterprise-400' : 'text-enterprise-400 opacity-60'}
                    peer-focus:text-brand-orange peer-focus:opacity-100
                `}>
                    {label}
                </label>
            </div>
        </div>
    );
};

export default FloatingInput;
