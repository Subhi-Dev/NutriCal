import { router } from 'expo-router'
import { ChevronLeft } from 'lucide-react-native'
import { useState } from 'react'
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Toast from 'react-native-toast-message'

import useClient from '~/components/network/client'
import { m } from '~/paraglide/messages'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const client = useClient()

  const handleResetRequest = async () => {
    if (!email) {
      return Toast.show({
        type: 'error',
        text1: m.forgot_password_error_no_email()
      })
    }
    setLoading(true)
    try {
      const result = await client
        .post<{ error: false; message: string } | { error: true; message: string }>(
          'auth/forgot-password',
          {
            json: { email }
          }
        )
        .json()

      setLoading(false)

      if (result.error) {
        return Toast.show({
          type: 'error',
          text1: result.message
        })
      }

      Toast.show({
        type: 'success',
        text1: m.forgot_password_success_title(),
        text2: m.forgot_password_success_message()
      })
      router.back()
    } catch (err) {
      setLoading(false)
      Toast.show({
        type: 'error',
        text1: m.login_unknown_error()
      })
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
              <Text className={'font-display-bold text-gray-900 text-3xl mb-2'}>
                {m.forgot_password_title()}
              </Text>
              <Text
                className={'font-display text-center text-gray-600 text-base'}
              >
                {m.forgot_password_subtitle()}
              </Text>
            </View>

            <View className={'mt-8'}>
              <View className="mb-6">
                <Text
                  className={'font-display-medium text-gray-700 text-sm mb-2'}
                >
                  {m.forgot_password_email_label()}
                </Text>
                <TextInput
                  className={
                    'p-3 bg-white border-gray-300 border rounded-lg w-full h-12 font-display text-base text-gray-900'
                  }
                  placeholder={m.forgot_password_email_placeholder()}
                  placeholderTextColor={'#9CA3AF'}
                  textAlign={'left'}
                  keyboardType={'email-address'}
                  onChangeText={setEmail}
                  textContentType={'emailAddress'}
                  autoComplete={'email'}
                  autoCapitalize={'none'}
                />
              </View>
            </View>

            <View className={'mt-2'}>
              <Pressable
                onPress={handleResetRequest}
                disabled={loading}
                className={
                  'w-full items-center justify-center rounded-lg h-12 bg-green-600 shadow disabled:bg-green-400'
                }
              >
                <Text className={'font-display-semibold text-base text-white'}>
                  {m.forgot_password_button()}
                </Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
