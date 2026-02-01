import { useEffect, useState } from 'react';
import { getTranslation } from './translations';

export function useTranslations() {
  const [language, setLanguage] = useState('vi');

  useEffect(() => {
    const savedLanguage = localStorage.getItem('language');
    if (savedLanguage) {
      setLanguage(savedLanguage);
    }
  }, []);

  const t = (key: string): string => {
    return getTranslation(key, language);
  };

  return { t, language };
}
