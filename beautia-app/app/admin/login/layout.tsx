// 로그인 페이지는 어드민 레이아웃에서 제외
export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
