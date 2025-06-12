import { amadeusService } from '../../services/travel';

export interface FlightSearchParams {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  passengers: number;
  cabinClass?: 'ECONOMY' | 'PREMIUM_ECONOMY' | 'BUSINESS' | 'FIRST';
  maxOffers?: number;
}

export interface FlightSearchResult {
  success: boolean;
  flights?: any[];
  meta?: any;
  dictionaries?: any;
  error?: string;
  searchParams?: FlightSearchParams;
}

/**
 * AMADEUS FLIGHT SEARCH TOOL
 * Integrated with ASTERIA workflow system for luxury travel bookings
 */
export const amadeus_flight_search = async (params: FlightSearchParams): Promise<FlightSearchResult> => {
  try {
    console.log('[AMADEUS_TOOL] 🛫 Flight search initiated:', {
      route: `${params.origin} → ${params.destination}`,
      departure: params.departureDate,
      passengers: params.passengers,
      class: params.cabinClass || 'BUSINESS'
    });
    
    // Validate required parameters
    if (!params.origin || !params.destination || !params.departureDate || !params.passengers) {
      throw new Error('Missing required flight search parameters');
    }
    
    // Format search parameters for Amadeus API
    const searchParams = {
      originLocationCode: params.origin.toUpperCase(),
      destinationLocationCode: params.destination.toUpperCase(),
      departureDate: params.departureDate,
      returnDate: params.returnDate,
      adults: params.passengers,
      currencyCode: 'USD',
      max: params.maxOffers || 5,
      travelClass: params.cabinClass || 'BUSINESS'
    };
    
    console.log('[AMADEUS_TOOL] 🔍 Searching with parameters:', searchParams);
    
    // Execute Amadeus flight search using the existing service
    const flights = await amadeusService.searchFlights({
      origin: params.origin,
      destination: params.destination,
      departureDate: params.departureDate,
      returnDate: params.returnDate,
      adults: params.passengers,
      travelClass: params.cabinClass,
      maxOffers: params.maxOffers || 5
    });
    
    console.log('[AMADEUS_TOOL] ✅ Flight search successful:', {
      offersFound: flights?.length || 0
    });
    
    // Return formatted results
    return {
      success: true,
      flights: flights || [],
      meta: { currency: 'USD' },
      dictionaries: {},
      searchParams: params
    };
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('[AMADEUS_TOOL] ❌ Flight search failed:', {
      error: errorMessage,
      searchParams: params
    });
    
    // Return error with fallback information
    return {
      success: false,
      error: errorMessage || 'Flight search service temporarily unavailable',
      flights: [],
      searchParams: params
    };
  }
};

/**
 * HOTEL SEARCH FUNCTIONALITY
 * Complementary to flight search for complete travel workflows
 */
export interface HotelSearchParams {
  cityCode: string;
  checkInDate: string;
  checkOutDate: string;
  adults: number;
  roomQuantity?: number;
  radius?: number;
  radiusUnit?: 'KM' | 'MILE';
  hotelIds?: string[];
}

export const amadeus_hotel_search = async (params: HotelSearchParams) => {
  try {
    console.log('[AMADEUS_TOOL] 🏨 Hotel search initiated:', {
      city: params.cityCode,
      checkIn: params.checkInDate,
      checkOut: params.checkOutDate,
      guests: params.adults
    });
    
    // Use the existing Amadeus service for hotel search
    const hotels = await amadeusService.searchHotels({
      cityCode: params.cityCode,
      checkInDate: params.checkInDate,
      checkOutDate: params.checkOutDate,
      adults: params.adults,
      rooms: params.roomQuantity || 1,
      currency: 'USD',
      maxOffers: 10
    });
    
    console.log('[AMADEUS_TOOL] ✅ Hotel search successful:', {
      hotelsFound: hotels?.length || 0
    });
    
    return {
      success: true,
      hotels: hotels || [],
      meta: { currency: 'USD' },
      searchParams: params
    };
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('[AMADEUS_TOOL] ❌ Hotel search failed:', errorMessage);
    
    return {
      success: false,
      error: errorMessage || 'Hotel search service temporarily unavailable',
      hotels: [],
      searchParams: params
    };
  }
};

/**
 * AIRPORT LOOKUP UTILITY
 * Helper function for flight search parameter validation
 */
export const amadeus_airport_lookup = async (keyword: string) => {
  try {
    // Use the existing Amadeus service for airport search
    const airports = await amadeusService.searchAirports(keyword);
    
    return {
      success: true,
      airports: airports.map(airport => ({
        iataCode: airport.iataCode,
        name: airport.name,
        city: airport.city,
        country: airport.country,
        subType: 'AIRPORT'
      }))
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('[AMADEUS_TOOL] Airport lookup failed:', errorMessage);
    return {
      success: false,
      error: errorMessage,
      airports: []
    };
  }
};

// Export all tools for agent system integration
export const amadeusTools = {
  flight_search: amadeus_flight_search,
  hotel_search: amadeus_hotel_search,
  airport_lookup: amadeus_airport_lookup
};

export default amadeus_flight_search; 