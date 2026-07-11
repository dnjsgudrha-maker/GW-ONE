import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, message: "" };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, message: error?.message || "알 수 없는 오류" };
  }

  componentDidCatch(error, info) {
    console.error("GW ONE 화면 오류", error, info);
  }

  reset = async () => {
    try {
      if ("serviceWorker" in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map((item) => item.unregister()));
      }
      if ("caches" in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((key) => caches.delete(key)));
      }
    } finally {
      window.location.reload();
    }
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <main className="fatal-error-page">
        <section className="fatal-error-card">
          <div className="brand-mark">GW</div>
          <h1>화면을 다시 불러오면 됩니다</h1>
          <p>작업내용은 Firebase에 저장되어 있으니 걱정하지 마세요.</p>
          <small>{this.state.message}</small>
          <button onClick={this.reset}>오류 정리 후 다시 열기</button>
        </section>
      </main>
    );
  }
}
