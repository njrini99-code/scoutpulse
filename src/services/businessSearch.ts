export interface BusinessSearchResult {
  name: string;
  formatted_address: string;
  place_id: string;
  rating?: number;
  user_ratings_total?: number;
  types?: string[];
  geometry?: {
    location: {
      lat: number;
      lng: number;
    };
  };
}

export interface BusinessDetails extends BusinessSearchResult {
  formatted_phone_number?: string;
  website?: string;
  address_components?: Array<{
    long_name: string;
    short_name: string;
    types: string[];
  }>;
}

export async function searchBusinesses(query: string): Promise<BusinessSearchResult[]> {
  if (query.length < 3) {
    return [];
  }

  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    console.log('Searching for:', query);
    console.log('Using URL:', `${supabaseUrl}/functions/v1/google-places-search`);

    const response = await fetch(
      `${supabaseUrl}/functions/v1/google-places-search?query=${encodeURIComponent(query)}`,
      {
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('Response status:', response.status);

    const data = await response.json();
    console.log('Response data:', data);

    if (data.error) {
      console.error('API error:', data.error);
      throw new Error(data.error);
    }

    if (data.results && data.results.length > 0) {
      console.log('Found', data.results.length, 'results');
      return data.results.slice(0, 10);
    }

    console.log('No results found');
    return [];
  } catch (error) {
    console.error('Error searching businesses:', error);
    throw error;
  }
}

export async function getBusinessDetails(placeId: string): Promise<BusinessDetails | null> {
  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    const response = await fetch(
      `${supabaseUrl}/functions/v1/google-places-search?placeId=${placeId}`,
      {
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const data = await response.json();

    if (data.result) {
      return data.result;
    }

    return null;
  } catch (error) {
    console.error('Error getting business details:', error);
    return null;
  }
}

export function parseAddressComponents(addressComponents: BusinessDetails['address_components']) {
  let city = '';
  let state = '';
  let zip: number | null = null;

  if (!addressComponents) {
    return { city, state, zip };
  }

  for (const component of addressComponents) {
    if (component.types.includes('locality')) {
      city = component.long_name;
    }
    if (component.types.includes('administrative_area_level_1')) {
      state = component.short_name;
    }
    if (component.types.includes('postal_code')) {
      zip = parseInt(component.long_name);
    }
  }

  return { city, state, zip };
}
