import React, { useState, useEffect, useContext } from 'react';
import './Navbar.css';

import { LanguageContext } from '../context/LanguageContext';

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  const { texts } = useContext(LanguageContext);

  const toggleMenu = () => setMenuOpen(!menuOpen);
  const toggleDropdown = () => setShowDropdown(!showDropdown);

  const scrollToSection = (id) => {
    const section = document.getElementById(id);
    if (section) {
      const offset = -110;
      const sectionPosition = section.getBoundingClientRect().top + window.scrollY + offset;
      window.scrollTo({ top: sectionPosition, behavior: 'smooth' });
      setMenuOpen(false);
      setShowDropdown(false);
    }
  };

  // Track window width
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <nav className="navbar">
      {/* Full Menu for width > 1030px */}
      {windowWidth > 1151 && (
        <div className="menu">
          <button onClick={() => scrollToSection('fundraiser')}>{texts.menuHome}</button>
          <button onClick={() => scrollToSection('about-us')}>{texts.menuAboutUs}</button>
          <button onClick={() => scrollToSection('contact')}>{texts.menuContact}</button>
          <button onClick={() => scrollToSection('blog')}>{texts.menuNews}</button>
          <button onClick={() => scrollToSection('showcase')}>{texts.menuGallery}</button>
          {/* <button onClick={() => scrollToSection('biking-tour')}>Biking Tour</button>
          <button onClick={() => scrollToSection('horse-riding')}>Horse Riding</button> */}
          <button onClick={() => scrollToSection('testimonials')}>{texts.menuTestimonials}</button>
        </div>
      )}

      {/* Dropdown Menu for width between 1150px and 1051px */}
      {windowWidth <= 1150 && windowWidth > 1051 && (
        <div className="menu">
          <button onClick={() => scrollToSection('fundraiser')}>{texts.menuHome}</button>
          <button onClick={() => scrollToSection('about-us')}>{texts.menuAboutUs}</button>
          <button onClick={() => scrollToSection('contact')}>{texts.menuContact}</button>
          <button onClick={() => scrollToSection('blog')}>{texts.menuNews}</button>
          <button onClick={() => scrollToSection('showcase')}>{texts.menuGallery}</button>

          <div className="dropdown">
            <button onClick={toggleDropdown}>{texts.menuMore}</button>
            {showDropdown && (
              <div className="dropdown-content">
                {/* <button onClick={() => scrollToSection('biking-tour')}>Biking Tour</button>
                <button onClick={() => scrollToSection('horse-riding')}>Horse Riding</button> */}
                <button onClick={() => scrollToSection('testimonials')}>{texts.menuTestimonials}</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Dropdown Menu for width between 901 and 1050px */}
      {windowWidth <= 1050 && windowWidth > 901 && (
        <div className="menu">
          <button onClick={() => scrollToSection('fundraiser')}>{texts.menuHome}</button>
          <button onClick={() => scrollToSection('about-us')}>{texts.menuAboutUs}</button>
          <button onClick={() => scrollToSection('contact')}>{texts.menuContact}</button>
          <button onClick={() => scrollToSection('blog')}>{texts.menuNews}</button>

          <div className="dropdown">
            <button onClick={toggleDropdown}>{texts.menuMore}</button>
            {showDropdown && (
              <div className="dropdown-content">
                {/* <button onClick={() => scrollToSection('biking-tour')}>Biking Tour</button>
                <button onClick={() => scrollToSection('horse-riding')}>Horse Riding</button> */}
                <button onClick={() => scrollToSection('showcase')}>{texts.menuGallery}</button>
                <button onClick={() => scrollToSection('testimonials')}>{texts.menuTestimonials}</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Dropdown Menu for width between 768px and 900px */}
      {windowWidth <= 900 && windowWidth > 768 && (
        <div className="menu">
          <button onClick={() => scrollToSection('fundraiser')}>{texts.menuHome}</button>
          <button onClick={() => scrollToSection('about-us')}>{texts.menuAboutUs}</button>
          <button onClick={() => scrollToSection('contact')}>{texts.menuContact}</button>

          <div className="dropdown">
            <button onClick={toggleDropdown}>{texts.menuMore}</button>
            {showDropdown && (
              <div className="dropdown-content">
                {/* <button onClick={() => scrollToSection('biking-tour')}>Biking Tour</button>
                <button onClick={() => scrollToSection('horse-riding')}>Horse Riding</button> */}
                <button onClick={() => scrollToSection('blog')}>{texts.menuNews}</button>
                <button onClick={() => scrollToSection('showcase')}>{texts.menuGallery}</button>
                <button onClick={() => scrollToSection('testimonials')}>{texts.menuTestimonials}</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Dropdown Menu for width between 675px and 767px */}
      {windowWidth <= 767 && windowWidth > 675 && (
        <div className="menu">
          <button onClick={() => scrollToSection('fundraiser')}>{texts.menuHome}</button>
          <button onClick={() => scrollToSection('about-us')}>{texts.menuAboutUs}</button>

          <div className="dropdown">
            <button onClick={toggleDropdown}>{texts.menuMore}</button>
            {showDropdown && (
              <div className="dropdown-content">
                {/* <button onClick={() => scrollToSection('biking-tour')}>Biking Tour</button>
                <button onClick={() => scrollToSection('horse-riding')}>Horse Riding</button> */}
                <button onClick={() => scrollToSection('contact')}>{texts.menuContact}</button>
                <button onClick={() => scrollToSection('blog')}>{texts.menuNews}</button>
                <button onClick={() => scrollToSection('showcase')}>{texts.menuGallery}</button>
                <button onClick={() => scrollToSection('testimonials')}>{texts.menuTestimonials}</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Hamburger Menu for width <= 674px */}
      {windowWidth <= 674 && (
        <>
          <div className={`menu ${menuOpen ? 'open' : ''}`}>
          <button onClick={() => scrollToSection('fundraiser')}>{texts.menuHome}</button>
          <button onClick={() => scrollToSection('about-us')}>{texts.menuAboutUs}</button>
          <button onClick={() => scrollToSection('contact')}>{texts.menuContact}</button>
          <button onClick={() => scrollToSection('blog')}>{texts.menuNews}</button>
          {/* <button onClick={() => scrollToSection('biking-tour')}>Biking Tour</button>
          <button onClick={() => scrollToSection('horse-riding')}>Horse Riding</button> */}
          <button onClick={() => scrollToSection('showcase')}>{texts.menuGallery}</button>
          <button onClick={() => scrollToSection('testimonials')}>{texts.menuTestimonials}</button>
          </div>

          {/* Hamburger icon */}
          <div className="toggle" onClick={toggleMenu}>
            {menuOpen ? '✖' : '☰'}
          </div>
        </>
      )}
    </nav>
  );
};

export default Navbar;
