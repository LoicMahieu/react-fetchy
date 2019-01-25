module.exports = {
  presets: [
    [
      "@babel/preset-env",
      {
        "targets": {
          "esmodules": true
        }
      },
    ],
    ["@babel/react"],
  ],
  plugins: ["transform-class-properties"],
};
