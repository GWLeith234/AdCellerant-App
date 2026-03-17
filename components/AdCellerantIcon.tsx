export function AdCellerantIcon({
  size = 36
}: {
  size?: number
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ flexShrink: 0 }}
    >
      <path
        d="M50 4 C50 4, 14 22, 10 58 C6 88, 22 112,
           50 118 C78 112, 94 88, 90 58
           C86 22, 50 4, 50 4Z"
        fill="#FF4A2D"
      />
      <path
        d="M50 30 C35 40, 24 56, 24 70 C24 84, 32 95,
           40 100 L50 105 L60 100 C68 95, 76 84, 76 70
           C76 56, 65 40, 50 30Z"
        fill="#0B1624"
      />
      <ellipse
        cx="50"
        cy="88"
        rx="14"
        ry="18"
        fill="#FFFFFF"
      />
    </svg>
  )
}
