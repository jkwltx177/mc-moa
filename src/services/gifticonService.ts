import AsyncStorage from '@react-native-async-storage/async-storage';
import RNFS from 'react-native-fs';
import { CameraRoll } from '@react-native-camera-roll/camera-roll';
import defaultCategories from '../data/defaultCategories.json';

// --- 타입 정의 ---
export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export interface GifticonData {
  id: string;
  barcode: string;
  productName: string;
  brandName: string;
  expiryDate: string;
  memo: string;
  isVoucher: boolean;
  categoryId: string | null;
  imagePath: string;
  createdAt: string;
  status: 'available' | 'used';
  usedAt?: string | null;
}

export type StoredGifticonData = GifticonData;

// --- Key 상수 정의 ---
const GIFTICON_KEY_PREFIX = '@Gifticon:';
const CATEGORY_KEY_PREFIX = '@Category:';
const CATEGORIES_INITIALIZED_KEY = '@Categories_Initialized';


// =============================================
//               초기화 함수
// =============================================
export const initializeCategories = async () => {
  try {
    const isInitialized = await AsyncStorage.getItem(CATEGORIES_INITIALIZED_KEY);
    if (!isInitialized) {
      console.log('기본 카테고리 초기화를 시작합니다...');
      for (const category of defaultCategories) {
        const key = `${CATEGORY_KEY_PREFIX}${category.id}`;
        await AsyncStorage.setItem(key, JSON.stringify(category));
      }
      await AsyncStorage.setItem(CATEGORIES_INITIALIZED_KEY, 'true');
      console.log('기본 카테고리 초기화 완료.');
    }
  } catch (e) {
    console.error('카테고리 초기화 오류:', e);
  }
};


// =============================================
//               카테고리 관련 함수
// =============================================
export const saveCategory = async (categoryData: Omit<Category, 'id'>): Promise<Category> => {
  try {
    const id = categoryData.name.toLowerCase().replace(/ & /g, '-').replace(/\s+/g, '-');
    const key = `${CATEGORY_KEY_PREFIX}${id}`;
    const newCategory: Category = { id, ...categoryData };
    const jsonValue = JSON.stringify(newCategory);
    await AsyncStorage.setItem(key, jsonValue);
    return newCategory;
  } catch(e) {
    console.error('카테고리 저장 오류:', e);
    throw e;
  }
};

export const getCategory = async (id: string): Promise<Category | null> => {
    try {
        const jsonValue = await AsyncStorage.getItem(`${CATEGORY_KEY_PREFIX}${id}`);
        return jsonValue != null ? JSON.parse(jsonValue) : null;
    } catch(e) {
        console.error('카테고리 불러오기 오류:', e);
        return null;
    }
};

export const getAllCategories = async (): Promise<Category[]> => {
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    const categoryKeys = allKeys.filter(key => key.startsWith(CATEGORY_KEY_PREFIX));
    if (categoryKeys.length === 0) return [];
    const categoryPairs = await AsyncStorage.multiGet(categoryKeys);
    const categories = categoryPairs.map(pair => JSON.parse(pair[1] || '{}')).filter(c => c.id);
    return categories.sort((a, b) => a.name.localeCompare(b.name));
  } catch (e) {
    console.error('모든 카테고리 불러오기 오류:', e);
    return [];
  }
};

export const deleteCategory = async (id: string): Promise<void> => {
  // ⬇️ 여기가 문제가 발생했던 부분입니다. 올바른 try-catch 구문으로 수정되었습니다.
  try {
    const key = `${CATEGORY_KEY_PREFIX}${id}`;
    await AsyncStorage.removeItem(key);
    console.log(`[서비스] 카테고리 ${id} 삭제 완료.`);
  } catch (e) {
    console.error('[서비스] deleteCategory 함수 오류:', e);
    throw e;
  }
};


// =============================================
//               기프티콘 관련 함수
// =============================================
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
    await RNFS.copyFile(originalImageUri, newImagePath);
    const gifticonToStore: GifticonData = { ...dataToSave, id, imagePath: newImagePath, createdAt: new Date().toISOString(), status: 'available', usedAt: null };
    const jsonValue = JSON.stringify(gifticonToStore);
    await AsyncStorage.setItem(key, jsonValue);
    try {
      if (originalImageUri.startsWith('file://')) {
        await CameraRoll.deletePhotos([originalImageUri]);
      }
    } catch(deleteError) {
      console.warn('CameraRoll 원본 이미지 삭제 실패:', deleteError);
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

export const getGifticon = async (id: string): Promise<GifticonData | null> => {
    try {
        const jsonValue = await AsyncStorage.getItem(`${GIFTICON_KEY_PREFIX}${id}`);
        return jsonValue != null ? JSON.parse(jsonValue) : null;
    } catch(e) {
        console.error('기프티콘 불러오기 오류:', e);
        return null;
    }
};

export const getAllGifticons = async (): Promise<GifticonData[]> => {
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    const gifticonKeys = allKeys.filter(key => key.startsWith(GIFTICON_KEY_PREFIX));
    if (gifticonKeys.length === 0) return [];
    const gifticonPairs = await AsyncStorage.multiGet(gifticonKeys);
    const gifticons = gifticonPairs.map(pair => JSON.parse(pair[1] || '{}')).filter(g => g.id);
    return gifticons.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (e) {
    console.error('모든 기프티콘 불러오기 오류:', e);
    return [];
  }
};

export const updateGifticonStatus = async (id: string, newStatus: 'used' | 'available'): Promise<GifticonData> => {
    const gifticon = await getGifticon(id);
    if (!gifticon) throw new Error('기프티콘을 찾을 수 없습니다.');
    gifticon.status = newStatus;
    gifticon.usedAt = newStatus === 'used' ? new Date().toISOString() : null;
    const jsonValue = JSON.stringify(gifticon);
    await AsyncStorage.setItem(`${GIFTICON_KEY_PREFIX}${id}`, jsonValue);
    return gifticon;
};

export const updateGifticon = async (id: string, dataToUpdate: Partial<Omit<GifticonData, 'id' | 'imagePath' | 'createdAt'>>): Promise<GifticonData> => {
  try {
    const existingGifticon = await getGifticon(id);
    if (!existingGifticon) throw new Error('수정할 기프티콘을 찾을 수 없습니다.');
    const updatedGifticon: GifticonData = { ...existingGifticon, ...dataToUpdate };
    const jsonValue = JSON.stringify(updatedGifticon);
    await AsyncStorage.setItem(`${GIFTICON_KEY_PREFIX}${id}`, jsonValue);
    return updatedGifticon;
  } catch (e) {
    console.error('기프티콘 업데이트 오류:', e);
    throw e;
  }
};

export const deleteGifticon = async (id: string): Promise<void> => {
  const key = `${GIFTICON_KEY_PREFIX}${id}`;
  try {
    const gifticon = await getGifticon(id);
    await AsyncStorage.removeItem(key);
    if (gifticon?.imagePath) {
      const fileExists = await RNFS.exists(gifticon.imagePath);
      if (fileExists) await RNFS.unlink(gifticon.imagePath);
    }
  } catch (e) {
    console.error('기프티콘 삭제 오류:', e);
    throw e;
  }
};

export const deleteUsedAndExpiredGifticons = async (): Promise<number> => {
  try {
    // 1. 모든 기프티콘을 불러옵니다.
    const allGifticons = await getAllGifticons();
    const today = new Date();
    today.setHours(0, 0, 0, 0); // 정확한 날짜 비교를 위해 시간은 0으로 설정

    // 2. 삭제할 기프티콘을 필터링합니다.
    const gifticonsToDelete = allGifticons.filter(g => 
      g.status === 'used' || new Date(g.expiryDate) < today
    );

    // 삭제할 것이 없으면 0을 반환하고 종료
    if (gifticonsToDelete.length === 0) {
      console.log('삭제할 사용완료/기간만료 기프티콘이 없습니다.');
      return 0;
    }

    // 3. 삭제할 항목들의 Key와 이미지 경로 목록을 만듭니다.
    const keysToDelete = gifticonsToDelete.map(g => `${GIFTICON_KEY_PREFIX}${g.id}`);
    const imagePathsToDelete = gifticonsToDelete.map(g => g.imagePath).filter(Boolean); // null, undefined 제외

    // 4. AsyncStorage에서 모든 정보들을 한 번에 삭제합니다.
    await AsyncStorage.multiRemove(keysToDelete);

    // 5. 모든 이미지 파일들을 하나씩 삭제합니다.
    for (const path of imagePathsToDelete) {
      try {
        if (await RNFS.exists(path)) {
          await RNFS.unlink(path);
        }
      } catch (e) {
        console.warn(`일괄 삭제 중 이미지 파일 삭제 실패: ${path}`, e);
        // 개별 이미지 삭제에 실패해도 전체 프로세스를 중단하지 않습니다.
      }
    }

    console.log(`${gifticonsToDelete.length}개의 기프티콘을 일괄 삭제했습니다.`);
    return gifticonsToDelete.length;

  } catch (e) {
    console.error('사용완료/기간만료 기프티콘 일괄 삭제 오류:', e);
    throw e;
  }

};

export const checkDuplicateBarcode = async (barcode: string): Promise<boolean> => {
    try {
        const allGifticons = await getAllGifticons();
        return allGifticons.some(g => g.barcode === barcode);
    } catch (e) {
        console.error('바코드 중복 확인 오류:', e);
        return false; // 오류 발생 시 중복이 아닌 것으로 처리하여 등록 시도를 막지 않음
    }
};