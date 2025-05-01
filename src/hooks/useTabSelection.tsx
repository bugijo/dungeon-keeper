
import { useRef, useCallback } from 'react';

/**
 * Hook para gerenciar seleção de abas sem manipulação direta do DOM
 */
export const useTabSelection = () => {
  const selectedTabRef = useRef<string | null>(null);

  const setSelectedTab = useCallback((tabValue: string) => {
    selectedTabRef.current = tabValue;
  }, []);

  const getSelectedTab = useCallback(() => {
    return selectedTabRef.current;
  }, []);

  return {
    setSelectedTab,
    getSelectedTab
  };
};
