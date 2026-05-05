import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    console.error('Frontend render error:', error);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="bg-surface-container border-4 border-ink p-8 neo-shadow max-w-3xl mx-auto">
        <h1 className="text-4xl font-serif font-black mb-4 uppercase">Something broke on this page.</h1>
        <p className="font-mono text-lg mb-6">
          CineSocial is still running, but this view hit an unexpected frontend error.
        </p>
        <button
          type="button"
          className="neo-btn px-8 py-3 text-xl"
          onClick={() => this.setState({ hasError: false })}
        >
          TRY AGAIN
        </button>
      </div>
    );
  }
}
