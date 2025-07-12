
import React, { useState, useCallback } from 'react';
import { GRAFO_EXEMPLO } from './constants.ts';
import type { ResultadoChristofides } from './types.ts';
import { resolverChristofides } from './services/christofidesService.ts';
import { GraphVisualizer } from './components/GraphVisualizer.tsx';
import { ControlPanel } from './components/ControlPanel.tsx';
import { ResultsPanel } from './components/ResultsPanel.tsx';
import { LoadingSpinner } from './components/LoadingSpinner.tsx';
import { PracticalPlanner } from './components/PracticalPlanner.tsx';
import { MapVisualizer } from './components/MapVisualizer.tsx';

const TabButton: React.FC<{title: string, isActive: boolean, onClick: () => void, disabled: boolean}> = ({ title, isActive, onClick, disabled }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        className={`px-4 sm:px-6 py-3 text-base sm:text-lg font-medium transition-colors duration-300 disabled:cursor-not-allowed disabled:text-neutral-600 ${isActive ? 'text-brand-secondary border-b-2 border-brand-secondary' : 'text-neutral-400 hover:text-neutral-100'}`}
    >
        {title}
    </button>
);


const App: React.FC = () => {
  const [mode, setMode] = useState<'solver' | 'practical'>('solver');
  const [inputText, setInputText] = useState<string>(GRAFO_EXEMPLO);
  const [resultado, setResultado] = useState<ResultadoChristofides | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [visualizacaoAtiva, setVisualizacaoAtiva] = useState<string>('final');

  const handleSolveMatrix = useCallback(async () => {
    setIsLoading(true);
    setErro(null);
    setResultado(null);
    setVisualizacaoAtiva('final');

    try {
      await new Promise(resolve => setTimeout(resolve, 50));
      const res = resolverChristofides(inputText);
      setResultado(res);
    } catch (e) {
      if (e instanceof Error) {
        setErro(e.message);
      } else {
        setErro('Ocorreu um erro desconhecido.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [inputText]);

  const handleClear = useCallback(() => {
    setInputText('');
    setResultado(null);
    setErro(null);
    setIsLoading(false);
    setVisualizacaoAtiva('final');
  }, []);
  
  const handleModeChange = (newMode: 'solver' | 'practical') => {
      handleClear();
      setMode(newMode);
  }

  const renderActivePanel = () => {
    if (mode === 'solver') {
      return (
        <ControlPanel
          inputText={inputText}
          setInputText={setInputText}
          onSolve={handleSolveMatrix}
          onClear={handleClear}
          isLoading={isLoading}
        />
      );
    }
    return (
        <PracticalPlanner
          setResultado={setResultado}
          setErro={setErro}
          setIsLoading={setIsLoading}
          isLoading={isLoading}
          clearResultado={handleClear}
          setVisualizacaoAtiva={setVisualizacaoAtiva}
        />
    );
  };

  return (
    <div className="min-h-screen bg-neutral-900 font-sans text-neutral-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tight">
            Solucionador do PCV & <span className="text-brand-secondary">Planejador de Rota</span>
          </h1>
          <p className="mt-4 text-lg text-neutral-300 max-w-3xl mx-auto">
            Uma ferramenta interativa para resolver o Problema do Caixeiro Viajante, da teoria à prática.
          </p>
        </header>

        <div className="mb-8 flex justify-center border-b border-neutral-700">
            <TabButton title="Solucionador de Matriz" isActive={mode === 'solver'} onClick={() => handleModeChange('solver')} disabled={isLoading} />
            <TabButton title="Planejador Prático" isActive={mode === 'practical'} onClick={() => handleModeChange('practical')} disabled={isLoading} />
        </div>

        <main className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="flex flex-col gap-6">
            {renderActivePanel()}
            {erro && (
              <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded-lg" role="alert">
                <strong className="font-bold">Erro: </strong>
                <span className="block sm:inline">{erro}</span>
              </div>
            )}
            {isLoading && <LoadingSpinner />}
            {resultado && !isLoading && (
              <ResultsPanel 
                resultado={resultado} 
                visualizacaoAtiva={visualizacaoAtiva}
                setVisualizacaoAtiva={setVisualizacaoAtiva}
              />
            )}
          </div>

          <div className="bg-neutral-800 rounded-xl shadow-2xl overflow-hidden min-h-[400px] lg:min-h-[600px] flex items-center justify-center sticky top-8">
             {mode === 'practical' && resultado && visualizacaoAtiva === 'final' ? (
                <MapVisualizer resultado={resultado} />
              ) : (
                <GraphVisualizer 
                  resultado={resultado}
                  visualizacaoAtiva={visualizacaoAtiva}
                />
              )}
          </div>
        </main>
         <footer className="text-center mt-12 text-neutral-500 text-sm">
            <p>Desenvolvido com React, TypeScript, Photon, OpenStreetMap e OSRM.</p>
        </footer>
      </div>
    </div>
  );
};

export default App;