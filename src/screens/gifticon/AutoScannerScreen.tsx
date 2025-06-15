// src/screens/AutoScannerScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, Alert, Platform, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator'; // AppNavigator에서 정의한 타입
// --- 여기까지 ---
import useGifticonDataExtractor, { ExtractedGifticonInfo } from '../../hooks/useGifticonDataExtractor';
import useTargetedGalleryScanner, { GalleryScanOptions } from '../../hooks/useTargetedGalleryScanner'; // GalleryScanOptions는 여기서 가져올 수 있음
import CustomButton from '../../components/common/CustomButton';
import { StoredGifticonData } from '../../services/gifticonService';
import { COLORS } from '../../constants/colors';
import { TYPOGRAPHY } from '../../constants/typography';

// 예시 폴더 이름 (실제 앱에서는 사용자가 선택하거나 설정에서 관리)
const DEFAULT_SCAN_FOLDER_ANDROID = 'Screenshots';
const DEFAULT_SCAN_FOLDER_IOS = 'Screenshots'; // iOS 앨범 이름

// --- ⬇️ 2. 내비게이션 prop의 타입을 정의합니다. ⬇️ ---
type AutoScannerScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'AutoScan'
>;
const AutoScannerScreen = () => {
  const {
    scannedAndSavedGifticons,
    skippedOrDuplicateGifticons,
    isScanning,
    scanProgress,
    scanError,
    startScan,
  } = useTargetedGalleryScanner();

  const navigation = useNavigation<AutoScannerScreenNavigationProp>();

  // 현재 선택된 폴더 (UI를 통해 사용자가 변경할 수 있도록 확장 가능)
  const [currentTargetFolder, _setCurrentTargetFolder] = useState<string | undefined>(
    Platform.OS === 'android' ? DEFAULT_SCAN_FOLDER_ANDROID : DEFAULT_SCAN_FOLDER_IOS,
  );

  // 앱 진입 시 또는 특정 조건에 따라 자동으로 스캔을 시작하고 싶다면 useEffect 사용
  // useEffect(() => {
  //   // 예: 앱 로드 시 'Screenshots' 폴더의 새로운 이미지만 스캔
  //   const initialScanOptions: GalleryScanOptions = {
  //     targetAlbum: currentTargetFolder,
  //     scanMode: 'newInAlbum',
  //   };
  //   startScan(initialScanOptions);
  // }, []); // 마운트 시 1회 실행

  const handleScan = (options: GalleryScanOptions) => {
    Alert.alert(
      '스캔 시작',
      `${options.targetAlbum ? `"${options.targetAlbum}" 앨범(폴더)의 ` : '전체 갤러리의 '}` +
      `${options.scanMode === 'newInAlbum' || options.scanMode === 'newInGallery' ? '새로운' : '모든'} 이미지를 스캔합니다.`,
      [
        { text: '취소', style: 'cancel' },
        { text: '시작', onPress: () => startScan(options) },
      ],
    );
  };

  const handleScanComplete = (scanResult) => {
    navigation.navigate('Upload', {
      imageUri: scanResult.imageUri,
      barcode: scanResult.barcode,
      productName: scanResult.productName,
      brandName: scanResult.brandName,
      expiryDate: scanResult.expiryDate,
    });
  };

  const renderGifticonItem = ({ item }: { item: StoredGifticonData | ExtractedGifticonInfo }) => {
    const isStored = 'registeredAt' in item; // StoredGifticonData에만 있는 필드로 구분
    const displayItem = item as StoredGifticonData; // StoredGifticonData로 우선 간주

    return (
      <TouchableOpacity
        onPress={() => {
          // 터치 시 'Upload' 화면으로 이동하면서, 해당 아이템의 이미지 URI를 파라미터로 전달합니다.
          navigation.navigate('Upload', { imageUri: item.imageUri });
        }}
      >
        <View style={[styles.itemContainer, isStored ? styles.itemStored : styles.itemSkipped]}>
          <View style={styles.itemDetails}>
            <Text style={TYPOGRAPHY.body4} numberOfLines={1}>
              상품: {item.productName || '정보 없음'}
            </Text>
            <Text style={TYPOGRAPHY.body5} numberOfLines={1}>
              브랜드: {item.brandName || '정보 없음'}
            </Text>
            <Text style={TYPOGRAPHY.caption1}>
              바코드: {item.barcodeValue || '바코드 없음'}
            </Text>
            <Text style={TYPOGRAPHY.caption2}>
              유효기간: {item.expiryDate || '정보 없음'}
            </Text>
            {isStored && (
              <Text style={[TYPOGRAPHY.caption2, styles.statusStored]}>
                (저장됨: {new Date(displayItem.registeredAt).toLocaleDateString()})
              </Text>
            )}
            {!isStored && item.barcodeValue && ( // 바코드가 있지만 저장 안 된 경우 (중복 등)
               <Text style={[TYPOGRAPHY.caption2, styles.statusSkipped]}>
                (저장 안됨 - 중복 또는 오류)
              </Text>
            )}
             {!item.barcodeValue && ( // 바코드가 없는 경우
               <Text style={[TYPOGRAPHY.caption2, styles.statusSkipped]}>
                (바코드 인식 불가)
              </Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={[TYPOGRAPHY.h2, styles.headerTitle]}>기프티콘 자동 스캐너</Text>

      <View style={styles.scanOptionsContainer}>
        <Text style={[TYPOGRAPHY.body2, styles.folderInfo]}>
          현재 대상 폴더: {currentTargetFolder || '전체 갤러리'}
        </Text>
        {/* TODO: 폴더를 선택/변경할 수 있는 UI 추가 (예: Picker, TextInput) */}

        <CustomButton
          title={`"${currentTargetFolder || '지정 폴더'}" 새 이미지 스캔`}
          onPress={() =>
            handleScan({
              targetAlbum: currentTargetFolder,
              scanMode: 'newInAlbum',
              forceRescanProcessed: false, // 이전에 처리한 URI는 건너뛰도록
            })
          }
          disabled={isScanning || !currentTargetFolder}
          buttonStyle={styles.scanButton}
        />
        <CustomButton
          title={`"${currentTargetFolder || '지정 폴더'}" 전체 다시 스캔`}
          onPress={() =>
            handleScan({
              targetAlbum: currentTargetFolder,
              scanMode: 'allInAlbum',
              forceRescanProcessed: true, // 모든 이미지 재처리 (중복 저장은 서비스에서 방지)
            })
          }
          disabled={isScanning || !currentTargetFolder}
          buttonStyle={[styles.scanButton, { backgroundColor: COLORS.secondary }]}
        />
        <CustomButton
          title="전체 갤러리에서 새 이미지 스캔"
          onPress={() =>
            handleScan({
              scanMode: 'newInGallery',
              forceRescanProcessed: false,
            })
          }
          disabled={isScanning}
          buttonStyle={[styles.scanButton, { backgroundColor: COLORS.info }]}
        />
        <CustomButton
          title="수동 등록 화면으로 이동 (임시)"
          onPress={() => navigation.navigate('Upload')} // 'Upload' 화면으로 이동
          disabled={isScanning} // 스캔 중에는 비활성화
          buttonStyle={[styles.scanButton, { backgroundColor: COLORS.success }]} // 초록색 버튼
        />
        <CustomButton
          title="상세 정보 화면으로 이동 (임시)"
          onPress={() => 
            // 'Detail' 화면으로 이동하면서, 어떤 기프티콘을 보여줄지 ID를 함께 전달합니다.
            navigation.navigate('Detail', { gifticonId: 'dummy-123' })
          }
          disabled={isScanning}
          buttonStyle={[styles.scanButton, { backgroundColor: COLORS.warning }]} // 주황색 버튼
        />
        <CustomButton
          title="저장 로직 테스트 화면으로 (임시)"
          onPress={() => navigation.navigate('Temp')}
          disabled={isScanning}
          buttonStyle={[styles.scanButton, { backgroundColor: COLORS.gray5 }]} // 회색 버튼
        />
        <CustomButton
            title="설정 화면으로 (임시)"
            onPress={() => navigation.navigate('Setting')}
            containerStyle={{ marginTop: 8 }}
          />
      </View>

      {isScanning && (
        <View style={styles.progressContainer}>
          <ActivityIndicator size="large" color={COLORS.main} />
          <Text style={[TYPOGRAPHY.body4, styles.progressText]}>
            {scanProgress.currentTask || '스캔 중...'}
          </Text>
          {scanProgress.totalFetched !== undefined && (
             <Text style={TYPOGRAPHY.caption1}>
              {scanProgress.processed} / {scanProgress.totalFetched} 처리됨
            </Text>
          )}
        </View>
      )}

      {scanError && (
        <Text style={[TYPOGRAPHY.body5, styles.errorText]}>스캔 오류: {scanError}</Text>
      )}

      <Text style={[TYPOGRAPHY.h5, styles.listHeader]}>스캔 결과</Text>
      <FlatList
        data={[...scannedAndSavedGifticons, ...skippedOrDuplicateGifticons]} // 저장된 것과 스킵된 것 모두 표시
        renderItem={renderGifticonItem}
        keyExtractor={(item, index) => `${item.imageUri}-${index}-${item.barcodeValue || 'nobarcode'}`}
        style={styles.list}
        ListEmptyComponent={
          !isScanning ? (
            <Text style={[TYPOGRAPHY.body2, styles.emptyListText]}>
              스캔된 기프티콘이 없습니다. 스캔을 시작해주세요.
            </Text>
          ) : null
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: COLORS.white,
  },
  headerTitle: {
    textAlign: 'center',
    marginBottom: 20,
    color: COLORS.main,
  },
  scanOptionsContainer: {
    marginBottom: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray2,
  },
  folderInfo: {
    textAlign: 'center',
    marginBottom: 10,
    color: COLORS.gray7,
  },
  scanButton: {
    marginVertical: 5,
  },
  progressContainer: {
    alignItems: 'center',
    marginVertical: 15,
  },
  progressText: {
    marginTop: 8,
    color: COLORS.grayB,
  },
  errorText: {
    color: COLORS.error,
    textAlign: 'center',
    marginVertical: 10,
  },
  listHeader: {
    marginTop: 20,
    marginBottom: 10,
    color: COLORS.grayB,
  },
  list: {
    flex: 1,
  },
  itemContainer: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray1,
    alignItems: 'center',
    borderRadius: 6,
    marginBottom: 8,
  },
  itemStored: {
    backgroundColor: COLORS.gray1, // 저장된 항목 배경색
  },
  itemSkipped: {
    backgroundColor: '#fff0f0', // 스킵된 항목 배경색 (예시)
  },
  // thumbnail: { width: 50, height: 50, borderRadius: 4, marginRight: 12, resizeMode: 'cover' },
  itemDetails: {
    flex: 1,
  },
  barcodeValue: {
    color: COLORS.main,
    marginTop: 4,
    fontWeight: 'bold',
  },
  statusStored: {
    color: COLORS.success,
    fontSize: TYPOGRAPHY.caption2.fontSize,
    marginTop: 2,
  },
  statusSkipped: {
    color: COLORS.warning,
    fontSize: TYPOGRAPHY.caption2.fontSize,
    marginTop: 2,
  },
  emptyListText: {
    textAlign: 'center',
    marginTop: 30,
    color: COLORS.gray5,
  },
});
export default AutoScannerScreen;