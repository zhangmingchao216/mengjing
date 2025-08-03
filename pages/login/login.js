// login.js
Page({
  data: {
    password: '',
    errorMsg: ''
  },

  // 输入密码
  inputPassword(e) {
    this.setData({
      password: e.detail.value
    })
  },

  // 提交登录
  submitLogin() {
    const correctPassword = 'tyd87926117'
    if (this.data.password === correctPassword) {
      // 登录成功，存储登录状态
      wx.setStorageSync('isLoggedIn', true)
      // 跳转到门选择页面
      wx.navigateTo({
        url: '/pages/doorSelect/doorSelect'
      })
    } else {
      this.setData({
        errorMsg: '密码错误，请重试'
      })
    }
  }
})