export async function handler(event: any) {
  const records = Array.isArray(event?.Records) ? event.Records : [];

  console.log("DLQ subscriber invoked", {
    invokedAt: new Date().toISOString(),
    recordCount: records.length,
  });

  for (const record of records) {
    console.error("Message in LoginDLQ", {
      loggedAt: new Date().toISOString(),
      messageId: record?.messageId,
      body: record?.body,
      attributes: record?.attributes,
    });
  }

  // Successful return means messages are removed from the DLQ
  return {};
}

