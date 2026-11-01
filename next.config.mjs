const isStaticExport = 'false';

/** @type {import('next').NextConfig} */
const nextConfig = {
  trailingSlash: true,

  env: {
    BUILD_STATIC_EXPORT: isStaticExport,
  },

  turbopack: {
    rules: {
      '*.svg': {
        loaders: [{ loader: '@svgr/webpack' }],
        as: '*.js',
      },
    },
  },

  ...(isStaticExport === 'true' && {
    output: 'export',
  }),
};

export default nextConfig;
