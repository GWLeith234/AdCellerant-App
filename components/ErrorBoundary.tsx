"use client";

import { Component } from "react";

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: string;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: "" };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error: error.message };
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="min-h-screen bg-[#0D1B2E] flex items-center justify-center">
            <div className="bg-[#1C2F4A] border border-[#2A3F5C] rounded-xl p-10 max-w-md w-full text-center">
              <h1 className="text-xl font-bold text-[#F0F4F8] mb-2">Something went wrong</h1>
              <p className="text-[#6B7F96] text-sm mb-4">{this.state.error}</p>
              <button
                onClick={() => window.location.reload()}
                className="bg-[#4FA3D1] text-white px-4 py-2 rounded-lg text-sm"
              >
                Reload
              </button>
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
