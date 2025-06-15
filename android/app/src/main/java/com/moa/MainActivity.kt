package com.moa

import android.os.Bundle
import com.facebook.react.ReactActivity
import org.devio.rn.splashscreen.SplashScreen
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate

class MainActivity : ReactActivity() {

  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  override fun getMainComponentName(): String = "moa"

  /**
   * Returns the instance of the [ReactActivityDelegate]. We use [DefaultReactActivityDelegate]
   * which allows you to enable New Architecture with a single boolean flags [fabricEnabled]
   */
  override fun createReactActivityDelegate(): ReactActivityDelegate =
      DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)
  
  override fun onCreate(savedInstanceState: Bundle?) {
      // GitHub 이슈에서 제안된 방식: super.onCreate(null) 호출 후 SplashScreen.show()
      // 이렇게 하면 React Native의 View가 그려지기 전에 스플래시가 화면을 덮고,
      // View가 준비되면 자연스럽게 전환될 수 있도록 도와줍니다.
      super.onCreate(null) 
      SplashScreen.show(this, R.style.SplashTheme, false) // ✨ 세 번째 인자로 fullScreen 여부를 전달합니다.
                                                  //    또는 테마 없이 SplashScreen.show(this)만 호출할 수도 있습니다.
                                                  //    R.style.SplashTheme 은 styles.xml에 정의된 스플래시 테마 이름입니다.
                                                  //    만약 테마를 사용하지 않고 launch_screen.xml만 사용한다면,
                                                  //    SplashScreen.show(this) 만으로도 충분할 수 있습니다.
                                                  //    라이브러리 문서를 꼭 확인하세요.
  }
}
