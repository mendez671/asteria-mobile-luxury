import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json();
    
    if (!query) {
      return NextResponse.json({ error: 'Search query is required' }, { status: 400 });
    }

    if (!process.env.TAVILY_API_KEY) {
      return NextResponse.json({ error: 'Tavily API key not configured' }, { status: 500 });
    }

    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.TAVILY_API_KEY}`,
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