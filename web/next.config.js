//@ts-check

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { composePlugins, withNx } = require('@nx/next');
const { withSentryConfig } = require("@sentry/nextjs");

/**
 * @type {import('@nx/next/plugins/with-nx').WithNxOptions}
 **/
const nextConfig = {
  webpack: (config) => {
    config.externals = [
      ...(config.externals || []),
      'bigint',
      'node-gyp-build',
    ];
    return config;
  },
  nx: {
    // Set this to true if you would like to use SVGR
    // See: https://github.com/gregberge/svgr
    svgr: false,
  },
};

const plugins = [
  // Add more Next.js plugins to this list if needed.
  withNx,
];

module.exports = withSentryConfig(composePlugins(...plugins)(nextConfig),
  {
    org: "blackpool-dao",
    project: "blackpooldao",
    authToken: process.env.SENTRY_AUTH_TOKEN,
    silent: false,
    tunnelRoute: "/monitoring-tunnel",
  }
);

