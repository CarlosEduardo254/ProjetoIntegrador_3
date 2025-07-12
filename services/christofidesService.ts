
import type { Grafo, Aresta, ResultadoChristofides } from '../types.ts';

function parseInput(texto: string): Grafo {
  const linhas = texto.trim().split('\n');
  if (linhas.length < 2) throw new Error("Entrada inválida. Precisa de N e da matriz de adjacência.");
  
  const n = parseInt(linhas[0].trim(), 10);
  if (isNaN(n) || n <= 0) throw new Error("Número de vértices (N) inválido.");
  
  const matrizAdjacencia = linhas.slice(1).map(linha =>
    linha.trim().split(/\s+/).map(Number)
  );

  if (matrizAdjacencia.length !== n || matrizAdjacencia.some(l => l.length !== n || l.some(isNaN))) {
    throw new Error("A dimensão da matriz de adjacência não corresponde a N ou contém valores não numéricos.");
  }
  
  const vertices = Array.from({ length: n }, (_, i) => {
    const angulo = (i / n) * 2 * Math.PI;
    return {
      id: i,
      x: 300 + 250 * Math.cos(angulo),
      y: 300 + 250 * Math.sin(angulo)
    };
  });

  return { vertices, matrizAdjacencia };
}

function encontrarAGM(grafo: Grafo): Aresta[] {
  const n = grafo.vertices.length;
  const pai = new Array(n).fill(-1);
  const custoMin = new Array(n).fill(Infinity);
  const naAGM = new Array(n).fill(false);
  const arestasAGM: Aresta[] = [];

  custoMin[0] = 0;

  for (let i = 0; i < n; i++) {
    let u = -1;
    for (let v = 0; v < n; v++) {
      if (!naAGM[v] && (u === -1 || custoMin[v] < custoMin[u])) {
        u = v;
      }
    }
    
    if (u === -1 || custoMin[u] === Infinity) {
        throw new Error("Grafo não é conexo, não é possível encontrar AGM.");
    }

    naAGM[u] = true;
    
    if(pai[u] !== -1) {
        arestasAGM.push({ de: pai[u], para: u, peso: grafo.matrizAdjacencia[u][pai[u]] });
    }

    for (let v = 0; v < n; v++) {
      const peso = grafo.matrizAdjacencia[u][v];
      if (peso > 0 && !naAGM[v] && peso < custoMin[v]) {
        pai[v] = u;
        custoMin[v] = peso;
      }
    }
  }

  return arestasAGM;
}

function encontrarVerticesGrauImpar(agm: Aresta[], numVertices: number): number[] {
  const graus = new Array(numVertices).fill(0);
  for (const aresta of agm) {
    graus[aresta.de]++;
    graus[aresta.para]++;
  }
  return graus.map((grau, id) => ({ grau, id })).filter(v => v.grau % 2 !== 0).map(v => v.id);
}

function emparelhamentoPerfeitoCustoMinimo(verticesImpares: number[], matriz: number[][]): Aresta[] {
  const emparelhamento: Aresta[] = [];
  const naoEmparelhados = new Set(verticesImpares);

  while (naoEmparelhados.size > 0) {
    const u = naoEmparelhados.values().next().value;
    naoEmparelhados.delete(u);

    let vMaisProximo = -1;
    let menorDistancia = Infinity;

    for (const v of naoEmparelhados) {
      if (matriz[u][v] < menorDistancia) {
        menorDistancia = matriz[u][v];
        vMaisProximo = v;
      }
    }

    if (vMaisProximo !== -1) {
      emparelhamento.push({ de: u, para: vMaisProximo, peso: menorDistancia });
      naoEmparelhados.delete(vMaisProximo);
    } else if (naoEmparelhados.size > 0) {
        // This case should ideally not be reached in a complete graph
        throw new Error("Não foi possível encontrar um par para todos os vértices de grau ímpar.");
    }
  }
  return emparelhamento;
}

function encontrarCicloEuleriano(multigrafo: Aresta[], numVertices: number, inicio: number): number[] {
  const adj: Map<number, number[]> = new Map();
  for (let i = 0; i < numVertices; i++) adj.set(i, []);

  for (const { de, para } of multigrafo) {
    adj.get(de)!.push(para);
    adj.get(para)!.push(de);
  }

  const pilha = [inicio];
  const ciclo: number[] = [];

  while (pilha.length > 0) {
    const u = pilha[pilha.length - 1];
    const vizinhos = adj.get(u)!;
    
    if (vizinhos.length > 0) {
      const v = vizinhos.pop()!;
      pilha.push(v);
      const adjV = adj.get(v)!;
      const index = adjV.indexOf(u);
      if(index > -1) adjV.splice(index, 1);
    } else {
      ciclo.push(pilha.pop()!);
    }
  }

  return ciclo.reverse();
}

function criarCicloHamiltoniano(cicloEuleriano: number[], matriz: number[][]): { caminho: number[], custo: number } {
  const visitados = new Set<number>();
  const caminho: number[] = [];
  
  for (const v of cicloEuleriano) {
    if (!visitados.has(v)) {
      visitados.add(v);
      caminho.push(v);
    }
  }
  caminho.push(caminho[0]);

  let custo = 0;
  for (let i = 0; i < caminho.length - 1; i++) {
    const de = caminho[i];
    const para = caminho[i+1];
    if (matriz[de] && matriz[de][para] !== undefined) {
      custo += matriz[de][para];
    } else {
       throw new Error(`Aresta inválida no ciclo hamiltoniano de ${de} para ${para}.`);
    }
  }

  return { caminho, custo };
}

export function executeChristofidesAlgorithm(grafo: Grafo): Omit<ResultadoChristofides, 'grafo'> {
    if (grafo.vertices.length === 0) {
        throw new Error("Grafo vazio. Não há o que resolver.");
    }
  
    const agm = encontrarAGM(grafo);
    const verticesGrauImpar = encontrarVerticesGrauImpar(agm, grafo.vertices.length);
    const emparelhamento = emparelhamentoPerfeitoCustoMinimo(verticesGrauImpar, grafo.matrizAdjacencia);
    const multigrafo = [...agm, ...emparelhamento];
    const inicioEuleriano = grafo.vertices.length > 0 ? grafo.vertices[0].id : 0;
    const cicloEuleriano = encontrarCicloEuleriano(multigrafo, grafo.vertices.length, inicioEuleriano);
    const cicloHamiltoniano = criarCicloHamiltoniano(cicloEuleriano, grafo.matrizAdjacencia);

    return {
        agm,
        verticesGrauImpar,
        emparelhamento,
        cicloEuleriano,
        cicloHamiltoniano
    };
}

export function resolverChristofides(inputText: string): ResultadoChristofides {
  const grafo = parseInput(inputText);
  const resultCore = executeChristofidesAlgorithm(grafo);

  return {
    grafo,
    ...resultCore
  };
}