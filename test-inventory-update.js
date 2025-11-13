// Test script for blood inventory update functionality
// Run this in browser console on the hospital dashboard page

async function testInventoryUpdate() {
  console.log('🧪 Testing Blood Inventory Update Functionality');
  
  try {
    // Test 1: Check if hospitalService is available
    console.log('1. Checking hospitalService availability...');
    if (typeof hospitalService === 'undefined') {
      console.error('❌ hospitalService not found. Make sure you\'re on the hospital dashboard page.');
      return;
    }
    console.log('✅ hospitalService found');
    
    // Test 2: Check authentication
    console.log('2. Checking authentication...');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError) {
      console.error('❌ Authentication error:', authError);
      return;
    }
    console.log('✅ Authentication status:', user ? 'Authenticated' : 'Anonymous');
    
    // Test 3: Get current user session
    console.log('3. Checking user session...');
    const userSession = localStorage.getItem('userSession');
    if (!userSession) {
      console.error('❌ No user session found in localStorage');
      return;
    }
    const userData = JSON.parse(userSession);
    console.log('✅ User session found:', userData.id);
    
    // Test 4: Get current inventory
    console.log('4. Getting current inventory...');
    const currentInventory = await hospitalService.getBloodInventory(userData.id);
    console.log('Current inventory:', currentInventory);
    
    // Test 5: Test inventory update
    console.log('5. Testing inventory update...');
    const testBloodType = 'A+';
    const currentUnits = currentInventory.find(item => item.bloodType === testBloodType)?.currentUnits || 0;
    const testUnits = currentUnits + 1; // Increment by 1
    
    console.log(`Updating ${testBloodType} from ${currentUnits} to ${testUnits} units...`);
    const result = await hospitalService.updateBloodInventory(userData.id, testBloodType, testUnits);
    console.log('✅ Inventory update successful:', result);
    
    // Test 6: Wait a moment for database consistency
    console.log('6. Waiting for database consistency...');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Test 7: Verify the update
    console.log('7. Verifying the update...');
    const updatedInventory = await hospitalService.getBloodInventory(userData.id);
    const updatedItem = updatedInventory.find(item => item.bloodType === testBloodType);
    console.log('✅ Verification result:', updatedItem);
    
    if (updatedItem && updatedItem.currentUnits === testUnits) {
      console.log('🎉 All tests passed! Blood inventory update is working correctly.');
      console.log('📊 Updated inventory summary:', updatedInventory);
    } else {
      console.error('❌ Update verification failed. Expected:', testUnits, 'Got:', updatedItem?.currentUnits);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack
    });
  }
}

// Additional test function to check UI state
function checkUIState() {
  console.log('🔍 Checking UI State...');
  
  // Check if we're on the hospital dashboard
  const isOnDashboard = window.location.pathname.includes('hospital-dashboard');
  console.log('On hospital dashboard:', isOnDashboard);
  
  // Check if inventory tab is active
  const inventoryTab = document.querySelector('[data-tab="inventory"]');
  console.log('Inventory tab found:', !!inventoryTab);
  
  // Check inventory data in React state (if accessible)
  if (window.React && window.React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED) {
    console.log('React DevTools available for state inspection');
  }
  
  // Check for debug info
  const debugInfo = document.querySelector('.bg-yellow-50');
  console.log('Debug info visible:', !!debugInfo);
  if (debugInfo) {
    console.log('Debug info text:', debugInfo.textContent);
  }
}

// Run the tests
console.log('Starting comprehensive inventory tests...');
testInventoryUpdate().then(() => {
  console.log('\n--- UI State Check ---');
  checkUIState();
});
