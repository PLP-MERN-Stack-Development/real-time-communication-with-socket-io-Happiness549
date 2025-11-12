import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Chat from "../../Chat";

describe("Chat Component", () => {
  const mockUsername = "Alice";
  const mockRoom = "general";

  // Test 1: Check if room name renders
  test("renders room name", () => {
    render(<Chat username={mockUsername} room={mockRoom} />);
    expect(screen.getByText(/room: #general/i)).toBeInTheDocument();
  });

  // Test 2: Check if input field and send button render
  test("renders message input and send button", () => {
    render(<Chat username={mockUsername} room={mockRoom} />);
    expect(screen.getByPlaceholderText(/type a message/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /send/i })).toBeInTheDocument();
  });

  // Test 3: Check if online users dropdown renders with default "All"
  test("renders online users dropdown with default 'All'", () => {
    render(<Chat username={mockUsername} room={mockRoom} />);
    const dropdown = screen.getByRole("combobox");
    expect(dropdown).toBeInTheDocument();
    expect(dropdown.value).toBe("All");
  });

  // Test 4: Check typing into input field updates value
  test("typing in input updates value", async () => {
    render(<Chat username={mockUsername} room={mockRoom} />);
    const input = screen.getByPlaceholderText(/type a message/i);
    await userEvent.type(input, "Hello World");
    expect(input.value).toBe("Hello World");
  });
});
