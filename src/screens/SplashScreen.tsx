// src/screens/SplashScreen.tsx
import React, { useEffect } from 'react';
import { View, Image, StyleSheet, Text, StatusBar, Platform } from 'react-native';
import { COLORS } from '../constants/colors';
import { TYPOGRAPHY } from '../constants/typography';
import { CommonActions, NavigationProp } from '@react-navigation/native'; // CommonActions, NavigationProp import
import { RootStackParamList } from '../navigation/AppNavigator'; // AppNavigator에서 정의한 ParamList import

// SplashScreen의 navigation prop 타입 정의
type SplashScreenNavigationProp = NavigationProp<RootStackParamList, 'Splash'>;

interface SplashScreenProps {
  navigation: SplashScreenNavigationProp;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ navigation }) => { // props 타입 적용
  useEffect(() => {
    StatusBar.setBarStyle('dark-content');
    if (Platform.OS === 'android') {
      StatusBar.setBackgroundColor(COLORS.white);
    }

    const timer = setTimeout(() => {
      // AutoScannerScreen으로 이동하고, 스택에서 Splash 화면을 제거 (뒤로 가기 방지)
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'MainTabs' }], // AppNavigator에 정의된 AutoScannerScreen의 라우트 이름
        })
      );
      // 또는 간단히 replace 사용 (뒤로가기 시 이전 스택으로 돌아가지 않음)
      // navigation.replace('AutoScan');
    }, 2500);

    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <View style={styles.container}>
      <Image
        source={require('../assets/icons/splash_icon.png')}
        style={styles.logo}
      />
      <Text style={[TYPOGRAPHY.body2, styles.sloganText]}>
        여기저기 흩어진 기프티콘을,
      </Text>
      <Text style={[TYPOGRAPHY.customTitle1, styles.appNameText]}>
        모아
      </Text>
    </View>
  );
};

// styles 객체는 이전 답변과 동일
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.white,
  },
  logo: {
    width: 100,
    height: 100,
    resizeMode: 'contain',
    marginBottom: 10,
  },
  sloganText: {
    color: COLORS.gray7,
    textAlign: 'center',
    marginBottom: 4,
  },
  appNameText: {
    color: COLORS.main,
    textAlign: 'center',
  },
});

export default SplashScreen;