import AsyncStorage from '@react-native-async-storage/async-storage';
import RNFS from 'react-native-fs';

// 저장될 기프티콘 데이터의 형식을 정의합니다.
export interface GifticonData {
  id: string; // 고유 ID
  productName: string;
  brandName: string;
  expiryDate: string;
  barcode: string;
  memo?: string;
  isVoucher?: boolean;
  imagePath: string; // 앱 내부에 저장된 이미지 파일의 최종 경로
  createdAt: string;
}

// 기프티콘 정보를 저장하는 함수
export const saveGifticon = async (
  dataToSave: Omit<GifticonData, 'id' | 'imagePath' | 'createdAt' | 'status' | 'usedAt'>,
  originalImageUri: string,
): Promise<GifticonData> => {
  const id = Date.now().toString();
  const key = `${GIFTICON_KEY_PREFIX}${id}`;
  let newImagePath: string | null = null;

  try {
    const destinationDir = RNFS.DocumentDirectoryPath;
    const fileExtension = originalImageUri.split('.').pop()?.split('?')[0] || 'jpg';
    newImagePath = `${destinationDir}/gifticon_${id}.${fileExtension}`;

    // --- ⬇️ '이동' 대신 '복사'를 사용합니다. ⬇️ ---
    await RNFS.copyFile(originalImageUri, newImagePath);
    
    const gifticonToStore: GifticonData = {
      ...dataToSave,
      id,
      imagePath: newImagePath,
      createdAt: new Date().toISOString(),
      status: 'available',
      usedAt: null,
    };

    const jsonValue = JSON.stringify(gifticonToStore);
    await AsyncStorage.setItem(key, jsonValue);

    // --- ⬇️ 모든 저장이 성공한 후, 원본 파일을 삭제합니다. ⬇️ ---
    try {
        await RNFS.unlink(originalImageUri);
        console.log('원본 이미지 삭제 성공:', originalImageUri);
    } catch(unlinkError) {
        console.warn('원본 이미지 삭제 실패:', unlinkError);
        // 여기서 오류가 나도 등록 자체는 성공한 것이므로, 사용자에게는 오류를 알리지 않습니다.
    }
    
    return gifticonToStore;

  } catch (e) {
    if (newImagePath) {
      RNFS.unlink(newImagePath).catch(err => console.error('오류 롤백 파일 삭제 실패:', err));
    }
    console.error('기프티콘 저장 오류:', e);
    throw e;
  }
};