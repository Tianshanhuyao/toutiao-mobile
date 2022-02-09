module.exports = {
  devServer: {
    proxy: {
      '/app': {
        target: 'http://geek.itheima.net/',
        ws: true,
        changeOrigin: true,
        pathRewrite: {
          '^/app': ''
        }
      }
    }
  }
}
