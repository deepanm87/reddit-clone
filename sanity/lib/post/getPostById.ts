import { sanityFetch } from "../live"
import { defineQuery } from "groq"

export async function getPostById(postId: string) {
  const getPostByIdQuery = defineQuery(`*[_type == "post" && _id == $postId] {
      _id,
      title,
      "slug": slug.current,
      body,
      publishedAt,
      "author": author->,
      "subreddit": subreddit->,
      image,
      isDeletd
    }[0]`)

  const post = await sanityFetch({
    query: getPostByIdQuery,
    params: { postId }
  })
  return post.data
}