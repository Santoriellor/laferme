import React from 'react';
import './CarouselImage.css';

const CarouselImage = ({ imageSrc, altText, bottomText, isActive }) => {
  return (
    <div className={`carousel-image-wrapper ${isActive ? 'active' : ''}`}>
      <img src={imageSrc} alt={altText} className="carousel-image active" />
      <div className="carousel-top-text"></div>
      {/* <div className="carousel-bottom-text">
        <div className="text">{bottomText}</div>
      </div> */}
    </div>
  );
};

export default CarouselImage;
