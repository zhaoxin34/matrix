// ============================================================
// Types
// ============================================================
export interface EmbeddedSite {
  id: number;
  site_name: string;
  site_url: string;
  description: string;
  status: "enabled" | "disabled";
}

// ============================================================
// Embedded Sites
// ============================================================
export const mockSites: Record<string, EmbeddedSite> = {
  "1": {
    id: 1,
    site_name: "示例电商网站",
    site_url: "https://example-ecommerce.com",
    description: "这是一个示例电商网站，用于测试 Agent 嵌入功能",
    status: "enabled",
  },
  "2": {
    id: 2,
    site_name: "测试网站",
    site_url: "https://test-site.com",
    description: "",
    status: "disabled",
  },
};
