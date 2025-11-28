"use server"

import { Post } from "@/sanity.types"
import { adminClient } from "@/sanity/lib/adminClient"
import { getSubredditBySlug } from "@/sanity/lib/subreddit/getSubredditBySlug"
import { getUser } from "@/sanity/lib/user/getUser"
import { auth } from "@clerk/nextjs/server"
import { CoreMessage, generateText } from "ai"
import { createClerkToolkit } from "@clerk/agent-toolkit/ai-sdk"
import { openai } from "@ai-sdk/openai"
import { censorPost, reportUser } from "@/tools/tools"
import { systemPrompt } from "@/tools/prompt"

export type PostImageData = {
  base64: string
  filename: string
  contentType: string
} | null

export async function createPost({
  title,
  subredditSlug,
  body,
  imageBase64,
  imageFilename,
  imageContentType
}: {
  title: string
  subredditSlug: string
  body?: string
  imageBase64?: string | null
  imageFilename?: string | null
  imageContentType?: string | null
}) {
  try {
    if (!title || !subredditSlug) {
      return { error: "Title and subreddit are required" }
    }

    const user = await getUser()

    if ("error" in user) {
      return { error: user.error }
    }

    const subreddit = await getSubredditBySlug(subredditSlug)

    if (!subreddit?._id) {
      return { error: `Subreddit "${subredditSlug}" not found`}
    }

    let imageAsset
    if (imageBase64 && imageFilename && imageContentType) {
      try {
        const base64Data = imageBase64.split(",")[1]

        const buffer = Buffer.from(base64Data, "base64")

        imageAsset = await adminClient.assets.upload("image", buffer, {
          filename: imageFilename,
          contentType: imageContentType
        })
      } catch (error) {
        console.error(`Error uploading image: ${error}`)
      }
    } else {

    }

    const postDoc: Partial<Post> = {
      _type: "post",
      title,
      body: body
        ? [
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
      : undefined,
      author: {
        _type: "reference",
        _ref: user._id
      },
      subreddit: {
        _type: "reference",
        _ref: subreddit._id
      },
      publishedAt: new Date().toISOString()
    }

    if (imageAsset) {
      postDoc.image = {
        _type: "image",
        asset: {
          _type: "reference",
          _ref: imageAsset._id
        }
      }
    }

    const post = await adminClient.create(postDoc as Post)
    const messages: CoreMessage[] = [
      {
        role: "user",
        content: `I posted this post -> Post ID: ${post._id}\nTitle: ${title}\nBody: ${body}`
      }
    ]

    try {
      const authContext = await auth.protect()
      const toolkit = await createClerkToolkit({ authContext })
      const result = await generateText({
        model: openai("gpt-4.1-mini"),
        messages: messages as CoreMessage[],
        system: toolkit.injectSessionClaims(systemPrompt),
        tools: {
          ...toolkit.users(),
          censorPost,
          reportUser
        }
      })
    } catch (error) {
      console.error(`Error in content moderation: ${error}`)
    }

    return { post }
  } catch (error) {
    console.error(`Error creating post: ${error}`)
    return { error: "Failed to create post" }
  }
}