/**
 * Web search functionality using Tavily API
 */

export async function searchWeb(query: string): Promise<{
  results: Array<{
    title: string;
    url: string;
    content: string;
    score: number;
  }>;
  query: string;
  totalResults: number;
}> {
  try {
    // Use Tavily API if available, otherwise return mock results for MVP
    if (process.env.TAVILY_API_KEY) {
      const response = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Api-Key': process.env.TAVILY_API_KEY
        },
        body: JSON.stringify({
          query: query,
          search_depth: 'advanced',
          include_answer: true,
          include_raw_content: false,
          max_results: 5,
          include_domains: [],
          exclude_domains: []
        })
      });

      if (response.ok) {
        const data = await response.json();
        return {
          results: data.results.map((result: any) => ({
            title: result.title,
            url: result.url,
            content: result.content,
            score: result.score || 0.5
          })),
          query,
          totalResults: data.results.length
        };
      }
    }

    // Fallback for MVP - return simulated search results
    return {
      results: [
        {
          title: `Current information about ${query}`,
          url: 'https://example.com',
          content: `Based on current trends and information, here are key insights about ${query}. This is a simulated result for MVP demonstration.`,
          score: 0.8
        }
      ],
      query,
      totalResults: 1
    };

  } catch (error) {
    console.error('Search error:', error);
    return {
      results: [],
      query,
      totalResults: 0
    };
  }
} 