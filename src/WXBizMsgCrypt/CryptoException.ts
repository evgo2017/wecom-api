export class CryptoException {
  // 全局错误码
  static OK: number = 0;
	static ValidateSignatureError: number = -40001;
	static ParseXMLError: number = -40002;
	static ParseJsonError: number = -40003;
	static ComputeSignatureError: number = -40004;
	static IllegalAesKey: number = -40005;
	static ValidateCorpidError: number = -40006;
	static EncryptAESError: number = -40007;
	static DecryptAESError: number = -40008;
	static IllegalBuffer: number = -40009;
	static EncodeBase64Error: number = -400010;
	static DecodeBase64Error: number = -40011;
	static GenReturnXMLError: number = -40012;
	static GenReturnJsonError: number = -40013;

	private code: number;

  constructor (code: number) {
    this.code = code;
  }

  getCode (): number {
    return this.code;
  }

  getMessage (): string {
    switch (this.code) {
      case CryptoException.ValidateSignatureError:
        return "签名验证错误";
      case CryptoException.ParseXMLError:
        return "xml解析失败";
      case CryptoException.ParseJsonError:
        return "json解析失败";
      case CryptoException.ComputeSignatureError:
        return "sha加密生成签名失败";
      case CryptoException.IllegalAesKey:
        return "SymmetricKey非法";
      case CryptoException.ValidateCorpidError:
        return "corpid校验失败";
      case CryptoException.EncryptAESError:
        return "aes加密失败";
      case CryptoException.DecryptAESError:
        return "aes解密失败";
      case CryptoException.IllegalBuffer:
        return "解密后得到的buffer非法";
      case CryptoException.EncodeBase64Error:
        return "base64加密错误";
      case CryptoException.DecodeBase64Error:
        return "base64解密错误";
      case CryptoException.GenReturnXMLError:
        return "xml生成失败";
      case CryptoException.GenReturnJsonError:
        return "json生成失败";
      default:
        return "";
    }
  }

  throwException (data: any = "") {
    throw new returnParam(this.code, data)
  }
}

class returnParam {
  code: number;
  codeText: string;
  data: any;

  constructor (code: number, data: any) {
    this.code = code
    this.codeText = new CryptoException(code).getMessage(),
    this.data = data
  }
}