import React, { createContext, useState, useEffect} from 'react';
import en from '../assets/locales/en.json';
import fr from '../assets/locales/fr.json';
import de from '../assets/locales/de.json';

export const LanguageContext = createContext();

const languages = {
    en,
    fr,
    de,
  };

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState('en');
  const [texts, setTexts] = useState(languages[language]);
  
  useEffect(() => {
    setTexts(languages[language]);
  }, [language]);

  const toggleLanguage = (lang) => {
    if (languages[lang]) {
      setLanguage(lang);
    }
  };

  return (
    <LanguageContext.Provider value={{ language, texts, toggleLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

