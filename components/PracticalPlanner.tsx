
import React, { useState, useEffect, useRef } from 'react';
import { getLocationSuggestions } from '../services/locationService';

interface PracticalPlannerProps {
  locations: string[];
  setLocations: (locs: string[]) => void;
  fuelConsumption: string;
  setFuelConsumption: (val: string) => void;
  gasPrice: string;
  setGasPrice: (val: string) => void;
  onSolve: () => void;
  onClear: () => void;
  isLoading: boolean;
}

export const PracticalPlanner: React.FC<PracticalPlannerProps> = ({
  locations,
  setLocations,
  fuelConsumption,
  setFuelConsumption,
  gasPrice,
  setGasPrice,
  onSolve,
  onClear,
  isLoading,
}) => {
  const [newLocation, setNewLocation] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const suggestionContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (newLocation.trim().length < 3) {
        setSuggestions([]);
        return;
    }

    const handler = setTimeout(async () => {
        setIsSuggesting(true);
        const fetchedSuggestions = await getLocationSuggestions(newLocation);
        setSuggestions(fetchedSuggestions);
        setIsSuggesting(false);
    }, 500);

    return () => {
        clearTimeout(handler);
    };
  }, [newLocation]);
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionContainerRef.current && !suggestionContainerRef.current.contains(event.target as Node)) {
        setSuggestions([]);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSuggestionClick = (suggestion: string) => {
    const shortenedSuggestion = suggestion.split(',').slice(0, 3).join(', ');
    setNewLocation(shortenedSuggestion);
    setSuggestions([]);
  };

  const handleAddLocation = () => {
    if (newLocation.trim() && !locations.some(l => l.toLowerCase() === newLocation.trim().toLowerCase())) {
      setLocations([...locations, newLocation.trim()]);
      setNewLocation('');
      setSuggestions([]);
    }
  };

  const handleRemoveLocation = (index: number) => {
    setLocations(locations.filter((_, i) => i !== index));
  };

  return (
    <div className="bg-neutral-800 p-6 rounded-xl shadow-lg">
      <h2 className="text-lg font-semibold mb-2 text-neutral-200">
        Planejador de Rota Prático
      </h2>
      <p className="text-sm text-neutral-400 mb-4">
        Adicione locais, informe o consumo e o preço do combustível para encontrar a rota de viagem mais barata.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div>
            <label htmlFor="fuel-consumption" className="block text-sm font-medium text-neutral-300 mb-1">Consumo (km/L)</label>
            <input
                type="number"
                id="fuel-consumption"
                value={fuelConsumption}
                onChange={(e) => setFuelConsumption(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-700 rounded-md p-2 text-neutral-100 text-sm focus:ring-1 focus:ring-brand-secondary focus:border-brand-secondary transition-colors"
                disabled={isLoading}
                placeholder="Ex: 12"
                step="0.1"
            />
        </div>
        <div>
            <label htmlFor="gas-price" className="block text-sm font-medium text-neutral-300 mb-1">Preço Combustível (R$/L)</label>
            <input
                type="number"
                id="gas-price"
                value={gasPrice}
                onChange={(e) => setGasPrice(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-700 rounded-md p-2 text-neutral-100 text-sm focus:ring-1 focus:ring-brand-secondary focus:border-brand-secondary transition-colors"
                disabled={isLoading}
                placeholder="Ex: 5.50"
                step="0.01"
            />
        </div>
      </div>


      <div ref={suggestionContainerRef} className="relative">
        <label htmlFor="location-input" className="block text-sm font-medium text-neutral-300 mb-1">Locais (mínimo 3)</label>
        <div className="flex gap-2">
            <input
              id="location-input"
              type="text"
              value={newLocation}
              onChange={(e) => setNewLocation(e.target.value)}
              onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                      handleAddLocation();
                      setSuggestions([]);
                  }
              }}
              placeholder="Ex: Rua Augusta, 500, São Paulo"
              className="flex-grow bg-neutral-900 border border-neutral-700 rounded-md p-3 text-neutral-100 text-sm focus:ring-2 focus:ring-brand-secondary focus:border-brand-secondary transition-colors"
              disabled={isLoading}
              autoComplete="off"
            />
            <button
              onClick={handleAddLocation}
              disabled={isLoading || !newLocation.trim()}
              className="bg-brand-secondary hover:bg-blue-500 text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:bg-neutral-600 disabled:cursor-not-allowed"
            >
              Adicionar
            </button>
        </div>
        {(isSuggesting || suggestions.length > 0) && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-neutral-700 border border-neutral-600 rounded-md shadow-lg z-10 max-h-60 overflow-y-auto animate-fade-in">
                {isSuggesting && <div className="p-3 text-sm text-neutral-400">Buscando sugestões...</div>}
                {!isSuggesting && suggestions.length > 0 && (
                    <ul role="listbox">
                        {suggestions.map((suggestion, index) => (
                            <li
                                key={index}
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => handleSuggestionClick(suggestion)}
                                className="px-4 py-2 hover:bg-brand-secondary cursor-pointer text-sm text-neutral-200"
                                role="option"
                                aria-selected="false"
                            >
                                {suggestion}
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        )}
      </div>
      
      <div className="my-4 space-y-2 max-h-60 overflow-y-auto pr-2">
        {locations.map((loc, i) => (
          <div key={i} className="flex items-center justify-between bg-neutral-700 p-2 rounded-md animate-fade-in">
            <span className="text-neutral-200 text-sm flex-1 truncate pr-2">{i + 1}. {loc}</span>
            <button onClick={() => handleRemoveLocation(i)} disabled={isLoading} className="text-neutral-400 hover:text-red-400 transition-colors disabled:opacity-50 flex-shrink-0" aria-label={`Remover ${loc}`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
            </button>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <button
          onClick={onSolve}
          disabled={isLoading || locations.length < 3}
          className="flex-1 bg-brand-secondary hover:bg-blue-500 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 disabled:bg-neutral-600 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isLoading ? 'Calculando...' : 'Encontrar Rota Otimizada'}
        </button>
        <button
          onClick={onClear}
          disabled={isLoading}
          className="flex-1 bg-neutral-700 hover:bg-neutral-600 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-300 disabled:opacity-50"
        >
          Limpar Locais
        </button>
      </div>
    </div>
  );
};
