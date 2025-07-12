
import React from 'react';

interface ControlPanelProps {
  inputText: string;
  setInputText: (text: string) => void;
  onSolve: () => void;
  onClear: () => void;
  isLoading: boolean;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  inputText,
  setInputText,
  onSolve,
  onClear,
  isLoading,
}) => {
  return (
    <div className="bg-neutral-800 p-6 rounded-xl shadow-lg">
      <label htmlFor="graph-input" className="block text-lg font-semibold mb-2 text-neutral-200">
        Dados do Grafo (Matriz de Adjacência)
      </label>
      <p className="text-sm text-neutral-400 mb-4">
        A primeira linha deve ser o número de vértices (N). As N linhas seguintes devem ser a matriz de adjacência do grafo.
      </p>
      <textarea
        id="graph-input"
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
        rows={10}
        className="w-full bg-neutral-900 border border-neutral-700 rounded-md p-3 text-neutral-100 font-mono text-sm focus:ring-2 focus:ring-brand-secondary focus:border-brand-secondary transition-colors"
        placeholder="7&#10;0 12 10 ...&#10;12 0 3 ...&#10;..."
        disabled={isLoading}
      />
      <div className="mt-4 flex flex-col sm:flex-row gap-4">
        <button
          onClick={onSolve}
          disabled={isLoading || !inputText.trim()}
          className="flex-1 bg-brand-secondary hover:bg-blue-500 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 disabled:bg-neutral-600 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isLoading ? 'Resolvendo...' : 'Resolver com Christofides'}
        </button>
        <button
          onClick={onClear}
          disabled={isLoading}
          className="flex-1 bg-neutral-700 hover:bg-neutral-600 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-300 disabled:opacity-50"
        >
          Limpar
        </button>
      </div>
    </div>
  );
};
