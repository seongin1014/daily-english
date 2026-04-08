const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Firebase JS SDK: resolve .cjs files
config.resolver.sourceExts.push('cjs');

// Force Metro to use "main" field instead of "browser" field in package.json
// This prevents Firebase's ESM browser build from being picked up (which doesn't exist in RN)
config.resolver.resolverMainFields = ['react-native', 'main'];

module.exports = config;
