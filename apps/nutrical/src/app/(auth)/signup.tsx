import DateTimePicker, {
  DateTimePickerAndroid,
  DateTimePickerEvent
} from '@react-native-community/datetimepicker'
import { router } from 'expo-router'
import { ChevronLeft } from 'lucide-react-native'
import { useState, useEffect } from 'react'
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
import Animated, {
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withTiming
} from 'react-native-reanimated'
import { SafeAreaView } from 'react-native-safe-area-context'
import Toast from 'react-native-toast-message'

import { useSession } from '~/components/ctx'
import useClient from '~/components/network/client'
import { Session, User } from '~/types'

const totalSteps = 3

export default function Signup() {
  const [step, setStep] = useState(1)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [sex, setSex] = useState<'M' | 'F'>('M')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [date, setDate] = useState(new Date())
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [signupDisable, setSignupDisable] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Progress bar animation
  const progress = useSharedValue((step / totalSteps) * 100)
  useEffect(() => {
    progress.value = withTiming((step / totalSteps) * 100, { duration: 400 })
  }, [step])

  const progressBarStyle = useAnimatedStyle(() => ({
    width: `${progress.value}%`
  }))

  const [stepKey, setStepKey] = useState(0)
  useEffect(() => {
    setStepKey((k) => k + 1)
  }, [step])

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
    setShowDatePicker(false)
    if (selectedDate) setDate(selectedDate)
  }

  const { signIn } = useSession()
  const client = useClient()

  const handleNext = async () => {
    setError(null)
    if (step === 1) {
      if (!email || !email.includes('@')) {
        setError('Please enter a valid email address')
        return
      }
      if (!password || password.length < 6) {
        setError('Password must be at least 6 characters')
        return
      }
    }
    if (step === 2) {
      if (!firstName) {
        setError('Please enter your first name')
        return
      }
      if (!lastName) {
        setError('Please enter your last name')
        return
      }
    }

    if (step < totalSteps) {
      setStep(step + 1)
    } else {
      await handleSignUp()
    }
  }

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1)
    } else {
      if (router.canGoBack()) router.back()
    }
  }

  const handleSignUp = async () => {
    try {
      setSignupDisable(true)
      const result = await client
        .post<
          | {
              error: false
              data: { session: Session; user: User; token: string }
            }
          | { error: true; message: string }
        >('auth/signup', {
          json: {
            email,
            password,
            firstName,
            lastName,
            sex,
            dateOfBirth: date.toISOString()
          }
        })
        .json()
      if (result?.error) {
        Toast.show({ type: 'error', text1: result.message })
        console.log(result)
        setSignupDisable(false)
        return
      }

      if (result?.data.token) {
        signIn(result.data.token)
        router.replace('/initialUserSetup')
      } else {
        Toast.show({
          type: 'error',
          text1: 'Signup failed'
        })
        setSignupDisable(false)
      }
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Unknown Error' })
      console.log(err)

      setSignupDisable(false)
    }
  }

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <Animated.View
            entering={FadeIn.duration(400)}
            key={stepKey}
          >
            <Text className={'font-display-bold text-gray-900 text-3xl mb-2'}>
              Account Details
            </Text>
            <Text className={'font-display text-gray-600 text-base mb-8'}>
              Enter your email and choose a password
            </Text>

            <Text
              className={'font-display-medium text-gray-700 text-base mb-2'}
            >
              Email Address
            </Text>
            <TextInput
              className={
                'p-3 bg-white border-gray-300 border rounded-lg w-full h-12 font-display text-base text-gray-900 mb-4'
              }
              placeholder="name@example.com"
              placeholderTextColor="#9CA3AF"
              keyboardType={'email-address'}
              onChangeText={setEmail}
              value={email}
              autoCapitalize="none"
              textContentType={'emailAddress'}
              autoComplete={'email'}
            />

            <Text
              className={'font-display-medium text-gray-700 text-base mb-2'}
            >
              Password
            </Text>
            <TextInput
              className={
                'p-3 bg-white border-gray-300 border rounded-lg w-full h-12 font-display text-base text-gray-900'
              }
              placeholder="Min. 6 characters"
              placeholderTextColor="#9CA3AF"
              onChangeText={setPassword}
              value={password}
              textContentType={'password'}
              autoComplete={'password'}
              secureTextEntry
            />
          </Animated.View>
        )
      case 2:
        return (
          <Animated.View
            entering={FadeIn.duration(400)}
            key={stepKey}
          >
            <Text className={'font-display-bold text-gray-900 text-3xl mb-2'}>
              Personal Info
            </Text>
            <Text className={'font-display text-gray-600 text-base mb-8'}>
              What should we call you?
            </Text>

            <Text
              className={'font-display-medium text-gray-700 text-base mb-2'}
            >
              First Name
            </Text>
            <TextInput
              className={
                'p-3 bg-white border-gray-300 border rounded-lg w-full h-12 font-display text-base text-gray-900 mb-4'
              }
              placeholder="Jane"
              placeholderTextColor="#9CA3AF"
              onChangeText={setFirstName}
              value={firstName}
              textContentType={'givenName'}
              autoComplete={'name-given'}
            />

            <Text
              className={'font-display-medium text-gray-700 text-base mb-2'}
            >
              Last Name
            </Text>
            <TextInput
              className={
                'p-3 bg-white border-gray-300 border rounded-lg w-full h-12 font-display text-base text-gray-900'
              }
              placeholder="Doe"
              placeholderTextColor="#9CA3AF"
              onChangeText={setLastName}
              value={lastName}
              textContentType={'familyName'}
              autoComplete={'name-family'}
            />
          </Animated.View>
        )
      case 3:
        return (
          <Animated.View
            entering={FadeIn.duration(400)}
            key={stepKey}
          >
            <Text className={'font-display-bold text-gray-900 text-3xl mb-2'}>
              About You
            </Text>
            <Text className={'font-display text-gray-600 text-base mb-8'}>
              To help us personalize your experience
            </Text>

            <Text
              className={'font-display-medium text-gray-700 text-base mb-2'}
            >
              Sex
            </Text>
            <View className={'flex-row justify-between mb-6'}>
              <Pressable
                onPress={() => setSex('M')}
                className={`flex-1 mr-2 p-3 rounded-lg border items-center justify-center ${
                  sex === 'M'
                    ? 'bg-green-50 border-green-600'
                    : 'bg-white border-gray-300'
                }`}
              >
                <Text
                  className={`font-display-semibold text-base ${
                    sex === 'M' ? 'text-green-700' : 'text-gray-600'
                  }`}
                >
                  Male
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setSex('F')}
                className={`flex-1 ml-2 p-3 rounded-lg border items-center justify-center ${
                  sex === 'F'
                    ? 'bg-green-50 border-green-600'
                    : 'bg-white border-gray-300'
                }`}
              >
                <Text
                  className={`font-display-semibold text-base ${
                    sex === 'F' ? 'text-green-700' : 'text-gray-600'
                  }`}
                >
                  Female
                </Text>
              </Pressable>
            </View>

            <Text
              className={'font-display-medium text-gray-700 text-base mb-2'}
            >
              Date of Birth
            </Text>
            <Pressable
              onPress={() => {
                if (Platform.OS === 'android') {
                  showMode()
                } else {
                  setShowDatePicker(true)
                }
              }}
              className={
                'p-3 bg-white border-gray-300 border rounded-lg w-full h-12 justify-center'
              }
            >
              <Text className={'font-display text-base text-gray-900'}>
                {date.toLocaleDateString()}
              </Text>
            </Pressable>
            {showDatePicker && Platform.OS === 'ios' && (
              <View className="mt-2 bg-gray-100 rounded-lg overflow-hidden">
                <DateTimePicker
                  testID="dateTimePicker"
                  value={date}
                  mode={'date'}
                  display="spinner"
                  onChange={onChange}
                />
                <Pressable
                  onPress={() => setShowDatePicker(false)}
                  className="bg-white p-2 border-t border-gray-200"
                >
                  <Text className="text-center font-display-medium text-blue-500">
                    Done
                  </Text>
                </Pressable>
              </View>
            )}
          </Animated.View>
        )
      default:
        return null
    }
  }

  return (
    <SafeAreaView className={'flex-1 bg-gray-50'}>
      <View className={'px-4 pt-2'}>
        <View className={'flex-row items-center mb-4'}>
          <Pressable
            className={'self-start p-2 -ml-2'}
            onPress={handleBack}
          >
            <ChevronLeft
              size={24}
              color={'#1F2937'}
            />
          </Pressable>
          <View
            className={
              'flex-1 h-2 bg-gray-200 rounded-full mx-4 overflow-hidden'
            }
          >
            <Animated.View
              className={'h-2 bg-green-600 rounded-full'}
              style={progressBarStyle}
            />
          </View>
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className={'flex-1'}
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            paddingBottom: 24
          }}
          keyboardShouldPersistTaps={'handled'}
          className={'px-6'}
        >
          <View className={'flex-1 justify-center'}>
            {renderStepContent()}
            {error && (
              <Text className="text-red-600 mt-4 text-sm font-display">
                {error}
              </Text>
            )}
          </View>

          <View className={'pt-4'}>
            <Pressable
              disabled={signupDisable}
              onPress={handleNext}
              className={
                'w-full items-center justify-center rounded-lg h-12 bg-green-600 disabled:bg-green-400 flex-row shadow-sm'
              }
            >
              {signupDisable && (
                <ActivityIndicator
                  color="#fff"
                  style={{ marginRight: 8 }}
                />
              )}
              <Text className={'font-display-semibold text-base text-white'}>
                {step === totalSteps ? 'Create Account' : 'Next'}
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
