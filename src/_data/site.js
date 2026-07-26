// Site-wide constants used by templates, structured data, sitemap and robots.txt.
// Change `url` here when switching between custom domain and the GitHub Pages preview URL.
const isLocalServe = ["serve", "watch"].includes(
  process.env.ELEVENTY_RUN_MODE,
);

module.exports = {
  // `iccl.org.au` is not used until its TLS certificate and GitHub Pages
  // custom-domain configuration are working. Internal URLs are passed through
  // Eleventy's `url` filter. Local development is served from `/`; production
  // retains the GitHub Pages project path.
  url: "https://iccl.org.au",
  deploymentPathPrefix: "/",
  pathPrefix: "/",
  name: "Inhale Culture Celebrate Life",
  shortName: "ICCL",
  legalName: "Inhale Culture Celebrate Life Ltd",
  tagline: "Inhale culture. Celebrate life.",
  description:
    "Inhale Culture Celebrate Life Ltd (ICCL) is a registered Australian charity producing festivals and cultural programs celebrating multicultural Australia. ",
  locale: "en_AU",
  logo: "/assets/ICCL-Logo.png",
  socialImage: "/assets/Hero-image.jpg",
  founded: "2025-09-04",
  abn: "94 690 672 694",
  acn: "690 672 694",
  email: {
    general: "info@iccl.org.au",
    events: "events@iccl.org.au",
  },
  address: {
    street: "302 St Georges Road",
    locality: "Thornbury",
    region: "VIC",
    postcode: "3071",
    country: "AU",
  },
  organizationProfiles: [
    "https://www.facebook.com/iccl.org.au",
  ],
};
