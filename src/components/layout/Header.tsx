import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { Button } from '../ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '../ui/dropdown-menu'
import { MapPin, MessageCircle, User, LogOut, Menu, X } from 'lucide-react'

export function Header() {
  const { user, login, logout, isAuthenticated } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="gradient-bg text-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <MapPin className="h-8 w-8" />
            <span className="text-xl font-bold">CityConnect</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link to="/" className="hover:text-blue-200 transition-colors">
              Directory
            </Link>
            {isAuthenticated && (
              <>
                <Link to="/chat" className="hover:text-blue-200 transition-colors flex items-center space-x-1">
                  <MessageCircle className="h-4 w-4" />
                  <span>Messages</span>
                </Link>
                <Link to={`/user/${user?.displayName || user?.email?.split('@')[0]}`} className="hover:text-blue-200 transition-colors flex items-center space-x-1">
                  <User className="h-4 w-4" />
                  <span>Profile</span>
                </Link>
              </>
            )}
          </nav>

          {/* Auth Section */}
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src="" alt={user?.displayName || user?.email} />
                      <AvatarFallback className="bg-white text-blue-600">
                        {(user?.displayName || user?.email)?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuItem asChild>
                    <Link to={`/user/${user?.displayName || user?.email?.split('@')[0]}`} className="flex items-center">
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/chat" className="flex items-center">
                      <MessageCircle className="mr-2 h-4 w-4" />
                      <span>Messages</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={logout} className="flex items-center">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button onClick={login} variant="secondary" className="bg-white text-blue-600 hover:bg-blue-50">
                Sign In
              </Button>
            )}

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-blue-400">
            <nav className="flex flex-col space-y-2">
              <Link 
                to="/" 
                className="px-3 py-2 hover:bg-blue-600 rounded transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Directory
              </Link>
              {isAuthenticated && (
                <>
                  <Link 
                    to="/chat" 
                    className="px-3 py-2 hover:bg-blue-600 rounded transition-colors flex items-center space-x-2"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <MessageCircle className="h-4 w-4" />
                    <span>Messages</span>
                  </Link>
                  <Link 
                    to={`/user/${user?.displayName || user?.email?.split('@')[0]}`}
                    className="px-3 py-2 hover:bg-blue-600 rounded transition-colors flex items-center space-x-2"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <User className="h-4 w-4" />
                    <span>Profile</span>
                  </Link>
                </>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}