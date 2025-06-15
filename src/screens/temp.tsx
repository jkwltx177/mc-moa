import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { launchImageLibrary } from 'react-native-image-picker';

import { TYPOGRAPHY } from '../constants/typography';
import { COLORS } from '../constants/colors';
import CustomButton from '../components/common/CustomButton';
import {
  getAllGifticons,
  getAllCategories,
  updateGifticonStatus,
  GifticonData,
  Category,
} from '../services/gifticonService';

const TempScreen = () => {
  const navigation = useNavigation();
  const [gifticons, setGifticons] = useState<GifticonData[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  // useFocusEffect: 이 화면이 보일 때마다 데이터를 다시 불러옵니다.
  // (예: 기프티콘을 등록하고 이 화면으로 돌아오면 목록이 바로 업데이트됨)
  useFocusEffect(
    useCallback(() => {
      const loadData = async () => {
        try {
          // 기프티콘과 카테고리 목록을 동시에 불러옵니다.
          const [loadedGifticons, loadedCategories] = await Promise.all([
            getAllGifticons(),
            getAllCategories(),
          ]);
          setGifticons(loadedGifticons);
          setCategories(loadedCategories);
          console.log('데이터 로딩 완료.');
        } catch (error) {
          console.error('데이터 로딩 실패:', error);
          Alert.alert('오류', '데이터를 불러오는 중 문제가 발생했습니다.');
        }
      };

      loadData();
    }, [])
  );

  const handleSelectImage = async () => {
    await launchImageLibrary({ mediaType: 'photo', selectionLimit: 1 }, (response) => {
      if (response.didCancel) return;
      if (response.errorCode) {
        Alert.alert('오류', '이미지를 선택하는 중 문제가 발생했습니다.');
        return;
      }
      if (response.assets && response.assets.length > 0) {
        const imageUri = response.assets[0].uri;
        if (imageUri) {
          navigation.navigate('Upload', { imageUri });
        }
      }
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* 1. 이미지 선택 버튼 */}
        <View style={styles.section}>
          <CustomButton
            title="갤러리에서 이미지 선택 후 등록"
            onPress={handleSelectImage}
          />
        </View>

        {/* 2. 저장된 기프티콘 목록 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>저장된 기프티콘 목록 ({gifticons.length}개)</Text>
          {gifticons.length > 0 ? (
            gifticons.map((item, index) => (
              <TouchableOpacity
                key={item.id}
                style={styles.listItem}
                onPress={() => navigation.navigate('Detail', { gifticonId: item.id })}
              >
                <Text style={styles.itemText}>{index + 1}. {item.productName || '이름 없음'}</Text>
                <Text style={styles.itemSubText}>유효기간: {item.expiryDate}</Text>
              </TouchableOpacity>
            ))
          ) : (
            <Text style={styles.emptyText}>저장된 기프티콘이 없습니다.</Text>
          )}
        </View>

        {/* 3. 저장된 카테고리 목록 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>저장된 카테고리 목록 ({categories.length}개)</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {categories.length > 0 ? (
                categories.map(cat => (
                <View key={cat.id} style={[styles.categoryChip, { backgroundColor: `${cat.color}30` }]}>
                    <Text style={styles.categoryText}>{cat.icon} {cat.name}</Text>
                </View>
                ))
            ) : (
                <Text style={styles.emptyText}>저장된 카테고리가 없습니다.</Text>
            )}
          </ScrollView>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white0,
  },
  scrollContainer: {
    padding: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    ...TYPOGRAPHY.h4,
    marginBottom: 12,
  },
  listItem: {
    backgroundColor: COLORS.gray2,
    padding: 16,
    borderRadius: 8,
    marginBottom: 10,
  },
  itemText: {
    ...TYPOGRAPHY.body2,
  },
  itemSubText: {
    ...TYPOGRAPHY.body5,
    color: COLORS.gray6,
    marginTop: 4,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  categoryText: {
    ...TYPOGRAPHY.body4,
  },
  emptyText: {
    ...TYPOGRAPHY.body3,
    color: COLORS.gray5,
  }
});

export default TempScreen;