import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { EventBridgeClient, PutEventsCommand } from "@aws-sdk/client-eventbridge";
import { CognitoJwtVerifier } from "aws-jwt-verify";
import { Resource } from "sst";

const dynamo = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const eventBridge = new EventBridgeClient({});

const jwtVerifier = CognitoJwtVerifier.create({
  userPoolId: Resource.UserPool.id,
  tokenUse: "id",
  clientId: Resource.UserPoolClient.id,
});

export async function handler(event: any) {
  try {
    const tableName = Resource.UsersTable.name;

    let userId: string | null =
      event?.requestContext?.authorizer?.jwt?.claims?.sub ??
      event?.requestContext?.authorizer?.jwt?.claims?.username ??
      event?.requestContext?.authorizer?.jwt?.claims?.["cognito:username"] ??
      null;

    if (!userId) {
      const authHeader =
        event?.headers?.Authorization ?? event?.headers?.authorization;
      const token = authHeader?.startsWith("Bearer ")
        ? authHeader.slice(7)
        : authHeader;
      if (token) {
        try {
          const payload = await jwtVerifier.verify(token);
          userId =
            payload.sub ??
            (payload as any).username ??
            (payload as any)["cognito:username"] ??
            null;
        } catch {
          /* token invalid */
        }
      }
    }

    if (!userId) {
      return {
        statusCode: 401,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: "Unauthorized. Missing or invalid JWT.",
        }),
      };
    }

    const body = event?.body ? JSON.parse(event.body) : {};
    const { name, email, age } = body;

    if (!name || !email || typeof age !== "number") {
      return {
        statusCode: 400,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message:
            "Invalid request body. Expecting name, email, and numeric age.",
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

    eventBridge
      .send(
        new PutEventsCommand({
          Entries: [
            {
              EventBusName: Resource.UserEventsBus.name,
              Source: "users",
              DetailType: "UserCreated",
              Detail: JSON.stringify({
                userId,
                name,
                email,
                age,
              }),
            },
          ],
        })
      )
      .catch((error) => {
        console.error("Failed to publish UserCreated event", error);
      });

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

