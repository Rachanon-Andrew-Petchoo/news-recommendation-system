'use client'

import { signIn, signOut, useSession } from "next-auth/react"

export function AuthButton() {
  const { data: session } = useSession()

  const handleLogin = async () => {
    await signIn("google");
    await fetch("/api/fetchNews", { method: "GET" });
  };

  return session ? (
    <div className="flex items-center gap-2 text-white">
      <span className="hidden sm:inline">Hi, {session.user?.email}</span>
      <button
        onClick={() => signOut()}
        className="bg-red-500 hover:bg-red-600 px-3 py-1 rounded text-white"
      >
        Sign out
      </button>
    </div>
  ) : (
    <button
      onClick={handleLogin}
      className="bg-blue-500 hover:bg-blue-600 px-3 py-1 rounded text-white"
    >
      Sign in
    </button>
  )
}
