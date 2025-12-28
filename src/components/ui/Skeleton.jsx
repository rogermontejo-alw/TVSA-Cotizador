import React from 'react';

const Skeleton = ({ className }) => {
    return (
        <div className={`skeleton rounded-xl ${className}`}></div>
    );
};

export const DashboardSkeleton = () => (
    <div className="space-y-10 animate-pulse">
        <div className="flex justify-between items-center border-b border-enterprise-200 pb-10">
            <div className="space-y-3">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-10 w-64" />
                <Skeleton className="h-4 w-96" />
            </div>
            <div className="flex gap-4">
                <Skeleton className="h-12 w-48" />
                <Skeleton className="h-12 w-12" />
            </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
                <Skeleton key={i} className="h-32 w-full rounded-[2rem]" />
            ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <Skeleton className="lg:col-span-8 h-80 rounded-[3rem]" />
            <div className="lg:col-span-4 space-y-4">
                <Skeleton className="h-40 rounded-[2.5rem]" />
                <div className="grid grid-cols-2 gap-4">
                    <Skeleton className="h-32 rounded-[2rem]" />
                    <Skeleton className="h-32 rounded-[2rem]" />
                </div>
            </div>
        </div>
    </div>
);

export const CotizadorSkeleton = () => (
    <div className="space-y-10 animate-pulse">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <div className="lg:col-span-4 space-y-8">
                <Skeleton className="h-24 rounded-[2rem]" />
                <Skeleton className="h-80 rounded-[2.5rem]" />
            </div>
            <div className="lg:col-span-8">
                <Skeleton className="h-[600px] rounded-[3rem]" />
            </div>
        </div>
        <div className="grid grid-cols-1 gap-8">
            <Skeleton className="h-64 rounded-[3rem]" />
        </div>
    </div>
);

export default Skeleton;
