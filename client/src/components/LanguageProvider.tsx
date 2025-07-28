import { createContext, useContext, useState } from "react";

type Language = "en" | "ta";

type LanguageContextType = {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, fallback?: string) => string;
};

// Basic translations
const translations = {
  en: {
    "nav.services": "Services",
    "nav.findWorkers": "Find Workers",
    "nav.districts": "Districts",
    "nav.about": "About",
    "nav.login": "Login",
    "nav.joinNow": "Join Now",
    "hero.title": "Tamil Nadu's Most Trusted Blue-Collar Service Platform",
    "hero.subtitle": "Connect with verified skilled workers across all 38 districts. From plumbing to electrical work, find the right professional for your needs with transparent pricing and secure booking.",
    "hero.searchTitle": "Find Services Near You",
    "services.title": "Popular Services",
    "workers.title": "Top Rated Workers",
    "districts.title": "Service Coverage Across Tamil Nadu",
    "features.title": "Why Choose SPANNER?",
    "testimonials.title": "What Our Users Say",
    "cta.title": "Ready to Get Started?",
    "footer.description": "Tamil Nadu's most trusted platform for connecting skilled blue-collar workers with customers across all 38 districts.",
  },
  ta: {
    "nav.services": "சேவைகள்",
    "nav.findWorkers": "வேலையாளர்களைக் கண்டறியவும்",
    "nav.districts": "மாவட்டங்கள்",
    "nav.about": "பற்றி",
    "nav.login": "உள்நுழைய",
    "nav.joinNow": "இப்போது சேரவும்",
    "hero.title": "தமிழ்நாட்டின் மிகவும் நம்பகமான நீல காலர் சேவை தளம்",
    "hero.subtitle": "அனைத்து 38 மாவட்டங்களிலும் சரிபார்க்கப்பட்ட திறமையான தொழிலாளர்களுடன் இணைக்கவும். குழாய் வேலை முதல் மின்சார வேலை வரை, வெளிப்படையான விலை மற்றும் பாதுகாப்பான முன்பதிவுடன் உங்கள் தேவைகளுக்கு சரியான நிபுணரைக் கண்டறியவும்.",
    "hero.searchTitle": "உங்கள் அருகிலுள்ள சேவைகளைக் கண்டறியவும்",
    "services.title": "பிரபலமான சேவைகள்",
    "workers.title": "சிறந்த மதிப்பீடு பெற்ற தொழிலாளர்கள்",
    "districts.title": "தமிழ்நாடு முழுவதும் சேவை கவரேஜ்",
    "features.title": "ஏன் SPANNER ஐ தேர்வு செய்ய வேண்டும்?",
    "testimonials.title": "எங்கள் பயனர்கள் என்ன சொல்கிறார்கள்",
    "cta.title": "தொடங்க தயாரா?",
    "footer.description": "அனைத்து 38 மாவட்டங்களிலும் உள்ள வாடிக்கையாளர்களுடன் திறமையான நீல காலர் தொழிலாளர்களை இணைப்பதற்கான தமிழ்நாட்டின் மிகவும் நம்பகமான தளம்.",
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>("en");

  const t = (key: string, fallback?: string) => {
    return translations[language][key as keyof typeof translations.en] || fallback || key;
  };

  const value = {
    language,
    setLanguage,
    t,
  };

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
