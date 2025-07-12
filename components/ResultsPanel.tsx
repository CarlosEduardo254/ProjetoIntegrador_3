
import React from 'react';
import type { ResultadoChristofides } from '../types.ts';

interface ResultsPanelProps {
  resultado: ResultadoChristofides;
  visualizacaoAtiva: string;
  setVisualizacaoAtiva: (view: string) => void;
}

const formatCurrency = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const ResultCard: React.FC<{
    title: string;
    description: string;
    viewKey: string;
    isActive: boolean;
    onClick: () => void;
    children?: React.ReactNode
}> = ({ title, description, isActive, onClick, children }) => (
    <div 
        className={`bg-neutral-800 p-4 rounded-lg border-2 transition-all duration-300 cursor-pointer ${isActive ? 'border-brand-secondary shadow-lg' : 'border-neutral-700 hover:border-neutral-600'}`}
        onClick={onClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onClick()}
        aria-label={`Visualizar etapa: ${title}`}
    >
        <h3 className="font-bold text-lg text-brand-light">{title}</h3>
        <p className="text-sm text-neutral-400 mt-1">{description}</p>
        <div className="mt-3 bg-neutral-900 p-3 rounded-md font-mono text-sm text-yellow-300 overflow-x-auto">
            {children}
        </div>
    </div>
);


export const ResultsPanel: React.FC<ResultsPanelProps> = ({ resultado, visualizacaoAtiva, setVisualizacaoAtiva }) => {
    const { grafo, agm, verticesGrauImpar, emparelhamento, cicloEuleriano, cicloHamiltoniano } = resultado;
    
    const hasNames = grafo.vertices.some(v => v.nome);
    const finalCaminhoStr = hasNames 
        ? cicloHamiltoniano.caminho.map(id => grafo.vertices.find(v => v.id === id)?.nome || id).join(' → ')
        : cicloHamiltoniano.caminho.join(' → ');

    const custoAGM = agm.reduce((acc, a) => acc + a.peso, 0);
    const custoEmparelhamento = emparelhamento.reduce((acc, a) => acc + a.peso, 0);
    const custoFinal = cicloHamiltoniano.custo;

  return (
    <div className="flex flex-col gap-4 animate-fade-in">
        <div className="bg-green-900 border border-green-700 text-green-200 px-4 py-4 rounded-lg text-center">
            <h2 className="text-2xl font-bold">{hasNames ? "Custo Estimado da Rota" : "Solução Encontrada!"}</h2>
            <p className="text-4xl font-bold mt-2">{hasNames ? formatCurrency(custoFinal) : custoFinal.toFixed(2)}</p>
            <p className="text-sm mt-1">Custo Total do Ciclo Hamiltoniano</p>
            <p className="font-mono text-base md:text-lg mt-4 break-words">{finalCaminhoStr}</p>
        </div>
      
        <h2 className="text-xl font-semibold mt-4">Etapas do Algoritmo:</h2>

        <ResultCard
            title="Passo 1: Árvore Geradora Mínima (AGM)"
            description={`Custo Total da AGM: ${hasNames ? formatCurrency(custoAGM) : custoAGM.toFixed(2)}`}
            viewKey="agm"
            isActive={visualizacaoAtiva === 'agm'}
            onClick={() => setVisualizacaoAtiva('agm')}
        >
            <ul className="space-y-1 max-h-40 overflow-y-auto">
                {agm.map((a, i) => <li key={i}>{`(${a.de}, ${a.para}) - peso: ${hasNames ? formatCurrency(a.peso) : a.peso.toFixed(2)}`}</li>)}
            </ul>
        </ResultCard>

        <ResultCard
            title="Passo 2 & 3: Emparelhamento"
            description={`Custo do Emparelhamento: ${hasNames ? formatCurrency(custoEmparelhamento) : custoEmparelhamento.toFixed(2)}`}
            viewKey="emparelhamento"
            isActive={visualizacaoAtiva === 'emparelhamento'}
            onClick={() => setVisualizacaoAtiva('emparelhamento')}
        >
             <p className="text-neutral-300">Vértices Ímpares: <span className="text-yellow-300">[{verticesGrauImpar.join(', ')}]</span></p>
             <p className="text-neutral-300 mt-2">Emparelhamento:</p>
             <ul className="space-y-1 mt-1 max-h-40 overflow-y-auto">
                {emparelhamento.map((a, i) => <li key={i} className="text-yellow-300">{`(${a.de}, ${a.para}) - peso: ${hasNames ? formatCurrency(a.peso) : a.peso.toFixed(2)}`}</li>)}
            </ul>
        </ResultCard>

        <ResultCard
            title="Passo 4 & 5: Ciclo Euleriano"
            description="Combina a AGM e o emparelhamento para encontrar um ciclo."
            viewKey="euleriano"
            isActive={visualizacaoAtiva === 'euleriano'}
            onClick={() => setVisualizacaoAtiva('euleriano')}
        >
            <p className="break-words">{resultado.cicloEuleriano.join(' → ')}</p>
        </ResultCard>

        <ResultCard
            title="Passo 6: Ciclo Hamiltoniano Final"
            description={`Custo Total: ${hasNames ? formatCurrency(custoFinal) : custoFinal.toFixed(2)}`}
            viewKey="final"
            isActive={visualizacaoAtiva === 'final'}
            onClick={() => setVisualizacaoAtiva('final')}
        >
            <p className="break-words">{finalCaminhoStr}</p>
        </ResultCard>
    </div>
  );
};