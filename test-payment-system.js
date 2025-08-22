#!/usr/bin/env node
/**
 * SPANNER Payment System Test Script
 * Tests both successful and failed payment detection
 */

const https = require('https');
const fs = require('fs');

// Test configuration
const BASE_URL = 'http://localhost:5000';
const TEST_USER_ID = 'TAN-SAL-0001-W';
const TEST_AMOUNTS = [10, 25, 50];

// Color codes for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'SPANNER-Test-Client'
      }
    };

    const req = require(url.protocol === 'https:' ? 'https' : 'http').request(url, options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const parsed = body ? JSON.parse(body) : {};
          resolve({ status: res.statusCode, data: parsed });
        } catch (error) {
          resolve({ status: res.statusCode, data: { error: 'Invalid JSON response', raw: body } });
        }
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function testOrderCreation(amount) {
  log(`\n📦 Testing order creation for ₹${amount}...`, 'blue');
  
  try {
    const response = await makeRequest('POST', '/api/wallet/topup', { amount });
    
    if (response.status === 200 && response.data.success) {
      log(`✅ Order created successfully: ${response.data.order.orderId}`, 'green');
      return response.data.order.orderId;
    } else {
      log(`❌ Order creation failed: ${JSON.stringify(response.data)}`, 'red');
      return null;
    }
  } catch (error) {
    log(`❌ Request error: ${error.message}`, 'red');
    return null;
  }
}

async function testPaymentStatusPolling(orderId, maxAttempts = 10) {
  log(`\n🔄 Testing payment status polling for ${orderId}...`, 'blue');
  
  let attempts = 0;
  const statuses = new Set();
  
  while (attempts < maxAttempts) {
    try {
      const response = await makeRequest('GET', `/api/wallet/payment-status/${orderId}`);
      
      if (response.status === 200 && response.data.success) {
        const status = response.data.status;
        statuses.add(status);
        
        log(`📊 Status check ${attempts + 1}: ${status}`, status === 'paid' ? 'green' : 'yellow');
        
        if (status === 'paid') {
          log(`✅ Payment detected as successful!`, 'green');
          return { success: true, status, attempts: attempts + 1 };
        } else if (status === 'failed') {
          log(`❌ Payment detected as failed!`, 'red');
          return { success: false, status, attempts: attempts + 1 };
        }
      } else {
        log(`⚠️ Status check failed: ${JSON.stringify(response.data)}`, 'yellow');
      }
      
      attempts++;
      if (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    } catch (error) {
      log(`❌ Status check error: ${error.message}`, 'red');
      attempts++;
    }
  }
  
  return { 
    success: false, 
    status: 'timeout', 
    attempts, 
    statusesSeen: Array.from(statuses) 
  };
}

async function testWalletBalance() {
  log(`\n💰 Testing wallet balance retrieval...`, 'blue');
  
  try {
    const response = await makeRequest('GET', '/api/wallet');
    
    if (response.status === 200 && response.data.wallet) {
      const balance = parseFloat(response.data.wallet.balance);
      log(`✅ Current wallet balance: ₹${balance.toFixed(2)}`, 'green');
      return balance;
    } else {
      log(`❌ Wallet balance check failed: ${JSON.stringify(response.data)}`, 'red');
      return null;
    }
  } catch (error) {
    log(`❌ Wallet request error: ${error.message}`, 'red');
    return null;
  }
}

async function runSystemTests() {
  log(`${colors.bold}🚀 SPANNER Payment System Test Suite${colors.reset}`, 'blue');
  log(`Testing live Razorpay integration with real-time detection\n`);
  
  const results = {
    orderCreation: [],
    statusPolling: [],
    walletChecks: []
  };
  
  // Test initial wallet balance
  const initialBalance = await testWalletBalance();
  results.walletChecks.push({ type: 'initial', balance: initialBalance });
  
  // Test order creation for different amounts
  for (const amount of TEST_AMOUNTS) {
    const orderId = await testOrderCreation(amount);
    results.orderCreation.push({ amount, orderId, success: !!orderId });
    
    if (orderId) {
      // Test payment status polling
      log(`\n⏰ Starting 30-second status monitoring...`, 'yellow');
      const pollingResult = await testPaymentStatusPolling(orderId, 10);
      results.statusPolling.push({ orderId, amount, ...pollingResult });
      
      // Check wallet balance after each test
      const newBalance = await testWalletBalance();
      results.walletChecks.push({ type: 'post-payment', amount, balance: newBalance });
      
      // Break after first successful payment for demo
      if (pollingResult.success) {
        break;
      }
    }
  }
  
  // Generate test report
  generateTestReport(results);
}

function generateTestReport(results) {
  log(`\n${colors.bold}📋 TEST REPORT${colors.reset}`, 'blue');
  log(`${'='.repeat(50)}`);
  
  // Order Creation Results
  log(`\n🔹 Order Creation Tests:`, 'bold');
  results.orderCreation.forEach(test => {
    const status = test.success ? '✅ PASS' : '❌ FAIL';
    log(`  ₹${test.amount}: ${status} ${test.orderId || 'No order ID'}`);
  });
  
  // Status Polling Results
  log(`\n🔹 Payment Status Polling Tests:`, 'bold');
  results.statusPolling.forEach(test => {
    const status = test.success ? '✅ DETECTED' : '⚠️ PENDING';
    log(`  ${test.orderId}: ${status} (${test.attempts} checks, final: ${test.status})`);
    if (test.statusesSeen) {
      log(`    Statuses seen: ${test.statusesSeen.join(' → ')}`);
    }
  });
  
  // Wallet Balance Tracking
  log(`\n🔹 Wallet Balance Tracking:`, 'bold');
  results.walletChecks.forEach((check, index) => {
    if (check.balance !== null) {
      const balanceStr = `₹${check.balance.toFixed(2)}`;
      log(`  ${index + 1}. ${check.type}: ${balanceStr} ${check.amount ? `(after ₹${check.amount} test)` : ''}`);
    }
  });
  
  // System Status
  log(`\n🔹 System Status:`, 'bold');
  const ordersCreated = results.orderCreation.filter(t => t.success).length;
  const paymentsDetected = results.statusPolling.filter(t => t.success).length;
  
  log(`  Orders created: ${ordersCreated}/${results.orderCreation.length}`, ordersCreated > 0 ? 'green' : 'red');
  log(`  Payments detected: ${paymentsDetected}/${results.statusPolling.length}`, paymentsDetected > 0 ? 'green' : 'yellow');
  log(`  Real-time polling: ${results.statusPolling.length > 0 ? 'ACTIVE' : 'NOT TESTED'}`, results.statusPolling.length > 0 ? 'green' : 'red');
  
  // Save detailed results
  const reportFile = `payment-test-report-${Date.now()}.json`;
  fs.writeFileSync(reportFile, JSON.stringify(results, null, 2));
  log(`\n📄 Detailed report saved: ${reportFile}`, 'blue');
  
  log(`\n${colors.bold}🎯 Test Complete!${colors.reset}`);
}

// Run tests
if (require.main === module) {
  runSystemTests().catch(error => {
    log(`\n❌ Test suite failed: ${error.message}`, 'red');
    process.exit(1);
  });
}

module.exports = { runSystemTests, testOrderCreation, testPaymentStatusPolling };