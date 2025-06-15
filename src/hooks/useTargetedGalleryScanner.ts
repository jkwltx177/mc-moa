// src/hooks/useTargetedGalleryScanner.ts
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { CameraRoll, GetPhotosParams, PhotoIdentifier } from '@react-native-camera-roll/camera-roll';
import { checkAndRequestGalleryPermission } from '../utils/permissionUtils';
import useGifticonDataExtractor, { ExtractedGifticonInfo } from './useGifticonDataExtractor';
import { saveGifticon, checkDuplicateBarcode, StoredGifticonData } from '../services/gifticonService';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LAST_SCANNED_TIMESTAMP_KEY_PREFIX = '@last_scanned_timestamp_';
const PROCESSED_URIS_KEY_PREFIX = '@processed_uris_';

// PageInfo 타입을 직접 정의 (라이브러리가 export 안 할 경우)
interface PageInfo {
    has_next_page: boolean;
    start_cursor?: string; // 시작 커서는 없을 수 있음
    end_cursor?: string;   // 다음 페이지 요청 시 사용할 커서
}

export interface GalleryScanOptions {
  targetAlbum?: string;
  scanMode?: 'allInAlbum' | 'newInAlbum' | 'newInGallery';
  forceRescanProcessed?: boolean;
  batchSize?: number;
}

interface UseTargetedGalleryScannerReturn {
  scannedAndSavedGifticons: StoredGifticonData[];
  skippedOrDuplicateGifticons: ExtractedGifticonInfo[];
  isScanning: boolean;
  scanProgress: { processed: number; totalFetched?: number; currentTask?: string };
  scanError: string | null;
  startScan: (options: GalleryScanOptions) => Promise<void>;
}

const useTargetedGalleryScanner = (): UseTargetedGalleryScannerReturn => {
  const [scannedAndSavedGifticons, setScannedAndSavedGifticons] = useState<StoredGifticonData[]>([]);
  const [skippedOrDuplicateGifticons, setSkippedOrDuplicateGifticons] = useState<ExtractedGifticonInfo[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState<{ processed: number; totalFetched?: number; currentTask?: string }>({ processed: 0 });
  const [scanError, setScanError] = useState<string | null>(null);

  const { processImageForGifticonData } = useGifticonDataExtractor();
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const getProcessedUris = useCallback(async (key: string): Promise<string[]> => {
    try {
      const uris = await AsyncStorage.getItem(key);
      return uris ? JSON.parse(uris) : [];
    } catch (e) {
      console.error('Failed to get processed URIs:', e);
      return [];
    }
  }, []);

  const addProcessedUri = useCallback(async (key: string, uri: string) => {
    try {
      const uris = await getProcessedUris(key);
      if (!uris.includes(uri)) {
        uris.push(uri);
        await AsyncStorage.setItem(key, JSON.stringify(uris));
      }
    } catch (e) {
      console.error('Failed to add processed URI:', e);
    }
  }, [getProcessedUris]);

  const startScan = useCallback(async (options: GalleryScanOptions) => {
    if (!isMountedRef.current) {
      return;
    }
    const hasPermission = await checkAndRequestGalleryPermission();
    if (!hasPermission) {
      setScanError('갤러리 접근 권한이 필요합니다. 스캔 버튼을 다시 누르면 권한을 요청합니다.');
      setIsScanning(false); // 스캔 상태 명시적 종료
      return;
    }

    setIsScanning(true);
    setScanError(null);
    setScannedAndSavedGifticons([]); // 스캔 시작 시 이전 결과 초기화
    setSkippedOrDuplicateGifticons([]); // 스킵된 항목도 초기화
    setScanProgress({ processed: 0, totalFetched: 0, currentTask: '갤러리 접근 중...' });

    const { targetAlbum, scanMode = 'newInGallery', forceRescanProcessed = false, batchSize = 50 } = options; // batchSize 조정
    const storageKeySuffix = targetAlbum ? `album_${targetAlbum.replace(/\s+/g, '_')}` : 'all_gallery';
    const lastScannedTimestampKey = `${LAST_SCANNED_TIMESTAMP_KEY_PREFIX}${storageKeySuffix}`;
    const processedUrisKey = `${PROCESSED_URIS_KEY_PREFIX}${storageKeySuffix}`;

    let lastScannedTimestamp = 0;
    if (scanMode === 'newInAlbum' || scanMode === 'newInGallery') {
      try {
        const storedTimestamp = await AsyncStorage.getItem(lastScannedTimestampKey);
        lastScannedTimestamp = storedTimestamp ? parseInt(storedTimestamp, 10) : 0;
      } catch (e) {
        console.error('Failed to get last scanned timestamp:', e);
        lastScannedTimestamp = 0;
      }
    }

    const processedUris = forceRescanProcessed ? [] : await getProcessedUris(processedUrisKey);
    let currentMaxTimestampForSession = lastScannedTimestamp;
    let totalFetchedInThisSession = 0;

    try {
      const params: GetPhotosParams = {
        first: batchSize,
        assetType: 'Photos', // README에 따르면 기본값이 Photos
        // fromTime은 milliseconds 단위 (README 확인)
        // toTime도 필요시 설정 가능
      };

      if (scanMode === 'newInAlbum' || scanMode === 'newInGallery') {
        if (lastScannedTimestamp > 0) {
          // fromTime은 해당 시간보다 이후의 사진을 가져옴 (exclusive)
          params.fromTime = lastScannedTimestamp;
          // 주의: fromTime만 사용 시, 이전에 처리했지만 fromTime 이후인 사진도 가져올 수 있음.
          // processedUris로 추가 필터링 필요.
        }
      }

      if (targetAlbum && (scanMode === 'allInAlbum' || scanMode === 'newInAlbum')) {
        params.groupName = targetAlbum;
        // README에 따르면 groupTypes의 기본값은 'All'이지만, 앨범 필터링 시 'Album'으로 명시하는 것이 안전할 수 있음
        // iOS에서는 params.groupTypes = 'Album'; 를 명시해야 특정 앨범의 사진을 가져올 수 있습니다.
        // Android에서는 groupName만으로도 폴더(앨범) 필터링이 될 수 있습니다.
        if (Platform.OS === 'ios') {
          params.groupTypes = 'Album';
        }
      }

      let pageInfo: PageInfo = { has_next_page: true, end_cursor: undefined };
      let processedInThisScan = 0;

      if (!isMountedRef.current) { setIsScanning(false); return; }
      setScanProgress(prev => ({ ...prev, currentTask: '이미지 목록 가져오는 중...' }));

      while (pageInfo.has_next_page) {
        if (!isMountedRef.current) { setIsScanning(false); return; }
        if (pageInfo.end_cursor) {
          params.after = pageInfo.end_cursor;
        }

        const photosResult = await CameraRoll.getPhotos(params);
        totalFetchedInThisSession += photosResult.edges.length;
        pageInfo = photosResult.page_info as PageInfo;

        if (photosResult.edges.length === 0 && !pageInfo.has_next_page) { break; }

        if (!isMountedRef.current) { setIsScanning(false); return; }
        setScanProgress(prev => ({
          ...prev,
          totalFetched: totalFetchedInThisSession,
          currentTask: `${totalFetchedInThisSession}개 이미지 로드됨. 분석 중...`,
        }));

        for (const edge of photosResult.edges) {
          if (!isMountedRef.current) { setIsScanning(false); return; }

          // PhotoIdentifier의 node 구조는 라이브러리 반환값을 따릅니다.
          // 일반적으로 timestamp, image.uri, image.filename 등이 있습니다.
          const imageNode = edge.node;
          const imageUri = imageNode.image.uri;
          const imageTimestampMs = imageNode.timestamp * 1000; // timestamp는 초 단위 Unix timestamp
          const filename = imageNode.image.filename;

          currentMaxTimestampForSession = Math.max(currentMaxTimestampForSession, imageTimestampMs);

          if (!forceRescanProcessed && processedUris.includes(imageUri)) {
            console.log(`Skipping already processed (by URI): ${filename || imageUri}`);
            continue;
          }
          // fromTime으로 필터링 되었더라도, 더 정확한 제어를 위해 한번 더 체크
          if ((scanMode === 'newInAlbum' || scanMode === 'newInGallery') && imageTimestampMs <= lastScannedTimestamp) {
            if (!forceRescanProcessed) { // 강제 재스캔이 아니면 오래된 것은 스킵
                 console.log(`Skipping old image (by timestamp): ${filename || imageUri}`);
                 continue;
            }
          }

          processedInThisScan++;
          if (isMountedRef.current) {
            setScanProgress(prev => ({ ...prev, processed: (prev.processed || 0) + 1, currentTask: `${filename || '이미지'} 분석 중...` }));
          }

          const extractedInfo = await processImageForGifticonData(imageUri);

          if (extractedInfo && extractedInfo.barcodeValue) {
            const isDuplicate = await checkDuplicateBarcode(extractedInfo.barcodeValue);
            if (!isDuplicate) {
                const gifticonToSave = {
                    ...extractedInfo,
                    barcodeValue: extractedInfo.barcodeValue, // 여기서 extractedInfo.barcodeValue는 string
                  } as Omit<ExtractedGifticonInfo, 'barcodeValue'> & { barcodeValue: string };
              
                const savedGifticon = await saveGifticon(gifticonToSave);
                if (savedGifticon && isMountedRef.current) {
                  setScannedAndSavedGifticons(prev => [...prev, savedGifticon]);
                }
            } else {
              if (isMountedRef.current) {
                setSkippedOrDuplicateGifticons(prev => [...prev, extractedInfo]);
              }
            }
          } else if (extractedInfo) { // 바코드는 없지만 OCR은 된 경우
            if (isMountedRef.current) {
              setSkippedOrDuplicateGifticons(prev => [...prev, extractedInfo]);
            }
          }

          if (!forceRescanProcessed) {
            await addProcessedUri(processedUrisKey, imageUri);
          }
        } // end of for loop (edges)

        if (!pageInfo.has_next_page) { break; }
      } // end of while loop

      if (currentMaxTimestampForSession > lastScannedTimestamp && (scanMode === 'newInAlbum' || scanMode === 'newInGallery')) {
        try {
            await AsyncStorage.setItem(lastScannedTimestampKey, currentMaxTimestampForSession.toString());
        } catch (e) {
            console.error('Failed to save last scanned timestamp:', e);
        }
      }
      if (isMountedRef.current) {
        setScanProgress(prev => ({ ...prev, currentTask: '스캔 완료!' }));
      }
      console.log('갤러리 스캔 완료. 총 가져온 이미지:', totalFetchedInThisSession, '실제 처리 시도:', processedInThisScan, '새로 저장:', scannedAndSavedGifticons.length);

    } catch (e: any) {
      console.error('Error during gallery scan:', e);
      if (isMountedRef.current) {
        setScanError(e.message || '갤러리 스캔 중 알 수 없는 오류가 발생했습니다.');
      }
    } finally {
      if (isMountedRef.current) {
        setIsScanning(false);
      }
    }
  }, [
    processImageForGifticonData,
    getProcessedUris,
    addProcessedUri,
    // scannedAndSavedGifticons.length, // ESLint가 이것을 제안했다면 추가
    // 또는 scannedAndSavedGifticons, setScannedAndSavedGifticons 중 필요한 것
    // 함수 내부에서 scannedAndSavedGifticons를 직접 참조하여 값을 변경하거나,
    // 그 길이를 기반으로 다른 로직을 수행한다면 의존성에 포함되어야 합니다.
    // 현재 코드에서는 console.log에서만 사용되므로, 이 경우에는 length를 넣어도 되고,
    // 만약 setScannedAndSavedGifticons를 호출한 결과를 바로 다음에 사용한다면 set 함수를 넣을 수도 있습니다.
    // 일반적으로는 set 함수는 의존성 배열에 넣지 않아도 React가 안정성을 보장합니다.
    // 여기서는 console.log에 사용되었으므로, scannedAndSavedGifticons 자체를 넣는 것이 더 안전할 수 있습니다.
    scannedAndSavedGifticons 
  ]);

  return { scannedAndSavedGifticons, skippedOrDuplicateGifticons, isScanning, scanProgress, scanError, startScan };
};

export default useTargetedGalleryScanner;