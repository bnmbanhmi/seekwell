import React, { useState, useEffect } from 'react';

interface LogoProps {
  className?: string;
  alt?: string;
  height?: number;
}

const Logo: React.FC<LogoProps> = ({ 
  className = '', 
  alt = 'SeekWell Logo',
  height = 30 
}) => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    // Check if user has dark mode preference
    const checkDarkMode = () => {
      // Check for explicit dark mode class on body or html
      const bodyDark = document.body.classList.contains('dark') || 
                      document.documentElement.classList.contains('dark');
      
      // Check CSS media query for dark mode
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      
      // Check for dark mode in localStorage (common pattern)
      const storedTheme = localStorage.getItem('theme');
      
      return bodyDark || (storedTheme === 'dark') || 
             (!storedTheme && mediaQuery.matches);
    };

    setIsDarkMode(checkDarkMode());

    // Listen for theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => setIsDarkMode(checkDarkMode());
    
    mediaQuery.addEventListener('change', handleChange);
    
    // Also listen for class changes on document
    const observer = new MutationObserver(handleChange);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['class']
    });

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
      observer.disconnect();
    };
  }, []);

  // Use appropriate logo based on theme
  const logoSrc = isDarkMode ? '/seekwell-logo-light.png' : '/seekwell-logo-dark.png';

  return (
    <img
      src={logoSrc}
      alt={alt}
      className={className}
      style={{ height: `${height}px` }}
      onError={(e) => {
        // Fallback to light logo if dark logo fails to load
        const target = e.target as HTMLImageElement;
        if (target.src.includes('seekwell-logo-dark.png')) {
          target.src = '/seekwell-logo-light.png';
        }
      }}
    />
  );
};

export default Logo;
