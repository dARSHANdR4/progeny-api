# Progeny Mobile: On-the-Field Plant Diagnostic App

A high-performance React Native application for real-time plant disease detection, designed to work in low-connectivity agricultural environments.

## 🚀 Technology Stack
- **Framework:** Expo (React Native)
- **Navigation:** React Navigation (Native Stack)
- **Storage:** Redux Toolkit + Async Storage
- **ML Engine:** `react-native-fast-tflite` for on-device inference.
- **Backend Sync:** Supabase

## 🛠️ Local Installation

1. **Prerequisites**
   - Install Expo Go on your mobile device.
   - Node.js 18+.

2. **Setup Instructions**
   ```bash
   cd progeny-mobile
   npm install
   ```

3. **Running in Development**
   ```bash
   npx expo start
   ```

## 🧠 On-Device ML (TFLite)

The app features on-device inference using TFLite models for maximum privacy and speed.
- **Model File:** `best_float16.tflite` (Optimized for mobile performance).
- **Inference Hook:** Managed via Custom Worklets for zero UI-thread lag.

## 🏗️ Core Screens

- **Camera Hub:** Real-time bounding boxes and disease classifications.
- **Farmer Dashboard:** Summary of local farm health and quick actions.
- **Community Portal:** Shared knowledge and disease alerts from nearby farms.
- **Voice Help:** Multilingual AI assistant for hands-free support.

## 🚢 Production & Builds (EAS)

The mobile app is distributed using **Expo Application Services (EAS)**.

### Build Artifacts
Current Build ID: `97aaa623-9d3a-4764-a7c4-1a63400c0be1`

### Generating a New Build
1. **Login to EAS:**
   ```bash
   npx eas login
   ```
2. **Configure (if needed):**
   ```bash
   npx eas build:configure
   ```
3. **Trigger Production Build:**
   ```bash
   # For Android APK
   npx eas build --platform android --profile production
   ```

## 🔒 Security & Privacy
- **Supabase Auth:** Secure login and data persistence.
- **Offline First:** Scans are cached locally and synced once connectivity is restored.
