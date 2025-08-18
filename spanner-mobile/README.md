# SPANNER Mobile App

A React Native mobile application for the SPANNER India Blue-Collar Service Marketplace.

## Overview

This mobile app connects to the existing SPANNER backend and provides a native mobile experience for:
- **Clients**: Book services, manage bookings, post jobs
- **Workers**: Find jobs, manage bookings, handle bids
- **Admins**: Platform management and oversight

## Architecture

```
┌─────────────────────────────────┐
│      SPANNER Backend            │
│   (Existing Web Project)        │
│                                 │
│  ┌─────────────────────────┐   │
│  │   PostgreSQL Database   │   │
│  │  (Single Source of Truth) │   │
│  └─────────────────────────┘   │
│                                 │
│  ┌─────────────────────────┐   │
│  │    Express.js API       │   │
│  │   (REST Endpoints)      │   │
│  └─────────────────────────┘   │
└─────────────────────────────────┘
               │
               │ HTTP/REST API
               │
┌──────────────▼──────────────────┐
│      SPANNER Mobile App         │
│     (React Native/Expo)         │
│                                 │
│  • Native iOS/Android UI       │
│  • Real-time data sync         │
│  • Push notifications          │
│  • Camera integration          │
│  • GPS location services       │
└─────────────────────────────────┘
```

## Key Features

### For Clients
- **Quick Job Posting**: Voice-enabled job posting with automatic location detection
- **Service Booking**: Browse and book services from verified workers
- **Booking Management**: Track booking status and communicate with workers
- **Rating & Reviews**: Rate workers after job completion

### For Workers
- **Job Discovery**: Find jobs based on location and skills
- **Bid Management**: Submit bids and manage proposals
- **Earnings Tracking**: View earnings and payment history
- **Profile Management**: Update skills, rates, and availability

### For All Users
- **Real-time Updates**: Instant sync with web users
- **Secure Authentication**: OTP-based mobile verification
- **Multi-language Support**: Support for Indian regional languages
- **Offline Capability**: Basic functionality without internet

## Tech Stack

- **Frontend**: React Native with Expo
- **Navigation**: React Navigation
- **State Management**: React Query for server state
- **HTTP Client**: Axios
- **Authentication**: AsyncStorage for token persistence
- **Backend**: Existing SPANNER Express.js API

## API Integration

The mobile app connects to the same API endpoints as the web application:

```typescript
// Authentication
POST /api/auth/login
POST /api/auth/verify-otp

// Bookings
GET /api/client/bookings
POST /api/bookings

// Jobs
GET /api/job-postings
POST /api/job-postings

// Services
GET /api/services
GET /api/areas
GET /api/districts
```

## Getting Started

### Prerequisites
- Node.js 18+
- Expo CLI
- iOS Simulator (for iOS development)
- Android Studio (for Android development)

### Installation

1. **Clone and setup:**
   ```bash
   cd spanner-mobile
   npm install
   ```

2. **Configure API endpoint:**
   Update `src/config/api.ts` with your backend URL:
   ```typescript
   export const API_CONFIG = {
     BASE_URL: 'https://your-spanner-backend.com',
     // or 'http://localhost:5000' for development
   };
   ```

3. **Start development:**
   ```bash
   # For iOS
   npm run ios
   
   # For Android
   npm run android
   
   # For web preview
   npm run web
   ```

## Deployment

### iOS App Store
1. Build with Expo EAS Build
2. Submit to App Store Connect
3. Follow Apple's review guidelines

### Google Play Store
1. Build APK/AAB with Expo
2. Upload to Google Play Console
3. Follow Google's review guidelines

## Data Synchronization

The mobile app maintains real-time sync with the web application:
- **Shared Database**: Both apps use the same PostgreSQL database
- **Real-time Updates**: Changes made on web are instantly visible on mobile
- **Consistent State**: No data conflicts between platforms
- **Offline Support**: Cached data for basic functionality

## Development Guidelines

1. **API First**: Always use existing backend endpoints
2. **Consistent UX**: Match core workflows with web app
3. **Mobile Optimized**: Design for touch and mobile usage patterns
4. **Performance**: Optimize for mobile networks and devices
5. **Platform Guidelines**: Follow iOS and Android design standards

## Project Structure

```
src/
├── components/         # Reusable UI components
├── screens/           # Screen components
├── navigation/        # Navigation setup
├── services/          # API client and services
├── contexts/          # React contexts (Auth, etc.)
├── hooks/            # Custom React hooks
├── types/            # TypeScript type definitions
├── utils/            # Utility functions
└── config/           # App configuration
```

## Contributing

1. Follow existing code patterns
2. Maintain API compatibility with web app
3. Test on both iOS and Android
4. Update documentation for new features

## Support

For technical support or questions about the mobile app development, refer to the main SPANNER project documentation or contact the development team.