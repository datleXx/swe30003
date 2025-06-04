import * as React from "react";

export function TypographyH1({
  children,
  className = "",
}: React.PropsWithChildren<{ className?: string }>) {
  return (
    <h1
      className={`scroll-m-20 text-center text-4xl font-extrabold tracking-tight text-balance ${className}`}
    >
      {children}
    </h1>
  );
}

export function TypographyP({
  children,
  className = "",
}: React.PropsWithChildren<{ className?: string }>) {
  return (
    <p className={`leading-7 [&:not(:first-child)]:mt-6 ${className}`}>
      {children}
    </p>
  );
}
