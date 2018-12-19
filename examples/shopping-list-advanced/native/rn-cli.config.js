const blacklist = require('metro-config/src/defaults/blacklist')
const path = require('path')

module.exports = {
  resolver: {
    blacklistRE: blacklist([
      /ui[/\\]node_modules[/\\]react-native[/\\].*/,
      /ui[/\\]node_modules[/\\]expo[/\\].*/
    ]),
    extraNodeModules: {
      'react-native': path.resolve(__dirname, 'node_modules/react-native'),
      expo: path.resolve(__dirname, 'node_modules/expo')
    }
  }
}
