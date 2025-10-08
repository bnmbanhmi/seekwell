import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button, IconButton, Menu, MenuItem, Tooltip } from '@mui/material';
import LanguageIcon from '@mui/icons-material/Language';
import './LanguageSwitcher.css';

interface LanguageSwitcherProps {
  variant?: 'button' | 'icon';
  size?: 'small' | 'medium' | 'large';
}

const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ 
  variant = 'button',
  size = 'small'
}) => {
  const { i18n } = useTranslation();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const currentLanguage = i18n.language || 'en';

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLanguageChange = (lang: string) => {
    i18n.changeLanguage(lang);
    localStorage.setItem('preferredLanguage', lang);
    handleClose();
  };

  const getLanguageLabel = (lang: string) => {
    switch (lang) {
      case 'en':
        return 'English';
      case 'vi':
        return 'Tiếng Việt';
      default:
        return 'English';
    }
  };

  const getLanguageFlag = (lang: string) => {
    switch (lang) {
      case 'en':
        return '🇺🇸';
      case 'vi':
        return '🇻🇳';
      default:
        return '🌐';
    }
  };

  if (variant === 'icon') {
    return (
      <>
        <Tooltip title="Change Language">
          <IconButton
            onClick={handleClick}
            size={size}
            className="language-switcher-icon"
            aria-controls={open ? 'language-menu' : undefined}
            aria-haspopup="true"
            aria-expanded={open ? 'true' : undefined}
          >
            <LanguageIcon />
          </IconButton>
        </Tooltip>
        <Menu
          id="language-menu"
          anchorEl={anchorEl}
          open={open}
          onClose={handleClose}
          MenuListProps={{
            'aria-labelledby': 'language-button',
          }}
        >
          <MenuItem 
            onClick={() => handleLanguageChange('en')}
            selected={currentLanguage === 'en'}
          >
            <span className="language-flag">🇺🇸</span> English
          </MenuItem>
          <MenuItem 
            onClick={() => handleLanguageChange('vi')}
            selected={currentLanguage === 'vi'}
          >
            <span className="language-flag">🇻🇳</span> Tiếng Việt
          </MenuItem>
        </Menu>
      </>
    );
  }

  return (
    <>
      <Button
        onClick={handleClick}
        variant="outlined"
        size={size}
        startIcon={<span>{getLanguageFlag(currentLanguage)}</span>}
        className="language-switcher-button"
        aria-controls={open ? 'language-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
      >
        {getLanguageLabel(currentLanguage)}
      </Button>
      <Menu
        id="language-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{
          'aria-labelledby': 'language-button',
        }}
      >
        <MenuItem 
          onClick={() => handleLanguageChange('en')}
          selected={currentLanguage === 'en'}
        >
          <span className="language-flag">🇺🇸</span> English
        </MenuItem>
        <MenuItem 
          onClick={() => handleLanguageChange('vi')}
          selected={currentLanguage === 'vi'}
        >
          <span className="language-flag">🇻🇳</span> Tiếng Việt
        </MenuItem>
      </Menu>
    </>
  );
};

export default LanguageSwitcher;
