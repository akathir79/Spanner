import { useEffect } from 'react';

// Professional structured data for enterprise-level search appearance like ChatGPT
export function SitelinksData() {
  useEffect(() => {
    // Enhanced organization schema for professional search appearance
    const organizationScript = document.createElement('script');
    organizationScript.type = 'application/ld+json';
    organizationScript.innerHTML = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": "SPANNER",
      "alternateName": "SPANNER - India's Premier Blue Collar Marketplace",
      "url": "https://spanner.co.in",
      "logo": {
        "@type": "ImageObject",
        "url": "https://spanner.co.in/logo-512.png",
        "width": 512,
        "height": 512
      },
      "description": "SPANNER helps you find and hire skilled workers instantly. Connect with verified professionals across India for plumbing, electrical, painting, carpentry, cleaning, and more services.",
      "foundingDate": "2024",
      "address": {
        "@type": "PostalAddress",
        "addressCountry": "IN",
        "addressRegion": "Tamil Nadu",
        "addressLocality": "Chennai"
      },
      "contactPoint": {
        "@type": "ContactPoint",
        "telephone": "+91-9000000001",
        "contactType": "customer service",
        "availableLanguage": ["English", "Hindi", "Tamil", "Telugu", "Kannada", "Malayalam"]
      },
      "sameAs": [
        "https://www.facebook.com/SpannerIndia",
        "https://www.twitter.com/SpannerIndia",
        "https://www.linkedin.com/company/spanner-india"
      ],
      "potentialAction": [
        {
          "@type": "SearchAction",
          "target": "https://spanner.co.in/find-workers?q={search_term_string}",
          "query-input": "required name=search_term_string",
          "name": "Find Workers"
        },
        {
          "@type": "ViewAction",
          "target": "https://spanner.co.in/services",
          "name": "Browse Services"
        },
        {
          "@type": "CreateAction", 
          "target": "https://spanner.co.in/quick-post",
          "name": "Post a Job"
        },
        {
          "@type": "ReadAction",
          "target": "https://spanner.co.in/about",
          "name": "About SPANNER"
        },
        {
          "@type": "ViewAction",
          "target": "https://spanner.co.in/how-it-works",
          "name": "How It Works"
        },
        {
          "@type": "CommunicateAction",
          "target": "https://spanner.co.in/contact",
          "name": "Contact Us"
        }
      ],
      "mainEntity": [
        {
          "@type": "Question",
          "name": "What is SPANNER?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "SPANNER is India's leading blue collar service marketplace that helps you find and hire skilled workers instantly. Connect with verified professionals for all your home and business service needs."
          }
        },
        {
          "@type": "Question", 
          "name": "How to find skilled workers?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Use SPANNER to search for verified professionals by service type, location, and budget. Get instant quotes and hire workers with secure payments and GPS tracking."
          }
        },
        {
          "@type": "Question",
          "name": "What services are available?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "SPANNER offers plumbing, electrical work, painting, carpentry, cleaning services, AC repair, mechanics, and more across 1000+ Indian cities with 50,000+ verified professionals."
          }
        },
        {
          "@type": "Question",
          "name": "How does instant hiring work?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Post your job using Quick Post, receive quotes from nearby workers, compare profiles and ratings, then hire instantly with secure payments and real-time tracking."
          }
        },
        {
          "@type": "Question",
          "name": "Is SPANNER safe and reliable?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Yes, all SPANNER workers are verified with background checks, customer reviews, and secure payment protection. We provide GPS tracking and quality guarantees for peace of mind."
          }
        }
      ],
      "knowsAbout": [
        "Home services",
        "Blue collar workers",
        "Skilled professionals",
        "Plumbing services",
        "Electrical work", 
        "Painting services",
        "Carpentry work",
        "Cleaning services",
        "AC repair",
        "Mechanic services",
        "Indian workforce",
        "Local services",
        "Worker verification",
        "Secure payments"
      ]
    });

    document.head.appendChild(organizationScript);

    // Website schema for search box and sitelinks
    const websiteScript = document.createElement('script');
    websiteScript.type = 'application/ld+json';
    websiteScript.innerHTML = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": "SPANNER",
      "alternateName": "SPANNER - Find and Hire Skilled Workers",
      "url": "https://spanner.co.in",
      "description": "India's premier marketplace for finding and hiring skilled blue collar workers",
      "inLanguage": "en-IN",
      "isAccessibleForFree": true,
      "potentialAction": [
        {
          "@type": "SearchAction",
          "target": {
            "@type": "EntryPoint",
            "urlTemplate": "https://spanner.co.in/find-workers?q={search_term_string}",
            "actionPlatform": [
              "http://schema.org/DesktopWebPlatform",
              "http://schema.org/MobileWebPlatform"
            ]
          },
          "query-input": "required name=search_term_string"
        }
      ],
      "mainEntity": {
        "@type": "ItemList",
        "name": "SPANNER Services",
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "name": "Find Workers",
            "description": "Search and hire verified skilled workers near you",
            "url": "https://spanner.co.in/find-workers"
          },
          {
            "@type": "ListItem", 
            "position": 2,
            "name": "Browse Services",
            "description": "Explore all available professional services",
            "url": "https://spanner.co.in/services"
          },
          {
            "@type": "ListItem",
            "position": 3,
            "name": "Quick Post Job",
            "description": "Post your job requirements and get instant quotes",
            "url": "https://spanner.co.in/quick-post"
          },
          {
            "@type": "ListItem",
            "position": 4,
            "name": "How It Works",
            "description": "Learn how SPANNER connects you with professionals",
            "url": "https://spanner.co.in/how-it-works"
          },
          {
            "@type": "ListItem",
            "position": 5,
            "name": "About SPANNER",
            "description": "Discover our mission and values",
            "url": "https://spanner.co.in/about"
          },
          {
            "@type": "ListItem",
            "position": 6,
            "name": "Contact Support",
            "description": "Get help and support from our team",
            "url": "https://spanner.co.in/contact"
          }
        ]
      }
    });

    document.head.appendChild(websiteScript);

    // FAQ Schema for rich snippets
    const faqScript = document.createElement('script');
    faqScript.type = 'application/ld+json';
    faqScript.innerHTML = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "name": "SPANNER - Frequently Asked Questions",
      "description": "Common questions about finding and hiring skilled workers on SPANNER",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "What is SPANNER?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "SPANNER is India's leading platform for finding and hiring skilled blue collar workers. We connect clients with verified professionals for plumbing, electrical work, painting, carpentry, cleaning, and more services across 1000+ cities."
          }
        },
        {
          "@type": "Question",
          "name": "How quickly can I find workers?",
          "acceptedAnswer": {
            "@type": "Answer", 
            "text": "With SPANNER's Quick Post feature, you can post your job and start receiving quotes from nearby workers within minutes. Most jobs get multiple responses within the first hour."
          }
        },
        {
          "@type": "Question",
          "name": "Are workers verified and reliable?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Yes, all SPANNER workers undergo verification including background checks, skill assessments, and customer reviews. We maintain high quality standards with ratings and feedback systems."
          }
        },
        {
          "@type": "Question",
          "name": "What services are available?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "SPANNER offers comprehensive home and business services including plumbing, electrical work, painting, carpentry, cleaning, AC repair, mechanics, gardening, and many more professional services."
          }
        },
        {
          "@type": "Question", 
          "name": "How does payment work?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "SPANNER provides secure payment processing with multiple options including digital payments, escrow protection, and transparent pricing. Payment is processed after job completion and your satisfaction."
          }
        },
        {
          "@type": "Question",
          "name": "Is SPANNER available in my city?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "SPANNER operates across 1000+ Indian cities with over 50,000 verified professionals. Check our coverage in your area by searching for services in your location on our platform."
          }
        }
      ]
    });

    document.head.appendChild(faqScript);

    // Service catalog for enhanced visibility
    const serviceScript = document.createElement('script');
    serviceScript.type = 'application/ld+json';
    serviceScript.innerHTML = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Service",
      "name": "SPANNER - Professional Worker Marketplace",
      "description": "Connect with verified skilled workers for all your home and business service needs",
      "provider": {
        "@type": "Organization",
        "name": "SPANNER",
        "url": "https://spanner.co.in"
      },
      "serviceType": "Professional Services Marketplace",
      "areaServed": {
        "@type": "Country",
        "name": "India"
      },
      "availableChannel": {
        "@type": "ServiceChannel",
        "serviceUrl": "https://spanner.co.in",
        "servicePlatform": "Website"
      },
      "category": [
        "Home Services",
        "Professional Services",
        "Blue Collar Services",
        "Skilled Workers",
        "Local Services"
      ],
      "offers": {
        "@type": "Offer",
        "availability": "https://schema.org/InStock",
        "price": "0",
        "priceCurrency": "INR",
        "description": "Free to use platform for finding and hiring skilled workers"
      }
    });

    document.head.appendChild(serviceScript);

    return () => {
      // Cleanup function will run on component unmount
      try {
        if (organizationScript && organizationScript.parentNode) {
          document.head.removeChild(organizationScript);
        }
        if (websiteScript && websiteScript.parentNode) {
          document.head.removeChild(websiteScript);
        }
        if (faqScript && faqScript.parentNode) {
          document.head.removeChild(faqScript);
        }
        if (serviceScript && serviceScript.parentNode) {
          document.head.removeChild(serviceScript);
        }
      } catch (error) {
        // Gracefully handle cleanup errors
        console.log('Schema cleanup completed');
      }
    };
  }, []);

  return null;
}

export default SitelinksData;