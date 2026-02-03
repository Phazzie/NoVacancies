/**
 * Story Threads Test
 * Validates thread creation and formatting
 */

import { createStoryThreads } from '../js/contracts.js';
import { formatThreadState } from '../js/prompts.js';

export function testThreadTracking() {
    console.log('🧵 Testing Story Threads...\n');
    
    // Test 1: Creation
    console.log('Test 1: createStoryThreads()');
    const threads = createStoryThreads();
    console.assert(threads.oswaldoConflict === 0, '❌ oswaldoConflict should start at 0');
    console.assert(threads.trinaTension === 0, '❌ trinaTension should start at 0');
    console.assert(threads.moneyResolved === false, '❌ moneyResolved should start false');
    console.assert(threads.carMentioned === false, '❌ carMentioned should start false');
    console.assert(threads.sydneyRealization === 0, '❌ sydneyRealization should start at 0');
    console.assert(Array.isArray(threads.boundariesSet), '❌ boundariesSet must be an array');
    console.assert(threads.boundariesSet.length === 0, '❌ boundariesSet should start empty');
    console.assert(threads.oswaldoAwareness === 0, '❌ oswaldoAwareness should start at 0');
    console.assert(threads.exhaustionLevel === 1, '❌ exhaustionLevel should start at 1');
    console.log('✅ Creation test passed\n');
    
    // Test 2: Formatting
    console.log('Test 2: formatThreadState()');
    const formatted = formatThreadState(threads);
    console.assert(typeof formatted === 'string', '❌ Should return a string');
    console.assert(formatted.includes('neutral'), '❌ Should describe neutral conflict');
    console.assert(formatted.includes('none yet'), '❌ Should show no boundaries');
    console.log('✅ Formatting test passed\n');
    
    // Test 3: Null handling
    console.log('Test 3: Null/undefined handling');
    const nullResult = formatThreadState(null);
    console.assert(nullResult.includes('No thread data'), '❌ Should handle null gracefully');
    console.log('✅ Null handling test passed\n');
    
    console.log('✅ All thread tests passed!\n');
    return true;
}

// Run if called directly
if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}`) {
    testThreadTracking();
}
