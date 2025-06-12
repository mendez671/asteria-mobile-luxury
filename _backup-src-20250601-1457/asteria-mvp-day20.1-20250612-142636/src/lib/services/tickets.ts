import { classifyServiceRequest } from './classifier';
import { extractServiceDetails, ServiceDetails } from './extractor';
import { getFirebaseAdmin } from '../firebase/admin';

export interface ServiceTicket {
  id: string;
  member_id: string;
  service_bucket: string;
  service_name: string;
  urgency: 'LOW' | 'MEDIUM' | 'HIGH';
  details: ServiceDetails;
  created_at: Date;
  status: 'pending' | 'assigned' | 'in_progress' | 'completed';
  // Firebase-specific fields
  firebase_doc_id?: string;
  last_updated?: Date;
  concierge_assigned?: string;
  member_tier?: string;
}

export function generateTicketId(): string {
  const timestamp = Date.now().toString().slice(-4);
  const random = Math.floor(Math.random() * 9000) + 1000;
  return `SR-${random}${timestamp}`;
}

// ===============================
// FIREBASE STORAGE INTEGRATION
// ===============================

// Function overloads for backward compatibility
export function createServiceTicket(message: string, memberId?: string): ServiceTicket;
export function createServiceTicket(message: string, memberId: string, memberTier: string): Promise<ServiceTicket>;
export function createServiceTicket(
  message: string,
  memberId: string = 'TAG-001',
  memberTier?: string
): ServiceTicket | Promise<ServiceTicket> {
  
  // If memberTier is provided, use Firebase storage (async)
  if (memberTier !== undefined) {
    return createServiceTicketWithFirebase(message, memberId, memberTier);
  }
  
  // Otherwise, use legacy in-memory creation (sync)
  return createServiceTicketLegacy(message, memberId);
}

async function createServiceTicketWithFirebase(
  message: string,
  memberId: string = 'TAG-001',
  memberTier: string = 'all-members'
): Promise<ServiceTicket> {
  const classification = classifyServiceRequest(message);
  const details = extractServiceDetails(message, classification.bucket);
  
  // Determine urgency based on classification and member tier
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
  
  // Enhanced urgency for premium member tiers
  if (memberTier === 'founding10') {
    urgency = 'HIGH';
  } else if (memberTier === 'fifty-k' && urgency === 'LOW') {
    urgency = 'MEDIUM';
  }
  
  const ticket: ServiceTicket = {
    id: generateTicketId(),
    member_id: memberId,
    service_bucket: classification.bucket.id,
    service_name: classification.bucket.name,
    urgency,
    details,
    created_at: new Date(),
    status: 'pending',
    member_tier: memberTier,
    last_updated: new Date()
  };
  
  try {
    console.log(`🔥 [FIREBASE] Storing ticket ${ticket.id} to Firestore...`);
    
    const { adminDb } = await getFirebaseAdmin();
    const docRef = await adminDb.collection('service_requests').add({
      ...ticket,
      created_at: new Date().toISOString(),
      last_updated: new Date().toISOString(),
      // Additional Firebase-specific metadata
      firebase_created_at: new Date(),
      message_content: message.substring(0, 500), // Store first 500 chars for context
      classification_data: {
        bucket: classification.bucket,
        confidence: classification.confidence,
        is_urgent: classification.is_urgent
      },
      // Indexing fields for efficient queries
      member_id_indexed: memberId,
      urgency_indexed: urgency,
      service_bucket_indexed: classification.bucket.id,
      status_indexed: 'pending',
      created_timestamp: Date.now()
    });
    
    ticket.firebase_doc_id = docRef.id;
    console.log(`✅ [FIREBASE] Ticket ${ticket.id} stored successfully with doc ID: ${docRef.id}`);
    
    // Update the document with its own doc ID for easier reference
    await docRef.update({
      firebase_doc_id: docRef.id
    });
    
  } catch (firebaseError) {
    console.error(`❌ [FIREBASE] Failed to store ticket ${ticket.id}:`, firebaseError);
    // Continue without Firebase storage - ticket still works for immediate processing
    console.warn(`⚠️ [FIREBASE] Ticket ${ticket.id} created without persistent storage`);
  }
  
  return ticket;
}

function createServiceTicketLegacy(
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

// ===============================
// FIREBASE QUERY FUNCTIONS
// ===============================

export async function getServiceTicket(ticketId: string): Promise<ServiceTicket | null> {
  try {
    console.log(`🔍 [FIREBASE] Retrieving ticket ${ticketId}...`);
    
    const { adminDb } = await getFirebaseAdmin();
    const querySnapshot = await adminDb
      .collection('service_requests')
      .where('id', '==', ticketId)
      .limit(1)
      .get();
    
    if (querySnapshot.empty) {
      console.log(`❌ [FIREBASE] Ticket ${ticketId} not found`);
      return null;
    }
    
    const doc = querySnapshot.docs[0];
    const data = doc.data();
    
    console.log(`✅ [FIREBASE] Ticket ${ticketId} retrieved successfully`);
    
    return {
      ...data,
      created_at: new Date(data.created_at),
      last_updated: data.last_updated ? new Date(data.last_updated) : undefined,
      firebase_doc_id: doc.id
    } as ServiceTicket;
    
  } catch (error) {
    console.error(`❌ [FIREBASE] Error retrieving ticket ${ticketId}:`, error);
    return null;
  }
}

export async function updateServiceTicketStatus(
  ticketId: string, 
  status: ServiceTicket['status'],
  conciergeId?: string
): Promise<boolean> {
  try {
    console.log(`🔄 [FIREBASE] Updating ticket ${ticketId} status to ${status}...`);
    
    const { adminDb } = await getFirebaseAdmin();
    const querySnapshot = await adminDb
      .collection('service_requests')
      .where('id', '==', ticketId)
      .limit(1)
      .get();
    
    if (querySnapshot.empty) {
      console.error(`❌ [FIREBASE] Ticket ${ticketId} not found for status update`);
      return false;
    }
    
    const doc = querySnapshot.docs[0];
    const updateData: any = {
      status,
      status_indexed: status,
      last_updated: new Date().toISOString()
    };
    
    if (conciergeId) {
      updateData.concierge_assigned = conciergeId;
    }
    
    await doc.ref.update(updateData);
    
    console.log(`✅ [FIREBASE] Ticket ${ticketId} status updated to ${status}`);
    return true;
    
  } catch (error) {
    console.error(`❌ [FIREBASE] Error updating ticket ${ticketId}:`, error);
    return false;
  }
}

export async function getMemberServiceTickets(
  memberId: string, 
  limit: number = 10
): Promise<ServiceTicket[]> {
  try {
    console.log(`📋 [FIREBASE] Retrieving tickets for member ${memberId}...`);
    
    const { adminDb } = await getFirebaseAdmin();
    const querySnapshot = await adminDb
      .collection('service_requests')
      .where('member_id_indexed', '==', memberId)
      .orderBy('created_timestamp', 'desc')
      .limit(limit)
      .get();
    
    const tickets: ServiceTicket[] = [];
    
    querySnapshot.forEach(doc => {
      const data = doc.data();
      tickets.push({
        ...data,
        created_at: new Date(data.created_at),
        last_updated: data.last_updated ? new Date(data.last_updated) : undefined,
        firebase_doc_id: doc.id
      } as ServiceTicket);
    });
    
    console.log(`✅ [FIREBASE] Retrieved ${tickets.length} tickets for member ${memberId}`);
    return tickets;
    
  } catch (error) {
    console.error(`❌ [FIREBASE] Error retrieving tickets for member ${memberId}:`, error);
    return [];
  }
} 