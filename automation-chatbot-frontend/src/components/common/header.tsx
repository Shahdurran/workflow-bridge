import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Brand/Logo";
import { Link, useLocation } from 'wouter';
import { NAV_LINKS, CTA_COPY } from '@/lib/constants';
import { Menu, X, LayoutDashboard, FolderOpen, FileText, Settings as SettingsIcon, Plus } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, signOut } = useAuth();
  const [, setLocation] = useLocation();

  // Authenticated navigation links
  const authenticatedLinks = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/builder', label: 'Create', icon: Plus },
    { href: '/workflows', label: 'My Workflows', icon: FolderOpen },
    { href: '/templates', label: 'Templates', icon: FileText },
  ];

  return (
    <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50" data-testid="header">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Logo size="md" showText={true} showTagline={false} linkTo={user ? '/dashboard' : '/'} />
          
          {user ? (
            // Authenticated Navigation
            <>
              {/* Desktop Navigation */}
              <nav className="hidden md:flex items-center space-x-6">
                {authenticatedLinks.map((link) => {
                  const Icon = link.icon;
                  return (
                    <Link key={link.href} href={link.href}>
                      <a className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
                        <Icon className="w-4 h-4" />
                        {link.label}
                      </a>
                    </Link>
                  );
                })}
              </nav>
              
              {/* Desktop User Actions */}
              <div className="hidden md:flex items-center space-x-3">
                <Button 
                  size="sm"
                  className="bg-blue-600 text-white hover:bg-blue-700"
                  onClick={() => setLocation('/builder')}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  New Workflow
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setLocation('/settings')}>
                  <SettingsIcon className="w-4 h-4 mr-2" />
                  Settings
                </Button>
                <Button variant="outline" size="sm" onClick={() => signOut()}>
                  Sign Out
                </Button>
              </div>
            </>
          ) : (
            // Public Navigation
            <>
              {/* Desktop Navigation */}
              <nav className="hidden md:flex items-center space-x-8">
                {NAV_LINKS.main.map((link) => (
                  <Link key={link.href} href={link.href}>
                    <a className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
                      {link.label}
                    </a>
                  </Link>
                ))}
              </nav>
              
              {/* Desktop CTA Buttons */}
              <div className="hidden md:flex items-center space-x-3">
                <Button variant="ghost" asChild data-testid="button-sign-in">
                  <Link href="/login">
                    <a>{CTA_COPY.login}</a>
                  </Link>
                </Button>
                <Button 
                  className="bg-blue-600 text-white hover:bg-blue-700" 
                  asChild
                  data-testid="button-get-started"
                >
                  <Link href="/signup">
                    <a>{CTA_COPY.primary}</a>
                  </Link>
                </Button>
              </div>
            </>
          )}
          
          {/* Mobile Menu Button */}
          <button 
            className="md:hidden p-2" 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            data-testid="button-mobile-menu"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6 text-gray-600" />
            ) : (
              <Menu className="w-6 h-6 text-gray-600" />
            )}
          </button>
        </div>
        
        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t border-gray-200 pt-4">
            {user ? (
              // Authenticated Mobile Menu
              <nav className="flex flex-col space-y-3">
                {authenticatedLinks.map((link) => {
                  const Icon = link.icon;
                  return (
                    <Link key={link.href} href={link.href}>
                      <a 
                        className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors py-2"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Icon className="w-4 h-4" />
                        {link.label}
                      </a>
                    </Link>
                  );
                })}
                <div className="flex flex-col space-y-2 pt-3 border-t border-gray-200">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start" 
                    onClick={() => {
                      setLocation('/settings');
                      setMobileMenuOpen(false);
                    }}
                  >
                    <SettingsIcon className="w-4 h-4 mr-2" />
                    Settings
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full" 
                    onClick={() => {
                      signOut();
                      setMobileMenuOpen(false);
                    }}
                  >
                    Sign Out
                  </Button>
                </div>
              </nav>
            ) : (
              // Public Mobile Menu
              <nav className="flex flex-col space-y-3">
                {NAV_LINKS.main.map((link) => (
                  <Link key={link.href} href={link.href}>
                    <a 
                      className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors py-2"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {link.label}
                    </a>
                  </Link>
                ))}
                <div className="flex flex-col space-y-2 pt-3 border-t border-gray-200">
                  <Button variant="outline" asChild className="w-full">
                    <Link href="/login">
                      <a onClick={() => setMobileMenuOpen(false)}>{CTA_COPY.login}</a>
                    </Link>
                  </Button>
                  <Button className="bg-blue-600 text-white hover:bg-blue-700 w-full" asChild>
                    <Link href="/signup">
                      <a onClick={() => setMobileMenuOpen(false)}>{CTA_COPY.primary}</a>
                    </Link>
                  </Button>
                </div>
              </nav>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
