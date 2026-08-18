/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['jsonwebtoken', 'bcryptjs', 'mongoose', 'pdfjs-dist']
  }
}

export default nextConfig;
