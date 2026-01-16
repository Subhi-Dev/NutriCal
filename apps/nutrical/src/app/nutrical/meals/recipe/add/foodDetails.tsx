import { Image } from 'expo-image'
import { router, useLocalSearchParams } from 'expo-router'
import { ChevronDown, Clock, Flame, Utensils, Users } from 'lucide-react-native'
import { useEffect, useState } from 'react'
import {
  ScrollView,
  View,
  Text,
  Pressable,
  TextInput,
  ActivityIndicator
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Toast from 'react-native-toast-message'
import useSWR from 'swr'
import * as DropdownMenu from 'zeego/dropdown-menu'

import type {
  GetFoodById as OriginalGetFoodById,
  PostTrackFood
} from '@backend/types'

// Extend GetFoodById to include baseAmountGrams if it's missing in the backend type
type GetFoodById = OriginalGetFoodById & {
  baseAmountGrams?: number
}

import ProgressBar from '~/components/ui/ProgressBar'
import useClient from '~/components/network/client'

function Border() {
  return <View className={'my-1 h-0.5 bg-gray-100 rounded-full'}></View>
}

const NutritionDetailRow = ({
  label,
  value,
  unit
}: {
  label: string
  value?: string | null
  unit: string
}) => {
  if (!value) return null
  return (
    <View className="flex-row justify-between items-center py-2">
      <Text className="text-base font-display-medium text-gray-700">
        {label}
      </Text>
      <Text className="text-base font-display-bold text-gray-800">
        {Number(value).toFixed(1)} {unit}
      </Text>
    </View>
  )
}

function NutritionDetailSubRow(props: {
  label: string
  value?: string | null
  unit: string
}) {
  if (!props.value) return null
  return (
    <View className="flex flex-row justify-between items-center my-0.5">
      <Text className="text-base font-display text-gray-700 ml-4">
        {props.label}
      </Text>
      <Text className="text-base font-display-bold text-gray-800 text-right">
        {Number(props.value).toFixed(1)} {props.unit}
      </Text>
    </View>
  )
}

type Unit = {
  id: number | string
  name: string
  gramsEquivalent: number
}

const GRAMS_UNIT: Unit = {
  id: 'grams',
  name: 'grams',
  gramsEquivalent: 1
}

export default function FoodDetails() {
  const {
    foodId,
    meal: initialMeal,
    selectedDay,
    programId
  } = useLocalSearchParams<{
    foodId?: string
    meal?: string
    selectedDay?: string
    programId?: string
  }>()

  const [food, setFood] = useState<GetFoodById | null>(null)
  const { mutate } = useSWR('programs')
  const api = useClient()
  const [amount, setAmount] = useState('1')
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null)
  const [selectedMeal, setSelectedMeal] = useState(initialMeal || 'breakfast')
  const [calculatedNutrition, setCalculatedNutrition] =
    useState<Partial<GetFoodById> | null>(null)

  const meals = ['breakfast', 'lunch', 'dinner', 'snack']
  const { data: foodData, isLoading } = useSWR<
    { error: false; data: GetFoodById } | { error: true; message: string }
  >(`foods/${foodId}`)

  useEffect(() => {
    if (foodData?.error) {
      Toast.show({ type: 'error', text1: 'Error', text2: foodData.message })
    } else if (foodData?.data) {
      setFood(foodData.data)
      const firstUnit = foodData.data.units[0]
      if (firstUnit) {
        setSelectedUnit({
          id: firstUnit.id,
          name: firstUnit.name,
          gramsEquivalent: Number(firstUnit.gramsEquivalent) || 1
        })
      } else {
        setSelectedUnit(GRAMS_UNIT)
      }
    }
  }, [foodData])

  useEffect(() => {
    if (!food || !selectedUnit) {
      setCalculatedNutrition(null)
      return
    }

    const numericAmount = parseFloat(amount)
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setCalculatedNutrition(food) // Show base nutrition if amount is invalid
      return
    }

    const totalGrams = numericAmount * selectedUnit.gramsEquivalent
    const multiplier = totalGrams / (food.baseAmountGrams || 100)

    const newNutrition: Partial<GetFoodById> = {}
    const nutritionKeys = [
      'calories',
      'carbohydrates',
      'proteins',
      'fats',
      'simpleSugars',
      'fiber',
      'saturatedFats',
      'unsaturatedFats',
      'cholesterol',
      'sodium',
      'potassium'
    ] as (keyof GetFoodById)[]

    for (const key of nutritionKeys) {
      const baseValue = food[key]
      if (!baseValue) {
        newNutrition[key] = null
      } else {
        newNutrition[key] = Number(baseValue) * multiplier
      }
    }

    // Merge calculated nutrition with the original food object
    setCalculatedNutrition({ ...food, ...newNutrition })
  }, [amount, selectedUnit, food])

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator
          size="large"
          color="#16A34A"
        />
      </SafeAreaView>
    )
  }
  if (!food) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-gray-50">
        <Text className="text-lg font-display text-gray-700">
          Food not found
        </Text>
      </SafeAreaView>
    )
  }

  const handleUnitChange = (newUnit: Unit) => {
    if (selectedUnit && newUnit.id !== selectedUnit.id) {
      const currentAmount = parseFloat(amount)
      if (!isNaN(currentAmount)) {
        const currentGrams = currentAmount * selectedUnit.gramsEquivalent
        const newAmount = currentGrams / newUnit.gramsEquivalent
        setAmount(newAmount.toFixed(2).replace(/\.00$/, ''))
      }
    }
    setSelectedUnit(newUnit)
  }

  const nutritionData = calculatedNutrition || food

  return (
    <ScrollView
      className="flex-1 bg-gray-50"
      contentContainerStyle={{ flexGrow: 1 }}
    >
      {food.photoUrl && (
        <View className="-mt-20">
          <Image
            source={{ uri: food.photoUrl }}
            className="w-full h-64"
          />
        </View>
      )}

      <View className="p-4">
        <Text className="text-3xl font-display-bold text-gray-900">
          {food.name}
        </Text>
        <View className="mt-2 p-2 rounded-lg flex-row items-center">
          <Image
            source={{ uri: food.source?.logoImageUrl || '' }}
            className="w-8 h-8 rounded-lg"
            contentFit="contain"
          />
          <Text className="font-display-medium text-gray-600 ml-2">
            {food.source?.name}
          </Text>
        </View>
        {food.notes && (
          <Text className="text-base font-display text-gray-600 mt-1">
            {food.notes}
          </Text>
        )}
        <View className="mt-2 p-4 bg-white rounded-lg border border-gray-200">
          <View className="flex-row items-center justify-between">
            <View className="flex-1">
              <Text className="text-sm font-display-medium text-gray-600 mb-1">
                Amount
              </Text>
              <TextInput
                className="bg-gray-100 border border-gray-300 rounded-lg p-3 h-12 font-display text-base text-gray-900"
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
                returnKeyType="done"
              />
            </View>
            <View className="w-4" />
            <View className="flex-1">
              <Text className="text-sm font-display-medium text-gray-600 mb-1">
                Unit
              </Text>
              <DropdownMenu.Root>
                <DropdownMenu.Trigger>
                  <View className="bg-gray-100 border border-gray-300 rounded-lg p-3 h-12 flex-row justify-between items-center">
                    <Text className="font-display text-base text-gray-900 capitalize">
                      {selectedUnit?.name || 'Select Unit'}
                    </Text>
                    <ChevronDown
                      size={20}
                      color="#6B7280"
                    />
                  </View>
                </DropdownMenu.Trigger>
                <DropdownMenu.Content>
                  {[...food.units, GRAMS_UNIT].map((unit) => (
                    <DropdownMenu.Item
                      key={String(unit.id)}
                      onSelect={() => handleUnitChange(unit)}
                    >
                      <DropdownMenu.ItemTitle>
                        {unit.name.charAt(0).toUpperCase() + unit.name.slice(1)}
                      </DropdownMenu.ItemTitle>
                    </DropdownMenu.Item>
                  ))}
                </DropdownMenu.Content>
              </DropdownMenu.Root>
            </View>
          </View>
          <View className="mt-4">
            <Text className="text-sm font-display-medium text-gray-600 mb-1">
              Add to
            </Text>
            <DropdownMenu.Root>
              <DropdownMenu.Trigger>
                <View className="bg-gray-100 border border-gray-300 rounded-lg p-3 h-12 flex-row justify-between items-center">
                  <Text className="font-display text-base text-gray-900 capitalize">
                    {selectedMeal}
                  </Text>
                  <ChevronDown
                    size={20}
                    color="#6B7280"
                  />
                </View>
              </DropdownMenu.Trigger>
              <DropdownMenu.Content>
                {meals.map((meal) => (
                  <DropdownMenu.Item
                    key={meal}
                    onSelect={() => setSelectedMeal(meal)}
                  >
                    <DropdownMenu.ItemTitle>
                      {meal.charAt(0).toUpperCase() + meal.slice(1)}
                    </DropdownMenu.ItemTitle>
                  </DropdownMenu.Item>
                ))}
              </DropdownMenu.Content>
            </DropdownMenu.Root>
          </View>
        </View>

        <View className="flex-row justify-around mt-4 p-4 bg-white rounded-lg border border-gray-200">
          {food.cookingTime && (
            <View className="items-center">
              <Clock
                size={24}
                color="#1F2937"
              />
              <Text className="text-sm font-display-medium text-gray-700 mt-1">
                {food.cookingTime} min
              </Text>
            </View>
          )}
          {food.servings && (
            <View className="items-center">
              <Users
                size={24}
                color="#1F2937"
              />
              <Text className="text-sm font-display-medium text-gray-700 mt-1">
                {food.servings} Servings
              </Text>
            </View>
          )}
          {nutritionData.calories && (
            <View className="items-center">
              <Flame
                size={24}
                color="#1F2937"
              />
              <Text className="text-sm font-display-medium text-gray-700 mt-1">
                {Number(nutritionData.calories).toFixed(0)} kcal
              </Text>
            </View>
          )}
        </View>

        <View className="mt-4 p-4 bg-white rounded-lg border border-gray-200">
          <Text className="text-xl font-display-semibold text-gray-800 mb-2">
            Nutrition Facts
          </Text>
          <View className="flex flex-row p-4 gap-4">
            <View className="flex-1 flex-col items-center">
              <Text className="text-md font-display-medium text-gray-700">
                Carbs
              </Text>
              <ProgressBar
                color="#3B82F6"
                value={Number(nutritionData.carbohydrates) || 0}
                limit={226}
              />
              <Text className="text-sm font-display text-gray-600">
                {(Number(nutritionData.carbohydrates) || 0).toFixed(1)} g
              </Text>
            </View>
            <View className="flex-1 flex-col items-center">
              <Text className="text-md font-display-medium text-gray-700">
                Protein
              </Text>
              <ProgressBar
                color="#EF4444"
                value={Number(nutritionData.proteins) || 0}
                limit={90}
              />
              <Text className="text-sm font-display text-gray-600">
                {(Number(nutritionData.proteins) || 0).toFixed(1)} g
              </Text>
            </View>
            <View className="flex-1 flex-col items-center">
              <Text className="text-md font-display-medium text-gray-700">
                Fat
              </Text>
              <ProgressBar
                color="#F59E0B"
                value={Number(nutritionData.fats) || 0}
                limit={60}
              />
              <Text className="text-sm font-display text-gray-600">
                {(Number(nutritionData.fats) || 0).toFixed(1)} g
              </Text>
            </View>
          </View>
        </View>

        {food.type === 'recipe' && (
          <>
            <View className="mt-4 p-4 bg-white rounded-lg border border-gray-200">
              <Text className="text-xl font-display-semibold text-gray-800 mb-2">
                Ingredients
              </Text>
              {food.recipeIngredients.map((ingredient) => (
                <Text
                  key={ingredient.id}
                  className="text-base font-display text-gray-700 mb-1"
                >
                  • {ingredient.ingredientText}
                </Text>
              ))}
            </View>

            <View className="mt-4 p-4 bg-white rounded-lg border border-gray-200">
              <Text className="text-xl font-display-semibold text-gray-800 mb-2">
                Instructions
              </Text>
              {food.recipeSteps.map((step, index) => (
                <View
                  key={step.id}
                  className="flex-row mb-2"
                >
                  <Text className="text-base font-display-semibold text-gray-800 mr-2">
                    {index + 1}.
                  </Text>
                  <Text className="text-base font-display text-gray-700 flex-1">
                    {step.stepText}
                  </Text>
                </View>
              ))}
            </View>
          </>
        )}

        <View className="mt-4 p-4 bg-white rounded-lg border border-gray-200">
          <Text className="text-xl font-display-semibold text-gray-800 mb-2">
            Detailed Nutrition
          </Text>
          <NutritionDetailRow
            label="Calories"
            value={nutritionData.calories?.toString()}
            unit="kcal"
          />
          <Border />
          <NutritionDetailRow
            label="Carbohydrates"
            value={nutritionData.carbohydrates?.toString()}
            unit="g"
          />
          <NutritionDetailSubRow
            label="Simple Sugars"
            value={nutritionData.simpleSugars?.toString()}
            unit="g"
          />
          <NutritionDetailSubRow
            label="Fiber"
            value={nutritionData.fiber?.toString()}
            unit="g"
          />
          <Border />
          <NutritionDetailRow
            label="Proteins"
            value={nutritionData.proteins?.toString()}
            unit="g"
          />
          <Border />
          <NutritionDetailRow
            label="Fats"
            value={nutritionData.fats?.toString()}
            unit="g"
          />
          <NutritionDetailRow
            label="Saturated Fats"
            value={nutritionData.saturatedFats?.toString()}
            unit="g"
          />
          <NutritionDetailRow
            label="Unsaturated Fats"
            value={nutritionData.unsaturatedFats?.toString()}
            unit="g"
          />
          <Border />
          <NutritionDetailRow
            label="Cholesterol"
            value={nutritionData.cholesterol?.toString()}
            unit="mg"
          />
          <NutritionDetailRow
            label="Sodium"
            value={nutritionData.sodium?.toString()}
            unit="mg"
          />
          <NutritionDetailRow
            label="Potassium"
            value={nutritionData.potassium?.toString()}
            unit="mg"
          />
        </View>
      </View>
      <View className="p-4">
        <Pressable
          className="bg-emerald-500 py-3 rounded-lg flex-row justify-center items-center"
          onPress={() => {
            // Handle Add to meal logic here
            api.post<
              | { error: true; message: string }
              | { error: false; data: PostTrackFood }
            >('foods/track', {
              json: {
                dayIndex: Number(selectedDay),
                mealName: selectedMeal.toLocaleLowerCase(),
                programId: Number(programId),
                foodId: food.id,
                amount: Number(amount),
                unitId: selectedUnit?.id
              }
            })
            console.log({
              foodId: food.id,
              amount: Number(amount),
              unit: selectedUnit?.id === 'grams' ? null : selectedUnit?.name,
              meal: selectedMeal,
              programId,
              selectedDay
            })
            mutate()
            router.back()
          }}
        >
          <Utensils
            size={20}
            color="white"
          />
          <Text className="text-white font-display-semibold text-lg ml-2">
            Add to Meal
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  )
}
