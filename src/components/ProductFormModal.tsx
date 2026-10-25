import React, { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Product } from '../api/products.api';
import { CATEGORIES, CategoryType } from '../store/productStore';

interface ProductFormModalProps {
  visible: boolean;
  product: Product | null;
  onClose: () => void;
  onSave: (payload: {
    name: string;
    description: string;
    price: number;
    image_url: string | null;
    category: string;
    stock: number;
  }) => Promise<void>;
}

// Authentic sample presets for Rwamagana categories
const PRESET_IMAGES: { label: string; url: string; category: CategoryType }[] = [
  {
    label: 'Kitenge Dress',
    url: 'https://images.unsplash.com/photo-1590736704728-f4730bb30770?w=600&auto=format&fit=crop&q=80',
    category: 'Clothes',
  },
  {
    label: 'Leather Loafers',
    url: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=600&auto=format&fit=crop&q=80',
    category: 'Shoes',
  },
  {
    label: 'Handmade Bag',
    url: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=600&auto=format&fit=crop&q=80',
    category: 'Bags',
  },
  {
    label: 'Electric Kettle',
    url: 'https://images.unsplash.com/photo-1570222094114-d054a817e56b?w=600&auto=format&fit=crop&q=80',
    category: 'Household Equipment',
  },
  {
    label: 'Beaded Necklace',
    url: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600&auto=format&fit=crop&q=80',
    category: 'Jewellery',
  },
  {
    label: 'Shea Glow Cream',
    url: 'https://images.unsplash.com/photo-1608248597359-07409f98450f?w=600&auto=format&fit=crop&q=80',
    category: 'Cosmetics',
  },
];

interface FormContentProps {
  product: Product | null;
  onClose: () => void;
  onSave: (payload: {
    name: string;
    description: string;
    price: number;
    image_url: string | null;
    category: string;
    stock: number;
  }) => Promise<void>;
}

const ProductFormContent: React.FC<FormContentProps> = ({
  product,
  onClose,
  onSave,
}) => {
  const { t } = useTranslation();
  const [name, setName] = useState(product?.name ?? '');
  const [description, setDescription] = useState(product?.description ?? '');
  const [price, setPrice] = useState(product ? String(product.price) : '');
  const [stock, setStock] = useState(product ? String(product.stock) : '10');
  const [category, setCategory] = useState<CategoryType>(
    (product?.category as CategoryType) || 'Clothes'
  );
  const [imageUrl, setImageUrl] = useState(product?.image_url ?? '');
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async () => {
    if (!name.trim()) {
      setErrorMsg('Product name is required.');
      return;
    }
    const numPrice = Number(price);
    if (isNaN(numPrice) || numPrice <= 0) {
      setErrorMsg('Please enter a valid price in RWF.');
      return;
    }
    const numStock = Number(stock);
    if (isNaN(numStock) || numStock < 0) {
      setErrorMsg('Please enter a valid stock quantity.');
      return;
    }

    setErrorMsg('');
    setSaving(true);
    try {
      await onSave({
        name: name.trim(),
        description: description.trim(),
        price: numPrice,
        image_url: imageUrl.trim() || null,
        category: category === 'All' ? 'Clothes' : category,
        stock: Math.floor(numStock),
      });
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save product';
      setErrorMsg(msg);
    } finally {
      setSaving(false);
    }
  };

  const selectableCategories = CATEGORIES.filter((c) => c !== 'All');

  return (
    <>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {product
            ? t('seller.productForm.editTitle')
            : t('seller.productForm.addTitle')}
        </Text>
        <TouchableOpacity
          onPress={onClose}
          style={styles.closeBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.closeBtnText}>✕</Text>
        </TouchableOpacity>
      </View>

      {!!errorMsg && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{errorMsg}</Text>
        </View>
      )}

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scrollContent}
      >
        {/* Product Name */}
        <Text style={styles.label}>{t('seller.productForm.name')} *</Text>
        <TextInput
          style={styles.input}
          placeholder={t('seller.productForm.namePlaceholder')}
          placeholderTextColor="#9ca3af"
          value={name}
          onChangeText={setName}
        />

        {/* Category Selector */}
        <Text style={styles.label}>{t('seller.productForm.category')} *</Text>
        <View style={styles.categoryGrid}>
          {selectableCategories.map((cat) => {
            const isSelected = category === cat;
            return (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.categoryChip,
                  isSelected && styles.categoryChipSelected,
                ]}
                onPress={() => setCategory(cat)}
              >
                <Text
                  style={[
                    styles.categoryChipText,
                    isSelected && styles.categoryChipTextSelected,
                  ]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Price and Stock row */}
        <View style={styles.row}>
          <View style={styles.halfCol}>
            <Text style={styles.label}>{t('seller.productForm.price')} *</Text>
            <TextInput
              style={styles.input}
              placeholder={t('seller.productForm.pricePlaceholder')}
              placeholderTextColor="#9ca3af"
              keyboardType="numeric"
              value={price}
              onChangeText={setPrice}
            />
          </View>

          <View style={styles.halfCol}>
            <Text style={styles.label}>{t('seller.productForm.stock')} *</Text>
            <TextInput
              style={styles.input}
              placeholder={t('seller.productForm.stockPlaceholder')}
              placeholderTextColor="#9ca3af"
              keyboardType="numeric"
              value={stock}
              onChangeText={setStock}
            />
          </View>
        </View>

        {/* Image URL & Preview */}
        <Text style={styles.label}>{t('seller.productForm.imageUrl')}</Text>
        <TextInput
          style={styles.input}
          placeholder={t('seller.productForm.imageUrlPlaceholder')}
          placeholderTextColor="#9ca3af"
          autoCapitalize="none"
          value={imageUrl}
          onChangeText={setImageUrl}
        />

        {/* Presets */}
        <Text style={styles.sublabel}>
          {t('seller.productForm.presetImages')}
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.presetsRow}
        >
          {PRESET_IMAGES.map((preset) => (
            <TouchableOpacity
              key={preset.url}
              style={[
                styles.presetThumbWrapper,
                imageUrl === preset.url && styles.presetThumbSelected,
              ]}
              onPress={() => {
                setImageUrl(preset.url);
                setCategory(preset.category);
              }}
            >
              <Image source={{ uri: preset.url }} style={styles.presetThumb} />
              <Text style={styles.presetLabel} numberOfLines={1}>
                {preset.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Active Preview */}
        {imageUrl ? (
          <View style={styles.previewContainer}>
            <Image source={{ uri: imageUrl }} style={styles.previewImage} />
            <Text style={styles.previewText}>Image Preview</Text>
          </View>
        ) : null}

        {/* Description */}
        <Text style={styles.label}>{t('seller.productForm.description')}</Text>
        <TextInput
          style={[styles.input, styles.multilineInput]}
          placeholder={t('seller.productForm.descriptionPlaceholder')}
          placeholderTextColor="#9ca3af"
          multiline
          numberOfLines={3}
          value={description}
          onChangeText={setDescription}
        />

        {/* Action Buttons */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={onClose}
            disabled={saving}
          >
            <Text style={styles.cancelBtnText}>
              {t('seller.productForm.cancelBtn')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.saveBtn, saving && styles.btnDisabled]}
            onPress={handleSubmit}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text style={styles.saveBtnText}>
                {t('seller.productForm.saveBtn')}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </>
  );
};

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  visible,
  product,
  onClose,
  onSave,
}) => {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          <ProductFormContent
            key={visible ? (product ? `edit-${product.id}` : 'new') : 'hidden'}
            product={product}
            onClose={onClose}
            onSave={onSave}
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    padding: 20,
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  closeBtn: {
    padding: 4,
  },
  closeBtnText: {
    fontSize: 20,
    color: '#6b7280',
    fontWeight: '700',
  },
  scrollContent: {
    paddingBottom: 20,
  },
  errorBox: {
    backgroundColor: '#fee2e2',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  errorText: {
    color: '#dc2626',
    fontSize: 13,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
    marginTop: 10,
    marginBottom: 6,
  },
  sublabel: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 6,
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1f2937',
  },
  multilineInput: {
    height: 75,
    textAlignVertical: 'top',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 4,
  },
  categoryChip: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  categoryChipSelected: {
    backgroundColor: '#7c3aed',
    borderColor: '#7c3aed',
  },
  categoryChipText: {
    fontSize: 12,
    color: '#4b5563',
    fontWeight: '600',
  },
  categoryChipTextSelected: {
    color: '#ffffff',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfCol: {
    flex: 1,
  },
  presetsRow: {
    gap: 10,
    paddingVertical: 6,
  },
  presetThumbWrapper: {
    alignItems: 'center',
    width: 64,
  },
  presetThumbSelected: {
    transform: [{ scale: 1.05 }],
  },
  presetThumb: {
    width: 54,
    height: 54,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  presetLabel: {
    fontSize: 9,
    color: '#4b5563',
    marginTop: 4,
    textAlign: 'center',
  },
  previewContainer: {
    alignItems: 'center',
    marginVertical: 10,
    padding: 8,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
  },
  previewImage: {
    width: 90,
    height: 90,
    borderRadius: 8,
  },
  previewText: {
    fontSize: 10,
    color: '#6b7280',
    marginTop: 4,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 20,
  },
  cancelBtn: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  cancelBtnText: {
    color: '#4b5563',
    fontWeight: '600',
    fontSize: 14,
  },
  saveBtn: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: '#7c3aed',
    minWidth: 130,
    alignItems: 'center',
  },
  btnDisabled: {
    opacity: 0.6,
  },
  saveBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
});
