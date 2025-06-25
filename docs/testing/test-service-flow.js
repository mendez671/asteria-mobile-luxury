// Test Service Card Flow - Verify end-to-end journey
console.log('🧪 Testing Service Card Flow...\n');

// Test the enhanced prompts
const { LUXURY_SERVICES } = require('./src/data/services.ts');
const { classifyServiceRequest } = require('./src/lib/services/classifier.js');
const { detectServiceWithJourney } = require('./src/lib/services/journey.js');

console.log('✅ Test 1: Enhanced Service Prompts');
LUXURY_SERVICES.forEach((service, index) => {
  console.log(`\n${index + 1}. ${service.title} (${service.category})`);
  
  service.prompts.forEach((prompt, promptIndex) => {
    // Test classification
    const classification = classifyServiceRequest(prompt);
    
    // Test journey detection
    const journey = detectServiceWithJourney(prompt, []);
    
    console.log(`   ${promptIndex + 1}. "${prompt}"`);
    console.log(`      → Classified as: ${classification.bucket.name} (confidence: ${classification.confidence})`);
    console.log(`      → Journey phase: ${journey.phase}, Service related: ${journey.isServiceRelated}`);
    console.log(`      → Ready for ticket: ${journey.readyForTicket}`);
    
    // Check if prompt has proper booking language
    const hasBookingLanguage = prompt.includes('I need') || 
                              prompt.includes('Book me') || 
                              prompt.includes('Can you arrange') || 
                              prompt.includes('Can you book') ||
                              prompt.includes('I want') ||
                              prompt.includes('Help me') ||
                              prompt.includes('Reserve');
    
    console.log(`      → Has booking language: ${hasBookingLanguage ? '✅' : '❌'}`);
  });
});

console.log('\n✅ Test 2: Journey Flow Simulation');
const testPrompt = "I need a private jet from NYC to Monaco for Grand Prix";
console.log(`\nTesting: "${testPrompt}"`);

// Step 1: Initial request
const initialJourney = detectServiceWithJourney(testPrompt, []);
console.log(`Step 1 - Initial: Phase=${initialJourney.phase}, ServiceRelated=${initialJourney.isServiceRelated}`);

// Step 2: Follow-up conversation
const conversationHistory = [
  { role: 'user', content: testPrompt },
  { role: 'assistant', content: 'Excellent choice. I\'ll arrange your private aviation to Monaco for the Grand Prix. When would you like to depart?' }
];

const followUpJourney = detectServiceWithJourney('I need to leave tomorrow at 2pm for 4 people', conversationHistory);
console.log(`Step 2 - Follow-up: Phase=${followUpJourney.phase}, ReadyForTicket=${followUpJourney.readyForTicket}`);

// Step 3: Confirmation
const confirmationHistory = [
  ...conversationHistory,
  { role: 'user', content: 'I need to leave tomorrow at 2pm for 4 people' },
  { role: 'assistant', content: 'Perfect. I have options for tomorrow at 2pm for 4 passengers. Shall I proceed with booking?' }
];

const confirmationJourney = detectServiceWithJourney('Yes, book it', confirmationHistory);
console.log(`Step 3 - Confirmation: Phase=${confirmationJourney.phase}, ReadyForTicket=${confirmationJourney.readyForTicket}`);
console.log(`Should create ticket: ${confirmationJourney.shouldCreateTicket ? '✅' : '❌'}`);

console.log('\n🎯 Summary:');
console.log(`- Total services: ${LUXURY_SERVICES.length}`);
console.log(`- Total prompts: ${LUXURY_SERVICES.reduce((sum, service) => sum + service.prompts.length, 0)}`);
console.log(`- All prompts have booking language: ${LUXURY_SERVICES.every(service => 
  service.prompts.every(prompt => 
    prompt.includes('I need') || prompt.includes('Book me') || prompt.includes('Can you arrange') || 
    prompt.includes('Can you book') || prompt.includes('I want') || prompt.includes('Help me') || prompt.includes('Reserve')
  )
) ? '✅' : '❌'}`);

console.log('\n✅ Service Card Flow Test Complete!'); 