import { router } from 'expo-router'
import * as SecureStore from 'expo-secure-store'
import ky from 'ky'
import { useMemo } from 'react'
import Toast from 'react-native-toast-message'

import { useStorageState } from '~/hooks/useStorageState'

export default function useClient(_token?: string | null | undefined) {
  const [[, token]] = useStorageState('token')

  return useMemo(
    () =>
      ky.create({
        prefixUrl: process.env.EXPO_PUBLIC_API_BASE, // + "v1"
        headers: {
          Authorization: `Bearer ${token || _token || ''}`,
          'User-Agent': 'Nutrical-Mobile'
        },
        hooks: {
          beforeRequest: [
            async (request) => {
              const authHeader = request.headers.get('Authorization')
              if (authHeader && !authHeader.includes('-')) {
                request.headers.set(
                  'Authorization',
                  `Bearer ${(await SecureStore.getItemAsync('token')) || _token}`
                )
              }
            }
          ],
          beforeError: [
            (error) => {
              console.error('Network error:', error)
              if (
                error.name === 'TypeError' ||
                error.message?.includes('fetch')
              ) {
                console.error(
                  'No internet connection, please check your network settings.'
                )
                Toast.show({
                  type: 'error',
                  text1: 'No internet connection',
                  text2: 'Please check your network settings.'
                })
                return error
              }
              if (error.response?.status === 401) {
                router.replace('/(auth)/login')
                console.error('Unauthorized access, redirecting to login...')
              }
              return error
            }
          ]
        },
        retry: {
          limit: 2,
          methods: ['get', 'post', 'put', 'delete', 'patch'],
          statusCodes: [408, 500, 502, 503, 504]
        }
      }),
    [_token, token]
  )
}
