"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"

export function useUserId() {
  const { status } = useSession()
  const [userId, setUserId] = useState<number | null>(null)

  useEffect(() => {
    if (status === "authenticated") {
      fetch("/api/auth/sync-user", { method: "POST" })
        .then((res) => res.json())
        .then((data) => {
          if (data.user_id) setUserId(data.user_id)
        })
    }
  }, [status])

  return userId
}
