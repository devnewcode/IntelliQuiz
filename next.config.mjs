/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['jsonwebtoken', 'bcryptjs', 'mongoose', 'pdfjs-dist', '@napi-rs/canvas']
  }
}

export default nextConfig;
