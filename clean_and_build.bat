@echo off
echo ========================================
echo React Native 갤러리 권한 수정 후 빌드
echo ========================================

echo 1. Android Gradle 정리 중...
cd android
call gradlew clean
cd ..

echo 2. Metro 번들러 및 Node 캐시 정리 중...
npx react-native start --reset-cache --port 8081 &
timeout /t 3 > nul

echo 3. 안드로이드 빌드 및 설치 시작...
npm run android

echo.
echo 완료! 이제 앱에서 스캔 버튼을 누르면 권한 요청 팝업이 나타납니다.
echo 처음 실행 시 "허용" 버튼을 누르세요!
echo.
pause
