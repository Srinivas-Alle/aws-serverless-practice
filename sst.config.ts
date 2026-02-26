declare const $config: (config: {
    app: (input: { stage?: string }) => unknown;
    run: () => Promise<unknown>;
  }) => unknown;

declare const sst: any;

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
            link: [usersTable],
          },
        },
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
    });

    return {
      apiUrl: api.url,
    };
  },
});
