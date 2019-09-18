
// IE下不兼容
const convertToBlob = (urlData, type) => {
    const binStr = atob(urlData.split(',')[1]);
    const len = binStr.length;
    const arr = new Uint8Array(len);

    for (let i = 0; i < len; i++) {
        arr[i] = binStr.charCodeAt(i);
    }

    return new Blob([arr], {type: type || 'image/png'});
};

const compress = (fileObj, callback) => {
    try {
        const image = new Image();
        image.src = URL.createObjectURL(fileObj);
        console.log('fileObj', fileObj);
        image.onload = function() {
            let width = this.width;
            let height = this.height;
            let quality = 0.7; // 默认0.7
            const scale = width / height;
            width = fileObj.width || width;
            height = fileObj.height || (width / scale);

            // 创建canvas
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            // 设置画布尺寸
            canvas.width = width;
            canvas.height = height;
            // 清除画布
            context.clearRect(0, 0, width, height);
            // 画图像
            context.drawImage(image, 0, 0, width, height);
            // 图像质量
            if (fileObj.quality && fileObj.quality <= 1 && fileObj.quality > 0) {
                quality = fileObj.quality;
            }
            // quality值越小，所绘制出的图像越模糊
            const data = canvas.toDataURL('image/jpeg', quality);
            // 压缩完成执行回调
            const newFile = convertToBlob(data);
            callback(newFile);
        };
    } catch (err) {
        console.error(err.message);
    }
};

export default compress;




// 使用方法
/*
 compressImg(options.file, (blob) => {
        // 将blob文件转换为file文件
        const newFile = new window.File([blob], options.file.name, { type: options.file.type })
	// httpUploadFile 是调用api上传图片
        this.httpUploadFile(newFile)
          .then(res => {
            this.$message.success('上传成功')
            this.postForm.pracBgImgName = res.result.imgName
            this.postForm.pracBgImgUrl = res.result.imgUrl
            this.uploadFileName = res.result.fileName || ''
            this.isUpload = true
            this.uploading = false
            // 清除上传图片错误
            this.uploadImgError = false
          })
          .catch(() => {
            this.uploading = false
          })
      })

*/

