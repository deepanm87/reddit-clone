import { sanityFetch } from "../live"
import { defineQuery } from "groq"

export async function searchSubreddits(searchTerm: string) {
  if (!searchTerm || searchTerm.trim() === "") {
    return []
  }

  const searchSubredditsQuery = 
    defineQuery(`*[_type == "subreddit" && lower(title) match lower($searchTerm) + "*"] {
        _id,
        title,
        "slug": slug.current,
        description,
        image,
        "moderator": moderator->,
        createdAt,
      } | order(createdAt desc)`)

  const results = await sanityFetch({
    query: searchSubredditsQuery,
    params: { searchTerm: searchTerm.trim() }
  })

  return results.data
}