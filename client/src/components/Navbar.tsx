import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/ThemeProvider";
import { useLanguage } from "@/components/LanguageProvider";
import { useAuth } from "@/hooks/useAuth";
import { AuthModal } from "@/components/AuthModal";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useState, useEffect } from "react";
import { Menu, Moon, Sun, Wrench, User, LogOut, Settings, History, Wallet, BarChart3, MessageCircle, Briefcase, UserCheck, Star, Calendar, TrendingUp } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { NotificationBell } from "./NotificationBell";
import { FloatingRegisterButton } from "./FloatingRegisterButton";
import { AvatarGenerator } from "./AvatarGenerator";
import QuickPostButton from "./QuickPostButton";

export function Navbar() {
  const [location] = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { t } = useLanguage();
  const { user, logout } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [signupInitialTab, setSignupInitialTab] = useState<"client" | "worker">("client");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Fetch worker profile if user is a worker
  const { data: workerProfile } = useQuery({
    queryKey: ["/api/worker/profile", user?.id],
    queryFn: () => user?.role === "worker" ? fetch(`/api/worker/profile/${user.id}`).then(res => res.json()) : null,
    enabled: user?.role === "worker",
  });

  // Get the appropriate profile picture
  const profilePicture = user?.role === "worker" 
    ? workerProfile?.profilePicture || (user as any)?.profilePicture 
    : (user as any)?.profilePicture;

  const handleDashboard = () => {
    if (user?.role === "super_admin" || user?.role === "admin") {
      window.location.href = "/admin-dashboard";
    } else if (user?.role === "worker") {
      window.location.href = "/worker-dashboard";
    } else {
      window.location.href = "/dashboard";
    }
  };

  useEffect(() => {
    const handleOpenRegisterModal = (event: any) => {
      const tabType = event.detail?.tab || "client";
      setSignupInitialTab(tabType);
      setShowSignupModal(true);
    };

    const handleOpenLoginModal = (event: any) => {
      const { mobile, role } = event.detail || {};
      setShowLoginModal(true);
      // Store user data for pre-filling the login form
      sessionStorage.setItem('prefillLoginData', JSON.stringify({ mobile, role }));
    };

    window.addEventListener('openRegisterModal', handleOpenRegisterModal);
    window.addEventListener('openLoginModal', handleOpenLoginModal);
    
    return () => {
      window.removeEventListener('openRegisterModal', handleOpenRegisterModal);
      window.removeEventListener('openLoginModal', handleOpenLoginModal);
    };
  }, []);

  return (
    <>
      <nav className="navbar-fixed">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2">
              <Wrench className="h-8 w-8 text-primary" />
              <span className="text-xl font-bold text-primary">SPANNER</span>
            </Link>

            {/* Desktop Navigation - Quick Join & Quick Post Buttons */}
            <div className="hidden md:flex items-center justify-center flex-1 gap-4">
              <FloatingRegisterButton />
              <QuickPostButton />
              <Link href="/mobile-test" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2">
                <span>📱</span>
                <span>Mobile Test</span>
              </Link>
            </div>

            {/* Controls */}
            <div className="flex items-center space-x-4">

              {/* Theme Toggle */}
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleTheme}
                className="hidden md:flex"
              >
                {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
              </Button>

              {/* Auth Buttons */}
              {user ? (
                <div className="flex items-center space-x-3">
                  {/* Notification Bell */}
                  <NotificationBell />
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-auto p-2 hover:bg-muted hidden md:flex items-center space-x-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage 
                            src={profilePicture || undefined} 
                            alt={`${user.firstName} ${user.lastName}`} 
                          />
                          <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                            {user.firstName?.[0]?.toUpperCase()}{user.lastName?.[0]?.toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col items-start">
                          <span className="text-sm font-medium">
                            {user.firstName}{" "}
                            {user.lastName === "UPDATE_REQUIRED" ? (
                              <span className="text-red-500 text-xs">UPDATE_REQUIRED</span>
                            ) : (
                              user.lastName
                            )}
                          </span>
                          <span className="text-xs text-green-700 dark:text-green-600 font-medium">
                            {user.id}
                          </span>
                        </div>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-80 p-2">
                      {/* User Info Section */}
                      <div className="px-3 py-2 border-b mb-2">
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-12 w-12">
                            <AvatarImage 
                              src={profilePicture || undefined} 
                              alt={`${user.firstName} ${user.lastName}`} 
                            />
                            <AvatarFallback className="bg-primary text-primary-foreground">
                              {user.firstName?.[0]?.toUpperCase()}{user.lastName?.[0]?.toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="font-medium text-sm">
                              {user.firstName} {user.lastName === "UPDATE_REQUIRED" ? (
                                <span className="text-red-500 text-xs">UPDATE_REQUIRED</span>
                              ) : (
                                user.lastName
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground">{user.id}</div>
                            <div className="text-xs text-green-700 dark:text-green-600 font-medium capitalize">
                              {user.role === "super_admin" ? "Super Admin" : user.role}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Dashboard Cards */}
                      <div className="grid grid-cols-2 gap-2 mb-3">
                        {/* Main Dashboard Card */}
                        <div 
                          onClick={handleDashboard}
                          className="p-3 rounded-lg border hover:bg-accent cursor-pointer transition-colors"
                        >
                          <div className="flex items-center space-x-2 mb-1">
                            <Settings className="h-4 w-4 text-primary" />
                            <span className="text-xs font-medium">Dashboard</span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {user.role === "worker" ? "Manage jobs & profile" : 
                             user.role === "admin" || user.role === "super_admin" ? "Platform control" : 
                             "Book services"}
                          </p>
                        </div>

                        {/* Wallet Card (for workers and clients) */}
                        {(user.role === "worker" || user.role === "client") && (
                          <div 
                            onClick={() => window.location.href = "/wallet"}
                            className="p-3 rounded-lg border hover:bg-accent cursor-pointer transition-colors"
                          >
                            <div className="flex items-center space-x-2 mb-1">
                              <Wallet className="h-4 w-4 text-green-600" />
                              <span className="text-xs font-medium">Wallet</span>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {user.role === "worker" ? "Earnings & withdrawals" : "Balance & payments"}
                            </p>
                          </div>
                        )}

                        {/* Analytics Card (for admins) */}
                        {(user.role === "admin" || user.role === "super_admin") && (
                          <div 
                            onClick={() => window.location.href = "/admin/analytics"}
                            className="p-3 rounded-lg border hover:bg-accent cursor-pointer transition-colors"
                          >
                            <div className="flex items-center space-x-2 mb-1">
                              <BarChart3 className="h-4 w-4 text-blue-600" />
                              <span className="text-xs font-medium">Analytics</span>
                            </div>
                            <p className="text-xs text-muted-foreground">Platform insights</p>
                          </div>
                        )}

                        {/* Service History Card */}
                        <div 
                          onClick={() => window.location.href = "/service-history"}
                          className="p-3 rounded-lg border hover:bg-accent cursor-pointer transition-colors"
                        >
                          <div className="flex items-center space-x-2 mb-1">
                            <History className="h-4 w-4 text-orange-600" />
                            <span className="text-xs font-medium">History</span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {user.role === "worker" ? "Job history" : "Service records"}
                          </p>
                        </div>

                        {/* Messages Card */}
                        <div 
                          onClick={() => window.location.href = "/messages"}
                          className="p-3 rounded-lg border hover:bg-accent cursor-pointer transition-colors"
                        >
                          <div className="flex items-center space-x-2 mb-1">
                            <MessageCircle className="h-4 w-4 text-purple-600" />
                            <span className="text-xs font-medium">Messages</span>
                          </div>
                          <p className="text-xs text-muted-foreground">Chat & support</p>
                        </div>

                        {/* Worker-specific cards */}
                        {user.role === "worker" && (
                          <>
                            <div 
                              onClick={() => window.location.href = "/worker-jobs"}
                              className="p-3 rounded-lg border hover:bg-accent cursor-pointer transition-colors"
                            >
                              <div className="flex items-center space-x-2 mb-1">
                                <Briefcase className="h-4 w-4 text-blue-600" />
                                <span className="text-xs font-medium">Active Jobs</span>
                              </div>
                              <p className="text-xs text-muted-foreground">Current bookings</p>
                            </div>
                            
                            <div 
                              onClick={() => window.location.href = "/worker-dashboard#reviews"}
                              className="p-3 rounded-lg border hover:bg-accent cursor-pointer transition-colors"
                            >
                              <div className="flex items-center space-x-2 mb-1">
                                <Star className="h-4 w-4 text-yellow-600" />
                                <span className="text-xs font-medium">Reviews</span>
                              </div>
                              <p className="text-xs text-muted-foreground">Ratings & feedback</p>
                            </div>
                          </>
                        )}

                        {/* Client-specific cards */}
                        {user.role === "client" && (
                          <>
                            <div 
                              onClick={() => window.location.href = "/quick-post"}
                              className="p-3 rounded-lg border hover:bg-accent cursor-pointer transition-colors"
                            >
                              <div className="flex items-center space-x-2 mb-1">
                                <Calendar className="h-4 w-4 text-green-600" />
                                <span className="text-xs font-medium">Book Service</span>
                              </div>
                              <p className="text-xs text-muted-foreground">Quick post job</p>
                            </div>
                            
                            <div 
                              onClick={() => window.location.href = "/find-workers"}
                              className="p-3 rounded-lg border hover:bg-accent cursor-pointer transition-colors"
                            >
                              <div className="flex items-center space-x-2 mb-1">
                                <UserCheck className="h-4 w-4 text-indigo-600" />
                                <span className="text-xs font-medium">Find Workers</span>
                              </div>
                              <p className="text-xs text-muted-foreground">Browse professionals</p>
                            </div>
                          </>
                        )}

                        {/* Admin-specific cards */}
                        {(user.role === "admin" || user.role === "super_admin") && (
                          <>
                            <div 
                              onClick={() => window.location.href = "/admin/workers"}
                              className="p-3 rounded-lg border hover:bg-accent cursor-pointer transition-colors"
                            >
                              <div className="flex items-center space-x-2 mb-1">
                                <UserCheck className="h-4 w-4 text-indigo-600" />
                                <span className="text-xs font-medium">Workers</span>
                              </div>
                              <p className="text-xs text-muted-foreground">Manage workers</p>
                            </div>
                            
                            <div 
                              onClick={() => window.location.href = "/admin/bookings"}
                              className="p-3 rounded-lg border hover:bg-accent cursor-pointer transition-colors"
                            >
                              <div className="flex items-center space-x-2 mb-1">
                                <TrendingUp className="h-4 w-4 text-red-600" />
                                <span className="text-xs font-medium">Bookings</span>
                              </div>
                              <p className="text-xs text-muted-foreground">Platform activity</p>
                            </div>
                          </>
                        )}
                      </div>

                      {/* Avatar Generator Section */}
                      <div className="px-1 py-1 border-t pt-2">
                        <AvatarGenerator />
                      </div>

                      {/* Logout Section */}
                      <div className="border-t pt-2">
                        <DropdownMenuItem onClick={logout} className="cursor-pointer text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950">
                          <LogOut className="mr-2 h-4 w-4" />
                          Logout
                        </DropdownMenuItem>
                      </div>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ) : (
                <div className="hidden md:flex items-center space-x-2">
                  <AvatarGenerator />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowLoginModal(true)}
                    data-login-trigger
                  >
                    Login
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setShowSignupModal(true)}
                  >
                    Register
                  </Button>
                </div>
              )}

              {/* Mobile Menu Button */}
              <Button
                variant="ghost"
                size="sm"
                className="md:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                <Menu className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t py-4 space-y-2">
              
              <div className="px-4 py-2 flex justify-end">
                <Button variant="ghost" size="sm" onClick={toggleTheme}>
                  {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                </Button>
              </div>

              {user ? (
                <div className="px-4 py-2 space-y-2">
                  <div className="flex items-center space-x-3 pb-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage 
                        src={profilePicture || undefined} 
                        alt={`${user.firstName} ${user.lastName}`} 
                      />
                      <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                        {user.firstName[0]}{user.lastName[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="text-sm font-medium">
                      {user.firstName} {user.lastName}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDashboard}
                    className="w-full"
                  >
                    Dashboard
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      window.location.href = "/service-history";
                      setMobileMenuOpen(false);
                    }}
                    className="w-full"
                  >
                    Service History
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={logout}
                    className="w-full"
                  >
                    Logout
                  </Button>
                </div>
              ) : (
                <div className="px-4 py-2 space-y-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowLoginModal(true);
                      setMobileMenuOpen(false);
                    }}
                    className="w-full"
                  >
                    Login
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      setShowSignupModal(true);
                      setMobileMenuOpen(false);
                    }}
                    className="w-full"
                  >
                    Register
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </nav>

      <AuthModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        mode="login"
        onSwitchToSignup={() => {
          setShowLoginModal(false);
          setShowSignupModal(true);
          setSignupInitialTab("client"); // Default to client signup
        }}
      />
      
      <AuthModal
        isOpen={showSignupModal}
        onClose={() => setShowSignupModal(false)}
        mode="signup"
        initialTab={signupInitialTab}
      />
    </>
  );
}
