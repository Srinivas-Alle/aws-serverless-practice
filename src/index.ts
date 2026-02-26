export async function handler(event: any) {
  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message: "Hello from SST API!",
      path: event?.rawPath ?? event?.path ?? "/",
    }),
  };
}

