import { Component, type ReactNode } from 'react';

interface State { error: Error | null; }

export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: { componentStack?: string }) {
    console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ minHeight: '100vh', background: '#08090a', color: '#e9efe9', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: "'Figtree', sans-serif" }}>
          <div style={{ maxWidth: 600, textAlign: 'center' }}>
            <div style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 800, fontSize: 28, color: '#f87171', marginBottom: 12 }}>Oups, ça a planté</div>
            <pre style={{ background: '#14181a', padding: 16, borderRadius: 12, color: '#c8d0c8', fontSize: 12, overflow: 'auto', textAlign: 'left', marginBottom: 20 }}>{this.state.error.message}{'\n\n'}{this.state.error.stack}</pre>
            <button onClick={() => { localStorage.clear(); window.location.href = '/'; }} style={{ padding: '12px 24px', borderRadius: 12, border: 'none', background: '#1ed760', color: '#052a16', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Reset et retour à la connexion</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
