import React from 'react';
import { View, StyleSheet, DimensionValue } from 'react-native';
import { useTheme } from '@/hooks/use-theme';

interface SkeletonProps {
  width?: DimensionValue;
  height?: DimensionValue;
  borderRadius?: number;
}

export const Skeleton = ({ width = '100%', height = 20, borderRadius = 4 }: SkeletonProps) => {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius,
          backgroundColor: theme.backgroundElement,
        },
      ]}
    />
  );
};

export const ProductCardSkeleton = () => {
  const theme = useTheme();

  return (
    <View style={[styles.card, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
      <Skeleton height={120} borderRadius={8} />
      <View style={styles.content}>
        <Skeleton width="80%" height={16} />
        <Skeleton width="60%" height={12} />
        <View style={styles.row}>
          <Skeleton width={40} height={20} />
          <Skeleton width={30} height={30} borderRadius={15} />
        </View>
      </View>
    </View>
  );
};

export const OrderCardSkeleton = () => {
  const theme = useTheme();

  return (
    <View style={[styles.card, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
      <View style={styles.header}>
        <Skeleton width={80} height={16} />
        <Skeleton width={60} height={20} borderRadius={10} />
      </View>
      <Skeleton width="100%" height={12} />
      <Skeleton width="70%" height={12} />
      <View style={styles.footer}>
        <Skeleton width={100} height={14} />
        <Skeleton width={60} height={18} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  skeleton: {
    opacity: 0.7,
  },
  card: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  content: {
    marginTop: 12,
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
});
