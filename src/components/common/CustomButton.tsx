import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  TouchableOpacityProps,
  TextStyle,
  ViewStyle,
  ActivityIndicator,
  StyleProp,
} from 'react-native';
// --- ⬇️ 1. 방금 설치한 라이브러리를 가져옵니다. ⬇️ ---
import LinearGradient from 'react-native-linear-gradient';
import { COLORS } from '../../constants/colors';
import { TYPOGRAPHY } from '../../constants/typography';

interface CustomButtonProps extends TouchableOpacityProps {
  title: string;
  onPress: () => void;
  // [수정] buttonStyle -> containerStyle로 이름 변경 (더 명확)
  containerStyle?: StyleProp<ViewStyle>; 
  textStyle?: StyleProp<TextStyle>;
  disabled?: boolean;
  loading?: boolean;
}

const CustomButton: React.FC<CustomButtonProps> = ({
  title,
  onPress,
  containerStyle,
  textStyle,
  disabled,
  loading,
  ...props
}) => {
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      style={containerStyle} // 이제 TouchableOpacity는 위치/크기만 담당
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
      {...props}
    >
      {/* --- ⬇️ 2. 배경을 담당할 LinearGradient 컴포넌트를 추가합니다. ⬇️ --- */}
      <LinearGradient
        // 피그마에서 알려주신 그라데이션 색상
        colors={['#C62B00', '#F46127']}
        // 95도는 거의 수평에 가까운 그라데이션입니다.
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={[
          styles.buttonBody,
          isDisabled ? styles.buttonDisabled : {},
        ]}
      >
        {loading ? (
          <ActivityIndicator size="small" color={COLORS.white0} />
        ) : (
          <Text style={[styles.buttonText, textStyle]}>
            {title}
          </Text>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
};

// --- ⬇️ 3. 스타일을 피그마 명세에 맞게 수정합니다. ⬇️ ---
const styles = StyleSheet.create({
  buttonBody: { // 기존 buttonContainer -> buttonBody로 이름 변경
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 36, // 요청하신 36px 적용
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%', // 부모(TouchableOpacity)의 크기를 꽉 채움
    minHeight: 52, // 피그마 폰트 크기 등을 고려하여 조정
  },
  buttonDisabled: {
    opacity: 0.5, // 비활성화 시 반투명 처리
  },
  buttonText: {
    // 요청하신 'Head/Head4b' 스타일과 가장 유사한 TYPOGRAPHY.h4b 적용
    ...TYPOGRAPHY.h4b, // Pretendard-Bold, 20px
    color: COLORS.white0, // 흰색 글씨
  },
});

export default CustomButton;
