import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import ar from './ar.json';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      ar: { translation: ar }
    },
    lng: 'ar',
    fallbackLng: 'ar',
    interpolation: {
      escapeValue: false
    }
  });

document.documentElement.dir = 'rtl';
document.documentElement.lang = 'ar';

export default i18n;
