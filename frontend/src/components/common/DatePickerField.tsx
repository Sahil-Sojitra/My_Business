import React, { useMemo, useState } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  ViewStyle,
} from 'react-native';
import {
  CalendarIcon,
  ChevronLeft,
  ChevronRight,
  XIcon,
} from './Icon';

interface DatePickerFieldProps {
  label: string;
  value: string; // Stored format: YYYY-MM-DD
  onChange: (dateStr: string) => void;
  placeholder?: string;
  required?: boolean;
  error?: string;
  helperText?: string;
  style?: ViewStyle;
  mode?: 'billDate' | 'dueDate';
  referenceDate?: string; // Optional bill date from which credit days (+15, +30) are calculated
  hidePresets?: boolean;
}

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const WEEKDAY_NAMES = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

/**
 * Converts a Date object to YYYY-MM-DD string in local time
 */
export const toISODateString = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

/**
 * Formats YYYY-MM-DD string into a human-friendly label (e.g., "19 Oct 2026 (Mon)")
 */
export const formatHumanDate = (isoStr: string): string => {
  if (!isoStr || !/^\d{4}-\d{2}-\d{2}$/.test(isoStr)) {
    return '';
  }
  const [y, m, d] = isoStr.split('-').map(Number);
  const dateObj = new Date(y, m - 1, d);
  if (isNaN(dateObj.getTime())) {
    return isoStr;
  }

  const todayStr = toISODateString(new Date());
  const isToday = isoStr === todayStr;

  const shortMonth = MONTH_NAMES[dateObj.getMonth()].slice(0, 3);
  const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][
    dateObj.getDay()
  ];

  if (isToday) {
    return `Today, ${d} ${shortMonth} ${y} (${dayName})`;
  }

  return `${d} ${shortMonth} ${y} (${dayName})`;
};

export const DatePickerField: React.FC<DatePickerFieldProps> = ({
  label,
  value,
  onChange,
  placeholder = 'Select date...',
  required = false,
  error,
  helperText,
  style,
  mode = 'billDate',
  referenceDate,
  hidePresets = false,
}) => {
  const [modalVisible, setModalVisible] = useState<boolean>(false);

  // Active viewing month and year in calendar
  const initialDateObj = useMemo(() => {
    if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [y, m, d] = value.split('-').map(Number);
      return new Date(y, m - 1, d);
    }
    return new Date();
  }, [value]);

  const [viewYear, setViewYear] = useState<number>(initialDateObj.getFullYear());
  const [viewMonth, setViewMonth] = useState<number>(initialDateObj.getMonth());
  const [tempSelectedDate, setTempSelectedDate] = useState<string>(
    value || toISODateString(new Date())
  );

  const openModal = () => {
    if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [y, m, d] = value.split('-').map(Number);
      setViewYear(y);
      setViewMonth(m - 1);
      setTempSelectedDate(value);
    } else {
      const now = new Date();
      setViewYear(now.getFullYear());
      setViewMonth(now.getMonth());
      setTempSelectedDate(toISODateString(now));
    }
    setModalVisible(true);
  };

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(prev => prev - 1);
    } else {
      setViewMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(prev => prev + 1);
    } else {
      setViewMonth(prev => prev + 1);
    }
  };

  const handlePrevYear = () => {
    setViewYear(prev => prev - 1);
  };

  const handleNextYear = () => {
    setViewYear(prev => prev + 1);
  };

  const handleConfirmDate = () => {
    onChange(tempSelectedDate);
    setModalVisible(false);
  };

  const handleSelectDay = (dayNum: number) => {
    const y = viewYear;
    const m = String(viewMonth + 1).padStart(2, '0');
    const d = String(dayNum).padStart(2, '0');
    const newDateStr = `${y}-${m}-${d}`;
    setTempSelectedDate(newDateStr);
  };

  // Quick preset actions (Broker Credit Terms)
  const applyPresetDays = (days: number) => {
    const baseStr =
      referenceDate && /^\d{4}-\d{2}-\d{2}$/.test(referenceDate)
        ? referenceDate
        : toISODateString(new Date());

    const [y, m, d] = baseStr.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    dateObj.setDate(dateObj.getDate() + days);

    const resultStr = toISODateString(dateObj);
    setTempSelectedDate(resultStr);
    setViewYear(dateObj.getFullYear());
    setViewMonth(dateObj.getMonth());
  };

  const handleClear = () => {
    onChange('');
  };

  // Calculate calendar grid days
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();

  const calendarDays = useMemo(() => {
    const days: (number | null)[] = [];
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push(null);
    }
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }
    return days;
  }, [firstDayOfWeek, daysInMonth]);

  const todayStr = toISODateString(new Date());

  const formattedDisplay = value ? formatHumanDate(value) : '';
  const hasValue = Boolean(value);

  return (
    <View style={[styles.fieldContainer, style]}>
      {/* Label Row */}
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>
        {required ? <Text style={styles.requiredMark}> *</Text> : null}
      </View>

      {/* Touchable Input Trigger Box */}
      <TouchableOpacity
        onPress={openModal}
        style={[styles.inputBox, error ? styles.inputBoxError : null]}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel={label}>
        <View style={styles.boxLeft}>
          <View style={styles.calendarIconBadge}>
            <CalendarIcon size={18} color="#2563EB" />
          </View>
          <Text
            style={[
              styles.dateValueText,
              !hasValue && styles.placeholderText,
            ]}
            numberOfLines={1}>
            {hasValue ? formattedDisplay : placeholder}
          </Text>
        </View>

        <View style={styles.boxRight}>
          {!required && hasValue ? (
            <TouchableOpacity
              onPress={handleClear}
              style={styles.clearBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityLabel="Clear date">
              <XIcon size={14} color="#64748B" />
            </TouchableOpacity>
          ) : (
            <Text style={styles.pickBadgeText}>Pick</Text>
          )}
        </View>
      </TouchableOpacity>

      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : helperText ? (
        <Text style={styles.helperText}>{helperText}</Text>
      ) : null}

      {/* Date Picker Interactive Modal */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        statusBarTranslucent={true}
        onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
            <View style={styles.backdropDismiss} />
          </TouchableWithoutFeedback>

          <View style={styles.modalDialog}>
            {/* Header */}
            <View style={styles.dialogHeader}>
              <View>
                <Text style={styles.dialogTitle}>{label}</Text>
                <Text style={styles.dialogSub}>
                  Selected: {formatHumanDate(tempSelectedDate)}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.closeBtn}
                activeOpacity={0.7}>
                <XIcon size={18} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* Quick Presets (Broker Credit & Mandi Shortcuts) */}
            {!hidePresets ? (
              <View style={styles.presetsContainer}>
                <Text style={styles.presetsHeader}>Quick Select:</Text>
                <View style={styles.presetButtonsRow}>
                  {mode === 'billDate' ? (
                    <>
                      <TouchableOpacity
                        style={styles.presetChip}
                        onPress={() => {
                          const now = new Date();
                          const s = toISODateString(now);
                          setTempSelectedDate(s);
                          setViewYear(now.getFullYear());
                          setViewMonth(now.getMonth());
                        }}>
                        <Text style={styles.presetChipText}>Today</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.presetChip}
                        onPress={() => applyPresetDays(-1)}>
                        <Text style={styles.presetChipText}>Yesterday</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.presetChip}
                        onPress={() => applyPresetDays(-2)}>
                        <Text style={styles.presetChipText}>2 Days Ago</Text>
                      </TouchableOpacity>
                    </>
                  ) : (
                    <>
                      <TouchableOpacity
                        style={styles.presetChip}
                        onPress={() => applyPresetDays(15)}>
                        <Text style={styles.presetChipText}>+15 Days</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.presetChip, styles.presetChipHighlight]}
                        onPress={() => applyPresetDays(30)}>
                        <Text style={[styles.presetChipText, styles.presetChipTextHighlight]}>
                          +30 Days (1M)
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.presetChip}
                        onPress={() => applyPresetDays(45)}>
                        <Text style={styles.presetChipText}>+45 Days</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.presetChip}
                        onPress={() => applyPresetDays(60)}>
                        <Text style={styles.presetChipText}>+60 Days</Text>
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              </View>
            ) : null}

            {/* Month & Year Navigator */}
            <View style={styles.monthNavigator}>
              <View style={styles.navGroup}>
                <TouchableOpacity
                  onPress={handlePrevYear}
                  style={styles.navMiniBtn}
                  activeOpacity={0.7}
                  accessibilityLabel="Previous year">
                  <Text style={styles.navMiniBtnText}>-1Y</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handlePrevMonth}
                  style={styles.navArrowBtn}
                  activeOpacity={0.7}
                  accessibilityLabel="Previous month">
                  <ChevronLeft size={18} color="#0F172A" />
                </TouchableOpacity>
              </View>

              <Text style={styles.monthYearTitle}>
                {MONTH_NAMES[viewMonth]} {viewYear}
              </Text>

              <View style={styles.navGroup}>
                <TouchableOpacity
                  onPress={handleNextMonth}
                  style={styles.navArrowBtn}
                  activeOpacity={0.7}
                  accessibilityLabel="Next month">
                  <ChevronRight size={18} color="#0F172A" />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleNextYear}
                  style={styles.navMiniBtn}
                  activeOpacity={0.7}
                  accessibilityLabel="Next year">
                  <Text style={styles.navMiniBtnText}>+1Y</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Days of Week Header Row */}
            <View style={styles.weekdaysRow}>
              {WEEKDAY_NAMES.map((w, idx) => (
                <Text
                  key={idx}
                  style={[
                    styles.weekdayText,
                    idx === 0 && styles.weekdaySunday,
                  ]}>
                  {w}
                </Text>
              ))}
            </View>

            {/* Calendar Grid Days */}
            <View style={styles.calendarGrid}>
              {calendarDays.map((dayNum, idx) => {
                if (dayNum === null) {
                  return <View key={`empty-${idx}`} style={styles.dayCell} />;
                }

                const currentCellDateStr = `${viewYear}-${String(
                  viewMonth + 1
                ).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;

                const isSelected = currentCellDateStr === tempSelectedDate;
                const isToday = currentCellDateStr === todayStr;

                return (
                  <TouchableOpacity
                    key={`day-${dayNum}`}
                    style={[
                      styles.dayCell,
                      isToday && !isSelected && styles.dayCellToday,
                      isSelected && styles.dayCellSelected,
                    ]}
                    onPress={() => handleSelectDay(dayNum)}
                    activeOpacity={0.7}>
                    <Text
                      style={[
                        styles.dayNumberText,
                        isToday && !isSelected && styles.dayNumberToday,
                        isSelected && styles.dayNumberSelected,
                      ]}>
                      {dayNum}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Action Buttons */}
            <View style={styles.dialogActions}>
              {!required ? (
                <TouchableOpacity
                  onPress={() => {
                    handleClear();
                    setModalVisible(false);
                  }}
                  style={styles.clearDialogBtn}
                  activeOpacity={0.7}>
                  <Text style={styles.clearDialogBtnText}>Clear</Text>
                </TouchableOpacity>
              ) : null}

              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.cancelBtn}
                activeOpacity={0.7}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleConfirmDate}
                style={styles.confirmBtn}
                activeOpacity={0.8}>
                <Text style={styles.confirmBtnText}>Set Date</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  fieldContainer: {
    marginBottom: 16,
  },
  labelRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  label: {
    fontSize: 14.5,
    fontWeight: '600',
    color: '#1E293B',
  },
  requiredMark: {
    color: '#DC2626',
    fontWeight: '700',
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    minHeight: 52,
  },
  inputBoxError: {
    borderColor: '#EF4444',
  },
  boxLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  calendarIconBadge: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  dateValueText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    flex: 1,
  },
  placeholderText: {
    fontSize: 14.5,
    fontWeight: '500',
    color: '#94A3B8',
  },
  boxRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pickBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563EB',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  clearBtn: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
  },
  errorText: {
    marginTop: 5,
    fontSize: 12.5,
    color: '#DC2626',
    fontWeight: '500',
  },
  helperText: {
    marginTop: 5,
    fontSize: 12.5,
    color: '#64748B',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  backdropDismiss: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
  modalDialog: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  dialogHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  dialogTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  dialogSub: {
    fontSize: 12.5,
    color: '#2563EB',
    fontWeight: '600',
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  presetsContainer: {
    marginBottom: 14,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  presetsHeader: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  presetButtonsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  presetChip: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  presetChipHighlight: {
    backgroundColor: '#EFF6FF',
    borderColor: '#93C5FD',
  },
  presetChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  presetChipTextHighlight: {
    color: '#1D4ED8',
    fontWeight: '700',
  },
  monthNavigator: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  navGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  navMiniBtn: {
    paddingHorizontal: 7,
    height: 34,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navMiniBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#475569',
  },
  navArrowBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthYearTitle: {
    fontSize: 15.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  weekdaysRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  weekdayText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  weekdaySunday: {
    color: '#DC2626',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  dayCell: {
    width: `${100 / 7}%`,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 2,
    borderRadius: 19,
  },
  dayCellToday: {
    borderWidth: 1.5,
    borderColor: '#2563EB',
  },
  dayCellSelected: {
    backgroundColor: '#2563EB',
  },
  dayNumberText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  dayNumberToday: {
    color: '#2563EB',
    fontWeight: '800',
  },
  dayNumberSelected: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  dialogActions: {
    flexDirection: 'row',
    gap: 8,
  },
  clearDialogBtn: {
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearDialogBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#DC2626',
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
  },
  confirmBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 10,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
