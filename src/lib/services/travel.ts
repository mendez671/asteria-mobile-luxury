// ===============================
// AMADEUS TRAVEL API SERVICE INTEGRATION
// Phase 5.3: External Service Integrations
// ===============================

import { getAmadeusCredentials } from '@/lib/utils/secrets';

export interface FlightSearchQuery {
  origin: string;          // IATA airport code (e.g., 'NYC')
  destination: string;     // IATA airport code (e.g., 'LAX')
  departureDate: string;   // YYYY-MM-DD format
  returnDate?: string;     // YYYY-MM-DD format (for round trip)
  adults: number;          // Number of adult passengers
  children?: number;       // Number of child passengers
  infants?: number;        // Number of infant passengers
  travelClass?: 'ECONOMY' | 'PREMIUM_ECONOMY' | 'BUSINESS' | 'FIRST';
  maxPrice?: number;       // Maximum price per person
  currency?: string;       // Currency code (e.g., 'USD')
  nonStop?: boolean;       // Direct flights only
  maxOffers?: number;      // Maximum number of offers to return
}

export interface FlightOffer {
  id: string;
  price: {
    total: string;
    currency: string;
    base?: string;
    fees?: Array<{
      amount: string;
      type: string;
    }>;
  };
  itineraries: Array<{
    duration: string;
    segments: Array<{
      departure: {
        iataCode: string;
        terminal?: string;
        at: string; // ISO 8601 datetime
      };
      arrival: {
        iataCode: string;
        terminal?: string;
        at: string; // ISO 8601 datetime
      };
      carrierCode: string;
      number: string;
      aircraft: {
        code: string;
      };
      duration: string;
      numberOfStops: number;
    }>;
  }>;
  travelerPricings: Array<{
    travelerId: string;
    fareOption: string;
    travelerType: 'ADULT' | 'CHILD' | 'INFANT';
    price: {
      currency: string;
      total: string;
      base: string;
    };
  }>;
}

export interface HotelSearchQuery {
  cityCode: string;        // IATA city code (e.g., 'NYC')
  checkInDate: string;     // YYYY-MM-DD format
  checkOutDate: string;    // YYYY-MM-DD format
  adults: number;          // Number of adult guests
  children?: number;       // Number of child guests
  rooms?: number;          // Number of rooms
  currency?: string;       // Currency code
  maxPrice?: number;       // Maximum price per night
  amenities?: string[];    // Hotel amenities
  hotelChain?: string;     // Specific hotel chain
  rating?: number;         // Minimum star rating
  maxOffers?: number;      // Maximum number of offers
}

export interface HotelOffer {
  id: string;
  hotel: {
    hotelId: string;
    name: string;
    rating?: number;
    cityCode: string;
    address?: {
      lines: string[];
      cityName: string;
      countryCode: string;
    };
    contact?: {
      phone?: string;
      email?: string;
    };
    amenities?: string[];
  };
  available: boolean;
  offers: Array<{
    id: string;
    checkInDate: string;
    checkOutDate: string;
    roomQuantity: number;
    rateCode: string;
    rateFamilyEstimated?: {
      code: string;
      type: string;
    };
    room: {
      type: string;
      typeEstimated?: {
        category: string;
        beds: number;
        bedType: string;
      };
      description?: {
        text: string;
        lang: string;
      };
    };
    guests: {
      adults: number;
      children?: number;
    };
    price: {
      currency: string;
      total: string;
      base?: string;
      taxes?: Array<{
        amount: string;
        currency: string;
        code: string;
      }>;
    };
    policies?: {
      cancellations?: Array<{
        type: string;
        amount: string;
        numberOfNights?: number;
        deadline?: string;
      }>;
    };
  }>;
}

export interface TravelRecommendation {
  type: 'flight' | 'hotel' | 'activity' | 'restaurant';
  title: string;
  description: string;
  price?: {
    amount: string;
    currency: string;
  };
  location: {
    city: string;
    country: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  rating?: number;
  images?: string[];
  bookingUrl?: string;
  metadata?: Record<string, any>;
}

interface AmadeusCredentials {
  apiKey: string;
  apiSecret: string;
}

class AmadeusService {
  private accessToken: string | null = null;
  private tokenExpiry: Date | null = null;
  private readonly BASE_URL = 'https://api.amadeus.com';

  // ===============================
  // AUTHENTICATION WITH SECRET MANAGER
  // ===============================

  private async getAccessToken(): Promise<string> {
    if (this.accessToken && this.tokenExpiry && this.tokenExpiry > new Date()) {
      return this.accessToken;
    }

    try {
      const { apiKey, apiSecret } = await getAmadeusCredentials();
      
      const response = await fetch(`${this.BASE_URL}/v1/security/oauth2/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: apiKey,
          client_secret: apiSecret,
        }),
      });

      if (!response.ok) {
        throw new Error(`Authentication failed: ${response.status}`);
      }

      const data = await response.json();
      this.accessToken = data.access_token;
      this.tokenExpiry = new Date(Date.now() + (data.expires_in * 1000));
      
      return this.accessToken!;
    } catch (error) {
      console.error('[AMADEUS] Authentication failed:', error);
      throw new Error('Amadeus service authentication failed');
    }
  }

  private async makeRequest(endpoint: string, params: Record<string, any> = {}): Promise<any> {
    const token = await this.getAccessToken();
    const queryString = new URLSearchParams(params).toString();
    const url = `${this.BASE_URL}${endpoint}${queryString ? `?${queryString}` : ''}`;

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error(`[AMADEUS] API Error: ${response.status}`, errorData);
      throw new Error(`Amadeus API request failed: ${response.status}`);
    }

    return await response.json();
  }

  // ===============================
  // FLIGHT SEARCH
  // ===============================

  async searchFlights(query: FlightSearchQuery): Promise<FlightOffer[]> {
    try {
      const params: Record<string, any> = {
        originLocationCode: query.origin,
        destinationLocationCode: query.destination,
        departureDate: query.departureDate,
        adults: query.adults,
        max: query.maxOffers || 10,
      };

      if (query.returnDate) {
        params.returnDate = query.returnDate;
      }

      if (query.children) {
        params.children = query.children;
      }

      if (query.infants) {
        params.infants = query.infants;
      }

      if (query.travelClass) {
        params.travelClass = query.travelClass;
      }

      if (query.maxPrice) {
        params.maxPrice = query.maxPrice;
      }

      if (query.currency) {
        params.currencyCode = query.currency;
      }

      if (query.nonStop) {
        params.nonStop = 'true';
      }

      const response = await this.makeRequest('/v2/shopping/flight-offers', params);
      return response.data || [];
    } catch (error) {
      console.error('[AMADEUS] Flight search failed:', error);
      return [];
    }
  }

  async getFlightOfferPrice(flightOfferId: string): Promise<FlightOffer | null> {
    try {
      const response = await this.makeRequest(`/v1/shopping/flight-offers/pricing`, {
        data: {
          type: 'flight-offers-pricing',
          flightOffers: [{ id: flightOfferId }],
        },
      });

      return response.data?.flightOffers?.[0] || null;
    } catch (error) {
      console.error('[AMADEUS] Flight offer pricing failed:', error);
      return null;
    }
  }

  // ===============================
  // HOTEL SEARCH
  // ===============================

  async searchHotels(query: HotelSearchQuery): Promise<HotelOffer[]> {
    try {
      const params: Record<string, any> = {
        cityCode: query.cityCode,
        checkInDate: query.checkInDate,
        checkOutDate: query.checkOutDate,
        adults: query.adults,
        max: query.maxOffers || 10,
      };

      if (query.children) {
        params.children = query.children;
      }

      if (query.rooms) {
        params.roomQuantity = query.rooms;
      }

      if (query.currency) {
        params.currency = query.currency;
      }

      if (query.maxPrice) {
        params.maxRate = query.maxPrice;
      }

      if (query.rating) {
        params.ratings = query.rating;
      }

      if (query.hotelChain) {
        params.hotelChain = query.hotelChain;
      }

      if (query.amenities) {
        params.amenities = query.amenities.join(',');
      }

      const response = await this.makeRequest('/v3/shopping/hotel-offers', params);
      return response.data || [];
    } catch (error) {
      console.error('[AMADEUS] Hotel search failed:', error);
      return [];
    }
  }

  async getHotelOfferPrice(hotelOfferId: string): Promise<HotelOffer | null> {
    try {
      const response = await this.makeRequest(`/v3/shopping/hotel-offers/${hotelOfferId}`);
      return response.data || null;
    } catch (error) {
      console.error('[AMADEUS] Hotel offer pricing failed:', error);
      return null;
    }
  }

  // ===============================
  // DESTINATION RECOMMENDATIONS
  // ===============================

  async getDestinationRecommendations(origin: string): Promise<TravelRecommendation[]> {
    try {
      const response = await this.makeRequest('/v1/reference-data/recommended-locations', {
        cityCodes: origin,
        travelerCountryCode: 'US',
      });

      const locations = response.data || [];
      
      return locations.map((location: any) => ({
        type: 'destination' as const,
        title: location.name,
        description: location.subType || 'Travel destination',
        location: {
          city: location.address?.cityName || '',
          country: location.address?.countryName || '',
          coordinates: location.geoCode ? {
            latitude: location.geoCode.latitude,
            longitude: location.geoCode.longitude,
          } : undefined,
        },
        metadata: {
          iataCode: location.iataCode,
          subType: location.subType,
          relevance: location.relevance,
        },
      }));
    } catch (error) {
      console.error('[AMADEUS] Destination recommendations failed:', error);
      return [];
    }
  }

  // ===============================
  // AIRPORT AND CITY INFORMATION
  // ===============================

  async searchAirports(keyword: string): Promise<Array<{
    iataCode: string;
    name: string;
    city: string;
    country: string;
  }>> {
    try {
      const response = await this.makeRequest('/v1/reference-data/locations', {
        keyword: keyword,
        subType: 'AIRPORT',
        'page[limit]': 10,
      });

      const locations = response.data || [];
      
      return locations.map((location: any) => ({
        iataCode: location.iataCode,
        name: location.name,
        city: location.address?.cityName || '',
        country: location.address?.countryName || '',
      }));
    } catch (error) {
      console.error('[AMADEUS] Airport search failed:', error);
      return [];
    }
  }

  async searchCities(keyword: string): Promise<Array<{
    iataCode: string;
    name: string;
    country: string;
  }>> {
    try {
      const response = await this.makeRequest('/v1/reference-data/locations', {
        keyword: keyword,
        subType: 'CITY',
        'page[limit]': 10,
      });

      const locations = response.data || [];
      
      return locations.map((location: any) => ({
        iataCode: location.iataCode,
        name: location.name,
        country: location.address?.countryName || '',
      }));
    } catch (error) {
      console.error('[AMADEUS] City search failed:', error);
      return [];
    }
  }
}

// Export singleton instance
export const amadeusService = new AmadeusService();

// ===============================
// WORKFLOW INTEGRATION HELPERS
// ===============================

export interface WorkflowTravelSearchConfig {
  type: 'flight' | 'hotel';
  query: FlightSearchQuery | HotelSearchQuery;
  maxResults?: number;
}

export async function processWorkflowTravelSearch(
  config: WorkflowTravelSearchConfig
): Promise<FlightOffer[] | HotelOffer[]> {
  try {
    if (config.type === 'flight') {
      const flightQuery = config.query as FlightSearchQuery;
      if (config.maxResults) {
        flightQuery.maxOffers = config.maxResults;
      }
      return await amadeusService.searchFlights(flightQuery);
    } else {
      const hotelQuery = config.query as HotelSearchQuery;
      if (config.maxResults) {
        hotelQuery.maxOffers = config.maxResults;
      }
      return await amadeusService.searchHotels(hotelQuery);
    }
  } catch (error) {
    console.error('[AMADEUS_WORKFLOW] Travel search failed:', error);
    return [];
  }
}

export async function findTravelOptions(
  origin: string,
  destination: string,
  departureDate: string,
  returnDate?: string
): Promise<{
  flights: FlightOffer[];
  hotels: HotelOffer[];
  recommendations: TravelRecommendation[];
}> {
  try {
    const [flights, hotels, recommendations] = await Promise.all([
      amadeusService.searchFlights({
        origin,
        destination,
        departureDate,
        returnDate,
        adults: 1,
        maxOffers: 5,
      }),
      amadeusService.searchHotels({
        cityCode: destination,
        checkInDate: departureDate,
        checkOutDate: returnDate || departureDate,
        adults: 1,
        maxOffers: 5,
      }),
      amadeusService.getDestinationRecommendations(destination),
    ]);

    return { flights, hotels, recommendations };
  } catch (error) {
    console.error('[AMADEUS_WORKFLOW] Find travel options failed:', error);
    return { flights: [], hotels: [], recommendations: [] };
  }
} 