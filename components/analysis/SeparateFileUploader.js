// components/SeparateFileUploader.js

import React, { useCallback } from "react";

const SeparateFileUploader = ({
  uploadedFile,
  onFileUpload,
  fileUploadLoading,
  setFileUploadLoading,
  acceptedTypes = ".csv,.tsv,.txt",
  helpText = "拖拽文件到此处或点击选择文件",
  required = false,
}) => {
  // 处理文件上传
  const handleFileUpload = useCallback(
    async (files) => {
      if (files.length === 0) return;

      setFileUploadLoading(true);

      // 只允许上传一个文件
      if (files.length > 1) {
        alert("每次只能上传一个文件");
        setFileUploadLoading(false);
        return;
      }

      const file = files[0];

      // 验证文件类型
      const acceptedExtensions = acceptedTypes
        .split(",")
        .map((type) => type.trim());
      const extension = "." + file.name.split(".").pop().toLowerCase();

      if (!acceptedExtensions.includes(extension)) {
        alert(`不支持的文件类型: ${file.name}\n支持的格式: ${acceptedTypes}`);
        setFileUploadLoading(false);
        return;
      }

      // 模拟验证延迟
      setTimeout(() => {
        onFileUpload(file);
        setFileUploadLoading(false);
      }, 300);
    },
    [acceptedTypes, onFileUpload, setFileUploadLoading]
  );

  // 拖拽事件处理
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const files = e.dataTransfer.files;
    handleFileUpload(files);
  };

  // 文件选择事件处理
  const handleFileSelect = (e) => {
    const files = e.target.files;
    handleFileUpload(files);
  };

  // 移除文件
  const handleRemoveFile = () => {
    onFileUpload(null);
  };

  return (
    <div>
      {/* 文件上传区域 */}
      <div
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        style={{
          position: "relative",
          border: uploadedFile
            ? "2px solid #4CAF50"
            : required
            ? "2px dashed #ff9800"
            : "2px dashed #ddd",
          borderRadius: "8px",
          padding: uploadedFile ? "15px" : "20px",
          textAlign: "center",
          backgroundColor: fileUploadLoading
            ? "#f5f5f5"
            : uploadedFile
            ? "#f8fff8"
            : "#fafafa",
          cursor: fileUploadLoading ? "not-allowed" : "pointer",
          transition: "all 0.3s ease",
          minHeight: uploadedFile ? "80px" : "100px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        {fileUploadLoading ? (
          <div>
            <div style={{ fontSize: "18px", marginBottom: "8px" }}>⏳</div>
            <div style={{ fontSize: "14px" }}>正在验证文件...</div>
          </div>
        ) : uploadedFile ? (
          <div style={{ width: "100%" }}>
            <div
              style={{
                fontSize: "18px",
                marginBottom: "8px",
                color: "#4CAF50",
              }}
            >
              ✅
            </div>
            <div
              style={{
                fontWeight: "bold",
                marginBottom: "4px",
                fontSize: "14px",
              }}
            >
              {uploadedFile.name}
            </div>
            <div style={{ fontSize: "12px", color: "#666" }}>
              {(uploadedFile.size / 1024).toFixed(1)} KB
            </div>
          </div>
        ) : (
          <div>
            <div
              style={{
                fontSize: "20px",
                marginBottom: "8px",
                color: required ? "#ff9800" : "#666",
              }}
            >
              {required ? "📋" : "📄"}
            </div>
            <div
              style={{
                fontSize: "13px",
                marginBottom: "8px",
                color: required ? "#ff9800" : "#333",
              }}
            >
              {helpText}
            </div>
            {required && (
              <div
                style={{
                  fontSize: "11px",
                  color: "#ff9800",
                  fontWeight: "bold",
                }}
              >
                * 必需文件
              </div>
            )}
          </div>
        )}

        {/* 隐藏的文件输入 */}
        <input
          type="file"
          onChange={handleFileSelect}
          accept={acceptedTypes}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            opacity: 0,
            cursor: fileUploadLoading ? "not-allowed" : "pointer",
          }}
          disabled={fileUploadLoading}
        />
      </div>

      {/* 移除文件按钮 - 放在上传区域外面 */}
      {uploadedFile && (
        <div style={{ marginTop: "10px", textAlign: "center" }}>
          <button
            onClick={handleRemoveFile}
            style={{
              backgroundColor: "#f44336",
              color: "white",
              border: "none",
              padding: "6px 12px",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "12px",
              fontWeight: "bold",
            }}
          >
            🗑️ 移除文件
          </button>
        </div>
      )}

      {/* 支持的文件格式提示 */}
      <div
        style={{
          marginTop: "8px",
          fontSize: "12px",
          color: "#666",
          textAlign: "center",
        }}
      >
        支持格式: {acceptedTypes}
      </div>
    </div>
  );
};

export default SeparateFileUploader;
