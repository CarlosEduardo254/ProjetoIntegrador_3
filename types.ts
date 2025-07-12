export interface Vertice {
  id: number;
  x: number;
  y: number;
  nome?: string; // Optional name for practical application
}

export interface Aresta {
  de: number;
  para: number;
  peso: number;
}

export interface Grafo {
  vertices: Vertice[];
  matrizAdjacencia: number[][];
}

export interface ResultadoChristofides {
  grafo: Grafo;
  agm: Aresta[];
  verticesGrauImpar: number[];
  emparelhamento: Aresta[];
  cicloEuleriano: number[];
  cicloHamiltoniano: {
    caminho: number[];
    custo: number;
  };
}

// Types for Gemini Service
export interface LocationData {
    name: string;
    lat: number;
    lon: number;
}

export interface DistanceMatrixResponse {
    locations: LocationData[];
    distanceMatrix: number[][];
}
