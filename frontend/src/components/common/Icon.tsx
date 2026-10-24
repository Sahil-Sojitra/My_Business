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
export const ArrowLeft: React.FC<IconProps> = React.memo(({
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
});

/**
 * Production-grade vector ArrowRight icon (stem + arrowhead)
 */
export const ArrowRight: React.FC<IconProps> = React.memo(({
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
});

/**
 * Modern sleek ChevronLeft icon (iOS / Material style)
 */
export const ChevronLeft: React.FC<IconProps> = React.memo(({
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
});

/**
 * Modern sleek ChevronRight icon
 */
export const ChevronRight: React.FC<IconProps> = React.memo(({
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
});

/**
 * Modern geometric Search icon
 */
export const SearchIcon: React.FC<IconProps> = React.memo(({
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
});

/**
 * Modern Checkmark icon
 */
export const CheckIcon: React.FC<IconProps> = React.memo(({
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
});

/**
 * Modern Close / Cross icon
 */
export const XIcon: React.FC<IconProps> = React.memo(({
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
});

/**
 * Modern vector PlusIcon (crossbars at 0 and 90 deg)
 */
export const PlusIcon: React.FC<IconProps> = React.memo(({
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
});

/**
 * Modern vector User / Profile icon
 */
export const UserIcon: React.FC<IconProps> = React.memo(({
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
});

/**
 * Modern vector Trash / Delete icon
 */
export const TrashIcon: React.FC<IconProps> = React.memo(({
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
});

/**
 * Modern vector Calendar icon
 */
export const CalendarIcon: React.FC<IconProps> = React.memo(({
  size = 18,
  color = '#2563EB',
  strokeWidth = 2,
}) => {
  const w = Math.round(size * 0.82);
  const h = Math.round(size * 0.78);
  const hookSize = Math.round(size * 0.22);

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* Outer Calendar Box */}
      <View
        style={{
          width: w,
          height: h,
          borderRadius: 4,
          borderWidth: strokeWidth,
          borderColor: color,
          position: 'absolute',
          bottom: 1,
        }}>
        {/* Top Header Line */}
        <View
          style={{
            width: '100%',
            height: strokeWidth,
            backgroundColor: color,
            position: 'absolute',
            top: Math.round(h * 0.28),
          }}
        />
      </View>
      {/* Left Binding Hook */}
      <View
        style={{
          width: strokeWidth,
          height: hookSize,
          backgroundColor: color,
          borderRadius: strokeWidth / 2,
          position: 'absolute',
          top: 0,
          left: Math.round(size * 0.26),
        }}
      />
      {/* Right Binding Hook */}
      <View
        style={{
          width: strokeWidth,
          height: hookSize,
          backgroundColor: color,
          borderRadius: strokeWidth / 2,
          position: 'absolute',
          top: 0,
          right: Math.round(size * 0.26),
        }}
      />
    </View>
  );
});

/**
 * Modern sleek ChevronDown icon
 */
export const ChevronDown: React.FC<IconProps> = React.memo(({
  size = 18,
  color = '#64748B',
  strokeWidth = 2.4,
}) => {
  const arm = Math.round(size * 0.44);
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <View
        style={[
          styles.chevronDown,
          {
            width: arm,
            height: arm,
            borderRightWidth: strokeWidth,
            borderBottomWidth: strokeWidth,
            borderColor: color,
            transform: [{ rotate: '45deg' }, { translateY: -Math.round(arm * 0.2) }],
          },
        ]}
      />
    </View>
  );
});

/**
 * Modern vector Building / Firm icon
 */
export const BuildingIcon: React.FC<IconProps> = React.memo(({
  size = 18,
  color = '#2563EB',
  strokeWidth = 1.8,
}) => {
  const w = Math.round(size * 0.74);
  const h = Math.round(size * 0.84);
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* Outer building facade */}
      <View
        style={{
          width: w,
          height: h,
          borderRadius: 3,
          borderWidth: strokeWidth,
          borderColor: color,
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingVertical: 2,
        }}>
        {/* Upper Windows row */}
        <View style={styles.buildingWindowRowTop}>
          <View
            style={{
              width: 2.5,
              height: 2.5,
              backgroundColor: color,
              borderRadius: 0.5,
            }}
          />
          <View
            style={{
              width: 2.5,
              height: 2.5,
              backgroundColor: color,
              borderRadius: 0.5,
            }}
          />
        </View>
        {/* Mid Windows row */}
        <View style={styles.buildingWindowRow}>
          <View
            style={{
              width: 2.5,
              height: 2.5,
              backgroundColor: color,
              borderRadius: 0.5,
            }}
          />
          <View
            style={{
              width: 2.5,
              height: 2.5,
              backgroundColor: color,
              borderRadius: 0.5,
            }}
          />
        </View>
        {/* Ground Door */}
        <View
          style={{
            width: 5,
            height: 4,
            borderTopLeftRadius: 1.5,
            borderTopRightRadius: 1.5,
            backgroundColor: color,
          }}
        />
      </View>
    </View>
  );
});

/**
 * Modern vector AlertCircle icon (circle + exclamation mark)
 */
export const AlertCircleIcon: React.FC<IconProps> = React.memo(({
  size = 20,
  color = '#EF4444',
  strokeWidth = 2,
}) => {
  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: strokeWidth,
          borderColor: color,
        },
      ]}>
      <View
        style={{
          width: strokeWidth,
          height: Math.round(size * 0.35),
          backgroundColor: color,
          borderRadius: strokeWidth / 2,
          position: 'absolute',
          top: Math.round(size * 0.18),
        }}
      />
      <View
        style={{
          width: strokeWidth * 1.2,
          height: strokeWidth * 1.2,
          backgroundColor: color,
          borderRadius: (strokeWidth * 1.2) / 2,
          position: 'absolute',
          bottom: Math.round(size * 0.18),
        }}
      />
    </View>
  );
});

/**
 * Modern vector InfoIcon (circle + 'i')
 */
export const InfoIcon: React.FC<IconProps> = React.memo(({
  size = 20,
  color = '#2563EB',
  strokeWidth = 2,
}) => {
  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: strokeWidth,
          borderColor: color,
        },
      ]}>
      <View
        style={{
          width: strokeWidth * 1.2,
          height: strokeWidth * 1.2,
          backgroundColor: color,
          borderRadius: (strokeWidth * 1.2) / 2,
          position: 'absolute',
          top: Math.round(size * 0.18),
        }}
      />
      <View
        style={{
          width: strokeWidth,
          height: Math.round(size * 0.35),
          backgroundColor: color,
          borderRadius: strokeWidth / 2,
          position: 'absolute',
          bottom: Math.round(size * 0.18),
        }}
      />
    </View>
  );
});

/**
 * Modern vector EyeIcon (almond eye + pupil)
 */
export const EyeIcon: React.FC<IconProps> = React.memo(({
  size = 18,
  color = '#2563EB',
  strokeWidth = 2,
}) => {
  const w = Math.round(size * 0.88);
  const h = Math.round(size * 0.54);
  const pupil = Math.round(size * 0.28);
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <View
        style={{
          width: w,
          height: h,
          borderRadius: h / 2,
          borderWidth: strokeWidth,
          borderColor: color,
          justifyContent: 'center',
          alignItems: 'center',
        }}>
        <View
          style={{
            width: pupil,
            height: pupil,
            borderRadius: pupil / 2,
            backgroundColor: color,
          }}
        />
      </View>
    </View>
  );
});

/**
 * Modern vector FileText / Document icon
 */
export const FileTextIcon: React.FC<IconProps> = React.memo(({
  size = 18,
  color = '#2563EB',
  strokeWidth = 1.8,
}) => {
  const w = Math.round(size * 0.72);
  const h = Math.round(size * 0.88);
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <View
        style={{
          width: w,
          height: h,
          borderRadius: 3,
          borderWidth: strokeWidth,
          borderColor: color,
          paddingHorizontal: Math.round(w * 0.18),
          justifyContent: 'center',
          gap: 2.5,
        }}>
        <View
          style={{
            width: '100%',
            height: strokeWidth,
            backgroundColor: color,
            borderRadius: 1,
          }}
        />
        <View
          style={{
            width: '70%',
            height: strokeWidth,
            backgroundColor: color,
            borderRadius: 1,
          }}
        />
        <View
          style={{
            width: '85%',
            height: strokeWidth,
            backgroundColor: color,
            borderRadius: 1,
          }}
        />
      </View>
    </View>
  );
});

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
  chevronDown: {
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
  buildingWindowRow: {
    flexDirection: 'row',
    gap: 2.5,
  },
  buildingWindowRowTop: {
    flexDirection: 'row',
    gap: 2.5,
    marginTop: 1,
  },
});
