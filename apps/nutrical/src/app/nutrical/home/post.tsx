import { GetAccountReturn, GetPostById } from '@backend/types'
import { FlashList } from '@shopify/flash-list'
import { useLocalSearchParams } from 'expo-router'
import React, { useState } from 'react'
import { View, Text, KeyboardAvoidingView, Platform } from 'react-native'
import Toast from 'react-native-toast-message'
import useSWR from 'swr'

import LoadingIndicator from '~/components/archiveOfComponents/reports/reports/LoadingIndicator'
import Comment from '~/components/home/forum/Comment'
import CommentTextBox from '~/components/home/forum/CommentTextBox'
import Post from '~/components/home/Post'
import useClient from '~/components/network/client'
export default function PostPage() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const [commentText, setCommentText] = useState('')
  const [sending, setSending] = useState(false)

  const {
    data: postData,
    error,
    isLoading,
    mutate: revalidatePost
  } = useSWR<
    { data: GetPostById; error: false } | { error: true; message: string }
  >(`posts/${id}`)
  const { data: userData, error: userError } = useSWR<
    { data: GetAccountReturn; error: false } | { error: true; message: string }
  >('account')
  const api = useClient()
  async function sendTextComment() {
    if (commentText === '') {
      return Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Comment cannot be empty'
      })
    }
    if (userData?.error === true) {
      return Toast.show({
        type: 'error',
        text1: 'Error',
        text2: userData.message
      })
    }
    if (!userData?.data?.session?.userId) {
      return Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'User not logged in'
      })
    }
    if (postData?.error === true) {
      return Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Post not found'
      })
    }
    try {
      setSending(true)
      const commentObject = {
        content: commentText,
        postId: postData?.data?.id || ''
      }

      const response = await api
        .post('comments', {
          json: commentObject,
          throwHttpErrors: false
        })
        .json()
      if (response.status) {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: response.statusText
        })
      }
      revalidatePost()
      setCommentText('')
      setSending(false)
    } catch (e) {
      setSending(false)
      console.log('Unknown Error (sendText)' + e)
      //captureException(e)
    }
  }

  if (!postData || postData.error === true || !postData.data) {
    return (
      <View className={'flex-1 items-center justify-center'}>
        <Text className={'text-red-500'}>
          {postData && 'message' in postData
            ? postData.message
            : 'Post not found'}
        </Text>
      </View>
    )
  }
  if (error) {
    return <Text>Error loading post</Text>
  }
  if (userError) {
    Toast.show({ type: 'error', text1: 'Error', text2: userError.message })
    return
  }
  if (!userData || userData.error === true) {
    return (
      <View className={'flex-1 items-center justify-center'}>
        <Text className={'text-red-500'}>{userData?.message}</Text>
      </View>
    )
  }
  return (
    <View>
      {isLoading ? (
        <LoadingIndicator />
      ) : (
        <View className={'bg-white h-full w-screen flex-col'}>
          <KeyboardAvoidingView
            keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 24}
            behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
            className={'flex flex-1 bg-white'}
          >
            <View className={'w-screen flex-1 flex flex-col'}>
              <View className={'flex flex-col w-screen flex-grow min-h-0'}>
                <FlashList
                  keyboardDismissMode="interactive"
                  ListHeaderComponent={
                    <Post
                      post={postData.data}
                      favoriteUsers={postData.data.likes}
                      selfAccountID={userData.data?.session?.userId || ''}
                      favoriteFunction={() => {}}
                      alone={true}
                    />
                  }
                  data={postData.data.comments}
                  renderItem={({ item }) => (
                    <Comment
                      key={item.id}
                      name={item.user.firstName + ' ' + item.user.lastName}
                      content={item.content}
                    />
                  )}
                  estimatedItemSize={100}
                />
              </View>
              <View className="bg-white w-screen flex-shrink flex-grow-0">
                <CommentTextBox
                  messageText={commentText}
                  sendTextMessage={sendTextComment}
                  setMessageText={setCommentText}
                  sendDisabled={sending}
                />
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      )}
    </View>
  )
}
