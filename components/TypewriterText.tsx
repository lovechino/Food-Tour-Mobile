import React, { useState, useEffect } from 'react';
import { Text, TextProps } from 'react-native';

interface TypewriterTextProps extends TextProps {
    text: string;
    speed?: number; // ms per char (default 30)
    onComplete?: () => void;
}

export const TypewriterText: React.FC<TypewriterTextProps> = ({
    text,
    speed = 20,
    onComplete,
    style,
    ...props
}) => {
    const [displayedText, setDisplayedText] = useState("");

    useEffect(() => {
        let index = 0;
        setDisplayedText(""); // Reset text when new text comes in

        const interval = setInterval(() => {
            index++;
            setDisplayedText(text.slice(0, index));

            if (index >= text.length) {
                clearInterval(interval);
                if (onComplete) onComplete();
            }
        }, speed);

        return () => clearInterval(interval);
    }, [text, speed]);

    return (
        <Text style={style} {...props}>
            {displayedText}
            {displayedText.length < text.length && " ▋"}
        </Text>
    );
};
