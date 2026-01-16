import { Link } from 'expo-router'
import { View, Text, Pressable } from 'react-native'

export default function FeaturedProgram(props: {
  id: number
  name: string
  description: string
}) {
  return (
    <View className="flex flex-col items-start justify-center w-screen px-4 pt-2 h-full">
      <Text className="font-display-medium text-3xl text-white w-64 mb-2">
        {props.name}
      </Text>
      <Text className="font-display text-xl text-white mb-4 w-48">
        {props.description}
      </Text>
      <Link
        href={`/nutrical/programs/${props.id}`}
        asChild
      >
        <Pressable
          className="bg-transparent border border-white rounded-full py-2 px-4"
          onPress={() => {}}
        >
          <Text className="text-white text-lg font-display-medium">
            View Program
          </Text>
        </Pressable>
      </Link>
    </View>
  )
}
