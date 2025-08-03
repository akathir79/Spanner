import { createContext, useContext } from "react";

type LanguageContextType = {
  t: (key: string, fallback?: string) => string;
};

// English-only translations for India-wide coverage
const translations = {
  "nav.services": "Services",
  "nav.findWorkers": "Find Workers",
  "nav.districts": "Districts",
  "nav.about": "About",
  "nav.login": "Login",
  "nav.joinNow": "Join Now",
  "hero.title": "India's Most Trusted Blue-Collar Service Platform",
  "hero.subtitle": "Connect with verified skilled workers across all states and districts. From plumbing to electrical work, find the right professional for your needs with transparent pricing and secure booking.",
  "hero.searchTitle": "Find Services Near You",
  "services.title": "Popular Services",
  "workers.title": "Top Rated Workers",
  "districts.title": "Service Coverage Across India",
  "features.title": "Why Choose SPANNER?",
  "testimonials.title": "What Our Users Say",
  "cta.title": "Ready to Get Started?",
  "footer.description": "India's most trusted platform for connecting skilled blue-collar workers with customers across all states and districts.",
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const t = (key: string, fallback?: string) => {
    return translations[key as keyof typeof translations] || fallback || key;
  };

  const value = {
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
