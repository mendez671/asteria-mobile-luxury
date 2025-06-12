import { NextRequest, NextResponse } from 'next/server';
import { getTavilyKey } from '@/lib/utils/secrets';

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json();
    
    if (!query) {
      return NextResponse.json({ error: 'Search query is required' }, { status: 400 });
    }

    // Get Tavily API key from Secret Manager
    const tavilyApiKey = await getTavilyKey();

    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tavilyApiKey}`,
      },
      body: JSON.stringify({
        query,
        search_depth: 'basic',
        include_answer: true,
        include_domains: [],
        exclude_domains: [],
        max_results: 5,
      }),
    });

    if (!response.ok) {
      throw new Error(`Tavily API error: ${response.status}`);
    }

    const searchResults = await response.json();
    
    return NextResponse.json({
      results: searchResults.results || [],
      answer: searchResults.answer || null,
      success: true
    });

  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json(
      { error: 'Search request failed' },
      { status: 500 }
    );
  }
} 