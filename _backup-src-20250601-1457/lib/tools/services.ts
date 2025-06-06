import servicesData from '@/data/services.json';

export interface Service {
  id: string;
  name: string;
  description: string;
  tier: 'good' | 'better' | 'extraordinary';
  basePrice: number;
  availability: string;
  bookingRequirements: string[];
  features: string[];
  leadTime: string;
  [key: string]: any; // For additional properties like maxPassengers, duration, etc.
}

export interface ServiceBucket {
  transportation: Service[];
  events: Service[];
  brandDev: Service[];
  investments: Service[];
  taglades: Service[];
  lifestyle: Service[];
}

export interface ServiceSearchParams {
  bucket?: keyof ServiceBucket;
  tier?: 'good' | 'better' | 'extraordinary';
  maxPrice?: number;
  minPrice?: number;
  availability?: string;
  searchTerm?: string;
}

/**
 * Tool: fetch_active_services
 * Purpose: Search and retrieve available services based on member requirements
 * Returns: Curated list of services with Good/Better/Extraordinary options
 */
export async function fetch_active_services(params: ServiceSearchParams = {}): Promise<{
  services: Service[];
  bucketCounts: Record<keyof ServiceBucket, number>;
  totalFound: number;
  searchSummary: string;
}> {
  const services = servicesData as ServiceBucket;
  let allServices: Service[] = [];
  
  // Collect services from specified bucket or all buckets
  if (params.bucket) {
    allServices = services[params.bucket] || [];
  } else {
    // Flatten all services with bucket identifier
    Object.entries(services).forEach(([bucket, serviceList]) => {
      allServices.push(...serviceList.map((service: Service) => ({
        ...service,
        bucket: bucket as keyof ServiceBucket
      })));
    });
  }

  // Apply filters
  let filteredServices = allServices;

  if (params.tier) {
    filteredServices = filteredServices.filter(service => service.tier === params.tier);
  }

  if (params.maxPrice !== undefined) {
    filteredServices = filteredServices.filter(service => service.basePrice <= params.maxPrice!);
  }

  if (params.minPrice !== undefined) {
    filteredServices = filteredServices.filter(service => service.basePrice >= params.minPrice!);
  }

  if (params.availability) {
    filteredServices = filteredServices.filter(service => 
      service.availability.toLowerCase().includes(params.availability!.toLowerCase())
    );
  }

  if (params.searchTerm) {
    const searchLower = params.searchTerm.toLowerCase();
    filteredServices = filteredServices.filter(service =>
      service.name.toLowerCase().includes(searchLower) ||
      service.description.toLowerCase().includes(searchLower) ||
      service.features.some(feature => feature.toLowerCase().includes(searchLower))
    );
  }

  // Count services by bucket
  const bucketCounts: Record<keyof ServiceBucket, number> = {
    transportation: 0,
    events: 0,
    brandDev: 0,
    investments: 0,
    taglades: 0,
    lifestyle: 0
  };

  filteredServices.forEach(service => {
    if ('bucket' in service) {
      bucketCounts[service.bucket as keyof ServiceBucket]++;
    }
  });

  // Generate search summary
  let searchSummary = `Found ${filteredServices.length} services`;
  if (params.bucket) searchSummary += ` in ${params.bucket}`;
  if (params.tier) searchSummary += ` at ${params.tier} tier`;
  if (params.searchTerm) searchSummary += ` matching "${params.searchTerm}"`;

  return {
    services: filteredServices,
    bucketCounts,
    totalFound: filteredServices.length,
    searchSummary
  };
}

/**
 * Helper: Get service by ID across all buckets
 */
export async function getServiceById(serviceId: string): Promise<Service | null> {
  const services = servicesData as ServiceBucket;
  
  for (const [bucket, serviceList] of Object.entries(services)) {
    const service = serviceList.find((s: Service) => s.id === serviceId);
    if (service) {
      return {
        ...service,
        bucket: bucket as keyof ServiceBucket
      };
    }
  }
  
  return null;
}

/**
 * Helper: Get services by tier for Art of Suggestion presentation
 */
export async function getServicesByTier(bucket?: keyof ServiceBucket): Promise<{
  good: Service[];
  better: Service[];
  extraordinary: Service[];
}> {
  const { services } = await fetch_active_services({ bucket });
  
  return {
    good: services.filter((s: Service) => s.tier === 'good'),
    better: services.filter((s: Service) => s.tier === 'better'),
    extraordinary: services.filter((s: Service) => s.tier === 'extraordinary')
  };
} 