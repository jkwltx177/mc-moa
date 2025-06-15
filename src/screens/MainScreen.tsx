// src/screens/MainScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  SafeAreaView,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';
import { COLORS } from '../constants/colors';
import { TYPOGRAPHY } from '../constants/typography';
import { gifticonService } from '../services/gifticonService';
import { checkAndRequestGalleryPermission } from '../utils/permissionUtils';
import { useImagePicker } from '../hooks/useImagePicker'; // 갤러리 접근 훅
import useGifticonDataExtractor from '../hooks/useGifticonDataExtractor'; // OCR 훅
import { Alert } from 'react-native'; // Alert 추가

export const MainScreen = () => {
  const navigation = useNavigation();
  const [gifticons, setGifticons] = useState([]);

  // 화면이 포커스될 때마다 데이터 새로고침
  useFocusEffect(
    React.useCallback(() => {
      loadGifticons();
    }, [])
  );

  const loadGifticons = async () => {
    const data = await gifticonService.getAllGifticons();
    setGifticons(data);
  };

  const renderGifticonItem = ({ item }) => (
    <TouchableOpacity
      style={styles.gifticonCard}
      onPress={() => navigation.navigate('Detail', { gifticonId: item.id })}
      disabled={item.isUsed}
    >
      <Image source={{ uri: item.imageUri }} style={styles.gifticonImage} />
      {item.isUsed && (
      <View style={styles.usedOverlay}>
        <Text style={styles.usedText}>사용 완료</Text>
      </View>
    )}
      <View style={styles.gifticonInfo}>
        <Text style={styles.brandText}>{item.brandName}</Text>
        <Text style={styles.nameText} numberOfLines={1}>{item.productName}</Text>
        <Text style={styles.expiryText}>~{item.expiryDate}</Text>
      </View>
    </TouchableOpacity>
  );
  const handleAddManually = async () => {
    // 1. 갤러리에서 이미지 선택
    const imageAsset = await pickImage();
    if (!imageAsset || !imageAsset.uri) {
      return; // 사용자가 취소한 경우
    }

    // 2. 선택한 이미지에서 정보 추출 (OCR)
    Alert.alert("정보 추출 중", "이미지에서 기프티콘 정보를 읽어오고 있습니다...");
    const extractedInfo = await processImageForGifticonData(imageAsset.uri);

    // 3. 추출된 정보와 함께 UploadScreen으로 이동
    navigation.navigate('Upload', {
      imageUri: imageAsset.uri,
      // 추출된 정보를 함께 전달
      extractedData: extractedInfo,
    });
  };
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>내 기프티콘</Text>
        <TouchableOpacity onPress={handleAddManually}>
          <Icon name="plus-circle" size={28} color={COLORS.main} />
        </TouchableOpacity>
      </View>

      {gifticons.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>등록된 기프티콘이 없습니다</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => navigation.navigate('AutoScan')}
          >
            <Icon name="plus" size={24} color={COLORS.white} />
            <Text style={styles.addButtonText}>기프티콘 추가</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={gifticons}
          renderItem={renderGifticonItem}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.listContent}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray200,
  },
  headerTitle: {
    ...TYPOGRAPHY.heading2,
    color: COLORS.gray900,
  },
  listContent: {
    padding: 8,
  },
  gifticonCard: {
    flex: 1,
    margin: 8,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
  },
  gifticonImage: {
    width: '100%',
    aspectRatio: 1,
    resizeMode: 'cover',
  },
  gifticonInfo: {
    padding: 12,
  },
  brandText: {
    fontSize: 12,
    color: COLORS.gray600,
  },
  nameText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.gray900,
    marginTop: 4,
  },
  expiryText: {
    fontSize: 12,
    color: COLORS.gray500,
    marginTop: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.gray500,
    marginBottom: 20,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});