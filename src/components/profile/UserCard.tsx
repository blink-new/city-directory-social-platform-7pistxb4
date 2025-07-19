import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { blink } from '../../blink/client'
import { useAuth } from '../../hooks/useAuth'
import { Button } from '../ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { Card, CardContent } from '../ui/card'
import { Heart, MessageCircle, MapPin } from 'lucide-react'
import type { User } from '../../types'

interface UserCardProps {
  user: User
}

export function UserCard({ user }: UserCardProps) {
  const { user: currentUser, isAuthenticated } = useAuth()
  const [likes, setLikes] = useState(0)
  const [isLiked, setIsLiked] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadLikes()
  }, [loadLikes])

  const loadLikes = useCallback(async () => {
    try {
      // Get total likes for this user
      const likesData = await blink.db.profileLikes.list({
        where: { likedUserId: user.id }
      })
      setLikes(likesData.length)

      // Check if current user has liked this profile
      if (currentUser) {
        const userLike = await blink.db.profileLikes.list({
          where: { 
            userId: currentUser.id,
            likedUserId: user.id
          }
        })
        setIsLiked(userLike.length > 0)
      }
    } catch (error) {
      console.error('Error loading likes:', error)
    }
  }, [user.id, currentUser])

  const handleLike = async () => {
    if (!isAuthenticated || !currentUser) {
      return
    }

    setLoading(true)
    try {
      if (isLiked) {
        // Unlike
        const existingLikes = await blink.db.profileLikes.list({
          where: { 
            userId: currentUser.id,
            likedUserId: user.id
          }
        })
        if (existingLikes.length > 0) {
          await blink.db.profileLikes.delete(existingLikes[0].id)
          setLikes(prev => prev - 1)
          setIsLiked(false)
        }
      } else {
        // Like
        await blink.db.profileLikes.create({
          userId: currentUser.id,
          likedUserId: user.id
        })
        setLikes(prev => prev + 1)
        setIsLiked(true)
      }
    } catch (error) {
      console.error('Error toggling like:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="instagram-card hover:shadow-md transition-shadow duration-200">
      <CardContent className="p-6">
        <div className="flex items-start space-x-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={user.profileImage} alt={user.fullName} />
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-lg">
              {user.fullName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <Link 
              to={`/user/${user.username}`}
              className="block hover:text-blue-600 transition-colors"
            >
              <h3 className="text-lg font-semibold text-gray-900 truncate">
                {user.fullName}
              </h3>
              <p className="text-sm text-gray-500">@{user.username}</p>
            </Link>
            
            {user.bio && (
              <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                {user.bio}
              </p>
            )}
            
            {user.location && (
              <div className="mt-2 flex items-center text-sm text-gray-500">
                <MapPin className="h-4 w-4 mr-1" />
                <span className="truncate">{user.location}</span>
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant={isLiked ? "default" : "outline"}
              size="sm"
              onClick={handleLike}
              disabled={loading || !isAuthenticated}
              className={`flex items-center space-x-1 ${
                isLiked ? 'bg-red-500 hover:bg-red-600 text-white' : ''
              }`}
            >
              <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
              <span>{likes}</span>
            </Button>
            
            {isAuthenticated && currentUser?.id !== user.id && (
              <Button
                variant="outline"
                size="sm"
                asChild
              >
                <Link 
                  to={`/chat/${user.username}`}
                  className="flex items-center space-x-1"
                >
                  <MessageCircle className="h-4 w-4" />
                  <span>Message</span>
                </Link>
              </Button>
            )}
          </div>
          
          <Link 
            to={`/user/${user.username}`}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            View Profile
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}