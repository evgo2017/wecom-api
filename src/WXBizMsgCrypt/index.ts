const wecomcrypto = require('@wecom/crypto')
import { CryptoException } from './CryptoException'
import { XMLParse } from './XMLParse'

/**
 * 加解密方案说明（https://work.weixin.qq.com/api/doc/90000/90139/90968）
 * 回调配置（https://work.weixin.qq.com/api/doc/90000/90135/90930）
 */
export class WXBizMsgCrypt {
  private token: string;
  private receiveId: string;
  private encodingAesKey: string; // 用于消息体加密，长度固定 43 字符，a-zA-Z0-9，为 AESKey 的 Base64 编码，解码后为 32 位的 AESKey
  // AES 算法密钥，长度 32 字节。AES 加密算法，采用 CBC 模式，PKCS#7 填充至 32 字节的倍数；Ⅳ初始向量大小位 16 字节，取 AESKey 前 16 字节

  /**
   * 构造函数
   * 
   * @param {string} token 企业微信后台，开发者设置的Token
   * @param {string} encodingAesKey 企业微信后台，开发者设置的EncodingAESKey
   * @param {string} receiveId 不同场景含义不同：企业应用的回调，表示corpid；第三方事件的回调，表示suiteid
   */
  constructor (token: string, encodingAesKey: string, receiveId: string) {
    if (encodingAesKey.length != 43) {
      throw new CryptoException(CryptoException.IllegalAesKey)
    }

    this.token = token
    this.receiveId = receiveId
    this.encodingAesKey = encodingAesKey
  }

  /**
   * 验证URL，支持 Http Get 请求验证 URL 有效性
   * 
   * @param {string} msg_signature 企业微信加密签名，从接收消息的 URL 中获取的 msg_signature 参数。msg_signature 计算结合了企业填写的 token、请求中的 timestamp、nonce、加密的消息体。
   * @param {string} timestamp 时间戳，从接收消息的 URL 中获取的 timestamp 参数。与 nonce 结合使用，用于防止请求重放攻击。
   * @param {string} nonce 随机串，从接收消息的 URL 中获取的 nonce 参数。与 timestamp 结合使用，用于防止请求重放攻击。
   * @param {string} echostr 加密的字符串，从接收消息的 URL 中获取的 echostr 参数。注意，此参数必须是 urldecode 后的值。
   * 
   * @return {string} 解密后的内容，有 random、msg_len、message、receiveid 四个字段。其中 message 即为消息内容明文用于回包，注意，必须原样返回，不要做加引号或其它处理。
   */
  verifyURL (msg_signature: string, timestamp: string, nonce: string, echostr: string): string {
    // 1 签名校验
    this.verifySignature({
      msg_signature,
      timestamp,
      nonce,
      message: echostr
    })

    // 2 解密数据包，得到明文消息内容
    const res = wecomcrypto.decrypt(this.encodingAesKey, echostr)
    return res
  }

  /**
   * 接收业务数据，支持 Http Post 请求接收业务数据
   * 
   * 检验消息的真实性，并且获取解密后的明文
   * 
   * @param {string} msg_signature 企业微信加密签名，从接收消息的 URL 中获取的 msg_signature 参数。msg_signature 计算结合了企业填写的 token、请求中的 timestamp、nonce、加密的消息体。
   * @param {string} timestamp 时间戳，从接收消息的 URL 中获取的 timestamp 参数。与 nonce 结合使用，用于防止请求重放攻击。
   * @param {string} nonce 随机串，从接收消息的 URL 中获取的 nonce 参数。与 timestamp 结合使用，用于防止请求重放攻击。
   * @param {string} postData 消息结构体加密后的字符串，从接收消息的消息体（如 req.body）中获取的整个 post 数据（text/xml）。
   * 
   * @return {string} 用于返回解密后的 message，参见普通消息格式和事件消息格式（https://work.weixin.qq.com/api/doc/90000/90135/90239）
   */
  decryptMsg (msg_signature: string, timestamp: string, nonce: string, postData: string): object {
    // 解析 XML
    const { Encrypt } = XMLParse.extract(postData)
    
    // 1 签名校验
    this.verifySignature({
      msg_signature,
      timestamp,
      nonce,
      message: Encrypt
    })

    // 2 解密数据包，得到明文消息结构体
    const { message } = wecomcrypto.decrypt(this.encodingAesKey, Encrypt)
		return XMLParse.extract(message)
  }

  /**
   * 加密函数，将企业号回复用户的消息加密打包
	 * 
   * @param {string} replyMsg 返回的消息体原文，不同消息 XML 结构不同（https://work.weixin.qq.com/api/doc/90000/90135/90239）
   * @param {string} timestamp 时间戳，调用方生成，若不传入则随机生成
   * @param {string} nonce 随机串，调用方生成，若不传入则随机生成
   * 
   * @return {string} 加密后的可以直接回复用户的密文，包括msg_signature, timestamp, nonce, encrypt的json格式的字符串
   */
  encryptMsg (replyMsg: string, timestamp: string = Date.now().toString(), nonce: string = `${parseInt(`${(Math.random() * 100000000000)}`, 10)}`): string {
    // 1 加密明文消息结构体
    const msg_encrypt  = wecomcrypto.encrypt(this.encodingAesKey, replyMsg, this.receiveId);

    // 2 生成签名
    const msg_signature = this.genarateSignature({
      message: msg_encrypt,
      timestamp,
      nonce
    })

    // 3 构造被动响应包
    const xmlResult = XMLParse.generate({
      msg_signature,
      encrypt: msg_encrypt,
      timestamp,
      nonce
    })
    return xmlResult
  }
   
  verifySignature ({ msg_signature, timestamp, nonce, message }: VertifySignatureParamModel): string {
    // 1 计算签名
    const dev_msg_signature = this.genarateSignature({ timestamp, nonce, message })

    // 2 比较 dev_msg_signature 和 msg_signature 是否相等，相等则表示验证通过
    if (dev_msg_signature === msg_signature) {
      return dev_msg_signature
    } else {
      throw new CryptoException(CryptoException.ValidateSignatureError).throwException("dev_msg_signature")
    }
  }

  genarateSignature ({ timestamp, nonce, message }: GenarateSignatureParamModel): string {
    try {
      return wecomcrypto.getSignature(this.token, timestamp, nonce, message)
    } catch (e) {
      throw new CryptoException(CryptoException.ComputeSignatureError).throwException()
    }
  }
}

interface GenarateSignatureParamModel {
  timestamp: string;
  nonce: string;
  message : string;
}

interface VertifySignatureParamModel extends GenarateSignatureParamModel {
  msg_signature: string;
}
