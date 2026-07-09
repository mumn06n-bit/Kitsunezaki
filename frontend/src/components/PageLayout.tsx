import "./PageLayout.css";

import Header from "./Header";

type PageLayoutProps = {
  title: string;
  children: React.ReactNode;
};

//ヘッダーとページ内容のセットを共通化
export default function PageLayout({
  title,
  children,
}: PageLayoutProps) {
  return (
    <div className="page">

      <Header title={title} />

      <main className="page-content">
        {children}
      </main>

    </div>
  );
}