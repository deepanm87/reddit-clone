"use server"

import { adminClient } from "@/sanity/lib/adminClient"
import { getPostById } from "@/sanity/lib/post/getPostById"
import { currentUser } from "@clerk/nextjs/server"
import { revalidatePath } from "next/cache"

export const deletePost = async (postId: string) => {
  const user = await currentUser()
  if (!user) {
    return { error: "User not found" }
  }

  const post = await getPostById(postId)
  if (!post) {
    return { error: "Post not found" }
  }

  if (post.author?._id !== user.id) {
    return { error: "You are not authorized to delete this post" }
  }

  try {
    const patch = adminClient.patch(postId)

    // Unset the image
    if (post.image?.asset?._ref) {
      patch.unset(["image"])
    }

    // Mark post as deleted (hidden from queries)
    patch.set({ isDeleted: true })

    const result = await patch.commit()

    // Delete the image asset after marking post as deleted
    if (result && post.image?.asset?._ref) {
      try {
        await adminClient.delete(post.image.asset._ref)
      } catch (error) {
        console.error(`Error deleting image asset: ${error}`)
      }
    }

    // Revalidate paths to refresh the UI
    revalidatePath("/", "layout")

    return { success: "Post deleted successfully" }
  } catch (error) {
    console.error(`Error deleting post: ${error}`)
    return { error: "Failed to delete post" }
  }
}