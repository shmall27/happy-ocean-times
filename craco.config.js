module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      webpackConfig.experiments = {
        asyncWebAssembly: true,
      };
      webpackConfig.module.rules.push({
        test: /\.wasm$/,
        type: "webassembly/async",
      });
      return webpackConfig;
    },
  },
};
