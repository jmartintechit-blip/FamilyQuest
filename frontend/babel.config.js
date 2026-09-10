module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // Reanimated (v4) mueve animaciones a un hilo aparte para que corran fluidas
    // incluso si el hilo de JS está ocupado. Este plugin tiene que ir último.
    plugins: ['react-native-worklets/plugin'],
  };
};
