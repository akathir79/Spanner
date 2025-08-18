import type { Express } from "express";
import { storage } from "./storage";

// Generate XML sitemap for SEO
export function registerSitemapRoutes(app: Express) {
  
  // Main sitemap index
  app.get('/sitemap.xml', async (req, res) => {
    const baseUrl = getBaseUrl(req);
    
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${baseUrl}/sitemap-main.xml</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${baseUrl}/sitemap-services.xml</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${baseUrl}/sitemap-locations.xml</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${baseUrl}/sitemap-workers.xml</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
  </sitemap>
</sitemapindex>`;

    res.set('Content-Type', 'application/xml');
    res.send(sitemap);
  });

  // Main pages sitemap
  app.get('/sitemap-main.xml', async (req, res) => {
    const baseUrl = getBaseUrl(req);
    const now = new Date().toISOString();
    
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  <url>
    <loc>${baseUrl}/</loc>
    <lastmod>${now}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
    <image:image>
      <image:loc>${baseUrl}/og-image.jpg</image:loc>
      <image:title>SPANNER - India's Blue Collar Service Marketplace</image:title>
    </image:image>
  </url>
  <url>
    <loc>${baseUrl}/about</loc>
    <lastmod>${now}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${baseUrl}/how-it-works</loc>
    <lastmod>${now}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${baseUrl}/contact</loc>
    <lastmod>${now}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>${baseUrl}/quick-post</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${baseUrl}/find-workers</loc>
    <lastmod>${now}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${baseUrl}/register</loc>
    <lastmod>${now}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
  <url>
    <loc>${baseUrl}/worker-registration</loc>
    <lastmod>${now}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
</urlset>`;

    res.set('Content-Type', 'application/xml');
    res.send(sitemap);
  });

  // Services sitemap
  app.get('/sitemap-services.xml', async (req, res) => {
    const baseUrl = getBaseUrl(req);
    const now = new Date().toISOString();
    
    try {
      const services = await storage.getAllServices();
      
      let urls = '';
      services.forEach(service => {
        const serviceSlug = service.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        urls += `
  <url>
    <loc>${baseUrl}/services/${serviceSlug}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
      });

      const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

      res.set('Content-Type', 'application/xml');
      res.send(sitemap);
    } catch (error) {
      console.error('Error generating services sitemap:', error);
      res.status(500).send('Error generating sitemap');
    }
  });

  // Locations sitemap
  app.get('/sitemap-locations.xml', async (req, res) => {
    const baseUrl = getBaseUrl(req);
    const now = new Date().toISOString();
    
    try {
      // Get all districts - simplified approach
      const districts = {
        "Tamil Nadu": { districts: ["Chennai", "Salem", "Coimbatore", "Madurai", "Trichy"] },
        "Karnataka": { districts: ["Bangalore", "Mysore", "Mangalore", "Hubli"] },
        "Andhra Pradesh": { districts: ["Hyderabad", "Vijayawada", "Visakhapatnam", "Guntur"] },
        "Kerala": { districts: ["Kochi", "Thiruvananthapuram", "Kozhikode", "Thrissur"] },
        "Maharashtra": { districts: ["Mumbai", "Pune", "Nashik", "Nagpur"] }
      };
      
      let urls = '';
      
      // Add state pages
      const states = Object.keys(districts);
      states.forEach(state => {
        const stateSlug = state.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        urls += `
  <url>
    <loc>${baseUrl}/locations/${stateSlug}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`;
      });

      // Add district pages
      Object.entries(districts).forEach(([state, stateData]: [string, any]) => {
        const stateSlug = state.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        if (stateData && stateData.districts && Array.isArray(stateData.districts)) {
          stateData.districts.forEach((district: string) => {
            const districtSlug = district.toLowerCase().replace(/[^a-z0-9]+/g, '-');
            urls += `
  <url>
    <loc>${baseUrl}/locations/${stateSlug}/${districtSlug}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`;
          });
        }
      });

      const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

      res.set('Content-Type', 'application/xml');
      res.send(sitemap);
    } catch (error) {
      console.error('Error generating locations sitemap:', error);
      res.status(500).send('Error generating sitemap');
    }
  });

  // Workers sitemap (public worker profiles)
  app.get('/sitemap-workers.xml', async (req, res) => {
    const baseUrl = getBaseUrl(req);
    const now = new Date().toISOString();
    
    try {
      // Get verified workers only
      const workers = await storage.getAllUsers().then(users => 
        users.filter(user => user.role === 'worker' && user.isVerified)
      );
      
      let urls = '';
      workers.forEach((worker: any) => {
        const workerSlug = `${worker.firstName}-${worker.lastName}-${worker.id}`.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        urls += `
  <url>
    <loc>${baseUrl}/workers/${workerSlug}</loc>
    <lastmod>${worker.updatedAt || now}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>`;
      });

      const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

      res.set('Content-Type', 'application/xml');
      res.send(sitemap);
    } catch (error) {
      console.error('Error generating workers sitemap:', error);
      res.status(500).send('Error generating sitemap');
    }
  });
}

function getBaseUrl(req: any): string {
  const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https';
  const host = req.headers['x-forwarded-host'] || req.headers.host || 'spanner.replit.app';
  return `${protocol}://${host}`;
}