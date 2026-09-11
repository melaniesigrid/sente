import { Component } from "react";
import { CircleAlert, LayoutDashboard } from "lucide-react";
import { Card, Btn } from "./ui.jsx";

/* ----------------------- ERROR BOUNDARY -----------------------
   A class because React only exposes error boundaries that way. Wraps
   each view; the shell keys it by view so navigating away resets it.

   A class cannot call a hook, so the reader arrives as a prop: the shell has
   already resolved the language for its own chrome and hands the same `t` down.
   The crash message is the last thing a player reads before leaving, which is
   the worst possible place to drop back into English. */
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
    const t = this.props.t || ((key) => key);
    return (
      <div className="stack">
        <Card className="error-card" role="alert">
          <div className="stat-head"><CircleAlert size={17} /><span>{t("error.title")}</span></div>
          <p className="lesson-text">{t("error.body")}</p>
          <p className="fine error-detail">{message}</p>
          <div className="row">
            <Btn icon={LayoutDashboard} primary onClick={() => { this.setState({ error: null }); this.props.onHome?.(); }}>
              {t("error.home")}
            </Btn>
          </div>
        </Card>
      </div>
    );
  }
}
