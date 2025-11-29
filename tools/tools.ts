import { adminClient } from "@/sanity/lib/adminClient"
import { z } from "zod"
import { tool } from "ai"

export const censorPost = tool(({
  description: "Censor inappropriate content in post title and body",
  parameters: z.object({
    postId: z.string().describe("The ID of the post to censor"),
    title: z.string().optional().describe("Censored version of the title"),
    body: z.string().optional().describe("Censored version of the body"),
    isToBeReported: z
      .boolean()
      .optional()
      .describe(
        "If the post contains prohibited content, return true, otherwise return false"
      )
  }),
  execute: async ({ postId, title, body, isToBeReported }: { postId: string; title?: string; body?: string; isToBeReported?: boolean }) => {
    if (!isToBeReported) {
      return {
        success: true,
        message: `Post ${postId} is not reported`
      }
    }

    const patch = adminClient.patch(postId)

    if (title) {
      patch.set({ title })
    }

    if (body) {
      const portableTextBody = [
        {
          _type: "block",
          _key: Date.now().toString(),
          children: [
            {
              _type: "span",
              _key: Date.now().toString() + "1",
              text: body
            }
          ]
        }
      ]
      patch.set({ body: portableTextBody })
    }

    if (isToBeReported) {
      patch.set({ isReported: true })
    }

    await patch.commit()

    return {
      postId,
      censored: true,
      message: "Content has been censored"
    }
  }
}) as any)

export const reportUser = tool(({
  description: "Report a user for violating community guidelines",
  parameters: z.object({
    userId: z.string().describe("The ID of the user to report")
  }),
  execute: async ({ userId }: { userId: string }) => {
    const patch = adminClient.patch(userId)
    patch.set({ isReported: true })
    await patch.commit()

    return {
      success: true,
      message: `User ${userId} reported successfully`
    }
  }
}) as any)