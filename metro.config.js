const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');
const path = require('path');

const defaultConfig = getDefaultConfig(__dirname);

const config = {
  transformer: {
    babelTransformerPath: require.resolve('react-native-svg-transformer'),
  },
  resolver: {
    assetExts: defaultConfig.resolver.assetExts.filter(ext => ext !== 'svg').concat('xlsx'),
    sourceExts: [...defaultConfig.resolver.sourceExts, 'svg'],
    blockList: [/[/\\\\]build[/\\\\]/],
  },
};

module.exports = mergeConfig(defaultConfig, config);
