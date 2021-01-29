"use strict";
const stream = require("stream");
const Busboy = require("busboy");

/** 处理用户上传 （POST） */
const handlePost = (event) => {
  return new Promise((resolve, reject) => {
    const busboy = new Busboy({ headers: event.headers });
    let html = "";
    /** 接受到文件 */
    busboy.on("file", (fieldname, file, filename, encoding, mimetype) => {
      let buf = Buffer.alloc(0);
      console.log({ fieldname });
      /** 接受到文件的数据块，拼接出完整的 buffer */
      file.on("data", function (data) {
        buf = Buffer.concat([buf, data]);
      });
      /** 文件的数据块接受完毕，生成 DOM 字符串 */
      file.on("end", function () {
        const imgBase64 = buf.toString("base64");
        html += `<img src="data:${mimetype};base64, ${imgBase64}" />`;
      });
    });
    /** multipart formdata 接受完毕，构造并返回生成的 html */
    busboy.on("finish", function () {
      console.log({ msg: "Parse form complete!", html });
      resolve({
        statusCode: 200,
        headers: {
          "content-type": "text/html",
        },
        body: html,
      });
    });

    /**
     * busboy 需要 stream pipe 的方式来进行处理，
     * 我们将 body 解码为 buffer后，
     * 转换为 stream，最终 pipe 给 busbody
     */
    const bodyBuf = Buffer.from(event.body, "base64");
    var bufferStream = new stream.PassThrough();
    bufferStream.end(bodyBuf);
    bufferStream.pipe(busboy);
  });
};

/** 返回静态文件 */
const handleGet = (event) => {
  const html = `<html><head></head><body>
    <form method="POST" enctype="multipart/form-data">
    <input type="file" name="image-1" accept="image/*"><br />
     <input type="file" name="image-2" accept="image/*"><br />
     <input type="submit">
    </form>
    </body></html>`;
  console.log({ msg: "Get form complete!", html });
  return {
    statusCode: 200,
    headers: {
      "content-type": "text/html",
    },
    body: html,
  };
};

/** 云函数入口函数 */
exports.main_handler = async (event, context) => {
  const method = event.httpMethod;
  /** 当请求为 POST 请求时，我们处理用户的 multipart formdata，并生成展示上传结果的页面 */
  if (method === "POST") {
    return handlePost(event);
  }
  /** 当请求为 GET 请求时，我们返回上传文件的页面 */
  if (method === "GET") {
    return handleGet(event);
  }
};
