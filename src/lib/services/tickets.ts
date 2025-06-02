import { classifyServiceRequest } from './classifier';
import { extractServiceDetails, ServiceDetails } from './extractor';

export interface ServiceTicket {
  id: string;
  member_id: string;
  service_bucket: string;
  service_name: string;
  urgency: 'LOW' | 'MEDIUM' | 'HIGH';
  details: ServiceDetails;
  created_at: Date;
  status: 'pending' | 'assigned' | 'in_progress' | 'completed';
}

export function generateTicketId(): string {
  const timestamp = Date.now().toString().slice(-4);
  const random = Math.floor(Math.random() * 9000) + 1000;
  return `SR-${random}${timestamp}`;
}

export function createServiceTicket(
  message: string,
  memberId: string = 'TAG-001'
): ServiceTicket {
  const classification = classifyServiceRequest(message);
  const details = extractServiceDetails(message, classification.bucket);
  
  // Determine urgency
  let urgency: 'LOW' | 'MEDIUM' | 'HIGH' = 'MEDIUM';
  
  if (classification.is_urgent) {
    urgency = 'HIGH';
  } else if (classification.bucket.id === 'transportation' || classification.bucket.id === 'events') {
    urgency = 'MEDIUM';
  } else {
    urgency = 'LOW';
  }
  
  // Override urgency for same-day requests
  if (details.dates && (
    details.dates.toLowerCase().includes('today') ||
    details.dates.toLowerCase().includes('tonight') ||
    details.dates.toLowerCase().includes('asap')
  )) {
    urgency = 'HIGH';
  }
  
  return {
    id: generateTicketId(),
    member_id: memberId,
    service_bucket: classification.bucket.id,
    service_name: classification.bucket.name,
    urgency,
    details,
    created_at: new Date(),
    status: 'pending'
  };
} 