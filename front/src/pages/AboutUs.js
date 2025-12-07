import React, { useEffect, useRef, useState, useContext } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTwitter, faLinkedin, faFacebook } from '@fortawesome/free-brands-svg-icons';

import './AboutUs.css';
import { LanguageContext } from '../context/LanguageContext';

const AboutUs = () => {
  const sectionRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);
  const [teamData, setTeamData] = useState([]);

  const { language, texts } = useContext(LanguageContext);

  useEffect(() => {
    import(`../assets/locales/about_us_${language}.json`)
      .then((data) => setTeamData(data.team))
      .catch((error) => console.error("Error loading team data:", error));
  }, [language]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true); // Trigger animation
        }
      },
      { threshold: 0.2 } // Trigger when 20% of the section is visible
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect(); // Cleanup
  }, []);

  return (
    <section id="about-us" ref={sectionRef}>
      <h1 className={`about-title ${isVisible ? 'active' : ''}`}>{texts.menuAboutUs}</h1>
      <div className="about-container">
        {teamData.map((person, index) => (
          <div key={index} className={`our-team ${isVisible ? 'active' : ''}`}>
              <img src={person.image} alt={person.name} />
              <div className="over-layer">
                  <div className="team-content">
                      <h3 className="title">{person.name}</h3>
                      <span className="post">{person.position}</span>
                      <p className="description">{person.description}</p>
                  </div>
              </div>
              <ul className="social-links">
                <li><a href={person.socialLinks.twitter}><FontAwesomeIcon icon={faTwitter} /></a></li>
                <li><a href={person.socialLinks.linkedin}><FontAwesomeIcon icon={faLinkedin} /></a></li>
                <li><a href={person.socialLinks.facebook}><FontAwesomeIcon icon={faFacebook} /></a></li>
              </ul>
          </div>
        ))}
      </div>
    </section>
  );
};

export default AboutUs;
