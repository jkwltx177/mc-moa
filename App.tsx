/**
 * Moa App
 *
 * @format
 */

import React, { useEffect } from 'react';
import SplashScreenNative from 'react-native-splash-screen'; // 네이티브 스플래시 스크린 라이브러리
import AppNavigator from './src/navigation/AppNavigator'; // 우리가 만들 앱 네비게이터
import { initializeCategories } from './src/services/gifticonService';

// TypeScript를 사용하고 있으므로, PropsWithChildren이나 다른 타입 정의는
// AppNavigator 내부 또는 다른 컴포넌트에서 필요에 따라 사용됩니다.
// App 컴포넌트 자체는 특별한 props를 받지 않을 수 있습니다.

function App(): React.JSX.Element { // 또는 JSX.Element 반환 타입으로 명시
  useEffect(() => {
    // 앱이 시작될 때 네이티브 스플래시 화면을 숨깁니다.
    // 이 작업은 Android와 iOS 양쪽에서 네이티브 스플래시 설정이 완료된 후에 의미가 있습니다.
    SplashScreenNative.hide();
    //initializeCategories();
  }, []); // 빈 의존성 배열은 컴포넌트가 처음 마운트될 때 한 번만 실행되도록 합니다.

  // AppNavigator를 렌더링하여 앱의 전체 화면 흐름을 관리합니다.
  return <AppNavigator />;
}

// 기본 스타일은 App.tsx에 직접 둘 필요는 없습니다.
// 각 화면이나 컴포넌트에서 StyleSheet.create를 사용하여 스타일을 정의합니다.
// const styles = StyleSheet.create({ ... }); // 이 부분은 삭제하거나 주석 처리

export default App;