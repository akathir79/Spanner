# Simple Way to Start SPANNER Mobile App

## The Issue You Encountered
The dependency conflicts happen because React Native has strict version requirements. This is normal and expected.

## Solution 1: Use --legacy-peer-deps (Recommended)

In the **Shell tab** in Replit, run these commands:

```bash
cd spanner-mobile
```

```bash
npm install --legacy-peer-deps
```

```bash
npx expo start --web
```

## Solution 2: Alternative Approach

If Solution 1 doesn't work, try this:

```bash
cd spanner-mobile
```

```bash
rm -rf node_modules package-lock.json
```

```bash
npm install --force
```

```bash
npx expo start --web
```

## What Will Happen

After running these commands, you should see:
- Development server starting
- QR code for mobile testing
- Web browser opening with your mobile app
- Message like "Starting project at /home/runner/workspace/spanner-mobile"

## Testing the Mobile App

1. **Web Browser**: The app will open in your browser for immediate testing
2. **Mobile Device**: Scan the QR code with Expo Go app
3. **Development**: Make changes and see them update live

## Why This Works

- `--legacy-peer-deps` tells npm to ignore version conflicts
- `--force` bypasses dependency checks
- `expo start --web` runs the app in web mode for easy testing

## Quick Test

Once it's running, you should see:
- SPANNER mobile app login screen
- Mobile-optimized interface
- Connection to your existing backend on port 5000

## Next Steps

After it's running successfully:
1. Test the login flow
2. Verify backend connection
3. Add more mobile-specific features
4. Deploy to app stores when ready

## Troubleshooting

If you still get errors:
1. Make sure you're in the `spanner-mobile` directory
2. Try `npx create-expo-app@latest test-app` to verify Expo works
3. Use the web version first: `npx expo start --web`