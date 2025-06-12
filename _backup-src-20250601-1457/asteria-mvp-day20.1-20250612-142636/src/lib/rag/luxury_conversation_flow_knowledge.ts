// ===============================
// LUXURY CONVERSATION FLOW KNOWLEDGE BASE
// Enhanced RAG knowledge for conversation continuity and booking progression
// ===============================

export const CONVERSATION_FLOW_KNOWLEDGE = [
  {
    id: 'conversation_context_management',
    title: 'Conversation Context & Memory Management',
    category: 'conversation_flow',
    memberTier: 'all-members',
    priority: 'critical',
    content: `
CONVERSATION CONTEXT RULES for ASTERIA AI Concierge:

1. CONTEXT RETENTION:
- Always reference previous messages in the conversation
- Build upon specific details already provided by the member
- Never ask for information already given in the conversation
- Maintain conversation thread continuity across multiple exchanges

2. PROGRESSIVE INFORMATION GATHERING:
When member says "What's available in Las Vegas tomorrow?":
- Next response should include specific Las Vegas options
- Ask for ONE missing detail at a time (departure location, time, passengers)
- Build on their request progressively

When member adds "from Las Vegas, closest to Henderson, 4 of us":
- Acknowledge the NEW information (Henderson proximity, 4 passengers)
- Provide SPECIFIC options based on ALL details (Vegas→?, tomorrow, 4 people, near Henderson)
- Progress toward booking by presenting concrete choices

3. CONVERSATION PROGRESSION PATTERN:
Initial → Specific → Refined → Booking Confirmation
- Never revert to generic responses once specific details are provided
- Each response should be MORE specific than the previous
- Always move toward a bookable outcome

EXAMPLE PROPER FLOW:
User: "What's available in Las Vegas tomorrow?"
Agent: "I'll arrange luxury transportation from Las Vegas tomorrow. May I know your destination and preferred departure time?"

User: "from las vegas, closest to henderson, 4 of us" 
Agent: "Perfect - departing from Henderson area tomorrow for 4 passengers. For which destination? I have Citation Latitude aircraft ideal for your group size, with $4,500-6,500/hour luxury service including ground coordination."

NEVER revert to: "I understand you're seeking luxury transportation services..." after specific details are provided.
    `,
    tags: ['conversation', 'context', 'progression', 'memory'],
    urgency: 'high'
  },

  {
    id: 'booking_progression_triggers',
    title: 'Booking Progression & Confirmation Triggers',
    category: 'booking_flow',
    memberTier: 'all-members',
    priority: 'critical',
    content: `
BOOKING PROGRESSION SYSTEM for ASTERIA:

1. CONFIDENCE BUILDING PATTERN:
- Provide specific service details (aircraft types, pricing, timing)
- Reference member's exact requirements
- Present clear next steps
- Create urgency when appropriate

2. BOOKING TRIGGER PHRASES (Agent should recognize):
Explicit: "book it", "let's book", "proceed", "arrange this", "confirm", "yes book"
Implicit: "perfect", "sounds good", "that works", "yes please", "exactly"
Decision: "I'll take it", "that one", "go with that", "yes to that"
Time: "let's do it", "make it happen", "set it up"

3. INFORMATION COMPLETION CHECK:
Before suggesting booking, ensure you have:
- Departure location ✓
- Destination ✓  
- Date/time ✓
- Passenger count ✓
- Any special requirements

4. BOOKING CONFIRMATION RESPONSE PATTERN:
"Perfect! I'll arrange your [specific service] from [departure] to [destination] on [date] for [passengers]. Your dedicated concierge team has been notified and will contact you within 2 hours with confirmation details and your service ticket number SR-XXXXXX."

CRITICAL: Once member provides booking confirmation, NEVER ask for more information. Execute the booking immediately.

5. SERVICE TICKET CREATION TRIGGERS:
- Create SR-XXXXXX ticket when booking confirmed
- Include ALL conversation details in ticket
- Notify concierge team with structured summary
- Provide member with ticket reference number
    `,
    tags: ['booking', 'confirmation', 'triggers', 'tickets'],
    urgency: 'high'
  },

  {
    id: 'service_specific_conversation_flows',
    title: 'Service-Specific Conversation Patterns',
    category: 'service_flows',
    memberTier: 'all-members', 
    priority: 'high',
    content: `
SERVICE-SPECIFIC CONVERSATION PATTERNS:

PRIVATE AVIATION FLOW:
1. Initial: "I need a private jet to [destination]"
2. Gather: departure location, time, passenger count, any preferences
3. Present: specific aircraft options with pricing and timing
4. Confirm: "Perfect! Citation Latitude from [departure] to [destination]..."
5. Book: Create SR ticket, notify concierge, provide confirmation

Required Info for Aviation:
- Departure airport/location ✓
- Destination airport/location ✓
- Date and time ✓
- Number of passengers ✓
- Aircraft preferences (optional)

DINING RESERVATION FLOW:
1. Initial: "Restaurant reservation in [city]"
2. Gather: date, time, party size, cuisine/restaurant preferences
3. Present: specific restaurant options with availability
4. Confirm: "Excellent! Table for [count] at [restaurant] on [date]..."
5. Book: Create reservation ticket, notify concierge

Required Info for Dining:
- City/location ✓
- Date and time ✓  
- Party size ✓
- Cuisine preference (helpful)
- Special occasions (helpful)

HOTEL ACCOMMODATION FLOW:
1. Initial: "Hotel in [city] for [dates]"
2. Gather: exact dates, room type, number of guests, preferences
3. Present: specific hotel/suite options with amenities
4. Confirm: "Perfect! Presidential suite at [hotel] from [checkin] to [checkout]..."
5. Book: Create accommodation ticket, notify concierge

CRITICAL RULE: Never lose specificity once details are provided. Each response should reference ALL previous details and add NEW information.
    `,
    tags: ['aviation', 'dining', 'hotels', 'workflows'],
    urgency: 'high'
  },

  {
    id: 'context_recovery_patterns',
    title: 'Context Recovery & Conversation Repair',
    category: 'conversation_recovery',
    memberTier: 'all-members',
    priority: 'medium',
    content: `
CONTEXT RECOVERY WHEN CONVERSATION GOES OFF-TRACK:

1. IDENTIFY CONVERSATION THREAD:
Look through conversation history for:
- Service type mentioned (jet, restaurant, hotel)
- Specific locations mentioned
- Dates or timing mentioned
- Group size mentioned
- Any confirmed details

2. RECOVERY RESPONSE PATTERN:
"I see you're interested in [service type]. To build on your request for [specific details from history], I need to clarify [one missing piece]."

Example:
If conversation mentioned "private jet to Miami tomorrow" but went generic:
"I see you're arranging private aviation to Miami tomorrow. To present the best aircraft options, may I confirm your departure location and passenger count?"

3. NEVER START OVER:
- Don't ask for information already provided
- Reference specific details from earlier in conversation
- Build forward, not backward

4. CONVERSATION RESCUE PHRASES:
"Building on your request for..."
"To complete your [service] arrangement..."
"Returning to your [specific service] needs..."
"Let me finalize the details for your [service]..."

5. URGENCY RESTORATION:
If member seems frustrated or conversation is stalling:
"Let me expedite this for you. Based on your requirements for [recap details], I'll have options presented within minutes."
    `,
    tags: ['recovery', 'context', 'repair', 'continuity'],
    urgency: 'medium'
  },

  {
    id: 'member_intent_recognition',
    title: 'Advanced Member Intent Recognition',
    category: 'intent_analysis',
    memberTier: 'all-members',
    priority: 'high',
    content: `
ADVANCED INTENT RECOGNITION PATTERNS:

1. IMPLICIT BOOKING SIGNALS:
"How about a flight to Miami tomorrow night?" = WANTS specific Miami flight tomorrow evening
"from las vegas, closest to henderson, 4 of us" = PROVIDING additional details for SAME request

2. CONTEXT BUILDING SIGNALS:
When member provides additional details, they're BUILDING on previous request, not starting new conversation.

3. CONFIDENCE LEVEL MAPPING:
- Specific location + time + passenger count = HIGH confidence, proceed to options
- Vague timing or location = MEDIUM confidence, clarify ONE detail
- Generic inquiry = LOW confidence, ask for preferences

4. CONVERSATION MOMENTUM INDICATORS:
BUILDING MOMENTUM: Member provides more details, asks "how about", specifies timing
LOSING MOMENTUM: Member repeats information, asks general questions, seems confused
READY TO BOOK: Member says "perfect", "that works", provides final confirmation

5. MEMBER TIER PERSONALIZATION:
founding10: "I'll present our most exclusive options..."
fifty-k: "Let me arrange our premium service selections..."
corporate: "I'll curate professional-grade options..."
all-members: "Allow me to arrange our finest offerings..."

6. URGENCY DETECTION:
"tomorrow", "tonight", "ASAP", "urgent" = HIGH urgency response
"next week", "planning" = MEDIUM urgency response
"considering", "maybe", "thinking about" = LOW urgency, consultative approach

CRITICAL: Match response urgency and specificity to member's intent level.
    `,
    tags: ['intent', 'recognition', 'confidence', 'urgency'],
    urgency: 'high'
  },

  {
    id: 'luxury_service_knowledge_integration',
    title: 'Luxury Service Knowledge Integration Patterns',
    category: 'service_knowledge',
    memberTier: 'all-members',
    priority: 'high',
    content: `
INTEGRATING SPECIFIC LUXURY KNOWLEDGE INTO CONVERSATIONS:

1. AVIATION KNOWLEDGE INTEGRATION:
When member mentions private jet, integrate:
- Specific aircraft: "Citation Latitude for 6-9 passengers at $4,500-6,500/hour"
- Ground services: "Including Rolls-Royce ground transportation coordination"
- Route-specific details: "Miami routes serviced from Henderson Executive (HND) airport"

2. DINING KNOWLEDGE INTEGRATION:
When member mentions restaurants, integrate:
- Specific venues: "Le Bernardin for 3-star Michelin experience"
- Service details: "Private dining room with sommelier wine pairings"
- Timing considerations: "Spring season offers cherry blossom-inspired presentations"

3. HOTEL KNOWLEDGE INTEGRATION:
When member mentions accommodation, integrate:
- Suite types: "Presidential suite with butler service"
- Location benefits: "Panoramic city views and private elevator access"
- Seasonal advantages: "Perfect timing for spring cultural events"

4. KNOWLEDGE APPLICATION RULES:
- Apply knowledge to SPECIFIC member request, not generically
- Use knowledge to show expertise and build confidence
- Integrate pricing when appropriate for member tier
- Reference exclusive access and connections

5. CONVERSATION ENHANCEMENT PATTERN:
Base Response + Specific Knowledge + Next Step
"I'll arrange your private aviation to Miami tomorrow [Base] + Citation Latitude aircraft with Rolls-Royce ground coordination [Knowledge] + May I confirm your departure time preference? [Next Step]"

NEVER provide generic knowledge dumps. Always apply knowledge specifically to member's stated needs.
    `,
    tags: ['knowledge', 'integration', 'luxury', 'specificity'],
    urgency: 'high'
  },

  {
    id: 'tool_execution_conversation_flow',
    title: 'Tool Execution & Conversation Flow Integration',
    category: 'tool_integration',
    memberTier: 'all-members',
    priority: 'critical',
    content: `
TOOL EXECUTION INTEGRATION WITH CONVERSATION FLOW:

1. TOOL SELECTION BASED ON CONVERSATION STAGE:
Initial Request: search_luxury_knowledge + fetch_active_services
Adding Details: search_luxury_knowledge (with new context)
Ready to Book: create_ticket + notify_concierge

2. TOOL RESULT INTEGRATION PATTERNS:
search_luxury_knowledge results should be woven INTO response, not appended
fetch_active_services should provide specific options, not generic lists
create_ticket should trigger confirmation message with ticket number

3. CONVERSATION-AWARE TOOL PARAMETERS:
Use ENTIRE conversation context in tool calls:
- query: combine all conversation details, not just last message
- serviceCategory: derive from conversation history
- memberTier: apply throughout conversation
- intent: maintain consistency across conversation

4. TOOL EXECUTION TIMING:
Don't execute tools that ask for information already provided in conversation
Execute enrichment tools (search_luxury_knowledge) on every substantial response
Execute action tools (create_ticket) only when member confirms booking

5. MULTI-TOOL CONVERSATION FLOW:
Message 1: search_luxury_knowledge → provide knowledge-enhanced response
Message 2: search_luxury_knowledge + fetch_active_services → provide specific options
Message 3: create_ticket + notify_concierge → confirm booking

6. TOOL FAILURE RECOVERY:
If tools fail, maintain conversation flow:
"While I gather the latest options for your [specific request], I can share that our [service] includes [known details]..."

CRITICAL: Tools should enhance conversation, not interrupt or replace it. Every tool execution should result in more specific, contextual responses.
    `,
    tags: ['tools', 'execution', 'integration', 'flow'],
    urgency: 'critical'
  }
];

export const CONVERSATION_EXAMPLES = {
  successful_progression: {
    title: 'Successful Conversation Progression Example',
    conversation: [
      {
        user: "What's available in Las Vegas tomorrow?",
        agent_response: "I'd be delighted to arrange luxury transportation from Las Vegas tomorrow. To ensure I select the perfect option, may I know your destination and preferred departure time?",
        analysis: "Initial request acknowledged, gathering missing critical details"
      },
      {
        user: "How about a flight to Miami tomorrow night?",
        agent_response: "Perfect! Private aviation from Las Vegas to Miami tomorrow evening. Our Citation Latitude aircraft is ideal for this route with luxury cabin service. For 6-9 passengers at $4,500-6,500/hour, including ground coordination. How many passengers will be traveling?",
        analysis: "Specific service presented with pricing and details, asking for final detail"
      },
      {
        user: "from las vegas, closest to henderson, 4 of us",
        agent_response: "Excellent! Citation Latitude from Henderson Executive (HND) to Miami tomorrow evening for 4 passengers. This aircraft offers premium comfort with full cabin service and Rolls-Royce ground transportation. Shall I proceed with arrangements for your preferred evening departure time?",
        analysis: "All details integrated, specific aircraft and services matched, ready for booking confirmation"
      },
      {
        user: "Perfect, let's book it",
        agent_response: "Wonderful! Your private aviation is confirmed. Citation Latitude from Henderson to Miami tomorrow evening for 4 passengers. Your service ticket SR-847291 has been created, and our dedicated concierge team will contact you within 2 hours with final details and ground transportation coordination.",
        analysis: "Booking confirmed, ticket created, clear next steps provided"
      }
    ]
  },

  failed_progression: {
    title: 'Failed Conversation - Losing Context',
    conversation: [
      {
        user: "What's available in Las Vegas tomorrow?",
        agent_response: "I understand you're seeking luxury transportation services. Whether you need private aviation, luxury ground transport, or marine services...",
        analysis: "WRONG: Generic response ignoring specific Las Vegas/tomorrow details"
      },
      {
        user: "How about a flight to Miami tomorrow night?",
        agent_response: "I understand you're seeking luxury transportation services. Whether you need private aviation, luxury ground transport, or marine services...",
        analysis: "WRONG: Same generic response, ignoring Miami/tomorrow night specifics"
      },
      {
        user: "from las vegas, closest to henderson, 4 of us",
        agent_response: "I understand you're seeking luxury transportation services. Whether you need private aviation, luxury ground transport, or marine services...",
        analysis: "WRONG: Completely ignoring all conversation context and specific details"
      }
    ]
  }
};

export default CONVERSATION_FLOW_KNOWLEDGE; 