const SERPER_API_KEY = import.meta.env.VITE_SERPER_API_KEY;

export interface BusinessEnrichmentResult {
  website?: string;
  phone?: string;
  email?: string;
  description?: string;
}

export async function enrichBusinessData(
  businessName: string,
  city?: string,
  state?: string
): Promise<BusinessEnrichmentResult | null> {
  try {
    const query = `${businessName}${city ? ` ${city}` : ''}${state ? ` ${state}` : ''}`;

    const response = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: {
        'X-API-KEY': SERPER_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: query,
        num: 3,
      }),
    });

    const data = await response.json();

    if (data.organic && data.organic.length > 0) {
      const topResult = data.organic[0];
      const result: BusinessEnrichmentResult = {};

      if (topResult.link) {
        result.website = topResult.link;
      }

      if (topResult.snippet) {
        result.description = topResult.snippet;
      }

      const phoneMatch = topResult.snippet?.match(/(\+?1?[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
      if (phoneMatch) {
        result.phone = phoneMatch[0];
      }

      const emailMatch = topResult.snippet?.match(/[\w.-]+@[\w.-]+\.\w+/);
      if (emailMatch) {
        result.email = emailMatch[0];
      }

      return result;
    }

    return null;
  } catch (error) {
    console.error('Business enrichment error:', error);
    return null;
  }
}

export async function findCompetitorInfo(competitorName: string): Promise<string | null> {
  try {
    const response = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: {
        'X-API-KEY': SERPER_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: `${competitorName} company information`,
        num: 1,
      }),
    });

    const data = await response.json();

    if (data.organic && data.organic.length > 0) {
      return data.organic[0].snippet || null;
    }

    return null;
  } catch (error) {
    console.error('Competitor info error:', error);
    return null;
  }
}

export interface SearchResult {
  title: string;
  snippet: string;
  link: string;
  knowledgeGraph?: any;
}

export async function searchWithSerper(query: string, numResults: number = 10): Promise<SearchResult[]> {
  try {
    if (!SERPER_API_KEY) {
      console.error('Serper API key is missing');
      return [];
    }

    const response = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: {
        'X-API-KEY': SERPER_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: query,
        num: numResults,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Serper API error:', response.status, errorText);
      return [];
    }

    const data = await response.json();

    const results: SearchResult[] = [];

    if (data.organic && data.organic.length > 0) {
      const organicResults = data.organic.map((result: any) => ({
        title: result.title || '',
        snippet: result.snippet || '',
        link: result.link || '',
      }));
      results.push(...organicResults);
    }

    if (data.knowledgeGraph && results.length > 0) {
      results[0].knowledgeGraph = data.knowledgeGraph;
    }

    return results;
  } catch (error) {
    console.error('Serper search error:', error);
    return [];
  }
}
