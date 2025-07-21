import type { Station } from '../types';

const API_BASE_URL = 'https://de1.api.radio-browser.info/json';

export const searchStations = async (searchTerm: string): Promise<Station[]> => {
  if (!searchTerm) {
    return [];
  }
  try {
    const nameSearchUrl = `${API_BASE_URL}/stations/search?name=${encodeURIComponent(searchTerm)}&limit=100&hidebroken=true&order=clickcount&reverse=true`;
    const tagSearchUrl = `${API_BASE_URL}/stations/search?tag=${encodeURIComponent(searchTerm)}&limit=100&hidebroken=true&order=clickcount&reverse=true`;

    const [nameResponse, tagResponse] = await Promise.all([
      fetch(nameSearchUrl),
      fetch(tagSearchUrl),
    ]);
    
    // Gracefully handle failed requests by treating them as empty results
    const nameResults: Station[] = nameResponse.ok ? await nameResponse.json() : [];
    const tagResults: Station[] = tagResponse.ok ? await tagResponse.json() : [];

    // Merge results and remove duplicates using stationuuid
    const combinedResults: { [key: string]: Station } = {};

    const allResults = [...nameResults, ...tagResults];

    for (const station of allResults) {
      if (station.url_resolved) { // Ensure station is playable
        combinedResults[station.stationuuid] = station;
      }
    }

    const uniqueStations = Object.values(combinedResults);

    // The API already sorts by clickcount, but merging messes up the order.
    // Re-sort by votes as a good measure of popularity/relevance.
    uniqueStations.sort((a, b) => b.votes - a.votes);

    return uniqueStations;

  } catch (error) {
    console.error("Failed to search stations:", error);
    throw error;
  }
};

export const getTopStations = async (): Promise<Station[]> => {
    try {
        const response = await fetch(
            `${API_BASE_URL}/stations/topclick/20?hidebroken=true`
        );
        if (!response.ok) {
            throw new Error(`API error: ${response.statusText}`);
        }
        const data: Station[] = await response.json();
        return data.filter(station => station.url_resolved);
    } catch (error) {
        console.error("Failed to fetch top stations:", error);
        throw error;
    }
};
