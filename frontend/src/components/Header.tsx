import "./Header.css";

type HeaderProps = {
  title: string;
};

//ヘッダーのみ定義=>PageLayout.tsxで呼び出し
export default function Header({ title }: HeaderProps) {
  return (
    <header className="header">
      <h1>{title}</h1>
    </header>
  );
}