import { useState, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { blink } from '../blink/client'
import { useAuth } from '../hooks/useAuth'
import { Button } from '../components/ui/button'
import { Card, CardContent } from '../components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar'
import { Badge } from '../components/ui/badge'
import { Heart, MessageCircle, MapPin, Calendar, Edit, ArrowLeft } from 'lucide-react'
import type { User } from '../types'

export function UserProfilePage() {
  const { username } = useParams<{ username: string }>()
  const { user: currentUser, isAuthenticated } = useAuth()
  const [user, setUser] = useState<User | null>(null)
  const [likes, setLikes] = useState(0)
  const [isLiked, setIsLiked] = useState(false)
  const [loading, setLoading] = useState(true)
  const [likeLoading, setLikeLoading] = useState(false)

  useEffect(() => {
    if (username) {
      loadUser()
    }
  }, [username, loadUser])

  const loadUser = useCallback(async () => {
    try {
      const users = await blink.db.users.list({
        where: { username: username }
      })
      
      if (users.length > 0) {
        const userData = users[0]
        setUser(userData)
        
        // Load likes
        const likesData = await blink.db.profileLikes.list({
          where: { likedUserId: userData.id }
        })
        setLikes(likesData.length)

        // Check if current user has liked this profile
        if (currentUser) {
          const userLike = await blink.db.profileLikes.list({
            where: { 
              userId: currentUser.id,
              likedUserId: userData.id
            }
          })
          setIsLiked(userLike.length > 0)
        }
      }
    } catch (error) {
      console.error('Error loading user:', error)
    } finally {
      setLoading(false)
    }
  }, [username, currentUser])

  const handleLike = async () => {
    if (!isAuthenticated || !currentUser || !user) {
      return
    }

    setLikeLoading(true)
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
      setLikeLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="instagram-card max-w-md w-full mx-4">
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Profile Not Found</h2>
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

  const isOwnProfile = currentUser?.id === user.id

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="gradient-bg text-white py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Button 
            variant="ghost" 
            asChild 
            className="text-white hover:bg-white/10 mb-4"
          >
            <Link to="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Directory
            </Link>
          </Button>
        </div>
      </div>

      {/* Profile Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 relative z-10">
        <Card className="instagram-card">
          <CardContent className="p-8">
            {/* Profile Header */}
            <div className="flex flex-col md:flex-row items-start md:items-center space-y-6 md:space-y-0 md:space-x-8">
              <Avatar className="h-32 w-32 mx-auto md:mx-0">
                <AvatarImage src={user.profileImage} alt={user.fullName} />
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-4xl">
                  {user.fullName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 text-center md:text-left">
                <div className="flex flex-col md:flex-row md:items-center md:space-x-4 mb-4">
                  <h1 className="text-3xl font-bold text-gray-900">{user.fullName}</h1>
                  <Badge variant="secondary" className="w-fit mx-auto md:mx-0">
                    @{user.username}
                  </Badge>
                </div>
                
                {user.bio && (
                  <p className="text-gray-600 text-lg mb-4">{user.bio}</p>
                )}
                
                <div className="flex flex-col sm:flex-row items-center justify-center md:justify-start space-y-2 sm:space-y-0 sm:space-x-6 text-sm text-gray-500">
                  {user.location && (
                    <div className="flex items-center space-x-1">
                      <MapPin className="h-4 w-4" />
                      <span>{user.location}</span>
                    </div>
                  )}
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-4 w-4" />
                    <span>Joined {new Date(user.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center md:justify-start space-y-3 sm:space-y-0 sm:space-x-4">
              {isOwnProfile ? (
                <Button className="w-full sm:w-auto">
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Profile
                </Button>
              ) : (
                <>
                  <Button
                    variant={isLiked ? "default" : "outline"}
                    onClick={handleLike}
                    disabled={likeLoading || !isAuthenticated}
                    className={`w-full sm:w-auto ${
                      isLiked ? 'bg-red-500 hover:bg-red-600 text-white' : ''
                    }`}
                  >
                    <Heart className={`mr-2 h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
                    {likes} {likes === 1 ? 'Like' : 'Likes'}
                  </Button>
                  
                  {isAuthenticated && (
                    <Button asChild className="w-full sm:w-auto gradient-bg">
                      <Link to={`/chat/${user.username}`}>
                        <MessageCircle className="mr-2 h-4 w-4" />
                        Send Message
                      </Link>
                    </Button>
                  )}
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Location Map */}
        {user.latitude && user.longitude && (
          <Card className="instagram-card mt-6">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <MapPin className="mr-2 h-5 w-5" />
                Location
              </h3>
              <div className="bg-gray-100 rounded-lg h-64 flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <MapPin className="h-12 w-12 mx-auto mb-2" />
                  <p className="font-medium">{user.location}</p>
                  <p className="text-sm">
                    {user.latitude.toFixed(4)}, {user.longitude.toFixed(4)}
                  </p>
                  <p className="text-xs mt-2">
                    Google Maps integration coming soon
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6 mb-8">
          <Card className="instagram-card">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-blue-600">{likes}</div>
              <p className="text-gray-600">Profile Likes</p>
            </CardContent>
          </Card>
          
          <Card className="instagram-card">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-green-600">
                {Math.floor(Math.random() * 50) + 10}
              </div>
              <p className="text-gray-600">Connections</p>
            </CardContent>
          </Card>
          
          <Card className="instagram-card">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-purple-600">
                {Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24))}
              </div>
              <p className="text-gray-600">Days Active</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}