/**
 * hooks/useRequireAuth.ts
 * Guard hook: chặn Guest user tại component level.
 * Hiển thị LoginPromptModal thay vì gọi API khi chưa đăng nhập.
 */
import { useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';

/**
 * Wrap bất kỳ action nào cần auth.
 * Guest bấm → hiện modal đăng nhập với reason cụ thể.
 */
export function useRequireAuth() {
  const { user } = useAuth();
  const navigation = useNavigation<any>();

  const guard = useCallback(
    (action: () => void, reason?: string) => {
      if (!user) {
        navigation.navigate('LoginPromptModal', {
          reason: reason || 'Tính năng này cần tài khoản',
        });
        return;
      }
      action();
    },
    [user, navigation],
  );

  return { guard, isAuthenticated: !!user };
}
