import MaterialIcons from '@expo/vector-icons/MaterialIcons'
import { FlashList } from '@shopify/flash-list'
import { Link } from 'expo-router'
import React, { useMemo } from 'react'
import { View, Text, Pressable } from 'react-native'

import MealComponent from './MealComponent'

import type { UserPrograms } from '@backend/types'
import { Plus } from 'lucide-react-native'

export default function MealSection(props: {
  program: UserPrograms[number] | undefined
  selectedDay: number
  title: string
}) {
  const mealData = useMemo(() => {
    const mealName =
      props.title === 'Breakfast'
        ? 'breakfast'
        : props.title === 'Dinner'
          ? 'dinner'
          : props.title === 'Lunch'
            ? 'lunch'
            : props.title === 'Snack'
              ? 'snack'
              : 'functional_food'
    const mealDefault: {
      meals: UserPrograms[number]['programFoods']
      sums: { cal: number; carb: number; protein: number; fat: number }
    } = {
      meals: [],
      sums: { cal: 0, carb: 0, protein: 0, fat: 0 }
    }
    if (!props.program) return mealDefault
    const tempMeal = mealDefault

    props.program?.programFoods.forEach((element) => {
      if (
        element.mealName === mealName &&
        element.dayIndex === props.selectedDay
      ) {
        tempMeal.meals.push(element)
        console.log(tempMeal.meals)
        if (element.food?.type === 'component') {
          tempMeal.sums.cal +=
            (parseInt(element.food.calories || '0.01') *
              parseFloat(element.amount || '0.01')) /
            100
          tempMeal.sums.carb +=
            (parseInt(element.food.carbohydrates || '0.01') *
              parseFloat(element.amount || '0.01')) /
            100
          tempMeal.sums.protein +=
            (parseInt(element.food.proteins || '0.01') *
              parseFloat(element.amount || '0.01')) /
            100
          tempMeal.sums.fat +=
            (parseInt(element.food.fats || '0.01') *
              parseFloat(element.amount || '0.01')) /
            100
        } else {
          element.food?.recipeFoodComponents.forEach((ingredient) => {
            tempMeal.sums.cal +=
              (parseInt(ingredient.component?.calories || '0.01') *
                parseFloat(ingredient.weightInGrams || '0.01')) /
              100
            tempMeal.sums.carb +=
              (parseInt(ingredient.component?.carbohydrates || '0.01') *
                parseFloat(ingredient.weightInGrams || '0.01')) /
              100
            tempMeal.sums.protein +=
              (parseInt(ingredient.component?.proteins || '0.01') *
                parseFloat(ingredient.weightInGrams || '0.01')) /
              100
            tempMeal.sums.fat +=
              (parseInt(ingredient.component?.fats || '0.01') *
                parseFloat(ingredient.weightInGrams || '0.01')) /
              100
          })
        }
      }
    })
    return tempMeal
  }, [props.program, props.title, props.selectedDay])
  if (!props.program) {
    return <View></View>
  }
  return (
    <View>
      <View className={'flex flex-col bg-white rounded-lg p-3 my-2'}>
        <View className={'flex flex-row items-center justify-between'}>
          <View className={'flex flex-row items-center'}>
            <MaterialIcons
              name={
                props.title === 'Breakfast'
                  ? 'breakfast-dining'
                  : props.title === 'Dinner'
                    ? 'dinner-dining'
                    : props.title === 'Lunch'
                      ? 'free-breakfast'
                      : props.title === 'Snack'
                        ? 'bakery-dining'
                        : 'bakery-dining'
              }
              size={36}
              color={'#16a34a'}
            />
            <View
              className={
                'flex-col flex ml-2 items-start justify-center self-start'
              }
            >
              <Text className={'font-display-medium text-lg mb-1'}>
                {props.title}
              </Text>
              <Text className={'font-display text-gray-600 mb-1'}>
                {mealData.sums.cal.toFixed(1) + ' kcal'}
              </Text>
            </View>
          </View>
          <Link
            asChild
            href={{
              pathname: '/nutrical/meals/recipe/add',
              params: {
                meal: props.title,
                selectedDay: props.selectedDay,
                programId: props.program.id
              }
            }}
          >
            <Pressable className={' rounded-full bg-teal-300 p-1 mr-2'}>
              <Plus />
            </Pressable>
          </Link>
        </View>
        <FlashList
          estimatedItemSize={69}
          data={mealData.meals}
          renderItem={({ item }) => <MealComponent recipe={item.food} />}
        />
      </View>
    </View>
  )
}
