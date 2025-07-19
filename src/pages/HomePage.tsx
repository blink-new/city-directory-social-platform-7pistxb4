import { useState, useEffect } from 'react'
import { blink } from '../blink/client'
import { useAuth } from '../hooks/useAuth'
import { UserCard } from '../components/profile/UserCard'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Search, Users, MapPin, Plus } from 'lucide-react'
import type { User } from '../types'

export function HomePage() {
  const { user: currentUser, isAuthenticated } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])

  useEffect(() => {
    loadUsers()
  }, [])

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = users.filter(user => 
        user.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.bio?.toLowerCase().includes(searchQuery.toLowerCase())
      )
      setFilteredUsers(filtered)
    } else {
      setFilteredUsers(users)
    }
  }, [searchQuery, users])

  const loadUsers = async () => {
    try {
      const usersData = await blink.db.users.list({
        orderBy: { createdAt: 'desc' },
        limit: 50
      })
      setUsers(usersData)
      setFilteredUsers(usersData)
    } catch (error) {
      console.error('Error loading users:', error)
    } finally {
      setLoading(false)
    }
  }

  const createSampleProfile = async () => {
    if (!currentUser) return
    
    try {
      const username = currentUser.displayName || currentUser.email?.split('@')[0] || 'user'
      
      // First, check if user already exists
      const existingUsers = await blink.db.users.list({
        where: { id: currentUser.id }
      })
      
      if (existingUsers.length > 0) {
        alert('Profile already exists!')
        return
      }
      
      // Create profile data step by step to isolate the issue
      const profileData = {
        id: currentUser.id,
        username: username,
        email: currentUser.email || '',
        fullName: currentUser.displayName || currentUser.email?.split('@')[0] || 'User',
        bio: 'Welcome to CityConnect! I\'m excited to meet new people in the city.',
        location: 'San Francisco, CA'
        // Temporarily remove coordinates to test
      }
      
      console.log('Creating profile with data:', profileData)
      
      await blink.db.users.create(profileData)
      
      // If successful, update with coordinates
      await blink.db.users.update(currentUser.id, {
        latitude: 37.7749,
        longitude: -122.4194
      })
      
      loadUsers()
    } catch (error) {
      console.error('Error creating profile:', error)
      // Show user-friendly error message
      alert('Failed to create profile. Please try again.')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading city directory...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="gradient-bg text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            Connect with Your City
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-blue-100">
            Discover amazing people, share experiences, and build meaningful connections
          </p>
          
          {isAuthenticated ? (
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button 
                onClick={createSampleProfile}
                size="lg" 
                className="bg-white text-blue-600 hover:bg-blue-50"
              >
                <Plus className="mr-2 h-5 w-5" />
                Create Your Profile
              </Button>
              <p className="text-blue-200">Join {users.length} people already connected</p>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-blue-200 mb-4">Join {users.length} people already connected</p>
              <p className="text-sm text-blue-300">Sign in to like profiles and send messages</p>
            </div>
          )}
        </div>
      </div>

      {/* Search and Stats */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          {/* Search */}
          <div className="lg:col-span-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                type="text"
                placeholder="Search by name, username, location, or interests..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12 text-lg"
              />
            </div>
          </div>
          
          {/* Stats */}
          <Card className="instagram-card">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center space-x-2 text-blue-600">
                <Users className="h-5 w-5" />
                <span className="font-semibold">{filteredUsers.length}</span>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                {searchQuery ? 'Results' : 'Total Members'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Results */}
        {filteredUsers.length === 0 ? (
          <Card className="instagram-card">
            <CardContent className="p-12 text-center">
              <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {searchQuery ? 'No results found' : 'No profiles yet'}
              </h3>
              <p className="text-gray-600 mb-6">
                {searchQuery 
                  ? 'Try adjusting your search terms'
                  : 'Be the first to create a profile and connect with others!'
                }
              </p>
              {isAuthenticated && !searchQuery && (
                <Button onClick={createSampleProfile} className="gradient-bg">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Your Profile
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredUsers.map((user) => (
              <UserCard key={user.id} user={user} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}