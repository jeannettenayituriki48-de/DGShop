import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Order } from '../api/orders.api';

interface StatusBadgeProps {
  status: Order['status'];
  size?: 'small' | 'medium';
}

const STATUS_CONFIG: Record<
  Order['status'],
  { bg: string; text: string; border: string; icon: string }
> = {
  pending: {
    bg: '#fef3c7',
    text: '#b45309',
    border: '#fde68a',
    icon: '⏳',
  },
  processing: {
    bg: '#dbeafe',
    text: '#1d4ed8',
    border: '#bfdbfe',
    icon: '⚙️',
  },
  shipped: {
    bg: '#ede9fe',
    text: '#6d28d9',
    border: '#ddd6fe',
    icon: '🚚',
  },
  delivered: {
    bg: '#d1fae5',
    text: '#047857',
    border: '#a7f3d0',
    icon: '✅',
  },
  cancelled: {
    bg: '#fee2e2',
    text: '#b91c1c',
    border: '#fca5a5',
    icon: '❌',
  },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'small',
}) => {
  const { t } = useTranslation();
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  const isSmall = size === 'small';

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: config.bg,
          borderColor: config.border,
          paddingVertical: isSmall ? 3 : 6,
          paddingHorizontal: isSmall ? 8 : 12,
        },
      ]}
    >
      <Text style={[styles.icon, { fontSize: isSmall ? 11 : 14 }]}>
        {config.icon}
      </Text>
      <Text
        style={[
          styles.text,
          {
            color: config.text,
            fontSize: isSmall ? 11 : 13,
          },
        ]}
      >
        {t(`orders.status.${status}`, { defaultValue: status })}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  icon: {
    marginRight: 4,
  },
  text: {
    fontWeight: '700',
    textTransform: 'capitalize',
  },
});
