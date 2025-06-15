import React from 'react';
import { Platform, View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { COLORS } from '../constants/colors';
import { TYPOGRAPHY } from '../constants/typography';
import { deleteUsedAndExpiredGifticons } from '../services/gifticonService';

// 각 설정 행을 위한 재사용 컴포넌트
const SettingsRow = ({ icon, title, rightContent, onPress }) => (
  <TouchableOpacity style={styles.row} onPress={onPress} disabled={!onPress}>
    <Text style={styles.icon}>{icon}</Text>
    <Text style={styles.rowTitle}>{title}</Text>
    <View style={styles.rightContentContainer}>
      {rightContent}
    </View>
  </TouchableOpacity>
);

const SettingScreen = () => {
  const navigation = useNavigation();
  const Arrow = () => <Text style={styles.arrow}>〉</Text>;
  const ExternalLink = () => <Text style={styles.arrow}>↗</Text>;
  const handleDeleteOldGifticons = () => {
    Alert.alert(
      '오래된 기프티콘 삭제',
      '사용 완료 및 기간이 만료된 모든 기프티콘을 영구적으로 삭제하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            try {
              const deletedCount = await deleteUsedAndExpiredGifticons();
              if (deletedCount > 0) {
                Alert.alert('삭제 완료', `${deletedCount}개의 기프티콘을 삭제했습니다.`);
              } else {
                Alert.alert('알림', '삭제할 기프티콘이 없습니다.');
              }
            } catch (error) {
              Alert.alert('오류', '삭제 중 문제가 발생했습니다.');
            }
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.headerTitle}>마이페이지</Text>

        {/* 기프티콘 관리 섹션 */}
        {/* --- ⬇️ icon prop 부분을 Platform.select 또는 삼항 연산자로 수정합니다. ⬇️ --- */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>기프티콘 관리</Text>
          <View style={styles.card}>
            <SettingsRow icon={Platform.OS === 'ios' ? '􀋙' : '🔔'} title="알림 설정" rightContent={<Arrow />} onPress={() => navigation.navigate('NotificationSettings')} />
            {/* --- ⬇️ 이 행의 onPress를 수정합니다. ⬇️ --- */}
            <SettingsRow
              icon={Platform.OS === 'ios' ? '􀈄' : '📥'}
              title="사용가능 기프티콘 일괄 저장"
              rightContent={<Arrow />}
              onPress={() => navigation.navigate('AutoScan')}
            />
            {/* --- 여기까지 --- */}
            <SettingsRow
              icon={Platform.OS === 'ios' ? '􀈑' : '🗑️'}
              title="사용완료/기한만료 기프티콘 삭제"
              rightContent={<Arrow />}
              onPress={handleDeleteOldGifticons}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>정보</Text>
          <View style={styles.card}>
            <SettingsRow icon={Platform.OS === 'ios' ? '􀉆' : '📄'} title="이용 약관" rightContent={<ExternalLink />} onPress={() => {}} />
            <SettingsRow icon={Platform.OS === 'ios' ? '􀉻' : '🤚'} title="개인정보 처리방침" rightContent={<ExternalLink />} onPress={() => {}} />
            <SettingsRow icon={Platform.OS === 'ios' ? '􀅴' : 'ℹ️'} title="앱 버전 정보" rightContent={<Text style={styles.versionText}>1.0.1</Text>} />
            <SettingsRow icon={Platform.OS === 'ios' ? '􁃒' : '💬'} title="문의하기" rightContent={<Arrow />} onPress={() => {}} />
          </View>
        </View>
        {/* --- 여기까지 --- */}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.gray2 },
  scrollContainer: { padding: 20 },
  headerTitle: { ...TYPOGRAPHY.h1, marginBottom: 24, paddingHorizontal: 4 },
  section: { marginBottom: 24 },
  sectionTitle: { ...TYPOGRAPHY.body4, color: COLORS.gray6, marginBottom: 8, paddingHorizontal: 12 },
  card: { backgroundColor: COLORS.white0, borderRadius: 12, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: COLORS.gray2 },
  icon: { fontSize: 20, width: 30 },
  rowTitle: { ...TYPOGRAPHY.body2, flex: 1 },
  rightContentContainer: { alignItems: 'flex-end' },
  arrow: { fontSize: 18, color: COLORS.gray5 },
  versionText: { ...TYPOGRAPHY.body3, color: COLORS.gray6 },
});

export default SettingScreen;