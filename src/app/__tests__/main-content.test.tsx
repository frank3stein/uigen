import { test, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MainContent } from "../main-content";

// Mock providers and heavy dependencies
vi.mock("@/lib/contexts/file-system-context", () => ({
  FileSystemProvider: ({ children }: any) => <>{children}</>,
  useFileSystem: vi.fn(() => ({
    fileSystem: { serialize: vi.fn(() => ({})) },
    selectedFile: null,
    setSelectedFile: vi.fn(),
    getAllFiles: vi.fn(() => new Map()),
    refreshTrigger: 0,
    handleToolCall: vi.fn(),
  })),
}));

vi.mock("@/lib/contexts/chat-context", () => ({
  ChatProvider: ({ children }: any) => <>{children}</>,
  useChat: vi.fn(() => ({
    messages: [],
    input: "",
    handleInputChange: vi.fn(),
    handleSubmit: vi.fn(),
    status: "idle",
  })),
}));

vi.mock("@/components/chat/ChatInterface", () => ({
  ChatInterface: () => <div data-testid="chat-interface" />,
}));

vi.mock("@/components/preview/PreviewFrame", () => ({
  PreviewFrame: () => <div data-testid="preview-frame" />,
}));

vi.mock("@/components/editor/FileTree", () => ({
  FileTree: () => <div data-testid="file-tree" />,
}));

vi.mock("@/components/editor/CodeEditor", () => ({
  CodeEditor: () => <div data-testid="code-editor" />,
}));

vi.mock("@/components/HeaderActions", () => ({
  HeaderActions: () => <div data-testid="header-actions" />,
}));

vi.mock("@/components/ui/resizable", () => ({
  ResizablePanelGroup: ({ children, ...props }: any) => (
    <div data-testid="resizable-panel-group" {...props}>{children}</div>
  ),
  ResizablePanel: ({ children, ...props }: any) => (
    <div data-testid="resizable-panel" {...props}>{children}</div>
  ),
  ResizableHandle: () => <div data-testid="resizable-handle" />,
}));

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  cleanup();
});

test("renders Preview and Code toggle buttons", () => {
  render(<MainContent />);
  expect(screen.getByRole("button", { name: "Preview" })).toBeDefined();
  expect(screen.getByRole("button", { name: "Code" })).toBeDefined();
});

test("shows preview frame by default", () => {
  render(<MainContent />);
  expect(screen.getByTestId("preview-frame")).toBeDefined();
  expect(screen.queryByTestId("code-editor")).toBeNull();
});

test("switches to code view when Code button is clicked", async () => {
  const user = userEvent.setup();
  render(<MainContent />);

  await user.click(screen.getByRole("button", { name: "Code" }));

  expect(screen.getByTestId("code-editor")).toBeDefined();
  expect(screen.queryByTestId("preview-frame")).toBeNull();
});

test("switches back to preview when Preview button is clicked", async () => {
  const user = userEvent.setup();
  render(<MainContent />);

  await user.click(screen.getByRole("button", { name: "Code" }));
  await user.click(screen.getByRole("button", { name: "Preview" }));

  expect(screen.getByTestId("preview-frame")).toBeDefined();
  expect(screen.queryByTestId("code-editor")).toBeNull();
});

test("clicking active toggle button multiple times does not break state", async () => {
  const user = userEvent.setup();
  render(<MainContent />);

  // Rapidly click Code button multiple times
  await user.click(screen.getByRole("button", { name: "Code" }));
  await user.click(screen.getByRole("button", { name: "Code" }));
  await user.click(screen.getByRole("button", { name: "Code" }));

  expect(screen.getByTestId("code-editor")).toBeDefined();

  // Then switch back
  await user.click(screen.getByRole("button", { name: "Preview" }));
  expect(screen.getByTestId("preview-frame")).toBeDefined();
});
