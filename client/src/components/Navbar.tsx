import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/ThemeProvider";
import { useLanguage } from "@/components/LanguageProvider";
import { useAuth } from "@/hooks/useAuth";
import { AuthModal } from "@/components/AuthModal";
import { useState, useEffect } from "react";
import { Menu, Moon, Sun, Wrench } from "lucide-react";

export function Navbar() {
  const [location] = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const { user, logout } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
    const handleOpenRegisterModal = () => {
      setShowSignupModal(true);
    };

    window.addEventListener('openRegisterModal', handleOpenRegisterModal);
    
    return () => {
      window.removeEventListener('openRegisterModal', handleOpenRegisterModal);
    };
  }, []);

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2">
              <Wrench className="h-8 w-8 text-primary" />
              <span className="text-xl font-bold text-primary">SPANNER</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <Link 
                href="/#services" 
                className="text-sm font-medium hover:text-primary transition-colors"
              >
                {t("nav.services")}
              </Link>
              <Link 
                href="/#workers" 
                className="text-sm font-medium hover:text-primary transition-colors"
              >
                {t("nav.findWorkers")}
              </Link>
              <Link 
                href="/#districts" 
                className="text-sm font-medium hover:text-primary transition-colors"
              >
                {t("nav.districts")}
              </Link>
              <Link 
                href="/#about" 
                className="text-sm font-medium hover:text-primary transition-colors"
              >
                {t("nav.about")}
              </Link>
            </div>

            {/* Controls */}
            <div className="flex items-center space-x-4">
              {/* Language Toggle */}
              <div className="hidden md:flex border rounded-md">
                <Button
                  variant={language === "en" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setLanguage("en")}
                  className="px-3 py-1 text-xs"
                >
                  EN
                </Button>
                <Button
                  variant={language === "ta" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setLanguage("ta")}
                  className="px-3 py-1 text-xs"
                >
                  தமிழ்
                </Button>
              </div>

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
                <div className="flex items-center space-x-2">
                  <span className="text-sm hidden md:block">
                    {user.firstName} {user.lastName}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDashboard}
                    className="hidden md:flex"
                  >
                    Dashboard
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={logout}
                    className="hidden md:flex"
                  >
                    Logout
                  </Button>
                </div>
              ) : (
                <div className="hidden md:flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowLoginModal(true)}
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
              <Link 
                href="/#services" 
                className="block px-4 py-2 text-sm hover:bg-muted rounded-md"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t("nav.services")}
              </Link>
              <Link 
                href="/#workers" 
                className="block px-4 py-2 text-sm hover:bg-muted rounded-md"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t("nav.findWorkers")}
              </Link>
              <Link 
                href="/#districts" 
                className="block px-4 py-2 text-sm hover:bg-muted rounded-md"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t("nav.districts")}
              </Link>
              <Link 
                href="/#about" 
                className="block px-4 py-2 text-sm hover:bg-muted rounded-md"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t("nav.about")}
              </Link>
              
              <div className="px-4 py-2 flex items-center justify-between">
                <div className="flex border rounded-md">
                  <Button
                    variant={language === "en" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setLanguage("en")}
                    className="px-3 py-1 text-xs"
                  >
                    EN
                  </Button>
                  <Button
                    variant={language === "ta" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setLanguage("ta")}
                    className="px-3 py-1 text-xs"
                  >
                    தமிழ்
                  </Button>
                </div>
                
                <Button variant="ghost" size="sm" onClick={toggleTheme}>
                  {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                </Button>
              </div>

              {user ? (
                <div className="px-4 py-2 space-y-2">
                  <div className="text-sm font-medium">
                    {user.firstName} {user.lastName}
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
      />
      
      <AuthModal
        isOpen={showSignupModal}
        onClose={() => setShowSignupModal(false)}
        mode="signup"
      />
    </>
  );
}
