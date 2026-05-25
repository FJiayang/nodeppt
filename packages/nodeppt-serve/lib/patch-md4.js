/**
 * Node 17+/OpenSSL 3 兼容补丁：把 createHash('md4') 全局改写为 sha256。
 *
 * 仅 output.hashFunction 不够 —— webpack 4 的子编译 + loader-utils.getHashDigest
 * 等下游链路仍直接调用 createHash('md4')，在 OpenSSL 3 下抛 ERR_OSSL_EVP_UNSUPPORTED。
 * 本进程级 shim 拦下所有 md4 调用，重定向到 sha256，保证 dev/build 全链路可用。
 */
const crypto = require('crypto');

if (!crypto.__nodepptMd4Patched) {
    const origCreateHash = crypto.createHash;
    crypto.createHash = function patchedCreateHash(algorithm, options) {
        return origCreateHash.call(this, algorithm === 'md4' ? 'sha256' : algorithm, options);
    };
    crypto.__nodepptMd4Patched = true;
}
