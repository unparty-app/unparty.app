'use client';

import React, { useState } from 'react';
import IconButton from './IconButton';

const ColorIcon: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <IconButton
      icon="swatch.svg"
      onClick={() => setIsOpen(!isOpen)}
      label="Color SVG"
      className="text-yellow-100"
    />
  );
};

export default ColorIcon;