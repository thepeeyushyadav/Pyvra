"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

const FALLBACK = "/assets/pyvra-logo.svg";

type Props = {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  fill?: boolean;
  className?: string;
};

const LogoImage = ({ src, alt, width, height, fill, className }: Props) => {
  const [imgSrc, setImgSrc] = useState(src || FALLBACK);

  useEffect(() => {
    setImgSrc(src || FALLBACK);
  }, [src]);

  const props = fill
    ? { fill: true as const }
    : { width: width ?? 56, height: height ?? 56 };

  return (
    <Image
      src={imgSrc}
      alt={alt}
      {...props}
      unoptimized
      className={className}
      onError={() => setImgSrc(FALLBACK)}
    />
  );
};

export default LogoImage;
