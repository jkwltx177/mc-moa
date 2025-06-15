// src/navigation/AppNavigator.tsx
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator, NativeStackNavigationOptions } from '@react-navigation/native-stack';
import { TouchableOpacity, View, Text } from 'react-native';

// 스크린 컴포넌트 import
import SplashScreen from '../screens/SplashScreen';
import AutoScannerScreen from '../screens/gifticon/AutoScannerScreen';
import UploadScreen from '../screens/Upload'; // 1. 새로 만든 UploadScreen을 가져옵니다.
import DetailScreen from '../screens/DetailScreen';
import TempScreen from '../screens/temp';
import SettingScreen from '../screens/SettingScreen';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MainScreen } from '../screens/MainScreen';
import { AlertScreen } from '../screens/AlertScreen';
import { MyPageScreen } from '../screens/MyPageScreen';
import Icon from 'react-native-vector-icons/Feather'; // 사용하는 아이콘 라이브러리에 맞게
import { COLORS } from '../constants/colors';

// 네비게이션 스택에 포함될 화면들의 파라미터 타입 정의
export type RootStackParamList = {
  Splash: undefined;
  MainTabs: undefined;
  Upload: { 
    // 기존에 사용하시던 파라미터들
    imageUri?: string;
    barcode?: string;
    productName?: string;
    brandName?: string;
    expiryDate?: string;
    gifticonToEdit?: any;
    // gifticonToEdit?: GifticonData; // 수정 모드를 위한 전체 데이터
    currentGifticonIndex?: number; // 일괄 등록 시 현재 순서
    totalGifticonCount?: number;  // 일괄 등록 시 전체 개수
  } | undefined;
  AutoScan: undefined;
  Detail: { gifticonId: string };
  Temp: undefined; // 2. Temp 스크린을 타입에 추가합니다.
  Setting: undefined;
  // ... 다른 화면들
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const defaultScreenOptions: NativeStackNavigationOptions = {
  headerShown: false,
};
const Tab = createBottomTabNavigator();

const AppNavigator = (): React.JSX.Element => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={defaultScreenOptions}
      >
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="MainTabs" component={MainTabs} />
        <Stack.Screen
          name="AutoScan"
          component={AutoScannerScreen}
          options={{ headerShown: true, title: '기프티콘 자동 스캔' }}
        />

        {/* 3. UploadScreen을 스택에 등록합니다. */}
        <Stack.Screen 
            name="Upload" 
            component={UploadScreen}
            options={{ 
              headerShown: true, 
              title: '쿠폰 등록 (1 / 1)',
              headerBackTitleVisible: false, // iOS에서 뒤로가기 버튼 옆의 텍스트를 숨깁니다.
            }}
        />
        <Stack.Screen
          name="Detail"
          component={DetailScreen}
          options={{
            title: '기프티콘 정보',
            headerShown: true,
            headerBackTitleVisible: false,
            // 헤더 오른쪽 버튼들은 다음 단계에서 추가할 수 있습니다.
            headerRight: () => (
              <View style={{ flexDirection: 'row' }}>
                <TouchableOpacity onPress={() => console.log('Edit Tapped!')} style={{ marginRight: 16 }}>
                  {/* 실제로는 아이콘 컴포넌트를 사용합니다. */}
                  <Text style={{ fontSize: 22 }}>✏️</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => console.log('Delete Tapped!')}>
                  <Text style={{ fontSize: 22 }}>🗑️</Text>
                </TouchableOpacity>
              </View>
            ),
          }}
        />
        <Stack.Screen
          name="Temp"
          component={TempScreen}
          options={{ title: '임시 테스트' }} // 헤더 제목 설정
        />

        <Stack.Screen
          name="Setting"
          component={SettingScreen}
          options={{ headerShown: false }} // 자체 헤더를 사용하므로 네비게이터 헤더는 숨깁니다.
        />
        {/* <Stack.Screen name="MainTab" component={MainTabNavigator} /> 
        */}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

// MainTab 컴포넌트 추가
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.gray500,
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="Home"
        component={MainScreen}
        options={{
          tabBarLabel: '홈',
          tabBarIcon: ({ color, size }) => (
            <Icon name="home" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Alert"
        component={AlertScreen} // 추후 구현
        options={{
          tabBarLabel: '알림',
          tabBarIcon: ({ color, size }) => (
            <Icon name="bell" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="MyPage"
        component={MyPageScreen} // 추후 구현
        options={{
          tabBarLabel: '마이페이지',
          tabBarIcon: ({ color, size }) => (
            <Icon name="user" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export default AppNavigator;