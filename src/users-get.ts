import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { Resource } from "sst";

const dynamo = DynamoDBDocumentClient.from(new DynamoDBClient({}));

export async function handler() {
  try {
    const tableName = Resource.UsersTable.name;

    const result = await dynamo.send(
      new ScanCommand({
        TableName: tableName,
      })
    );

    const items =
      result.Items?.map((item) => ({
        userId: item.userId,
        name: item.name,
        email: item.email,
        age: item.age,
      })) ?? [];

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(items),
    };
  } catch (error) {
    console.error("Error fetching users", error);

    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: "Failed to fetch users",
      }),
    };
  }
}

