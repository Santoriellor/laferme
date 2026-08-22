import React from 'react';
import './CarouselImage.css';

const CarouselImage = ({ imageSrc, altText, isActive }) => {
  return (
    <div className={`carousel-image-wrapper ${isActive ? 'active' : ''}`}>
      <img src={imageSrc} alt={altText} className="carousel-image active" />
      <div className="carousel-top-text"></div>
    </div>
  );
};

export default CarouselImage;
