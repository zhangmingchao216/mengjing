/*
  ESP8266 门控开关控制代码
  功能：接收来自微信小程序的命令，控制D0、D2、D3口的继电器
  特性：支持配网功能和看门狗功能
*/

#include <ESP8266WiFi.h>
#include <ESP8266WebServer.h>
#include <ESP8266mDNS.h>
#include <WiFiManager.h>  // 配网库
#include <ESP8266WiFiMulti.h>
#include <Ticker.h>       // 定时器库，用于喂狗

// 定义看门狗相关
#include <ESP8266WiFi.h>
#include <core_esp8266_wdt.h>

// 创建Ticker对象用于喂狗
Ticker喂狗定时器;

// 继电器引脚定义
const int RELAY_PIN_D0 = 16;  // D0引脚
const int RELAY_PIN_D2 = 4;   // D2引脚
const int RELAY_PIN_D3 = 0;   // D3引脚

// 创建Web服务器对象，监听端口80
ESP8266WebServer server(80);

// 初始化函数
void setup() {
  // 初始化串口
  Serial.begin(115200);
  Serial.println();

  // 初始化看门狗 - 设置为8秒超时
  ESP.wdtEnable(8000);
  Serial.println("看门狗已启用");

  // 设置喂狗定时器，每3秒喂一次狗
  喂狗定时器.attach(3, 喂狗函数);

  // 初始化继电器引脚为输出模式
  pinMode(RELAY_PIN_D0, OUTPUT);
  pinMode(RELAY_PIN_D2, OUTPUT);
  pinMode(RELAY_PIN_D3, OUTPUT);

  // 初始状态：继电器关闭
  digitalWrite(RELAY_PIN_D0, HIGH);
  digitalWrite(RELAY_PIN_D2, HIGH);
  digitalWrite(RELAY_PIN_D3, HIGH);

  // 初始化配网
  WiFiManager wifiManager;

  // 尝试连接已保存的WiFi
  // 如果连接失败，则启动AP模式进行配网
  if (!wifiManager.autoConnect("门控开关配网")) {
    Serial.println("配网失败，重启设备...");
    delay(3000);
    ESP.restart();
  }

  Serial.println("WiFi连接成功");
  Serial.print("IP地址: ");
  Serial.println(WiFi.localIP());

  // 设置mDNS，方便通过域名访问
  if (MDNS.begin("doorcontrol")) {
    Serial.println("mDNS服务已启动，可以通过doorcontrol.local访问");
  }

  // 设置路由
  server.on("/control", HTTP_POST, handleControl);
  server.on("/reset", HTTP_GET, 重置设备);
  server.onNotFound(handleNotFound);

  // 启动服务器
  server.begin();
  Serial.println("服务器已启动");
}

// 主循环
void loop() {
  // 处理客户端请求
  server.handleClient();
  MDNS.update(); // 更新mDNS
}

// 处理控制命令
void handleControl() {
  // 检查是否有命令参数
  if (server.hasArg("command")) {
    String command = server.arg("command");
    Serial.print("收到命令: ");
    Serial.println(command);

    // 执行命令
    if (command == "open") {
      // 开门命令：激活D0和D2
      digitalWrite(RELAY_PIN_D0, LOW);
      digitalWrite(RELAY_PIN_D2, LOW);
      digitalWrite(RELAY_PIN_D3, HIGH);
      sendResponse(true, "开门命令已执行");
    } else if (command == "close") {
      // 关门命令：激活D0和D3
      digitalWrite(RELAY_PIN_D0, LOW);
      digitalWrite(RELAY_PIN_D2, HIGH);
      digitalWrite(RELAY_PIN_D3, LOW);
      sendResponse(true, "关门命令已执行");
    } else if (command == "stop") {
      // 停止命令：关闭所有继电器
      digitalWrite(RELAY_PIN_D0, HIGH);
      digitalWrite(RELAY_PIN_D2, HIGH);
      digitalWrite(RELAY_PIN_D3, HIGH);
      sendResponse(true, "停止命令已执行");
    } else {
      sendResponse(false, "无效的命令");
    }
  } else {
    sendResponse(false, "缺少命令参数");
  }
}

// 处理未找到的路由
void handleNotFound() {
  sendResponse(false, "未找到该路由");
}

// 发送响应
void sendResponse(bool success, String message) {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.sendHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  server.sendHeader("Access-Control-Allow-Headers", "Content-Type");
  server.send(200, "application/json", "{\"success\": " + String(success) + ", \"message\": \"" + message + "\"}");
}

// 喂狗函数
void 喂狗函数() {
  ESP.wdtFeed();
  Serial.println("喂狗成功");
}

// 重置设备函数
void 重置设备() {
  sendResponse(true, "设备将重置");
  Serial.println("接收到重置命令，重启设备...");
  delay(1000);
  ESP.restart();
}

/*
  注意事项：
  1. 请替换代码中的WiFi名称和密码为你的实际WiFi信息
  2. 继电器模块的控制逻辑可能不同，根据实际情况调整HIGH/LOW信号
  3. 确保ESP8266的IP地址在微信小程序中正确设置
  4. 建议添加一个物理的紧急停止按钮，以确保安全
*/