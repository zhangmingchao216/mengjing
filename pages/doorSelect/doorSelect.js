// doorSelect.js
Page({
  data: {
    espIp: ''
  },

  onLoad() {
    // 从全局应用获取数据
    const app = getApp()
    this.setData({
      espIp: app.globalData.espIp || ''
    })
  },

  // 选择前门
  selectFrontDoor() {
    // 存储选择的门类型
    wx.setStorageSync('selectedDoor', 'front')
    // 跳转到主页面
    wx.navigateTo({
      url: '/pages/index/index'
    })
  },

  // 选择后门
  selectBackDoor() {
    // 存储选择的门类型
    wx.setStorageSync('selectedDoor', 'back')
    // 存储后门的摄像头序列号
    wx.setStorageSync('backDoorSerial', 'D94837588')
    // 跳转到主页面
    wx.navigateTo({
      url: '/pages/index/index'
    })
  },

  // 处理IP地址输入
  onIpInput(e) {
    const ip = e.detail.value
    this.setData({
      espIp: ip
    })
    // 保存到全局应用
    const app = getApp()
    app.globalData.espIp = ip
  },

  // 开始配网
  startConfig() {
    wx.showModal({
      title: '配网提示',
      content: '请确保ESP8266处于配网模式，然后点击确定开始搜索WiFi热点。',
      success: (res) => {
        if (res.confirm) {
          this.addLog('开始配网')
          this.scanWifi()
        }
      }
    })
  },

  // 扫描WiFi
  scanWifi() {
    wx.startWifi({
      success: () => {
        wx.showLoading({
          title: '正在扫描WiFi...',
        })
        wx.getWifiList({
          success: () => {
            wx.onGetWifiList((res) => {
              wx.hideLoading()
              if (res.wifiList.length > 0) {
                // 查找ESP8266的热点
                const espWifi = res.wifiList.find(item => item.SSID.includes('门控开关配网'))
                if (espWifi) {
                  this.connectToEspWifi(espWifi.SSID)
                } else {
                  wx.showToast({
                    title: '未找到ESP8266热点',
                    icon: 'none'
                  })
                }
              } else {
                wx.showToast({
                  title: '未扫描到WiFi热点',
                  icon: 'none'
                })
              }
            })
          },
          fail: (err) => {
            wx.hideLoading()
            wx.showToast({
              title: '扫描WiFi失败',
              icon: 'none'
            })
          }
        })
      },
      fail: (err) => {
        wx.showToast({
          title: '初始化WiFi失败',
          icon: 'none'
        })
      }
    })
  },

  // 连接到ESP8266的WiFi
  connectToEspWifi(ssid) {
    wx.showModal({
      title: '连接提示',
      content: `将连接到热点: ${ssid}\n\n注意：连接后需要在浏览器中完成配网。`,
      success: (res) => {
        if (res.confirm) {
          wx.setClipboardData({
            data: 'http://192.168.4.1',
            success: () => {
              wx.showToast({
                title: '配网地址已复制',
                icon: 'success'
              })
            }
          })
          // 由于微信小程序限制，无法直接连接WiFi，引导用户手动连接
          wx.showModal({
            title: '手动连接',
            content: '请手动连接到ESP8266的WiFi热点，然后打开手机浏览器访问复制的地址进行配网。',
            showCancel: false
          })
        }
      }
    })
  },

  // 添加操作日志
  addLog(content) {
    console.log('配网日志:', content)
  }
})