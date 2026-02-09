import { useState, useEffect } from "react";

const OWNER_TOKEN_KEY = "cognitive-zb-owner-token";

function generateToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function useOwnerToken() {
  const [ownerToken, setOwnerToken] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(OWNER_TOKEN_KEY);
      if (stored) return stored;
      const newToken = generateToken();
      localStorage.setItem(OWNER_TOKEN_KEY, newToken);
      return newToken;
    }
    return generateToken();
  });

  useEffect(() => {
    if (!localStorage.getItem(OWNER_TOKEN_KEY)) {
      const newToken = generateToken();
      localStorage.setItem(OWNER_TOKEN_KEY, newToken);
      setOwnerToken(newToken);
    }
  }, []);

  const resetToken = () => {
    const newToken = generateToken();
    localStorage.setItem(OWNER_TOKEN_KEY, newToken);
    setOwnerToken(newToken);
  };

  return {
    ownerToken,
    resetToken,
  };
}
