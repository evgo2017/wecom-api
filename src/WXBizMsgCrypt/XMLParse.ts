const fxp = require('fast-xml-parser')
import { CryptoException } from './CryptoException'

export class XMLParse {
  /**
	 * 提取出 xml 数据包中的加密消息
   * 
	 * @param xmlText 待提取的xml字符串
   * 
	 * @return 提取出的加密消息字符串
	 */
  static extract (xmlText: string = "") {
    if (!fxp.validate(xmlText)) { 
      throw new CryptoException(CryptoException.ParseXMLError).throwException()
    }
    return fxp.parse(xmlText).xml
  }

  /**
	 * 生成xml消息
   * 
	 * @param encrypt 加密后的消息密文
	 * @param msg_signature 安全签名
	 * @param timestamp 时间戳
	 * @param nonce 随机字符串
   * 
	 * @return 生成的xml字符串
	 */
  static generate ({ encrypt, msg_signature, timestamp, nonce }: generateParamModel): string {
    const result = {
      xml: {
        Encrypt: {
          _cdata: encrypt,
        },
        MsgSignature: {
          _cdata: msg_signature,
        },
        TimeStamp: timestamp,
        Nonce: {
          _cdata: nonce
        }     
      }
    }
    const xmlParser = new fxp.j2xParser({
      cdataTagName: "_cdata",
    });
    const xmlResult = xmlParser.parse(result);
    return xmlResult
  }
}

interface generateParamModel {
  encrypt: string;
  msg_signature: string;
  timestamp: string;
  nonce: string
}
