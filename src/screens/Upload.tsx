import React, { useState, useEffect, useCallback, useLayoutEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Image,
  TextInput,
  TouchableOpacity,
  Switch,
  Modal,
  FlatList,
  Pressable,
  Alert,
} from 'react-native';
import { useNavigation, useRoute, CommonActions } from '@react-navigation/native';
import DatePicker from 'react-native-date-picker';
import { format } from 'date-fns';

import { COLORS } from '../constants/colors';
import { TYPOGRAPHY } from '../constants/typography';
import CustomButton from '../components/common/CustomButton';
import { 
    saveGifticon, 
    updateGifticon, 
    saveCategory, 
    getAllCategories, 
    deleteCategory, 
    getCategory, 
    Category, 
    GifticonData 
} from '../services/gifticonService';


// --- 상수 정의 ---
const AVAILABLE_ICONS = ['☕️', '🏪', '🎬', '🎁', '🍔', '🛒', '🎟️', '✈️'];
const AVAILABLE_COLORS = [ COLORS.error, '#FF69B4', '#FFD700', '#32CD32', '#4169E1', '#964B00', '#8A2BE2' ];


// --- 재사용 컴포넌트 ---
const InfoRow = ({ label, value, placeholder, isEditable = false, onChangeText, valueAlign, ...props }) => {
  const dynamicAlign = value ? 'right' : 'left';
  const textAlign = valueAlign || dynamicAlign;

  return (
    <View style={styles.rowWrapper}>
      <Text style={styles.infoLabel}>{label}</Text>
      {isEditable ? (
        <TextInput
          style={[styles.inputBox, { textAlign }]}
          placeholder={placeholder}
          placeholderTextColor={COLORS.gray4}
          value={value}
          onChangeText={onChangeText}
          {...props}
        />
      ) : (
        <View style={[styles.inputBox, styles.valueBox]}>
          <Text style={[styles.infoValue, { textAlign }]}>{value || placeholder}</Text>
        </View>
      )}
    </View>
  );
};


// --- 메인 컴포넌트 ---
const UploadScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();

  // --- State 정의 ---
  const [gifticonToEdit, setGifticonToEdit] = useState<GifticonData | null>(null);
  const [imageUri, setImageUri] = useState('https://via.placeholder.com/200x307');
  const [barcode, setBarcode] = useState('');
  const [productName, setProductName] = useState('');
  const [storeName, setStoreName] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [memo, setMemo] = useState('');
  const [isVoucher, setIsVoucher] = useState(false);
  const [isCategoryModalVisible, setCategoryModalVisible] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [selectedIcon, setSelectedIcon] = useState(AVAILABLE_ICONS[0]);
  const [selectedColor, setSelectedColor] = useState(AVAILABLE_COLORS[0]);
  const [openDatePicker, setOpenDatePicker] = useState(false);
  const [date, setDate] = useState(new Date());

  // --- 헤더 제목 설정 ---
  useLayoutEffect(() => {
    const { gifticonToEdit, currentGifticonIndex, totalGifticonCount } = route.params || {};
    
    let title = '쿠폰 등록';
    if (gifticonToEdit) {
      title = '쿠폰 수정';
    } else if (currentGifticonIndex && totalGifticonCount) {
      title = `쿠폰 등록 (${currentGifticonIndex}/${totalGifticonCount})`;
    }

    navigation.setOptions({ title: title });
  }, [navigation, route.params]);

  // --- 데이터 로딩 및 파라미터 처리 ---
  useEffect(() => {
    const fetchAndSetData = async () => {
      setAllCategories(await getAllCategories());

      if (route.params) {
        const { imageUri, gifticonToEdit } = route.params as any;
        if (gifticonToEdit) {
          setGifticonToEdit(gifticonToEdit);
          setImageUri(`file://${gifticonToEdit.imagePath}`);
          setBarcode(gifticonToEdit.barcode);
          setProductName(gifticonToEdit.productName);
          setStoreName(gifticonToEdit.brandName);
          setExpiryDate(gifticonToEdit.expiryDate);
          setMemo(gifticonToEdit.memo);
          setIsVoucher(gifticonToEdit.isVoucher);
          if (gifticonToEdit.categoryId) {
            const cat = await getCategory(gifticonToEdit.categoryId);
            if (cat) setSelectedCategories([cat]);
          }
        } else if (imageUri) {
          setImageUri(imageUri);
        }
      }
    };
    fetchAndSetData();
  }, [route.params]);

  // --- 핸들러 함수들 ---
  const handleDateConfirm = (selectedDate) => {
    setOpenDatePicker(false);
    if (selectedDate) {
      setDate(selectedDate);
      setExpiryDate(format(selectedDate, 'yyyy-MM-dd'));
    }
  };

  const handleSelectCategory = (category: Category) => {
    setSelectedCategories([category]);
    setCategoryModalVisible(false);
  };
  
  const handleDeleteCategory = (categoryToDelete: Category) => {
    Alert.alert('카테고리 삭제', `'${categoryToDelete.name}' 카테고리를 정말 삭제하시겠습니까?`, [
      { text: '취소', style: 'cancel' },
      { text: '삭제', style: 'destructive',
        onPress: async () => {
          try {
            await deleteCategory(categoryToDelete.id);
            setAllCategories(prev => prev.filter(cat => cat.id !== categoryToDelete.id));
            setSelectedCategories(prev => prev.filter(cat => cat.id !== categoryToDelete.id));
          } catch (error) { Alert.alert('오류', '삭제 중 문제가 발생했습니다.'); }
        },
      },
    ]);
  };
  
  const handleAddNewCategory = async () => {
    if (!searchQuery) return;
    try {
      const savedCategory = await saveCategory({ name: searchQuery, icon: selectedIcon, color: selectedColor });
      setAllCategories(prev => [...prev, savedCategory]);
      setSelectedCategories([savedCategory]);
      setCategoryModalVisible(false);
      setSearchQuery('');
    } catch (error) { Alert.alert('오류', '카테고리 저장에 실패했습니다.'); }
  };

  const handleRegister = async () => {
    if (!productName || !expiryDate) {
      Alert.alert('입력 오류', '상품명과 유효기간은 필수 항목입니다.');
      return;
    }
    if (!gifticonToEdit && !imageUri.startsWith('file://')) {
      Alert.alert('입력 오류', '이미지는 필수 항목입니다.');
      return;
    }

    const categoryId = selectedCategories.length > 0 ? selectedCategories[0].id : null;
    const dataPayload = { productName, brandName: storeName, expiryDate, barcode, memo, isVoucher, categoryId };

    try {
      if (gifticonToEdit) {
        await updateGifticon(gifticonToEdit.id, dataPayload);
        Alert.alert('수정 완료', '기프티콘이 성공적으로 수정되었습니다!');
      } else {
        await saveGifticon(dataPayload, imageUri);
        Alert.alert('성공', '기프티콘이 성공적으로 저장되었습니다!');
      }
      navigation.goBack();
    } catch (error) { Alert.alert('오류', '저장/수정 중 문제가 발생했습니다.'); }
  };
  
  const renderCategoryItem = ({ item }: { item: Category }) => (
    <View style={styles.categoryItemContainer}>
      <TouchableOpacity onPress={() => handleSelectCategory(item)} style={styles.categorySelectItem}>
        <View style={[styles.categoryIconContainer, { backgroundColor: item.color }]}><Text style={styles.categoryIconText}>{item.icon}</Text></View>
        <Text style={styles.categorySelectText}>{item.name}</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => handleDeleteCategory(item)} style={styles.deleteCategoryButton}>
        <Text style={styles.deleteCategoryText}>×</Text>
      </TouchableOpacity>
    </View>
  );
  const handleSave = async () => {
    try {
      // 기프티콘 저장 로직
      await saveGifticon(gifticonData);

      // 메인 화면으로 이동 (스택 초기화)
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'MainTabs' }],
        })
      );
    } catch (error) {
      console.error('저장 실패:', error);
    }
  };

  // --- UI 렌더링 ---
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.imageContainer}>
          <Image source={{ uri: imageUri }} style={styles.barcodeImage} resizeMode="contain"/>
        </View>

        <View style={styles.infoSection}>
          <InfoRow label="바코드" placeholder="바코드" value={barcode} onChangeText={setBarcode} isEditable={true} />
          <InfoRow label="상품명" placeholder="상품명" value={productName} onChangeText={setProductName} isEditable={true} />
          <InfoRow label="사용처" placeholder="사용처" value={storeName} onChangeText={setStoreName} isEditable={true} />
          <TouchableOpacity onPress={() => setOpenDatePicker(true)}>
            <InfoRow label="유효기간" value={expiryDate} placeholder="YYYY-MM-DD" isEditable={false} pointerEvents="none" valueAlign="left" />
          </TouchableOpacity>
        </View>

        <View style={styles.memoSection}>
          <Text style={styles.memoLabel}>메모</Text>
          <TextInput style={styles.memoInput} placeholder="내용을 입력해주세요" placeholderTextColor={COLORS.gray3} multiline={true} textAlignVertical="top" value={memo} onChangeText={setMemo}/>
        </View>

        <View style={styles.optionSection}>
          <View style={styles.categorySection}>
            <Text style={styles.sectionLabel}>카테고리</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryList}>
              <TouchableOpacity style={styles.plusButton} onPress={() => setCategoryModalVisible(true)}><Text style={styles.plusButtonText}>+</Text></TouchableOpacity>
              {selectedCategories.map(category => (
                <TouchableOpacity key={category.id} style={[styles.categoryChip, { borderColor: category.color }]}>
                  <Text style={styles.categoryChipText}>{category.icon} {category.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
          <View style={styles.optionRow}>
            <Text style={styles.infoLabel}>금액권</Text>
            <Switch trackColor={{ false: COLORS.gray3, true: COLORS.main }} thumbColor={COLORS.white0} onValueChange={setIsVoucher} value={isVoucher}/>
          </View>
        </View>
      </ScrollView>

      <Modal animationType="slide" transparent={true} visible={isCategoryModalVisible} onRequestClose={() => setCategoryModalVisible(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setCategoryModalVisible(false)}>
          <Pressable style={styles.modalContent} onPress={() => {}}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>카테고리 추가</Text>
            <View style={styles.searchBarContainer}>
              <Text style={styles.searchIcon}>🔍</Text>
              <TextInput style={styles.searchInput} placeholder="카페, 편의점 등의 카테고리 검색" placeholderTextColor={COLORS.gray4} value={searchQuery} onChangeText={setSearchQuery}/>
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}><Text style={styles.cancelButtonText}>취소</Text></TouchableOpacity>
              )}
            </View>
            {searchQuery.length > 0 ? (
              <View style={styles.creationContainer}>
                <Text style={styles.sectionLabel}>아이콘</Text>
                <View style={styles.gridContainer}>
                  {AVAILABLE_ICONS.map(icon => (<TouchableOpacity key={icon} style={[styles.gridItem, selectedIcon === icon && styles.gridItemSelected]} onPress={() => setSelectedIcon(icon)}><Text style={styles.iconText}>{icon}</Text></TouchableOpacity>))}
                </View>
                <Text style={styles.sectionLabel}>색상</Text>
                <View style={styles.gridContainer}>
                  {AVAILABLE_COLORS.map(color => (<TouchableOpacity key={color} style={[styles.colorGridItem, { backgroundColor: color }, selectedColor === color && styles.gridItemSelected]} onPress={() => setSelectedColor(color)}/>))}
                </View>
                <View style={{ flex: 1 }} />
                <CustomButton title={`'${searchQuery}' 카테고리 추가`} onPress={handleAddNewCategory} />
              </View>
            ) : (
              <FlatList data={allCategories} renderItem={renderCategoryItem} keyExtractor={item => item.id} style={styles.categorySelectList} />
            )}
          </Pressable>
        </Pressable>
      </Modal>

      <DatePicker modal open={openDatePicker} date={date} mode="date" locale="ko-KR" onConfirm={handleDateConfirm} onCancel={() => setOpenDatePicker(false)}/>

      <View style={styles.buttonWrapper}>
        <CustomButton title={gifticonToEdit ? '수정 완료' : '등록하기'} onPress={handleRegister} />
      </View>
    </SafeAreaView>
  );
};


// --- 전체 스타일 ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white0 },
  scrollContainer: { paddingHorizontal: 20, paddingVertical: 24, paddingBottom: 50 },
  imageContainer: { width: 200, height: 307, alignSelf: 'center', backgroundColor: COLORS.gray2, borderRadius: 12, justifyContent: 'center', alignItems: 'center', overflow: 'hidden', marginBottom: 32 },
  barcodeImage: { width: '100%', height: '100%' },
  rowWrapper: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  infoSection: {},
  infoLabel: { ...TYPOGRAPHY.body1, color: COLORS.black9, width: 80 },
  inputBox: { flex: 1, borderWidth: 1, borderColor: COLORS.gray4, borderRadius: 36, paddingVertical: 14, paddingHorizontal: 16, minHeight: 50, ...TYPOGRAPHY.body3, color: COLORS.gray6 },
  valueBox: { justifyContent: 'center' },
  infoValue: { ...TYPOGRAPHY.body3, color: COLORS.gray6 },
  memoSection: { marginTop: 12 },
  memoLabel: { ...TYPOGRAPHY.body1, color: COLORS.black9, marginBottom: 8 },
  memoInput: { height: 96, borderWidth: 1, borderColor: COLORS.gray4, borderRadius: 12, padding: 12, backgroundColor: COLORS.white0, ...TYPOGRAPHY.body5, color: COLORS.gray8, textAlignVertical: 'top' },
  optionSection: { marginTop: 24 },
  optionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 50 },
  buttonWrapper: { paddingHorizontal: 20, paddingVertical: 16, borderTopWidth: 1, borderTopColor: COLORS.gray3, backgroundColor: COLORS.white0 },
  categorySection: { marginBottom: 12 },
  categoryList: { alignItems: 'center', paddingVertical: 4 },
  sectionLabel: { ...TYPOGRAPHY.body1, color: COLORS.black9, marginBottom: 8 },
  plusButton: { width: 32, height: 32, borderRadius: 16, borderWidth: 1, borderColor: COLORS.gray4, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.gray2, marginRight: 8 },
  plusButtonText: { color: COLORS.gray5, fontSize: 18, lineHeight: 20 },
  categoryChip: { flexDirection: 'row', height: 32, borderWidth: 1, borderRadius: 16, paddingHorizontal: 12, justifyContent: 'center', alignItems: 'center', marginRight: 8 },
  categoryChipText: { ...TYPOGRAPHY.body5, color: COLORS.gray8 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: COLORS.white0, borderTopLeftRadius: 20, borderTopRightRadius: 20, height: '85%', paddingHorizontal: 20, paddingBottom: 40 },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: COLORS.gray3, alignSelf: 'center', marginTop: 12 },
  modalTitle: { ...TYPOGRAPHY.h4, textAlign: 'center', marginVertical: 20 },
  searchBarContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white0, borderRadius: 30, borderWidth: 1, borderColor: COLORS.error, paddingHorizontal: 15, marginBottom: 20 },
  searchIcon: { fontSize: 18, marginRight: 10 },
  searchInput: { ...TYPOGRAPHY.body3, flex: 1, height: 48 },
  cancelButtonText: { ...TYPOGRAPHY.body4, color: COLORS.info, marginLeft: 10 },
  categorySelectList: { flex: 1 },
  categoryItemContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: COLORS.gray2 },
  categorySelectItem: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  categoryIconContainer: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  categoryIconText: { fontSize: 18 },
  categorySelectText: { ...TYPOGRAPHY.body2 },
  deleteCategoryButton: { padding: 8 },
  deleteCategoryText: { color: COLORS.error, fontSize: 22, fontWeight: 'bold' },
  creationContainer: { flex: 1 },
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginBottom: 24, justifyContent: 'center' },
  gridItem: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.gray2 },
  colorGridItem: { width: 48, height: 48, borderRadius: 24 },
  gridItemSelected: { borderWidth: 3, borderColor: COLORS.main },
  iconText: { fontSize: 24 },
});

export default UploadScreen;