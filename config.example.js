exports.default = {
  host: "10.0.0.1",
  port: "22",
  username: "username",
  password: "password",
  localPath: "/Users",
  remotePath: "/data00/home",
  /**
   * 使用 string.includes 或 regExp.test 过滤
   * exclude 优先级高于 include
   */
  include: [""],
  exclude: [
    /\/.\w*cache\//,
    "/.docz/",
    "/coverage/",
    "/npm-packages-offline-cache/",
    "/npm-offline-mirror/"
  ]
};
