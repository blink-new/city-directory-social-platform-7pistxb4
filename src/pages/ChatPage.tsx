import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { blink } from '../blink/client'
import { useAuth } from '../hooks/useAuth'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Card, CardContent, CardHeader } from '../components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar'
import { Badge } from '../components/ui/badge'
import { 
  ArrowLeft, 
  Send, 
  Image, 
  Paperclip, 
  Smile,
  Check,
  CheckCheck
} from 'lucide-react'
import type { User, Message, ChatRoom } from '../types'
import type { RealtimeChannel } from '@blinkdotnew/sdk'

export function ChatPage() {
  const { username } = useParams<{ username: string }>()
  const { user: currentUser, isAuthenticated } = useAuth()
  const [otherUser, setOtherUser] = useState<User | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('Hi, I just viewed your profile!')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [chatRoom, setChatRoom] = useState<ChatRoom | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const channelRef = useRef<RealtimeChannel | null>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (username && currentUser) {
      initializeChat()
    }
    
    return () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe()
      }
    }
  }, [username, currentUser, initializeChat])

  const setupRealtimeChat = useCallback(async (chatRoomId: string) => {
    if (!currentUser) return
    
    try {
      const channel = blink.realtime.channel(`chat-${chatRoomId}`)
      channelRef.current = channel

      await channel.subscribe({
        userId: currentUser.id,
        metadata: { 
          displayName: currentUser.displayName || currentUser.email?.split('@')[0] || 'User'
        }
      })

      channel.onMessage((message) => {
        if (message.type === 'new_message') {
          const newMsg = message.data as Message
          setMessages(prev => {
            // Avoid duplicates
            if (prev.find(m => m.id === newMsg.id)) {
              return prev
            }
            return [...prev, newMsg]
          })
        }
      })

    } catch (error) {
      console.error('Error setting up realtime chat:', error)
    }
  }, [currentUser])

  const initializeChat = useCallback(async () => {
    if (!currentUser || !username) return

    try {
      // Find the other user
      const users = await blink.db.users.list({
        where: { username: username }
      })
      
      if (users.length === 0) {
        setLoading(false)
        return
      }
      
      const user = users[0]
      setOtherUser(user)

      // Find or create chat room
      const room = await findOrCreateChatRoom(currentUser.id, user.id)
      setChatRoom(room)

      // Load messages
      await loadMessages(room.id)

      // Set up real-time messaging
      await setupRealtimeChat(room.id)

    } catch (error) {
      console.error('Error initializing chat:', error)
    } finally {
      setLoading(false)
    }
  }, [currentUser, username, setupRealtimeChat])

  const findOrCreateChatRoom = async (user1Id: string, user2Id: string): Promise<ChatRoom> => {
    // Try to find existing room (check both directions)
    let rooms = await blink.db.chatRooms.list({
      where: { 
        user1Id: user1Id,
        user2Id: user2Id
      }
    })

    if (rooms.length === 0) {
      rooms = await blink.db.chatRooms.list({
        where: { 
          user1Id: user2Id,
          user2Id: user1Id
        }
      })
    }

    if (rooms.length > 0) {
      return rooms[0]
    }

    // Create new room
    const newRoom = await blink.db.chatRooms.create({
      user1Id: user1Id,
      user2Id: user2Id
    })

    return newRoom
  }

  const loadMessages = async (chatRoomId: string) => {
    try {
      const messagesData = await blink.db.messages.list({
        where: { chatRoomId: chatRoomId },
        orderBy: { createdAt: 'asc' },
        limit: 100
      })
      setMessages(messagesData)
    } catch (error) {
      console.error('Error loading messages:', error)
    }
  }



  const sendMessage = async () => {
    if (!newMessage.trim() || !currentUser || !chatRoom || sending) {
      return
    }

    setSending(true)
    try {
      const message = await blink.db.messages.create({
        chatRoomId: chatRoom.id,
        senderId: currentUser.id,
        content: newMessage.trim(),
        messageType: 'text'
      })

      // Add to local state immediately (optimistic update)
      setMessages(prev => [...prev, message])

      // Send real-time notification
      if (channelRef.current) {
        await channelRef.current.publish('new_message', message)
      }

      setNewMessage('')
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setSending(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading chat...</p>
        </div>
      </div>
    )
  }

  if (!otherUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="instagram-card max-w-md w-full mx-4">
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">User Not Found</h2>
            <p className="text-gray-600 mb-6">
              The user @{username} doesn't exist or has been removed.
            </p>
            <Button asChild>
              <Link to="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Directory
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="instagram-card max-w-md w-full mx-4">
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Sign In Required</h2>
            <p className="text-gray-600 mb-6">
              You need to sign in to send messages.
            </p>
            <Button onClick={() => blink.auth.login()}>
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="gradient-bg text-white shadow-lg">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              size="sm"
              asChild 
              className="text-white hover:bg-white/10"
            >
              <Link to="/">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            
            <Avatar className="h-10 w-10">
              <AvatarImage src={otherUser.profileImage} alt={otherUser.fullName} />
              <AvatarFallback className="bg-white text-blue-600">
                {otherUser.fullName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <Link 
                to={`/user/${otherUser.username}`}
                className="block hover:text-blue-200 transition-colors"
              >
                <h2 className="font-semibold">{otherUser.fullName}</h2>
                <p className="text-sm text-blue-200">@{otherUser.username}</p>
              </Link>
            </div>
            
            <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
              Online
            </Badge>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
        <Card className="instagram-card h-[calc(100vh-200px)] flex flex-col">
          <CardContent className="flex-1 p-0 overflow-hidden">
            <div className="h-full overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-gray-400 mb-4">
                    <Smile className="h-12 w-12 mx-auto" />
                  </div>
                  <p className="text-gray-600">
                    Start your conversation with {otherUser.fullName}
                  </p>
                </div>
              ) : (
                messages.map((message) => {
                  const isOwn = message.senderId === currentUser?.id
                  return (
                    <div
                      key={message.id}
                      className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`chat-bubble ${isOwn ? 'chat-bubble-sent' : 'chat-bubble-received'}`}>
                        <p className="text-sm">{message.content}</p>
                        <div className={`flex items-center justify-end mt-1 space-x-1 text-xs ${
                          isOwn ? 'text-blue-200' : 'text-gray-500'
                        }`}>
                          <span>{formatTime(message.createdAt)}</span>
                          {isOwn && (
                            <div className="flex">
                              {Number(message.isRead) > 0 ? (
                                <CheckCheck className="h-3 w-3" />
                              ) : (
                                <Check className="h-3 w-3" />
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
              <div ref={messagesEndRef} />
            </div>
          </CardContent>

          {/* Message Input */}
          <div className="border-t p-4">
            <div className="flex items-end space-x-2">
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-gray-600"
              >
                <Paperclip className="h-4 w-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-gray-600"
              >
                <Image className="h-4 w-4" />
              </Button>
              
              <div className="flex-1">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type a message..."
                  className="resize-none"
                  disabled={sending}
                />
              </div>
              
              <Button
                onClick={sendMessage}
                disabled={!newMessage.trim() || sending}
                className="gradient-bg"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}