# SPANNER - India Blue-Collar Service Marketplace

## Overview

SPANNER is a comprehensive web application designed to connect blue-collar service workers with clients across all states and districts of India. The platform provides a marketplace for various services including plumbing, electrical work, painting, mechanics, and other skilled trades. The application supports multiple user types (clients, workers, admins, and super admins) with role-based dashboards and functionality.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **UI Components**: Shadcn/ui component library with Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming
- **State Management**: React Query (@tanstack/react-query) for server state
- **Routing**: Wouter for client-side routing
- **Forms**: React Hook Form with Zod validation
- **Authentication**: Context-based auth provider with JWT-like session management

### Backend Architecture
- **Runtime**: Node.js with Express.js server
- **Database**: PostgreSQL with Drizzle ORM
- **Database Provider**: Neon (serverless PostgreSQL)
- **API Design**: RESTful endpoints with JSON responses
- **Development**: ESM modules with tsx for TypeScript execution
- **Location Data**: Local JSON file (`shared/states-districts.json`) containing authentic Indian government district data for all states, with API endpoint `/api/districts/:stateName` for real-time access

### Key Design Decisions

**Monorepo Structure**: The application uses a monorepo approach with shared schema and types between client and server, reducing code duplication and ensuring type safety across the full stack.

**Component-First UI**: Leverages Radix UI primitives wrapped in Shadcn/ui components for accessibility and consistency while maintaining customization flexibility.

**Type-Safe Database**: Drizzle ORM provides full TypeScript integration with the database schema, ensuring compile-time safety for database operations.

## Key Components

### Voice-Powered Quick Post System
Complete multilingual voice job posting feature for **CLIENTS to post jobs and hire workers** via green 🎤 button in navbar:
- **Client-Focused Design**: Specifically designed for clients posting jobs to find and hire skilled workers for services they need
- **Real-time Voice Recognition**: Google Gemini-powered speech-to-text with automatic language detection
- **Multilingual Support**: Supports 10+ Indian languages (Hindi, Tamil, Telugu, Bengali, Malayalam, Kannada, Gujarati, Marathi, Punjabi, English)
- **Smart Information Extraction**: AI automatically extracts service needed, work description, service category, urgency, client budget, work location, worker requirements, and completion timeframe from voice
- **Intelligent Location Resolution**: Clients can mention just area name - system intelligently resolves full district and state information for work location
- **Automatic Account Creation**: For new clients, extracts personal information from voice and creates account automatically
- **Seamless Integration**: Posts directly to existing job system with all extracted information for workers to bid on
- **User Flow**: Welcome → Voice Recording → Processing → Review → Job Posted for Worker Bidding
- **Real-time Processing**: Live transcription display with detected language indicator
- **Fallback Support**: Graceful fallback to manual job posting form if AI services are unavailable

### Database Backup & Restore System
Complete database backup and restore utilities in `database/` folder:
- **backup-export.ts**: Export complete database to JSON backup files
- **backup-restore.ts**: Restore database from JSON backup files  
- **auto-setup.ts**: Automatically setup database on fresh deployments (now integrated into server startup)
- **backups/**: Directory containing backup JSON files with current India-wide platform data
- **Fresh Backup Created**: Latest backup contains clean database without Tamil references (August 4, 2025)
- **OTP Records Excluded**: OTP verifications are not stored in backups for security (real-time generation only)
- **Schema Auto-Updates**: Auto setup now includes complete financial model schema with workerCommissionPercentage field (August 16, 2025)

### Database Schema
Located in `shared/schema.ts`, the database includes:
- **Users**: Core user information with role-based access (client, worker, admin, super_admin)
- **Worker Profiles**: Extended information for service providers including skills, rates, and verification status
- **Districts**: Complete coverage of India's states and districts with authentic government data
- **Areas**: Comprehensive village and town coverage across all Indian states
- **Service Categories**: Dynamic service types that workers can offer
- **Bookings**: Complete booking workflow from request to completion with OTP verification system (completionOTP, otpGeneratedAt, otpVerifiedAt, workerCompletedAt, clientConfirmedAt)
- **Worker Reviews**: Detailed rating system with multiple criteria (work quality, timeliness, communication, professionalism)
- **OTP Verifications**: Secure authentication via mobile OTP
- **Location Tracking**: GPS tracking for service delivery with geofencing
- **Payments**: Complete payment processing with Stripe integration
- **Job Postings & Bids**: Bidding system for service requests

### Authentication System
- Mobile-based authentication with OTP verification (currently mock OTP "123456" for development)
- Development OTP paste buttons for easy testing in login and worker registration forms
- Role-based routing and access control with automatic dashboard redirection
- Super admin capabilities for creating admin accounts
- Support for both email and mobile login options
- Profile picture upload functionality (optional for clients, mandatory for workers)
- Multi-step worker registration: personal details → mandatory bank details → completion
- Bank details required and integrated directly into registration flow with real Razorpay IFSC API
- Workers cannot skip bank details during registration - must complete to proceed
- Real SMS OTP integration ready for Twilio implementation when needed
- **Location Detection System**: Automatic GPS-based district detection working perfectly on first click for both client and worker registration forms
- **UI Improvements**: All dropdowns have consistent scrollbar functionality with enhanced visibility (August 4, 2025)
- **Custom User ID System**: Automatic generation of unique IDs in format STATE-DISTRICT-XXXX-ROLE (e.g., "TAM-CHE-0001-C" for client, "TAM-SAL-0001-W" for worker, "TAM-COI-0001-A" for admin) with sequential numbering per state-district-role combination (August 6, 2025)
- **User Activity Tracking**: Complete user activity monitoring with registration date/time, last login tracking, and "Member since" display on client dashboard (August 6, 2025)

### User Interfaces
- **Home Page**: Service discovery with search and filters
- **Client Dashboard**: Booking management and service requests with complete job completion workflow (OTP verification and review system)
- **Worker Dashboard**: Job management, earnings tracking, and availability control with job completion workflow
- **Admin Dashboard**: Platform oversight, user management, analytics, and advertisement management
- **UPDATE_REQUIRED Styling**: Text displayed in red color (text-red-500) with reduced font size (text-xs) across all dashboards for better visual clarity (August 13, 2025)
- **Advertisement System**: Sliding carousel advertisements with admin management, image upload, targeted audience display for clients and workers, and global toggle to enable/disable all ads (August 13, 2025)
- **Job Completion System**: Complete OTP verification workflow where workers mark jobs complete, clients receive OTP for verification, and detailed review/rating system with worker performance tracking - FULLY OPERATIONAL (August 16, 2025)
- **Recent Testing**: Successfully tested complete workflow with booking BKG-TEST-COMPLETION-001: worker completion → OTP generation (348185) → client verification → review submission → all data persisted correctly
- **Booking Tabs System**: Service bookings now organized with "Current Jobs" and "Completed Jobs" tabs with delete functionality for completed jobs and 30-day auto-cleanup warnings (August 16, 2025)
- **Client Deletion Fixed**: Resolved foreign key constraint issues in user deletion - both individual and bulk client deletion now working properly with proper cascade deletion of reviews, bookings, and related data (August 16, 2025)
- **Budget Display Fixed**: Resolved job posting budget update and display issues - budget increases now properly save to database and display correctly in job posting badges instead of showing "Negotiable" (August 16, 2025)
- **Bids Overview Dashboard**: Added comprehensive bids overview tab with statistics dashboard, job activity tracking, quick access buttons, and enhanced bid management functionality (August 16, 2025)
- **One-Click Job Duplication**: Implemented job posting duplication feature with copy button on all job cards - creates duplicate job with "(Copy)" suffix, preserving all original details and posting immediately (August 16, 2025)
- **Interactive Budget Slider**: Added real-time budget slider with live preview, quick presets (Basic, Standard, Premium, Luxury), dual-range controls, and manual input fallback for both job creation and editing (August 16, 2025)
- **Budget Badge Instant Updates**: Fixed budget badge display issues with immediate cache invalidation, server response integration, and consistent Indian number formatting across all job displays (August 16, 2025)
- **Comprehensive Financial Model System**: Fully implemented 5-tier financial system with real-time wallets, GST calculations, admin commission handling, referral rewards, mock payment processing, and complete admin control dashboard - ready for Stripe integration (August 16, 2025)
- **Voice-Powered Quick Post System**: Complete multilingual voice job posting system with Google Gemini integration for 10+ Indian languages, real-time speech recognition, intelligent location extraction from partial addresses, automatic account creation flow, and seamless job posting workflow (August 16, 2025)
- **Quick Post Modal Implementation**: Modal-based voice recording interface with language selection, real-time timer, MediaRecorder integration, comprehensive error handling, and Firefox compatibility improvements with debug fallback options (August 16, 2025)
- **Quick Post Authentication Flow**: Smart authentication check on voice modal opening - logged-in users proceed directly to voice recording, non-authenticated users see quick login/registration options with OTP verification, development OTP paste buttons, and seamless transition to voice posting after authentication (August 16, 2025)

### Language Support
- English-only interface for India-wide coverage
- Simplified language provider for consistent English experience
- Updated content for all Indian states and districts

## Data Flow

### Authentication Flow
1. User initiates login with mobile number and user type
2. System generates and stores OTP (development returns fixed "123456")
3. OTP verification creates/updates user session
4. Automatic redirection to role-specific dashboard (admin/worker/client)
5. Home page redirects logged-in users to their dashboards

### Service Discovery Flow
1. Client searches for services by category, location, or keywords
2. System filters available workers based on location and service type
3. Client can view worker profiles, ratings, and availability
4. Booking requests are created and managed through the platform

### Booking Management Flow
1. Client selects worker and creates booking request
2. Worker receives notification and can accept/decline
3. Service completion and payment processing
4. Review and rating system for quality assurance

## External Dependencies

### UI and Styling
- **@radix-ui/***: Accessible component primitives
- **class-variance-authority**: Type-safe variant styling
- **tailwindcss**: Utility-first CSS framework
- **lucide-react**: Icon library

### Backend Services
- **@neondatabase/serverless**: Serverless PostgreSQL connection
- **drizzle-orm**: TypeScript ORM for database operations
- **express**: Web application framework

### Development Tools
- **vite**: Fast build tool and development server
- **tsx**: TypeScript execution for Node.js
- **@replit/vite-plugin-runtime-error-modal**: Development error handling

## Deployment Strategy

### Development Environment
- Vite development server with HMR for frontend
- Express server with TypeScript compilation via tsx
- Database migrations managed through Drizzle Kit
- Environment variables for database configuration

### Production Build
- Frontend built with Vite to static assets
- Backend bundled with esbuild for Node.js execution
- Single deployment artifact with both client and server code
- PostgreSQL database connection via environment variables

### Key Environment Requirements
- `DATABASE_URL`: PostgreSQL connection string (required)
- Node.js environment with ESM support
- Static file serving for frontend assets

The architecture prioritizes developer experience with TypeScript throughout, component reusability, and scalable database design while maintaining simplicity in deployment and development workflows.