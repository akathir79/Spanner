# 🌐 SPANNER Domain Setup Guide - spanner.co.in

## 📋 Complete Setup Process

### **Step 1: Deploy Your SPANNER App**
1. **Click the "Deploy" button** in your Replit workspace
2. **Choose "Autoscale Deployments"** 
3. **Wait for deployment** to complete
4. **Note your deployment URL** (e.g., `https://spanner--yourusername.replit.app`)

### **Step 2: Configure Custom Domain in Replit**
1. **Go to your deployment** → Settings tab
2. **Click "Link a domain"**
3. **Enter your domain:** `spanner.co.in`
4. **Copy the DNS records** provided by Replit

### **Step 3: Configure DNS in GoDaddy**

#### **Login to GoDaddy Domain Management:**
1. Go to [GoDaddy Domain Manager](https://dcc.godaddy.com/manage)
2. Find `spanner.co.in` → Click "DNS"

#### **Add DNS Records:**

**For Root Domain (spanner.co.in):**
```
Type: A
Name: @ (or leave blank)
Value: [IP address from Replit]
TTL: 1 Hour (3600)

Type: TXT
Name: @ (or leave blank)
Value: replit-user=your-replit-username
TTL: 1 Hour (3600)
```

**For WWW Subdomain (www.spanner.co.in):**
```
Type: A
Name: www
Value: [same IP address from Replit]
TTL: 1 Hour (3600)
```

### **Step 4: Update Razorpay Webhook**
Once domain is live, update your webhook URL:
```
https://spanner.co.in/api/wallet/webhook
```

### **Step 5: Verify Setup**
1. **Wait 15-30 minutes** for DNS propagation
2. **Test:** Visit `https://spanner.co.in`
3. **Check SSL:** Should show secure connection
4. **Test payments:** Try a small wallet top-up

## 🔧 **Expected DNS Configuration**

| Record Type | Name | Value | Purpose |
|-------------|------|--------|---------|
| A | @ | Replit IP | Points root domain to Replit |
| A | www | Replit IP | Points www subdomain to Replit |
| TXT | @ | replit-user=username | Verifies domain ownership |

## ⚡ **Benefits After Setup**

- ✅ **Professional URL:** `https://spanner.co.in`
- ✅ **SSL Certificate:** Automatic HTTPS
- ✅ **Instant Webhooks:** `spanner.co.in/api/wallet/webhook`
- ✅ **Production Ready:** Real domain for Indian users
- ✅ **SEO Friendly:** Custom domain boosts search rankings

## 🚨 **Troubleshooting**

### **Common Issues:**
- **DNS not propagating:** Wait up to 48 hours (usually 30 minutes)
- **Multiple A records:** Remove any existing A records first
- **Cloudflare issues:** Turn off proxy (orange cloud) if using Cloudflare
- **SSL not working:** Replit handles SSL automatically once DNS is verified

### **Check DNS Propagation:**
Use [whatsmydns.net](https://whatsmydns.net) to verify DNS changes globally.

## 🎯 **Final Result**

Your SPANNER platform will be accessible at:
- **Main site:** `https://spanner.co.in`
- **API endpoints:** `https://spanner.co.in/api/*`
- **Webhook URL:** `https://spanner.co.in/api/wallet/webhook`

Ready for launch in India with professional domain and instant payment detection!