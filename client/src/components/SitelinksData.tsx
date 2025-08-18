import { useEffect } from 'react';

// Component to inject structured data for rich sitelinks like ChatGPT
export function SitelinksData() {
  useEffect(() => {
    // Add structured data for sitelinks
    const sitelinksScript = document.createElement('script');
    sitelinksScript.type = 'application/ld+json';
    sitelinksScript.innerHTML = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": "SPANNER",
      "url": "https://spanner.co.in",
      "sameAs": [
        "https://www.facebook.com/SpannerIndia",
        "https://www.twitter.com/SpannerIndia",
        "https://www.linkedin.com/company/spanner-india"
      ],
      "potentialAction": [
        {
          "@type": "SearchAction",
          "target": "https://spanner.co.in/find-workers",
          "name": "Find Workers"
        },
        {
          "@type": "Action",
          "target": "https://spanner.co.in/services",
          "name": "Browse Services"
        },
        {
          "@type": "Action", 
          "target": "https://spanner.co.in/quick-post",
          "name": "Post a Job"
        },
        {
          "@type": "Action",
          "target": "https://spanner.co.in/about",
          "name": "Learn About SPANNER"
        }
      ],
      "mainEntity": [
        {
          "@type": "Question",
          "name": "How to find skilled workers near me?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Use SPANNER to find verified skilled workers in your area. Search by service type, location, and budget to connect with professionals instantly."
          }
        },
        {
          "@type": "Question", 
          "name": "What services are available?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "SPANNER offers plumbing, electrical, painting, carpentry, cleaning, AC repair, and more professional services across 1000+ Indian cities."
          }
        },
        {
          "@type": "Question",
          "name": "How to hire workers instantly?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Simply post your job requirements on SPANNER using our Quick Post feature. Workers in your area will respond with quotes and you can hire instantly."
          }
        }
      ]
    });

    document.head.appendChild(sitelinksScript);

    // Add breadcrumb navigation data
    const breadcrumbScript = document.createElement('script');
    breadcrumbScript.type = 'application/ld+json';
    breadcrumbScript.innerHTML = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Home",
          "item": "https://spanner.co.in"
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "Find Workers",
          "item": "https://spanner.co.in/find-workers"
        },
        {
          "@type": "ListItem",
          "position": 3,
          "name": "Services",
          "item": "https://spanner.co.in/services"
        },
        {
          "@type": "ListItem",
          "position": 4,
          "name": "Quick Post",
          "item": "https://spanner.co.in/quick-post"
        },
        {
          "@type": "ListItem",
          "position": 5,
          "name": "About",
          "item": "https://spanner.co.in/about"
        },
        {
          "@type": "ListItem",
          "position": 6,
          "name": "Contact",
          "item": "https://spanner.co.in/contact"
        }
      ]
    });

    document.head.appendChild(breadcrumbScript);

    return () => {
      document.head.removeChild(sitelinksScript);
      document.head.removeChild(breadcrumbScript);
    };
  }, []);

  return null;
}

export default SitelinksData;