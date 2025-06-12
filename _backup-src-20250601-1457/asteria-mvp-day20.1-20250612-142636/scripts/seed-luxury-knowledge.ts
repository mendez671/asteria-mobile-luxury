import { LuxuryRAGService } from '../src/lib/rag/luxury-rag-service';

const ragService = new LuxuryRAGService();

const luxuryServiceData = {
  aviation: `
GLOBAL PRIVATE AVIATION - ULTRA LUXURY CHARTER SERVICES

Aircraft Fleet Categories:
- Light Jets: Citation CJ3+, Phenom 300E (2-8 passengers, $3,500-4,500/hour)
  • Range: 1,500-2,000 nautical miles
  • Ideal for: Regional business travel, weekend getaways
  • Amenities: WiFi, refreshment center, leather seating
  • Airports: Access to 5,000+ airports worldwide

- Midsize Jets: Citation Latitude, Hawker 4000 (6-9 passengers, $4,500-6,500/hour)  
  • Range: 2,500-3,500 nautical miles
  • Ideal for: Cross-country travel, international short-haul
  • Amenities: Full galley, enclosed lavatory, entertainment systems
  • Popular routes: NYC-LA, London-Paris, Miami-Bahamas

- Heavy Jets: Gulfstream G450, Falcon 7X (8-14 passengers, $6,500-9,500/hour)
  • Range: 4,000-5,500 nautical miles
  • Ideal for: International business, luxury group travel
  • Amenities: Full cabin service, sleeping berths, satellite communications
  • Transcontinental capability with luxury accommodations

- Ultra Long Range: Gulfstream G650, Global 7500 (12-19 passengers, $9,500-15,000/hour)
  • Range: 6,000+ nautical miles
  • Ideal for: Non-stop international, ultimate luxury experience
  • Amenities: Master suite, full kitchen, shower facilities, conference room
  • Routes: Any city pair globally non-stop

Premium Destinations & Airports:
- Primary Hubs: LAX (Los Angeles), JFK (New York), LAS (Las Vegas), MIA (Miami)
- European: LHR (London Heathrow), CDG (Paris Charles de Gaulle), FCO (Rome)
- Private Jet Airports: TEB (Teterboro), VAN (Van Nuys), HPN (White Plains)
- International Private: EGGW (Luton), LFPB (Le Bourget), RJTT (Haneda Tokyo)

Luxury Service Standards:
- 24/7 availability with notice requirements by tier
- Dedicated flight crew briefed on member preferences
- Ground transportation coordination (Rolls-Royce, Bentley fleet)
- Gourmet catering from partner Michelin-starred restaurants
- Custom wine and champagne service with sommelier selection
- High-speed satellite WiFi and business communications
- Pet transportation with special climate-controlled accommodations
- Medical equipment and trained medical staff for health emergencies

Member Tier Access Levels:
- Founding10 Members: All aircraft categories, 2-hour notice capability, priority booking during peak periods
- Fifty-K Members: Heavy and ultra-long range access, 4-hour notice, guaranteed availability
- Corporate Members: Midsize and heavy jets, 8-hour advance notice, business hour coordination
- All-Members: Light and midsize jets, 24-hour notice, standard booking procedures

Booking Process Excellence:
1. Member request with destination, passenger count, preferred departure window
2. Concierge presents 2-3 optimal aircraft options with detailed specifications
3. Real-time availability confirmation with aircraft tail number assignment
4. Ground transportation arranged at departure and arrival airports
5. Catering preferences confirmed 2 hours before departure
6. Weather monitoring and alternative planning for safety optimization
`,

  dining: `
EXCLUSIVE DINING RESERVATIONS - MICHELIN STAR & CELEBRITY CHEF EXPERIENCES

Restaurant Classifications:
- 3 Michelin Stars: The French Laundry (Napa Valley), Le Bernardin (NYC), Guy Savoy (Las Vegas)
  • Exceptional cuisine worth a special journey
  • Chef's table experiences with multi-course tasting menus
  • Wine pairings with rare vintage selections from world-class cellars
  • Advance reservations required, sometimes months ahead

- 2 Michelin Stars: Eleven Madison Park (NYC), Atelier Crenn (San Francisco), Joël Robuchon (Las Vegas)
  • Excellent cooking worth a detour
  • Innovative tasting menus with seasonal ingredients
  • Sommelier-guided wine experiences
  • Private dining rooms available for groups 8-20

- 1 Michelin Star: Benu (SF), Le Cirque (NYC), Picasso (Las Vegas), Providence (LA)
  • High-quality cooking worth a stop
  • À la carte and tasting menu options
  • Chef's special preparations for VIP guests
  • Same-day reservations possible for premium members

- Celebrity Chef Establishments: Nobu (multiple locations), Hell's Kitchen (Vegas), Cut (Beverly Hills)
  • Signature dishes from world-renowned chefs
  • Theatrical dining experiences
  • Celebrity chef appearances and special events
  • Exclusive menu items for VIP members

VIP Concierge Services:
- Same-day reservations for Founding10 and Fifty-K members at partner restaurants
- Private dining room coordination for intimate business meetings or celebrations
- Custom menu creation with chef consultation for dietary restrictions or preferences
- Wine pairing consultation with master sommeliers and rare vintage access
- Transportation coordination including Rolls-Royce or Bentley service
- Special dietary accommodations: vegan, kosher, gluten-free, allergy management
- Chef's table experiences with kitchen tours and cooking demonstrations

Global Dining Portfolio:
- New York City: Daniel, Per Se, Eleven Madison Park, Le Bernardin, Jean-Georges, The Modern
- Las Vegas: Joël Robuchon, Guy Savoy, Picasso, Twist, Restaurant Guy Savoy, L'Atelier
- Los Angeles: Providence, n/naka, Republique, Guelaguetza, Bestia, The Bazaar
- San Francisco: Benu, Atelier Crenn, State Bird Provisions, Gary Danko, Saison
- London: The Fat Duck, Dinner by Heston, Sketch, Alain Ducasse at The Dorchester
- Paris: L'Ambroisie, Arpège, L'Astrance, Guy Savoy, Alain Ducasse au Plaza Athénée
- Tokyo: Sukiyabashi Jiro, Narisawa, Den, Florilège, L'Effervescence, Nihonryori RyuGin

Exclusive Experiences:
- Chef's table with multi-course tasting menus and kitchen interaction
- Private wine cellar dinners with century-old vintage tastings
- Cooking masterclasses with Michelin-starred chefs
- Private yacht dining with celebrity chefs
- Rooftop and private terrace dining with city views
- Seasonal truffle and caviar tastings with expert guidance

Member Benefits by Tier:
- Priority seating during peak dining periods and special culinary events
- Complimentary champagne service and luxury appetizer selections
- Personalized recognition and custom service preferences
- Access to exclusive off-menu items and wine selections
- Advance notice of special culinary events and new menu launches
- Private dining coordinator for special occasions and business entertainment
`,

  hotels: `
ULTRA-LUXURY HOTEL ACCOMMODATIONS - WORLD'S FINEST PROPERTIES

Hotel Property Classifications:
- Palace Hotels: The Ritz Paris, Hotel Plaza Athénée, The Savoy London, Hotel de Crillon
  • Historic luxury with modern amenities
  • Royal suites with palace-level service
  • Private butler service and dedicated concierge
  • Access to exclusive events and cultural experiences

- Resort Properties: Four Seasons Maui, The St. Regis Bora Bora, Amanzoe Greece, One&Only Dubai
  • Destination luxury with comprehensive resort amenities
  • Private beaches, championship golf courses, world-class spas
  • Water sports coordination and private yacht access
  • Cultural immersion experiences and local luxury shopping

- Urban Luxury: The Mark NYC, The Beverly Hills Hotel, Mandarin Oriental Tokyo, The Peninsula Hong Kong
  • City center locations with metropolitan sophistication
  • Business centers with executive floors and services
  • Rooftop dining and exclusive club access
  • Shopping district proximity and cultural attractions

- Historic Luxury: Hotel de Crillon Paris, The Gritti Palace Venice, Taj Lake Palace Udaipur
  • Centuries of hospitality heritage combined with modern luxury
  • UNESCO World Heritage locations
  • Museum-quality art collections and historic architecture
  • Royal and presidential suite availability

Suite Categories & Investment Levels:
- Presidential Suites: $5,000-25,000/night (2,000+ sq ft)
  • Multiple bedrooms with luxury furnishings
  • Private butler and dedicated concierge service
  • Separate dining and entertainment areas
  • Private terraces with city or ocean views

- Royal Suites: $3,000-15,000/night (1,500+ sq ft)
  • Master bedroom with luxury marble bathroom
  • Living room with entertainment systems
  • Private terrace or balcony access
  • Club floor access and exclusive amenities

- Executive Suites: $1,500-8,000/night (800+ sq ft)
  • Separate bedroom and living areas
  • Executive floor privileges and club access
  • Business center and meeting room availability
  • Complimentary breakfast and evening cocktails

- Luxury Rooms: $800-3,000/night (500+ sq ft)
  • Premium location within hotel
  • Luxury amenities and premium linens
  • Marble bathrooms with luxury toiletries
  • City or landmark views where available

Exclusive Services Portfolio:
- Private jet transfer coordination with helicopter airport transfers
- Michelin-starred in-room dining with celebrity chef consultations
- Personal shopping and styling services with luxury brand partnerships
- In-suite spa treatments with master therapists and wellness consultations
- Private yacht and helicopter charter coordination
- Cultural experiences including private museum tours and VIP event access
- 24/7 butler service with personal preference management

Global Portfolio Excellence:
- New York: The Mark, The St. Regis, The Plaza, The Carlyle, The Lowell
- Los Angeles: The Beverly Hills Hotel, Chateau Marmont, The Peninsula, Hotel Bel-Air
- Las Vegas: The Wynn Tower Suites, Four Seasons, The Cosmopolitan Penthouse, ARIA Sky Suites
- London: The Savoy, Claridge's, The Langham, The Connaught, The Dorchester
- Paris: The Ritz, Four Seasons George V, Le Meurice, Mandarin Oriental, Hotel de Crillon
- Tokyo: Mandarin Oriental, The Peninsula, The Ritz-Carlton, Park Hyatt, Aman Tokyo

Premium Amenities & Experiences:
- Private check-in suites and dedicated elevator access
- Rolls-Royce or Bentley fleet transportation
- Access to exclusive members' clubs and private dining
- Personal shopping experiences with luxury brand stylists
- Private art gallery and museum tour coordination
- Helicopter transfers to airports and scenic destinations
- Personal chef services for extended stays and special dietary requirements

Booking Protocols by Member Tier:
- Founding10: All properties including palace hotels, guaranteed availability with 48-hour notice
- Fifty-K: Palace and resort properties with VIP amenities, priority booking for peak periods
- Corporate: Urban luxury and resort properties with business amenities, advance booking recommended
- All-Members: Luxury rooms and executive suites with standard amenities, standard booking procedures
`
};

async function seedLuxuryKnowledge() {
  console.log('🌱 Starting luxury knowledge base seeding...');
  
  try {
    // Seed aviation knowledge
    console.log('✈️ Seeding aviation knowledge...');
    await ragService.ingestLuxuryDocument(
      'aviation-services-comprehensive',
      luxuryServiceData.aviation,
      {
        title: 'Global Private Aviation Services - Complete Guide',
        sourceType: 'policy_doc',
        memberTier: 'all-members',
        serviceCategory: 'transportation',
        additionalMetadata: {
          lastUpdated: '2024-01-01',
          version: '2.0',
          category: 'premium_aviation',
          coverage: 'global',
          specialization: 'luxury_charter'
        }
      }
    );
    
    // Seed dining knowledge  
    console.log('🍽️ Seeding dining knowledge...');
    await ragService.ingestLuxuryDocument(
      'dining-reservations-comprehensive',
      luxuryServiceData.dining,
      {
        title: 'Exclusive Dining Reservations - Michelin Guide',
        sourceType: 'policy_doc',
        memberTier: 'all-members',
        serviceCategory: 'events',
        additionalMetadata: {
          lastUpdated: '2024-01-01',
          version: '2.0',
          category: 'fine_dining',
          coverage: 'global',
          specialization: 'michelin_star'
        }
      }
    );
    
    // Seed hotel knowledge
    console.log('🏨 Seeding hotel knowledge...');
    await ragService.ingestLuxuryDocument(
      'hotel-accommodations-comprehensive',
      luxuryServiceData.hotels,
      {
        title: 'Ultra-Luxury Hotel Accommodations - Global Portfolio',
        sourceType: 'policy_doc',
        memberTier: 'all-members',
        serviceCategory: 'lifestyle',
        additionalMetadata: {
          lastUpdated: '2024-01-01',
          version: '2.0',
          category: 'luxury_hospitality',
          coverage: 'global',
          specialization: 'palace_hotels'
        }
      }
    );
    
    // Add service providers
    console.log('🏢 Adding service providers...');
    await ragService.addServiceProvider('global-private-aviation', {
      name: 'Global Private Aviation',
      category: 'aviation',
      tierLevel: 'ultra_luxury',
      contactInfo: {
        phone: '+1-800-PRIVATE',
        email: 'concierge@globalprivateaviation.com',
        emergency: '+1-800-EMERGENCY'
      },
      capabilities: {
        aircraft_types: ['light', 'midsize', 'heavy', 'ultra_long_range'],
        global_coverage: true,
        notice_minimum: '2_hours',
        catering: true,
        ground_transport: true,
        medical_capability: true
      }
    });

    await ragService.addServiceProvider('michelin-dining-network', {
      name: 'Michelin Dining Network',
      category: 'dining',
      tierLevel: 'ultra_luxury',
      contactInfo: {
        phone: '+1-800-DINING',
        email: 'reservations@michelindining.com',
        concierge: '+1-800-CONCIERGE'
      },
      capabilities: {
        same_day_reservations: true,
        private_dining: true,
        chef_consultations: true,
        wine_sommelier: true,
        dietary_accommodations: true,
        transportation: true
      }
    });

    await ragService.addServiceProvider('palace-hotels-collective', {
      name: 'Palace Hotels Collective',
      category: 'hospitality',
      tierLevel: 'ultra_luxury',
      contactInfo: {
        phone: '+1-800-PALACE',
        email: 'suites@palacehotels.com',
        vip: '+1-800-VIP-SUITE'
      },
      capabilities: {
        presidential_suites: true,
        butler_service: true,
        helicopter_transfers: true,
        private_shopping: true,
        yacht_charters: true,
        cultural_experiences: true
      }
    });
    
    console.log('✅ Luxury knowledge base seeded successfully');
    console.log('📊 Knowledge base now contains:');
    console.log('   - Global Private Aviation comprehensive guide');
    console.log('   - Michelin-starred dining reservations');
    console.log('   - Ultra-luxury hotel accommodations');
    console.log('   - 3 premium service providers');
    
  } catch (error) {
    console.error('🚨 Seeding failed:', error);
  }
}

// Execute seeding
console.log('🚀 Initializing luxury knowledge base seeding...');
seedLuxuryKnowledge()
  .then(() => {
    console.log('🎉 Seeding completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Seeding failed with error:', error);
    process.exit(1);
  }); 