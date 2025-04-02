'use client'

import { useUser } from "@/contexts/UserContext"
import { redirect } from "next/navigation"

export default function ProfilePage() {
  const { user } = useUser()

  if (!user) {
    redirect("/login")
  }

  return (
    <div className="max-w-2xl mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-6">My Profile</h1>
      <div className="space-y-4 text-lg">
        <p><strong>Username:</strong> {user.username}</p>
        <p><strong>Email:</strong> {user.email}</p>
        <p><strong>Role:</strong> {user.role}</p>
        <p><strong>Street Address:</strong> {user.street}</p>
        <p><strong>City:</strong> {user.city}</p>
        <p><strong>Country:</strong> {user.country}</p>
        <p><strong>Postal Code:</strong> {user.postal_code}</p>
      </div>
    </div>
  )
}
