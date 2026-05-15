import { themes as prismThemes } from "prism-react-renderer";
import type { Config } from "@docusaurus/types";
import type * as Preset from "@docusaurus/preset-classic";

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const config: Config = {
  title: "Neo 设计文档",
  tagline: "Dinosaurs are cool",
  favicon: "img/favicon.ico",

  // Future flags, see https://docusaurus.io/docs/api/docusaurus-config#future
  future: {
    v4: true, // Improve compatibility with the upcoming Docusaurus v4
  },

  // Set the production url of your site here
  url: "https://your-docusaurus-site.example.com",
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: "/",

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: "facebook", // Usually your GitHub org/user name.
  projectName: "docusaurus", // Usually your repo name.

  onBrokenLinks: "throw",

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: "en",
    locales: ["en"],
  },

  markdown: {
    mermaid: true,
  },

  presets: [
    [
      "classic",
      {
        docs: {
          sidebarPath: "./sidebars.ts",
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          // editUrl:
          //   'https://github.com/facebook/docusaurus/tree/main/packages/create-docusaurus/templates/shared/',
        },
        blog: {
          showReadingTime: true,
          feedOptions: {
            type: ["rss", "atom"],
            xslt: true,
          },
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          editUrl:
            "https://github.com/facebook/docusaurus/tree/main/packages/create-docusaurus/templates/shared/",
          // Useful options to enforce blogging best practices
          onInlineTags: "warn",
          onInlineAuthors: "warn",
          onUntruncatedBlogPosts: "warn",
        },
        theme: {
          customCss: "./src/css/custom.css",
        },
      } satisfies Preset.Options,
    ],
  ],

  themes: ["@docusaurus/theme-mermaid"],

  themeConfig: {
    // Replace with your project's social card
    image: "img/docusaurus-social-card.jpg",
    colorMode: {
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: "Neo 设计文档",
      logo: {
        alt: "Neo 设计文档 Logo",
        src: "img/logo.svg",
      },
      items: [
        {
          type: "docSidebar",
          sidebarId: "product",
          position: "left",
          label: "产品文档",
        },
        {
          type: "docSidebar",
          sidebarId: "ui-design",
          position: "left",
          label: "UI设计",
        },
        {
          type: "docSidebar",
          sidebarId: "technical",
          position: "left",
          label: "技术文档",
        },
        {
          type: "docSidebar",
          sidebarId: "e2e",
          position: "left",
          label: "E2E测试用例",
        },
        {
          href: "https://github.com/facebook/docusaurus",
          label: "GitHub",
          position: "right",
        },
      ],
    },
    footer: {
      style: "dark",
      copyright: `Copyright © ${new Date().getFullYear()} My Project, Inc. Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
    mermaid: {
      theme: { light: "neutral", dark: "catppuccin-mocha" },
      options: {
        themeVariables: {
          // 线条颜色
          lineColor: "#6e40c9",
          lineStyle: "solid",
          lineThickness: "2px",

          // 节点颜色
          primaryColor: "#6e40c9",
          primaryBorderColor: "#8b5cf6",
          primaryTextColor: "#ffffff",

          // 节点背景色
          secondaryColor: "#102B27",
          tertiaryColor: "#faf5ff",

          // 边框和箭头
          border1: "#8b5cf6",
          border2: "#a78bfa",

          // 边的颜色
          edgeLabelBackground: "#ffffff",

          // 文字颜色
          textColor: "#374151",
          mainBkg: "#ede9fe",
          nodeBorder: "#8b5cf6",

          // 集群颜色
          clusterBkg: "#f3e8ff",
          clusterBorder: "#8b5cf6",

          // 注释
          noteBkgColor: "#fef3c7",
          noteTextColor: "#92400e",
          noteBorderColor: "#d97706",

          // 状态颜色
          fillType0: "#6e40c9",
          fillType1: "#7c3aed",
          fillType2: "#8b5cf6",

          // Sequence Diagram 特定变量
          // 参与者
          actorBackground: "#ede9fe",
          actorBorder: "#8b5cf6",
          actorTextColor: "#374151",
          actorLineColor: "#8b5cf6",

          // 信号/消息
          signalColor: "#6e40c9",
          signalTextColor: "#f3e8ff",

          // 激活框
          activationBorderColor: "#8b5cf6",
          activationBkgColor: "#f3e8ff",

          // 循环
          loopTextColor: "#f3e8ff",

          // 序列号
          sequenceNumberColor: "#ffffff",
          sequenceNumberBorderColor: "#6e40c9",
        },
      },
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
