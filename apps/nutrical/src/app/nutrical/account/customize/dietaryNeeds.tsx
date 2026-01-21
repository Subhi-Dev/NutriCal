import Slider from '@react-native-community/slider'
import { differenceInYears } from 'date-fns'
import { router, Stack } from 'expo-router'
import { useEffect, useState } from 'react'
import { View, Text, Pressable, ScrollView, TextInput } from 'react-native'
import Toast from 'react-native-toast-message'
import useSWR from 'swr'
import { SafeAreaView } from 'react-native-safe-area-context'
import type {
  GetDietarySettingsReturn,
  PatchDietarySettingsReturn,
  GetAccountReturn
} from '@backend/types'

import ProgressCircle from '~/components/account/customize/ProgressCircle'
import useClient from '~/components/network/client'

export default function FoodPreferences() {
  const client = useClient()
  const [calories, setCalories] = useState('0')
  const [displayCalories, setDisplayCalories] = useState('0')
  const [carbs, setCarbs] = useState('0') // Number of calories from carbs
  const [proteins, setProteins] = useState('0') // Number of calories from proteins
  const [fats, setFats] = useState('0') // Number of calories from fats
  const data = [
    {
      label: 'Carbs',
      value: carbs,
      factor: 4,
      color: '#FFD700',
      setValue: setCarbs
    },
    {
      label: 'Proteins',
      value: proteins,
      factor: 4,
      color: '#FF4500',
      setValue: setProteins
    },
    {
      label: 'Fats',
      value: fats,
      factor: 9,
      color: '#FF6347',
      setValue: setFats
    }
  ]
  const {
    data: dietarySetting,
    isLoading,
    mutate
  } = useSWR<
    | { error: true; message: string }
    | { error: false; data: GetDietarySettingsReturn }
  >(`users/dietarySettings`)
  useEffect(() => {
    if (dietarySetting?.error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: dietarySetting.message
      })
    }
  }, [dietarySetting])
  const dietarySettings = dietarySetting?.error
    ? undefined
    : dietarySetting?.data
  useEffect(() => {
    if (dietarySettings) {
      setCalories(Number(dietarySettings.calorieGoal).toFixed(0) || '0')
      setDisplayCalories(Number(dietarySettings.calorieGoal).toFixed(0) || '0')
      setCarbs(
        dietarySettings.carbsGoal ||
          (Number(dietarySettings.calorieGoal) * 0.5).toString() ||
          '0'
      )
      setProteins(
        dietarySettings.proteinGoal ||
          (Number(dietarySettings.calorieGoal) * 0.3).toString() ||
          '0'
      )
      setFats(
        dietarySettings.fatGoal ||
          (Number(dietarySettings.calorieGoal) * 0.2).toString() ||
          '0'
      )
    }
  }, [dietarySettings])
  function sliderChangeValue(
    value: number,
    macro: 'Carbs' | 'Proteins' | 'Fats'
  ) {
    // A very beautiful function that adjusts the other macros when one is changed
    switch (macro) {
      case 'Carbs':
        setCarbs(((Number(calories) * value) / 100).toString())
        if (
          Math.floor(
            Number(calories) -
              (Number(calories) * value) / 100 -
              Number(proteins)
          ) >= 0
        ) {
          setFats(
            (
              Number(calories) -
              (Number(calories) * value) / 100 -
              Number(proteins)
            ).toString()
          )
        } else {
          setFats('0')
          setProteins(
            (
              Number(calories) -
              (Number(calories) * value) / 100 -
              Number(fats)
            ).toString()
          )
        }
        break
      case 'Proteins':
        setProteins(((Number(calories) * value) / 100).toString())
        if (
          Math.floor(
            Number(calories) - (Number(calories) * value) / 100 - Number(carbs)
          ) >= 0
        ) {
          setFats(
            (
              Number(calories) -
              (Number(calories) * value) / 100 -
              Number(carbs)
            ).toString()
          )
        } else {
          setFats('0')
          setCarbs(
            (
              Number(calories) -
              (Number(calories) * value) / 100 -
              Number(fats)
            ).toString()
          )
        }
        break
      case 'Fats':
        setFats(((Number(calories) * value) / 100).toString())
        if (
          Math.floor(
            Number(calories) - (Number(calories) * value) / 100 - Number(carbs)
          ) >= 0
        ) {
          setProteins(
            (
              Number(calories) -
              (Number(calories) * value) / 100 -
              Number(carbs)
            ).toString()
          )
        } else {
          setProteins('0')
          setCarbs(
            (
              Number(calories) -
              (Number(calories) * value) / 100 -
              Number(proteins)
            ).toString()
          )
        }
        break
    }
  }
  function calorieChangeValue(value: string) {
    //Adjusts the macros when the calories are changed and makes sure that the input is valid
    if (
      Number(value) < 0 ||
      Number(value) > 10000 ||
      isNaN(Number(value)) ||
      !Number(value)
    ) {
      setDisplayCalories(value)
      return
    }
    const carbsPercent = Number(carbs) / Number(calories)
    const proteinsPercent = Number(proteins) / Number(calories)
    const fatsPercent = Number(fats) / Number(calories)
    setDisplayCalories(value)
    setCalories(value)
    setCarbs((Number(value) * carbsPercent).toString())
    setProteins((Number(value) * proteinsPercent).toString())
    setFats((Number(value) * fatsPercent).toString())
  }
  async function savePreferences() {
    //Saves the preferences to the backend
    const res = await client
      .patch<
        | { error: true; message: string }
        | { error: false; data: PatchDietarySettingsReturn }
      >('users/dietarySettings', {
        json: {
          calorieGoal: Number(calories),
          carbsGoal: Number(carbs),
          proteinGoal: Number(proteins),
          fatGoal: Number(fats)
        }
      })
      .json()
    mutate()
    if (res.error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: res.message
      })
      return
    }
    Toast.show({
      type: 'success',
      text1: 'Success',
      text2: 'Dietary preferences saved'
    })
  }
  async function resetDefaults() {
    //Resets the values to the default values
    //TODO: SWR mutate instead
    const res = await client
      .get<
        | { error: true; message: string }
        | { error: false; data: GetAccountReturn }
      >('account')
      .json()
    if (res.error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: res.message
      })
      return
    }
    const userData = res.data
    // Mifflin-St Jeor equation
    let bmr =
      10 * Number(userData.user?.weight) +
      6.25 * Number(userData.user?.height) -
      5 *
        Number(
          differenceInYears(
            new Date(),
            new Date(userData.user?.dateOfBirth || 0)
          )
        )
    if (userData.user?.sex === 'M') {
      bmr += 5
    } else {
      bmr -= 161
    }

    // Activity level multipliers
    const activityMultipliers = {
      bmr: 1, // Basal Metabolic Rate
      sedentary: 1.2, // Little or no exercise
      lightly_active: 1.375, // Light exercise 1-3 days/week
      moderately_active: 1.465, // Moderate exercise 4-5 days/week
      active: 1.55, // Daily exercise or intense exercise 3-4 days/week
      very_active: 1.725, // Intense exercise 6-7 days/week
      extra_active: 1.9 // Very intense exercise daily, or physical job
    }

    const tdee = Math.round(
      bmr * (activityMultipliers[userData.user?.activityLevel || 'bmr'] || 1)
    )
    setCalories(tdee.toString())
    setDisplayCalories(tdee.toString())
    setCarbs((tdee * 0.5).toString())
    setProteins((tdee * 0.3).toString())
    setFats((tdee * 0.2).toString())
  }
  if (isLoading) {
    return <Text>Loading...</Text>
  }
  return (
    <SafeAreaView className="flex flex-col">
      <Stack.Screen
        options={{
          headerRight(props) {
            return (
              <Pressable
                className={'self-start p-2'}
                onPress={() => {
                  router.back()
                }}
              >
                <Text className={'font-bold'}>Save</Text>
              </Pressable>
            )
          }
        }}
      />
      <ScrollView
        className="flex flex-col flex-shrink basis-11/12 py-4"
        keyboardDismissMode="on-drag"
      >
        <View
          className={
            'mx-4 flex flex-col rounded-lg overflow-hidden gap-1 items-center justify-start h-48 relative'
          }
        >
          <ProgressCircle //Fats
            radius={70}
            strokeWidth={20}
            progress={Number(calories) / Number(calories)}
            color={data[2]?.color || '#FF6347'}
            maxValue={Number(calories)}
            zIndex={10}
          />
          <ProgressCircle //Proteins
            radius={70}
            strokeWidth={20}
            progress={
              (Number(data[0]?.value) + Number(data[1]?.value)) /
              Number(calories)
            }
            color={data[1]?.color || '#FF4500'}
            maxValue={Number(calories)}
            zIndex={20}
          />
          <ProgressCircle //Carbs
            radius={70}
            strokeWidth={20}
            progress={Number(data[0]?.value) / Number(calories)}
            color={data[0]?.color || '#FFD700'}
            maxValue={Number(calories)}
            zIndex={30}
          />
        </View>
        <View
          className={
            'mx-4 bg-white flex flex-col rounded-lg overflow-hidden gap-1'
          }
        >
          <View className="flex flex-row justify-between items-center px-6 py-4 rounded-lg">
            <Text className={'font-display-medium text-lg'}>Calories</Text>
            <View className="flex flex-row items-center gap-2">
              <TextInput
                className="font-display-medium text-lg border-b-2 border-gray-300 pb-2 w-20 text-center rounded border-solid"
                keyboardType="numeric"
                value={displayCalories}
                onChangeText={(text) => calorieChangeValue(text)}
              />
              <Text className={'font-display text-lg text-gray-500'}>kcal</Text>
            </View>
          </View>
          {data.map((item) => (
            <View key={item.label}>
              <Border />
              <View className="flex flex-col">
                <View className="flex flex-row justify-between items-center px-6 py-4 rounded-lg">
                  <Text className={'font-display-medium text-lg'}>
                    {item.label}
                  </Text>
                  <View className="flex flex-row items-center gap-2">
                    <Text className={'font-display text-lg text-gray-500'}>
                      {(Number(item.value) / item.factor).toFixed(0)} g
                    </Text>
                    <Text className={'font-display text-lg text-gray-500'}>
                      {((Number(item.value) / Number(calories)) * 100).toFixed(
                        0
                      )}
                      %
                    </Text>
                    <Text className={'font-display text-lg text-gray-500'}>
                      {Number(item.value).toFixed(0)} kcal
                    </Text>
                  </View>
                </View>
                <Slider
                  minimumTrackTintColor={item.color}
                  className="mx-8 mb-2"
                  onValueChange={(value) => {
                    sliderChangeValue(
                      value,
                      item.label as 'Carbs' | 'Proteins' | 'Fats'
                    )
                  }}
                  value={Number(
                    ((Number(item.value) / Number(calories)) * 100).toFixed(0)
                  )}
                  step={5}
                  maximumValue={100}
                />
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
      <View className="flex-grow basis-1/12 flex flex-row w-screen">
        <Pressable
          className={
            'bg-primary rounded-lg p-2 my-2 mx-4 flex flex-row items-center justify-center bg-red-600 basis-1/2 flex-shrink'
          }
          onPress={() => resetDefaults()}
        >
          <Text className={'font-display-medium text-lg text-white'}>
            Reset to Defaults
          </Text>
        </Pressable>
        <Pressable
          className={
            'bg-primary rounded-lg p-2 my-2 mx-4 flex flex-row items-center justify-center bg-green-600 basis-1/2 flex-shrink'
          }
          onPress={() => {
            savePreferences()
          }}
        >
          <Text className={'font-display-medium text-lg text-white'}>
            Save Preferences
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  )
}
const Border = () => <View className="h-0.5 rounded-full bg-gray-100" />
