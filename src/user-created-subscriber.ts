export async function handler(event: any) {
  console.log(
    "UserCreated event received:",
    JSON.stringify(event, null, 2)
  );

  try {
    const detail =
      typeof event?.detail === "string"
        ? JSON.parse(event.detail)
        : event?.detail ?? {};

    const { userId, name, email, age } = detail;

    console.log("User created:", {
      userId,
      name,
      email,
      age,
    });
  } catch (error) {
    console.error("Failed to process UserCreated event", error);
  }
}

