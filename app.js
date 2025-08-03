// app.js
App({
  onLaunch() {
    // 展示本地存储能力
    const logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)

    // 创建日志目录（如果不存在）
    const fs = wx.getFileSystemManager()
    try {
      // 使用正确的本地文件路径格式
      const userDataPath = wx.env.USER_DATA_PATH
      console.log('用户数据路径:', userDataPath)
      const logDir = `${userDataPath}/miniprogramLog`
      // 检查目录是否存在
      try {
        const stats = fs.statSync(logDir)
        console.log('日志目录已存在:', logDir)
      } catch (statError) {
        // 目录不存在，创建目录
        fs.mkdirSync(logDir, true)
        console.log('日志目录创建成功:', logDir)
      }
    } catch (e) {
      console.error('日志目录创建失败:', JSON.stringify(e))
    }

    // 初始化网络请求
    this.initNetwork()
  },

  initNetwork() {
    // 初始化网络请求配置
    // 注意：基础库3.9.0不支持wx.setNetworkTimeout，已移除
  },

  // 发送控制命令到ESP8266
  sendCommand(command) {
    const app = getApp()
    if (!app.globalData.espIp) {
      wx.showToast({
        title: '请先设置ESP8266的IP地址',
        icon: 'none'
      })
      return
    }

    wx.request({
      url: `http://${app.globalData.espIp}:${app.globalData.espPort}/control`,
      method: 'POST',
      data: {
        command: command
      },
      success(res) {
        if (res.data.success) {
          wx.showToast({
            title: '命令发送成功',
            icon: 'success'
          })
          app.globalData.doorState = command
        } else {
          wx.showToast({
            title: '命令发送失败',
            icon: 'none'
          })
        }
      },
      fail() {
        wx.showToast({
          title: '网络连接失败',
          icon: 'none'
        })
      }
    })
  },

  globalData: {
    // 存储ESP8266的IP地址和端口
    espIp: '',
    espPort: '80',
    // 门状态
    doorState: 'stop'
  }
})