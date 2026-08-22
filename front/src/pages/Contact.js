import React, { useEffect, useRef, useState, useContext } from 'react';
import './Contact.css';

import { LanguageContext } from '../context/LanguageContext';

const Contact = () => {
  const sectionRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  const { texts } = useContext(LanguageContext);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.2 },
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section id="contact" ref={sectionRef} className={isVisible ? 'visible' : ''}>
      <h2 className="contact-title">{texts.contactTitle}</h2>
      <p className="contact-description">{texts.contactDescr}</p>
      <form className="contact-form">
        <input
          type="text"
          name="name"
          aria-label={texts.contactName}
          placeholder={texts.contactName}
          required
        />
        <input
          type="email"
          name="email"
          aria-label={texts.contactEmail}
          placeholder={texts.contactEmail}
          required
        />
        <textarea
          name="message"
          aria-label={texts.contactMsg}
          placeholder={texts.contactMsg}
          required
        ></textarea>
        <button type="submit">{texts.contactSend}</button>
      </form>
    </section>
  );
};

export default Contact;
