from fastmcp import FastMCP

mcp = FastMCP("Demo Server")


@mcp.tool
def get_weather(city: str) -> str:
    """Get the current weather for a city."""
    return f"The weather in {city} is sunny, 22°C with light winds."


if __name__ == "__main__":
    mcp.run(transport="http", host="0.0.0.0", port=8000)
