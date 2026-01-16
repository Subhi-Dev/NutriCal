import DateTimePicker, {
  DateTimePickerAndroid,
  DateTimePickerEvent
} from '@react-native-community/datetimepicker'
import { reloadAppAsync } from 'expo'
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
  KeyboardAvoidingView
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Toast from 'react-native-toast-message'
import useSWR from 'swr'

import { useSession } from '~/components/ctx'
import useClient from '~/components/network/client'
import { Session, User } from '~/types'

//TODO: Add A Proper SSO Implementation
//TODO: Check BDay selection on build
export default function Signup() {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [sex, setSex] = useState<'M' | 'F'>('M')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [date, setDate] = useState(new Date())
  const [signupDisable, setSignupDisable] = useState(false)

  //Android Report Date Picker
  const showMode = () => {
    DateTimePickerAndroid.open({
      value: date,
      onChange: onChange,
      mode: 'date',
      is24Hour: true
    })
  }

  //iOS report Date picker
  const onChange = (
    _event: DateTimePickerEvent,
    selectedDate: Date | undefined
  ) => {
    setDate(selectedDate || new Date())
  }

  const { signIn } = useSession()
  const client = useClient()

  const { mutate } = useSWR(
    'auth/signup',
    async (url) => {
      return await client
        .post<
          | {
              error: false
              data: { session: Session; user: User; token: string }
            }
          | { error: true; message: string }
        >(url, {
          json: { email, password, firstName, lastName, sex, dateOfBirth: date }
        })
        .json()
    },
    { revalidateOnFocus: false, shouldRetryOnError: false }
  )

  const handleSignUp = async () => {
    try {
      setSignupDisable(true)
      const result = await mutate()
      if (result?.error) {
        return Toast.show({ type: 'error', text1: result.message })
      }
      if (result?.data.token) {
        signIn(result.data.token)
        router.replace('/initialUserSetup')
      } else {
        Toast.show({ type: 'error', text1: 'Signup failed' })
      }
    } catch (err) {
      //captureException(err)
      Toast.show({ type: 'error', text1: 'Unknown Error' })
    } finally {
      setSignupDisable(false)
    }
  }
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className={'flex h-full pt-4'}
      //keyboardVerticalOffset={Number(navbarHeight)}
    >
      <ScrollView
        keyboardShouldPersistTaps={'handled'}
        className={''}
      >
        <SafeAreaView
          className={'flex flex-col items-center justify-center w-full'}
        >
          {/*<Image source={logo} className={"h-16 w-40 items-center self-center"} contentFit={"contain"}/>*/}
          <View className={'flex flex-col items-center w-screen px-8'}>
            <View
              className={'flex flex-col items-start justify-start self-start'}
            >
              <Pressable
                className={' p-4 -ml-6 -mt-6'}
                onPress={() => {
                  router.back()
                }}
              >
                <ChevronLeft size={24} />
              </Pressable>
              <View className={'flex flex-col justify-start items-center'}>
                <Text
                  className={'font-display-bold text-left text-2xl self-start'}
                >
                  Create Account
                </Text>
                <Text
                  className={
                    'font-display-medium text-gray-500 text-left text-md self-start mb-5'
                  }
                >
                  Enter your information to start using the app
                </Text>
              </View>
            </View>

            <Text
              className={'font-display-medium text-left text-lg self-start '}
            >
              First Name
            </Text>
            <TextInput
              className={
                'pt-2 px-2 bg-white border-gray-400 border rounded-lg w-full h-12 font-display text-lg'
              }
              textAlign={'left'}
              onChangeText={(text) => {
                setFirstName(text)
              }}
              textContentType={'givenName'}
              autoComplete={'name-given'}
            />

            <Text
              className={
                'font-display-medium text-left text-lg self-start mt-2'
              }
            >
              Last Name
            </Text>
            <TextInput
              className={
                'pt-2 px-2 bg-white border-gray-400 border rounded-lg w-full h-12 font-display text-lg'
              }
              textAlign={'left'}
              onChangeText={(text) => {
                setLastName(text)
              }}
              textContentType={'familyName'}
              autoComplete={'name-family'}
            />
            <View
              className={
                'flex flex-row justify-between items-center w-full mt-2'
              }
            >
              <Text
                className={'font-display-medium text-left text-lg self-start '}
              >
                Sex:
              </Text>
              <View className={'flex flex-row justify-between w-32'}>
                <Pressable
                  onPress={() => {
                    setSex('M')
                  }}
                  className={
                    sex === 'M'
                      ? 'bg-white rounded-full shadow px-4 py-1 border border-green-700'
                      : 'bg-white rounded-full shadow px-4 py-1'
                  }
                >
                  <Text className={'font-display'}>Male</Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    setSex('F')
                  }}
                  className={
                    sex === 'F'
                      ? 'bg-white rounded-full shadow px-4 py-1 border border-green-700'
                      : 'bg-white rounded-full shadow px-4 py-1'
                  }
                >
                  <Text className={'font-display'}>Female</Text>
                </Pressable>
              </View>
            </View>

            <Text
              className={
                'font-display-medium text-left text-lg self-start mt-2'
              }
            >
              Email Address
            </Text>
            <TextInput
              className={
                'pt-2 px-2 bg-white border-gray-400 border rounded-lg w-full h-12 font-display text-lg'
              }
              textAlign={'left'}
              keyboardType={'email-address'}
              onChangeText={(text) => {
                setEmail(text)
              }}
              textContentType={'emailAddress'}
              autoComplete={'email'}
            />

            <Text
              className={
                'font-display-medium text-left text-lg self-start mt-2'
              }
            >
              Password
            </Text>
            <TextInput
              className={
                'pt-2 px-2 bg-white border-gray-400 border rounded-lg w-full h-12 font-display text-lg'
              }
              textAlign={'left'}
              onChangeText={(text) => {
                setPassword(text)
              }}
              textContentType={'password'}
              autoComplete={'password'}
              secureTextEntry
            />
          </View>
          <View className={'flex flex-row items-center justify-between mt-2'}>
            <View>
              <Text
                className={
                  'font-display-medium text-left text-lg self-start mt-2'
                }
              >
                Date of birth
              </Text>
            </View>
            {Platform.OS === 'ios' && (
              <DateTimePicker
                testID="dateTimePicker"
                value={date}
                mode={'date'}
                onChange={onChange}
              />
            )}
            {Platform.OS === 'android' && (
              <Pressable
                onPress={showMode}
                className={'bg-gray-200 p-2 rounded-lg'}
              >
                <Text className={'font-display text-lg'}>
                  {date.toLocaleDateString()}
                </Text>
              </Pressable>
            )}
          </View>
          <Pressable
            disabled={signupDisable}
            onPress={handleSignUp}
            className={
              'pb-2 px-4 bg-green-600 rounded-lg shadow self-center mt-4'
            }
          >
            <Text
              className={
                'font-display-medium text-left text-lg self-start mt-2 text-white'
              }
            >
              Create account
            </Text>
          </Pressable>
        </SafeAreaView>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
