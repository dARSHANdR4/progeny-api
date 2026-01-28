import 'react-native-url-polyfill/auto';

// ENSURE POLYFILLS ARE APPLIED TO GLOBAL OBJECTS IMMEDIATELY
if (typeof global.URL === 'undefined') {
    global.URL = require('react-native-url-polyfill').URL;
}

// FORCE override because some stubs might exist but throw "Cannot create URL for blob"
global.URL.createObjectURL = (blob) => {
    console.warn('[Polyfill] URL.createObjectURL FORCED mock called. Blob type:', blob?.type);
    // Return a dummy data URI to satisfy the caller without crashing
    return 'data:application/octet-stream;base64,';
};

if (typeof global.URL.revokeObjectURL === 'undefined') {
    global.URL.revokeObjectURL = () => { };
}

// Sync window and global to be safe
if (typeof window !== 'undefined') {
    window.URL = global.URL;
}

import { registerRootComponent } from 'expo';
import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
