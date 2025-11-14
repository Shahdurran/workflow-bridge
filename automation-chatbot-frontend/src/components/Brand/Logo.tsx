import { Link } from 'wouter';
import { APP_NAME, APP_TAGLINE } from '@/lib/constants';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  showTagline?: boolean;
  linkTo?: string;
}

export const Logo = ({ 
  size = 'md', 
  showText = true,
  showTagline = false,
  linkTo = '/',
}: LogoProps) => {
  const sizes = {
    sm: {
      container: 'w-6 h-6',
      icon: 'text-base',
      name: 'text-base',
      tagline: 'text-[10px]',
    },
    md: {
      container: 'w-8 h-8',
      icon: 'text-lg',
      name: 'text-lg',
      tagline: 'text-xs',
    },
    lg: {
      container: 'w-10 h-10',
      icon: 'text-xl',
      name: 'text-xl',
      tagline: 'text-sm',
    },
  };

  const sizeClasses = sizes[size];

  const LogoContent = () => (
    <div className="flex items-center gap-2">
      {/* Icon */}
      <div 
        className={`
          bg-gradient-to-br from-blue-500 to-blue-600 
          rounded-lg flex items-center justify-center 
          shadow-sm hover:shadow-md transition-shadow
          ${sizeClasses.container}
        `}
      >
        <span className={`text-white ${sizeClasses.icon}`}>⚡</span>
      </div>
      
      {/* Text */}
      {showText && (
        <div className="flex flex-col">
          <span className={`font-bold leading-none text-gray-900 ${sizeClasses.name}`}>
            {APP_NAME}
          </span>
          {showTagline && (
            <span className={`text-gray-500 leading-none mt-0.5 ${sizeClasses.tagline}`}>
              {APP_TAGLINE}
            </span>
          )}
        </div>
      )}
    </div>
  );

  // If linkTo is provided, wrap in Link
  if (linkTo) {
    return (
      <Link href={linkTo} className="hover:opacity-90 transition-opacity">
        <LogoContent />
      </Link>
    );
  }

  return <LogoContent />;
};

// Alternative logo with different icon
export const LogoAlt = ({ 
  size = 'md', 
  showText = true,
  linkTo = '/',
}: Omit<LogoProps, 'showTagline'>) => {
  const sizes = {
    sm: { container: 'w-6 h-6', icon: 'w-3 h-3', name: 'text-base' },
    md: { container: 'w-8 h-8', icon: 'w-4 h-4', name: 'text-lg' },
    lg: { container: 'w-10 h-10', icon: 'w-5 h-5', name: 'text-xl' },
  };

  const sizeClasses = sizes[size];

  const LogoContent = () => (
    <div className="flex items-center gap-2">
      {/* Workflow/Connection icon */}
      <div 
        className={`
          bg-gradient-to-br from-blue-500 to-blue-600 
          rounded-lg flex items-center justify-center 
          shadow-sm hover:shadow-md transition-shadow
          ${sizeClasses.container}
        `}
      >
        <svg 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="white" 
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={sizeClasses.icon}
        >
          <circle cx="18" cy="5" r="3"/>
          <circle cx="6" cy="12" r="3"/>
          <circle cx="18" cy="19" r="3"/>
          <path d="M8.59 13.51l6.83 3.98"/>
          <path d="M15.41 6.51l-6.82 3.98"/>
        </svg>
      </div>
      
      {/* Text */}
      {showText && (
        <span className={`font-bold leading-none text-gray-900 ${sizeClasses.name}`}>
          {APP_NAME}
        </span>
      )}
    </div>
  );

  if (linkTo) {
    return (
      <Link href={linkTo} className="hover:opacity-90 transition-opacity">
        <LogoContent />
      </Link>
    );
  }

  return <LogoContent />;
};

// Icon-only logo for small spaces
export const LogoIcon = ({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) => {
  const sizes = {
    sm: 'w-6 h-6 text-base',
    md: 'w-8 h-8 text-lg',
    lg: 'w-10 h-10 text-xl',
  };

  return (
    <div 
      className={`
        bg-gradient-to-br from-blue-500 to-blue-600 
        rounded-lg flex items-center justify-center 
        shadow-sm
        ${sizes[size]}
      `}
    >
      <span className="text-white">⚡</span>
    </div>
  );
};

