const Image = require("@11ty/eleventy-img");
const site = require("./src/_data/site.js");

module.exports = function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy("styles.css");
  eleventyConfig.addPassthroughCopy("assets");
  // PDF is copied by the `build:assets` npm script — fast-glob inside
  // Eleventy's passthrough copy treats the `(` `)` in the filename as
  // extglob syntax and silently skips the file.

  eleventyConfig.addFilter("findBySlug", (items, slug) => {
    if (!Array.isArray(items)) return undefined;
    return items.find((item) => item.slug === slug);
  });

  eleventyConfig.addNunjucksAsyncShortcode(
    "responsiveImage",
    async function (
      src,
      alt,
      sizes = "100vw",
      className = "",
      loading = "lazy",
      fetchpriority = "auto",
    ) {
      if (alt === undefined || alt === null) {
        throw new Error(`Missing alt text for responsive image: ${src}`);
      }

      const inputPath = src.startsWith("/") ? `.${src}` : src;
      const metadata = await Image(inputPath, {
        widths: [480, 768, 1080],
        formats: ["avif", "webp", "jpeg"],
        outputDir: "./_site/img/",
        urlPath: `${site.pathPrefix}img/`,
        sharpOptions: {
          animated: true,
        },
      });

      return Image.generateHTML(
        metadata,
        {
          alt,
          sizes,
          loading,
          decoding: "async",
          class: className || undefined,
          fetchpriority:
            fetchpriority === "auto" ? undefined : fetchpriority,
        },
        {
          whitespaceMode: "inline",
        },
      );
    },
  );

  eleventyConfig.setServerOptions({ port: 8080 });

  return {
    pathPrefix: site.pathPrefix,
    dir: {
      input: "src",
      output: "_site",
      includes: "_includes",
      data: "_data",
    },
    templateFormats: ["njk", "html", "md"],
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: "njk",
  };
};
