import { ReactNode } from 'react';

export function Header({
  children,
  title,
  subtitle = null,
  isWhite = false,
}: {
  children?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  isWhite?: boolean;
}) {
  const textColor = isWhite ? 'text-white' : 'text-black';

  return (
    <div className="py-[64px]">
      <div className="text-center">
        <div className="max-w-4xl">
          {typeof title === 'string' ? (
            <h1 className={`text-7xl font-base ${textColor}`}>{title}</h1>
          ) : (
            title
          )}
          {typeof subtitle === 'string' ? (
            <p className={`py-6 ${textColor}`}>{subtitle}</p>
          ) : (
            subtitle
          )}
          {children}
        </div>
      </div>
    </div>
  );
}
