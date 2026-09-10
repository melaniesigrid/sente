import { Component } from "react";
import { CircleAlert, LayoutDashboard } from "lucide-react";
import { Card, Btn } from "./ui.jsx";

/* ----------------------- ERROR BOUNDARY -----------------------
   A class because React only exposes error boundaries that way. Wraps
   each view; the shell keys it by view so navigating away resets it. */
export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("sente: view crashed", error, info?.componentStack);
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;
    const message = (error && error.message) || String(error);
    return (
      <div className="stack">
        <Card className="error-card" role="alert">
          <div className="stat-head"><CircleAlert size={17} /><span>Something slipped</span></div>
          <p className="lesson-text">This part of Joseki hit an error it could not recover from. Your profile and any saved game are untouched.</p>
          <p className="fine error-detail">{message}</p>
          <div className="row">
            <Btn icon={LayoutDashboard} primary onClick={() => { this.setState({ error: null }); this.props.onHome?.(); }}>
              Back to home
            </Btn>
          </div>
        </Card>
      </div>
    );
  }
}
