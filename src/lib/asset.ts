/** Files in public/ are served under the site's base path (/eyewear-configurator/ on GitHub Pages). */
export const asset = (path: string) => `${import.meta.env.BASE_URL}${path}`
