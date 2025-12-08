const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

export interface EmailGenerationRequest {
  businessName: string;
  industry?: string;
  ownerName?: string;
  painPoints?: string;
  competitor?: string;
  emailType: 'outreach' | 'follow-up' | 'proposal' | 'closing';
}

export async function generateEmail(request: EmailGenerationRequest): Promise<string | null> {
  try {
    const prompt = buildEmailPrompt(request);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content:
              'You are a professional sales email writer. Write compelling, personalized emails that are concise and action-oriented.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    const data = await response.json();
    return data.choices[0]?.message?.content || null;
  } catch (error) {
    console.error('Email generation error:', error);
    return null;
  }
}

function buildEmailPrompt(request: EmailGenerationRequest): string {
  const { businessName, industry, ownerName, painPoints, competitor, emailType } = request;

  let prompt = `Write a ${emailType} email to ${businessName}`;

  if (industry) prompt += ` in the ${industry} industry`;
  if (ownerName) prompt += `. Address it to ${ownerName}`;
  if (painPoints) prompt += `. Address these pain points: ${painPoints}`;
  if (competitor) prompt += `. They currently use ${competitor}`;

  prompt += '. Keep it professional, concise (under 150 words), and include a clear call to action.';

  return prompt;
}

export async function generateLeadInsights(leads: any[]): Promise<string | null> {
  try {
    const summary = {
      totalLeads: leads.length,
      industries: [...new Set(leads.map((l) => l.industry).filter(Boolean))],
      topZips: [...new Set(leads.map((l) => l.zip).filter(Boolean))].slice(0, 5),
      avgDealValue:
        leads.reduce((sum, l) => sum + (l.deal_value || 0), 0) / leads.filter((l) => l.deal_value).length,
    };

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a sales analytics expert. Provide actionable insights from sales data.',
          },
          {
            role: 'user',
            content: `Analyze this sales data and provide 3-5 key insights and recommendations: ${JSON.stringify(
              summary
            )}`,
          },
        ],
        temperature: 0.7,
        max_tokens: 400,
      }),
    });

    const data = await response.json();
    return data.choices[0]?.message?.content || null;
  } catch (error) {
    console.error('Lead insights error:', error);
    return null;
  }
}

export async function analyzeWithOpenAI(prompt: string): Promise<string | null> {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert business intelligence analyst specializing in identifying business owners and decision makers. You are precise, thorough, and only report information you can verify from the provided sources.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.1,
        max_tokens: 500,
        response_format: { type: 'json_object' },
      }),
    });

    const data = await response.json();
    return data.choices[0]?.message?.content || null;
  } catch (error) {
    console.error('OpenAI analysis error:', error);
    return null;
  }
}
