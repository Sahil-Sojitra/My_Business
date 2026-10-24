import React from 'react';
import { Text, View } from 'react-native';
import { Card } from '../../../components/common/Card';
import { Company } from '../../../types/company';
import { formatPhone } from '../../../utils/formatters';
import { styles } from '../CompanyDetailsStyles';

interface CompanyProfileCardProps {
  company: Company;
}

export const CompanyProfileCard: React.FC<CompanyProfileCardProps> = React.memo(({
  company,
}) => {
  return (
    <Card style={styles.mainCard}>
      <Text style={styles.nameHeader}>{company.name}</Text>
      {company.ownerName ? (
        <Text style={styles.ownerText}>Contact: {company.ownerName}</Text>
      ) : null}

      <View style={styles.divider} />

      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Phone Number</Text>
        <Text style={styles.infoValue}>
          {formatPhone(company.contactNumber)}
        </Text>
      </View>

      {company.gstin ? (
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>GSTIN / Tax ID</Text>
          <Text style={styles.infoValueBold}>{company.gstin}</Text>
        </View>
      ) : null}

      {company.address ? (
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Address</Text>
          <Text style={styles.infoValue}>{company.address}</Text>
        </View>
      ) : null}

      {company.notes ? (
        <View style={styles.notesContainer}>
          <Text style={styles.notesLabel}>Notes & Terms</Text>
          <Text style={styles.notesText}>{company.notes}</Text>
        </View>
      ) : null}
    </Card>
  );
});
