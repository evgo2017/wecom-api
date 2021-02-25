
根据个人需求不定时不定量更新。欢迎提 Issues。

目前 License 为 GPL，个人用途可闭源，若有需求或者商用请[联系我](https://evgo2017.com/link)，之后版本会修改 License。



参考[官方 API 文档](https://work.weixin.qq.com/api/doc/90000/90135/90664)

- [x]  [回调配置](https://work.weixin.qq.com/api/doc/90000/90135/90930)

- [x]  [消息推送](https://work.weixin.qq.com/api/doc/90000/90135/90238)

实现例子：

![wework.message](https://github.com/evgo2017/wecom-api/blob/master/assets/wework.message.png)

举例应用：

<> 括起来是用户自己补充的值，只需修改这三个参数（和 http 传值）即可使用。

weToken：在 API 接收消息页面填写的 Token

weEncodingAESKey：在 API 接收消息页面填写的 EncodingAESKey

weReceiveId：在“我的企业”页面最下面的“企业 ID”

```
  const { WXBizMsgCrypt } = require('wecom-api')

  verifyURL (ctx) {
    const { msg_signature, timestamp, nonce, echostr } = ctx.request.query
    try {
      const wXBizMsgCrypt = new WXBizMsgCrypt(<weToken>, <weEncodingAESKey>, <weReceiveId>)
      ctx.body = wXBizMsgCrypt.verifyURL(msg_signature, timestamp, nonce, echostr).message
    } catch (e) {
      ctx.body = e
    }
  }
  
  async receiveMsg (ctx) {
    const { msg_signature, timestamp, nonce } = ctx.request.query
    const postData = ctx.request.body // 注意程序可以接收 xml 格式数据

    try {
      const wXBizMsgCrypt = new WXBizMsgCrypt(<weToken>, <weEncodingAESKey>, <weReceiveId>)
      const receivedmsg = wXBizMsgCrypt.decryptMsg(msg_signature, timestamp, nonce, postData)
      const { ToUserName, FromUserName, CreateTime, MsgType, Content, MsgId, AgentID } = receivedmsg
      // 示例回复，之后补充 message 格式引用
      const xmlText = `<xml><ToUserName><![CDATA[${FromUserName}]]></ToUserName><FromUserName><![CDATA[${ToUserName}]]></FromUserName><CreateTime>${CreateTime}</CreateTime><MsgType><![CDATA[text]]></MsgType><Content><![CDATA[${new Date(Date.now())} ${Date.now().toString()}: ${Content}]]></Content></xml>`
      const msg = wXBizMsgCrypt.encryptMsg(xmlText)
      ctx.body = msg
    } catch (e) {
      ctx.body = e
    }
  }
```

- [ ] 添加测试



