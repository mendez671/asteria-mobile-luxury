export interface ServiceCardData {
  id: string;
  title: string;
  description: string;
  tier: 'GOLD' | 'PLATINUM' | 'DIAMOND';
  icon: string;
  prompts: string[];
  category: string;
}

export const LUXURY_SERVICES: ServiceCardData[] = [
  {
    id: 'cultural-experiences',
    title: 'Cultural Experiences',
    description: 'Private tours, exclusive events, and cultural immersions',
    tier: 'GOLD',
    icon: '🎭',
    category: 'events',
    prompts: [
      'I need VIP access to the Met Gala afterparty',
      'Can you arrange a private tour of the Louvre after hours?',
      'Book me an exclusive backstage meet and greet at a Broadway show',
      'I want a cultural immersion weekend in Kyoto with a local guide'
    ]
  },
  {
    id: 'personal-shopping',
    title: 'Personal Shopping',
    description: 'Curated luxury goods and bespoke shopping experiences',
    tier: 'PLATINUM',
    icon: '💎',
    category: 'lifestyle',
    prompts: [
      'I need a personal shopping session at Bergdorf Goodman',
      'Can you arrange a bespoke suit consultation with a Savile Row tailor?',
      'Help me source and authenticate a vintage Hermès bag',
      'I want a complete luxury wardrobe refresh for my Paris trip'
    ]
  },
  {
    id: 'wellness-spa',
    title: 'Wellness & Spa',
    description: 'Restorative experiences at premier wellness destinations',
    tier: 'GOLD',
    icon: '🧘‍♀️',
    category: 'lifestyle',
    prompts: [
      'Book me a week-long wellness retreat in Tulum',
      'I need a private spa day at The Ritz-Carlton with personal trainer',
      'Can you arrange IV therapy and recovery session in Malibu?',
      'I want a traditional hammam experience in Istanbul'
    ]
  },
  {
    id: 'luxury-accommodations',
    title: 'Luxury Accommodations',
    description: 'Curated selection of world-class hotels and private residences',
    tier: 'PLATINUM',
    icon: '🏨',
    category: 'transportation',
    prompts: [
      'I need an overwater villa in Maldives for my honeymoon',
      'Can you book a private château rental in Bordeaux wine region?',
      'I need the Presidential suite at The Plaza for Fashion Week',
      'I want a luxury safari lodge in Serengeti with private game drives'
    ]
  },
  {
    id: 'private-aviation',
    title: 'Private Aviation',
    description: 'Seamless private jet experiences and helicopter transfers',
    tier: 'DIAMOND',
    icon: '✈️',
    category: 'transportation',
    prompts: [
      'I need a private jet from NYC to Monaco for Grand Prix',
      'Book me a helicopter transfer from Manhattan to Hamptons',
      'I need round-trip private aviation to Aspen for skiing',
      'I need a same-day private jet to Las Vegas for dinner'
    ]
  },
  {
    id: 'fine-dining',
    title: 'Fine Dining',
    description: 'Exclusive reservations at Michelin-starred establishments',
    tier: 'PLATINUM',
    icon: '🍾',
    category: 'events',
    prompts: [
      'Book me the chef\'s table at Eleven Madison Park tomorrow',
      'I need a private dining room at Le Bernardin for 8 guests',
      'Can you arrange a wine pairing dinner at Napa Valley vineyard?',
      'I want a Michelin star restaurant crawl in Tokyo'
    ]
  }
]; 