import { useEffect } from 'react';

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  canonical?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogType?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  schemaData?: object;
  noIndex?: boolean;
}

export function SEOHead({
  title = "SPANNER - India's #1 Blue Collar Service Marketplace | Find Skilled Workers Near You",
  description = "Find verified skilled workers across India on SPANNER. Connect with plumbers, electricians, painters, mechanics, carpenters, cleaning services, and more. Instant booking, secure payments, GPS tracking. Available in 1000+ cities nationwide.",
  keywords = "blue collar services India, skilled workers near me, plumber electrician carpenter, home services marketplace, worker booking app, service providers India, local handyman services, verified skilled workers, instant service booking, home maintenance India",
  canonical,
  ogTitle,
  ogDescription,
  ogImage = "https://spanner.replit.app/og-image.jpg",
  ogType = "website",
  twitterTitle,
  twitterDescription,
  twitterImage,
  schemaData,
  noIndex = false
}: SEOHeadProps) {
  
  useEffect(() => {
    // Update title
    document.title = title;
    
    // Update meta tags
    updateMetaTag('description', description);
    updateMetaTag('keywords', keywords);
    updateMetaTag('robots', noIndex ? 'noindex, nofollow' : 'index, follow');
    
    // Update canonical URL
    if (canonical) {
      updateLinkTag('canonical', canonical);
    }
    
    // Update Open Graph tags
    updateMetaProperty('og:title', ogTitle || title);
    updateMetaProperty('og:description', ogDescription || description);
    updateMetaProperty('og:image', ogImage);
    updateMetaProperty('og:type', ogType);
    updateMetaProperty('og:url', canonical || window.location.href);
    
    // Update Twitter tags
    updateMetaProperty('twitter:title', twitterTitle || ogTitle || title);
    updateMetaProperty('twitter:description', twitterDescription || ogDescription || description);
    updateMetaProperty('twitter:image', twitterImage || ogImage);
    
    // Update structured data
    if (schemaData) {
      updateStructuredData(schemaData);
    }
    
  }, [title, description, keywords, canonical, ogTitle, ogDescription, ogImage, ogType, twitterTitle, twitterDescription, twitterImage, schemaData, noIndex]);

  return null;
}

function updateMetaTag(name: string, content: string) {
  let element = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement;
  if (!element) {
    element = document.createElement('meta');
    element.name = name;
    document.head.appendChild(element);
  }
  element.content = content;
}

function updateMetaProperty(property: string, content: string) {
  let element = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement;
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute('property', property);
    document.head.appendChild(element);
  }
  element.content = content;
}

function updateLinkTag(rel: string, href: string) {
  let element = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement;
  if (!element) {
    element = document.createElement('link');
    element.rel = rel;
    document.head.appendChild(element);
  }
  element.href = href;
}

function updateStructuredData(data: object) {
  // Remove existing structured data for this page
  const existingScript = document.querySelector('script[data-page-schema]');
  if (existingScript) {
    existingScript.remove();
  }
  
  // Add new structured data
  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.setAttribute('data-page-schema', 'true');
  script.textContent = JSON.stringify(data);
  document.head.appendChild(script);
}

// Service-specific SEO schemas
export const ServicePageSchema = (service: string, location?: string) => ({
  "@context": "https://schema.org",
  "@type": "Service",
  "name": `${service} Services${location ? ` in ${location}` : ' in India'}`,
  "description": `Professional ${service.toLowerCase()} services by verified skilled workers on SPANNER marketplace`,
  "provider": {
    "@type": "Organization",
    "name": "SPANNER"
  },
  "areaServed": location ? {
    "@type": "City",
    "name": location
  } : {
    "@type": "Country",
    "name": "India"
  },
  "serviceType": service,
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.5",
    "reviewCount": "1000",
    "bestRating": "5",
    "worstRating": "1"
  }
});

// Location-specific SEO schemas
export const LocationPageSchema = (location: string, services: string[]) => ({
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": `SPANNER Services in ${location}`,
  "description": `Find skilled blue collar workers in ${location}. Available services: ${services.join(', ')}`,
  "address": {
    "@type": "PostalAddress",
    "addressLocality": location,
    "addressCountry": "India"
  },
  "serviceArea": {
    "@type": "City",
    "name": location
  },
  "makesOffer": services.map(service => ({
    "@type": "Offer",
    "itemOffered": {
      "@type": "Service",
      "name": service
    }
  }))
});

// Worker profile SEO schema
export const WorkerProfileSchema = (worker: any) => ({
  "@context": "https://schema.org",
  "@type": "Person",
  "name": `${worker.firstName} ${worker.lastName}`,
  "jobTitle": worker.primaryService,
  "worksFor": {
    "@type": "Organization",
    "name": "SPANNER"
  },
  "address": {
    "@type": "PostalAddress",
    "addressLocality": worker.district,
    "addressRegion": worker.state,
    "addressCountry": "India"
  },
  "knowsAbout": worker.skills || [],
  "aggregateRating": worker.rating ? {
    "@type": "AggregateRating",
    "ratingValue": worker.rating.toString(),
    "reviewCount": worker.totalRatings?.toString() || "0",
    "bestRating": "5",
    "worstRating": "1"
  } : undefined
});

export default SEOHead;