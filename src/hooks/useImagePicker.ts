// src/hooks/useImagePicker.ts
import { useState } from 'react';
import {
  launchImageLibrary,
  launchCamera,
  ImageLibraryOptions,
  CameraOptions,
  ImagePickerResponse,
  Asset,
} from 'react-native-image-picker';
import { checkAndRequestGalleryPermission, checkAndRequestCameraPermission } from '../utils/permissionUtils';
import { Alert } from 'react-native';

interface UseImagePickerReturn {
  selectedImage: Asset | null;
  selectedImages: Asset[];
  pickImage: (options?: Partial<ImageLibraryOptions & CameraOptions & { source?: 'gallery' | 'camera' }>) => Promise<Asset | null>;
  pickMultipleImagesFromGallery: (options?: Partial<ImageLibraryOptions>) => Promise<Asset[] | null>;
  error: string | null;
}

const defaultImageLibraryOptions: ImageLibraryOptions = {
  mediaType: 'photo',
  quality: 0.8,
  includeBase64: false,
};

const defaultCameraOptions: CameraOptions = {
  mediaType: 'photo',
  quality: 0.8,
  includeBase64: false,
  saveToPhotos: true,
};

const useImagePicker = (): UseImagePickerReturn => {
  const [selectedImage, setSelectedImage] = useState<Asset | null>(null);
  const [selectedImages, setSelectedImages] = useState<Asset[]>([]);
  const [error, setError] = useState<string | null>(null);

  // handleResponse의 resolve 타입을 호출 시점에 맞게 구체화
  const handleResponse = (
    response: ImagePickerResponse,
    resolve: (value: any) => void, // 타입을 any로 열어두거나, 호출 시점에 맞는 구체적인 타입으로 캐스팅
    selectionLimit: number = 1,
  ) => {
    if (response.didCancel) {
      console.log('User cancelled image picker');
      resolve(null);
      return;
    }
    if (response.errorCode) {
      const errorMessage = response.errorMessage || `Error: ${response.errorCode}`;
      console.log('ImagePicker Error: ', response.errorCode, errorMessage);
      setError(errorMessage);
      Alert.alert('이미지 선택 오류', errorMessage);
      resolve(null);
      return;
    }
    if (response.assets && response.assets.length > 0) {
      if (selectionLimit === 0 || selectionLimit > 1) { // 다중 선택
        setSelectedImages(response.assets);
        resolve(response.assets);
      } else { // 단일 선택
        setSelectedImage(response.assets[0]);
        resolve(response.assets[0]);
      }
    } else {
      resolve(null);
    }
  };

  const pickImage = async (
    optionsInput?: Partial<ImageLibraryOptions & CameraOptions & { source?: 'gallery' | 'camera' }>,
  ): Promise<Asset | null> => {
    setError(null);
    const source = optionsInput?.source || 'gallery';
    let pickerOptions: ImageLibraryOptions | CameraOptions;
    let hasPermission = false;

    if (source === 'gallery') {
      pickerOptions = { ...defaultImageLibraryOptions, ...optionsInput, selectionLimit: 1 };
      hasPermission = await checkAndRequestGalleryPermission();
    } else {
      pickerOptions = { ...defaultCameraOptions, ...optionsInput, selectionLimit: 1 };
      hasPermission = await checkAndRequestCameraPermission();
    }

    if (!hasPermission) {
      const permissionType = source === 'gallery' ? '갤러리' : '카메라';
      setError(`${permissionType} 접근 권한이 거부되었습니다.`);
      return null;
    }

    // Promise의 resolve 타입을 명시적으로 (value: Asset | null) => void로 지정
    return new Promise<Asset | null>((resolvePromise: (value: Asset | null) => void) => {
      const resolverForHandleResponse = (value: Asset | null) => resolvePromise(value);

      if (source === 'gallery') {
        launchImageLibrary(pickerOptions as ImageLibraryOptions, (response) =>
          // handleResponse에 전달하는 resolve는 (value: Asset | null) => void 타입이어야 함
          handleResponse(response, resolverForHandleResponse, 1),
        );
      } else {
        launchCamera(pickerOptions as CameraOptions, (response) =>
          handleResponse(response, resolverForHandleResponse, 1),
        );
      }
    });
  };

  const pickMultipleImagesFromGallery = async (
    optionsInput?: Partial<ImageLibraryOptions>,
  ): Promise<Asset[] | null> => {
    setError(null);
    const hasPermission = await checkAndRequestGalleryPermission();
    if (!hasPermission) {
      setError('갤러리 접근 권한이 거부되었습니다.');
      return null;
    }

    const pickerOptions: ImageLibraryOptions = {
      ...defaultImageLibraryOptions,
      selectionLimit: 0,
      ...optionsInput,
    };

    // Promise의 resolve 타입을 명시적으로 (value: Asset[] | null) => void로 지정
    return new Promise<Asset[] | null>((resolvePromise: (value: Asset[] | null) => void) => {
      const resolverForHandleResponse = (value: Asset[] | null) => resolvePromise(value);
      launchImageLibrary(pickerOptions, (response) =>
        // handleResponse에 전달하는 resolve는 (value: Asset[] | null) => void 타입이어야 함
        handleResponse(response, resolverForHandleResponse, 0),
      );
    });
  };

  return { selectedImage, selectedImages, pickImage, pickMultipleImagesFromGallery, error };
};

export default useImagePicker;