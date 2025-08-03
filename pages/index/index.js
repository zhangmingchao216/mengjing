// index.js
Page({
  data: {
    stateText: '停止',
    stateClass: 'state-stop',
    logs: [],
    // 萤石云配置参数 - 请根据您的实际设备信息修改以下参数
    appKey: '15ed4fb161d443759146a82b1852c6ce',
    appSecret: 'af6db7637cec411be966b930ab4c746d',
    accessToken: 'at.3mzltw7e2m96tc0sdwbk1m57c93wyeir-77dvifej99-0qqk9ug-b1lumtftc',
    deviceSerial: 'G75351381',  // 设备序列号 - 在这里更改
    channelNo: 1,  // 通道号 - 在这里更改，通常为1
    protocol: 2,  // 1:RTSP, 2:RTMP, 3:HLS
    videoUrl: ''
  },

  onLoad() {
    // 检查登录状态
    const isLoggedIn = wx.getStorageSync('isLoggedIn')
    if (!isLoggedIn) {
      // 未登录，跳转到登录页面
      wx.redirectTo({
          url: '/pages/login/login'
        })
        return
    }

    // 从全局应用获取数据
    const app = getApp()
    
    // 检查选择的门类型
    const selectedDoor = wx.getStorageSync('selectedDoor') || 'front'
    let deviceSerial = 'G75351381'  // 默认前门摄像头序列号
    
    if (selectedDoor === 'back') {
      // 后门，使用后门摄像头序列号
      deviceSerial = wx.getStorageSync('backDoorSerial') || 'D94837588'
      console.log('选择后门，摄像头序列号:', deviceSerial)
    } else {
      console.log('选择前门，摄像头序列号:', deviceSerial)
    }

    this.setData({
      espIp: app.globalData.espIp || '',
      stateText: this.getStateText(app.globalData.doorState),
      deviceSerial: deviceSerial
    });
    // 获取视频URL
    this.getVideoUrl();
  },

  // 获取视频URL
  getVideoUrl() {
    wx.request({
      url: 'https://open.ys7.com/api/lapp/v2/live/address/get',
      method: 'POST',
      header: {
        'content-type': 'application/x-www-form-urlencoded'
      },
      data: {
        accessToken: this.data.accessToken,
        deviceSerial: this.data.deviceSerial,
        channelNo: this.data.channelNo,
        protocol: this.data.protocol,
        definition: 1,  // 设置为流畅模式: 1(流畅), 2(标清), 3(高清)
        encode: 'H264'  // 指定视频编码格式为H264
      },
      // 打印请求参数，确认deviceSerial和protocol
      beforeSend: () => {
        console.log('请求视频URL参数:', {
          accessToken: this.data.accessToken,
          deviceSerial: this.data.deviceSerial,
          channelNo: this.data.channelNo,
          protocol: this.data.protocol,
          definition: 1,
          encode: 'H264'
        })
        // 检查摄像头协议
        console.log('摄像头', this.data.deviceSerial === 'D94837588' ? '后门' : '前门', '当前协议:', this.data.protocol === 2 ? 'RTMP' : this.data.protocol === 3 ? 'HLS' : 'RTSP')
      },
      success: (res) => {
        console.log('萤石云API响应:', res.data);
        if (res.data.code === '200') {
          if (res.data.data && res.data.data.url) {
            this.setData({
              videoUrl: res.data.data.url
            })
            this.addLog('获取视频URL成功: ' + res.data.data.url)
            console.log('视频URL设置成功:', res.data.data.url)
          } else {
            this.addLog('获取视频URL失败: 响应数据中没有URL')
            console.error('获取视频URL失败: 响应数据中没有URL', res.data)
            wx.showToast({
              title: '获取视频URL失败: 响应数据中没有URL',
              icon: 'none'
            })
          }
        } else {
          this.addLog(`获取视频URL失败: ${res.data.code} - ${res.data.msg}`)
          console.error('获取视频URL失败:', res.data.code, '-', res.data.msg)
          wx.showToast({
            title: `获取视频URL失败: ${res.data.code} - ${res.data.msg}`,
            icon: 'none'
          })
        }
      },
      fail: (err) => {
        console.error('网络请求失败:', err);
        this.addLog(`网络请求失败: ${err.errMsg}`)
        wx.showToast({
          title: '网络请求失败',
          icon: 'none'
        })
      },
      complete: (res) => {
          // 如果请求完成但视频URL为空，尝试切换协议（适用于所有摄像头）
          if (this.data.videoUrl === '') {
            // 记录协议切换尝试
            console.log('视频URL为空，尝试切换协议。当前协议:', this.data.protocol === 2 ? 'RTMP' : this.data.protocol === 3 ? 'HLS' : 'RTSP')

            // 按照RTMP→HLS→RTSP的顺序尝试切换协议
            if (this.data.protocol === 2) {
              // 当前是RTMP协议，尝试切换到HLS协议
              this.setData({ protocol: 3 })
              console.log('切换到HLS协议')
            } else if (this.data.protocol === 3) {
              // 当前是HLS协议，尝试切换到RTSP协议
              this.setData({ protocol: 1 })
              console.log('切换到RTSP协议')
            } else {
              // 当前是RTSP协议，尝试切换回RTMP协议
              this.setData({ protocol: 2 })
              console.log('切换回RTMP协议')
            }

            // 重新获取视频URL
            this.getVideoUrl()
          }
      }
    })
  },

  // 开始预览
  startPreview() {
    if (this.data.videoUrl) {
      const videoContext = wx.createVideoContext('videoPlayer')
      videoContext.play()
      this.addLog('开始视频预览')
    } else {
      this.addLog('视频URL为空，无法预览')
      wx.showToast({
        title: '视频URL为空，无法预览',
        icon: 'none'
      })
    }
  },

  // 停止预览
  stopPreview() {
    const videoContext = wx.createVideoContext('videoPlayer')
    videoContext.pause()
    this.addLog('停止视频预览')
  },

  // 手动刷新视频URL
  refreshVideoUrl() {
    wx.showLoading({
      title: '正在获取视频URL...',
    })
    this.getVideoUrl()
    setTimeout(() => {
      wx.hideLoading()
    }, 3000)
  },

  onShow() {
    // 每次页面显示时更新状态
    const app = getApp()
    this.setData({
      stateText: this.getStateText(app.globalData.doorState),
      stateClass: this.getStateClass(app.globalData.doorState)
    })
  },

  // 返回上一页
  navigateBack() {
    wx.navigateBack({
      delta: 1
    })
  },

  // 开门按钮点击事件
  openDoor() {
    const app = getApp()
    app.sendCommand('open')
    this.addLog('发送开门命令')
  },

  // 关门按钮点击事件
  closeDoor() {
    const app = getApp()
    app.sendCommand('close')
    this.addLog('发送关门命令')
  },

  // 停止按钮点击事件
  stopDoor() {
    const app = getApp()
    app.sendCommand('stop')
    this.addLog('发送停止命令')
  },

  // 获取状态文本
  getStateText(state) {
    switch (state) {
      case 'open':
        return '开门中'
      case 'close':
        return '关门中'
      case 'stop':
      default:
        return '停止'
    }
  },

  // 获取状态样式
  getStateClass(state) {
    switch (state) {
      case 'open':
        return 'state-open'
      case 'close':
        return 'state-close'
      case 'stop':
      default:
        return 'state-stop'
    }
  },

  // 添加操作日志
  addLog(content) {
    const now = new Date()
    const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`
    const logs = [{ time, content }, ...this.data.logs]
    // 只保留最近20条日志
    if (logs.length > 20) {
      logs.pop()
    }
    this.setData({
      logs
    })
  },

  // 返回上一页
  navigateBack() {
    wx.navigateBack({
      delta: 1
    })
  }
})