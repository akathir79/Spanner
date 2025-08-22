# SPANNER - India Blue-Collar Service Marketplace

## Overview
SPANNER is a comprehensive web application designed to connect blue-collar service workers with clients across all states and districts of India. The platform provides a marketplace for various services including plumbing, electrical work, painting, mechanics, and other skilled trades. It supports multiple user types (clients, workers, admins, and super admins) with role-based dashboards and functionality. A key feature is the voice-powered job posting system, allowing clients to easily post service requests in multiple Indian languages. The platform also includes a robust financial model, secure authentication, and detailed tracking for bookings and user activity, aiming to streamline service provision and enhance user experience in the Indian blue-collar sector.

## User Preferences
Preferred communication style: Simple, everyday language.
Development approach: All changes must be applied to both web app and mobile app simultaneously.

## Recent Changes (August 22, 2025)
- **Real-Time Wallet System**: Implemented authentic zero-balance system for new workers, replacing hardcoded ₹1000 test values with real-time calculations from actual job completions and transactions
- **Razorpay Integration**: Added professional payment gateway integration with proper order creation, payment verification, and wallet crediting flow (Note: Currently using live keys - needs test keys for development)
- **Professional Modal System**: Enhanced wallet topup/withdraw modals with real-time balance display, payment method information, and proper error handling
- **Transaction-Based Earnings**: Wallet balance now calculated from actual completed bookings, topups, and withdrawals - no more fake data
- **Enhanced Security**: Implemented Razorpay signature verification and proper payment flow before wallet updates
- **TypeScript Declarations**: Added Razorpay TypeScript support and proper error handling for payment gateway

## System Architecture

### Frontend
- **Framework**: React with TypeScript (Vite build tool)
- **UI Components**: Shadcn/ui (built on Radix UI primitives)
- **Styling**: Tailwind CSS with CSS variables
- **State Management**: React Query for server state
- **Routing**: Wouter
- **Forms**: React Hook Form with Zod validation
- **Authentication**: Context-based provider with JWT-like session management

### Backend
- **Runtime**: Node.js with Express.js
- **Database**: PostgreSQL (Neon serverless)
- **ORM**: Drizzle ORM
- **API Design**: RESTful endpoints
- **Development**: ESM modules with `tsx` for TypeScript execution
- **Location Data**: Local JSON for Indian states/districts, accessible via API.

### Key Design Decisions
- **Monorepo Structure**: Shared schema and types between client and server for type safety and reduced duplication.
- **Component-First UI**: Leverages Radix UI primitives and Shadcn/ui for accessibility and consistency.
- **Type-Safe Database**: Drizzle ORM provides full TypeScript integration for compile-time safety.
- **Custom User ID System**: Automatic generation of unique IDs in `STATE-DISTRICT-XXXX-ROLE` format.

### Core Features
- **Voice-Powered Quick Post System**: Multilingual (10+ Indian languages) voice job posting for clients using Google Gemini-powered speech-to-text. Extracts service details, location, and budget, with automatic account creation for new users.
- **Comprehensive SEO Implementation**: Enterprise-level SEO with Schema.org structured data, dynamic sitemaps, robots.txt, Open Graph tags, and client-focused landing pages for maximum Google search visibility.
- **Database Backup & Restore**: Utilities for exporting/importing complete database to/from JSON.
- **Comprehensive Database Schema**: Includes users, worker profiles, districts, areas, service categories, bookings (with OTP verification), worker reviews, location tracking, and payments.
- **Authentication System**: Mobile-based OTP verification (development mock "123456"), role-based access control, multi-step worker registration (including mandatory bank details integration with Razorpay IFSC API), and GPS-based district detection.
- **User Interfaces**: Dedicated dashboards for Clients (booking management, job completion), Workers (job management, earnings), and Admins (platform oversight, user management, analytics, advertisement management).
- **Job Completion System**: OTP-verified job completion workflow with detailed review and rating system.
- **Advertisement System**: Admin-managed sliding carousel ads with targeted display.
- **Financial Model**: 5-tier system with real-time wallets, GST calculations, admin commission, referral rewards, and mock payment processing, ready for Stripe integration.
- **Centralized Key Management**: Secure API key storage system for managing all platform integrations (SMS, WhatsApp, Stripe, GPay, PhonePe, email services) with super admin access control, database persistence, and backup/restore integration.

## External Dependencies

### UI and Styling
- `@radix-ui/*`: Accessible component primitives
- `class-variance-authority`: Type-safe variant styling
- `tailwindcss`: Utility-first CSS framework
- `lucide-react`: Icon library

### Backend Services
- `@neondatabase/serverless`: Serverless PostgreSQL connection
- `drizzle-orm`: TypeScript ORM
- `express`: Web application framework

### Development Tools
- `vite`: Frontend build tool and development server
- `tsx`: TypeScript execution for Node.js
- `@replit/vite-plugin-runtime-error-modal`: Development error handling

## Mobile Application

### SPANNER Mobile App (React Native)
- **Location**: `spanner-mobile/` directory (separate project)
- **Framework**: React Native with Expo
- **Architecture**: Connects to existing SPANNER backend via REST API
- **Authentication**: Shares same OTP-based mobile verification system
- **Data Sync**: Real-time synchronization with web app via shared database
- **Key Features**: 
  - Native mobile UI for clients and workers
  - Voice-enabled job posting integration
  - Real-time booking management
  - GPS location services
  - Push notifications (planned)
  - Offline capability (planned)
- **Deployment**: Google Play Store and Apple App Store ready
- **API Integration**: Uses existing Express.js endpoints for seamless data sharing