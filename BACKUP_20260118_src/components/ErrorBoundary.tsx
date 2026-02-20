import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
    public override state: State = {
        hasError: false,
        error: null,
        errorInfo: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error, errorInfo: null };
    }

    public override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
        this.setState({ errorInfo });
    }

    public override render() {
        if (this.state.hasError) {
            return (
                <div style={{ padding: '20px', backgroundColor: '#f8d7da', color: '#721c24', height: '100vh', overflow: 'auto' }}>
                    <h1>Something went wrong.</h1>
                    <p>Please report this error to the developer.</p>
                    <details style={{ whiteSpace: 'pre-wrap', marginTop: '10px', padding: '10px', backgroundColor: '#fff', border: '1px solid #f5c6cb' }}>
                        <summary>Error Details</summary>
                        {this.state.error && this.state.error.toString()}
                        <br />
                        <br />
                        {this.state.errorInfo && this.state.errorInfo.componentStack}
                    </details>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
