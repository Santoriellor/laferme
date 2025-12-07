import React, { useContext } from 'react';
import './Footer.css';

import { LanguageContext } from '../context/LanguageContext';

const Footer = () => {
  const { texts } = useContext(LanguageContext);

  return (
    <footer className="footer">
      <p>&copy; 2025 {texts.footerName} | {texts.footerRights}</p>
    </footer>
  );
};

export default Footer;
