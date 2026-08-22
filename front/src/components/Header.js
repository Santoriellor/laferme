import React, { useContext } from 'react';
import './Header.css';
import Navbar from './Navbar';

import { LanguageContext } from '../context/LanguageContext';

const Header = () => {
  const { texts, toggleLanguage, language } = useContext(LanguageContext);

  return (
    <header className="header">
      <div className="header-company">
        <img className="header-logo" src="laferme.png" alt="La Ferme" />
        <h1 className="header-title">{texts.headerTitle}</h1>
      </div>
      <div className="header-navbar">
        <select
          className="language-select"
          aria-label={texts.languageLabel}
          value={language}
          onChange={(e) => toggleLanguage(e.target.value)}
        >
          <option value="en">🇬🇧</option>
          <option value="fr">🇫🇷</option>
          <option value="de">🇩🇪</option>
        </select>
        {/* Menu */}
        <Navbar />
      </div>
    </header>
  );
};

export default Header;
