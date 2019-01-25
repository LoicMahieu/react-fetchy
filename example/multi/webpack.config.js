const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = {
  module: {
    rules: [{ test: /\.js$/, exclude: /node_modules/, loader: "babel-loader" }],
  },
  mode: "development",
  plugins: [
    new HtmlWebpackPlugin({
      title: "Example",
    }),
  ],
  devServer: {
    historyApiFallback: true,
    hot: false,
    inline: true,
    contentBase: "./app",
    port: 3000,
    host: "0.0.0.0",
    disableHostCheck: true,
    proxy: {
      '/api': 'http://localhost:8080'
    }
  },
};
