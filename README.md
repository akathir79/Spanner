# SPANNER - India Blue-Collar Service Marketplace

[![Deploy on Replit](https://replit.com/badge/github/your-username/spanner)](https://replit.com/new/github/your-username/spanner)

A comprehensive web and mobile application designed to connect blue-collar service workers with clients across all states and districts of India. Built with modern technologies and featuring voice-powered job posting, real-time tracking, and comprehensive financial management.

## 🚀 Quick Setup for New Replit Account

### Automatic Database Setup
This project includes **automatic database initialization** - no manual setup required!

1. **Fork/Import to Replit**: Click the "Deploy on Replit" button or import from Git
2. **Set Environment Variables**: Add your `DATABASE_URL` in Replit's environment variables
3. **Run the App**: Click "Run" - the database will be automatically created with sample data
4. **Start Using**: Login with default credentials and explore all features

### Default Login Credentials
- **Admin**: Mobile `9876543210` (OTP: `123456`)
- **Client**: Mobile `9876543211` (OTP: `123456`)  
- **Worker**: Mobile `9876543212` (OTP: `123456`)

## 🎯 Key Features

### Core Functionality
- **Multi-User System**: Clients, Workers, Admins, and Super Admins with role-based dashboards
- **Voice-Powered Quick Post**: Multilingual job posting using Google Gemini API (10+ Indian languages)
- **Simplified Registration**: Quick Join with only first name and mobile number
- **Professional Location Collection**: Address collection during job posting with GPS detection
- **OTP-Based Security**: Mobile verification and job completion system
- **Real-Time Communication**: Chat system between clients and workers
- **Comprehensive Reviews**: Rating and feedback system for completed jobs

### Advanced Features
- **Financial Management**: 5-tier wallet system with GST calculations and admin commissions
- **Location Tracking**: Real-time GPS tracking during service delivery
- **SEO Optimization**: Enterprise-level SEO with Schema.org structured data
- **Advertisement System**: Admin-managed promotional content
- **API Key Management**: Centralized secure storage for external service integrations
- **Mobile Responsive**: Works perfectly on all devices

### Privacy & Security
- **Address Privacy**: Workers see only area/district until job acceptance
- **Full Address Access**: Complete details shared only after bid acceptance
- **OTP Verification**: Secure job completion workflow
- **Data Protection**: Comprehensive privacy controls throughout the platform

## 🏗️ Architecture

### Frontend
- **React + TypeScript** with Vite build system
- **Shadcn/UI Components** built on Radix UI primitives
- **Tailwind CSS** for responsive styling
- **React Query** for efficient server state management
- **Wouter** for lightweight routing
- **React Hook Form** with Zod validation

### Backend  
- **Node.js + Express** with TypeScript
- **PostgreSQL** with Neon serverless hosting
- **Drizzle ORM** for type-safe database operations
- **RESTful API** design with comprehensive endpoints
- **Real-time WebSocket** communication for chat and tracking

### Mobile App
- **React Native + Expo** (in `spanner-mobile/` directory)
- **Shared Backend API** with web application
- **Native Mobile UI** optimized for touch interfaces
- **GPS Integration** for location services
- **Offline Capability** (planned)

## 📱 Dual Platform Support

### Web Application
- Complete desktop and mobile web interface
- Full feature set including admin panels
- Voice-powered job posting with browser speech recognition
- Real-time notifications and chat

### Mobile Application  
- Native iOS and Android experience
- Optimized touch interface for quick job posting
- Enhanced GPS location services
- Push notifications (planned)
- Seamless data sync with web platform

## 🔧 Technology Stack

### Core Dependencies
```json
{
  "runtime": "Node.js 20+",
  "frontend": "React 18 + TypeScript",
  "backend": "Express + TypeScript", 
  "database": "PostgreSQL (Neon)",
  "orm": "Drizzle ORM",
  "styling": "Tailwind CSS + Shadcn/UI",
  "mobile": "React Native + Expo"
}
```

### Key Integrations
- **Google Gemini API**: Voice processing and natural language understanding
- **SMS Services**: OTP delivery and notifications
- **Payment Gateways**: Stripe integration ready
- **Location Services**: GPS tracking and geocoding
- **File Storage**: Base64 encoding for images and documents

## 🌍 Indian Market Focus

### Geographic Coverage
- **All States**: Comprehensive coverage across India
- **District-Level**: Precise service area mapping
- **Local Areas**: Neighborhood-specific service delivery
- **Pincode Integration**: Accurate location identification

### Language Support
- **Voice Recognition**: 10+ Indian languages for job posting
- **UI Language**: English with Indian context
- **Local Currency**: INR with proper GST calculations
- **Cultural Adaptation**: India-specific business workflows

## 💼 Business Model

### Revenue Streams
- **Commission Structure**: 5-tier percentage-based commission on completed jobs
- **Advertisement Revenue**: Targeted ads for clients and workers
- **Premium Features**: Enhanced visibility and priority booking
- **Subscription Plans**: Premium worker and client memberships

### Financial Features
- **Real-Time Wallets**: Instant balance updates for all users
- **GST Compliance**: Automated tax calculations
- **Referral System**: Reward program for user acquisition
- **Payment Integration**: Multiple payment methods support

## 🔐 Security & Privacy

### Data Protection
- **Mobile Verification**: OTP-based account security
- **Address Privacy**: Controlled information sharing
- **Secure Payments**: Encrypted transaction processing
- **User Verification**: Multi-step worker approval process

### Admin Controls
- **User Management**: Comprehensive admin dashboard
- **Content Moderation**: Review and approval workflows
- **Financial Oversight**: Complete transaction monitoring
- **System Analytics**: Detailed performance metrics

## 📊 Sample Data Included

The auto-setup creates:
- **6 Service Categories**: Plumbing, Electrical, Painting, Carpentry, Mechanics
- **3 Sample Users**: Admin, Client, and Worker with complete profiles
- **1 Worker Profile**: Full skills and service area configuration
- **1 Completed Booking**: Demonstrates the complete workflow
- **2 Advertisements**: Sample promotional content
- **API Key Storage**: Placeholder for external service integration

## 🚀 Deployment

### Replit (Recommended)
1. Import repository to Replit
2. Set `DATABASE_URL` environment variable
3. Click "Run" - automatic setup handles everything
4. Access via generated Replit URL

### Manual Deployment
```bash
# Clone repository
git clone [your-repo-url]

# Install dependencies
npm install

# Set environment variables
export DATABASE_URL="your_postgresql_connection_string"

# Run database setup (automatic on first start)
npm run dev

# Access at http://localhost:5000
```

## 📚 Documentation

### API Endpoints
- **Authentication**: `/api/auth/*` - Login, signup, OTP verification
- **Users**: `/api/users/*` - User management and profiles
- **Services**: `/api/services/*` - Service categories and areas
- **Bookings**: `/api/bookings/*` - Job posting and management
- **Chat**: `/api/chat/*` - Real-time messaging
- **Admin**: `/api/admin/*` - Administrative functions

### Database Schema
- **Users**: Complete user profiles with role-based access
- **Worker Profiles**: Extended information for service providers
- **Service Categories**: Organized service offerings
- **Bookings**: Job lifecycle management
- **Location Tracking**: GPS-based service delivery
- **Financial Records**: Comprehensive transaction history

## 🔮 Future Roadmap

### Short Term
- [ ] Advanced search and filtering
- [ ] Enhanced mobile app features
- [ ] Payment gateway integration
- [ ] SMS and email notifications

### Long Term  
- [ ] AI-powered worker matching
- [ ] Video calling integration
- [ ] Multi-language UI support
- [ ] Advanced analytics dashboard

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

For support and questions:
- **GitHub Issues**: [Create an issue](../../issues)
- **Documentation**: Check the `/docs` folder for detailed guides
- **Community**: Join our Discord server for discussions

---

**Built with ❤️ for the Indian blue-collar workforce**

*Empowering service providers and clients across India with modern technology*