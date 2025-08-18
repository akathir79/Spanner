# How to Run SPANNER Mobile App Separately

## Prerequisites

1. **Install Expo CLI globally:**
   ```bash
   npm install -g expo-cli
   ```

2. **Navigate to mobile app directory:**
   ```bash
   cd spanner-mobile
   ```

3. **Install dependencies:**
   ```bash
   npm install
   ```

## Running the Mobile App

### Option 1: Start Development Server
```bash
# In spanner-mobile directory
npm start
# or
expo start
```

This opens Expo Dev Tools in your browser with QR code to scan.

### Option 2: Run on Specific Platforms
```bash
# For Android (requires Android Studio/emulator)
npm run android
# or
expo start --android

# For iOS (requires Xcode on macOS)
npm run ios
# or
expo start --ios

# For web browser (for testing)
npm run web
# or
expo start --web
```

## Testing on Real Devices

### Android Device
1. Install "Expo Go" app from Google Play Store
2. Run `npm start` in spanner-mobile directory
3. Scan QR code with Expo Go app

### iOS Device
1. Install "Expo Go" app from App Store
2. Run `npm start` in spanner-mobile directory
3. Scan QR code with Camera app or Expo Go

## Both Apps Running Simultaneously

```
Terminal 1 (Web App):
┌─────────────────────────┐
│ Main SPANNER Project    │
│ npm run dev             │
│ Port: 5000              │
│ Backend + Frontend      │
└─────────────────────────┘

Terminal 2 (Mobile App):
┌─────────────────────────┐
│ spanner-mobile/         │
│ npm start               │
│ Port: 19000 (Expo)      │
│ React Native App        │
└─────────────────────────┘
```

## Configuration for Local Testing

Update `spanner-mobile/src/config/api.ts` for local development:

```typescript
export const API_CONFIG = {
  BASE_URL: __DEV__ 
    ? 'http://localhost:5000'  // Connects to your web app backend
    : 'https://your-production-url.com',
  // ... rest of config
};
```

## Important Notes

- **Different Ports**: Web app runs on port 5000, mobile app on port 19000
- **Same Backend**: Mobile app calls your existing Express.js APIs
- **Real-time Sync**: Both apps share the same PostgreSQL database
- **Independent**: Each app can run without affecting the other

## Troubleshooting

1. **Port conflicts**: Make sure ports 5000 and 19000 are available
2. **Network access**: Mobile device needs to access localhost:5000
3. **Firewall**: Allow connections on both ports
4. **API calls**: Check network logs in Expo Dev Tools