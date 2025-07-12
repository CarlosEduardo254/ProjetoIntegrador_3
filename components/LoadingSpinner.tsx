
import React from 'react';

export const LoadingSpinner: React.FC = () => (
  <div className="flex flex-col items-center justify-center bg-neutral-800 p-6 rounded-xl shadow-lg">
    <div className="w-12 h-12 border-4 border-t-brand-secondary border-neutral-600 rounded-full animate-spin"></div>
    <p className="mt-4 text-lg font-semibold text-neutral-300">Calculando a rota ótima...</p>
    <p className="text-sm text-neutral-400">Isso pode levar alguns segundos.</p>
  </div>
);
