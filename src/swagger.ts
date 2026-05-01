import { Options } from "swagger-jsdoc"

export const swaggerOptions : Options = {
    definition: {
    openapi: '3.0.0',
    info: {
      title: 'Gazella Account Services API',
      version: '1.0.0',
      description: "Gazella Account microservice API Documentation",
    },
    components: {
        securitySchemes: {
            bearerAuth: {
                type: "http",
                scheme: "bearer",
                bearerFormat: "JWT",
            },
        },
    },
    servers: [
      {
        url: `http://localhost:${process.env["PORT"]}`,
        description: 'Development Server',
      },
    ],
  },
  // Rutas donde Swagger buscará los comentarios para generar la doc
  apis: [
    `${process.cwd()}/src/**/*.ts`
  ]
};
