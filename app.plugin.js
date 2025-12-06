const { createRunOncePlugin } = require("@expo/config-plugins")
const pkg = require("./package.json")

const withRnRemoveImageBg = (config) => {
  return config
}

module.exports = createRunOncePlugin(withRnRemoveImageBg, pkg.name, pkg.version)
