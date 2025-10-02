/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['jsonwebtoken', 'bcryptjs', 'mongoose']
  }
}

export default nextConfig;
