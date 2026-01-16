import { reloadAppAsync } from 'expo'
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

import { useStorageState } from '~/hooks/useStorageState'
import { m } from '~/paraglide/messages'

export default function ServerUrlPage() {
  const [[, currentUrl], setUrl] = useStorageState('serverUrl')
  const [newUrl, setNewUrl] = useState<string>(
    currentUrl || process.env.EXPO_PUBLIC_API_BASE || ''
  )
  const [saveDisabled, setSaveDisabled] = useState(false)

  const handleSave = async () => {
    setSaveDisabled(true)
    // Basic URL validation
    if (
      newUrl &&
      (newUrl.startsWith('http://') || newUrl.startsWith('https://'))
    ) {
      await setUrl(newUrl)
      Toast.show({
        type: 'success',
        text1: m.server_url_success_title(),
        text2: m.server_url_success_message()
      })
      await reloadAppAsync()
    } else {
      Toast.show({
        type: 'error',
        text1: m.server_url_error_title(),
        text2: m.server_url_error_message()
      })
    }
    setSaveDisabled(false)
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
                {m.server_url_title()}
              </Text>
              <Text
                className={'font-display text-center text-gray-600 text-base'}
              >
                {m.server_url_subtitle()}
              </Text>
            </View>

            <View className={'mt-8'}>
              <View>
                <Text
                  className={'font-display-medium text-gray-700 text-sm mb-2'}
                >
                  {m.server_url_label()}
                </Text>
                <TextInput
                  className={
                    'p-3 bg-white border-gray-300 border rounded-lg w-full h-12 font-display text-base text-gray-900'
                  }
                  textAlign={'left'}
                  keyboardType={'url'}
                  onChangeText={setNewUrl}
                  value={newUrl}
                  textContentType={'URL'}
                  autoCapitalize="none"
                  autoCorrect={false}
                  placeholder={m.server_url_placeholder()}
                  placeholderTextColor={'#9CA3AF'}
                />
              </View>
            </View>

            <View className={'mt-8'}>
              <Pressable
                onPress={handleSave}
                disabled={saveDisabled}
                className={
                  'w-full items-center justify-center rounded-lg h-12 bg-green-600 shadow disabled:bg-green-400'
                }
              >
                <Text className={'font-display-semibold text-base text-white'}>
                  {m.server_url_save_button()}
                </Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
