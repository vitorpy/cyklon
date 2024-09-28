import { ReactNode } from "react";

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
    <div className="hero py-[64px]">
      <div className="hero-content text-center">
        <div className="max-w-2xl">
          {typeof title === 'string' ? (
            <h1 className={`text-5xl font-base ${textColor}`}>{title}</h1>
          ) : (
            title
          )}
          {typeof subtitle === 'string' ? (
            <p className={`py-6 font-light ${textColor}`}>{subtitle}</p>
          ) : (
            subtitle
          )}
          {children}
        </div>
      </div>
    </div>
  );
}