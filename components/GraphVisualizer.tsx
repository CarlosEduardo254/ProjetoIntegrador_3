
import React from 'react';
import type { ResultadoChristofides, Vertice, Aresta } from '../types.ts';

interface GraphVisualizerProps {
  resultado: ResultadoChristofides | null;
  visualizacaoAtiva: string;
}

const StrokeColors = {
  default: '#4B5563', 
  agm: '#10B981', 
  emparelhamento: '#F59E0B', 
  final: '#3B82F6', 
};

function projectCoordinates(vertices: Vertice[]): Vertice[] {
    if (vertices.length === 0 || !vertices[0].nome) {
        return vertices;
    }

    const PADDING = 60;
    const VIEW_WIDTH = 600 - PADDING * 2;
    const VIEW_HEIGHT = 600 - PADDING * 2;
    
  
    const lons = vertices.map(v => v.x);
    const lats = vertices.map(v => v.y);
    
    const minLon = Math.min(...lons);
    const maxLon = Math.max(...lons);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    
    const lonRange = maxLon - minLon;
    const latRange = maxLat - minLat;

    if (lonRange === 0 && latRange === 0) {
        return vertices.map(v => ({ ...v, x: 300, y: 300 }));
    }

    const scaleX = lonRange > 0 ? VIEW_WIDTH / lonRange : 1;
    const scaleY = latRange > 0 ? VIEW_HEIGHT / latRange : 1;
    const scale = Math.min(scaleX, scaleY) * 0.9; 

    const centerX = (minLon + maxLon) / 2;
    const centerY = (minLat + maxLat) / 2;
    
    const offsetX = 300 - (centerX - minLon) * scale;
    const offsetY = 300 - (maxLat - centerY) * scale;

    return vertices.map(v => {
        const newX = ((v.x - minLon) * scale) + offsetX;
        const newY = ((maxLat - v.y) * scale) + offsetY - (VIEW_HEIGHT - latRange * scale) / 2;
        return { ...v, x: newX, y: newY };
    });
}


const MemoizedAresta: React.FC<{ aresta: Aresta; vertices: Vertice[]; color?: string; strokeWidth?: number; isDashed?: boolean }> = React.memo(({ aresta, vertices, color = StrokeColors.default, strokeWidth = 1.5, isDashed = false }) => {
    const v1 = vertices.find(v => v.id === aresta.de);
    const v2 = vertices.find(v => v.id === aresta.para);
    if (!v1 || !v2) return null;
    return (
        <line
            x1={v1.x}
            y1={v1.y}
            x2={v2.x}
            y2={v2.y}
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={isDashed ? "5,5" : "none"}
            className="transition-all duration-500"
        />
    );
});

const MemoizedCaminho: React.FC<{ caminho: number[]; vertices: Vertice[]; color?: string; strokeWidth?: number }> = React.memo(({ caminho, vertices, color = StrokeColors.final, strokeWidth = 4 }) => {
    return (
        <g>
            {caminho.slice(0, -1).map((id, i) => {
                const v1 = vertices.find(v => v.id === id);
                const v2 = vertices.find(v => v.id === caminho[i + 1]);
                if (!v1 || !v2) return null;
                return (
                    <line
                        key={`${id}-${caminho[i+1]}-${i}`}
                        x1={v1.x}
                        y1={v1.y}
                        x2={v2.x}
                        y2={v2.y}
                        stroke={color}
                        strokeWidth={strokeWidth}
                        strokeLinecap="round"
                        className="transition-all duration-500"
                    />
                );
            })}
        </g>
    );
});


export const GraphVisualizer: React.FC<GraphVisualizerProps> = ({ resultado, visualizacaoAtiva }) => {
  if (!resultado) {
    return (
      <div className="text-center text-neutral-400 p-4">
        <p className="text-xl font-semibold">Aguardando dados do grafo...</p>
        <p className="mt-2 text-neutral-300">Use um dos painéis à esquerda para começar.</p>
      </div>
    );
  }

  const { grafo, agm, emparelhamento, verticesGrauImpar, cicloHamiltoniano } = resultado;
  const projectedVertices = React.useMemo(() => projectCoordinates(grafo.vertices), [grafo.vertices]);

  const renderArestas = () => {
    switch (visualizacaoAtiva) {
      case 'agm':
        return agm.map((a, i) => <MemoizedAresta key={`agm-${i}`} aresta={a} vertices={projectedVertices} color={StrokeColors.agm} strokeWidth={3} />);
      case 'emparelhamento':
        return (
          <>
            {agm.map((a, i) => <MemoizedAresta key={`agm-bg-${i}`} aresta={a} vertices={projectedVertices} color={StrokeColors.default} />)}
            {emparelhamento.map((a, i) => <MemoizedAresta key={`emp-${i}`} aresta={a} vertices={projectedVertices} color={StrokeColors.emparelhamento} strokeWidth={3} isDashed />)}
          </>
        );
      case 'euleriano':
         return (
          <>
            {agm.map((a, i) => <MemoizedAresta key={`agm-eul-${i}`} aresta={a} vertices={projectedVertices} color={StrokeColors.agm} strokeWidth={2.5}/>)}
            {emparelhamento.map((a, i) => <MemoizedAresta key={`emp-eul-${i}`} aresta={a} vertices={projectedVertices} color={StrokeColors.emparelhamento} strokeWidth={2.5} isDashed />)}
          </>
        );
      case 'final':
        return <MemoizedCaminho caminho={cicloHamiltoniano.caminho} vertices={projectedVertices} />;
      default:
        return null;
    }
  };

  return (
    <svg viewBox="0 0 600 600" className="w-full h-full">
        <g>{renderArestas()}</g>
        <g>
            {projectedVertices.map(v => {
                const isOdd = visualizacaoAtiva === 'emparelhamento' && verticesGrauImpar.includes(v.id);
                return (
                    <g key={v.id} transform={`translate(${v.x}, ${v.y})`}>
                        <circle
                            r={isOdd ? 18 : 14}
                            fill={isOdd ? StrokeColors.emparelhamento : StrokeColors.final}
                            stroke="#1F2937"
                            strokeWidth="3"
                            className="transition-all duration-300"
                        />
                        <text
                            textAnchor="middle"
                            dy=".3em"
                            fill="white"
                            fontSize="14"
                            fontWeight="bold"
                        >
                            {v.id}
                        </text>
                        {v.nome && (
                             <text
                                textAnchor="middle"
                                y={30}
                                fill="#E5E7EB"
                                fontSize="12"
                                className="font-semibold"
                            >
                                {v.nome.split(',')[0].substring(0, 20)}
                            </text>
                        )}
                    </g>
                );
            })}
      </g>
    </svg>
  );
};