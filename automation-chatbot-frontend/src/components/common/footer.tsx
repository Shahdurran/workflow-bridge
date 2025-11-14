import { LogoIcon } from "@/components/Brand/Logo";
import { Link } from 'wouter';
import { NAV_LINKS, APP_NAME, APP_DESCRIPTION } from '@/lib/constants';
import { branding } from '@/config/branding';
import { FaTwitter, FaGithub, FaDiscord } from "react-icons/fa";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-gray-300 py-12" data-testid="footer">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand Column */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <LogoIcon size="sm" />
              <span className="font-bold text-white">{APP_NAME}</span>
            </div>
            <p className="text-sm text-gray-400 mb-4">
              {branding.app.shortDescription}
            </p>
            <div className="flex space-x-3">
              <a 
                href={branding.social.twitter.url} 
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-700 transition-colors"
                aria-label="Twitter"
              >
                <FaTwitter className="text-gray-300" size={16} />
              </a>
              <a 
                href={branding.social.github.url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-700 transition-colors"
                aria-label="GitHub"
              >
                <FaGithub className="text-gray-300" size={16} />
              </a>
              <a 
                href={branding.social.discord.url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-700 transition-colors"
                aria-label="Discord"
              >
                <FaDiscord className="text-gray-300" size={16} />
              </a>
            </div>
          </div>
          
          {/* Product Column */}
          <div>
            <h4 className="font-semibold text-white mb-3 text-sm uppercase tracking-wider">Product</h4>
            <ul className="space-y-2">
              {NAV_LINKS.footer.product.map((link) => (
                <li key={link.href}>
                  <Link href={link.href}>
                    <a className="text-sm text-gray-400 hover:text-white transition-colors">
                      {link.label}
                    </a>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          
          {/* Support Column */}
          <div>
            <h4 className="font-semibold text-white mb-3 text-sm uppercase tracking-wider">Support</h4>
            <ul className="space-y-2">
              {NAV_LINKS.footer.support.map((link) => (
                <li key={link.href}>
                  <Link href={link.href}>
                    <a className="text-sm text-gray-400 hover:text-white transition-colors">
                      {link.label}
                    </a>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          
          {/* Company Column */}
          <div>
            <h4 className="font-semibold text-white mb-3 text-sm uppercase tracking-wider">Company</h4>
            <ul className="space-y-2 mb-4">
              {NAV_LINKS.footer.company.map((link) => (
                <li key={link.href}>
                  <Link href={link.href}>
                    <a className="text-sm text-gray-400 hover:text-white transition-colors">
                      {link.label}
                    </a>
                  </Link>
                </li>
              ))}
            </ul>
            
            {/* Status Indicator */}
            <div className="mt-4 pt-4 border-t border-gray-800">
              <p className="text-xs text-gray-500 flex items-center">
                <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
                All systems operational
              </p>
            </div>
          </div>
        </div>
        
        {/* Bottom Bar */}
        <div className="border-t border-gray-800 pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-gray-500">
            &copy; {currentYear} {APP_NAME}. All rights reserved.
          </p>
          <div className="flex items-center gap-6 text-xs text-gray-500">
            <Link href="/privacy">
              <a className="hover:text-gray-400 transition-colors">Privacy Policy</a>
            </Link>
            <Link href="/terms">
              <a className="hover:text-gray-400 transition-colors">Terms of Service</a>
            </Link>
            <Link href="/cookies">
              <a className="hover:text-gray-400 transition-colors">Cookie Policy</a>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
