"use server"

import { adminClient } from "@/sanity/lib/adminClient"
import { getCommentById } from "@/sanity/lib/comment/getCommentById"
import { currentUser } from "@clerk/nextjs/server"

export const deleteComment = async (commentId: string) => {
  const user = await currentUser()
  if (!user) {
    return { error: "User not found" }
  }

  const comment = await getCommentById(commentId)
  if (!comment) {
    return { error: "Comment not found" }
  }

  const patch = adminClient.patch(commentId)

  patch.set({ content: "[DELETED]" })
  
  patch.set({ isDeleted: true })

  await patch.commit()

  return { success: "Comment deleted successfully" }
}
