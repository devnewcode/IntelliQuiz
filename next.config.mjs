/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['jsonwebtoken', 'bcryptjs', 'mongoose', 'pdf-parse']
  }
}

export default nextConfig;
