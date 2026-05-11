import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import * as Localization from "expo-localization";

const resources = {
  en: {
    translation: {
      welcome: "Welcome back",
      dashboard: "Dashboard",
      jobs: "My Jobs",
      scan: "Scan QR",
      reports: "Reports",
      profile: "Profile",
      machine_profile: "Machine Profile",
      check_completed: "Check Completed",
      not_checked: "Not Checked Yet",
      logout: "Sign Out",
      language: "Language",
      select_language: "Select Language"
    }
  },
  si: {
    translation: {
      welcome: "නැවතත් සාදරයෙන් පිළිගනිමු",
      dashboard: "පාලක පුවරුව",
      jobs: "මගේ වැඩ",
      scan: "QR ස්කෑන්",
      reports: "වාර්තා",
      profile: "ගිණුම",
      machine_profile: "යන්ත්‍ර විස්තර",
      check_completed: "පරීක්ෂාව අවසන්",
      not_checked: "තවමත් පරීක්ෂා කර නැත",
      logout: "නික්ම යන්න",
      language: "භාෂාව",
      select_language: "භාෂාව තෝරන්න"
    }
  },
  ta: {
    translation: {
      welcome: "மீண்டும் வருக",
      dashboard: "டாஷ்போர்டு",
      jobs: "எனது வேலைகள்",
      scan: "QR ஸ்கேன்",
      reports: "அறிக்கைகள்",
      profile: "சுயவிவரம்",
      machine_profile: "இயந்திர விவரம்",
      check_completed: "சரிபார்ப்பு முடிந்தது",
      not_checked: "இன்னும் சரிபார்க்கப்படவில்லை",
      logout: "வெளியேறு",
      language: "மொழி",
      select_language: "மொழியைத் தேர்ந்தெடுக்கவும்"
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: Localization.getLocales()[0].languageCode ?? "en",
    fallbackLng: "en",
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
