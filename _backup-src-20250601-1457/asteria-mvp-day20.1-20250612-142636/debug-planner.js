/**
 * Debug script to test the IntentPlanner directly
 */

// Simple test without imports
function debugKeywordMatching() {
  const message = "I need a private jet from NYC to London tomorrow for 3 people, urgent business meeting";
  const lowerMessage = message.toLowerCase();
  
  const bucketKeywords = {
    transportation: [
      'travel', 'flight', 'fly', 'jet', 'aviation', 'private plane', 'charter',
      'car', 'driver', 'chauffeur', 'transport', 'limousine', 'uber', 'ride',
      'yacht', 'boat', 'marine', 'sailing', 'cruise', 'helicopter'
    ],
    brandDev: [
      'brand', 'branding', 'marketing', 'pr', 'publicity', 'media',
      'reputation', 'image', 'profile', 'positioning', 'strategy',
      'digital', 'social media', 'linkedin', 'personal brand',
      'thought leadership', 'speaking', 'consulting', 'advisory'
    ]
  };

  console.log('🔍 Message:', message);
  console.log('🔍 Lower:', lowerMessage);
  
  Object.entries(bucketKeywords).forEach(([bucket, keywords]) => {
    console.log(`\n📋 ${bucket.toUpperCase()}:`);
    let matches = [];
    
    keywords.forEach(keyword => {
      const keywordLower = keyword.toLowerCase();
      
      // Use word boundary matching for better precision
      let isMatch = false;
      
      if (keyword.includes(' ')) {
        // For phrases, use exact phrase matching
        isMatch = lowerMessage.includes(keywordLower);
      } else {
        // For single words, use word boundary regex
        const wordBoundaryRegex = new RegExp(`\\b${keywordLower}\\b`, 'i');
        isMatch = wordBoundaryRegex.test(lowerMessage);
      }
      
      if (isMatch) {
        matches.push(keyword);
      }
    });
    
    console.log('   Matches:', matches.length > 0 ? matches : 'NONE');
  });
}

debugKeywordMatching(); 