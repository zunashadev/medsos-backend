const openapiSpecification = {
  openapi: "3.0.3",

  info: {
    title: "Social Media API",
    version: "1.0.0",
    description:
      "REST API for a social media application built with Node.js, Express.js, Prisma, and PostgreSQL.",
  },

  servers: [
    {
      url: "http://localhost:3000",
      description: "Local development server",
    },

    {
      url: "https://medsos-backend-gray.vercel.app",
      description: "Production server",
    },
  ],

  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
    schemas: {
      ErrorResponse: {
        type: "object",

        properties: {
          message: {
            type: "string",

            example: "Post/feed tidak ditemukan.",
          },
        },
      },
    },
  },

  paths: {
    "/api/follow/suggestions": {
      get: {
        tags: ["Follow"],

        summary: "Get suggested users",

        description:
          "Get users that the authenticated user has not followed yet.",

        security: [
          {
            bearerAuth: [],
          },
        ],

        responses: {
          200: {
            description: "Suggested users retrieved successfully.",
          },

          500: {
            description: "Internal server error.",
          },
        },
      },
    },
    "/api/follow/{userId}": {
      post: {
        tags: ["Follow"],

        summary: "Follow a user",

        description: "Follow another user account.",

        security: [
          {
            bearerAuth: [],
          },
        ],

        parameters: [
          {
            name: "userId",

            in: "path",

            required: true,

            description: "ID of the user to follow",

            schema: {
              type: "integer",
              example: 10,
            },
          },
        ],

        responses: {
          201: {
            description: "User followed successfully.",
          },

          400: {
            description: "Invalid request.",
          },

          404: {
            description: "User not found.",
          },

          500: {
            description: "Internal server error.",
          },
        },
      },
      delete: {
        tags: ["Follow"],

        summary: "Unfollow a user",

        description: "Remove an existing follow relationship.",

        security: [
          {
            bearerAuth: [],
          },
        ],

        parameters: [
          {
            name: "userId",

            in: "path",

            required: true,

            description: "ID of the user to unfollow",

            schema: {
              type: "integer",

              example: 10,
            },
          },
        ],

        responses: {
          200: {
            description: "User unfollowed successfully.",
          },

          400: {
            description: "User has not been followed.",
          },

          404: {
            description: "User not found.",
          },

          500: {
            description: "Internal server error.",
          },
        },
      },
      get: {
        tags: ["Follow"],

        summary: "Check follow status",

        description:
          "Check whether the authenticated user follows the target user.",

        security: [
          {
            bearerAuth: [],
          },
        ],

        parameters: [
          {
            name: "userId",

            in: "path",

            required: true,

            description: "ID of the target user",

            schema: {
              type: "integer",

              example: 10,
            },
          },
        ],

        responses: {
          200: {
            description: "Follow status retrieved successfully.",
          },

          404: {
            description: "User not found.",
          },

          500: {
            description: "Internal server error.",
          },
        },
      },
    },
    "/api/like/{postId}": {
      post: {
        tags: ["Like"],

        summary: "Toggle like on a post",

        description:
          "Like a post if it has not been liked, or unlike it if it has already been liked.",

        security: [
          {
            bearerAuth: [],
          },
        ],

        parameters: [
          {
            name: "postId",

            in: "path",

            required: true,

            description: "ID of the post",

            schema: {
              type: "integer",

              example: 15,
            },
          },
        ],

        responses: {
          201: {
            description: "Post liked successfully.",
          },

          200: {
            description: "Post unliked successfully.",
          },

          404: {
            description: "Post not found.",
          },

          500: {
            description: "Internal server error.",
          },
        },
      },
      get: {
        tags: ["Like"],

        summary: "Check like status",

        description: "Check whether the authenticated user has liked the post.",

        security: [
          {
            bearerAuth: [],
          },
        ],

        parameters: [
          {
            name: "postId",

            in: "path",

            required: true,

            schema: {
              type: "integer",

              example: 15,
            },
          },
        ],

        responses: {
          200: {
            description: "Like status retrieved successfully.",
          },

          404: {
            description: "Post not found.",
          },

          500: {
            description: "Internal server error.",
          },
        },
      },
    },
    "/api/bookmark/{postId}": {
      post: {
        tags: ["Bookmark"],

        summary: "Toggle bookmark on a post",

        description:
          "Save a post as a bookmark or remove the existing bookmark.",

        security: [
          {
            bearerAuth: [],
          },
        ],

        parameters: [
          {
            name: "postId",

            in: "path",

            required: true,

            schema: {
              type: "integer",

              example: 15,
            },
          },
        ],

        responses: {
          200: {
            description: "Bookmark status changed successfully.",
          },

          404: {
            description: "Post not found.",
          },

          500: {
            description: "Internal server error.",
          },
        },
      },

      get: {
        tags: ["Bookmark"],

        summary: "Check bookmark status",

        security: [
          {
            bearerAuth: [],
          },
        ],

        parameters: [
          {
            name: "postId",

            in: "path",

            required: true,

            schema: {
              type: "integer",

              example: 15,
            },
          },
        ],

        responses: {
          200: {
            description: "Bookmark status retrieved successfully.",
          },

          404: {
            description: "Post not found.",
          },

          500: {
            description: "Internal server error.",
          },
        },
      },
    },
    "/api/comment": {
      post: {
        tags: ["Comment"],

        summary: "Create a comment",

        description: "Create a new comment on a post.",

        security: [
          {
            bearerAuth: [],
          },
        ],

        requestBody: {
          required: true,

          content: {
            "application/json": {
              schema: {
                type: "object",

                required: ["postId", "content"],

                properties: {
                  postId: {
                    type: "integer",

                    minimum: 1,

                    example: 15,
                  },

                  content: {
                    type: "string",

                    minLength: 1,

                    maxLength: 255,

                    example: "This is a great post!",
                  },
                },
              },
            },
          },
        },

        responses: {
          201: {
            description: "Comment created successfully.",
          },

          400: {
            description: "Invalid request body.",
          },

          404: {
            description: "Post not found.",
          },

          500: {
            description: "Internal server error.",
          },
        },
      },
    },
    "/api/comment/{id}": {
      delete: {
        tags: ["Comment"],

        summary: "Delete a comment",

        description: "Delete a comment owned by the authenticated user.",

        security: [
          {
            bearerAuth: [],
          },
        ],

        parameters: [
          {
            name: "id",

            in: "path",

            required: true,

            description: "ID of the comment",

            schema: {
              type: "integer",

              example: 25,
            },
          },
        ],

        responses: {
          200: {
            description: "Comment deleted successfully.",
          },

          400: {
            description: "Invalid request.",
          },

          403: {
            description:
              "The authenticated user is not the owner of the comment.",
          },

          404: {
            description: "Comment not found.",
          },

          500: {
            description: "Internal server error.",
          },
        },
      },
    },
    "/api/feed": {
      get: {
        tags: ["Feed"],

        summary: "Get user feed",

        description: "Retrieve posts for the authenticated user's feed.",

        security: [
          {
            bearerAuth: [],
          },
        ],

        parameters: [
          {
            name: "page",

            in: "query",

            required: false,

            schema: {
              type: "integer",

              minimum: 1,

              default: 1,
            },
          },

          {
            name: "limit",

            in: "query",

            required: false,

            schema: {
              type: "integer",

              minimum: 1,

              default: 10,
            },
          },
        ],

        responses: {
          200: {
            description: "Feed retrieved successfully.",
          },

          500: {
            description: "Internal server error.",
          },
        },
      },
    },
    "/api/auth/login": {
      post: {
        tags: ["Authentication"],

        summary: "Login user",

        description: "Authenticate a user and return an authentication token.",

        requestBody: {
          required: true,

          content: {
            "application/json": {
              schema: {
                type: "object",

                required: ["username", "password"],

                properties: {
                  username: {
                    type: "string",

                    example: "john",
                  },

                  password: {
                    type: "string",

                    format: "password",

                    example: "password123",
                  },
                },
              },
            },
          },
        },

        responses: {
          200: {
            description: "Login successful.",
          },

          400: {
            description: "Invalid credentials or request.",
          },

          500: {
            description: "Internal server error.",
          },
        },
      },
    },
  },
};

export default openapiSpecification;
