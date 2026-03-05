# Android Build Guide for Echoes

This guide will help you build a release APK/AAB for the Echoes app.

## Prerequisites
- Android Studio installed
- Java Development Kit (JDK) 17 or later
- Android SDK configured

## Step 1: Prepare the Web Assets
We have already run these commands for you, but if you make changes, run them again:
```bash
npm run build
npx cap sync
```

## Step 2: Open Android Studio
Run the following command in your terminal:
```bash
npx cap open android
```
Or manually open the `android` folder in Android Studio.

## Step 3: Configure Signing (Keystore)
The `android/app/build.gradle` file references a keystore file that does not exist yet:
```gradle
signingConfigs {
    release {
        storeFile file("../my-release-key.keystore")
        storePassword "123456"
        keyAlias "my-key-alias"
        keyPassword "123456"
    }
}
```

### Option A: Create the Keystore (Recommended for Command Line Builds)
1. Open a terminal in the `android` directory.
2. Run the following command to generate a keystore:
   ```bash
   keytool -genkey -v -keystore my-release-key.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000
   ```
3. Set the password to `123456` (or update `build.gradle` with your own password).
4. Answer the questions (Name, Org, etc.).

### Option B: Use Android Studio GUI (Recommended for Visual Builds)
1. In Android Studio, go to **Build > Generate Signed Bundle / APK**.
2. Select **APK** or **Android App Bundle**.
3. Click **Next**.
4. Under **Key store path**, click **Create new...**.
5. Fill in the details and remember the passwords.
6. Click **Next** and select **release** build variant.
7. Click **Create**.

## Step 4: Build & Run
- **To run on a device**: Connect your Android phone, enable USB Debugging, and click the "Run" (Play) button in Android Studio.
- **To build APK**: Go to **Build > Build Bundle(s) / APK(s) > Build APK(s)**.
  - The APK will be located in `android/app/build/outputs/apk/debug/` or `release/`.

## Troubleshooting
- **Gradle Sync Failed**: If you see errors about missing `my-release-key.keystore`, either create it using Option A above, or comment out the `signingConfigs.release` block in `android/app/build.gradle`.
- **Biometric Error**: Ensure your device has a fingerprint/face lock set up.
