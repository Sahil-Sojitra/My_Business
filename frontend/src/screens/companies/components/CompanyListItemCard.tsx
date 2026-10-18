import React from 'react';
import { Text, View } from 'react-native';
import { Card } from '../../../components/common/Card';
import { ChevronRight } from '../../../components/common/Icon';
import { Company } from '../../../types/company';
import { formatPhone } from '../../../utils/formatters';
import { styles } from '../CompanyListStyles';

interface CompanyListItemCardProps {
  item: Company;
  onPress: () => void;
}

export const CompanyListItemCard: React.FC<CompanyListItemCardProps> = ({
  item,
  onPress,
}) => {
  return (
    <Card onPress={onPress} style={styles.companyCard}>
      <View style={styles.cardHeader}>
        <View style={styles.headerLeft}>
          <Text style={styles.companyName} numberOfLines={1}>
            {item.name}
          </Text>
          {item.ownerName ? (
            <Text style={styles.ownerName}>
              Contact person: {item.ownerName}
            </Text>
          ) : null}
        </View>
        <View style={styles.chevronBox}>
          <ChevronRight size={18} color="#2563EB" strokeWidth={2.4} />
        </View>
      </View>

      <View style={styles.cardFooter}>
        <View style={styles.infoBadge}>
          <Text style={styles.infoBadgeText}>
            📞 {formatPhone(item.contactNumber)}
          </Text>
        </View>
        {item.gstin ? (
          <View style={styles.gstBadge}>
            <Text style={styles.gstBadgeText}>GST: {item.gstin}</Text>
          </View>
        ) : null}
      </View>
    </Card>
  );
};
