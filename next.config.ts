
import 'dotenv/config';
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

if (process.env.NODE_ENV === 'development') {
    const devOrigin = process.env.GOOGLE_WORKSTATIONS_HOST
      ? `https://3000-${process.env.GOOGLE_WORKSTATIONS_HOST}`
      : process.env.GITPOD_WORKSPACE_URL?.replace('https://', 'https://3000-');

    if (devOrigin) {
        nextConfig.experimental = {
            ...nextConfig.experimental,
            allowedDevOrigins: [devOrigin],
        };
    }
}


export default nextConfig;
