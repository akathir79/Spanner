# SPANNER Mobile App - Installation Fix

## The Error You Encountered

You got an error: `CommandError: It looks like you're trying to use web support but don't have the required dependencies installed.`

## Solution

**Run these commands in the Shell tab exactly as shown:**

### Step 1: Add Missing Dependencies
```bash
cd spanner-mobile
```

### Step 2: Update package.json (Already Done)
I've updated the package.json to include the missing dependencies:
- `react-native-web@~0.19.10`
- `@expo/metro-runtime@~3.2.3`

### Step 3: Install with Force Flag
```bash
npm install --force
```

### Step 4: Start Mobile App
```bash
npx expo start --web
```

## Alternative: Skip Web and Use Mobile Only

If web support continues to cause issues, you can start the mobile app for device testing only:

```bash
npx expo start --tunnel
```

This will:
- Skip web browser
- Generate QR code for your mobile device
- Work with Expo Go app on your phone

## What Each Command Does

- `npm install --force`: Ignores dependency conflicts and installs anyway
- `npx expo start --web`: Starts development server with web support
- `npx expo start --tunnel`: Creates tunnel for mobile device testing

## Expected Result

After running the commands, you should see:
```
Starting project at /home/runner/workspace/spanner-mobile
Starting Metro Bundler
Web server starting on port 19000
```

## Mobile App Features Ready

Once running, your mobile app will have:
- Login screen with OTP verification
- Home dashboard for clients/workers
- Connection to your existing SPANNER backend
- Real-time sync with web app

## Next Steps After It's Running

1. Test login flow on web browser
2. Scan QR code with Expo Go app on your phone
3. Verify backend connection (should connect to localhost:5000)
4. Add more screens and features as needed

The mobile app is designed to work with your existing SPANNER backend, so all your current users, bookings, and data will be accessible from both web and mobile interfaces.