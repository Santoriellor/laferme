import React, { useState, useEffect, useCallback } from 'react';
import './Carousel.css';
import CarouselImage from './CarouselImage.js';

import farmImage from '../assets/images/farm-in-tuscany.jpg';
import bikeImage from '../assets/images/bike-tour-tuscany.jpg';
import horseImage from '../assets/images/horse-riding-tuscany.jpg';

const Carousel = () => {
  const images = [
    { src: farmImage, alt: 'Image 1', text: 'Text describing the general activities around the farm' },
    { src: bikeImage, alt: 'Image 2', text: 'Text describing the biking activities around the farm' },
    { src: horseImage, alt: 'Image 3', text: 'Text describing the horse riding activities around the farm' },
    // Add more images as needed
  ];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [transitioning, setTransitioning] = useState(false);

  // Use useCallback to memorize the functions
  const nextSlide = useCallback(() => {
    setTransitioning(true);
    setTimeout(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
      setTransitioning(false);
    }, 500); // Match the CSS transition duration
  }, [images.length]);

  const prevSlide = useCallback(() => {
    setTransitioning(true);
    setTimeout(() => {
      setCurrentIndex(
        (prevIndex) => (prevIndex - 1 + images.length) % images.length
      );
      setTransitioning(false);
    }, 500); // Match the CSS transition duration
  }, [images.length]);

  // Auto-slide if not hovered
  useEffect(() => {
    let interval;
    if (!isHovered) {
      interval = setInterval(nextSlide, 3000); // Change every 3 seconds
    }
    return () => clearInterval(interval);
  }, [isHovered, nextSlide]); // Use nextSlide without currentIndex dependency

  // Handle clicking on the indicators
  const goToSlide = (index) => {
    if (!transitioning) {
        setCurrentIndex(index);
      }
  };

  return (
    <div
      className="carousel"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="carousel-image-container">
        {images.map((image, index) => (
          <CarouselImage
            key={index}
            imageSrc={image.src}
            altText={image.alt}
            bottomText={image.text}
            isActive={index === currentIndex} // Pass active state
          />
        ))}
      </div>
        
      {/* Left Arrow */}
      <button className="arrow left" onClick={prevSlide}>
        &#10094;
      </button>

      {/* Right Arrow */}
      <button className="arrow right" onClick={nextSlide}>
        &#10095;
      </button>

      {/* Indicators */}
      <div className="carousel-indicators">
        {images.map((image, index) => (
          <span
            key={index}
            className={`indicator ${index === currentIndex ? 'active' : ''}`}
            onClick={() => goToSlide(index)}
          ></span>
        ))}
      </div>
    </div>
  );
};

export default Carousel;
