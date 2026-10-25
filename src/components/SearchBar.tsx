import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  onSubmitEditing?: () => void;
  onClear?: () => void;
  placeholder?: string;
}

export function SearchBar({
  value,
  onChangeText,
  onSubmitEditing,
  onClear,
  placeholder,
}: SearchBarProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.searchIcon}>🔍</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        onSubmitEditing={onSubmitEditing}
        placeholder={placeholder || 'Search products...'}
        placeholderTextColor="#888888"
        returnKeyType="search"
      />
      {value.length > 0 && (
        <Pressable
          style={styles.clearBtn}
          onPress={() => {
            onChangeText('');
            if (onClear) onClear();
          }}
        >
          <Text style={styles.clearText}>✕</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    height: 46,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 4,
    elevation: 1,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: '#1a1a1a',
    paddingVertical: 8,
  },
  clearBtn: {
    padding: 6,
  },
  clearText: {
    fontSize: 14,
    color: '#888',
    fontWeight: '700',
  },
});
