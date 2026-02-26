declare const $config: (config: {
    app: (input: { stage?: string }) => unknown;
    run: () => Promise<unknown>;
  }) => unknown;

declare const sst: any;
declare const $interpolate: (
  literals: TemplateStringsArray,
  ...placeholders: unknown[]
) => unknown;

export default $config({
  app(input) {
    return {
      name: "my-first-sst-v3-app",
      home: "aws",
      providers: {
        aws: {
          region: "ap-south-1",
        },
      },
    };
  },

  async run() {
    const userPool = new sst.aws.CognitoUserPool("UserPool", {
      signInAlias: {
        email: true,
      },
    });

    const userPoolClient = userPool.addClient("UserPoolClient", {
      transform: {
        client: (args: any) => {
          args.explicitAuthFlows = [
            "ALLOW_USER_PASSWORD_AUTH",
            "ALLOW_USER_SRP_AUTH",
            "ALLOW_REFRESH_TOKEN_AUTH",
          ];
        },
      },
    });

    const usersTable = new sst.aws.Dynamo("UsersTable", {
      fields: {
        userId: "string",
      },
      primaryIndex: { hashKey: "userId" },
    });

    const api = new sst.aws.ApiGatewayV2("MyApi", {
      transform: {
        route: {
          handler: {
            link: [usersTable, userPoolClient],
          },
        },
      },
    });

    const userPoolAuthorizer = api.addAuthorizer({
      name: "userPoolJwt",
      jwt: {
        audiences: [userPoolClient.id],
        issuer: $interpolate`https://cognito-idp.ap-south-1.amazonaws.com/${userPool.id}`,
      },
    });

    api.route("GET /", {
      handler: "src/index.handler",
    });

    api.route("GET /users", {
      handler: "src/users-get.handler",
    });

    api.route("POST /users", {
      handler: "src/users-post.handler",
      auth: {
        jwt: {
          authorizer: userPoolAuthorizer.id,
        },
      },
    });

    api.route("POST /auth/signup", {
      handler: "src/auth-signup.handler",
    });

    api.route("POST /auth/signin", {
      handler: "src/auth-signin.handler",
    });

    return {
      apiUrl: api.url,
      userPoolId: userPool.id,
      userPoolClientId: userPoolClient.id,
    };
  },
});
