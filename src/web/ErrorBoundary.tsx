import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
	children: ReactNode;
}

interface State {
	error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
	state: State = { error: null };

	static getDerivedStateFromError(error: Error): State {
		return { error };
	}

	componentDidCatch(error: Error, info: ErrorInfo) {
		console.error("Dewordify error:", error, info);
	}

	render() {
		if (this.state.error) {
			return (
				<section>
					<h2>Something went wrong</h2>
					<p>{this.state.error.message}</p>
					<button onClick={() => this.setState({ error: null })}>
						Try again
					</button>
				</section>
			);
		}

		return this.props.children;
	}
}
