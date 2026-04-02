/**
 * components/GlassmorphismCard.tsx
 * Adaptive rendering: tắt blur trên Android low-end (Mali GPU).
 * High-end: Giữ visual frosted glass.
 * Low-end: Semi-transparent fallback — 0 GPU cost, visual tương tự.
 */
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { detectLowEndDevice } from '../utils/deviceCapability';

interface Props {
  children: React.ReactNode;
  style?: ViewStyle;
}

export const GlassmorphismCard: React.FC<Props> = ({ children, style }) => {
  const [isLowEnd, setIsLowEnd] = useState(false);

  useEffect(() => {
    detectLowEndDevice().then(setIsLowEnd);
  }, []);

  const cardStyle = isLowEnd ? styles.cardLowEnd : styles.card;

  return (
    <View style={[cardStyle, style]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: 24,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#B0C4DE',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.6)',
  },
  // Low-end: bỏ shadow nặng + opacity cao hơn → visual clean, 0 GPU cost
  cardLowEnd: {
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderRadius: 24,
    padding: 16,
    marginVertical: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
  },
});
