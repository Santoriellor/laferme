import React, { useEffect, useRef, useState, useContext } from 'react';
import './Fundraiser.css';

import { LanguageContext } from '../context/LanguageContext';

const Fundraiser = () => {
  const sectionRef = useRef(null);
  const [showFixedButton, setShowFixedButton] = useState(false);
  const [raised, setRaised] = useState(1500);  // Amount raised so far
  const goal = 10000;  // Fundraising goal
  const progressPercentage = (raised / goal) * 100;
  const progressRef = useRef(null);

  const { texts } = useContext(LanguageContext);
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setShowFixedButton(!entry.isIntersecting);
      },
      { threshold: 0.5 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const fillBar = document.querySelector('.progress-fill');
    if (fillBar) {
      fillBar.style.setProperty('--progress-width', `${progressPercentage}%`);
      fillBar.classList.add('active');
    }
  }, [progressPercentage]);

  return (
    <section id="fundraiser" ref={sectionRef}>
      <div className="overlay">
        <div className="fundraiser-content">
          <h1>{texts.fundraiserTitle}</h1>
          <p>{texts.fundraiserText}</p>
          
          <div className="progress-bar">
            <div
              ref={progressRef} 
              className="progress-fill" 
              style={{ '--progress-width': `${progressPercentage}%` }}
            ></div>
          </div>
          <p className="goal-text">${raised.toLocaleString()}{texts.fundraiserProgressGoalBefore} ${goal.toLocaleString()}{texts.fundraiserProgressGoalAfter}</p>

          <button className="donate-btn">{texts.fundraiserDonate}</button>
          {/* <button className="learn-btn">{texts.fundraiserLearnMore}</button> */}
        </div>
      </div>
      <div class={`fixed-donate-btn-wrapper ${showFixedButton ? 'show' : ''}`}>
        <button className="fixed-donate-btn">{texts.fundraiserDonateFixed}</button>
      </div>  
    </section>
  );
};

export default Fundraiser;
