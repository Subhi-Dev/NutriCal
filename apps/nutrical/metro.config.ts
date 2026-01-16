/* eslint-disable @typescript-eslint/no-require-imports */
// This replaces `const { getDefaultConfig } = require('expo/metro-config');`
import { getDefaultConfig } from 'expo/metro-config'
import { withNativeWind } from 'nativewind/metro'
import { wrapWithReanimatedMetroConfig } from 'react-native-reanimated/metro-config'

const config = getDefaultConfig(__dirname)
config.maxWorkers = 2
module.exports = withNativeWind(wrapWithReanimatedMetroConfig(config), {
  input: './global.css'
})
