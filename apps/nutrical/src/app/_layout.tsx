import Slider from '@react-native-community/slider'
import { reloadAppAsync } from 'expo'
import { Image, ImageBackground } from 'expo-image'
import { LinearGradient } from 'expo-linear-gradient'
import { Slot } from 'expo-router'
import { HTTPError } from 'ky'
import { cssInterop } from 'nativewind'
import { useCallback } from 'react'
import { TextInput, View } from 'react-native'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import Toast, {
  ErrorToast,
  InfoToast,
  SuccessToast,
  ToastConfig
} from 'react-native-toast-message'
import { SWRConfig } from 'swr'

import '../../global.css'

import { SessionProvider } from '~/components/ctx'
import asyncStorageProvider from '~/components/network/cacheProvider'
import useClient from '~/components/network/client'
import { useStorageState } from '~/hooks/useStorageState'
import { setLocale } from '~/paraglide/runtime'

import * as Clarity from '@microsoft/react-native-clarity'

Clarity.initialize('v1z5ntrx3p', {
  logLevel: Clarity.LogLevel.None // Note: Use "LogLevel.Verbose" value while testing to debug initialization issues.
})

export default function RootLayout() {
  setLocale('en')
  const [[, token], setToken] = useStorageState('token')

  const api = useClient(token)
  const fetcher = useCallback(
    async (url: string) => {
      try {
        return await api(url).json()
      } catch (error) {
        if (error instanceof HTTPError && error.response.status === 401) {
          setToken(null)
          reloadAppAsync()
          return { error: true, message: 'Unauthorized' }
        } else {
          throw error
        }
      }
    },
    [api, setToken]
  )
  //CSS Interops
  cssInterop(Image, { className: 'style' })
  cssInterop(ImageBackground, { className: 'style' })
  cssInterop(LinearGradient, { className: 'style' })
  cssInterop(TextInput, { className: 'style' })
  cssInterop(Slider, { className: 'style' })

  return (
    <SessionProvider>
      <SWRConfig
        value={{
          provider: asyncStorageProvider,
          fetcher,
          refreshInterval: 300000
        }}
      >
        <SafeAreaProvider>
          <View className={'bg-gray-100 h-full'}>
            <Slot />
            <Toast config={toastConfig} />
          </View>
        </SafeAreaProvider>
      </SWRConfig>
    </SessionProvider>
  )
}
const toastConfig: ToastConfig = {
  success: (props) => (
    <SuccessToast
      {...props}
      text1Style={{
        textAlign: 'left',
        fontFamily: 'Cairo-Bold'
      }}
      text2Style={{
        textAlign: 'left',
        fontFamily: 'Cairo-Regular'
      }}
    />
  ),
  error: (props) => (
    <ErrorToast
      {...props}
      text1Style={{
        textAlign: 'left',
        fontFamily: 'Cairo-Bold'
      }}
      text2Style={{
        textAlign: 'left',
        fontFamily: 'Cairo-Regular'
      }}
    />
  ),
  info: (props) => (
    <InfoToast
      {...props}
      text1Style={{
        textAlign: 'left',
        fontFamily: 'Cairo-Bold'
      }}
      text2Style={{
        textAlign: 'left',
        fontFamily: 'Cairo-Regular'
      }}
    />
  )
}
