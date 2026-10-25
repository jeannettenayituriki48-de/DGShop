import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { api } from '../../api/client';
import { useAuthStore } from '../../store/authStore';

interface UserAccount {
  id: number;
  name: string;
  email: string;
  role: 'customer' | 'seller';
  created_at: string;
  order_count: number;
}

const ROLE_COLORS: Record<string, { bg: string; text: string }> = {
  customer: { bg: '#e0f2fe', text: '#0369a1' },
  seller: { bg: '#f3e8ff', text: '#7c3aed' },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-RW', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function UserCard({
  item,
  currentUserId,
  onDelete,
}: {
  item: UserAccount;
  currentUserId: number | undefined;
  onDelete: (id: number) => void;
}) {
  const roleStyle = ROLE_COLORS[item.role] ?? ROLE_COLORS.customer;
  const initials = item.name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const avatarColor = item.role === 'seller' ? '#7c3aed' : '#0066cc';
  const isSelf = item.id === currentUserId;

  return (
    <View style={styles.card}>
      <View style={styles.cardLeft}>
        <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <View style={styles.cardInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.userName} numberOfLines={1}>
              {item.name}
            </Text>
            {isSelf && (
              <View style={styles.selfBadge}>
                <Text style={styles.selfBadgeText}>YOU</Text>
              </View>
            )}
          </View>
          <Text style={styles.userEmail} numberOfLines={1}>
            {item.email}
          </Text>
          <View style={styles.metaRow}>
            <View style={[styles.roleBadge, { backgroundColor: roleStyle.bg }]}>
              <Text style={[styles.roleText, { color: roleStyle.text }]}>
                {item.role.toUpperCase()}
              </Text>
            </View>
            <Text style={styles.metaText}>📦 {item.order_count} orders</Text>
            <Text style={styles.metaText}>🗓 {formatDate(item.created_at)}</Text>
          </View>
        </View>
      </View>

      {!isSelf && item.role === 'customer' && (
        <Pressable
          style={styles.deleteBtn}
          onPress={() => onDelete(item.id)}
        >
          <Text style={styles.deleteBtnText}>🗑</Text>
        </Pressable>
      )}
    </View>
  );
}

export default function SellerUsersScreen() {
  const { user: currentUser } = useAuthStore();
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'customer' | 'seller'>('all');

  const fetchUsers = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);
      const { data } = await api.get<UserAccount[]>('/users');
      setUsers(data);
    } catch {
      setError('Failed to load users.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDelete = (id: number) => {
    const target = users.find((u) => u.id === id);
    if (!target) return;

    Alert.alert(
      'Delete Account',
      `Are you sure you want to permanently delete ${target.name}'s account? This will also remove their orders and cart.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/users?id=${id}`);
              setUsers((prev) => prev.filter((u) => u.id !== id));
            } catch {
              Alert.alert('Error', 'Failed to delete user.');
            }
          },
        },
      ]
    );
  };

  const filtered = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const customerCount = users.filter((u) => u.role === 'customer').length;
  const sellerCount = users.filter((u) => u.role === 'seller').length;

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#7c3aed" />
        <Text style={styles.loadingText}>Loading users…</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorText}>{error}</Text>
        <Pressable style={styles.retryBtn} onPress={() => fetchUsers()}>
          <Text style={styles.retryBtnText}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Stats bar */}
      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{users.length}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: '#0369a1' }]}>{customerCount}</Text>
          <Text style={styles.statLabel}>Customers</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: '#7c3aed' }]}>{sellerCount}</Text>
          <Text style={styles.statLabel}>Sellers</Text>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchBar}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or email…"
          placeholderTextColor="#94a3b8"
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <Pressable onPress={() => setSearch('')} style={styles.clearBtn}>
            <Text style={styles.clearBtnText}>✕</Text>
          </Pressable>
        )}
      </View>

      {/* Role filter tabs */}
      <View style={styles.filterRow}>
        {(['all', 'customer', 'seller'] as const).map((f) => (
          <Pressable
            key={f}
            style={[styles.filterChip, roleFilter === f && styles.filterChipActive]}
            onPress={() => setRoleFilter(f)}
          >
            <Text style={[styles.filterChipText, roleFilter === f && styles.filterChipTextActive]}>
              {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1) + 's'}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* User list */}
      <FlatList
        data={filtered}
        keyExtractor={(u) => u.id.toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchUsers(true)}
            tintColor="#7c3aed"
          />
        }
        renderItem={({ item }) => (
          <UserCard
            item={item}
            currentUserId={currentUser?.id}
            onDelete={handleDelete}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>👥</Text>
            <Text style={styles.emptyText}>No users found</Text>
          </View>
        }
        ListHeaderComponent={
          filtered.length > 0 ? (
            <Text style={styles.resultCount}>{filtered.length} user{filtered.length !== 1 ? 's' : ''} found</Text>
          ) : undefined
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },

  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#f8fafc',
  },
  loadingText: { color: '#64748b', fontSize: 14 },
  errorIcon: { fontSize: 36 },
  errorText: { color: '#dc2626', fontSize: 14, textAlign: 'center', paddingHorizontal: 24 },
  retryBtn: {
    backgroundColor: '#7c3aed',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryBtnText: { color: '#fff', fontWeight: '700' },

  statsBar: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    justifyContent: 'center',
    gap: 0,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statNumber: { fontSize: 22, fontWeight: '800', color: '#1e293b' },
  statLabel: { fontSize: 11, color: '#64748b', fontWeight: '500', marginTop: 1 },
  statDivider: { width: 1, backgroundColor: '#e2e8f0', marginVertical: 4 },

  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    marginHorizontal: 12,
    marginTop: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 12,
  },
  searchInput: { flex: 1, paddingVertical: 10, fontSize: 14, color: '#1e293b' },
  clearBtn: { padding: 4 },
  clearBtnText: { color: '#94a3b8', fontSize: 14, fontWeight: '700' },

  filterRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  filterChipActive: { backgroundColor: '#7c3aed', borderColor: '#7c3aed' },
  filterChipText: { fontSize: 12, fontWeight: '600', color: '#64748b' },
  filterChipTextActive: { color: '#ffffff' },

  listContent: { paddingHorizontal: 12, paddingBottom: 24 },
  resultCount: { fontSize: 12, color: '#94a3b8', marginBottom: 8 },

  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 4,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  cardLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  cardInfo: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  userName: { fontSize: 14, fontWeight: '700', color: '#1e293b', flex: 1 },
  selfBadge: {
    backgroundColor: '#fef9c3',
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  selfBadgeText: { fontSize: 9, fontWeight: '800', color: '#ca8a04' },
  userEmail: { fontSize: 12, color: '#64748b', marginBottom: 6 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  roleBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  roleText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.3 },
  metaText: { fontSize: 11, color: '#94a3b8' },

  deleteBtn: {
    backgroundColor: '#fee2e2',
    borderRadius: 8,
    padding: 8,
    marginLeft: 8,
  },
  deleteBtnText: { fontSize: 16 },

  emptyContainer: { alignItems: 'center', paddingVertical: 48 },
  emptyIcon: { fontSize: 40, marginBottom: 10 },
  emptyText: { fontSize: 15, color: '#94a3b8' },
});
