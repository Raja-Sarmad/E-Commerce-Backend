/**
 * Set CDN/browser cache headers for public read-only responses.
 */
function cacheHeaders(maxAgeSeconds = 60) {
  return (_req, res, next) => {
    res.set(
      "Cache-Control",
      `public, max-age=${maxAgeSeconds}, s-maxage=${maxAgeSeconds}, stale-while-revalidate=${maxAgeSeconds * 2}`
    );
    next();
  };
}

export default cacheHeaders;
