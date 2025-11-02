// Minimal shim to ensure `process.env` exists in the browser so packages
// that reference `process.env` don't throw at runtime.
if (typeof process === "undefined") {
  // eslint-disable-next-line no-undef
  window.process = { env: { NODE_ENV: "development" } };
}
