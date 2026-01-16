import { PatchUserReturn } from '@backend/types'
import DateTimePicker from '@react-native-community/datetimepicker'
import { router } from 'expo-router'
import { ChevronLeft } from 'lucide-react-native'
import { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View
} from 'react-native'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  FadeIn,
  SlideInRight
} from 'react-native-reanimated'
import { SafeAreaView } from 'react-native-safe-area-context'
import Toast from 'react-native-toast-message'

import useClient from '~/components/network/client'
import { m } from '~/paraglide/messages'
// Animation imports

const totalSteps = 4

const activityLevels = [
  {
    id: 'sedentary',
    name: m.setup_activity_sedentary(),
    description: m.setup_activity_sedentary_desc()
  },
  {
    id: 'lightly_active',
    name: m.setup_activity_lightly_active(),
    description: m.setup_activity_lightly_active_desc()
  },
  {
    id: 'moderately_active',
    name: m.setup_activity_moderately_active(),
    description: m.setup_activity_moderately_active_desc()
  },
  {
    id: 'very_active',
    name: m.setup_activity_very_active(),
    description: m.setup_activity_very_active_desc()
  },
  {
    id: 'extra_active',
    name: m.setup_activity_extra_active(),
    description: m.setup_activity_extra_active_desc()
  }
]

export default function InitialUserSetup() {
  const [step, setStep] = useState(1)
  const [weight, setWeight] = useState('')
  const [height, setHeight] = useState('')
  const [dob, setDob] = useState<Date | null>(null)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [activityLevel, setActivityLevel] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const api = useClient()
  // Progress bar animation
  const progress = useSharedValue((step / totalSteps) * 100)
  useEffect(() => {
    progress.value = withTiming((step / totalSteps) * 100, { duration: 400 })
  }, [step])

  const progressBarStyle = useAnimatedStyle(() => ({
    width: `${progress.value}%`
  }))

  // Step content animation key
  const [stepKey, setStepKey] = useState(0)
  useEffect(() => {
    setStepKey((k) => k + 1)
  }, [step])

  const handleNext = () => {
    setError(null)
    if (loading) return
    if (step === 1) {
      const w = parseFloat(weight)
      if (!weight || isNaN(w) || w <= 0 || w > 500) {
        setError(m.setup_weight_error())
        return
      }
    }
    if (step === 2) {
      const h = parseFloat(height)
      if (!height || isNaN(h) || h < 50 || h > 300) {
        setError(m.setup_height_error())
        return
      }
    }
    if (step === 3) {
      if (
        !dob ||
        !(dob instanceof Date) ||
        dob > new Date() ||
        dob.getFullYear() < 1900
      ) {
        setError(m.setup_dob_error())
        return
      }
    }
    if (step === 4) {
      if (!activityLevel) {
        setError(m.setup_activity_error())
        return
      }
    }
    if (step < totalSteps) {
      setStep(step + 1)
    } else {
      handleSubmit()
    }
  }

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1)
    } else {
      if (router.canGoBack()) router.back()
    }
  }

  const handleSubmit = async () => {
    setLoading(true)
    // TODO: Add API call to save user data
    const res = await api
      .patch<
        | { error: true; message: string }
        | { error: false; data: PatchUserReturn }
      >('users', {
        json: {
          weight: parseFloat(weight),
          height: parseFloat(height),
          dateOfBirth: dob?.toISOString(),
          activityLevel
        }
      })
      .json()
    setLoading(false)
    if (res.error) {
      Toast.show({
        type: 'error',
        text1: m.setup_error(),
        text2: res.message
      })
      return
    }
    router.replace('/nutrical/home')
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
              {m.setup_weight_title()}
            </Text>
            <Text className={'font-display text-gray-600 text-base mb-8'}>
              {m.setup_weight_subtitle()}
            </Text>
            <TextInput
              className={
                'p-3 bg-white border-gray-300 border rounded-lg w-full h-12 font-display text-base text-gray-900 text-center'
              }
              placeholder={m.setup_weight_placeholder()}
              placeholderTextColor={'#9CA3AF'}
              keyboardType={'numeric'}
              onChangeText={setWeight}
              value={weight}
            />
            {error && (
              <Text className="text-red-600 mt-2 text-sm">{error}</Text>
            )}
          </Animated.View>
        )
      case 2:
        return (
          <Animated.View
            entering={FadeIn.duration(400)}
            key={stepKey}
          >
            <Text className={'font-display-bold text-gray-900 text-3xl mb-2'}>
              {m.setup_height_title()}
            </Text>
            <Text className={'font-display text-gray-600 text-base mb-8'}>
              {m.setup_height_subtitle()}
            </Text>
            <TextInput
              className={
                'p-3 bg-white border-gray-300 border rounded-lg w-full h-12 font-display text-base text-gray-900 text-center'
              }
              placeholder={m.setup_height_placeholder()}
              placeholderTextColor={'#9CA3AF'}
              keyboardType={'numeric'}
              onChangeText={setHeight}
              value={height}
            />
            {error && (
              <Text className="text-red-600 mt-2 text-sm">{error}</Text>
            )}
          </Animated.View>
        )
      case 3:
        return (
          <Animated.View
            entering={SlideInRight.duration(400)}
            key={stepKey}
          >
            <Text className={'font-display-bold text-gray-900 text-3xl mb-2'}>
              {m.setup_dob_title()}
            </Text>
            <Text className={'font-display text-gray-600 text-base mb-8'}>
              {m.setup_dob_subtitle()}
            </Text>
            <Pressable
              onPress={() => setShowDatePicker(true)}
              className={
                'p-3 bg-white border-gray-300 border rounded-lg w-full h-12 justify-center items-center'
              }
            >
              <Text className={'font-display text-base text-gray-900'}>
                {dob ? dob.toLocaleDateString() : m.setup_dob_placeholder()}
              </Text>
            </Pressable>
            {showDatePicker && Platform.OS === 'ios' && (
              <View className="mt-2 bg-gray-100 rounded-lg overflow-hidden">
                <DateTimePicker
                  value={dob || new Date(2000, 0, 1)}
                  mode="date"
                  display="spinner"
                  maximumDate={new Date()}
                  onChange={(_, selectedDate) => {
                    if (selectedDate) setDob(selectedDate)
                  }}
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
            {showDatePicker && Platform.OS === 'android' && (
              <DateTimePicker
                value={dob || new Date(2000, 0, 1)}
                mode="date"
                display="default"
                maximumDate={new Date()}
                onChange={(_, selectedDate) => {
                  setShowDatePicker(false)
                  if (selectedDate) setDob(selectedDate)
                }}
              />
            )}
            {error && (
              <Text className="text-red-600 mt-2 text-sm">{error}</Text>
            )}
          </Animated.View>
        )
      case 4:
        return (
          <Animated.View
            entering={FadeIn.duration(400)}
            key={stepKey}
          >
            <Text className={'font-display-bold text-gray-900 text-3xl mb-2'}>
              {m.setup_activity_title()}
            </Text>
            <Text className={'font-display text-gray-600 text-base mb-8'}>
              {m.setup_activity_subtitle()}
            </Text>
            {activityLevels.map((level) => (
              <Pressable
                key={level.id}
                onPress={() => setActivityLevel(level.id)}
                className={`border rounded-lg p-4 mb-3 ${
                  activityLevel === level.id
                    ? 'border-green-600 bg-green-50'
                    : 'border-gray-300 bg-white'
                }`}
              >
                <Text
                  className={`font-display-semibold text-base ${
                    activityLevel === level.id
                      ? 'text-green-800'
                      : 'text-gray-900'
                  }`}
                >
                  {level.name}
                </Text>
                <Text
                  className={`font-display text-sm ${
                    activityLevel === level.id
                      ? 'text-green-700'
                      : 'text-gray-600'
                  }`}
                >
                  {level.description}
                </Text>
              </Pressable>
            ))}
            {error && (
              <Text className="text-red-600 mt-2 text-sm">{error}</Text>
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
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <View style={{ flex: 1 }}>
          <ScrollView
            contentContainerStyle={{
              flexGrow: 1,
              justifyContent: 'center',
              paddingBottom: 24
            }}
            keyboardShouldPersistTaps={'handled'}
            className={'px-6'}
          >
            <View className={'text-center'}>{renderStepContent()}</View>
          </ScrollView>
          <View className={'px-6 pb-4'}>
            <Pressable
              onPress={handleNext}
              disabled={loading}
              className={
                'w-full items-center justify-center rounded-lg h-12 bg-green-600 disabled:bg-green-400 flex-row shadow-sm'
              }
            >
              {loading && (
                <ActivityIndicator
                  color="#fff"
                  style={{ marginRight: 8 }}
                />
              )}
              <Text className={'font-display-semibold text-base text-white'}>
                {loading
                  ? step === totalSteps
                    ? m.setup_finishing()
                    : m.setup_loading()
                  : step === totalSteps
                    ? m.setup_finish()
                    : m.setup_next()}
              </Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
