
import React, { useState, useCallback } from 'react';
import { GRAFO_EXEMPLO } from './constants';
import type { ResultadoChristofides, DistanceMatrixResponse, Grafo, Vertice } from './types';
import { resolverChristofides, executeChristofidesAlgorithm } from './services/christofidesService';
import { getDistanceMatrixForLocations } from './services/locationService';
import { GraphVisualizer } from './components/GraphVisualizer';
import { ControlPanel } from './components/ControlPanel';
import { ResultsPanel } from './components/ResultsPanel';
import { LoadingSpinner } from './components/LoadingSpinner';
import { PracticalPlanner } from './components/PracticalPlanner';
import { MapVisualizer } from './components/MapVisualizer';

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
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const [inputText, setInputText] = useState<string>(GRAFO_EXEMPLO);
  const [matrixResult, setMatrixResult] = useState<ResultadoChristofides | null>(null);
  const [matrixError, setMatrixError] = useState<string | null>(null);
  const [matrixViz, setMatrixViz] = useState<string>('final');

  const [locations, setLocations] = useState<string[]>([
    'Avenida Carlos Roberto Costa, Iguatu, Ceará',
    'Rua Arnóbio Bacelar Caneca, Juazeiro do Norte, Ceará',
    'Rua do Flamengo, Campos Sales, Ceará',
    'Avenida Odilon Aguiar, Tauá, Ceará',
    'Avenida Beira Rio, Mombaça, Ceará',
  ]);
  const [fuelConsumption, setFuelConsumption] = useState('12');
  const [gasPrice, setGasPrice] = useState('5.50');
  const [practicalResult, setPracticalResult] = useState<ResultadoChristofides | null>(null);
  const [practicalError, setPracticalError] = useState<string | null>(null);
  const [practicalViz, setPracticalViz] = useState<string>('final');
  

  const handleSolveMatrix = useCallback(async () => {
    setIsLoading(true);
    setMatrixError(null);
    setMatrixResult(null);
    setMatrixViz('final');

    try {
      await new Promise(resolve => setTimeout(resolve, 50));
      const res = resolverChristofides(inputText);
      setMatrixResult(res);
    } catch (e) {
      if (e instanceof Error) {
        setMatrixError(e.message);
      } else {
        setMatrixError('Ocorreu um erro desconhecido.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [inputText]);
  
  const handleSolvePractical = useCallback(async () => {
    if (locations.length < 3) {
      setPracticalError("Adicione pelo menos 3 locais para calcular uma rota.");
      return;
    }
    const consumption = parseFloat(fuelConsumption);
    const price = parseFloat(gasPrice);

    if (isNaN(consumption) || consumption <= 0 || isNaN(price) || price <= 0) {
      setPracticalError("Valores inválidos para consumo ou preço da gasolina. Verifique se são números positivos.");
      return;
    }

    setIsLoading(true);
    setPracticalError(null);
    setPracticalResult(null);
    setPracticalViz('final');

    try {
      const apiResponse: DistanceMatrixResponse = await getDistanceMatrixForLocations(locations);
      
      const vertices: Vertice[] = apiResponse.locations.map((loc, i) => ({
        id: i,
        x: loc.lon,
        y: loc.lat,
        nome: loc.name,
      }));
      
      const costMatrix = apiResponse.distanceMatrix.map(row => 
        row.map(distanceInKm => (distanceInKm / consumption) * price)
      );

      const grafo: Grafo = {
        vertices,
        matrizAdjacencia: costMatrix,
      };

      const resultCore = executeChristofidesAlgorithm(grafo);
      
      setPracticalResult({
        grafo,
        ...resultCore
      });

    } catch (e) {
      if (e instanceof Error) {
        setPracticalError(e.message);
      } else {
        setPracticalError('Ocorreu um erro desconhecido.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [locations, fuelConsumption, gasPrice]);

  const handleClearMatrix = useCallback(() => {
    setInputText('');
    setMatrixResult(null);
    setMatrixError(null);
    setMatrixViz('final');
  }, []);

  const handleClearPractical = useCallback(() => {
    setLocations([]);
    setPracticalResult(null);
    setPracticalError(null);
    setPracticalViz('final');
  }, []);
  
  const handleModeChange = (newMode: 'solver' | 'practical') => {
      setMode(newMode);
  }

  const renderActivePanel = () => {
    if (mode === 'solver') {
      return (
        <ControlPanel
          inputText={inputText}
          setInputText={setInputText}
          onSolve={handleSolveMatrix}
          onClear={handleClearMatrix}
          isLoading={isLoading}
        />
      );
    }
    return (
        <PracticalPlanner
          locations={locations}
          setLocations={setLocations}
          fuelConsumption={fuelConsumption}
          setFuelConsumption={setFuelConsumption}
          gasPrice={gasPrice}
          setGasPrice={setGasPrice}
          onSolve={handleSolvePractical}
          onClear={handleClearPractical}
          isLoading={isLoading}
        />
    );
  };
  
  const activeResult = mode === 'solver' ? matrixResult : practicalResult;
  const activeError = mode === 'solver' ? matrixError : practicalError;
  const activeViz = mode === 'solver' ? matrixViz : practicalViz;
  const setActiveViz = mode === 'solver' ? setMatrixViz : setPracticalViz;

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
            {activeError && (
              <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded-lg" role="alert">
                <strong className="font-bold">Erro: </strong>
                <span className="block sm:inline">{activeError}</span>
              </div>
            )}
            {isLoading && <LoadingSpinner />}
            {activeResult && !isLoading && (
              <ResultsPanel 
                resultado={activeResult} 
                visualizacaoAtiva={activeViz}
                setVisualizacaoAtiva={setActiveViz}
              />
            )}
          </div>

          <div className="bg-neutral-800 rounded-xl shadow-2xl overflow-hidden min-h-[400px] lg:min-h-[600px] flex items-center justify-center sticky top-8">
             {mode === 'practical' && practicalResult && activeViz === 'final' ? (
                <MapVisualizer resultado={practicalResult} />
              ) : (
                <GraphVisualizer 
                  resultado={activeResult}
                  visualizacaoAtiva={activeViz}
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
