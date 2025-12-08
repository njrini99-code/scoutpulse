import { searchWithSerper } from './serper';
import { analyzeWithOpenAI } from './openai';

export interface EmailEnrichmentResult {
  email: string;
  confidence: number;
  source?: string;
  type: 'personal' | 'business';
}

async function buildEmailSearchQueries(
  personName: string,
  businessName: string,
  city: string,
  state: string,
  website?: string
): Promise<string[]> {
  const location = `${city}, ${state}`;
  const queries: string[] = [];

  queries.push(`${personName} ${businessName} ${location} email contact`);

  queries.push(`${personName} email ${businessName}`);

  queries.push(`site:linkedin.com/in ${personName} ${businessName} email`);

  if (website) {
    const domain = website.replace(/^https?:\/\//, '').replace(/\/$/, '');
    queries.push(`site:${domain} ${personName} email contact`);
    queries.push(`site:${domain} contact email`);
    queries.push(`site:${domain} "contact us" OR "get in touch"`);
  }

  queries.push(`${businessName} ${location} contact email phone`);

  queries.push(`${businessName} ${location} "email" OR "contact" OR "reach us"`);

  queries.push(`"${businessName}" ${state} email address contact information`);

  return queries;
}

export async function findEmail(
  personName: string,
  businessName: string,
  city: string,
  state: string,
  website?: string
): Promise<EmailEnrichmentResult | null> {
  try {
    const queries = await buildEmailSearchQueries(personName, businessName, city, state, website);
    const location = `${city}, ${state}`;

    let allResults: any[] = [];

    for (const query of queries) {
      const results = await searchWithSerper(query, 10);
      if (results && results.length > 0) {
        allResults = allResults.concat(results);
      }
      if (allResults.length >= 20) break;
    }

    if (allResults.length === 0) {
      return null;
    }

    const uniqueResults = allResults
      .filter((result, index, self) =>
        index === self.findIndex((r) => r.link === result.link)
      )
      .slice(0, 20);

    const context_text = uniqueResults
      .map((result) => `${result.title}\n${result.snippet}`)
      .join('\n\n');

    const prompt = `You are an expert at finding email addresses from search results. Analyze the following search results for "${personName}" at "${businessName}" in ${location}.

Search Results:
${context_text}

Your task:
1. FIRST: Look for personal email addresses for ${personName} (e.g., from LinkedIn, company website bio)
2. SECOND: If no personal email is found, look for ANY business contact email (info@, contact@, sales@, support@, or any email on their website/contact page)
3. Extract valid email addresses (must contain @ and a domain)
4. Determine if the email is "personal" (belongs to ${personName}) or "business" (general contact email)
5. Rate confidence 0-100 based on how certain you are this is the correct email

Confidence guidelines:
- 95-100: Email explicitly shown on LinkedIn or company website with person's name
- 85-94: Email found on verified source (company website, professional directory) matching person
- 70-84: Business email found on official website or contact page
- 50-69: Email mentioned but unclear if it's current or belongs to the right person
- Below 50: Too uncertain or email seems outdated/incorrect

CRITICAL REQUIREMENTS:
- ALWAYS try to return an email address if ANY email is found in the search results
- Personal email for ${personName} is preferred, but ANY valid business email is acceptable
- Look for common patterns: info@, contact@, hello@, sales@, support@, etc.
- Check the business website contact page, footer, or about page for emails
- Do not return null unless you find absolutely NO email addresses in the search results
- Do not guess or infer email addresses that aren't explicitly shown

Respond in valid JSON format:
{
  "email": "email@example.com",
  "confidence": 85,
  "type": "personal",
  "reasoning": "Brief explanation of where you found the email and why you chose it"
}

If absolutely no email is found anywhere in the search results, respond with:
{
  "email": null,
  "confidence": 0,
  "reasoning": "Explanation of what you searched for"
}`;

    const analysis = await analyzeWithOpenAI(prompt);

    if (!analysis) {
      return null;
    }

    try {
      const parsed = JSON.parse(analysis);

      if (!parsed.email || parsed.confidence === 0) {
        return null;
      }

      return {
        email: parsed.email,
        confidence: Math.min(100, Math.max(0, parsed.confidence)),
        source: uniqueResults[0]?.link,
        type: parsed.type || 'business',
      };
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', parseError);
      return null;
    }
  } catch (error) {
    console.error('Error finding email:', error);
    return null;
  }
}
