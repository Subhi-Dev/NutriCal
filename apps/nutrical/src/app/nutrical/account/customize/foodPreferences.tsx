import { router } from 'expo-router'
import { Circle, CircleCheck } from 'lucide-react-native'
import { useEffect, useMemo, useState } from 'react'
import {
  View,
  Text,
  Pressable,
  Switch,
  ScrollView,
  SafeAreaView
} from 'react-native'
import Toast from 'react-native-toast-message'
import useSWR from 'swr'

import type { GetUserTagsReturn, PutUserTagsReturn } from '@backend/types'

import useClient from '~/components/network/client'

export default function FoodPreferences() {
  const client = useClient()
  const [foodPreferences, setFoodPreferences] = useState<
    'None' | 'Vegetarian' | 'Vegan' | 'Pescetarian'
  >('None')
  const [allergies, setAllergies] = useState<
    (
      | 'Gluten Intolerant'
      | 'Wheat Intolerant'
      | 'Lactose Intolerant'
      | 'Allergic to Milk'
      | 'Allergic to Egg'
      | 'Allergic to Shellfish'
      | 'Allergic to Fish'
      | 'Allergic to Nuts'
    )[]
  >([])
  function handleAllergy(
    allergy: (typeof allergies)[number] | 'None',
    remove: boolean
  ) {
    if (allergy === 'None') {
      setAllergies([])
    } else if (remove) {
      setAllergies(allergies.filter((a) => a !== allergy))
    } else {
      setAllergies([...allergies, allergy])
    }
  }

  function resetDefaults() {
    setFoodPreferences('None')
    setAllergies([])
  }

  const tagMapping = useMemo(
    () => [
      { id: 1000, name: 'Vegetarian' },
      { id: 1001, name: 'Vegan' },
      { id: 1002, name: 'Pescetarian' },
      { id: 1003, name: 'Gluten Intolerant' },
      { id: 1004, name: 'Wheat Intolerant' },
      { id: 1005, name: 'Lactose Intolerant' },
      { id: 1006, name: 'Allergic to Milk' },
      { id: 1007, name: 'Allergic to Egg' },
      { id: 1008, name: 'Allergic to Shellfish' },
      { id: 1009, name: 'Allergic to Fish' },
      { id: 1010, name: 'Allergic to Nuts' }
    ],
    []
  )

  const { data: userTagData, mutate } = useSWR<
    { error: false; data: GetUserTagsReturn } | { error: true; message: string }
  >('users/tags')
  useEffect(() => {
    if (userTagData?.error) {
      Toast.show({ type: 'error', text1: 'Error', text2: userTagData.message })
    }
  }, [userTagData])
  const tags = userTagData?.error ? undefined : userTagData?.data

  // Set daysPassed and referenceDay once when programs changes
  useEffect(() => {
    if (tags) {
      const tagIds = tags.map((tag) => tag.tagId)
      const preferences = ['Vegetarian', 'Vegan', 'Pescetarian']
      const foundPreference = tagMapping
        .filter((tag) => tagIds.includes(tag.id))
        .find((tag) => preferences.includes(tag.name))
      setFoodPreferences(
        foundPreference
          ? (foundPreference.name as typeof foodPreferences)
          : 'None'
      )

      const allergyTags = tagMapping
        .filter(
          (tag) => tagIds.includes(tag.id) && !preferences.includes(tag.name)
        )
        .map((tag) => tag.name) as typeof allergies
      setAllergies(allergyTags)
    }
  }, [tags, tagMapping])

  async function handleSave() {
    const selectedTagIds = [
      ...allergies.map(
        (allergy) => tagMapping.find((tag) => tag.name === allergy)?.id
      ),
      ...(foodPreferences !== 'None'
        ? [tagMapping.find((tag) => tag.name === foodPreferences)?.id]
        : [])
    ].filter((id): id is number => id !== undefined)

    try {
      const res = await client
        .put<
          | { error: false; data: PutUserTagsReturn }
          | { error: true; message: string }
        >('users/tags', {
          json: {
            ids: selectedTagIds
          }
        })
        .json()

      if (res.error) {
        Toast.show({ type: 'error', text1: res.message })
        return
      }
      Toast.show({ type: 'success', text1: 'Preferences Saved' })
      mutate()
      router.back()
    } catch (e) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: JSON.stringify(e) || 'An error occurred'
      })
    }
  }
  return (
    <SafeAreaView className="flex-1 bg-white" edges={['bottom', 'left', 'right']}>
      <View className="flex-1">
        <ScrollView
          className="flex-1 py-4"
          contentContainerStyle={{ paddingBottom: 20 }}
        >
          <Text
            className={
              'font-display-medium text-xl text-gray-600 px-4 mt-4 mb-1'
            }
          >
            Food Preferences
          </Text>
          <View
            className={
              'mx-4 bg-white flex flex-col rounded-lg overflow-hidden gap-1'
            }
          >
          {(['None', 'Vegetarian', 'Vegan', 'Pescetarian'] as const).map(
            (preference) => (
              <Pressable
                key={preference}
                onPress={() => {
                  setFoodPreferences(preference)
                }}
              >
                <View
                  className={
                    'flex flex-row justify-between items-center px-6 py-4 rounded-lg'
                  }
                >
                  <Text className={'font-display-medium text-lg'}>
                    {preference}
                  </Text>
                  {foodPreferences === preference ? (
                    <CircleCheck />
                  ) : (
                    <Circle />
                  )}
                </View>
                {preference !== 'Pescetarian' && <Border />}
              </Pressable>
            )
          )}
        </View>
        <Text
          className={'font-display-medium text-xl text-gray-600 px-4 mt-4 mb-1'}
        >
          Allergies
        </Text>
        <View
          className={
            'mx-4 bg-white flex flex-col rounded-lg overflow-hidden gap-1'
          }
        >
          {(
            [
              'None',
              'Gluten Intolerant',
              'Wheat Intolerant',
              'Lactose Intolerant',
              'Allergic to Milk',
              'Allergic to Egg',
              'Allergic to Shellfish',
              'Allergic to Fish',
              'Allergic to Nuts'
            ] as const
          ).map((allergy) => (
            <View key={allergy}>
              <View
                className={
                  'flex flex-row justify-between items-center px-6 pr-10 py-4 rounded-lg'
                }
              >
                <Text className={'font-display-medium text-lg'}>{allergy}</Text>
                <Switch
                  onValueChange={(value) => {
                    handleAllergy(allergy, !value)
                  }}
                  value={
                    allergy === 'None'
                      ? allergies.length === 0
                      : allergies.includes(allergy)
                  }
                />
              </View>
              {allergy !== 'Allergic to Nuts' && <Border />}
            </View>
          ))}
          </View>
        </ScrollView>
        <View className="flex-row p-4 gap-4 bg-white border-t border-gray-100">
          <Pressable
            className={
              'bg-red-600 rounded-lg p-3 flex-1 flex-row items-center justify-center'
            }
            onPress={() => resetDefaults()}
          >
            <Text className={'font-display-medium text-lg text-white'}>
              Reset to Defaults
            </Text>
          </Pressable>
          <Pressable
            className={
              'bg-green-600 rounded-lg p-3 flex-1 flex-row items-center justify-center'
            }
            onPress={() => {
              handleSave()
            }}
          >
            <Text className={'font-display-medium text-lg text-white'}>
              Save Preferences
            </Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  )
}
const Border = () => (
  <View className="h-0.5 w-full rounded-full ml-4 bg-gray-100" />
)
