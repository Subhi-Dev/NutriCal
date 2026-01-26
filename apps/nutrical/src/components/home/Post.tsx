import { FlashList } from '@shopify/flash-list'
import { Image } from 'expo-image'
import { Link } from 'expo-router'
import { Ellipsis, Heart, MessagesSquare } from 'lucide-react-native'
import { DateTime } from 'luxon'
import { useState } from 'react'
import { Text, View, Pressable } from 'react-native'
import { GestureViewer } from 'react-native-gesture-image-viewer'
import Toast from 'react-native-toast-message'
import * as DropdownMenu from 'zeego/dropdown-menu'

import type { GetPostById, GetPosts } from '@backend/types'

export default function Post(props: {
  post: GetPosts[number] | NonNullable<GetPostById>
  favoriteUsers?: Array<{ userId: string }>
  favoriteFunction: (isFavorited: boolean) => void
  selfAccountID?: string
  alone: boolean
}) {
  const createdDate = DateTime.fromISO(String(props.post.createdAt))
  const [isHidden, setHidden] = useState(false)

  const postAny = props.post as any
  const likeCount = postAny.likeCount ?? props.favoriteUsers?.length ?? 0
  const isLiked =
    postAny.isLiked ??
    props.favoriteUsers?.some((value) => props.selfAccountID == value.userId) ??
    false
  const commentCount = postAny.commentCount ?? postAny.comments?.length ?? 0

  const [isfavorited, toggleFavorite] = useState(isLiked)
  const [favoriteCount, setFavoriteCount] = useState(likeCount)
  function favorite() {
    if (isfavorited) {
      return 'alreadyFavorite'
    }
    props.favoriteFunction(!isfavorited)
    toggleFavorite(true)
    setFavoriteCount((prev: number) => prev + 1)
  }
  function postRemove() {
    setHidden(true)
  }
  //TODO: Add Support for multiple media
  //TODO: Add support for Viewing media
  return (
    <View>
      {!isHidden && (
        <Link
          href={{
            pathname: '/nutrical/home/post',
            params: { id: props.post.id }
          }}
          asChild
          disabled={props.alone}
        >
          <Pressable
            className={'bg-white p-4 rounded-lg border border-gray-200 mb-4'}
          >
            <View className={'flex flex-row items-start w-full'}>
              <Image
                source={require('@assets/icons8-male-user-96.png')}
                className={'h-10 rounded-full w-10'}
              />
              <View className={'text-right items-start ml-2'}>
                <Text className={'font-display-medium text-gray-900'}>
                  {props.post.user.firstName} {props.post.user.lastName}
                </Text>
                <Text className={'font-display text-xs text-gray-500'}>
                  {createdDate.toRelative()}
                </Text>
              </View>
              <View className={'self-start items-end ml-auto'}>
                <DropdownMenu.Root>
                  <DropdownMenu.Trigger>
                    <View className={'flex flex-col justify-center p-2'}>
                      <Ellipsis
                        size={24}
                        color={'#4B5563'}
                      />
                    </View>
                  </DropdownMenu.Trigger>
                  <DropdownMenu.Content>
                    <DropdownMenu.Item
                      key={'0'}
                      onSelect={() => {
                        Toast.show({ type: 'success', text1: 'تم التبليغ' })
                      }}
                    >
                      <DropdownMenu.ItemTitle>
                        بلغ عن المنشور
                      </DropdownMenu.ItemTitle>
                    </DropdownMenu.Item>
                    <DropdownMenu.Item
                      key={'1'}
                      onSelect={() => {
                        postRemove()
                      }}
                    >
                      <DropdownMenu.ItemTitle>
                        إخفاء المنشور
                      </DropdownMenu.ItemTitle>
                    </DropdownMenu.Item>
                  </DropdownMenu.Content>
                </DropdownMenu.Root>
              </View>
            </View>
            <View className={'items-start my-3'}>
              <Text className={'font-display text-base text-gray-800'}>
                {props.post.content}
              </Text>
            </View>
            {props.post.mediaType == 'image' && (
              <GestureViewer
                data={props.post.mediaUrl ? [props.post.mediaUrl] : []}
                renderItem={(propsViewer) => (
                  <Image
                    recyclingKey={props.post.id}
                    className={'rounded-lg w-full h-64'}
                    contentFit={'cover'}
                    source={{ uri: propsViewer }}
                  />
                )}
                ListComponent={FlashList}
              />
            )}
            {!props.alone && (
              <View>
                <View className={'flex flex-row justify-end items-center my-2'}>
                  {commentCount !== 0 && (
                    <Text className={'ml-4 font-display text-sm text-gray-600'}>
                      {commentCount} تعليقات
                    </Text>
                  )}
                  <Text className={'font-display text-sm text-gray-600'}>
                    {favoriteCount} إعجاب
                  </Text>
                </View>
                <View className={'my-2 h-px bg-gray-200'} />
                <View
                  className={'flex flex-row gap-2 items-center justify-evenly'}
                >
                  <Pressable
                    className={'flex flex-row items-center p-2'}
                    onPress={favorite}
                  >
                    {isfavorited ? (
                      <Heart
                        fill={'#ef4444'}
                        color={'#ef4444'}
                        size={20}
                      />
                    ) : (
                      <Heart
                        color={'#4B5563'}
                        size={20}
                      />
                    )}
                    <Text className={'ml-2 font-display-medium text-gray-700'}>
                      أعجبني
                    </Text>
                  </Pressable>
                  <Link
                    href={{
                      pathname: '/nutrical/home/post',
                      params: { id: props.post.id }
                    }}
                    asChild
                  >
                    <Pressable className={'flex flex-row items-center p-2'}>
                      <MessagesSquare
                        color={'#4B5563'}
                        size={20}
                      />
                      <Text
                        className={'ml-2 font-display-medium text-gray-700'}
                      >
                        تعليق
                      </Text>
                    </Pressable>
                  </Link>
                  {/*                <View className={"flex flex-row items-center"}>
                    <MaterialIcons name={"bar-chart"} size={24} color={"#94a3b8"}/>
                    <Text className={"ml-1"}>{views}</Text>
                  </View>*/}
                </View>
              </View>
            )}
          </Pressable>
        </Link>
      )}
    </View>
  )
}
