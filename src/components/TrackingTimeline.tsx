import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Order } from '../api/orders.api';

interface TrackingTimelineProps {
  status: Order['status'];
  createdAt: string;
}

interface StepItem {
  key: string;
  titleKey: string;
  descKey: string;
  icon: string;
}

const STEPS: StepItem[] = [
  {
    key: 'pending',
    titleKey: 'orders.timeline.placedTitle',
    descKey: 'orders.timeline.placedDesc',
    icon: '📝',
  },
  {
    key: 'processing',
    titleKey: 'orders.timeline.processingTitle',
    descKey: 'orders.timeline.processingDesc',
    icon: '📦',
  },
  {
    key: 'shipped',
    titleKey: 'orders.timeline.shippedTitle',
    descKey: 'orders.timeline.shippedDesc',
    icon: '🚚',
  },
  {
    key: 'delivered',
    titleKey: 'orders.timeline.deliveredTitle',
    descKey: 'orders.timeline.deliveredDesc',
    icon: '🎉',
  },
];

const STATUS_INDEX: Record<string, number> = {
  pending: 0,
  processing: 1,
  shipped: 2,
  delivered: 3,
};

export const TrackingTimeline: React.FC<TrackingTimelineProps> = ({
  status,
  createdAt,
}) => {
  const { t } = useTranslation();

  const formattedDate = new Date(createdAt).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  if (status === 'cancelled') {
    return (
      <View style={styles.cancelledContainer}>
        <View style={styles.cancelledHeader}>
          <Text style={styles.cancelledIcon}>⚠️</Text>
          <View style={styles.cancelledTextContainer}>
            <Text style={styles.cancelledTitle}>
              {t('orders.timeline.cancelledTitle')}
            </Text>
            <Text style={styles.cancelledDesc}>
              {t('orders.timeline.cancelledDesc')}
            </Text>
          </View>
        </View>
      </View>
    );
  }

  const currentIndex = STATUS_INDEX[status] ?? 0;

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>{t('orders.trackingTitle')}</Text>

      {STEPS.map((step, idx) => {
        const isCompleted = idx < currentIndex;
        const isCurrent = idx === currentIndex;
        const isUpcoming = idx > currentIndex;
        const isLast = idx === STEPS.length - 1;

        return (
          <View key={step.key} style={styles.stepRow}>
            {/* Timeline indicator column */}
            <View style={styles.indicatorCol}>
              <View
                style={[
                  styles.circle,
                  isCompleted && styles.circleCompleted,
                  isCurrent && styles.circleCurrent,
                  isUpcoming && styles.circleUpcoming,
                ]}
              >
                {isCompleted ? (
                  <Text style={styles.checkmarkText}>✓</Text>
                ) : (
                  <Text style={styles.stepIcon}>{step.icon}</Text>
                )}
              </View>

              {!isLast && (
                <View
                  style={[
                    styles.line,
                    idx < currentIndex ? styles.lineCompleted : styles.linePending,
                  ]}
                />
              )}
            </View>

            {/* Step content column */}
            <View style={styles.contentCol}>
              <View style={styles.titleRow}>
                <Text
                  style={[
                    styles.stepTitle,
                    isCurrent && styles.stepTitleCurrent,
                    isUpcoming && styles.stepTitleUpcoming,
                  ]}
                >
                  {t(step.titleKey)}
                </Text>
                {isCurrent && (
                  <View style={styles.activePill}>
                    <Text style={styles.activePillText}>Active</Text>
                  </View>
                )}
              </View>

              <Text
                style={[
                  styles.stepDesc,
                  isUpcoming && styles.stepDescUpcoming,
                ]}
              >
                {t(step.descKey)}
              </Text>

              {idx === 0 && (
                <Text style={styles.timestamp}>{formattedDate}</Text>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 18,
    marginVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  stepRow: {
    flexDirection: 'row',
  },
  indicatorCol: {
    alignItems: 'center',
    width: 36,
  },
  circle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  circleCompleted: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  circleCurrent: {
    backgroundColor: '#eff6ff',
    borderColor: '#0066cc',
  },
  circleUpcoming: {
    backgroundColor: '#f3f4f6',
    borderColor: '#e5e7eb',
  },
  checkmarkText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 14,
  },
  stepIcon: {
    fontSize: 14,
  },
  line: {
    width: 2,
    minHeight: 44,
    marginVertical: 2,
  },
  lineCompleted: {
    backgroundColor: '#059669',
  },
  linePending: {
    backgroundColor: '#e5e7eb',
  },
  contentCol: {
    flex: 1,
    paddingLeft: 12,
    paddingBottom: 22,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  stepTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1f2937',
  },
  stepTitleCurrent: {
    color: '#0066cc',
  },
  stepTitleUpcoming: {
    color: '#9ca3af',
  },
  activePill: {
    backgroundColor: '#e0f2fe',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  activePillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0284c7',
  },
  stepDesc: {
    fontSize: 12,
    color: '#4b5563',
    lineHeight: 17,
  },
  stepDescUpcoming: {
    color: '#9ca3af',
  },
  timestamp: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 4,
  },
  cancelledContainer: {
    backgroundColor: '#fee2e2',
    borderRadius: 14,
    padding: 16,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: '#fca5a5',
  },
  cancelledHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cancelledIcon: {
    fontSize: 26,
    marginRight: 10,
  },
  cancelledTextContainer: {
    flex: 1,
  },
  cancelledTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#991b1b',
  },
  cancelledDesc: {
    fontSize: 12,
    color: '#7f1d1d',
    marginTop: 2,
  },
});
