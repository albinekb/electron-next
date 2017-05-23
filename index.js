// Native
const { createServer } = require('http')
const path = require('path')

// Packages
const next = require('next')
const isDev = require('electron-is-dev')

const devServer = async (app, dir, port) => {
  const nextApp = next({ dev: true, dir })
  const nextHandler = nextApp.getRequestHandler()

  // Build the renderer code and watch the files
  await nextApp.prepare()

  // But if developing the application, create a
  // new native HTTP server (which supports hot code reloading)
  const server = createServer(nextHandler)

  server.listen(port || 8000, () => {
    // Make sure to stop the server when the app closes
    // Otherwise it keeps running on its own
    app.on('before-quit', () => server.close())
  })
}

const adjustRenderer = (protocol, dir) => {
  const paths = ['_next', 'static']

  protocol.interceptFileProtocol('file', (request, callback) => {
    let filePath = request.url.substr('file'.length + 1)

    for (const replacement of paths) {
      const wrongPath = '///' + replacement
      const rightPath = '//' + dir + '/' + replacement

      filePath = filePath.replace(wrongPath, rightPath)
    }

    callback({ path: filePath })
  })
}

module.exports = async (electron, dirs, port) => {
  const directories = {}

  if (typeof dirs === 'string') {
    directories.prod = dirs
    directories.dev = dirs
  } else {
    directories = dirs
  }

  if (!isDev) {
    adjustRenderer(electron.protocol, dirs.prod)
    return
  }

  await devServer(electron.app, dirs.dev, port)
}
