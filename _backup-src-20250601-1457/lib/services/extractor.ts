import { ServiceBucket } from './classifier';

export interface ServiceDetails {
  dates?: string;
  time?: string;
  guests?: number;
  location?: string;
  destination?: string;
  budget?: string;
  special_requests?: string;
  [key: string]: any;
}

export function extractServiceDetails(message: string, bucket: ServiceBucket): ServiceDetails {
  const details: ServiceDetails = {};
  const lowerMessage = message.toLowerCase();
  
  // Date extraction
  const datePatterns = [
    /(?:today|tonight|this evening)/gi,
    /(?:tomorrow|tmrw)(?:\s+(?:morning|afternoon|evening))?/gi,
    /(?:this|next)\s+(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)/gi,
    /(?:this|next)\s+(?:week|weekend|month)/gi,
    /\b\d{1,2}\/\d{1,2}(?:\/\d{2,4})?\b/g, // MM/DD or MM/DD/YY
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
  
  // Location extraction (from/to patterns)
  const locationPatterns = [
    /(?:from|leaving)\s+([A-Za-z\s]+?)(?:\s+to|\s+for|$)/gi,
    /(?:to|going to|destination)\s+([A-Za-z\s]+?)(?:\s|$)/gi,
    /(?:in|at)\s+([A-Za-z\s]+?)(?:\s|$)/gi
  ];
  
  for (const pattern of locationPatterns) {
    const match = message.match(pattern);
    if (match) {
      if (pattern.source.includes('from|leaving')) {
        details.location = match[1].trim();
      } else {
        details.destination = match[1].trim();
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
  
  // Special requests (look for specific luxury terms)
  const specialRequestPatterns = [
    /(?:catering|food|meals?|dining)/gi,
    /(?:champagne|wine|drinks?)/gi,
    /(?:flowers|roses|decorations?)/gi,
    /(?:music|entertainment|dj)/gi,
    /(?:photography|photos?)/gi,
    /(?:special|custom|bespoke|unique)/gi
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