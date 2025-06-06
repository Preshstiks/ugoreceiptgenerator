const { FusesPlugin } = require("@electron-forge/plugin-fuses");
const { default: VitePlugin } = require("@electron-forge/plugin-vite");
const { FuseV1Options, FuseVersion } = require("@electron/fuses");

module.exports = {
  packagerConfig: {
    asar: true,
    icon: "./public/logo.ico",
    platform: "win32",
    arch: "x64",
    extraResource: ["./public"],
  },
  rebuildConfig: {},
  makers: [
    
    {
      name: "@electron-forge/maker-zip",
      platforms: ["win32"],
    },
    {
      name: "@electron-forge/maker-deb",
      config: {},
    },
    {
      name: "@electron-forge/maker-rpm",
      config: {},
    },
  ],
  plugins: [
    new VitePlugin({
      build: [
        {
          entry: "src/electron/main.ts",
          config: "vite.main.config.ts",
        },
      ],
      renderer: [
        {
          name: "main_window",
          config: "vite.config.ts",
        },
      ],
    }),
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
  ],
};
