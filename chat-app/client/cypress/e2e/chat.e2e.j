describe("Chat App E2E", () => {
  const username = "Alice";
  const room = "general";

  it("User can join a room and send a message", () => {
    // Visit the chat app
    cy.visit("http://localhost:5173"); // make sure your React app is running

    // Simulate joining (if you have a join form, otherwise pass username/room props)
    cy.get("input[placeholder='Type a message...']").should("exist");

    // Type a message
    cy.get("input[placeholder='Type a message...']").type("Hello World");

    // Click send
    cy.contains("button", "Send").click();

    // Check that the message appears in chat
    cy.contains("Hello World").should("exist");

    // Check typing indicator (simulate another user)
    cy.window().then(win => {
      win.socket?.emit("typing", "Bob");
    });
    cy.contains("Bob is typing...").should("exist");
  });

  it("User can upload a file", () => {
    const fileName = "test-image.png";

    cy.get('input[type="file"]').attachFile(fileName);

    cy.contains("Send").click();

    // Check if file message appears
    cy.contains(fileName).should("exist");
  });
});
