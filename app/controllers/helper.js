const crypto = require("crypto");

const iv = Buffer.from("0123456789abcdef0123456789abcdef", "hex");
const key = Buffer.from(
  "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
  "hex"
);
const algorithm = "aes-256-cbc";
// encryption
function encrypt(text) {
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return encrypted;
}
// decryption
function decrypt(encryptedText) {
  try {
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    let decrypted = decipher.update(encryptedText, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch (error) {
    console.log(error);
    return "error";
  }
}

module.exports = { decrypt, encrypt };
