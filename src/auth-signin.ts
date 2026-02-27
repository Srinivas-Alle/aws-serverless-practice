import {
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";
import { Resource } from "sst";

const cognito = new CognitoIdentityProviderClient({
  region: process.env.AWS_REGION ?? "ap-south-1",
});

const sqs = new SQSClient({});

export async function handler(event: any) {
  try {
    const body = event?.body ? JSON.parse(event.body) : {};
    const { email, password } = body;

    if (!email || !password) {
      return {
        statusCode: 400,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: "Invalid request body. Expecting email and password.",
        }),
      };
    }

    const result = await cognito.send(
      new InitiateAuthCommand({
        AuthFlow: "USER_PASSWORD_AUTH",
        ClientId: (Resource as any).UserPoolClient.id as string,
        AuthParameters: {
          USERNAME: email,
          PASSWORD: password,
        },
      })
    );

    const auth = result.AuthenticationResult;

    if (!auth?.IdToken || !auth.AccessToken) {
      return {
        statusCode: 500,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: "Failed to obtain tokens from Cognito.",
        }),
      };
    }

    const now = new Date().toISOString();

    // Fire-and-forget login event to SQS
    (async () => {
      try {
        const eventBody = {
          eventName: "login",
          userDetails: {
            email,
          },
          timestamp: now,
        };

        await sqs.send(
          new SendMessageCommand({
            QueueUrl: (Resource as any).LoginQueue.url as string,
            MessageBody: JSON.stringify(eventBody),
          })
        );
      } catch (sendError) {
        console.error("Failed to send login event to SQS", sendError);
      }
    })();

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        idToken: auth.IdToken,
        accessToken: auth.AccessToken,
        refreshToken: auth.RefreshToken,
        expiresIn: auth.ExpiresIn,
        tokenType: auth.TokenType,
      }),
    };
  } catch (error: any) {
    console.error("Error during signin", error);

    let statusCode = 400;
    let message = "Failed to sign in user.";

    if (error?.name === "NotAuthorizedException") {
      statusCode = 401;
      message = "Invalid credentials.";
    } else if (error?.name === "UserNotConfirmedException") {
      statusCode = 403;
      message = "User is not confirmed. Please confirm your account.";
    }

    return {
      statusCode,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message,
      }),
    };
  }
}

