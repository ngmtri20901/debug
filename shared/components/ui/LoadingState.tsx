'use client'
import React, { useState, useEffect } from 'react';
import Image from 'next/image';

const LoadingState: React.FC = () => {
  const [currentImage, setCurrentImage] = useState<string>('');
  const [currentPhrase, setCurrentPhrase] = useState<string>(''); // Thêm state cho cụm từ loading


  const loadingImages = [
    '/images/loading/banh-mi.webp',
    '/images/loading/cafe.webp',
    '/images/loading/lotus.webp',
    '/images/loading/non-la.webp',
    '/images/loading/pho.webp'
  ];

  const loadingPhrases = [
    "Connecting you to Vietnam...",
    "Bringing you the best of Vietnamese...",
    "Loading your learning experience..."
  ];

  useEffect(() => {
    // Randomly select an image when component mounts
    const randomIndex = Math.floor(Math.random() * loadingImages.length);
    setCurrentImage(loadingImages[randomIndex]);
    // Randomly select a phrase when component mounts
    const randomPhraseIndex = Math.floor(Math.random() * loadingPhrases.length);
    setCurrentPhrase(loadingPhrases[randomPhraseIndex]);
  }, []);



  if (!currentImage) return null;

  return (
    <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
      <div className="flex flex-col items-center space-y-6">
        {/* Loading Image with Swaying Animation */}
        <div className="relative">
          <Image
            src={currentImage}
            alt="Loading"
            width={120}
            height={120}
            className="animate-sway drop-shadow-lg"
            priority
          />
        </div>
        
        {/* Loading Text */}
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
          {currentPhrase}
          </h2>
          <div className="flex space-x-1 justify-center">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadingState; 