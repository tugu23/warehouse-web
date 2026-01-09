import { IconButton, Menu, MenuItem, Box, Typography } from '@mui/material';
import { Language as LanguageIcon } from '@mui/icons-material';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

const languages = [
  { code: 'mn', name: 'Монгол', flag: '🇲🇳' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'kr', name: '한국어', flag: '🇰🇷' },
];

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLanguageChange = (languageCode: string) => {
    i18n.changeLanguage(languageCode);
    handleClose();
  };

  const currentLanguage = languages.find((lang) => lang.code === i18n.language) ?? languages[0]!;

  return (
    <>
      <IconButton
        onClick={handleClick}
        color="inherit"
        sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
      >
        <Box component="span" sx={{ fontSize: '1.5rem' }}>
          {currentLanguage.flag}
        </Box>
        <LanguageIcon />
      </IconButton>
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleClose}>
        {languages.map((language) => (
          <MenuItem
            key={language.code}
            onClick={() => handleLanguageChange(language.code)}
            selected={i18n.language === language.code}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="body1" component="span" sx={{ fontSize: '1.5rem' }}>
                {language.flag}
              </Typography>
              <Typography variant="body2">{language.name}</Typography>
            </Box>
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
