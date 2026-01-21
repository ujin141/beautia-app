declare module 'swagger-jsdoc' {
  interface Options {
    definition: {
      openapi?: string;
      info: {
        title: string;
        version: string;
        description?: string;
        contact?: {
          name?: string;
          email?: string;
          url?: string;
        };
      };
      servers?: Array<{
        url: string;
        description?: string;
      }>;
      components?: any;
      tags?: Array<{
        name: string;
        description?: string;
      }>;
    };
    apis: string[];
  }

  function swaggerJsdoc(options: Options): any;
  export = swaggerJsdoc;
  export { Options };
}
