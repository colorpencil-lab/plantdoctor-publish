import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PlantDoctor — identify & diagnose plants · 植物识别与诊断",
  description:
    "Upload or snap a photo of a plant or leaf for an AI identification, health diagnosis, and treatment plan. 上传或拍摄植物照片，获得 AI 识别、健康诊断与处理方案。",
};

export const viewport: Viewport = {
  themeColor: "#166534",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
