import {
  CognitoIdentityProviderClient,
  SignUpCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import { Resource } from "sst";

const cognito = new CognitoIdentityProviderClient({
  region: process.env.AWS_REGION ?? "ap-south-1",
});

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

    await cognito.send(
      new SignUpCommand({
        ClientId: Resource.UserPoolClient.id,
        Username: email,
        Password: password,
        UserAttributes: [
          {
            Name: "email",
            Value: email,
          },
        ],
      })
    );

    return {
      statusCode: 201,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message:
          "Signup successful. Please check your email to confirm your account if required.",
      }),
    };
  } catch (error: any) {
    console.error("Error during signup", error);

    const message =
      error?.name === "UsernameExistsException"
        ? "User already exists."
        : "Failed to sign up user.";

    return {
      statusCode: 400,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message,
      }),
    };
  }
}

