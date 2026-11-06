import * as Joi from 'joi';

const validateFrontendOrigins = (value: string, helpers: Joi.CustomHelpers) => {
  const origins = value.split(',').map((origin) => origin.trim());
  if (!origins.length || origins.some((origin) => !origin)) {
    return helpers.error('any.invalid');
  }

  for (const origin of origins) {
    try {
      const url = new URL(origin);
      if (
        !['http:', 'https:'].includes(url.protocol) ||
        url.origin !== origin.replace(/\/$/, '') ||
        url.username || url.password || url.search || url.hash ||
        (url.pathname !== '/' && url.pathname !== '')
      ) {
        return helpers.error('any.invalid');
      }
    } catch {
      return helpers.error('any.invalid');
    }
  }
  return origins.map((origin) => origin.replace(/\/$/, '')).join(',');
};

export const configValidationSchema = Joi.object({
  DATABASE_URL: Joi.string().required(),
  DIRECT_URL: Joi.string().required(),
  // Comma-separated exact origins for local and preview URLs; wildcards are denied.
  FRONTEND_ORIGIN: Joi.string()
    .custom(validateFrontendOrigins, 'exact CORS origins')
    .default('http://localhost:3000'),
  PORT: Joi.number().port().default(4000),
  NODE_ENV: Joi.string()
    .valid('development', 'test', 'production')
    .default('development'),
  MICROSOFT_TENANT_ID: Joi.string().allow('').optional(),
  MICROSOFT_CLIENT_ID: Joi.string().allow('').optional(),
  MICROSOFT_CLIENT_SECRET: Joi.string().allow('').optional(),
  SHAREPOINT_SITE_ID: Joi.string().allow('').optional(),
  SHAREPOINT_DRIVE_ID: Joi.string().allow('').optional(),
  SUPABASE_JWT_ISSUER: Joi.string().uri().required(),
  SUPABASE_URL: Joi.string().uri().allow('').optional(),
  SUPABASE_SECRET_KEY: Joi.string().allow('').optional(),
  EVIDENCE_BUCKET: Joi.string().default('design-evidence'),
});
