// src/utils/permissionUtils.ts
import {
  request,
  check,
  PERMISSIONS,
  RESULTS,
  Permission,
  openSettings,
} from 'react-native-permissions';
import { Platform, Alert } from 'react-native';

const getAndroidGalleryPermission = (): Permission => {
  if (Platform.OS === 'android') {
    // Android 13 (API 33) 이상
    if (Platform.Version >= 33) {
      return PERMISSIONS.ANDROID.READ_MEDIA_IMAGES;
    }
    // Android 10 (API 29) ~ Android 12 (API 32)
    return PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE;
  }
  // 이 코드는 정상적인 경우 실행되지 않아야 합니다.
  // 타입스크립트의 엄격한 검사를 위해 기본값을 반환하거나,
  // 이 함수가 호출되는 컨텍스트에서 Platform.OS === 'android' 임을 보장해야 합니다.
  return PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE; // 임시 기본값
};

const PLATFORM_GALLERY_PERMISSION: Permission | null =
  Platform.OS === 'ios' ? PERMISSIONS.IOS.PHOTO_LIBRARY : getAndroidGalleryPermission();

const PLATFORM_CAMERA_PERMISSION: Permission | null =
  Platform.OS === 'ios' ? PERMISSIONS.IOS.CAMERA : PERMISSIONS.ANDROID.CAMERA;

// 권한이 영구적으로 거부되었을 때 설정으로 이동을 안내하는 Alert
const showPermissionBlockedAlert = (permissionName: string): void => {
  Alert.alert(
    `${permissionName} 접근 권한 필요`,
    `${permissionName} 접근 권한이 영구적으로 거부되었습니다. 앱 설정에서 직접 권한을 허용해주세요.`,
    [
      { text: '취소', style: 'cancel' },
      {
        text: '설정으로 이동',
        onPress: () => openSettings().catch(() => console.warn('Cannot open settings')),
      },
    ],
  );
};

// 권한 요청 함수
const checkAndRequestSinglePermission = async (
  permission: Permission | null,
  permissionName: string,
): Promise<boolean> => {
  if (!permission) {
    console.warn(`${permissionName} 권한이 현재 플랫폼에서 지원되지 않습니다.`);
    // 사용자에게 알릴 필요가 있다면 Alert 추가
    return false;
  }

  try {
    // 1. 현재 권한 상태 확인
    let currentStatus = await check(permission);
    console.log(`[${permissionName}] 초기 권한 상태: ${currentStatus}`);

    // 2. 이미 권한이 허용된 경우 (제한적 허용 포함)
    if (currentStatus === RESULTS.GRANTED || currentStatus === RESULTS.LIMITED) {
      console.log(`[${permissionName}] 이미 권한이 허용되었습니다.`);
      return true;
    }

    // 3. 권한을 요청할 수 있는 상태 (DENIED)
    // 사용자가 이전에 거부했거나, 아직 한 번도 요청하지 않은 경우
    if (currentStatus === RESULTS.DENIED) {
      console.log(`[${permissionName}] 권한을 요청합니다.`);
      const requestStatus = await request(permission); // 사용자에게 권한 요청 팝업 표시
      console.log(`[${permissionName}] 요청 후 권한 상태: ${requestStatus}`);

      if (requestStatus === RESULTS.GRANTED || requestStatus === RESULTS.LIMITED) {
        return true; // 사용자가 허용
      } else if (requestStatus === RESULTS.BLOCKED) {
        // 사용자가 "다시 묻지 않음"과 함께 거부한 경우
        showPermissionBlockedAlert(permissionName);
        return false;
      } else {
        // 사용자가 팝업에서 단순히 '거부'를 선택한 경우 (DENIED 상태 유지)
        // Alert.alert(`${permissionName} 권한 거부됨`, `기능을 사용하려면 ${permissionName} 접근 권한이 필요합니다.`);
        // 이 경우, 일단 false를 반환하고, 호출하는 쪽에서 필요하면 재요청 UI를 보여줄 수 있습니다.
        return false;
      }
    }

    // 4. 권한이 영구적으로 거부된 경우 (BLOCKED)
    if (currentStatus === RESULTS.BLOCKED) {
      console.log(`[${permissionName}] 권한이 영구적으로 거부되었습니다.`);
      showPermissionBlockedAlert(permissionName);
      return false;
    }

    // 5. 해당 기능을 사용할 수 없는 경우 (UNAVAILABLE)
    if (currentStatus === RESULTS.UNAVAILABLE) {
      console.log(`[${permissionName}] 해당 기능을 사용할 수 없습니다.`);
      Alert.alert(
        `${permissionName} 사용 불가`,
        `이 기기에서는 ${permissionName} 기능을 사용할 수 없습니다. (예: 카메라가 없는 기기)`,
      );
      return false;
    }

    // 6. 기타 알 수 없는 상태
    console.warn(`${permissionName} 권한의 상태를 알 수 없습니다: ${currentStatus}`);
    // Alert.alert(`${permissionName} 접근 불가`, `알 수 없는 이유로 ${permissionName} 접근이 불가능합니다.`);
    return false;

  } catch (error) {
    console.error(`Error checking/requesting ${permissionName} permission:`, error);
    Alert.alert('권한 오류', `${permissionName} 권한 처리 중 오류가 발생했습니다.`);
    return false;
  }
};

export const checkAndRequestGalleryPermission = async (): Promise<boolean> => {
  return checkAndRequestSinglePermission(PLATFORM_GALLERY_PERMISSION, '사진첩');
};

export const checkAndRequestCameraPermission = async (): Promise<boolean> => {
  return checkAndRequestSinglePermission(PLATFORM_CAMERA_PERMISSION, '카메라');
};