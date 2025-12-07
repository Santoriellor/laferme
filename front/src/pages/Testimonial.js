import React, { useEffect, useState, useContext } from 'react';
import './Testimonials.css';

import { LanguageContext } from '../context/LanguageContext';

const Testimonials = () => {
  const [testimonials, setTestimonials] = useState([]);

  const { texts } = useContext(LanguageContext);
  
  useEffect(() => {
    fetch('/testimonials/testimonials.json')
      .then((response) => response.json())
      .then((data) => setTestimonials(data))
      .catch((error) => console.error('Error fetching testimonials:', error));
  }, []);

  // Duplicate the testimonials for seamless looping
  const doubledTestimonials = [...testimonials, ...testimonials];

  return (
    <section id="testimonials">
      <h1 className='testimonials-title'>{texts.testimonialsTitle}</h1>
      
      {/* Top Slider - Right to Left */}
      <div className="slider-container">
        <div className="slider slider-left">
          {doubledTestimonials.map((testimonial, index) => (
            <div className="testimonial-card" key={`top-${index}`}>
              <p className="message">"{testimonial.message}"</p>
              <p className="author">- {testimonial.name}, {testimonial.role}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Slider - Left to Right */}
      <div className="slider-container">
        <div className="slider slider-right">
          {doubledTestimonials.map((testimonial, index) => (
            <div className="testimonial-card" key={`bottom-${index}`}>
              <p className="message">"{testimonial.message}"</p>
              <p className="author">- {testimonial.name}, {testimonial.role}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
