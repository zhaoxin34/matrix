import React from "react";
import OriginalDocItem from "@theme-original/DocItem";

export default function DocItem(props) {
  const { frontMatter } = props.content?.metadata || {};
  const { author, created, updated, version } = frontMatter || {};

  // Format dates if they exist
  const formatDate = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  return (
    <>
      {author && (
        <div
          style={{
            marginBottom: "1.5rem",
            padding: "0.75rem 1rem",
            backgroundColor: "var(--ifm-color-emphasis-100)",
            borderRadius: "8px",
            fontSize: "0.875rem",
            color: "var(--ifm-color-content)",
          }}
        >
          <span style={{ color: "var(--ifm-color-content-secondary)" }}>
            📝 <strong>作者：</strong>
            {author} &nbsp;&nbsp;|&nbsp;&nbsp;
            {created && <span>📅 创建：{formatDate(created)}</span>}
            {updated && (
              <span> &nbsp;&nbsp;|&nbsp;&nbsp; 🔄 更新：{formatDate(updated)}</span>
            )}
            {version && <span> &nbsp;&nbsp;|&nbsp;&nbsp; 🏷️ 版本：{version}</span>}
          </span>
        </div>
      )}
      <OriginalDocItem {...props} />
    </>
  );
}
