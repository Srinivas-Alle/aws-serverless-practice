export async function handler(event: any) {
  const now = new Date().toISOString();
  console.log("Login event worker invoked", { invokedAt: now });

  const records = Array.isArray(event?.Records) ? event.Records : [];

  for (const record of records) {
    try {
      const body =
        typeof record?.body === "string" ? JSON.parse(record.body) : record?.body;

      console.log("Processed login event", {
        receivedAt: new Date().toISOString(),
        messageId: record?.messageId,
        eventName: body?.eventName,
        userDetails: body?.userDetails,
        originalTimestamp: body?.timestamp,
      });
    } catch (error) {
      console.error("Failed to process login event record", {
        error,
        record,
      });
      // Rethrow so SQS/Lambda can retry and eventually send to DLQ
      throw error;
    }
  }

  return {};
}

