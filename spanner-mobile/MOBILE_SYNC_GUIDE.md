# SPANNER Mobile App - Web Synchronization Guide

## Overview
This guide documents how the SPANNER mobile app maintains complete feature parity and data synchronization with the web application.

## Synchronized Features

### 1. Notification System
**Web Components**: `NotificationBell.tsx` (client/src/components/)
**Mobile Components**: `NotificationBell.tsx` (spanner-mobile/components/)

- ✅ **Role-specific field requirements**: Worker, Client, Admin, Super Admin
- ✅ **Real-time notification counts**: Identical logic between platforms
- ✅ **Field validation**: Same required fields checking
- ✅ **Visual indicators**: Red badge with count display

### 2. Dashboard Management
**Web Components**: 
- `Dashboard.tsx` (Client Dashboard)
- `AdminDashboard.tsx` (Admin Dashboard) 
- `WorkerDashboard.tsx` (Worker Dashboard)

**Mobile Components**:
- `DashboardScreen.tsx` (Unified role-based dashboard)
- `HomeScreen.tsx` (Enhanced with notification bell)

- ✅ **Role-based content**: Different dashboard views per user role
- ✅ **Profile tabs**: Consistent tab structure with notification counts
- ✅ **Quick actions**: Role-appropriate action buttons and navigation

### 3. Profile Management
**Web Components**: Profile tabs within each dashboard
**Mobile Components**: `ProfileScreen.tsx`

- ✅ **Field validation**: Identical required field checking
- ✅ **Visual indicators**: Red highlighting for missing fields
- ✅ **Role-specific sections**: Different profile sections per user type
- ✅ **Update tracking**: Real-time count of incomplete fields

### 4. Wallet Integration
**Web Components**: Wallet modals and components
**Mobile Components**: `Wallet.tsx`

- ✅ **Payment gateway**: Razorpay integration
- ✅ **Transaction history**: Real-time wallet data
- ✅ **Balance display**: Authentic wallet calculations
- ✅ **Top-up functionality**: Mobile-optimized payment flow

## Data Synchronization

### Backend API Integration
Both platforms use the same REST API endpoints:
- Authentication: `/api/auth/*`
- User data: `/api/user/*`
- Wallet: `/api/wallet/*`
- Bookings: `/api/bookings/*`
- Profile updates: `/api/profile/*`

### Real-time Updates
- User profile changes reflect instantly across platforms
- Notification counts update in real-time
- Wallet balance synchronization
- Booking status updates

## Code Logic Consistency

### Notification Count Calculation
Both platforms use identical logic for calculating notification counts:

```typescript
// Worker role requirements
const fieldsToCheck = [
  user.lastName, user.email, user.houseNumber, user.streetName,
  user.areaName, user.district, user.state, user.pincode, 
  user.fullAddress, user.experience, user.skills, user.serviceAreas,
  user.bankAccountNumber, user.bankIFSC, user.bankAccountHolderName
];

// Client role requirements  
const fieldsToCheck = [
  user.lastName, user.email, user.houseNumber, user.streetName,
  user.areaName, user.district, user.state, user.pincode, user.fullAddress
];

// Admin role requirements
const fieldsToCheck = [
  user.lastName, user.email, user.district, user.state
];
```

### Field Validation
Both platforms use the same validation logic:
```typescript
const isFieldRequired = (fieldValue: any): boolean => {
  return fieldValue === "UPDATE_REQUIRED" || 
         fieldValue === "" || 
         fieldValue === null || 
         fieldValue === undefined;
};
```

## Layout Consistency

### Notification Bell Placement
- **Web**: Top-right header in all dashboards
- **Mobile**: Header actions in HomeScreen and DashboardScreen

### Profile Tabs
- **Web**: Horizontal tabs with notification badges
- **Mobile**: Bottom tab navigation with notification badges

### Color Scheme
Both platforms use identical color schemes:
- Primary: `#3b82f6` (Blue)
- Success: `#10b981` (Green) 
- Warning: `#f59e0b` (Yellow)
- Error: `#ef4444` (Red)
- Background: `#f8fafc` (Light Gray)

## Development Guidelines

### Maintaining Synchronization
1. **API Changes**: Update both platforms simultaneously
2. **UI Components**: Maintain visual consistency between React and React Native
3. **Business Logic**: Keep calculation logic identical
4. **Testing**: Verify features work identically on both platforms

### Code Structure
```
Web App Structure:
client/src/components/NotificationBell.tsx
client/src/pages/Dashboard.tsx
client/src/pages/AdminDashboard.tsx
client/src/pages/WorkerDashboard.tsx

Mobile App Structure:
spanner-mobile/components/NotificationBell.tsx
spanner-mobile/src/screens/HomeScreen.tsx
spanner-mobile/src/screens/DashboardScreen.tsx
spanner-mobile/src/screens/ProfileScreen.tsx
```

### Type Definitions
Mobile app types are synchronized with web app user interface:
```typescript
interface User {
  // Basic fields
  id: string;
  email: string | null;
  firstName: string;
  lastName: string;
  role: 'client' | 'worker' | 'admin' | 'super_admin';
  
  // Address fields
  houseNumber: string | null;
  streetName: string | null;
  areaName: string | null;
  district: string | null;
  state: string | null;
  pincode: string | null;
  
  // Worker-specific fields
  experience: string | null;
  skills: string | null;
  serviceAreas: string | null;
  bankAccountNumber: string | null;
  bankIFSC: string | null;
  bankAccountHolderName: string | null;
}
```

## Deployment Checklist

### Before Release
- [ ] Notification counts match between platforms
- [ ] Profile validation works identically
- [ ] Dashboard content is role-appropriate
- [ ] Wallet functionality synchronized
- [ ] API endpoints tested on both platforms
- [ ] UI/UX consistency verified
- [ ] Real-time updates working

### Testing Scenarios
1. **Profile Updates**: Change profile data and verify both platforms update
2. **Role Changes**: Switch user roles and verify different dashboard content
3. **Notification Sync**: Update profile fields and verify count changes
4. **Wallet Sync**: Make payments and verify balance updates
5. **Cross-Platform**: Use web and mobile simultaneously to verify sync

## Maintenance Notes

### Adding New Features
When adding features to the web app:
1. Implement identical functionality in mobile app
2. Use same API endpoints and data structures
3. Maintain visual consistency with mobile design patterns
4. Update this synchronization guide

### Bug Fixes
When fixing bugs:
1. Check if same issue exists on both platforms
2. Apply identical logic fixes
3. Test on both platforms
4. Document any platform-specific considerations

This ensures SPANNER maintains complete feature parity and seamless user experience across web and mobile platforms.