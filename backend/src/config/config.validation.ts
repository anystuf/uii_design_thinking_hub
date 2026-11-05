import * as Joi from 'joi';

export const configValidationSchema = Joi.object({
  DATABASE_URL: Joi.string().required(),
  DIRECT_URL: Joi.string().required(),
  FRONTEND_ORIGIN: Joi.string().uri().default('http://localhost:3000'),
  PORT: Joi.number().port().default(4000),
  NODE_ENV: Joi.string()
    .valid('development', 'test', 'production')
    .default('development'),
  MICROSOFT_TENANT_ID: Joi.string().allow('').optional(),
  MICROSOFT_CLIENT_ID: Joi.string().allow('').optional(),
  MICROSOFT_CLIENT_SECRET: Joi.string().allow('').optional(),
  SHAREPOINT_SITE_ID: Joi.string().allow('').optional(),
  SHAREPOINT_DRIVE_ID: Joi.string().allow('').optional(),
  // Configure a Supabase project with asymmetric signing keys (RS256/ES256).
  SUPABASE_JWT_ISSUER: Joi.string().uri().required(),
});

