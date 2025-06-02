// Browser Console Test Commands for Service Cards
// Copy and paste these into your browser console at http://localhost:3000

console.log('🧪 Testing Service Cards in Browser...');

// Test 1: Check if service cards are rendered
setTimeout(() => {
  const serviceCards = document.querySelectorAll('[class*="service-card"]');
  console.log(`✅ Found ${serviceCards.length} service cards`);
  
  if (serviceCards.length > 0) {
    console.log('✅ Service cards are rendering correctly');
  } else {
    console.log('❌ No service cards found - check component rendering');
  }
}, 2000);

// Test 2: Check if How It Works section exists
setTimeout(() => {
  const howItWorks = document.querySelector('h3:contains("How It Works")') || 
                     document.querySelector('[title*="How It Works"]') ||
                     document.querySelector('button:contains("How It Works")');
  
  if (howItWorks) {
    console.log('✅ How It Works section found');
  } else {
    console.log('❌ How It Works section not found');
  }
}, 2000);

// Test 3: Check if chat interface exists
setTimeout(() => {
  const chatInterface = document.querySelector('[id="chat-interface"]') ||
                        document.querySelector('input[placeholder*="luxury"]') ||
                        document.querySelector('input[placeholder*="experience"]');
  
  if (chatInterface) {
    console.log('✅ Chat interface found');
  } else {
    console.log('❌ Chat interface not found');
  }
}, 2000);

// Test 4: Simulate clicking a service card (run this manually)
function testServiceCardClick() {
  const firstCard = document.querySelector('[class*="service-card"]');
  if (firstCard) {
    console.log('🖱️ Clicking first service card...');
    firstCard.click();
    
    setTimeout(() => {
      const prompts = document.querySelectorAll('[class*="service-prompts"] button, button:contains("VIP"), button:contains("Private")');
      console.log(`✅ Found ${prompts.length} prompts after clicking`);
      
      if (prompts.length > 0) {
        console.log('✅ Service card expansion working!');
        return prompts[0]; // Return first prompt for testing
      } else {
        console.log('❌ No prompts found after clicking');
      }
    }, 500);
  } else {
    console.log('❌ No service card found to click');
  }
}

// Test 5: Test prompt selection (run after testServiceCardClick)
function testPromptSelection() {
  const prompts = document.querySelectorAll('button[class*="group"]:contains("VIP"), button:contains("Private")');
  if (prompts.length > 0) {
    console.log('🖱️ Clicking first prompt...');
    prompts[0].click();
    
    setTimeout(() => {
      const chatInput = document.querySelector('input[placeholder*="luxury"], input[placeholder*="experience"]');
      if (chatInput && chatInput.value.length > 0) {
        console.log(`✅ Chat populated with: "${chatInput.value}"`);
        console.log('✅ Prompt selection working!');
      } else {
        console.log('❌ Chat input not populated');
      }
    }, 500);
  } else {
    console.log('❌ No prompts found - run testServiceCardClick() first');
  }
}

console.log(`
📋 Manual Test Instructions:
1. Wait for page to load completely
2. Run: testServiceCardClick()
3. Run: testPromptSelection()
4. Check if chat scrolls to top
5. Verify "How It Works" can be expanded/collapsed

🌐 Current URL should be: http://localhost:3000
`); 