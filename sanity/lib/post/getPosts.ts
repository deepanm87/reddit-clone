import { sanityFetch } from "../live"
import { defineQuery } from "groq"
import type { GetAllPostsQueryResult } from "@/sanity.types"

export async function getPosts(): Promise<GetAllPostsQueryResult> {
  const getAllPostsQuery = 
    defineQuery(`*[_type == "post" && isDeleted != true] {
        _id,
        title,
        "slug": slug.current,
        body,
        publishedAt,
        "author": author->
        ,
        "subreddit": subreddit->,
        image,
        isDeleted
      } | order(publishedAt desc)`)

  const posts = await sanityFetch({ query: getAllPostsQuery })
  return posts.data as GetAllPostsQueryResult
}
