# 🚀 SPANNER Deployment Guide

## Quick Git Import to New Replit Account

### Step 1: Import Repository
1. **Create New Repl**: Go to [replit.com](https://replit.com) and click "Create Repl"
2. **Import from Git**: Select "Import from GitHub" 
3. **Enter Repository URL**: Paste your GitHub repository URL
4. **Configure Repl**: Choose a name and make it public/private as needed

### Step 2: Environment Setup
1. **Set Database URL**: 
   - Go to "Tools" → "Environment variables" in your Repl
   - Add: `DATABASE_URL` with your PostgreSQL connection string
   - Example: `postgresql://username:password@hostname:port/database`

2. **Optional API Keys** (can be set later via admin panel):
   - `GEMINI_API_KEY`: For voice processing features
   - `SMS_API_KEY`: For OTP delivery

### Step 3: First Run
1. **Click "Run"**: The application will automatically:
   - Install all dependencies
   - Create database tables
   - Populate sample data
   - Start the server

2. **Access Application**: Use the generated Replit URL to access your app

### Step 4: Login with Default Credentials
- **Admin**: Mobile `9876543210` (OTP: `123456`)
- **Client**: Mobile `9876543211` (OTP: `123456`)
- **Worker**: Mobile `9876543212` (OTP: `123456`)

## What Gets Auto-Created

### Database Schema
✅ **Users Table**: Admin, client, and worker accounts  
✅ **Service Categories**: 5 common blue-collar services  
✅ **Worker Profiles**: Complete worker information  
✅ **Sample Booking**: Completed job with review  
✅ **Advertisements**: Promotional content system  
✅ **API Keys Storage**: Secure key management  

### Sample Data Overview
- **Service Categories**: Plumbing, Electrical, Painting, Carpentry, Mechanics
- **Geographic Coverage**: Salem, Coimbatore, Chennai districts with areas
- **Complete Workflow**: From user registration to job completion
- **Financial Records**: Sample transactions and wallet balances

## Post-Deployment Configuration

### 1. API Keys Management
Access **Admin Panel** → **Key Management** to configure:
- **Google Gemini API**: For voice-powered job posting
- **SMS Services**: For OTP delivery
- **Payment Gateways**: Stripe/Razorpay integration
- **Email Services**: For notifications

### 2. Customize Service Areas
- Add your target cities/districts via **Admin Panel**
- Configure service categories for your market
- Set up worker verification process

### 3. Financial Configuration
- Configure commission rates via **Admin Panel**
- Set up payment gateway credentials
- Define GST and tax settings

## Troubleshooting

### Common Issues

**Database Connection Failed**
```
Error: Database setup failed
```
**Solution**: Verify `DATABASE_URL` is correctly set in environment variables

**Missing Dependencies**
```
Error: Module not found
```
**Solution**: Replit auto-installs packages. If issues persist, run `npm install`

**Port Already in Use**
```
Error: EADDRINUSE :::5000
```
**Solution**: Repl will restart automatically. Wait 30 seconds and refresh.

### Verification Checklist

After deployment, verify these features work:
- [ ] User registration with mobile OTP
- [ ] Quick Post voice feature (requires GEMINI_API_KEY)
- [ ] Service booking workflow  
- [ ] Admin panel access
- [ ] Mobile app interface (`/mobile-test`)
- [ ] Chat system between users

## Production Considerations

### Security
- [ ] Change default OTP from `123456` to dynamic generation
- [ ] Configure real SMS service for OTP delivery
- [ ] Set up proper SSL certificates
- [ ] Configure CORS for production domains

### Performance
- [ ] Enable database connection pooling
- [ ] Configure CDN for static assets
- [ ] Set up caching for frequently accessed data
- [ ] Monitor database performance

### Monitoring
- [ ] Set up error logging service
- [ ] Configure uptime monitoring
- [ ] Monitor database performance
- [ ] Track user analytics

## Scaling

### Horizontal Scaling
- Database read replicas for improved performance
- Load balancing for multiple Repl instances
- CDN integration for global content delivery

### Feature Extensions
- Integration with existing business systems
- Custom payment gateway integration
- Advanced analytics and reporting
- Multi-language support

## Support

### Documentation
- **Technical Docs**: See `/docs` folder for detailed API documentation
- **User Guides**: Available in admin panel help section
- **Video Tutorials**: Coming soon

### Getting Help
- **GitHub Issues**: Report bugs and feature requests
- **Community Forum**: Join our Discord for discussions
- **Direct Support**: Contact via admin panel feedback

---

**Ready to deploy? Follow these steps and your SPANNER marketplace will be live in minutes!**