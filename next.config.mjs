/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Maqueta del panel de control (propuesta interna): pagina estatica en
  // public/maqueta-panel.html, servida en /maqueta-panel y fuera de Google.
  async rewrites() {
    return [{ source: "/maqueta-panel", destination: "/maqueta-panel.html" }];
  },
  async headers() {
    return [
      { source: "/maqueta-panel", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] },
      { source: "/maqueta-panel.html", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] },
    ];
  },
};

export default nextConfig;
