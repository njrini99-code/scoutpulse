import { searchWithSerper } from './serper';
import { analyzeWithOpenAI } from './openai';
import { findEmail, EmailEnrichmentResult } from './emailEnrichment';

export interface DecisionMakerResult {
  name: string;
  title?: string;
  confidence: number;
  source?: string;
  emailResult?: EmailEnrichmentResult;
}

interface BusinessContext {
  businessName: string;
  address?: string;
  city?: string;
  state: string;
  website?: string;
  industry?: string;
}

function detectIndustry(businessName: string): string | undefined {
  const name = businessName.toLowerCase();

  if (name.includes('restaurant') || name.includes('cafe') || name.includes('grill') ||
      name.includes('pizza') || name.includes('bar') || name.includes('diner') ||
      name.includes('bistro') || name.includes('kitchen') || name.includes('eatery')) {
    return 'restaurant';
  }

  if (name.includes('salon') || name.includes('spa') || name.includes('barber')) {
    return 'salon';
  }

  if (name.includes('auto') || name.includes('repair') || name.includes('tire') ||
      name.includes('mechanic') || name.includes('service')) {
    return 'automotive';
  }

  if (name.includes('retail') || name.includes('store') || name.includes('shop') ||
      name.includes('boutique') || name.includes('mart')) {
    return 'retail';
  }

  if (name.includes('manufacturing') || name.includes('factory') || name.includes('plant')) {
    return 'manufacturing';
  }

  if (name.includes('law') || name.includes('attorney') || name.includes('legal')) {
    return 'legal';
  }

  if (name.includes('medical') || name.includes('clinic') || name.includes('dental') ||
      name.includes('health') || name.includes('doctor')) {
    return 'healthcare';
  }

  return undefined;
}

function getIndustrySpecificTitles(industry?: string): string[] {
  switch (industry) {
    case 'restaurant':
      return ['owner', 'chef owner', 'proprietor', 'executive chef', 'managing partner'];
    case 'salon':
      return ['owner', 'salon owner', 'master stylist', 'proprietor'];
    case 'automotive':
      return ['owner', 'shop owner', 'service manager', 'proprietor'];
    case 'retail':
      return ['owner', 'store owner', 'franchisee', 'proprietor', 'managing partner'];
    case 'manufacturing':
      return ['owner', 'CEO', 'president', 'plant manager', 'operations director'];
    case 'legal':
      return ['managing partner', 'senior partner', 'founder', 'principal'];
    case 'healthcare':
      return ['owner', 'medical director', 'practice owner', 'principal physician'];
    default:
      return ['owner', 'CEO', 'president', 'founder', 'managing partner'];
  }
}

function buildSearchQueries(context: BusinessContext): string[] {
  const { businessName, address, city, state, website, industry } = context;
  const location = address || (city ? `${city}, ${state}` : state);
  const industryTitles = getIndustrySpecificTitles(industry);

  const queries: string[] = [];

  // First query without quotes for broader matching
  queries.push(`${businessName} ${location} owner name`);

  // Second query with quotes for exact match
  queries.push(`"${businessName}" ${location} owner`);

  queries.push(`${businessName} ${location} ${industryTitles.slice(0, 3).join(' ')}`);

  queries.push(`${businessName} ${location} contact management team`);

  queries.push(`${businessName} ${state} LinkedIn owner CEO`);

  queries.push(`site:linkedin.com/in "${businessName}" ${location}`);

  if (website) {
    const domain = website.replace(/^https?:\/\//, '').replace(/\/$/, '');
    queries.push(`site:${domain} owner about team`);
  }

  queries.push(`"${businessName}" ${location} "owned by" OR "founded by" OR "managed by"`);

  return queries;
}

async function verifyDecisionMaker(
  name: string,
  businessName: string,
  location: string
): Promise<number> {
  try {
    const verificationQuery = `"${name}" "${businessName}" ${location}`;
    const results = await searchWithSerper(verificationQuery, 5);

    if (results.length === 0) {
      return 0;
    }

    const combinedText = results
      .map(r => `${r.title} ${r.snippet}`)
      .join(' ')
      .toLowerCase();

    let verificationScore = 0;

    if (combinedText.includes(name.toLowerCase()) &&
        combinedText.includes(businessName.toLowerCase())) {
      verificationScore += 30;
    }

    const ownershipKeywords = ['owner', 'ceo', 'president', 'founder', 'manages', 'owns'];
    const keywordMatches = ownershipKeywords.filter(keyword =>
      combinedText.includes(keyword)
    ).length;
    verificationScore += Math.min(keywordMatches * 10, 20);

    return verificationScore;
  } catch (error) {
    console.error('Verification search error:', error);
    return 0;
  }
}

function extractKnowledgeGraphInfo(knowledgeGraph: any): string {
  if (!knowledgeGraph) return '';

  const info: string[] = [];

  if (knowledgeGraph.title) {
    info.push(`Business: ${knowledgeGraph.title}`);
  }

  if (knowledgeGraph.type) {
    info.push(`Type: ${knowledgeGraph.type}`);
  }

  if (knowledgeGraph.description) {
    info.push(`Description: ${knowledgeGraph.description}`);
  }

  if (knowledgeGraph.attributes) {
    const attrs = knowledgeGraph.attributes;
    if (attrs.founder || attrs.founders) {
      info.push(`Founder: ${attrs.founder || attrs.founders}`);
    }
    if (attrs.ceo || attrs.CEO) {
      info.push(`CEO: ${attrs.ceo || attrs.CEO}`);
    }
    if (attrs.president) {
      info.push(`President: ${attrs.president}`);
    }
  }

  return info.length > 0 ? `\n\nKNOWLEDGE GRAPH DATA:\n${info.join('\n')}` : '';
}

export async function findDecisionMaker(
  businessName: string,
  city: string,
  state: string,
  address?: string,
  website?: string
): Promise<DecisionMakerResult | null> {
  try {
    const industry = detectIndustry(businessName);
    const context: BusinessContext = {
      businessName,
      address,
      city,
      state,
      website,
      industry,
    };

    const location = address || (city ? `${city}, ${state}` : state);
    const queries = buildSearchQueries(context);

    let allResults: any[] = [];
    let knowledgeGraphData = '';

    for (const query of queries) {
      const results = await searchWithSerper(query, 10);
      if (results && results.length > 0) {
        if (results[0].knowledgeGraph && !knowledgeGraphData) {
          knowledgeGraphData = extractKnowledgeGraphInfo(results[0].knowledgeGraph);
        }
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

    const fullContext = context_text + knowledgeGraphData;

    const industryTitles = getIndustrySpecificTitles(industry);

    const prompt = `You are an expert at finding business owners and decision makers from search results. Analyze the following search results about "${businessName}" in ${location}.

Search Results:
${fullContext}

Business Context:
- Industry: ${industry || 'general'}
- Common titles in this industry: ${industryTitles.join(', ')}
- Location: ${location}

Your task:
1. Look for explicit mentions of ${industryTitles.join(', ')}, or other senior decision makers
2. Check for phrases like "owned by", "founded by", "managed by", followed by a name
3. Pay special attention to LinkedIn profiles, About pages, and official business descriptions
4. Extract the person's full name (first and last name required - no initials or single names)
5. Identify their title/role if mentioned
6. If Knowledge Graph data is present, prioritize that information as it's from Google's verified sources
7. Rate confidence 0-100 based on how certain you are this is the correct decision maker

Confidence guidelines:
- 95-100: Name explicitly stated in Knowledge Graph or verified source as "owner", "CEO", "founder"
- 85-94: Name on LinkedIn profile or company website as owner/CEO with business name
- 70-84: Name mentioned with senior title like "president", "managing partner" from reliable source
- 50-69: Name mentioned in context but role is less clear or source is less authoritative
- Below 50: Too uncertain or name not clearly connected to the business

IMPORTANT:
- Only return a result if you find a FULL name (first + last).
- Do not guess or infer.
- Prioritize verified sources like LinkedIn, official websites, and Knowledge Graph data
- For restaurants, "chef owner" or "executive chef" are often the decision makers
- Ignore names that are clearly employees, not owners/decision makers

Respond in valid JSON format:
{
  "name": "First Last",
  "title": "Owner",
  "confidence": 85,
  "reasoning": "Brief explanation of why you chose this person and what source confirmed it"
}

If no clear decision maker is found with a full name, respond with:
{
  "name": null,
  "confidence": 0,
  "reasoning": "Explanation of what you found or didn't find"
}`;

    const analysis = await analyzeWithOpenAI(prompt);

    if (!analysis) {
      return null;
    }

    try {
      const parsed = JSON.parse(analysis);

      if (!parsed.name || parsed.confidence === 0) {
        return null;
      }

      const verificationBoost = await verifyDecisionMaker(
        parsed.name,
        businessName,
        location
      );

      const adjustedConfidence = Math.min(100, parsed.confidence + verificationBoost);

      const emailResult = await findEmail(
        parsed.name,
        businessName,
        city,
        state,
        website
      );

      return {
        name: parsed.name,
        title: parsed.title || undefined,
        confidence: Math.min(100, Math.max(0, adjustedConfidence)),
        source: uniqueResults[0]?.link,
        emailResult: emailResult || undefined,
      };
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', parseError);
      return null;
    }
  } catch (error) {
    console.error('Error finding decision maker:', error);
    return null;
  }
}
