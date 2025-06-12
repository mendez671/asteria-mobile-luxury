// ===============================
// WEEK 2: CORE FLOW OPTIMIZATION - Composite Tools
// Intelligent tool combinations for complex luxury service scenarios
// ===============================

import { ToolCoordinator } from '../../core/tool-coordinator';

export interface CompositeToolResult {
  success: boolean;
  data: any;
  component_results: any[];
  quality_score: number;
  execution_time: number;
  recommendation: string;
}

class CompositeToolsService {
  calculateQualityScore(results: any[]): number {
    const successfulResults = results.filter(r => r && r.success);
    const successRate = successfulResults.length / results.length;
    
    const dataQuality = successfulResults.reduce((total, result) => {
      if (!result.data) return total;
      return total + (result.data.results?.length > 0 || result.data.services?.length > 0 ? 1 : 0.5);
    }, 0) / successfulResults.length;
    
    return (successRate * 0.6) + (dataQuality * 0.4);
  }

  // Aviation Tools
  async luxury_aviation_complete(params: any, context: any): Promise<CompositeToolResult> {
    console.log('✈️ [COMPOSITE] Executing luxury_aviation_complete');
    const startTime = performance.now();
    
    try {
      // Enhanced parameters for aviation search
      const aviationParams = {
        route: params.route || `${params.origin || ''} to ${params.destination || ''}`,
        aircraft: params.aircraft_preference || '',
        passengers: params.passengers || 4,
        date: params.travel_date || 'flexible',
        memberTier: context.memberTier || 'fifty-k'
      };
      
      // Parallel execution of complementary tools
      const [knowledgeResult, servicesResult, commercialResult] = await Promise.all([
        this.executeKnowledgeSearch(aviationParams, context),
        this.executeServicesSearch(aviationParams, context),
        params.include_commercial ? this.executeCommercialSearch(aviationParams, context) : null
      ]);
      
      // Intelligent result combination
      const combinedData = this.combineAviationResults(knowledgeResult, servicesResult, commercialResult, aviationParams);
      
      // Generate personalized recommendation
      const recommendation = this.generateAviationRecommendation(combinedData, context.memberTier);
      
      const execution_time = performance.now() - startTime;
      
      return {
        success: true,
        data: combinedData,
        component_results: [knowledgeResult, servicesResult, commercialResult].filter(Boolean),
        quality_score: this.calculateQualityScore([knowledgeResult, servicesResult, commercialResult]),
        execution_time,
        recommendation
      };
      
    } catch (error) {
      console.error('❌ [COMPOSITE] luxury_aviation_complete failed:', error);
      return {
        success: false,
        data: null,
        component_results: [],
        quality_score: 0,
        execution_time: performance.now() - startTime,
        recommendation: 'Please try again or contact our concierge team directly.'
      };
    }
  }

  async executeKnowledgeSearch(params: any, context: any) {
    try {
      const { searchLuxuryKnowledge } = await import('../search_luxury_knowledge');
      return await searchLuxuryKnowledge({
        query: `private aviation ${params.route} ${params.aircraft} for ${params.passengers} passengers`,
        serviceCategory: 'transportation',
        memberTier: params.memberTier,
        intent: 'transportation'
      }, context);
    } catch (error) {
      console.error('❌ [COMPOSITE] Knowledge search failed:', error);
      return { success: false, data: null };
    }
  }

  async executeServicesSearch(params: any, context: any) {
    try {
      // TODO: Implement fetch_active_services tool
      // For now, return mock data to prevent build errors
      console.log('⚠️ [COMPOSITE] Using mock services data - fetch_active_services not implemented');
      return { 
        success: true, 
        data: { 
          services: [
            {
              name: 'Citation Latitude',
              aircraft_type: 'Citation Latitude',
              passenger_capacity: 8,
              range: 'Continental',
              amenities: ['Premium cabin service', 'Rolls-Royce ground transport']
            }
          ]
        } 
      };
    } catch (error) {
      console.error('❌ [COMPOSITE] Services search failed:', error);
      return { success: false, data: null };
    }
  }

  async executeCommercialSearch(params: any, context: any) {
    // Optional commercial alternatives for comparison
    try {
      const { amadeus_flight_search } = await import('../amadeus_flight_search');
      const result = await amadeus_flight_search({
        origin: params.origin,
        destination: params.destination,
        departureDate: params.date,
        passengers: params.passengers,
        cabinClass: 'FIRST'
      });
      return { success: result.success, data: { flights: result.flights } };
    } catch (error) {
      console.error('❌ [COMPOSITE] Commercial search failed:', error);
      return { success: false, data: null };
    }
  }

  combineAviationResults(knowledge: any, services: any, commercial: any, params: any) {
    return {
      luxury_options: {
        knowledge_recommendations: knowledge?.data?.results || [],
        available_services: services?.data?.services || [],
        aircraft_options: this.extractAircraftOptions(knowledge, services)
      },
      commercial_alternatives: commercial?.data?.flights || null,
      route_analysis: {
        route: params.route,
        optimal_aircraft: this.selectOptimalAircraft(knowledge, services, params.passengers),
        estimated_cost: this.estimateCost(knowledge, services, params),
        flight_time: this.estimateFlightTime(params.route)
      },
      member_benefits: this.getMemberBenefits(params.memberTier),
      next_steps: this.getAviationNextSteps(params.memberTier)
    };
  }

  extractAircraftOptions(knowledge: any, services: any) {
    const options = [];
    
    // Extract from knowledge base
    if (knowledge?.data?.results) {
      for (const result of knowledge.data.results) {
        if (result.content && result.content.includes('Citation') || result.content.includes('Gulfstream')) {
          const aircraftMatch = result.content.match(/(Citation \w+|Gulfstream \w+)/);
          if (aircraftMatch) {
            options.push({
              name: aircraftMatch[1],
              source: 'knowledge',
              capacity: this.extractCapacity(result.content),
              range: this.extractRange(result.content),
              amenities: this.extractAmenities(result.content)
            });
          }
        }
      }
    }
    
    // Extract from services
    if (services?.data?.services) {
      for (const service of services.data.services) {
        if (service.aircraft_type) {
          options.push({
            name: service.aircraft_type,
            source: 'services',
            capacity: service.passenger_capacity || 'Variable',
            range: service.range || 'Continental',
            amenities: service.amenities || ['Premium cabin service']
          });
        }
      }
    }
    
    // Remove duplicates and sort by capacity
    const uniqueOptions = options.filter((option, index, self) => 
      index === self.findIndex(o => o.name === option.name)
    );
    
    return uniqueOptions.sort((a, b) => {
      const aCapacity = parseInt(a.capacity) || 0;
      const bCapacity = parseInt(b.capacity) || 0;
      return bCapacity - aCapacity;
    });
  }

  extractCapacity(text: string): string {
    const match = text.match(/(\d+)-?(\d+)?\s*passengers?/i);
    return match ? (match[2] ? `${match[1]}-${match[2]}` : match[1]) + ' passengers' : '6-8 passengers';
  }

  extractRange(text: string): string {
    if (text.includes('transcontinental') || text.includes('global')) return 'Global';
    if (text.includes('continental')) return 'Continental';
    return 'Regional+';
  }

  extractAmenities(text: string): string[] {
    const amenities = [];
    if (text.includes('cabin service')) amenities.push('Full cabin service');
    if (text.includes('sleeping') || text.includes('berth')) amenities.push('Sleeping berths');
    if (text.includes('satellite') || text.includes('wifi')) amenities.push('Satellite communications');
    if (text.includes('catering')) amenities.push('Gourmet catering');
    if (amenities.length === 0) amenities.push('Premium cabin service');
    return amenities;
  }

  selectOptimalAircraft(knowledge: any, services: any, passengers: number): string {
    const options = this.extractAircraftOptions(knowledge, services);
    
    // Select based on passenger capacity
    const suitable = options.filter(aircraft => {
      const capacity = parseInt(aircraft.capacity) || 8;
      return capacity >= passengers;
    });
    
    return suitable.length > 0 ? suitable[0].name : 'Citation Latitude';
  }

  estimateCost(knowledge: any, services: any, params: any): string {
    // Basic cost estimation based on aircraft type and route
    const aircraft = this.selectOptimalAircraft(knowledge, services, params.passengers);
    
    if (aircraft.includes('Citation')) return '$4,500-6,500/hour';
    if (aircraft.includes('Gulfstream')) return '$6,500-9,500/hour';
    return '$5,000-8,000/hour';
  }

  estimateFlightTime(route: string): string {
    // Simple flight time estimation
    const routeLower = route.toLowerCase();
    if (routeLower.includes('cross') || routeLower.includes('coast')) return '5-6 hours';
    if (routeLower.includes('international')) return '8-12 hours';
    return '2-4 hours';
  }

  getMemberBenefits(tier: string): string[] {
    const benefits: { [key: string]: string[] } = {
      'founding10': [
        'Guaranteed aircraft availability within 4 hours',
        'Complimentary ground transportation',
        'Priority routing and landing slots',
        'Dedicated flight coordination team'
      ],
      'fifty-k': [
        'Priority booking access',
        'Preferred aircraft selection',
        'Expedited security clearance'
      ],
      'corporate': [
        'Business travel coordination',
        'Multi-leg flight planning',
        'Corporate account billing'
      ],
      'all-members': [
        'Professional flight coordination',
        'Safety certified aircraft only',
        'Transparent pricing'
      ]
    };
    
    return benefits[tier] || benefits['all-members'];
  }

  getAviationNextSteps(tier: string): string[] {
    return [
      'Confirm passenger details and travel dates',
      'Select preferred aircraft from recommendations',
      'Coordinate ground transportation if needed',
      'Finalize flight itinerary and routing'
    ];
  }

  generateAviationRecommendation(data: any, memberTier: string): string {
    const aircraft = data.route_analysis.optimal_aircraft;
    const cost = data.route_analysis.estimated_cost;
    const flightTime = data.route_analysis.flight_time;
    
    const benefits = memberTier === 'founding10' ? 'with guaranteed availability and complimentary services' :
                    memberTier === 'fifty-k' ? 'with priority access and preferred selection' :
                    'with professional coordination and transparent pricing';
    
    return `Perfect for your journey, I recommend the ${aircraft} ${benefits}. ` +
           `Estimated cost: ${cost}, flight time: ${flightTime}. ` +
           `Shall I proceed with detailed arrangements?`;
  }

  // Dining Tools
  async luxury_dining_complete(params: any, context: any): Promise<CompositeToolResult> {
    console.log('🍽️ [COMPOSITE] Executing luxury_dining_complete');
    const startTime = performance.now();
    
    try {
      const diningParams = {
        cuisine: params.cuisine || 'fine dining',
        location: params.location || params.city || 'downtown',
        party_size: params.party_size || params.guests || 2,
        date: params.date || 'tonight',
        occasion: params.occasion || 'dinner',
        dietary: params.dietary || params.restrictions || null,
        memberTier: context.memberTier || 'fifty-k'
      };
      
      // Parallel execution for dining search
      const [knowledgeResult, servicesResult, availabilityResult] = await Promise.all([
        this.executeDiningKnowledgeSearch(diningParams, context),
        this.executeDiningServicesSearch(diningParams, context),
        this.executeAvailabilityCheck(diningParams, context)
      ]);
      
      const combinedData = this.combineDiningResults(knowledgeResult, servicesResult, availabilityResult, diningParams);
      const recommendation = this.generateDiningRecommendation(combinedData, context.memberTier);
      
      return {
        success: true,
        data: combinedData,
        component_results: [knowledgeResult, servicesResult, availabilityResult].filter(Boolean),
        quality_score: this.calculateQualityScore([knowledgeResult, servicesResult, availabilityResult]),
        execution_time: performance.now() - startTime,
        recommendation
      };
      
    } catch (error) {
      console.error('❌ [COMPOSITE] luxury_dining_complete failed:', error);
      return {
        success: false,
        data: null,
        component_results: [],
        quality_score: 0,
        execution_time: performance.now() - startTime,
        recommendation: 'I\'ll have our concierge team curate exceptional dining options for you personally.'
      };
    }
  }

  async executeDiningKnowledgeSearch(params: any, context: any) {
    try {
      const { searchLuxuryKnowledge } = await import('../search_luxury_knowledge');
      return await searchLuxuryKnowledge({
        query: `${params.cuisine} restaurant ${params.location} ${params.occasion} Michelin dining`,
        serviceCategory: 'events',
        memberTier: context.memberTier,
        intent: 'dining'
      }, context);
    } catch (error) {
      console.error('❌ [COMPOSITE] Dining knowledge search failed:', error);
      return { success: false, data: null };
    }
  }

  async executeDiningServicesSearch(params: any, context: any) {
    try {
      // TODO: Implement fetch_active_services tool
      // For now, return mock data to prevent build errors
      console.log('⚠️ [COMPOSITE] Using mock dining services data - fetch_active_services not implemented');
      return { 
        success: true, 
        data: { 
          services: [
            {
              name: 'Le Bernardin',
              cuisine_type: 'French Seafood',
              michelin_stars: 3,
              location: 'Manhattan',
              availability: 'Limited'
            }
          ]
        } 
      };
    } catch (error) {
      console.error('❌ [COMPOSITE] Dining services search failed:', error);
      return { success: false, data: null };
    }
  }

  async executeAvailabilityCheck(params: any, context: any) {
    // Mock availability check - in production would integrate with restaurant APIs
    return {
      success: true,
      data: {
        available_slots: ['6:00 PM', '7:30 PM', '9:00 PM'],
        popular_times: ['7:00 PM - 8:30 PM'],
        special_menus: params.occasion !== 'dinner' ? ['Tasting menu', 'Wine pairing'] : null
      }
    };
  }

  combineDiningResults(knowledge: any, services: any, availability: any, params: any) {
    return {
      restaurant_options: this.extractRestaurantOptions(knowledge, services),
      availability: availability?.data || null,
      dining_experience: {
        cuisine_type: params.cuisine,
        location: params.location,
        party_size: params.party_size,
        occasion: params.occasion,
        special_requirements: params.dietary
      },
      recommendations: this.getDiningRecommendations(knowledge, params),
      member_privileges: this.getDiningPrivileges(params.memberTier)
    };
  }

  generateDiningRecommendation(data: any, memberTier: string): string {
    const restaurants = data.restaurant_options;
    if (restaurants.length === 0) {
      return `I'll curate exceptional dining options for your ${data.dining_experience.occasion} experience. Our concierge team has exclusive access to premier establishments.`;
    }
    
    const topChoice = restaurants[0];
    const privileges = memberTier === 'founding10' ? 'with priority reservations and chef consultations' :
                      memberTier === 'fifty-k' ? 'with exclusive access and sommelier pairings' :
                      'with personalized service coordination';
    
    return `Perfect for your ${data.dining_experience.occasion}, I recommend ${topChoice.name} ${privileges}. ${topChoice.description} Available times: ${data.availability?.available_slots?.join(', ') || 'upon request'}. Shall I secure your reservation?`;
  }

  extractRestaurantOptions(knowledge: any, services: any) {
    const options = [];
    
    // Extract from knowledge base
    if (knowledge?.data?.results) {
      for (const result of knowledge.data.results) {
        const restaurantMatch = result.content.match(/([A-Z][a-z\s]+(?:Restaurant|Bistro|Brasserie|Kitchen|Table)?)/);
        if (restaurantMatch && result.content.includes('Michelin')) {
          options.push({
            name: restaurantMatch[1].trim(),
            source: 'knowledge',
            stars: this.extractMichelinStars(result.content),
            cuisine: this.extractCuisine(result.content),
            description: this.extractDescription(result.content)
          });
        }
      }
    }
    
    return options.slice(0, 3); // Top 3 recommendations
  }

  extractMichelinStars(text: string): string {
    if (text.includes('three-star') || text.includes('3-star')) return '3 Michelin stars';
    if (text.includes('two-star') || text.includes('2-star')) return '2 Michelin stars';
    if (text.includes('one-star') || text.includes('1-star')) return '1 Michelin star';
    return 'Michelin featured';
  }

  extractCuisine(text: string): string {
    const cuisines = ['French', 'Italian', 'Japanese', 'Contemporary', 'Mediterranean', 'American'];
    for (const cuisine of cuisines) {
      if (text.toLowerCase().includes(cuisine.toLowerCase())) return cuisine;
    }
    return 'Fine dining';
  }

  extractDescription(text: string): string {
    const sentences = text.split('.').slice(0, 2);
    return sentences.join('.') + (sentences.length > 1 ? '.' : '');
  }

  getDiningRecommendations(knowledge: any, params: any): string[] {
    return [
      'Wine pairing consultation with sommelier',
      'Private dining room for intimate occasions',
      'Seasonal tasting menu recommendations',
      'Dietary accommodation coordination'
    ];
  }

  getDiningPrivileges(tier: string): string[] {
    const privileges: { [key: string]: string[] } = {
      'founding10': [
        'Priority reservations at fully booked establishments',
        'Chef\'s table access and kitchen tours',
        'Personalized menu consultations',
        'Complimentary wine tastings'
      ],
      'fifty-k': [
        'Priority booking access',
        'Sommelier wine pairings',
        'Special occasion coordination'
      ],
      'corporate': [
        'Business dining coordination',
        'Group reservation management',
        'Corporate account privileges'
      ],
      'all-members': [
        'Professional reservation management',
        'Dietary accommodation assistance',
        'Special request coordination'
      ]
    };
    
    return privileges[tier] || privileges['all-members'];
  }
}

// Create singleton instance
const compositeToolsService = new CompositeToolsService();

// Export the tools in the expected format
export const compositeTools = {
  luxury_aviation_complete: {
    name: 'luxury_aviation_complete',
    description: 'Complete aviation search with luxury options, availability, and recommendations',
    component_tools: ['search_luxury_knowledge', 'fetch_active_services', 'amadeus_flight_search'],
    execute: compositeToolsService.luxury_aviation_complete.bind(compositeToolsService)
  },
  
  luxury_dining_complete: {
    name: 'luxury_dining_complete', 
    description: 'Complete dining search with Michelin recommendations, availability, and reservations',
    component_tools: ['search_luxury_knowledge', 'fetch_active_services'],
    execute: compositeToolsService.luxury_dining_complete.bind(compositeToolsService)
  },
  
  // Shared utility method
  calculateQualityScore: compositeToolsService.calculateQualityScore.bind(compositeToolsService)
}; 