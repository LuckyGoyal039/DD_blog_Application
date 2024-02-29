const multer = require("multer");
const path = require("path");
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // check why it is not working
    // cb(null, path.join(__dirname, "backend", "uploads"));
    cb(null, "./uploads");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = `${file.fieldname}_${Date.now()}_${path.extname(
      file.originalname
    )}`;
    cb(null, uniqueSuffix);
  },
});
const upload = multer({ storage });

module.exports = upload;
