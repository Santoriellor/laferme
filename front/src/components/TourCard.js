import React from 'react';
import { Link } from 'react-router-dom';

const TourCard = ({ title, description, image, link }) => {
  return (
    <div className="tour-card">
      <img src={image} alt={title} />
      <h3>{title}</h3>
      <p>{description}</p>
      <Link to={link}>
        <button>Learn More</button>
      </Link>
    </div>
  );
};

export default TourCard;
