import React from 'react';
import { View, Text } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

interface DonutChartProps {
  mastered: number;
  learning: number;
  newCards: number;
  size?: number;
  strokeWidth?: number;
  colors: {
    primary: string;
    secondary: string;
    outline: string;
    onSurface: string;
    onSurfaceVariant: string;
  };
}

export function DonutChart({ mastered, learning, newCards, size = 140, strokeWidth = 12, colors }: DonutChartProps) {
  const total = mastered + learning + newCards;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  const masteredPct = total > 0 ? mastered / total : 0;
  const learningPct = total > 0 ? learning / total : 0;
  const newPct = total > 0 ? newCards / total : 0;

  const masteredDash = circumference * masteredPct;
  const learningDash = circumference * learningPct;
  const newDash = circumference * newPct;

  const overallPct = total > 0 ? Math.round((mastered / total) * 100) : 0;

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', width: size, height: size }}>
      <Svg width={size} height={size}>
        {/* Background circle */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={colors.outline}
          strokeWidth={strokeWidth}
          fill="none"
          opacity={0.2}
        />
        {/* New cards segment */}
        {newPct > 0 && (
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke={colors.outline}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={`${newDash} ${circumference - newDash}`}
            strokeDashoffset={-masteredDash - learningDash}
            strokeLinecap="round"
            rotation={-90}
            origin={`${center}, ${center}`}
          />
        )}
        {/* Learning segment */}
        {learningPct > 0 && (
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke={colors.secondary}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={`${learningDash} ${circumference - learningDash}`}
            strokeDashoffset={-masteredDash}
            strokeLinecap="round"
            rotation={-90}
            origin={`${center}, ${center}`}
          />
        )}
        {/* Mastered segment */}
        {masteredPct > 0 && (
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke={colors.primary}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={`${masteredDash} ${circumference - masteredDash}`}
            strokeDashoffset={0}
            strokeLinecap="round"
            rotation={-90}
            origin={`${center}, ${center}`}
          />
        )}
      </Svg>
      {/* Center label */}
      <View style={{ position: 'absolute', alignItems: 'center' }}>
        <Text style={{ fontFamily: 'Manrope-ExtraBold', fontSize: 32, color: colors.onSurface }}>{overallPct}%</Text>
        <Text style={{ fontFamily: 'Inter-SemiBold', fontSize: 10, color: colors.onSurfaceVariant, letterSpacing: 2, marginTop: 2 }}>OVERALL</Text>
      </View>
    </View>
  );
}
