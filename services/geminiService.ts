
import type { DistanceMatrixResponse, LocationData } from '../types.ts';

// This service uses the Photon API for geocoding and the OSRM API for routing.
const PHOTON_API_BASE = 'https://photon.komoot.io';
const OSRM_API_BASE = 'https://router.project-osrm.org';

// Helper to format a Photon API feature into a readable address string.
function formatPhotonFeature(feature: any): string {
    const props = feature.properties;
    const addressParts = [
        props.name,
        props.housenumber ? `${props.street} ${props.housenumber}` : props.street,
        props.city,
        props.state,
        props.country,
    ].filter(Boolean); // Filter out null/undefined/empty values

    // Remove duplicates which can sometimes occur (e.g., name is the same as city)
    const uniqueParts = [...new Set(addressParts)];
    
    return uniqueParts.join(', ');
}

export async function getLocationSuggestions(query: string): Promise<string[]> {
    if (!query || query.trim().length < 3) {
        return [];
    }

    const url = new URL(`${PHOTON_API_BASE}/api/`);
    url.searchParams.set('q', query);
    url.searchParams.set('limit', '5');
    // Bias results towards São Paulo, Brazil to improve relevance for local searches.
    url.searchParams.set('lat', '-23.55');
    url.searchParams.set('lon', '-46.63');


    try {
        const response = await fetch(url.toString());
        if (!response.ok) throw new Error('Photon API request failed.');
        const data = await response.json();
        
        if (!data.features || !Array.isArray(data.features)) return [];

        return data.features.map(formatPhotonFeature);
    } catch (error) {
        console.error("Error fetching location suggestions from Photon:", error);
        return []; // Return empty on error to avoid breaking the UI
    }
}


async function geocodeAddress(address: string): Promise<LocationData | null> {
    const url = new URL(`${PHOTON_API_BASE}/api/`);
    url.searchParams.set('q', address);
    url.searchParams.set('limit', '1');
    // Bias results towards São Paulo, Brazil.
    url.searchParams.set('lat', '-23.55');
    url.searchParams.set('lon', '-46.63');

    try {
        const response = await fetch(url.toString());
        if (!response.ok) throw new Error(`Geocoding request failed for ${address}`);
        const data = await response.json();
        if (data.features && data.features.length > 0) {
            const feature = data.features[0];
            const [lon, lat] = feature.geometry.coordinates;
            return {
                name: address, // Use the original user-provided address for cleaner display
                lat: lat,
                lon: lon,
            };
        }
        return null;
    } catch (error) {
        console.error(`Error geocoding address "${address}":`, error);
        return null;
    }
}

export async function getDistanceMatrixForLocations(addresses: string[]): Promise<DistanceMatrixResponse> {
    if (addresses.length < 2) {
        throw new Error("São necessários pelo menos dois locais.");
    }

    const geocodedLocations: LocationData[] = [];
    // Use a for...of loop to process geocoding requests sequentially.
    for (const address of addresses) {
        const locationData = await geocodeAddress(address);
        if (locationData) {
            geocodedLocations.push(locationData);
        } else {
            // This error is displayed to the user.
            throw new Error(`Não foi possível encontrar as coordenadas para o endereço: "${address}". Tente ser mais específico.`);
        }
    }
    
    if (geocodedLocations.length !== addresses.length) {
         throw new Error("Não foi possível geocodificar todos os locais para criar uma matriz.");
    }

    const coordinates = geocodedLocations.map(loc => `${loc.lon},${loc.lat}`).join(';');
    const url = `${OSRM_API_BASE}/table/v1/driving/${coordinates}?annotations=distance`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`OSRM API error: ${errorData.message || 'Unknown error'}`);
        }
        const data = await response.json();
        
        if (data.code !== 'Ok' || !data.distances) {
            throw new Error("A API de roteamento retornou uma resposta inválida.");
        }
        
        // OSRM returns distances in meters. Convert to kilometers.
        const distanceMatrixKm = data.distances.map((row: number[]) => 
            row.map((dist: number) => dist === null ? Infinity : dist / 1000)
        );

        return {
            locations: geocodedLocations,
            distanceMatrix: distanceMatrixKm,
        };
    } catch (error) {
        console.error("Error fetching distance matrix from OSRM:", error);
        throw new Error("Falha ao obter a matriz de distância do serviço de roteamento. Verifique a conexão e os locais.");
    }
}


export async function getMultipleRoutePathGeometries(orderedTour: { name: string, lat: number, lon: number }[]): Promise<Record<string, [number, number][]>> {
    const result: Record<string, [number, number][]> = {};

    // Process segments sequentially to respect potential API limits
    for (let i = 0; i < orderedTour.length - 1; i++) {
        const from = orderedTour[i];
        const to = orderedTour[i+1];
        const segmentKey = `${i}-${i+1}`;
        const fallbackPath: [number, number][] = [[from.lat, from.lon], [to.lat, to.lon]];

        const coordinates = `${from.lon},${from.lat};${to.lon},${to.lat}`;
        const url = `${OSRM_API_BASE}/route/v1/driving/${coordinates}?overview=full&geometries=geojson`;

        try {
            const response = await fetch(url);
            if (!response.ok) {
                console.warn(`Could not fetch route for segment ${segmentKey}, using straight line.`);
                result[segmentKey] = fallbackPath;
                continue;
            }

            const data = await response.json();
            if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
                const routeGeometry = data.routes[0].geometry.coordinates;
                // OSRM returns [lon, lat], Leaflet's Polyline needs [lat, lon].
                const leafletPath = routeGeometry.map((coord: [number, number]) => [coord[1], coord[0]]);
                result[segmentKey] = leafletPath;
            } else {
                 console.warn(`No route found for segment ${segmentKey}, using straight line.`);
                 result[segmentKey] = fallbackPath;
            }
        } catch (error) {
            console.error(`Error fetching route for segment ${segmentKey}:`, error);
            result[segmentKey] = fallbackPath;
        }
    }
    
    return result;
}