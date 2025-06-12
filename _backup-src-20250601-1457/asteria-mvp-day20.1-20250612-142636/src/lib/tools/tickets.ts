import { Service } from './services';

export interface Ticket {
  id: string;
  memberId: string;
  serviceId: string;
  serviceName: string;
  serviceBucket: string;
  status: 'pending' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled';
  priority: 'standard' | 'urgent' | 'emergency';
  requestDetails: {
    requirements: Record<string, any>;
    preferences: string[];
    timeline: string;
    specialInstructions?: string;
  };
  pricing: {
    basePrice: number;
    adjustments: Array<{ description: string; amount: number }>;
    totalPrice: number;
    paymentStatus: 'pending' | 'authorized' | 'paid' | 'refunded';
  };
  timeline: {
    requested: string;
    confirmed?: string;
    scheduled?: string;
    completed?: string;
  };
  communications: Array<{
    timestamp: string;
    from: 'member' | 'concierge' | 'system';
    message: string;
    type: 'note' | 'update' | 'alert' | 'confirmation';
  }>;
  assignedConcierge?: string;
  tags: string[];
  attachments: Array<{
    filename: string;
    url: string;
    uploadedAt: string;
  }>;
}

export interface CreateTicketParams {
  memberId: string;
  serviceId: string;
  requirements: Record<string, any>;
  preferences?: string[];
  timeline?: string;
  priority?: 'standard' | 'urgent' | 'emergency';
  specialInstructions?: string;
}

/**
 * Tool: create_ticket
 * Purpose: Create comprehensive service tickets with full lifecycle management
 * Returns: Created ticket with tracking ID and next steps
 */
export async function create_ticket(params: CreateTicketParams): Promise<{
  ticket: Ticket;
  confirmationCode: string;
  nextSteps: string[];
  estimatedResponse: string;
}> {
  // Get service details for pricing and validation
  const { getServiceById } = await import('./services');
  const service = await getServiceById(params.serviceId);
  
  if (!service) {
    throw new Error(`Service ${params.serviceId} not found`);
  }

  // Validate requirements against service booking requirements
  // For agent-driven scenarios, allow partial information for initial booking
  const criticalRequirements = service.bookingRequirements.filter(req => 
    // Only require essential fields for initial booking
    ['date', 'destination', 'service_type'].includes(req) ||
    // For transportation, require either pickup or destination
    (service.bucket === 'transportation' && ['pickup', 'destination'].includes(req) && 
     (params.requirements.pickup || params.requirements.destination))
  );
  
  const missingCriticalRequirements = criticalRequirements.filter(
    req => !(req in params.requirements) && params.requirements[req] !== undefined
  );
  
  // Only fail if critical requirements are missing AND we don't have basic service info
  if (missingCriticalRequirements.length > 0 && 
      !params.requirements.date && 
      !params.requirements.destination && 
      !params.requirements.service_type) {
    throw new Error(`Missing critical information: ${missingCriticalRequirements.join(', ')}`);
  }

  // Generate ticket ID
  const timestamp = Date.now();
  const ticketId = `TAG-${timestamp.toString(36).toUpperCase()}`;
  
  // Calculate pricing
  let totalPrice = service.basePrice;
  const adjustments: Array<{ description: string; amount: number }> = [];
  
  // Add priority adjustment
  if (params.priority === 'urgent') {
    const urgentFee = Math.round(service.basePrice * 0.25);
    adjustments.push({ description: 'Urgent Processing Fee', amount: urgentFee });
    totalPrice += urgentFee;
  } else if (params.priority === 'emergency') {
    const emergencyFee = Math.round(service.basePrice * 0.5);
    adjustments.push({ description: 'Emergency Processing Fee', amount: emergencyFee });
    totalPrice += emergencyFee;
  }

  // Create ticket
  const ticket: Ticket = {
    id: ticketId,
    memberId: params.memberId,
    serviceId: params.serviceId,
    serviceName: service.name,
    serviceBucket: service.bucket || 'general',
    status: 'pending',
    priority: params.priority || 'standard',
    requestDetails: {
      requirements: params.requirements,
      preferences: params.preferences || [],
      timeline: params.timeline || service.leadTime,
      specialInstructions: params.specialInstructions
    },
    pricing: {
      basePrice: service.basePrice,
      adjustments,
      totalPrice,
      paymentStatus: 'pending'
    },
    timeline: {
      requested: new Date().toISOString()
    },
    communications: [
      {
        timestamp: new Date().toISOString(),
        from: 'system',
        message: `Service request created for ${service.name}`,
        type: 'note'
      }
    ],
    tags: [service.bucket || 'general', service.tier],
    attachments: []
  };

  // Save ticket (in production, this would go to database)
  await saveTicket(ticket);

  // Generate confirmation code
  const confirmationCode = `${ticketId}-${timestamp.toString(36).slice(-4).toUpperCase()}`;

  // Determine next steps based on service tier and requirements
  const nextSteps = generateNextSteps(service, ticket);
  
  // Calculate estimated response time
  const estimatedResponse = calculateResponseTime(service.tier, params.priority || 'standard');

  return {
    ticket,
    confirmationCode,
    nextSteps,
    estimatedResponse
  };
}

/**
 * Helper: Save ticket to storage
 */
async function saveTicket(ticket: Ticket): Promise<void> {
  // In MVP, we'll use local JSON storage
  // In production, this would be Firestore or similar
  const fs = await import('fs/promises');
  const path = await import('path');
  
  try {
    const ticketsDir = path.join(process.cwd(), 'src/data/tickets');
    await fs.mkdir(ticketsDir, { recursive: true });
    
    const ticketFile = path.join(ticketsDir, `${ticket.id}.json`);
    await fs.writeFile(ticketFile, JSON.stringify(ticket, null, 2));
  } catch (error) {
    console.error('Error saving ticket:', error);
    // In production, this would be logged to monitoring system
  }
}

/**
 * Helper: Generate next steps based on service and requirements
 */
function generateNextSteps(service: Service, ticket: Ticket): string[] {
  const steps: string[] = [];
  
  // Standard confirmation step
  steps.push('Confirmation email sent with booking details');
  
  // Service-specific steps
  if (service.tier === 'extraordinary') {
    steps.push('Dedicated concierge will contact you within 30 minutes');
    steps.push('Custom proposal will be prepared based on your requirements');
  } else if (service.tier === 'better') {
    steps.push('Service specialist will review and confirm availability');
    steps.push('Detailed itinerary will be prepared');
  } else {
    steps.push('Automated confirmation and scheduling in progress');
  }
  
  // Timeline-specific steps
  if (ticket.priority === 'emergency') {
    steps.push('Emergency response team has been notified');
    steps.push('Immediate attention being provided');
  } else if (ticket.priority === 'urgent') {
    steps.push('Fast-track processing initiated');
  }
  
  // Payment step
  if (ticket.pricing.totalPrice > 0) {
    steps.push('Payment authorization will be requested once details are confirmed');
  }
  
  return steps;
}

/**
 * Helper: Calculate estimated response time
 */
function calculateResponseTime(tier: string, priority: string): string {
  const baseResponseTimes = {
    'extraordinary': 30, // minutes
    'better': 2, // hours
    'good': 4 // hours
  };
  
  const priorityMultipliers = {
    'emergency': 0.1,
    'urgent': 0.5,
    'standard': 1.0
  };
  
  const baseTime = baseResponseTimes[tier as keyof typeof baseResponseTimes] || 4;
  const multiplier = priorityMultipliers[priority as keyof typeof priorityMultipliers] || 1.0;
  
  const adjustedTime = Math.max(5, Math.round(baseTime * multiplier)); // Minimum 5 minutes
  
  if (adjustedTime < 60) {
    return `${adjustedTime} minutes`;
  } else {
    const hours = Math.round(adjustedTime / 60 * 10) / 10;
    return `${hours} ${hours === 1 ? 'hour' : 'hours'}`;
  }
}

/**
 * Helper: Get ticket by ID
 */
export async function getTicketById(ticketId: string): Promise<Ticket | null> {
  const fs = await import('fs/promises');
  const path = await import('path');
  
  try {
    const ticketFile = path.join(process.cwd(), 'src/data/tickets', `${ticketId}.json`);
    const ticketData = await fs.readFile(ticketFile, 'utf-8');
    return JSON.parse(ticketData) as Ticket;
  } catch (error) {
    return null;
  }
}

/**
 * Helper: Update ticket status
 */
export async function updateTicketStatus(
  ticketId: string, 
  status: Ticket['status'], 
  note?: string
): Promise<void> {
  const ticket = await getTicketById(ticketId);
  if (!ticket) {
    throw new Error(`Ticket ${ticketId} not found`);
  }
  
  ticket.status = status;
  
  // Add timeline update
  const now = new Date().toISOString();
  if (status === 'confirmed') {
    ticket.timeline.confirmed = now;
  } else if (status === 'completed') {
    ticket.timeline.completed = now;
  }
  
  // Add communication log
  if (note) {
    ticket.communications.push({
      timestamp: now,
      from: 'system',
      message: note,
      type: 'update'
    });
  }
  
  await saveTicket(ticket);
} 