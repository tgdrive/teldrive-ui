const fs = require("fs")
const path = require("path")

const versionInfo = {
  version: "",
  commit: "",
  link: "",
}

const filePath = path.join(process.cwd(), "version.json")

if (!fs.existsSync(filePath)) {
  const content = JSON.stringify(versionInfo, null, 2)

  fs.writeFile(filePath, content, "utf8", (err) => {
    if (err) {
      console.error("Error creating version-info.json:", err)
    } else {
      console.log("version-info.json created successfully.")
    }
  })
} else {
  console.log("version.json already exists. Skipping creation.")
}
