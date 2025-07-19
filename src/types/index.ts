export interface User {
  id: string
  username: string
  email: string
  fullName: string
  bio?: string
  profileImage?: string
  location?: string
  latitude?: number
  longitude?: number
  createdAt: string
  updatedAt: string
}

export interface ProfileLike {
  id: string
  userId: string
  likedUserId: string
  createdAt: string
}

export interface ChatRoom {
  id: string
  user1Id: string
  user2Id: string
  createdAt: string
  updatedAt: string
}

export interface Message {
  id: string
  chatRoomId: string
  senderId: string
  content?: string
  messageType: 'text' | 'image' | 'video' | 'file'
  fileUrl?: string
  fileName?: string
  fileType?: string
  isRead: boolean
  createdAt: string
}

export interface AuthUser {
  id: string
  email: string
  displayName?: string
}