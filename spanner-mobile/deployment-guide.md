# SPANNER Mobile App - Deployment Guide

## Overview
This guide covers deploying the SPANNER mobile app to both Google Play Store and Apple App Store.

## Prerequisites

### Development Environment
- Node.js 18+ installed
- Expo CLI installed: `npm install -g expo-cli`
- EAS CLI installed: `npm install -g @expo/eas-cli`

### Store Accounts
- **Google Play Console**: Developer account ($25 one-time fee)
- **Apple Developer Program**: Developer account ($99/year)

### Backend Configuration
- SPANNER backend deployed and accessible via HTTPS
- API endpoints properly configured for production

## Step 1: Configure Production API

Update `src/config/api.ts` with your production backend URL:

```typescript
export const API_CONFIG = {
  BASE_URL: 'https://your-spanner-backend.com', // Your production URL
  // ... rest of config
};
```

## Step 2: EAS Build Setup

1. **Initialize EAS configuration:**
   ```bash
   cd spanner-mobile
   eas build:configure
   ```

2. **Configure app.json:**
   ```json
   {
     "expo": {
       "name": "SPANNER",
       "slug": "spanner-mobile",
       "version": "1.0.0",
       "orientation": "portrait",
       "icon": "./assets/icon.png",
       "userInterfaceStyle": "light",
       "splash": {
         "image": "./assets/splash-icon.png",
         "resizeMode": "contain",
         "backgroundColor": "#ffffff"
       },
       "assetBundlePatterns": [
         "**/*"
       ],
       "ios": {
         "supportsTablet": true,
         "bundleIdentifier": "com.spanner.mobile"
       },
       "android": {
         "adaptiveIcon": {
           "foregroundImage": "./assets/adaptive-icon.png",
           "backgroundColor": "#ffffff"
         },
         "package": "com.spanner.mobile"
       },
       "web": {
         "favicon": "./assets/favicon.png"
       }
     }
   }
   ```

## Step 3: Android Deployment

### Build for Android
```bash
# Development build
eas build --platform android --profile development

# Production build
eas build --platform android --profile production
```

### Upload to Google Play Console

1. **Create App Listing:**
   - Go to Google Play Console
   - Create new app
   - Fill in app details:
     - **App name**: SPANNER
     - **Description**: India's premier blue-collar service marketplace
     - **Category**: Business
     - **Screenshots**: Capture from various screen sizes

2. **Upload APK/AAB:**
   - Download the built APK/AAB from EAS
   - Upload to Google Play Console
   - Complete store listing requirements

3. **Required Store Assets:**
   - App icon (512x512 PNG)
   - Feature graphic (1024x500 PNG)
   - Screenshots (minimum 2, maximum 8)
   - Privacy policy URL
   - Contact information

### Google Play Review Process
- **Timeline**: 1-3 days typically
- **Requirements**: Follow Google Play policies
- **Testing**: Use internal testing track first

## Step 4: iOS Deployment

### Prerequisites
- Apple Developer Account
- iOS certificate and provisioning profile

### Build for iOS
```bash
# Development build
eas build --platform ios --profile development

# Production build  
eas build --platform ios --profile production
```

### Upload to App Store Connect

1. **Create App Record:**
   - Go to App Store Connect
   - Create new app
   - Fill in app information:
     - **Name**: SPANNER
     - **Bundle ID**: com.spanner.mobile
     - **SKU**: SPANNER_MOBILE_001

2. **App Store Assets:**
   - App icon (1024x1024 PNG)
   - Screenshots for all device sizes
   - App preview videos (optional but recommended)

3. **Submit for Review:**
   - Complete all required metadata
   - Submit for App Store review
   - Respond to any reviewer feedback

### App Store Review Process
- **Timeline**: 1-7 days typically
- **Requirements**: Follow App Store Review Guidelines
- **Testing**: Use TestFlight for beta testing

## Step 5: Update and Maintenance

### Over-the-Air Updates (OTA)
For JavaScript changes (no native code changes):
```bash
eas update --branch production --message "Fix: Updated booking flow"
```

### Native Updates
For changes requiring native code updates:
```bash
# Build new version
eas build --platform all --profile production

# Submit to stores
eas submit --platform android
eas submit --platform ios
```

## Store Optimization

### App Store Optimization (ASO)
- **Keywords**: blue-collar, services, workers, jobs, India
- **Description**: Highlight key features and benefits
- **Screenshots**: Show actual app functionality
- **Reviews**: Encourage positive user reviews

### Analytics and Monitoring
- Implement analytics (Firebase, Amplitude)
- Monitor crash reports
- Track user engagement metrics
- Monitor app store reviews

## Security Considerations

### API Security
- Use HTTPS for all API calls
- Implement proper authentication tokens
- Validate all user inputs
- Secure sensitive data storage

### App Security
- Obfuscate code for production builds
- Implement certificate pinning
- Use secure storage for sensitive data
- Regular security audits

## Troubleshooting

### Common Build Issues
1. **Metro bundler errors**: Clear cache with `expo start -c`
2. **Native dependency issues**: Ensure proper linking
3. **Certificate errors**: Check Apple Developer account status

### Store Rejection Issues
1. **Privacy policy**: Ensure comprehensive privacy policy
2. **App crashes**: Test thoroughly before submission
3. **Metadata violations**: Follow store guidelines strictly

## Rollback Strategy

### Emergency Rollback
```bash
# Rollback OTA update
eas update --branch production --message "Rollback to stable version"

# For native updates, submit previous version
```

## Contact Information

For deployment support or issues:
- Technical: dev-team@spanner.com
- Store relations: store-team@spanner.com
- Emergency: emergency@spanner.com

---

## Quick Deployment Checklist

- [ ] Production API configured
- [ ] EAS build configured
- [ ] App assets created (icons, screenshots)
- [ ] Store listings completed
- [ ] Privacy policy published
- [ ] Apps built and tested
- [ ] Store submissions completed
- [ ] Analytics implemented
- [ ] Monitoring setup
- [ ] Launch plan executed