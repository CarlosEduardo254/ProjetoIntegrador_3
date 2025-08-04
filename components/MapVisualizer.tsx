
import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import type { ResultadoChristofides } from '../types.ts';
import { getMultipleRoutePathGeometries } from '../services/geminiService.ts';

const createNumberedIcon = (number: number) => {
  const style = `
    background-color: #3B82F6;
    color: white;
    font-weight: bold;
    border-radius: 9999px;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 2px solid white;
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    font-size: 14px;
    font-family: 'Inter', sans-serif;
  `;
  return L.divIcon({
    html: `<div style="${style.replace(/\s+/g, ' ').trim()}">${number}</div>`,
    className: '',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
};

const LoadingOverlay: React.FC = () => (
    <div className="absolute top-0 left-0 w-full h-full bg-neutral-900 bg-opacity-70 flex flex-col items-center justify-center z-[1000] text-white">
        <div className="w-10 h-10 border-4 border-t-brand-secondary border-neutral-600 rounded-full animate-spin"></div>
        <p className="mt-4 font-semibold">Desenhando rotas nas ruas...</p>
    </div>
);

// Helper component to adjust map bounds using the useMap hook
const MapBoundsController: React.FC<{ bounds: L.LatLngBounds }> = ({ bounds }) => {
    const map = useMap();
    useEffect(() => {
        if (bounds.isValid()) {
            map.fitBounds(bounds, { padding: [50, 50] });
        }
    }, [map, bounds]);
    return null;
};

// Helper component to draw a polyline with directional arrows
const PolylineWithArrows: React.FC<{
  path: [number, number][];
  pathOptions: L.PathOptions;
  decoratorLoaded: boolean;
}> = ({ path, pathOptions, decoratorLoaded }) => {
  const map = useMap();
  const [polyline, setPolyline] = useState<L.Polyline | null>(null);

  useEffect(() => {
    if (!polyline || !decoratorLoaded) return;

    const decorator = (L as any).polylineDecorator(polyline, {
      patterns: [
        {
          offset: '20%', // Start arrows a bit away from the marker
          repeat: '100px', // Space out arrows
          symbol: (L as any).Symbol.arrowHead({
            pixelSize: 12,
            polygon: false,
            pathOptions: {
              stroke: true,
              weight: 2,
              color: pathOptions.color,
              fillOpacity: 1,
            },
          }),
        },
      ],
    });

    decorator.addTo(map);

    return () => {
      map.removeLayer(decorator);
    };
  }, [map, polyline, decoratorLoaded, pathOptions.color]);

  return <Polyline ref={setPolyline} positions={path} pathOptions={pathOptions} />;
};


export const MapVisualizer: React.FC<{ resultado: ResultadoChristofides }> = ({ resultado }) => {
  const { grafo, cicloHamiltoniano } = resultado;
  const [routePaths, setRoutePaths] = useState<[number, number][][] | null>(null);
  const [isLoadingPaths, setIsLoadingPaths] = useState(true);
  const [decoratorLoaded, setDecoratorLoaded] = useState(!!(L as any).polylineDecorator);

  // Effect to load the decorator plugin
  useEffect(() => {
    if (decoratorLoaded) return;

    // Expose L globally for the non-module plugin to find it
    (window as any).L = L;

    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet-polylinedecorator@1.6.0/dist/leaflet.polylinedecorator.js';
    script.async = true;

    const onLoad = () => setDecoratorLoaded(true);
    const onError = () => {
      console.error('Falha ao carregar o plugin Leaflet decorator. As setas não serão exibidas.');
    };

    script.addEventListener('load', onLoad);
    script.addEventListener('error', onError);

    document.head.appendChild(script);

    return () => {
      script.removeEventListener('load', onLoad);
      script.removeEventListener('error', onError);
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, [decoratorLoaded]);

  useEffect(() => {
    const fetchAllRoutePaths = async () => {
      setIsLoadingPaths(true);
      setRoutePaths(null); // Limpa os caminhos anteriores
      const { caminho } = cicloHamiltoniano;

      try {
        // Constrói a lista de locais ordenados para a API
        const tourForApi = caminho.map(id => {
          const v = grafo.vertices.find(vert => vert.id === id)!;
          if (!v.nome || typeof v.y !== 'number' || typeof v.x !== 'number') {
            throw new Error(`Vértice inválido no tour: ${JSON.stringify(v)}`);
          }
          return { name: v.nome, lat: v.y, lon: v.x };
        });

        // Chama a nova função da API uma única vez
        const pathsObject = await getMultipleRoutePathGeometries(tourForApi);
        
        const resolvedPaths = [];
        // Constrói a matriz de caminhos a partir do objeto retornado
        for (let i = 0; i < caminho.length - 1; i++) {
          const key = `${i}-${i + 1}`;
          if (pathsObject[key] && pathsObject[key].length > 0) {
            resolvedPaths.push(pathsObject[key]);
          } else {
            console.warn(`Nenhum caminho encontrado para o segmento ${key}, desenhando linha reta.`);
            const v1 = grafo.vertices.find(v => v.id === caminho[i])!;
            const v2 = grafo.vertices.find(v => v.id === caminho[i+1])!;
            resolvedPaths.push([[v1.y, v1.x], [v2.y, v2.x]]);
          }
        }
        
        setRoutePaths(resolvedPaths);

      } catch (error) {
        console.error("Falha ao buscar os caminhos da rota, desenhando linhas retas como fallback:", error);
        const fallbackPaths = [];
        for (let i = 0; i < caminho.length - 1; i++) {
          const v1 = grafo.vertices.find(v => v.id === caminho[i])!;
          const v2 = grafo.vertices.find(v => v.id === caminho[i+1])!;
          fallbackPaths.push([[v1.y, v1.x], [v2.y, v2.x]]);
        }
        setRoutePaths(fallbackPaths);
      } finally {
        setIsLoadingPaths(false);
      }
    };

    if (cicloHamiltoniano && grafo.vertices.some(v => v.nome)) {
      fetchAllRoutePaths();
    } else {
        setIsLoadingPaths(false);
    }
  }, [cicloHamiltoniano, grafo.vertices]);


  if (!grafo.vertices.every(v => typeof v.y === 'number' && typeof v.x === 'number') || grafo.vertices.length === 0) {
    return (
        <div className="text-center text-neutral-400 p-4">
            <p className="text-xl font-semibold">Dados de localização inválidos.</p>
            <p className="mt-2 text-neutral-300">Não foi possível exibir o mapa.</p>
        </div>
    );
  }

  const routeOrder = new Map<number, number>();
  cicloHamiltoniano.caminho.slice(0, -1).forEach((id, index) => {
    routeOrder.set(id, index + 1);
  });
  
  const positions = grafo.vertices.map(v => ({
    id: v.id,
    position: [v.y, v.x] as [number, number],
    name: v.nome,
  }));
    
  const bounds = L.latLngBounds(positions.map(p => p.position));
  const center = bounds.isValid() ? bounds.getCenter() : L.latLng(0, 0);

  return (
    <div className="relative w-full h-full">
        {isLoadingPaths && <LoadingOverlay />}
        <MapContainer
            center={center}
            zoom={13}
            scrollWheelZoom={true}
            style={{ height: '100%', width: '100%', borderRadius: '0.75rem' }}
            className="animate-fade-in"
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            <MapBoundsController bounds={bounds} />

            {positions.map(p => {
                const order = routeOrder.get(p.id);
                if (!order) return null;
                return (
                    <Marker key={p.id} position={p.position} icon={createNumberedIcon(order)}>
                        <Popup>
                            <div className="font-sans">
                                <span className="font-bold">Parada {order}:</span> {p.name}
                            </div>
                        </Popup>
                    </Marker>
                );
            })}

            {routePaths && routePaths.map((path, index) => (
              <PolylineWithArrows
                key={index}
                path={path}
                pathOptions={{ color: '#1E40AF', weight: 5, opacity: 0.8 }}
                decoratorLoaded={decoratorLoaded}
              />
            ))}
        </MapContainer>
    </div>
  );
};