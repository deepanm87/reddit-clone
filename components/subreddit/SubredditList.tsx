"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from "@/components/ui/sidebar"

import type { GetSubredditsQueryResult } from "@/sanity.types"

export default function SubredditList({
  subreddits,
}: {
  subreddits: GetSubredditsQueryResult
}) {
  const pathname = usePathname()

  return (
    <SidebarMenuSub>
      {subreddits.map((sr) => {
        const slug = sr.slug || ""
        const url = `/community/${slug}`
        const isActive = pathname === url

        return (
          <SidebarMenuSubItem key={sr._id}>
            <SidebarMenuSubButton asChild isActive={isActive}>
              <Link href={url}>{sr.title || "unknown"}</Link>
            </SidebarMenuSubButton>
          </SidebarMenuSubItem>
        )
      })}
    </SidebarMenuSub>
  )
}
