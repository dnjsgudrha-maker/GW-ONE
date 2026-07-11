import { useEffect, useState } from "react";

export default function NetworkBanner() {
  const [online, setOnline] = useState(navigator.onLine);

  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  if (online) return null;
  return <div className="network-banner">인터넷 연결이 끊겼습니다. 연결 후 다시 저장해 주세요.</div>;
}
