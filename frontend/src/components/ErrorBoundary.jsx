import { Component } from 'react';
import { Link } from 'react-router-dom';

export class ErrorBoundary extends Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="mgmt mgmt--error" style={{ padding: '2rem', maxWidth: '480px' }}>
          <h2 className="mgmt__panel-title">Something went wrong</h2>
          <p className="mgmt__panel-desc">
            The Management Console could not load. Try refreshing the page or going back to the dashboard.
          </p>
          {this.state.error?.message && (
            <p style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '1rem' }}>
              {this.state.error.message}
            </p>
          )}
          <Link to="/dashboard" style={{ color: '#003661', fontWeight: 600 }}>
            Back to Dashboard
          </Link>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
