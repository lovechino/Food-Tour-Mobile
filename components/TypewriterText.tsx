import React, { useState, useEffect } from 'react';
import { Text, TextStyle } from 'react-native';

interface Props {
  text: string;
  delay?: number;
  style?: TextStyle;
  onComplete?: () => void;
}

export const TypewriterText: React.FC<Props> = ({ text, delay = 15, style, onComplete }) => {
  const [displayedText, setDisplayedText] = useState('');

  useEffect(() => {
    let index = 0;
    setDisplayedText(''); // Reset on new text

    // Initial small delay to simulate thinking before typing
    const startTimeout = setTimeout(() => {
      const timer = setInterval(() => {
        if (index < text.length) {
          // Extract chunk to prevent frame drops on very fast delays
          const nextChar = text.charAt(index);
          setDisplayedText((prev) => prev + nextChar);
          index++;
        } else {
          clearInterval(timer);
          if (onComplete) onComplete();
        }
      }, delay);

      return () => clearInterval(timer);
    }, 150);

    return () => clearTimeout(startTimeout);
  }, [text, delay, onComplete]);

  return <Text style={style}>{displayedText}</Text>;
};
