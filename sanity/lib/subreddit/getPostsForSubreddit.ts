import { defineQuery } from "next-sanity"
import { sanityFetch } from "../live"
import type { GetPostsForSubredditQueryResult } from "@/sanity.types"

export async function getPostsForSubreddit(id: string): Promise<GetPostsForSubredditQueryResult> {
  const getPostsForSubredditQuery = defineQuery(`
      *[_type == "post" && subreddit._ref == $id && isDeleted != true] {
        ...,
        "slug": slug.current,
        "author": author->,
        "subreddit": subreddit->,
        "category": category->,
        "upvotes": count(*[_type == "vote" && post._ref == ^._id && voteType == "upvote"]),
        "downvotes": count(*[_type == "vote" && post._ref == ^._id && voteType == "downvote"]),
        "netScore": count(*[_type == "vote" && post._ref == ^._id && voteType == "upvote"]) - count(*[_type == "vote" && post._ref == ^._id && voteType == "downvote"]),
        "commentCount": count(*[_type == "comment" && post._ref == ^._id])
      } | order(publishedAt desc)
    `)

  const result = await sanityFetch({
    query: getPostsForSubredditQuery,
    params: { id }
  })

  return result.data as GetPostsForSubredditQueryResult
}