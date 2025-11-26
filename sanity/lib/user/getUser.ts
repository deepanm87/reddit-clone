import { sanityFetch } from "../live"
import { defineQuery } from "groq"
import { currentUser } from "@clerk/nextjs/server"
import { addUser } from "./addUser"

interface UserResult {
  _id: string
  username: string
  imageUrl: string
  email: string
}

const parseUsername = (username: string) => {
  const randomNum = Math.floor(1000 + Math.random() * 9000)

  return (
    username
      .replace(/\s+(.)/g, (_, char) => char.toUpperCase())
      .replace(/\s+/g, "") + randomNum
  )
}

export async function getUser(): Promise<UserResult | { error: string }> {
  try {
    const loggedInUser = await currentUser()

    if (!loggedInUser) {
      return { error: "User not found" }
    }

    const getExistingUserQuery = defineQuery(
      `*[_type == "user" && _id == $id][0]`
    )

    const existingUser = await sanityFetch({
      query: getExistingUserQuery,
      params: { id: loggedInUser.id }
    })

    if (existingUser.data?._id) {
      const user = {
        _id: existingUser.data._id,
        username: existingUser.data.username!,
        imageUrl: existingUser.data.imageUrl!,
        email: existingUser.data.email!
      }

      return user
    }

    const newUser = await addUser({
      id: loggedInUser.id,
      username: parseUsername(loggedInUser.fullName!),
      email:
        loggedInUser.primaryEmailAddress?.emailAddress ||
        loggedInUser.emailAddresses[0].emailAddress,
      imageUrl: loggedInUser.imageUrl
    })

    const user = {
      _id: newUser._id,
      username: newUser.username!,
      imageUrl: newUser.imageUrl,
      email: newUser.email
    }

    return user
  } catch (error) {
    console.error(`Error getting user: ${error}`)
    return { error: "Failed to get user" }
  }
}