// Learn more: https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Production optimizations
if (process.env.NODE_ENV === 'production') {
  // Enable minification
  config.transformer = {
    ...config.transformer,
    minifierConfig: {
      compress: {
        drop_console: true, // Remove console.log in production
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.debug', 'console.info'],
      },
      mangle: {
        toplevel: true,
        keep_fnames: false,
      },
      output: {
        comments: false,
        beautify: false,
      },
    },
  };
}

module.exports = config;
