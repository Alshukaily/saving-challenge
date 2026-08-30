import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("React Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', textAlign: 'center', color: '#f8fafc', background: '#090d16', minHeight: '100vh' }}>
          <h2 style={{ color: '#ef4444' }}>حدث خطأ في تحميل التطبيق</h2>
          <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '10px' }}>{this.state.error?.toString()}</p>
          <button
            onClick={() => window.location.reload()}
            style={{ marginTop: '20px', padding: '10px 20px', background: '#10b981', color: '#000', border: 'none', borderRadius: '8px', fontWeight: 'bold' }}
          >
            إعادة تحميل الصفحة 🔄
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
