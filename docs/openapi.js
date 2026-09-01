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
            description: "Cannot follow your own account or invalid request parameter.",
          },

          404: {
            description: "User not found.",
          },

          409: {
            description: "User has already been followed.",
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
            description: "Validation error (invalid request parameter).",
          },

          404: {
            description: "User not found.",
          },

          409: {
            description: "User has not been followed.",
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

          400: {
            description: "Validation error (invalid request parameter).",
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

          400: {
            description: "Validation error (invalid request parameter).",
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

            description: "ID of the post to check like status",

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

          400: {
            description: "Validation error (invalid request parameter).",
          },

          404: {
            description: "Post not found.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
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

            description: "ID of the post to bookmark or unbookmark",

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

          400: {
            description: "Validation error (invalid request parameter).",
          },

          404: {
            description: "Post not found.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },

          500: {
            description: "Internal server error.",
          },
        },
      },

      get: {
        tags: ["Bookmark"],

        summary: "Check bookmark status",

        description:
          "Check whether the authenticated user has bookmarked the post.",

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

            description: "ID of the post to check bookmark status",

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

          400: {
            description: "Validation error (invalid request parameter).",
          },

          404: {
            description: "Post not found.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
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
    "/api/comment/{commentId}": {
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
            name: "commentId",

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

        description:
          "Retrieve paginated posts from users the authenticated user follows, including their own posts.",

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

            description: "Page number (starts from 1)",

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

            description: "Number of posts per page",

            schema: {
              type: "integer",

              minimum: 1,

              maximum: 50,

              default: 3,
            },
          },
        ],

        responses: {
          200: {
            description: "Feed retrieved successfully.",
          },

          400: {
            description: "Validation error (invalid pagination parameters).",
          },

          500: {
            description: "Internal server error.",
          },
        },
      },

      post: {
        tags: ["Feed"],

        summary: "Create a new post",

        description:
          "Create a new post with a caption and an image. The image is uploaded to Cloudinary.",

        security: [
          {
            bearerAuth: [],
          },
        ],

        requestBody: {
          required: true,

          content: {
            "multipart/form-data": {
              schema: {
                type: "object",

                required: ["caption", "image"],

                properties: {
                  caption: {
                    type: "string",
                    minLength: 1,
                    maxLength: 500,
                    example: "Beautiful sunset!",
                  },

                  image: {
                    type: "string",
                    format: "binary",
                    description: "Image file to upload",
                  },
                },
              },
            },
          },
        },

        responses: {
          201: {
            description: "Post created successfully.",
          },

          400: {
            description: "Caption or image is missing.",
          },

          500: {
            description: "Internal server error.",
          },
        },
      },
    },

    "/api/feed/{id}": {
      get: {
        tags: ["Feed"],

        summary: "Get post detail",

        description:
          "Retrieve detail of a specific post including its comments.",

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

            description: "ID of the post",

            schema: {
              type: "integer",
              example: 5,
            },
          },
        ],

        responses: {
          200: {
            description: "Post detail retrieved successfully.",
          },

          400: {
            description: "Validation error (invalid request parameter).",
          },

          404: {
            description: "Post not found.",
          },

          500: {
            description: "Internal server error.",
          },
        },
      },

      delete: {
        tags: ["Feed"],

        summary: "Delete a post",

        description:
          "Delete a post owned by the authenticated user. The associated image will also be deleted from Cloudinary.",

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

            description: "ID of the post to delete",

            schema: {
              type: "integer",
              example: 5,
            },
          },
        ],

        responses: {
          200: {
            description: "Post deleted successfully.",
          },

          400: {
            description: "Validation error (invalid request parameter).",
          },

          403: {
            description: "Authenticated user is not the owner of the post.",
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
    "/api/auth/register": {
      post: {
        tags: ["Authentication"],

        summary: "Register user",

        description:
          "Register a new user account and return an authentication token.",

        requestBody: {
          required: true,

          content: {
            "application/json": {
              schema: {
                type: "object",

                required: ["fullname", "username", "email", "password"],

                properties: {
                  fullname: {
                    type: "string",
                    minLength: 6,
                    maxLength: 100,
                    example: "John Doe",
                  },

                  username: {
                    type: "string",
                    minLength: 6,
                    maxLength: 30,
                    example: "johndoe",
                  },

                  email: {
                    type: "string",
                    format: "email",
                    example: "john@example.com",
                  },

                  password: {
                    type: "string",
                    format: "password",
                    minLength: 8,
                    example: "password123",
                  },
                },
              },
            },
          },
        },

        responses: {
          201: {
            description: "User registered successfully.",
          },

          400: {
            description: "Validation error (invalid request body).",
          },

          409: {
            description: "Email or username already exists.",
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

        description:
          "Authenticate a user using email and password, then return an authentication token.",

        requestBody: {
          required: true,

          content: {
            "application/json": {
              schema: {
                type: "object",

                required: ["email", "password"],

                properties: {
                  email: {
                    type: "string",
                    format: "email",
                    example: "john@example.com",
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
            description: "Validation error (invalid request body).",
          },

          401: {
            description: "Email not registered or incorrect password.",
          },

          500: {
            description: "Internal server error.",
          },
        },
      },
    },

    "/api/auth/me": {
      get: {
        tags: ["Authentication"],

        summary: "Get authenticated user",

        description:
          "Retrieve the profile data of the currently authenticated user based on the Bearer token.",

        security: [
          {
            bearerAuth: [],
          },
        ],

        responses: {
          200: {
            description: "Authenticated user data retrieved successfully.",
          },

          401: {
            description: "Unauthorized. Token is missing or invalid.",
          },

          500: {
            description: "Internal server error.",
          },
        },
      },
    },
    "/api/user/search": {
      get: {
        tags: ["User"],

        summary: "Search users by username",

        description:
          "Search for users whose username matches the given query string (case-insensitive, partial match).",

        parameters: [
          {
            name: "username",

            in: "query",

            required: true,

            description: "Partial or full username to search for",

            schema: {
              type: "string",
              example: "john",
            },
          },
        ],

        responses: {
          200: {
            description: "Users found successfully.",
          },

          400: {
            description: "Validation error (invalid query parameter).",
          },

          404: {
            description: "No users found with the given username.",
          },

          500: {
            description: "Internal server error.",
          },
        },
      },
    },

    "/api/user/{username}": {
      get: {
        tags: ["User"],

        summary: "Get user by username",

        description:
          "Retrieve a user's profile data, posts, and bookmarks by their username.",

        parameters: [
          {
            name: "username",

            in: "path",

            required: true,

            description: "The username of the target user",

            schema: {
              type: "string",
              example: "johndoe",
            },
          },
        ],

        responses: {
          200: {
            description: "User profile retrieved successfully.",
          },

          400: {
            description: "Validation error (invalid username parameter).",
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

    "/api/user/update-user": {
      put: {
        tags: ["User"],

        summary: "Update user profile",

        description:
          "Update the authenticated user's fullname, username, and bio.",

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

                required: ["fullname", "username", "bio"],

                properties: {
                  fullname: {
                    type: "string",
                    minLength: 6,
                    maxLength: 100,
                    example: "John Doe",
                  },

                  username: {
                    type: "string",
                    minLength: 6,
                    maxLength: 30,
                    example: "johndoe",
                  },

                  bio: {
                    type: "string",
                    minLength: 10,
                    maxLength: 500,
                    example: "Software engineer who loves coding.",
                  },
                },
              },
            },
          },
        },

        responses: {
          200: {
            description: "User profile updated successfully.",
          },

          400: {
            description: "Validation error (invalid request body).",
          },

          409: {
            description: "Username already taken.",
          },

          500: {
            description: "Internal server error.",
          },
        },
      },
    },

    "/api/user/update-photo-profile": {
      put: {
        tags: ["User"],

        summary: "Update profile photo",

        description:
          "Upload a new profile photo for the authenticated user. The old photo will be deleted from Cloudinary automatically.",

        security: [
          {
            bearerAuth: [],
          },
        ],

        requestBody: {
          required: true,

          content: {
            "multipart/form-data": {
              schema: {
                type: "object",

                required: ["image"],

                properties: {
                  image: {
                    type: "string",
                    format: "binary",
                    description: "Profile image file to upload",
                  },
                },
              },
            },
          },
        },

        responses: {
          200: {
            description: "Profile photo updated successfully.",
          },

          400: {
            description: "No image file provided.",
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

    "/api/user/{userId}": {
      delete: {
        tags: ["User"],

        summary: "Delete a user (Admin only)",

        description:
          "Delete a user account and all associated data (posts, comments, likes, bookmarks, follows). Only accessible by users with the ADMIN role. Associated images will also be deleted from Cloudinary.",

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

            description: "ID of the user to delete",

            schema: {
              type: "integer",
              example: 10,
            },
          },
        ],

        responses: {
          200: {
            description: "User deleted successfully.",
          },

          400: {
            description: "Validation error (invalid request parameter).",
          },

          403: {
            description: "Forbidden. Only ADMIN users can access this endpoint.",
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
  },
};

export default openapiSpecification;
