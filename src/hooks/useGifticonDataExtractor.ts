// src/hooks/useGifticonDataExtractor.ts
import { useState } from 'react';
import { Platform } from 'react-native';

// @react-native-ml-kit/text-recognition 에서 필요한 모듈 import
import TextRecognition, {
  TextRecognitionResult, // 라이브러리가 제공하는 결과 타입
  TextRecognitionScript, // 한국어 등 스크립트 지정을 위한 타입
} from '@react-native-ml-kit/text-recognition';

// @react-native-ml-kit/barcode-scanning 에서 필요한 모듈 import
import BarcodeScanning, {
  Barcode, // 라이브러리가 제공하는 바코드 타입
  BarcodeFormat, // 바코드 포맷을 위한 타입 (필요시)
} from '@react-native-ml-kit/barcode-scanning';

// 이 훅이 반환할 추출된 정보의 타입 정의 (이전과 동일)
export interface ExtractedGifticonInfo {
  imageUri: string;
  barcodeValue: string | null;
  barcodeFormat?: string; // 바코드 포맷 (예: "CODE_128", "QR_CODE")
  brandName: string | null;
  productName: string | null;
  expiryDate: string | null;
  amount: string | null;
  fullText: string;
  // rawTextResult?: TextRecognitionResult; // 디버깅용
  // rawBarcodeResult?: Barcode[];          // 디버깅용
}

interface UseGifticonDataExtractorReturn {
  extractedInfo: ExtractedGifticonInfo | null;
  isProcessing: boolean;
  error: string | null;
  processImageForGifticonData: (imageUri: string) => Promise<ExtractedGifticonInfo | null>;
}

// --- 정보 파싱을 위한 헬퍼 함수들 ---
// (이전 답변에서 제공한 parseBrandName, parseProductName, parseExpiryDate, parseAmount 함수들 그대로 사용)
const parseBrandName = (text: string): string | null => {
  const patterns = [
    /(스[타벅]{2,}|STARBUCKS)/i,
    /(투썸플레이스|투썸|TWOSOME\s*PLACE)/i,
    /(GS25|지에스25)/i,
    /(CU|씨유)/i,
    /(메가커피|MEGA\s*MGC\s*COFFEE)/i,
    /(파리바게[트뜨]|PARIS\s*BAGUETTE)/i,
    /(뚜레쥬르|TOUS\s*les\s*JOURS)/i,
    /(배스킨라빈스|배라|BASKIN\s*ROBBINS)/i,
    /(교촌치킨|KYOCHON)/i,
    /(BBQ|비비큐)/i,
    /(BHC)/i,
    /(올리브영|OLIVE\s*YOUNG)/i,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[0]) return match[0].toUpperCase();
  }
  return null;
};

const parseProductName = (text: string): string | null => {
  const patterns = [
    /상품명[:\s]*(.+?)(?=\n|유효기간|교환처|바코드번호|$)/i,
    /제품명[:\s]*(.+?)(?=\n|유효기간|교환처|바코드번호|$)/i,
    /(?:교환권|금액권|잔액권|아메리카노|카페라떼|케이크|치킨\s한마리)(?:\s\(.*?\))?/i,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) return match[1].trim();
    if (match && match[0] && !pattern.source.includes(":")) return match[0].trim();
  }
  return null;
};

const parseExpiryDate = (text: string): string | null => {
  const patterns = [
    /유효기간[:\s]*(\d{4})[년.\s/-]*(\d{1,2})[월.\s/-]*(\d{1,2})[일\s]*(?:까지)?/i,
    /사용기간[:\s]*(\d{4})[년.\s/-]*(\d{1,2})[월.\s/-]*(\d{1,2})[일\s]*(?:까지)?/i,
    /사용기한[:\s]*(\d{4})[년.\s/-]*(\d{1,2})[월.\s/-]*(\d{1,2})[일\s]*(?:까지)?/i,
    /(\d{4})[년.\s/-]*(\d{1,2})[월.\s/-]*(\d{1,2})[일\s]*(?:까지| 사용가능|교환 가능)/i,
    /~ ?(\d{4}\.\d{2}\.\d{2})/i,
    /(\d{4}\.\d{2}\.\d{2})~?(\d{4}\.\d{2}\.\d{2})?/i,
    /EXPIRY\s*DATE[:\s]*(\d{2})\/(\d{2})\/(\d{4})/i,
    /VALID\s*UNTIL[:\s]*(\d{2})\/(\d{2})\/(\d{4})/i,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      let year, month, day;
      if (pattern.source.includes("~ ")) {
        const dateParts = match[1].split('.');
        year = dateParts[0]; month = dateParts[1]; day = dateParts[2];
      } else if (pattern.source.includes("EXPIRY") || pattern.source.includes("VALID")) {
        year = match[3]; month = match[1]; day = match[2];
      } else if (match[3]) {
        year = match[1]; month = match[2]; day = match[3];
      } else if (match[2] && match[1].includes(".")) {
         const dateParts = match[2] ? match[2].split('.') : match[1].split('.');
         year = dateParts[0]; month = dateParts[1]; day = dateParts[2];
      } else { continue; }
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
  }
  return null;
};

const parseAmount = (text: string): string | null => {
  const patterns = [
    /금액[:\s]*([\d,]+원)/i,
    /상품금액[:\s]*([\d,]+원)/i,
    /\b([\d,]{3,}원)\b/i,
    /(교환권|무료\s*쿠폰|할인권)/i,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) return match[1].replace(/,/g, '');
  }
  return null;
};
// --- 헬퍼 함수들 끝 ---


const useGifticonDataExtractor = (): UseGifticonDataExtractorReturn => {
  const [extractedInfo, setExtractedInfo] = useState<ExtractedGifticonInfo | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processImageForGifticonData = async (imageUri: string): Promise<ExtractedGifticonInfo | null> => {
    let processedUri = imageUri;
    // URI 전처리 (react-native-image-picker 결과에 따라 file:// 스키마 처리)
    if (Platform.OS === 'android' && !imageUri.startsWith('file://')) {
      processedUri = `file://${imageUri}`;
    } else if (Platform.OS === 'ios' && imageUri.startsWith('file://')) {
      // iOS에서 'file://' 스키마를 제거해야 할 수도 있고, 그대로 둬야 할 수도 있습니다.
      // 라이브러리 문서나 테스트를 통해 확인 필요. 우선은 제거하지 않는 것으로 가정.
      // processedUri = imageUri.substring(7);
    }

    setIsProcessing(true);
    setError(null);
    setExtractedInfo(null);

    try {
      // 1. 텍스트 인식 (README.md 참고)
      // 한국어 인식을 위해 TextRecognitionScript.KOREAN 사용
      const textRecognitionResult: TextRecognitionResult = await TextRecognition.recognize(
        processedUri,
        TextRecognitionScript.KOREAN // 한국어 스크립트 지정
      );
      const fullText = textRecognitionResult?.text || '';

      // 2. 바코드 스캔 (README.md 참고)
      // BarcodeScannerOptions는 필요에 따라 설정 (예: 특정 포맷만 스캔)
      const barcodes: Barcode[] = await BarcodeScanning.scan(processedUri);

      let barcodeValue: string | null = null;
      let barcodeFormatString: string | undefined;

      if (barcodes && barcodes.length > 0) {
        const firstBarcode = barcodes[0];
        barcodeValue = firstBarcode.value || null; // displayValue 또는 rawValue 사용 가능
        // barcodeFormatString = Barcode.getFormatString(firstBarcode.format); // 라이브러리가 이런 유틸 함수를 제공하는지 확인 필요
        // 또는 firstBarcode.format (숫자) 값을 문자열로 매핑하는 함수 직접 구현
        // 예: BarcodeFormat[firstBarcode.format] (enum을 문자열로)
        if (firstBarcode.format) {
            // BarcodeFormat enum의 숫자 값에 해당하는 문자열 키를 찾는 방법 (주의: 이 방식은 enum 구조에 따라 달라짐)
            const formatKey = Object.keys(BarcodeFormat).find(key => BarcodeFormat[key as keyof typeof BarcodeFormat] === firstBarcode.format);
            barcodeFormatString = formatKey;
        }
      }

      // 3. 정보 파싱 (이전과 동일한 헬퍼 함수 사용)
      const brandName = parseBrandName(fullText);
      const productName = parseProductName(fullText);
      const expiryDate = parseExpiryDate(fullText);
      const amount = parseAmount(fullText);

      const info: ExtractedGifticonInfo = {
        imageUri: imageUri, // 원본 URI 저장
        barcodeValue,
        barcodeFormat: barcodeFormatString,
        brandName,
        productName,
        expiryDate,
        amount,
        fullText,
        // rawTextResult: textRecognitionResult, // 필요시 원본 결과 저장
        // rawBarcodeResult: barcodes,           // 필요시 원본 결과 저장
      };

      setExtractedInfo(info);
      return info;

    } catch (e: any) {
      console.error("Error processing image for gifticon data:", e);
      let errorMessage = "이미지 처리 중 오류가 발생했습니다.";
      if (e.message) {
        errorMessage += `\n${e.message}`;
      }
      setError(errorMessage);
      return null;
    } finally {
      setIsProcessing(false);
    }
  };

  return { extractedInfo, isProcessing, error, processImageForGifticonData };
};

export default useGifticonDataExtractor;