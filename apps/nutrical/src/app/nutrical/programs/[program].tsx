import { Image } from 'expo-image'
import { router, useLocalSearchParams } from 'expo-router'
import { useEffect, useState } from 'react'
import { ScrollView, View, Text, Pressable, FlatList } from 'react-native'
import Toast from 'react-native-toast-message'
import useSWR, { mutate } from 'swr'

import type { CreateProgramReturn, ProgramTemplate } from '@backend/types'

import useClient from '~/components/network/client'
import PreviewMealSection from '~/components/programs/PreviewMealSection'
import { ChevronLeft, TriangleAlert } from 'lucide-react-native'

export default function Meal() {
  const { program } = useLocalSearchParams()
  const [daysPassed, setDaysPassed] = useState(1)
  const client = useClient()
  const { data: programData } = useSWR<
    { error: false; data: ProgramTemplate } | { error: true; message: string }
  >(`programs/templates/${program}`)

  useEffect(() => {
    if (programData?.error) {
      Toast.show({ type: 'error', text1: 'Error', text2: programData.message })
    }
  }, [programData])
  const programs = programData?.error ? undefined : programData?.data

  return (
    <View className="">
      <Pressable
        className="z-10 p-4"
        onPress={() => router.back()}
      >
        <ChevronLeft />
      </Pressable>
      <View
        style={{ backgroundColor: programs?.startColor || '#c0c0c0' }}
        className="h-96 overflow-hidden absolute top-0 left-0 w-screen"
      >
        <Image
          source={programs?.featuredImageUrl}
          contentPosition={'right'}
          contentFit="contain"
          className="w-full h-[400px]"
        />
      </View>
      <ScrollView className="w-screen flex flex-col">
        <View className="flex flex-col justify-center items-center w-screen py-8">
          <Text
            style={{ color: programs?.contentColor || '#FFF' }}
            className="text-lg font-display text-center mx-4 mb-2 "
          >
            {programs?.programTemplateTags[0]?.tag.name.toUpperCase()}
          </Text>
          <Text
            style={{ color: programs?.contentColor || '#FFF' }}
            className="text-3xl font-display-medium text-center mx-4 mb-8"
          >
            {programs?.name}
          </Text>
          <Pressable
            className=" border border-white rounded-full py-2 px-12 mb-10 bg-white"
            onPress={async () => {
              try {
                const res = await client
                  .post<
                    | { error: false; data: CreateProgramReturn }
                    | { error: true; message: string }
                  >('programs/fromTemplate', {
                    json: {
                      programTemplateId: Number(program)
                    }
                  })
                  .json()

                if (res.error) {
                  Toast.show({ type: 'error', text1: res.message })
                  return
                }
                Toast.show({ type: 'success', text1: 'Program Started' })
                mutate('programs')
                router.navigate('/nutrical/meals')
              } catch (e) {
                Toast.show({
                  type: 'error',
                  text1: 'Error',
                  text2: JSON.stringify(e) || 'An error occurred'
                })
              }
            }}
          >
            <Text
              style={{ color: programs?.startColor || '#fff' }}
              className="font-display text-center text-lg"
            >
              START PLAN
            </Text>
          </Pressable>
        </View>
        <View className="flex flex-col bg-gray-100 py-5 items-center justify-center">
          <Text className="text-lg font-display mb-2 mt-4 mx-20">
            {programs?.description}
          </Text>
          <View className={'mx-4 my-3 w-72 h-0.5 bg-gray-300 rounded-full'} />

          <Text className="text-2xl font-display-medium mt-4 mx-20">
            Preview
          </Text>
          <FlatList
            className={'flex flex-row p-1 bg-white m-4 rounded-lg'}
            contentContainerStyle={{
              justifyContent: 'space-evenly',
              flex: 1
            }}
            horizontal
            data={[1, 2, 3, 4, 5, 6, 7]}
            scrollEnabled={false}
            renderItem={({ item }) =>
              item === daysPassed ? (
                <View
                  className={
                    'flex flex-col bg-emerald-500 rounded-3xl pt-3 pb-2 items-center px-2'
                  }
                >
                  <Text
                    allowFontScaling={false}
                    className={'text-white font-display-bold mb-0.5'}
                  >
                    Day
                  </Text>
                  <View className={'bg-white rounded-full w-8 p-1'}>
                    <Text
                      allowFontScaling={false}
                      className={'font-display-bold text-center'}
                    >
                      {item}
                    </Text>
                  </View>
                </View>
              ) : (
                <Pressable
                  className={
                    'flex flex-col rounded-3xl pt-3 pb-2 items-center px-2'
                  }
                  onPress={() => {
                    setDaysPassed(item)
                  }}
                >
                  <Text
                    allowFontScaling={false}
                    className={'text-black font-display-bold mb-0.5'}
                  >
                    Day
                  </Text>
                  <View className={' rounded-full p-1 w-8'}>
                    <Text
                      allowFontScaling={false}
                      className={'font-display-bold text-center'}
                    >
                      {item}
                    </Text>
                  </View>
                </Pressable>
              )
            }
            extraData={daysPassed}
          />
          <View className="flex flex-col px-4 rounded-lg w-full overflow-hidden">
            <PreviewMealSection
              selectedDay={daysPassed}
              program={programs}
              title={'Breakfast'}
            />
            <PreviewMealSection
              selectedDay={daysPassed}
              program={programs}
              title={'Lunch'}
            />
            <PreviewMealSection
              selectedDay={daysPassed}
              program={programs}
              title={'Dinner'}
            />
            <PreviewMealSection
              selectedDay={daysPassed}
              program={programs}
              title={'Snack'}
            />
            <PreviewMealSection
              selectedDay={daysPassed}
              program={programs}
              title={'Functional Food'}
            />
          </View>
          <View className={'mx-4 my-3 w-72 h-0.5 bg-gray-300 rounded-full'} />

          <View className="flex flex-col items-center gap-4 w-64 mx-20 mt-4">
            <TriangleAlert color={'red'} />
            <Text className="font-display text-gray-400 text-center mb-20">
              {programs?.warningText}
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  )
}
