# 🎯 SPANNER Razorpay Webhook Setup Guide

## 📋 Complete Configuration Steps

### 1. **Get Your Replit App URL**
```
https://your-replit-domain.replit.app
```
Find this in your Replit workspace (usually shows at top of browser)

### 2. **Razorpay Webhook Configuration**

Go to **[Razorpay Dashboard](https://dashboard.razorpay.com)** → **Settings** → **Webhooks**

#### **Webhook URL:**
```
https://your-replit-domain.replit.app/api/wallet/webhook
```

#### **Active Events (Select These):**
✅ **payment.authorized** - Payment authorized by customer  
✅ **payment.failed** - Payment attempt failed  
✅ **payment.captured** - **MOST IMPORTANT** - Payment successfully completed  
✅ **payment.dispute.created** - Dispute raised by customer  
✅ **payment.dispute.won** - Dispute resolved in your favor  
✅ **payment.dispute.lost** - Dispute resolved against you  
✅ **payment.dispute.closed** - Dispute resolution completed  

#### **Webhook Secret:**
Generate a strong secret (keep this private!)
Example: `whsec_1234567890abcdefghijklmnopqrstuvwxyz`

#### **Alert Email:**
`superadmin@spanner.co.in`

### 3. **Environment Variable Setup**

Add to your Replit Secrets (🔒 icon):
```
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret_here
```

### 4. **Test Webhook Setup**

Once configured, the system will:
- ✅ **Instantly detect payments** (no 3-second delay)
- ✅ **Verify webhook signatures** for security
- ✅ **Prevent duplicate processing** 
- ✅ **Handle all payment events** automatically

## 🔧 **Current System Status**

### **✅ Working Features:**
- Payment order creation
- Real-time status polling (every 3 seconds)
- Live Razorpay integration 
- Production-ready payment processing

### **🚀 With Webhook (Enhanced):**
- **Instant payment detection** (milliseconds vs 3 seconds)
- **Bank-grade security** with signature verification
- **Automatic failed payment handling**
- **Duplicate event protection**
- **Comprehensive payment logging**

## 🎯 **Benefits of Webhook Setup**

| Feature | Without Webhook | With Webhook |
|---------|----------------|--------------|
| Payment Detection | 3 seconds | Instant |
| API Calls | High (polling) | Minimal |
| Reliability | Good | Excellent |
| Failed Payments | Manual check | Auto-handled |
| Security | Standard | Bank-grade |

## 🛡️ **Security Features**

- **HMAC-SHA256 signature verification**
- **Duplicate event prevention** using event IDs  
- **Raw body parsing** for accurate signature validation
- **Comprehensive error handling** and logging
- **Production-ready implementation**

## 📊 **Webhook Events Handled**

### **payment.captured** (Success)
```json
{
  "event": "payment.captured",
  "payload": {
    "payment": {
      "entity": {
        "id": "pay_xyz123",
        "amount": 1000,
        "status": "captured",
        "method": "upi"
      }
    }
  }
}
```
**Action:** Instantly credits wallet with real money

### **payment.failed** (Failure)  
```json
{
  "event": "payment.failed", 
  "payload": {
    "payment": {
      "entity": {
        "id": "pay_abc456",
        "error_code": "BAD_REQUEST_ERROR",
        "error_description": "Payment failed"
      }
    }
  }
}
```
**Action:** Marks payment as failed, no wallet credit

## ✅ **Setup Verification**

After configuration, test by:
1. Creating a ₹10 top-up order
2. Completing payment successfully  
3. Check console logs for webhook events
4. Verify instant wallet credit

**Expected Log Output:**
```
Webhook received - Event ID: evt_abc123
✅ Webhook signature verified successfully  
💰 Payment captured via webhook: pay_xyz123
✅ Webhook payment processed successfully
```

Your payment system is now **production-ready** with instant detection!