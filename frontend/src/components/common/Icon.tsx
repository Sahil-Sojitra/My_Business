import React from 'react';
import { StyleSheet, View } from 'react-native';

interface IconProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
}

/**
 * Production-grade vector ArrowLeft icon (stem + arrowhead)
 * Pixel-perfect geometric rendering without relying on font glyphs
 */
export const ArrowLeft: React.FC<IconProps> = ({
  size = 20,
  color = '#0F172A',
  strokeWidth = 2.4,
}) => {
  const headSize = Math.round(size * 0.44);
  const stemWidth = Math.round(size * 0.68);

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* Horizontal stem */}
      <View
        style={[
          styles.stem,
          {
            width: stemWidth,
            height: strokeWidth,
            backgroundColor: color,
            borderRadius: strokeWidth / 2,
            left: Math.round(size * 0.16),
          },
        ]}
      />
      {/* Arrowhead */}
      <View
        style={[
          styles.arrowheadLeft,
          {
            left: Math.round(size * 0.14),
            width: headSize,
            height: headSize,
            borderLeftWidth: strokeWidth,
            borderBottomWidth: strokeWidth,
            borderColor: color,
          },
        ]}
      />
    </View>
  );
};

/**
 * Production-grade vector ArrowRight icon (stem + arrowhead)
 */
export const ArrowRight: React.FC<IconProps> = ({
  size = 18,
  color = '#2563EB',
  strokeWidth = 2.2,
}) => {
  const headSize = Math.round(size * 0.44);
  const stemWidth = Math.round(size * 0.68);

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* Horizontal stem */}
      <View
        style={[
          styles.stem,
          {
            width: stemWidth,
            height: strokeWidth,
            backgroundColor: color,
            borderRadius: strokeWidth / 2,
            right: Math.round(size * 0.16),
          },
        ]}
      />
      {/* Arrowhead */}
      <View
        style={[
          styles.arrowheadRight,
          {
            right: Math.round(size * 0.14),
            width: headSize,
            height: headSize,
            borderRightWidth: strokeWidth,
            borderTopWidth: strokeWidth,
            borderColor: color,
          },
        ]}
      />
    </View>
  );
};

/**
 * Modern sleek ChevronLeft icon (iOS / Material style)
 */
export const ChevronLeft: React.FC<IconProps> = ({
  size = 20,
  color = '#0F172A',
  strokeWidth = 2.6,
}) => {
  const arm = Math.round(size * 0.44);
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <View
        style={[
          styles.chevronLeft,
          {
            width: arm,
            height: arm,
            borderLeftWidth: strokeWidth,
            borderBottomWidth: strokeWidth,
            borderColor: color,
            transform: [{ rotate: '45deg' }, { translateX: arm * 0.15 }],
          },
        ]}
      />
    </View>
  );
};

/**
 * Modern sleek ChevronRight icon
 */
export const ChevronRight: React.FC<IconProps> = ({
  size = 18,
  color = '#94A3B8',
  strokeWidth = 2.4,
}) => {
  const arm = Math.round(size * 0.44);
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <View
        style={[
          styles.chevronRight,
          {
            width: arm,
            height: arm,
            borderRightWidth: strokeWidth,
            borderTopWidth: strokeWidth,
            borderColor: color,
            transform: [{ rotate: '45deg' }, { translateX: -arm * 0.15 }],
          },
        ]}
      />
    </View>
  );
};

/**
 * Modern geometric Search icon
 */
export const SearchIcon: React.FC<IconProps> = ({
  size = 18,
  color = '#64748B',
  strokeWidth = 2,
}) => {
  const circleSize = Math.round(size * 0.62);
  const handleLen = Math.round(size * 0.38);
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <View
        style={[
          styles.searchCircle,
          {
            width: circleSize,
            height: circleSize,
            borderWidth: strokeWidth,
            borderColor: color,
            borderRadius: circleSize / 2,
          },
        ]}
      />
      <View
        style={[
          styles.searchHandle,
          {
            width: handleLen,
            height: strokeWidth,
            backgroundColor: color,
            borderRadius: strokeWidth / 2,
            bottom: Math.round(size * 0.14),
            right: Math.round(size * 0.12),
          },
        ]}
      />
    </View>
  );
};

/**
 * Modern Checkmark icon
 */
export const CheckIcon: React.FC<IconProps> = ({
  size = 18,
  color = '#2563EB',
  strokeWidth = 2.4,
}) => {
  const w = Math.round(size * 0.35);
  const h = Math.round(size * 0.58);
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <View
        style={[
          styles.checkMark,
          {
            width: w,
            height: h,
            borderRightWidth: strokeWidth,
            borderBottomWidth: strokeWidth,
            borderColor: color,
            transform: [
              { rotate: '45deg' },
              { translateY: -Math.round(size * 0.08) },
            ],
          },
        ]}
      />
    </View>
  );
};

/**
 * Modern Close / Cross icon
 */
export const XIcon: React.FC<IconProps> = ({
  size = 18,
  color = '#64748B',
  strokeWidth = 2,
}) => {
  const lineLen = Math.round(size * 0.68);
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <View
        style={[
          styles.crossLine,
          styles.crossLine1,
          {
            width: lineLen,
            height: strokeWidth,
            backgroundColor: color,
            borderRadius: strokeWidth / 2,
          },
        ]}
      />
      <View
        style={[
          styles.crossLine,
          styles.crossLine2,
          {
            width: lineLen,
            height: strokeWidth,
            backgroundColor: color,
            borderRadius: strokeWidth / 2,
          },
        ]}
      />
    </View>
  );
};

/**
 * Modern vector PlusIcon (crossbars at 0 and 90 deg)
 */
export const PlusIcon: React.FC<IconProps> = ({
  size = 18,
  color = '#FFFFFF',
  strokeWidth = 2.4,
}) => {
  const lineLen = Math.round(size * 0.72);

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <View
        style={[
          styles.plusLineH,
          {
            width: lineLen,
            height: strokeWidth,
            backgroundColor: color,
            borderRadius: strokeWidth / 2,
          },
        ]}
      />
      <View
        style={[
          styles.plusLineV,
          {
            width: strokeWidth,
            height: lineLen,
            backgroundColor: color,
            borderRadius: strokeWidth / 2,
          },
        ]}
      />
    </View>
  );
};

/**
 * Modern vector User / Profile icon
 */
export const UserIcon: React.FC<IconProps> = ({
  size = 20,
  color = '#2563EB',
  strokeWidth = 2,
}) => {
  const headSize = Math.round(size * 0.38);
  const bodyWidth = Math.round(size * 0.72);
  const bodyHeight = Math.round(size * 0.36);

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* Head */}
      <View
        style={{
          width: headSize,
          height: headSize,
          borderRadius: headSize / 2,
          borderWidth: strokeWidth,
          borderColor: color,
          position: 'absolute',
          top: Math.round(size * 0.1),
        }}
      />
      {/* Torso */}
      <View
        style={{
          width: bodyWidth,
          height: bodyHeight,
          borderTopLeftRadius: bodyWidth / 2,
          borderTopRightRadius: bodyWidth / 2,
          borderWidth: strokeWidth,
          borderBottomWidth: 0,
          borderColor: color,
          position: 'absolute',
          bottom: Math.round(size * 0.1),
        }}
      />
    </View>
  );
};

/**
 * Modern vector Trash / Delete icon
 */
export const TrashIcon: React.FC<IconProps> = ({
  size = 18,
  color = '#DC2626',
  strokeWidth = 1.8,
}) => {
  const canWidth = Math.round(size * 0.58);
  const canHeight = Math.round(size * 0.55);
  const lidWidth = Math.round(size * 0.75);

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* Handle */}
      <View
        style={{
          width: Math.round(size * 0.32),
          height: strokeWidth * 2.2,
          borderTopLeftRadius: 2,
          borderTopRightRadius: 2,
          borderWidth: strokeWidth,
          borderBottomWidth: 0,
          borderColor: color,
          position: 'absolute',
          top: Math.round(size * 0.1),
        }}
      />
      {/* Lid bar */}
      <View
        style={{
          width: lidWidth,
          height: strokeWidth,
          backgroundColor: color,
          borderRadius: strokeWidth / 2,
          position: 'absolute',
          top: Math.round(size * 0.24),
        }}
      />
      {/* Can Body */}
      <View
        style={{
          width: canWidth,
          height: canHeight,
          borderBottomLeftRadius: 4,
          borderBottomRightRadius: 4,
          borderWidth: strokeWidth,
          borderColor: color,
          position: 'absolute',
          bottom: Math.round(size * 0.12),
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  stem: {
    position: 'absolute',
  },
  arrowheadLeft: {
    position: 'absolute',
    borderRadius: 1.5,
    transform: [{ rotate: '45deg' }],
  },
  arrowheadRight: {
    position: 'absolute',
    borderRadius: 1.5,
    transform: [{ rotate: '45deg' }],
  },
  chevronLeft: {
    backgroundColor: 'transparent',
    borderRadius: 1.5,
  },
  chevronRight: {
    backgroundColor: 'transparent',
    borderRadius: 1.5,
  },
  searchCircle: {
    position: 'absolute',
    top: 2,
    left: 2,
    backgroundColor: 'transparent',
  },
  searchHandle: {
    position: 'absolute',
    transform: [{ rotate: '45deg' }],
  },
  checkMark: {
    backgroundColor: 'transparent',
    borderRadius: 1.5,
  },
  crossLine: {
    position: 'absolute',
  },
  crossLine1: {
    transform: [{ rotate: '45deg' }],
  },
  crossLine2: {
    transform: [{ rotate: '-45deg' }],
  },
  plusLineH: {
    position: 'absolute',
  },
  plusLineV: {
    position: 'absolute',
  },
});
