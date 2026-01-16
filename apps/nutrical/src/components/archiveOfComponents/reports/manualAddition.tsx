import AsyncStorage from '@react-native-async-storage/async-storage'
import dayjs from 'dayjs'
import { getNetworkStateAsync } from 'expo-network'
import { router } from 'expo-router'
import * as SecureStore from 'expo-secure-store'
import { useEffect, useState } from 'react'
import { Pressable, Text, TextInput, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Toast from 'react-native-toast-message'

export default function ManualAddition() {
  const [height, setHeight] = useState('')
  const [weight, setWeight] = useState('')
  const [age, setAge] = useState('')
  const [sex, setSex] = useState()
  const [accountInfo, setAccountInfo] = useState()
  const [disableAction, setDisableAction] = useState(false)

  let userData
  const storeData = async (key, value) => {
    try {
      await AsyncStorage.setItem(key, value)
    } catch (e) {
      console.log('Error caching scale data: ' + e)
      // saving error
    }
  }
  const getData = async (key) => {
    try {
      return await AsyncStorage.getItem(key)
    } catch (e) {
      console.log('Error retrieving scale data: ')
      captureException(e)

      // error reading value
    }
  }
  async function getValueFor(key) {
    return await SecureStore.getItemAsync(key)
  }
  const getAccountInfo = async () => {
    console.log('Account Info Hit')
    userData = JSON.parse(await getValueFor('userData'))
    try {
      // const response = await FetchAndCacheLegacy(
      //   'getAccountInfo',
      //     userData['ID'] +
      //     '&Token=' +
      //     userData['Token'],
      //   'GET'
      // )
      // const data = JSON.parse(await response.data)
      // if (data) {
      //   setAccountInfo(data)
      // }
    } catch (err) {
      console.log('Unknown Error (Account Fetch)')
      captureException(err)
    }
  }
  useEffect(() => {
    async function getCachedHeight() {
      const cachedHeight = await getData('scaleHeight')
      if (cachedHeight) {
        setHeight(cachedHeight)
      }
    }
    getCachedHeight()
    getAccountInfo()
  }, [])
  useEffect(() => {
    if (accountInfo) {
      setAge(
        dayjs()
          .diff(dayjs(accountInfo.DOB, 'D/M/YYYY hh:mm:ss a'), 'year')
          .toString()
      )
      setSex(accountInfo.Sex)
    }
  }, [accountInfo])
  async function submitReport() {
    const networkState = await getNetworkStateAsync()
    if (!networkState.isInternetReachable) {
      return Toast.show({ type: 'error', text1: 'Network Connection Error' })
    }

    try {
      if (
        17 < Number(height) &&
        Number(height) < 300 &&
        12 < Number(age) &&
        Number(age) < 100
      ) {
        storeData('scaleHeight', height)
        storeData('scaleAge', age)
      } else if (Number(height) > 300 || Number(height) < 17) {
        return Toast.show({
          type: 'error',
        })
      } else if (Number(age) > 100 || Number(age) < 12) {
        return Toast.show({
          type: 'error',
        })
      } else {
        captureException(height, age)
        return Toast.show({ type: 'error', text1: 'Unknown Error' })
      }
    } catch (e) {
      captureException(e)
      console.log(e)
      return Toast.show({ type: 'error', text1: 'Unknown Error' })
    }

    try {
      setDisableAction(true)
      const response = await fetch("")
      setDisableAction(false)
      if (response.status === 204) {
        router.replace('/nutrical/reports')
      } else {
        Toast.show({ type: 'error', text1: 'Unknown Error' })
        captureException(response.statusText)
      }
    } catch (e) {
      console.log('Error in manualAddition: ' + e)
      captureException(e)
    }
  }
  return (
    <SafeAreaView>
      <View
        className={
          'mx-4 mt-4 mb-10 rounded-xl bg-white shadow-2xl flex items-center justify-center flex-col pb-4'
        }
      >
        <View
          className={
            'flex flex-row justify-between items-center mt-2 p-4 w-full'
          }
        >
          <Text className={'font-display-medium text-lg text-right'}>
            Height (cm):
          </Text>
          <TextInput
            className={' bg-white border-gray-400 border rounded-lg w-28 h-9 '}
            inputMode={'numeric'}
            textAlign={'center'}
            onChangeText={(text) => {
              setHeight(text)
            }}
            value={height}
          />
        </View>
        <View
          className={
            'flex flex-row justify-between items-center mt-2 p-4 w-full'
          }
        >
          <Text className={'font-display-medium text-lg text-right'}>
            Age :
          </Text>
          <TextInput
            className={'border-gray-400 border rounded-lg w-28 h-9 '}
            inputMode={'numeric'}
            textAlign={'center'}
            onChangeText={(text) => {
              setAge(text)
            }}
            value={age}
          />
        </View>
        <View
          className={
            'flex flex-row justify-between items-center mt-2 p-4 w-full'
          }
        >
          <Text className={'font-display-medium text-lg text-right'}>
            Sex :
          </Text>
          <TextInput
            className={
              ' bg-gray-200 border-gray-400 border rounded-lg w-28 h-9 '
            }
            inputMode={'numeric'}
            textAlign={'center'}
            editable={false}
            value={sex}
          />
        </View>
        <View
          className={
            'flex flex-row justify-between items-center mt-2 p-4 w-full'
          }
        >
          <Text className={'font-display-medium text-lg text-right'}>
           Weight(kg) :
          </Text>
          <TextInput
            className={' bg-white border-gray-400 border rounded-lg w-28 h-9 '}
            inputMode={'decimal'}
            textAlign={'center'}
            onChangeText={(text) => {
              setWeight(text)
            }}
            value={weight}
          />
        </View>
        <Pressable
          className={'p-2 bg-green-600 rounded-lg shadow self-center'}
          onPress={() => {
            submitReport()
          }}
        >
          <Text className={'font-display text-white'}>Account</Text>
        </Pressable>
        <Text className={'font-display-medium text-center text-base mt-3'}>
          Notes:
        </Text>
        <Text className={'font-display text-center px-4'}>
Estimates
        </Text>
      </View>
    </SafeAreaView>
  )
}
