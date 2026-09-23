/**
 * Exportação 100% estática (pasta `out/`), compatível com GitHub Pages,
 * Netlify, Vercel ou qualquer servidor de arquivos.
 * BASE_PATH permite publicar em subpasta, ex.: "/felipeprojetos/poker".
 */
const basePath = process.env.BASE_PATH || "";

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  basePath,
  trailingSlash: true,
  images: { unoptimized: true },
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
