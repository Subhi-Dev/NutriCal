import { reloadAppAsync } from 'expo'
import { Image } from 'expo-image'
import { router } from 'expo-router'
import { ChevronLeft } from 'lucide-react-native'
import { useState } from 'react'
import {
  Pressable,
  TextInput,
  View,
  Text,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Toast from 'react-native-toast-message'

import useClient from '~/components/network/client'
import { useStorageState } from '~/hooks/useStorageState'
import { m } from '~/paraglide/messages'
import { Session } from '~/types'

//TODO: Add A Proper SSO Implementation
export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loginDisable, setLoginDisable] = useState(false)

  const [, setToken] = useStorageState('token')
  const api = useClient()
  const handleSignIn = async () => {
    try {
      setLoginDisable(true)
      const result = await api
        .post<
          | { error: false; data: { token: string; session: Session } }
          | { error: true; message: string }
        >('auth/login', {
          json: { email, password }
        })
        .json()
      if (result.error) {
        setLoginDisable(false)
        return Toast.show({ type: 'error', text1: result.message })
      }
      if (result.data.token) {
        setToken(result.data.token)
        reloadAppAsync()
      } else {
        setLoginDisable(false)
        Toast.show({ type: 'error', text1: m.login_error() })
      }
    } catch (err) {
      setLoginDisable(false)
      Toast.show({ type: 'error', text1: m.login_unknown_error() })
    }
  }

  return (
    <SafeAreaView className={'flex-1 bg-gray-50'}>
      <View className={'px-4'}>
        <Pressable
          className={'self-start p-2'}
          onPress={() => {
            router.back()
          }}
        >
          <ChevronLeft
            size={24}
            color={'#1F2937'}
          />
        </Pressable>
      </View>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className={'flex-1'}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
          keyboardShouldPersistTaps={'handled'}
          className={'px-6'}
        >
          <View>
            <View className={'items-center'}>
              {/* Make sure to replace with your actual icon path */}
              <Image
                source={require('@assets/icon.png')}
                className={'h-20 w-20 mb-8 rounded-lg'}
                contentFit={'contain'}
              />
              <Text className={'font-display-bold text-gray-900 text-3xl mb-2'}>
                {m.login_welcome()}
              </Text>
              <Text className={'font-display text-gray-600 text-base'}>
                {m.login_subtitle()}
              </Text>
            </View>

            <View className={'mt-8'}>
              <View className="mb-6">
                <Text
                  className={'font-display-medium text-gray-700 text-sm mb-2'}
                >
                  {m.login_email_label()}
                </Text>
                <TextInput
                  className={
                    'p-3 bg-white border-gray-300 border rounded-lg w-full h-12 font-display text-base text-gray-900'
                  }
                  placeholder={m.login_email_placeholder()}
                  placeholderTextColor={'#9CA3AF'}
                  textAlign={'left'}
                  keyboardType={'email-address'}
                  onChangeText={setEmail}
                  textContentType={'emailAddress'}
                  autoComplete={'email'}
                  autoCapitalize={'none'}
                />
              </View>

              <View>
                <Text
                  className={'font-display-medium text-gray-700 text-sm mb-2'}
                >
                  {m.login_password_label()}
                </Text>
                <TextInput
                  className={
                    'p-3 bg-white border-gray-300 border rounded-lg w-full h-12 font-display text-base text-gray-900'
                  }
                  placeholder={m.login_password_placeholder()}
                  placeholderTextColor={'#9CA3AF'}
                  textAlign={'left'}
                  onChangeText={setPassword}
                  textContentType={'password'}
                  autoComplete={'password'}
                  secureTextEntry
                />
                <Pressable
                  onPress={() => {
                    router.push('/(auth)/forgot-password')
                  }}
                  className={'self-end mt-2'}
                >
                  <Text className={'font-display-medium text-blue-600 text-sm'}>
                    {m.login_forgot_password()}
                  </Text>
                </Pressable>
              </View>
            </View>

            <View className={'mt-8'}>
              <Pressable
                onPress={handleSignIn}
                disabled={loginDisable}
                className={
                  'w-full items-center justify-center rounded-lg h-12 bg-green-600 disabled:bg-green-400 flex-row'
                }
              >
                {loginDisable && (
                  <ActivityIndicator
                    color="#fff"
                    style={{ marginRight: 8 }}
                  />
                )}
                <Text className={'font-display-semibold text-base text-white'}>
                  {loginDisable ? m.login_logging_in() : m.login_button()}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  router.push('/(auth)/server-url')
                }}
                className={'items-center mt-4'}
              >
                <Text className={'font-display-medium text-blue-600 text-sm'}>
                  {m.login_change_server_url()}
                </Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
