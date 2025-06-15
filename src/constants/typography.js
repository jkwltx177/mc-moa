// src/constants/typography.js

const FONT_FAMILY_REGULAR = 'Pretendard-Regular'; // 실제 폰트 파일 이름에 맞게
const FONT_FAMILY_MEDIUM = 'Pretendard-Medium';
const FONT_FAMILY_SEMIBOLD = 'Pretendard-SemiBold';
const FONT_FAMILY_BOLD = 'Pretendard-Bold';

export const TYPOGRAPHY = {
  // Custom Title
  customTitle1: { fontFamily: FONT_FAMILY_SEMIBOLD, fontSize: 40, lineHeight: 40 }, // Title_40_SB
  customTitle2: { fontFamily: FONT_FAMILY_BOLD, fontSize: 32, lineHeight: 32 },    // Title_32_B
  // Headings
  h1: { fontFamily: FONT_FAMILY_MEDIUM, fontSize: 32, lineHeight: 32 },   // Head_32_M
  h2: { fontFamily: FONT_FAMILY_MEDIUM, fontSize: 24, lineHeight: 24 },   // Head_24_M
  h3: { fontFamily: FONT_FAMILY_MEDIUM, fontSize: 22, lineHeight: 22 },   // Head_22_M
  h4: { fontFamily: FONT_FAMILY_MEDIUM, fontSize: 20, lineHeight: 20 },   // Head_20_M
  h4b: { fontFamily: FONT_FAMILY_BOLD, fontSize: 20, lineHeight: 20 },    // Head_20_B
  h5: { fontFamily: FONT_FAMILY_SEMIBOLD, fontSize: 18, lineHeight: 18 }, // Head_18_SB
  // Body
  body1: { fontFamily: FONT_FAMILY_BOLD, fontSize: 16, lineHeight: 16 },    // Body_16_B
  body2: { fontFamily: FONT_FAMILY_MEDIUM, fontSize: 16, lineHeight: 16 },  // Body_16_M
  body3: { fontFamily: FONT_FAMILY_REGULAR, fontSize: 16, lineHeight: 16 }, // Body_16_R
  body4: { fontFamily: FONT_FAMILY_SEMIBOLD, fontSize: 14, lineHeight: 14 },// Body_14_SB
  body5: { fontFamily: FONT_FAMILY_REGULAR, fontSize: 14, lineHeight: 14 }, // Body_14_R
  // Caption
  caption1: { fontFamily: FONT_FAMILY_BOLD, fontSize: 12, lineHeight: 12 },    // Caption_12_B
  caption2: { fontFamily: FONT_FAMILY_MEDIUM, fontSize: 10, lineHeight: 10 },  // Caption_10_M
  caption3: { fontFamily: FONT_FAMILY_MEDIUM, fontSize: 8, lineHeight: 8 },    // Caption_8_M
  caption4: { fontFamily: FONT_FAMILY_BOLD, fontSize: 8, lineHeight: 8 },  // Caption_8_B
};