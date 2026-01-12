"""Query Generator Frontend - Reflex App."""

import reflex as rx
import httpx


class State(rx.State):
    """Application state."""
    
    input_text: str = ""
    count: int = 5
    queries: list[str] = []
    loading: bool = False
    error: str = ""
    
    @rx.event
    async def generate(self):
        """Call API to generate queries."""
        if not self.input_text.strip():
            self.error = "Please enter a search query"
            return
        
        self.loading = True
        self.error = ""
        self.queries = []
        yield
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    "http://localhost:8000/generate",
                    json={
                        "input_text": self.input_text,
                        "count": self.count,
                        "debug": False,
                    },
                    timeout=120.0,
                )
                
                if response.status_code == 200:
                    data = response.json()
                    self.queries = data.get("queries", [])
                else:
                    error_detail = response.json().get("detail", "Unknown error")
                    self.error = f"Error: {error_detail}"
                    
        except httpx.TimeoutException:
            self.error = "Request timed out. Please try again."
        except httpx.ConnectError:
            self.error = "Cannot connect to API. Make sure the backend is running on port 8000."
        except Exception as e:
            self.error = f"Error: {str(e)}"
        finally:
            self.loading = False


def query_card(query: str) -> rx.Component:
    """Display a single query in a card."""
    return rx.box(
        rx.hstack(
            rx.text(query, size="2", style={"word_break": "break_all"}),
            rx.spacer(),
            rx.button(
                rx.icon("copy", size=14),
                variant="ghost",
                size="1",
                on_click=rx.set_clipboard(query),
                title="Copy to clipboard",
            ),
            width="100%",
            align="center",
        ),
        padding="12px",
        border_radius="8px",
        background="var(--gray-2)",
        width="100%",
    )


def index() -> rx.Component:
    """Main page."""
    return rx.box(
        rx.vstack(
            # Header
            rx.heading("Query Generator", size="7", margin_bottom="4px"),
            rx.text(
                "Generate LinkedIn search queries from natural language",
                color="gray",
                size="3",
                margin_bottom="24px",
            ),
            
            # Input Section
            rx.box(
                rx.vstack(
                    rx.text("Search Input", weight="medium", size="2"),
                    rx.input(
                        placeholder="e.g., CEO Jakarta fintech",
                        value=State.input_text,
                        on_change=State.set_input_text,
                        width="100%",
                        size="3",
                    ),
                    rx.hstack(
                        rx.vstack(
                            rx.text(f"Count: {State.count}", size="2"),
                            rx.slider(
                                value=[State.count],
                                min=1,
                                max=30,
                                step=1,
                                on_change=lambda v: State.set_count(v[0]),
                                width="200px",
                            ),
                            align="start",
                        ),
                        rx.spacer(),
                        rx.button(
                            rx.cond(
                                State.loading,
                                rx.hstack(
                                    rx.spinner(size="1"),
                                    rx.text("Generating..."),
                                    spacing="2",
                                ),
                                rx.text("Generate"),
                            ),
                            on_click=State.generate,
                            disabled=State.loading,
                            size="3",
                        ),
                        width="100%",
                        align="center",
                    ),
                    spacing="3",
                    width="100%",
                ),
                padding="20px",
                border_radius="12px",
                background="var(--gray-1)",
                border="1px solid var(--gray-4)",
                width="100%",
            ),
            
            # Error Message
            rx.cond(
                State.error != "",
                rx.callout(
                    State.error,
                    icon="alert-circle",
                    color="red",
                    width="100%",
                ),
            ),
            
            # Results Section
            rx.cond(
                State.queries.length() > 0,
                rx.box(
                    rx.vstack(
                        rx.hstack(
                            rx.text("Generated Queries", weight="medium", size="2"),
                            rx.badge(State.queries.length(), variant="soft"),
                            align="center",
                        ),
                        rx.foreach(State.queries, query_card),
                        spacing="3",
                        width="100%",
                    ),
                    padding="20px",
                    border_radius="12px",
                    background="var(--gray-1)",
                    border="1px solid var(--gray-4)",
                    width="100%",
                ),
            ),
            
            spacing="4",
            width="100%",
            max_width="700px",
            margin="0 auto",
            padding="40px 20px",
        ),
        min_height="100vh",
        background="var(--gray-1)",
    )


app = rx.App(
    theme=rx.theme(
        appearance="dark",
        accent_color="blue",
        radius="medium",
    ),
)
app.add_page(index, title="Query Generator")
