function extractServiceDetails(message) {
  const details = {};
  const lowerMessage = message.toLowerCase();
  
  // Date extraction
  const datePatterns = [
    /(?:today|tonight|this evening)/gi,
    /(?:tomorrow|tmrw)(?:\s+(?:morning|afternoon|evening))?/gi,
    /(?:this|next)\s+(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)/gi,
    /(?:this|next)\s+(?:week|weekend|month)/gi,
    /\b\d{1,2}\/\d{1,2}(?:\/\d{2,4})?\b/g,
    /\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{1,2}(?:st|nd|rd|th)?\b/gi
  ];
  
  for (const pattern of datePatterns) {
    const match = message.match(pattern);
    if (match) {
      details.dates = match[0];
      break;
    }
  }
  
  // Time extraction
  const timePatterns = [
    /\b\d{1,2}(?::\d{2})?\s*(?:am|pm)\b/gi,
    /\b(?:morning|afternoon|evening|noon|midnight)\b/gi,
    /\b\d{1,2}\s*(?:o'clock|oclock)\b/gi
  ];
  
  for (const pattern of timePatterns) {
    const match = message.match(pattern);
    if (match) {
      details.time = match[0];
      break;
    }
  }
  
  // Guest count extraction
  const guestPatterns = [
    /\b(\d+)\s+(?:people|person|guests?|passengers?|pax)\b/gi,
    /\bfor\s+(\d+)\b/gi,
    /\bparty\s+of\s+(\d+)\b/gi
  ];
  
  for (const pattern of guestPatterns) {
    const match = message.match(pattern);
    if (match) {
      details.guests = parseInt(match[1]);
      break;
    }
  }
  
  // Location extraction (enhanced for venues and pickup locations)
  const locationPatterns = [
    // Pickup patterns
    /(?:pickup|pick up|collect|start|leaving from|depart from)\s+([A-Za-z\s\',.-]+?)(?:\s+at|\s+@|\s+on|\s|$)/gi,
    // Venue names (hotels, casinos, landmarks)
    /(?:at|@)\s+([A-Za-z\s\',.-]+?)(?:\s+at|\s+on|\s|$)/gi,
    // General from/to patterns
    /(?:from|leaving)\s+([A-Za-z\s\',.-]+?)(?:\s+to|\s+for|\s|$)/gi,
  ];
  
  for (const pattern of locationPatterns) {
    const match = message.match(pattern);
    if (match) {
      // Clean up the captured location
      let location = match[1] || match[0];
      location = location.replace(/(?:pickup|pick up|collect|start|leaving from|depart from|at|@|from|leaving)\s*/gi, '');
      location = location.replace(/\s+(?:to|for|at|on).*$/gi, '');
      location = location.trim();
      
      if (location.length > 2) {
        details.location = location;
        break;
      }
    }
  }
  
  // Destination extraction (enhanced)
  const destinationPatterns = [
    /(?:to|going to|destination|drop off|end at)\s+([A-Za-z\s\',.-]+?)(?:\s|$)/gi,
    /(?:deliver to|take to|bring to)\s+([A-Za-z\s\',.-]+?)(?:\s|$)/gi
  ];
  
  for (const pattern of destinationPatterns) {
    const match = message.match(pattern);
    if (match) {
      let destination = match[1] || match[0];
      destination = destination.replace(/(?:to|going to|destination|drop off|end at|deliver to|take to|bring to)\s*/gi, '');
      destination = destination.trim();
      
      if (destination.length > 2) {
        details.destination = destination;
        break;
      }
    }
  }
  
  // Budget extraction
  const budgetPatterns = [
    /\$[\d,]+(?:\.\d{2})?/g,
    /\b(?:budget|spend|cost)\s+(?:is|of|around)?\s*\$?[\d,]+/gi,
    /\bunder\s+\$?[\d,]+/gi,
    /\bno\s+budget\s+(?:limit|constraints?)/gi
  ];
  
  for (const pattern of budgetPatterns) {
    const match = message.match(pattern);
    if (match) {
      details.budget = match[0];
      break;
    }
  }
  
  // Special requests (luxury terms)
  const specialRequestPatterns = [
    /(?:catering|food|meals?|dining)/gi,
    /(?:champagne|wine|drinks?)/gi,
    /(?:flowers|roses|decorations?)/gi,
    /(?:music|entertainment|dj)/gi,
    /(?:photography|photos?)/gi,
    /(?:special|custom|bespoke|unique)/gi,
    /(?:vip|bottle service|private)/gi
  ];
  
  const specialRequests = [];
  for (const pattern of specialRequestPatterns) {
    const matches = message.match(pattern);
    if (matches) {
      specialRequests.push(...matches);
    }
  }
  
  if (specialRequests.length > 0) {
    details.special_requests = Array.from(new Set(specialRequests)).join(', ');
  }
  
  return details;
}

module.exports = { extractServiceDetails }; 