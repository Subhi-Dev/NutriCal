import { FlashList } from '@shopify/flash-list'
import { useEffect, useState } from 'react'
import { ActivityIndicator, Pressable, View, Text } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Toast from 'react-native-toast-message'
import useSWR from 'swr'

import type { GetAccountReturn, GetPosts } from '@backend/types'

import FlashListHeader from '~/components/home/FlashListHeader'
import Post from '~/components/home/Post'

export default function Home() {
  const [page, setPage] = useState(1)
  const [isEnd, setIsEnd] = useState(false)
  const [posts, setPosts] = useState<GetPosts>([])
  const {
    data: postsData,
    isLoading: postsLoading,
    isValidating
  } = useSWR<
    | {
        data: GetPosts
        error: false
      }
    | {
        message: string
        error: true
      }
  >(`posts?page=${page}`)

  const { data: userData, error: userError } = useSWR<
    { data: GetAccountReturn; error: false } | { error: true; message: string }
  >('account')
  // Handle data and pagination
  useEffect(() => {
    if (postsData && !postsData.error) {
      if (page === 1) {
        setPosts(postsData.data)
      } else {
        setPosts((prev) => [...prev, ...postsData.data])
      }
      setIsEnd(postsData.data.length < 20)
    }
  }, [postsData, page])
  useEffect(() => {
    if (postsData?.error) {
      Toast.show({ type: 'error', text1: 'Error', text2: postsData.message })
    }
    if (userError) {
      Toast.show({ type: 'error', text1: 'Error', text2: userError.message })
    }
  }, [postsData, userError])
  if (!userData || userData.error === true) {
    return (
      <View className={'flex-1 items-center justify-center'}>
        <Text className={'text-red-500'}>
          {userData?.message || userError?.message}
        </Text>
      </View>
    )
  }
  return (
    <SafeAreaView className={'bg-gray-100'}>
      <View className={'h-screen'}>
        <FlashList
          ListHeaderComponent={() => <FlashListHeader />}
          onEndReachedThreshold={0.5}
          onEndReached={() => {
            if (!isEnd && !isValidating) {
              setPage((p) => p + 1)
              console.log('Loading more foods, current page:', page)
            }
          }}
          data={posts}
          getItemType={(item) => item.mediaType}
          keyExtractor={(item) => item.id}
          removeClippedSubviews={true}
          estimatedItemSize={200}
          renderItem={({ item, index }) => (
            <Post
              post={item}
              favoriteFunction={() => {
                //favoritePost(item['ID'], index)
              }}
              alone={false}
            />
          )}
          ListFooterComponent={
            <View className="py-4 items-center">
              {isValidating && <ActivityIndicator />}
              {!isValidating && posts.length === 0 && (
                <Text className="text-gray-500">No meals found.</Text>
              )}
              {!isValidating &&
                posts.length > 0 &&
                (isEnd ? (
                  <Text className="text-gray-400 mt-2">End of results</Text>
                ) : (
                  <Pressable
                    className="bg-blue-500 px-4 py-2 rounded mt-2"
                    onPress={() => setPage((p) => p + 1)}
                    disabled={isValidating}
                  >
                    <Text className="text-white font-bold">Load More</Text>
                  </Pressable>
                ))}
            </View>
          }
        />
      </View>
    </SafeAreaView>
  )
}
