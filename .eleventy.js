const { EleventyHtmlBasePlugin } = require("@11ty/eleventy");

module.exports = function (eleventyConfig) {

  // AUTO-REWRITE ALL href/src IN HTML OUTPUT
  eleventyConfig.addPlugin(EleventyHtmlBasePlugin);

  eleventyConfig.addPassthroughCopy({ "src/css": "css" });
  eleventyConfig.addPassthroughCopy({ "src/js": "js" });
  eleventyConfig.addPassthroughCopy({ "src/img": "img" });
  eleventyConfig.addPassthroughCopy({ "src/fonts": "fonts" });
  eleventyConfig.addFilter("year", (date) => new Date(date).getFullYear());
  eleventyConfig.addFilter("pad", (num, size = 2) => String(num).padStart(size, '0'));

  // Filter: find items where a nested property equals a value
  eleventyConfig.addFilter("filterBy", function (arr, prop, value) {
    if (!arr) return [];
    return arr.filter(function (item) {
      var val = prop.split('.').reduce(function (obj, key) {
        return obj ? obj[key] : undefined;
      }, item);
      return val === value;
    });
  });

  // Filter: sort items by a nested property
  eleventyConfig.addFilter("sortBy", function (arr, prop) {
    if (!arr) return [];
    return arr.slice().sort(function (a, b) {
      var va = prop.split('.').reduce(function (obj, key) {
        return obj ? obj[key] : undefined;
      }, a);
      var vb = prop.split('.').reduce(function (obj, key) {
        return obj ? obj[key] : undefined;
      }, b);
      if (va < vb) return -1;
      if (va > vb) return 1;
      return 0;
    });
  });

  // Filter: format a date
  eleventyConfig.addFilter("formatDate", function (dateVal, format, locale = "en-US") {
    var d = new Date(dateVal);
    if (format === "month-year") {
      var result = new Intl.DateTimeFormat(locale, {
        month: "long",
        year: "numeric"
      }).format(d);
      return result.charAt(0).toUpperCase() + result.slice(1);
    }
    return d.toLocaleDateString(locale, {
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  });

  // Filter: get previous item in a collection
  eleventyConfig.addFilter("getPrev", function (collection, page) {
    if (!collection || !page) return null;
    var sorted = collection.slice().sort(function (a, b) {
      return new Date(a.date) - new Date(b.date);
    });
    var index = sorted.findIndex(function (item) {
      return item.url === page.url;
    });
    return index > 0 ? sorted[index - 1] : null;
  });

  // Filter: get next item in a collection
  eleventyConfig.addFilter("getNext", function (collection, page) {
    if (!collection || !page) return null;
    var sorted = collection.slice().sort(function (a, b) {
      return new Date(a.date) - new Date(b.date);
    });
    var index = sorted.findIndex(function (item) {
      return item.url === page.url;
    });
    return index >= 0 && index < sorted.length - 1 ? sorted[index + 1] : null;
  });

  return {
    dir: {
      input: "src",
      output: "_site",
      includes: "_includes",
      data: "_data"
    },
    // Replace "meridian" with your actual GitHub repo name
    pathPrefix: process.env.GITHUB_PAGES ? "/meridian/" : "/"
  };
};