import logoDark from "@assets/image_1765400105626.png";
import logoLight from "@assets/image_1765400132857.png";

interface BlueAllyLogoProps {
  className?: string;
  variant?: "full" | "icon";
}

export function BlueAllyLogo({ className = "", variant = "full" }: BlueAllyLogoProps) {
  const baseClasses = variant === "icon" ? "h-6" : "h-8";

  return (
    <>
      <img
        src={logoDark}
        alt="BlueAlly"
        className={`${baseClasses} object-contain dark:hidden ${className}`}
      />
      <img
        src={logoLight}
        alt="BlueAlly"
        className={`${baseClasses} object-contain hidden dark:block ${className}`}
      />
    </>
  );
}
