import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { Resource } from "sst";

const dynamo = DynamoDBDocumentClient.from(new DynamoDBClient({}));

export async function handler(event: any) {
  try {
    const tableName = Resource.UsersTable.name;

    const body = event?.body ? JSON.parse(event.body) : {};
    const { userId, name, email, age } = body;

    if (!userId || !name || !email || typeof age !== "number") {
      return {
        statusCode: 400,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message:
            "Invalid request body. Expecting userId, name, email, and numeric age.",
        }),
      };
    }

    await dynamo.send(
      new PutCommand({
        TableName: tableName,
        Item: {
          userId,
          name,
          email,
          age,
        },
      })
    );

    return {
      statusCode: 201,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId,
        name,
        email,
        age,
      }),
    };
  } catch (error) {
    console.error("Error creating user", error);

    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: "Failed to create user",
      }),
    };
  }
}

